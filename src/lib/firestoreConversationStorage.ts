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
import { retryWithBackoff, isRetryableFirestoreError, RetryConfig } from '@/lib/utils';

// Firestore collection names
const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

// Default retry configuration for Firestore operations
const firestoreRetryConfig: RetryConfig = {
  maxRetries: 3, // Standard number of retries for network operations
  initialDelayMs: 500, // Longer initial delay for network issues
  shouldRetry: isRetryableFirestoreError,
  logRetries: true,
};

// Helper functions for data conversion (assumed to be the same, omitted for brevity)
// toDate, toStorableConversation, fromStorableConversation etc. from previous versions

export const getAllConversations = async (userId: string): Promise<Conversation[]> => {
  return retryWithBackoff(async () => {
    if (!userId) {
      console.error("getAllConversations: userId is required.");
      return [];
    }
    try {
      const conversationsRef = collection(firestore, CONVERSATIONS_COLLECTION);
      const q = query(conversationsRef, where("userId", "==", userId), orderBy("updatedAt", "desc"));

      const querySnapshot = await getDocs(q);
      const conversations: Conversation[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        conversations.push({
          id: docSnap.id,
          title: data.title,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
          messages: [],
          agentId: data.agentId,
          userId: data.userId,
          summary: data.summary,
        });
      });
      return conversations;
    } catch (error) {
      console.error("Error fetching all conversations from Firestore (attempt):", error);
      throw error;
    }
  }, firestoreRetryConfig);
};

export const getConversationById = async (conversationId: string): Promise<Conversation | undefined> => {
  return retryWithBackoff(async () => {
    if (!conversationId) {
      console.error("getConversationById: conversationId is required.");
      return undefined;
    }
    try {
      const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
      const conversationSnap = await getDoc(conversationDocRef);

      if (!conversationSnap.exists()) {
        console.warn(`Conversation with ID ${conversationId} not found.`);
        return undefined;
      }

      const conversationData = conversationSnap.data();
      const messagesRef = collection(conversationDocRef, MESSAGES_SUBCOLLECTION);
      const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));
      const messagesSnapshot = await getDocs(messagesQuery);

      const messages: Message[] = [];
      messagesSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        messages.push({
          id: docSnap.id,
          sender: data.sender,
          text: data.text,
          content: data.text || '',
          imageUrl: data.imageUrl,
          fileName: data.fileName,
          timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
          isError: data.isError || false,
          isUser: data.sender === 'user',
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
        summary: conversationData.summary,
      };
    } catch (error) {
      console.error(`Error fetching conversation ${conversationId} from Firestore (attempt):`, error);
      throw error;
    }
  }, firestoreRetryConfig);
};

export const createNewConversation = async (userId: string, title?: string, agentId?: string): Promise<Conversation> => {
  return retryWithBackoff(async () => {
    if (!userId) {
      console.error("createNewConversation: userId is required.");
      throw new Error("createNewConversation: userId is required.");
    }
    try {
      const newConversationData = {
        userId: userId,
        agentId: agentId || null,
        title: title || `Chat ${new Date().toLocaleString()}`,
        summary: `Chat summary for conversation started on ${new Date().toLocaleDateString()}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(firestore, CONVERSATIONS_COLLECTION), newConversationData);

      const now = new Date();
      return {
        id: docRef.id,
        title: newConversationData.title,
        summary: newConversationData.summary,
        createdAt: now,
        updatedAt: now,
        messages: [],
        agentId: newConversationData.agentId,
        userId: newConversationData.userId,
      };
    } catch (error) {
      console.error("Error creating new conversation in Firestore (attempt):", error);
      throw error;
    }
  }, firestoreRetryConfig);
};

export const addMessageToConversation = async (
  conversationId: string, 
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<Message> => {
  return retryWithBackoff(async () => {
    if (!conversationId) {
      console.error("addMessageToConversation: conversationId is required.");
      throw new Error("addMessageToConversation: conversationId is required.");
    }
    try {
      const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
      // First, check if conversation exists to avoid orphaned messages if that's a concern.
      // const convoSnap = await getDoc(conversationDocRef);
      // if (!convoSnap.exists()) {
      //   throw new Error(`Conversation ${conversationId} not found. Cannot add message.`);
      // }

      const messagesRef = collection(conversationDocRef, MESSAGES_SUBCOLLECTION);

      const messageData = { ...message, timestamp: serverTimestamp() };
      const messageDocRef = await addDoc(messagesRef, messageData);

      await updateDoc(conversationDocRef, { updatedAt: serverTimestamp() });

      return {
          id: messageDocRef.id,
          ...message,
          timestamp: new Date()
      } as Message;
    } catch (error) {
      console.error(`Error adding message to conversation ${conversationId} in Firestore (attempt):`, error);
      throw error;
    }
  }, firestoreRetryConfig);
};

export const renameConversationInStorage = async (conversationId: string, newTitle: string): Promise<void> => {
  return retryWithBackoff(async () => {
    if (!conversationId || !newTitle) {
      console.error("renameConversationInStorage: conversationId and newTitle are required.");
      throw new Error("Conversation ID and new title are required.");
    }
    const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    try {
      await updateDoc(conversationRef, {
        title: newTitle,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error renaming conversation ${conversationId} in Firestore (attempt):`, error);
      throw error;
    }
  }, firestoreRetryConfig);
};

export const deleteConversationFromStorage = async (conversationId: string): Promise<void> => {
  return retryWithBackoff(async () => {
    if (!conversationId) {
      console.error("deleteConversationFromStorage: conversationId is required.");
      throw new Error("Conversation ID is required.");
    }
    const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    try {
      const messagesRef = collection(conversationRef, MESSAGES_SUBCOLLECTION);
      const messagesSnapshot = await getDocs(messagesRef);

      if (!messagesSnapshot.empty) {
        const batch = writeBatch(firestore);
        messagesSnapshot.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
        console.log(`Deleted ${messagesSnapshot.size} messages from conversation ${conversationId}.`);
      }

      await deleteDoc(conversationRef);
      console.log(`Conversation ${conversationId} deleted successfully.`);
    } catch (error) {
      console.error(`Error deleting conversation ${conversationId} from Firestore (attempt):`, error);
      throw error;
    }
  }, firestoreRetryConfig);
};

export const finalizeMessageInConversation = async (
  conversationId: string,
  messageId: string,
  fullContent: string,
  isError: boolean = false
): Promise<void> => {
  return retryWithBackoff(async () => {
    if (!conversationId || !messageId) {
      console.error("finalizeMessageInConversation: conversationId and messageId are required.");
      throw new Error("Conversation ID and Message ID are required.");
    }
    try {
      const messageRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId);
      await updateDoc(messageRef, {
        text: fullContent,
        content: fullContent,
        isError: isError,
        isLoading: false,
        timestamp: serverTimestamp(),
      });

      const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
      await updateDoc(conversationDocRef, {
          updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error finalizing message ${messageId} in conversation ${conversationId} (attempt):`, error);
      throw error;
    }
  }, firestoreRetryConfig);
};

export async function deleteMessageFromConversation(
  conversationId: string,
  messageId: string
): Promise<void> {
  return retryWithBackoff(async () => {
    if (!conversationId || !messageId) {
      console.error("deleteMessageFromConversation: conversationId and messageId are required.");
      throw new Error("Conversation ID and Message ID are required.");
    }
    try {
      const messageRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId);
      await deleteDoc(messageRef);
      const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
      await updateDoc(conversationDocRef, {
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Error deleting message ${messageId} from conversation ${conversationId} (attempt):`, error);
      throw error;
    }
  }, firestoreRetryConfig);
}

export async function updateMessageFeedback(
  conversationId: string,
  messageId: string,
  feedback: 'liked' | 'disliked' | null
): Promise<void> {
  return retryWithBackoff(async () => {
    if (!conversationId || !messageId) {
      console.error("updateMessageFeedback: conversationId and messageId are required.");
      throw new Error("Conversation ID and Message ID are required.");
    }
    try {
      const messageRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId);
      await updateDoc(messageRef, {
        feedback: feedback,
      });
      const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
      await updateDoc(conversationDocRef, {
          updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Error updating feedback for message ${messageId} in conversation ${conversationId} (attempt):`, error);
      throw error;
    }
  }, firestoreRetryConfig);
}
