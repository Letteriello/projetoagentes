import { Conversation, Message } from '@/types/chat'; // Adjust path if necessary
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
  limit
} from 'firebase/firestore';

// Firestore collection names
const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

/**
 * Fetches metadata for all conversations belonging to a specific user.
 * Does not fetch messages for performance reasons.
 * @param userId The ID of the user whose conversations are to be fetched.
 * @returns A promise that resolves to an array of Conversation objects (without messages).
 */
export const getAllConversations = async (userId: string): Promise<Conversation[]> => {
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
        messages: [], // Messages are not fetched in this overview function
        agentId: data.agentId,
        userId: data.userId,
      });
    });
    return conversations;
  } catch (error) {
    console.error("Error fetching all conversations from Firestore:", error);
    // Consider using a custom error type or allowing the caller to handle UI feedback
    return []; 
  }
};

/**
 * Fetches a specific conversation, including its messages.
 * @param conversationId The ID of the conversation to fetch.
 * @returns A promise that resolves to a Conversation object or undefined if not found.
 */
export const getConversationById = async (conversationId: string): Promise<Conversation | undefined> => {
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

    // Security Note: Implement Firestore security rules to ensure users can only access their own conversations.
    // Example: allow read: if request.auth.uid == resource.data.userId;

    const conversationData = conversationSnap.data();
    const messagesRef = collection(conversationDocRef, MESSAGES_SUBCOLLECTION);
    // Consider adding limit() if conversations can have extremely large numbers of messages,
    // and implement pagination if necessary.
    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"));
    const messagesSnapshot = await getDocs(messagesQuery);

    const messages: Message[] = [];
    messagesSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      messages.push({
        id: docSnap.id,
        sender: data.sender,
        text: data.text,
        content: data.text || '', // Ensure content is present
        imageUrl: data.imageUrl,
        fileName: data.fileName,
        timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(),
        isError: data.isError || false,
        isUser: data.sender === 'user',
        isLoading: data.isLoading || false,
        // Map other relevant message fields
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
    console.error(`Error fetching conversation ${conversationId} from Firestore:`, error);
    return undefined;
  }
};

/**
 * Creates a new conversation document in Firestore.
 * @param userId The ID of the user creating the conversation.
 * @param title Optional title for the conversation.
 * @param agentId Optional ID of the agent associated with this conversation.
 * @returns A promise that resolves to the new Conversation object or null on error.
 */
export const createNewConversation = async (userId: string, title?: string, agentId?: string): Promise<Conversation | null> => {
  if (!userId) {
    console.error("createNewConversation: userId is required.");
    return null;
  }
  try {
    const newConversationData = {
      userId: userId,
      agentId: agentId || null,
      title: title || `Chat ${new Date().toLocaleString()}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(firestore, CONVERSATIONS_COLLECTION), newConversationData);
    
    const now = new Date(); // Approximate client-side timestamp for optimistic return
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

/**
 * Adds a message to a specific conversation's "messages" sub-collection.
 * @param conversationId The ID of the conversation.
 * @param message The message object to add (excluding id and server-generated timestamp).
 * @returns A promise that resolves to the added Message object with its ID and server timestamp, or null on error.
 */
export const addMessageToConversation = async (
  conversationId: string, 
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<Message | null> => {
  if (!conversationId) {
    console.error("addMessageToConversation: conversationId is required.");
    return null;
  }
  try {
    const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    const messagesRef = collection(conversationDocRef, MESSAGES_SUBCOLLECTION);
    
    const messageData = {
      ...message,
      timestamp: serverTimestamp(), // Firestore will set this on the server
    };
    const messageDocRef = await addDoc(messagesRef, messageData);

    // Update the parent conversation's 'updatedAt' timestamp
    await updateDoc(conversationDocRef, {
      updatedAt: serverTimestamp(),
    });
    
    // Return the message with its new ID and an approximate timestamp
    return { 
        id: messageDocRef.id, 
        ...message, 
        timestamp: new Date() // Client-side approximation for optimistic update
    } as Message;
  } catch (error) {
    console.error(`Error adding message to conversation ${conversationId} in Firestore:`, error);
    return null;
  }
};

/**
 * Renames a conversation in Firestore.
 * @param conversationId The ID of the conversation to rename.
 * @param newTitle The new title for the conversation.
 * @returns A promise that resolves when the operation is complete, or throws on error.
 */
export const renameConversationInStorage = async (conversationId: string, newTitle: string): Promise<void> => {
  if (!conversationId || !newTitle) {
    console.error("renameConversationInStorage: conversationId and newTitle are required.");
    throw new Error("Conversation ID and new title are required.");
  }
  const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
  try {
    // Security Note: Ensure rules only allow owner to rename.
    await updateDoc(conversationRef, {
      title: newTitle,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error renaming conversation ${conversationId} in Firestore:`, error);
    throw error; // Re-throw for caller to handle
  }
};

/**
 * Deletes a conversation and all its messages from Firestore.
 * @param conversationId The ID of the conversation to delete.
 * @returns A promise that resolves when the operation is complete, or throws on error.
 */
export const deleteConversationFromStorage = async (conversationId: string): Promise<void> => {
  if (!conversationId) {
    console.error("deleteConversationFromStorage: conversationId is required.");
    throw new Error("Conversation ID is required.");
  }
  const conversationRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
  try {
    // Security Note: Ensure rules only allow owner to delete.
    
    // 1. Delete all messages in the "messages" sub-collection
    // Client-side deletion of subcollections is not recommended for very large subcollections.
    // For production, a Cloud Function triggered on conversation deletion is more robust.
    // However, for client-side, batch deletion is the way to go.
    const messagesRef = collection(conversationRef, MESSAGES_SUBCOLLECTION);
    const messagesSnapshot = await getDocs(messagesRef); // Consider querying in batches if subcollection can be huge
    
    if (!messagesSnapshot.empty) {
      const batch = writeBatch(firestore);
      messagesSnapshot.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      console.log(`Deleted ${messagesSnapshot.size} messages from conversation ${conversationId}.`);
    }

    // 2. Delete the conversation document itself
    await deleteDoc(conversationRef);
    console.log(`Conversation ${conversationId} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting conversation ${conversationId} from Firestore:`, error);
    throw error; // Re-throw for caller to handle
  }
};

/**
 * Finalizes a message in a conversation, typically after streaming content.
 * Updates the message content, marks it as not loading, and sets error status.
 * @param conversationId The ID of the conversation.
 * @param messageId The ID of the message document to update.
 * @param fullContent The complete content of the message.
 * @param isError Optional flag indicating if the message finalization is due to an error.
 * @returns A promise that resolves when the operation is complete, or throws on error.
 */
export const finalizeMessageInConversation = async (
  conversationId: string,
  messageId: string,
  fullContent: string,
  isError: boolean = false
): Promise<void> => {
  if (!conversationId || !messageId) {
    console.error("finalizeMessageInConversation: conversationId and messageId are required.");
    throw new Error("Conversation ID and Message ID are required.");
  }
  try {
    const messageRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION, messageId);
    await updateDoc(messageRef, {
      text: fullContent,
      content: fullContent, // Ensure 'content' is also updated
      isError: isError,
      isLoading: false,
      timestamp: serverTimestamp(), // Update timestamp to reflect finalization
    });

    // Update the conversation's updatedAt timestamp
    const conversationDocRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(conversationDocRef, {
        updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error finalizing message ${messageId} in conversation ${conversationId}:`, error);
    throw error; // Re-throw for caller to handle
  }
};


/*
 Firestore Security Rules (Conceptual - to be defined/updated in firestore.rules):

 rules_version = '2';
 service cloud.firestore {
   match /databases/{database}/documents {
     // Agents Collection - (Assuming rules are already defined elsewhere or will be added)
     // match /agents/{agentId} {
     //   allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
     // }

     // Conversations Collection
     // Users can only manage their own conversations.
     match /conversations/{conversationId} {
       allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
       allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;

       // Messages Sub-collection
       // Users can only read/write messages within their own conversations.
       match /messages/{messageId} {
         allow read: if request.auth != null && get(/databases/$(database)/documents/conversations/$(conversationId)).data.userId == request.auth.uid;
         allow create: if request.auth != null && get(/databases/$(database)/documents/conversations/$(conversationId)).data.userId == request.auth.uid;
         // Update might be needed for finalizing streamed messages by a server-side agent.
         // Consider more specific rules if agents/tools write messages directly.
         allow update: if request.auth != null; // Or a more specific role check if needed.
         // Deletion of individual messages might be restricted.
         // allow delete: if false; // Or allow only for owner/admin based on requirements.
       }
     }
   }
 }

 User ID Handling:
 - The `userId` field in the `conversations` collection is critical for security and data ownership.
 - In a production environment, this `userId` must come from a reliable authentication system (e.g., Firebase Authentication `request.auth.uid`).
 - Client-side code (e.g., UI components, context providers) must be responsible for obtaining and passing the authenticated `userId` to these storage functions.
 - The placeholder `PLACEHOLDER_USER_ID` used in some contexts (like the AgentsContext) must be replaced with actual user authentication.
*/
