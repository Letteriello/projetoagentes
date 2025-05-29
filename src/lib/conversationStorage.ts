import { Conversation, Message } from '@/types/chat';
import { firestore } from '@/lib/firebaseClient';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

// Placeholder for userId - replace with actual user management later
// This should ideally come from an auth context or similar
const PLACEHOLDER_USER_ID = "defaultUser"; 

// Firestore collection names
const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

export const getAllConversations = async (): Promise<Conversation[]> => {
  try {
    // TODO: Replace PLACEHOLDER_USER_ID with actual authenticated user ID
    const conversationsRef = collection(firestore, CONVERSATIONS_COLLECTION);
    const q = query(conversationsRef, where("userId", "==", PLACEHOLDER_USER_ID), orderBy("updatedAt", "desc"));
    
    const querySnapshot = await getDocs(q);
    const conversations: Conversation[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        title: data.title,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
        // Messages will be fetched on demand by getConversationById
        messages: [], 
        // Include other conversation metadata if stored at the top level
        agentId: data.agentId,
        userId: data.userId,
      });
    });
    return conversations;
  } catch (error) {
    console.error("Error fetching all conversations from Firestore:", error);
    return []; // Return empty array on error
  }
};

export const getConversationById = async (id: string): Promise<Conversation | undefined> => {
  try {
    const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, id);
    const conversationSnap = await getDoc(conversationDocRef);

    if (!conversationSnap.exists()) {
      console.warn(`Conversation with ID ${id} not found.`);
      return undefined;
    }

    // TODO: Ensure the fetched conversation belongs to the current user using security rules
    // or by adding a userId check here if rules are not fully implemented/relied upon.

    const conversationData = conversationSnap.data();
    const messagesRef = collection(conversationDocRef, MESSAGES_SUBCOLLECTION);
    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));
    const messagesSnapshot = await getDocs(messagesQuery);

    const messages: Message[] = [];
    messagesSnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        sender: data.sender,
        text: data.text,
        imageUrl: data.imageUrl,
        fileName: data.fileName,
        timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
        isError: data.isError || false,
        // Map other message fields as needed
        isUser: data.sender === 'user', // Example of deriving a UI field
        content: data.text || '', // Assuming content is primarily text for Message type
        isLoading: data.isLoading || false,
      });
    });

    return {
      id: conversationSnap.id,
      title: conversationData.title,
      createdAt: (conversationData.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (conversationData.updatedAt as Timestamp)?.toDate() || new Date(),
      messages,
      agentId: conversationData.agentId,
      userId: conversationData.userId,
    };
  } catch (error) {
    console.error(`Error fetching conversation ${id} from Firestore:`, error);
    return undefined;
  }
};

export const createNewConversation = async (title?: string, agentId?: string): Promise<Conversation | null> => {
  try {
    const newConversationData = {
      userId: PLACEHOLDER_USER_ID, // TODO: Replace with actual authenticated user ID
      agentId: agentId || null,
      title: title || `Chat ${new Date().toLocaleString()}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // messages will be a subcollection, so not stored in the main doc
    };
    const docRef = await addDoc(collection(firestore, CONVERSATIONS_COLLECTION), newConversationData);
    
    // Construct the Conversation object to return, simulating server timestamps locally
    const now = new Date();
    return {
      id: docRef.id,
      title: newConversationData.title,
      createdAt: now, 
      updatedAt: now,
      messages: [],
      agentId: newConversationData.agentId,
      userId: newConversationData.userId,
    };
  } catch (error) {
    console.error("Error creating new conversation in Firestore:", error);
    return null;
  }
};

export const addMessageToConversation = async (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<Message | null> => {
  try {
    const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    const messagesRef = collection(conversationDocRef, MESSAGES_SUBCOLLECTION);
    
    const messageData = {
      ...message,
      timestamp: serverTimestamp(),
    };
    const messageDocRef = await addDoc(messagesRef, messageData);

    // Update the conversation's updatedAt timestamp
    await updateDoc(conversationDocRef, {
      updatedAt: serverTimestamp(),
    });
    
    return { 
        id: messageDocRef.id, 
        ...message, 
        timestamp: new Date() // Optimistic timestamp
    } as Message;
  } catch (error) {
    console.error(`Error adding message to conversation ${conversationId} in Firestore:`, error);
    return null;
  }
};

// Refactored to finalize a message, typically after streaming.
// For streaming, client would accumulate chunks, then call this once.
export const finalizeMessageInConversation = async (
  conversationId: string, 
  messageId: string, // ID of the message document to update
  fullContent: string, 
  isError: boolean = false
): Promise<void> => {
  try {
    const messageRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId);
    await updateDoc(messageRef, {
      text: fullContent,
      content: fullContent, // Ensure 'content' is also updated if used
      isError: isError,
      isLoading: false, // Mark as no longer loading/streaming
      timestamp: serverTimestamp(), // Update timestamp to reflect finalization
    });

    // Update the conversation's updatedAt timestamp
    const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationDocRef, {
        updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error finalizing message ${messageId} in conversation ${conversationId}:`, error);
    // Handle error as appropriate for your application
  }
};


export const renameConversationInStorage = async (id: string, newTitle: string): Promise<Conversation | undefined> => {
  const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, id);
  try {
    // TODO: Add security rule to ensure only conversation owner can rename
    await updateDoc(conversationRef, {
      title: newTitle,
      updatedAt: serverTimestamp(),
    });
    // Optionally, fetch and return the updated conversation, or update local state if managing it
    const updatedSnap = await getDoc(conversationRef);
    if (updatedSnap.exists()) {
        const data = updatedSnap.data();
        return {
            id: updatedSnap.id,
            ...data,
            createdAt: (data.createdAt as Timestamp).toDate(),
            updatedAt: (data.updatedAt as Timestamp).toDate(),
            messages: [] // Messages not typically returned on rename
        } as Conversation;
    }
    return undefined;
  } catch (error) {
    console.error(`Error renaming conversation ${id} in Firestore:`, error);
    return undefined;
  }
};

export const deleteConversationFromStorage = async (id: string): Promise<void> => {
  const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, id);
  try {
    // TODO: Add security rule to ensure only conversation owner can delete
    // First, delete all messages in the subcollection (if any)
    const messagesRef = collection(conversationRef, MESSAGES_SUBCOLLECTION);
    const messagesSnapshot = await getDocs(messagesRef);
    const batch = writeBatch(firestore);
    messagesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Then, delete the conversation document itself
    await deleteDoc(conversationRef);
    console.log(`Conversation ${id} and its messages deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting conversation ${id} from Firestore:`, error);
    // Re-throw or handle as needed
    throw error;
  }
};

/*
Firestore Security Rules (Conceptual - to be added/updated in firestore.rules):

service cloud.firestore {
  match /databases/{database}/documents {
    // Conversations Collection
    match /conversations/{conversationId} {
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;

      // Messages Sub-collection
      match /messages/{messageId} {
        allow read: if request.auth != null && get(/databases/$(database)/documents/conversations/$(conversationId)).data.userId == request.auth.uid;
        allow create: if request.auth != null && get(/databases/$(database)/documents/conversations/$(conversationId)).data.userId == request.auth.uid;
        // Update might be needed for finalizing streamed messages by the agent/server
        allow update: if request.auth != null; // Or more specific server-side/agent role check
        // Deletion of individual messages might be restricted
        allow delete: if false; // Or allow only for owner/admin
      }
    }
  }
}
*/
