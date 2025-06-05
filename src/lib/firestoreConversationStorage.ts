// src/lib/firestoreConversationStorage.ts
import { v4 as uuidv4 } from 'uuid';
import { Conversation, CoreChatMessage } from '@/types/chat-core'; // Updated path and Message to CoreChatMessage
import { firestore } from '@/lib/firebaseClient'; // Assuming firebaseClient is the correct path for client-side Firestore
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp, // This is fine for server-side usage, but this is a client-side service.
                  // For client-side, Timestamp.now() or new Date() which gets converted by Firestore is typical.
                  // Using new Date() for client consistency, Firestore handles conversion.
  query,
  where,
  orderBy,
  Timestamp, // Firestore Timestamp for type checking
  writeBatch,
} from 'firebase/firestore';
import { retryWithBackoff, isRetryableFirestoreError, RetryConfig } from '@/lib/utils';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

const firestoreRetryConfig: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 500,
  shouldRetry: isRetryableFirestoreError,
  logRetries: true,
};

// Helper to convert Firestore Timestamp to Date, then to ISO string if needed by CoreChatMessage
// CoreChatMessage timestamp is Date, so direct toDate() is fine.
const fromTimestamp = (timestamp: Timestamp | Date | string | undefined): Date => {
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  return new Date(); // Fallback
};

// Conversion for Conversation (dates to Date objects)
const fromDbConversation = (docSnap: firebase.firestore.DocumentSnapshot<firebase.firestore.DocumentData>): Conversation => {
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    title: data.title,
    createdAt: fromTimestamp(data.createdAt),
    updatedAt: fromTimestamp(data.updatedAt),
    messages: [], // Messages loaded separately
    agentId: data.agentId,
    userId: data.userId,
    summary: data.summary,
  };
};

// Conversion for Messages (Firestore data to CoreChatMessage)
const fromDbMessage = (docSnap: firebase.firestore.DocumentSnapshot<firebase.firestore.DocumentData>): CoreChatMessage => {
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    role: data.role || (data.isUser ? 'user' : 'assistant'), // Handle old isUser field
    content: data.content || data.text || '', // Handle old text field
    timestamp: fromTimestamp(data.timestamp),
    // Optional fields from CoreChatMessage
    name: data.name,
    isLoading: data.isLoading,
    isError: data.isError,
    retrievedContext: data.retrievedContext,
    imageUrl: data.imageUrl,
    fileName: data.fileName,
    fileDataUri: data.fileDataUri,
    isStreaming: data.isStreaming,
    status: data.status,
    toolCall: data.toolCall,
    toolResponse: data.toolResponse,
    feedback: data.feedback,
    appliedUserChatConfig: data.appliedUserChatConfig,
    appliedTestRunConfig: data.appliedTestRunConfig,
    conversationId: data.conversationId,
  };
};

// Data to be stored for a message, aligning with CoreChatMessage but using serverTimestamp
const toDbMessageData = (message: Omit<CoreChatMessage, 'id' | 'timestamp' | 'conversationId'>, conversationId: string) => {
  return {
    ...message,
    timestamp: serverTimestamp(), // Use serverTimestamp for writing
    conversationId, // Ensure this is part of the message data for querying
  };
};


async function updateConversationTimestampInternal(transaction: firebase.firestore.Transaction, conversationId: string): Promise<void> {
  const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
  // In Firestore transactions, reads must come before writes.
  // We don't need to read the convo just to update timestamp if using serverTimestamp().
  transaction.update(conversationRef, { updatedAt: serverTimestamp() });
}


export async function getAllConversations(userId: string): Promise<Conversation[]> {
  return retryWithBackoff(async () => {
    if (!userId) throw new Error("getAllConversations: userId is required.");
    const conversationsRef = collection(firestore, CONVERSATIONS_COLLECTION);
    const q = query(conversationsRef, where("userId", "==", userId), orderBy("updatedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(fromDbConversation);
  }, firestoreRetryConfig);
}

export async function getConversationById(conversationId: string): Promise<Conversation | undefined> {
  return retryWithBackoff(async () => {
    if (!conversationId) throw new Error("getConversationById: conversationId is required.");
    const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    const conversationSnap = await getDoc(conversationDocRef);
    if (!conversationSnap.exists()) return undefined;

    const conversation = fromDbConversation(conversationSnap);
    const messagesRef = collection(conversationDocRef, MESSAGES_SUBCOLLECTION);
    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));
    const messagesSnapshot = await getDocs(messagesQuery);
    conversation.messages = messagesSnapshot.docs.map(fromDbMessage);
    return conversation;
  }, firestoreRetryConfig);
}

export async function createNewConversation(userId: string, title?: string, agentId?: string): Promise<Conversation> {
  return retryWithBackoff(async () => {
    if (!userId) throw new Error("createNewConversation: userId is required.");
    const now = new Date(); // For immediate local object, serverTimestamp for DB write
    const newConversationData = {
      userId,
      agentId: agentId || null,
      title: title || `Chat ${now.toLocaleString()}`,
      summary: `Chat summary for conversation started on ${now.toLocaleDateString()}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(firestore, CONVERSATIONS_COLLECTION), newConversationData);
    return {
      id: docRef.id,
      title: newConversationData.title,
      summary: newConversationData.summary,
      createdAt: now, // Use local Date for immediate return
      updatedAt: now, // Use local Date
      messages: [],
      agentId: newConversationData.agentId,
      userId: newConversationData.userId,
    };
  }, firestoreRetryConfig);
}

export async function addMessageToConversation(
  conversationId: string,
  message: Omit<CoreChatMessage, 'id' | 'timestamp' | 'conversationId'> // Param uses CoreChatMessage
): Promise<CoreChatMessage> {
  return retryWithBackoff(async () => {
    if (!conversationId) throw new Error("addMessageToConversation: conversationId is required.");

    const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    const messagesRef = collection(conversationDocRef, MESSAGES_SUBCOLLECTION);

    const messageDataForDb = toDbMessageData(message, conversationId);
    const messageDocRef = await addDoc(messagesRef, messageDataForDb);
    await updateDoc(conversationDocRef, { updatedAt: serverTimestamp() });

    return {
      ...message,
      id: messageDocRef.id,
      timestamp: new Date(), // Return with local Date for immediate use
      conversationId: conversationId,
    };
  }, firestoreRetryConfig);
}

export async function renameConversationInStorage(conversationId: string, newTitle: string): Promise<void> {
  return retryWithBackoff(async () => {
    if (!conversationId || !newTitle) throw new Error("Conversation ID and new title are required.");
    const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationRef, { title: newTitle, updatedAt: serverTimestamp() });
  }, firestoreRetryConfig);
}

export async function deleteConversationFromStorage(conversationId: string): Promise<void> {
  return retryWithBackoff(async () => {
    if (!conversationId) throw new Error("Conversation ID is required.");
    const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    const messagesRef = collection(conversationRef, MESSAGES_SUBCOLLECTION);
    const messagesSnapshot = await getDocs(messagesRef);

    const batch = writeBatch(firestore);
    messagesSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
    batch.delete(conversationRef);
    await batch.commit();
  }, firestoreRetryConfig);
}

export async function finalizeMessageInConversation(
  conversationId: string,
  messageId: string,
  fullContent: string,
  isError: boolean = false
): Promise<void> {
  return retryWithBackoff(async () => {
    if (!conversationId || !messageId) throw new Error("Conversation ID and Message ID are required.");
    const messageRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId);
    await updateDoc(messageRef, {
      content: fullContent, // Use content
      isError: isError,
      isLoading: false, // Assuming finalization means loading is done
      timestamp: serverTimestamp(), // Update timestamp on finalization
    });
    const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationDocRef, { updatedAt: serverTimestamp() });
  }, firestoreRetryConfig);
}

export async function deleteMessageFromConversation(
  conversationId: string,
  messageId: string
): Promise<void> {
  return retryWithBackoff(async () => {
    if (!conversationId || !messageId) throw new Error("Conversation ID and Message ID are required.");
    const messageRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId);
    await deleteDoc(messageRef);
    const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationDocRef, { updatedAt: serverTimestamp() });
  }, firestoreRetryConfig);
}

export async function updateMessageFeedback(
  conversationId: string,
  messageId: string,
  feedback: 'liked' | 'disliked' | null
): Promise<void> {
  return retryWithBackoff(async () => {
    if (!conversationId || !messageId) throw new Error("Conversation ID and Message ID are required.");
    const messageRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId);
    await updateDoc(messageRef, { feedback: feedback });
    const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationDocRef, { updatedAt: serverTimestamp() });
  }, firestoreRetryConfig);
}
