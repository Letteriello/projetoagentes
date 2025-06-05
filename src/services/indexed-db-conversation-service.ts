// src/services/indexed-db-conversation-service.ts
import { v4 as uuidv4 } from 'uuid';
import { Conversation, CoreChatMessage } from '@/types/chat-core'; // Updated path and Message to CoreChatMessage
import { openDatabase } from '@/lib/indexed-db-manager';
import { retryWithBackoff, isRetryableIDBError, RetryConfig } from '@/lib/utils';

export const CONVERSATIONS_STORE_NAME = 'conversations';
export const MESSAGES_STORE_NAME = 'messages';

const idbRetryConfig: RetryConfig = {
  maxRetries: 2,
  initialDelayMs: 100,
  shouldRetry: isRetryableIDBError,
  logRetries: true,
};

// Types for Storable objects, ensuring dates are strings for IndexedDB
interface StorableConversation extends Omit<Conversation, 'createdAt' | 'updatedAt' | 'messages'> {
  createdAt: string;
  updatedAt: string;
}

interface StorableMessage extends Omit<CoreChatMessage, 'timestamp'> {
  timestamp: string;
  // Add conversationId here because CoreChatMessage might not have it directly,
  // but it's essential for indexing messages.
  conversationId: string;
}

// Conversion functions
const toStorableConversation = (conversation: Conversation): StorableConversation => {
  return {
    ...conversation,
    createdAt: (conversation.createdAt instanceof Date ? conversation.createdAt.toISOString() : conversation.createdAt) as string,
    updatedAt: (conversation.updatedAt instanceof Date ? conversation.updatedAt.toISOString() : conversation.updatedAt) as string,
    // messages are not stored directly in the conversation object in DB
  };
};

const fromStorableConversation = (storable: StorableConversation | undefined): Conversation | undefined => {
  if (!storable) return undefined;
  return {
    ...storable,
    createdAt: new Date(storable.createdAt),
    updatedAt: new Date(storable.updatedAt),
    messages: [], // Messages will be loaded separately
  };
};

const toStorableMessage = (message: CoreChatMessage, conversationId: string): StorableMessage => {
  return {
    ...message,
    timestamp: (message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp) as string,
    conversationId: message.conversationId || conversationId, // Ensure conversationId is set
  };
};

const fromStorableMessage = (storable: StorableMessage | undefined): CoreChatMessage | undefined => {
  if (!storable) return undefined;
  return {
    ...storable,
    timestamp: new Date(storable.timestamp),
  };
};

async function updateConversationTimestampInternal(transaction: IDBTransaction, conversationId: string): Promise<void> {
  const store = transaction.objectStore(CONVERSATIONS_STORE_NAME);
  const storableConvo = await store.get(conversationId) as StorableConversation | undefined; // Add await and type
  if (storableConvo) {
    const conversation = fromStorableConversation(storableConvo)!; // Non-null assertion
    conversation.updatedAt = new Date();
    await store.put(toStorableConversation(conversation));
  }
}

export async function getAllConversations(userId: string): Promise<Conversation[]> {
  const db = await openDatabase();
  const tx = db.transaction(CONVERSATIONS_STORE_NAME, 'readonly');
  const store = tx.objectStore(CONVERSATIONS_STORE_NAME);
  const index = store.index('userId');
  const storableConversations = await index.getAll(userId) as StorableConversation[];

  const conversations = storableConversations.map(s => fromStorableConversation(s)!); // Non-null assertion
  conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return conversations;
}

export async function getConversationById(conversationId: string): Promise<Conversation | undefined> {
  const db = await openDatabase();
  const convoTx = db.transaction(CONVERSATIONS_STORE_NAME, 'readonly');
  const convoStore = convoTx.objectStore(CONVERSATIONS_STORE_NAME);
  const storableConvo = await convoStore.get(conversationId) as StorableConversation | undefined;

  if (!storableConvo) return undefined;
  const conversation = fromStorableConversation(storableConvo)!;

  const msgTx = db.transaction(MESSAGES_STORE_NAME, 'readonly');
  const msgStore = msgTx.objectStore(MESSAGES_STORE_NAME);
  const msgIndex = msgStore.index('conversationId');
  const storableMessages = await msgIndex.getAll(conversationId) as StorableMessage[];

  conversation.messages = storableMessages.map(s => fromStorableMessage(s)!) // Non-null assertion
                                       .filter((msg): msg is CoreChatMessage => msg !== undefined);
  conversation.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return conversation;
}

export async function createNewConversation(userId: string, title?: string, agentId?: string): Promise<Conversation> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const now = new Date();
    const newConversation: Conversation = {
      id: uuidv4(),
      userId,
      title: title || 'New Conversation',
      createdAt: now,
      updatedAt: now,
      messages: [],
      ...(agentId && { agentId }),
    };

    const tx = db.transaction(CONVERSATIONS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CONVERSATIONS_STORE_NAME);
    try {
      await store.add(toStorableConversation(newConversation));
      await tx.done;
      return newConversation;
    } catch (error) {
      console.error('Error in createNewConversation (attempt):', error);
      throw error;
    }
  }, idbRetryConfig);
}

export async function addMessageToConversation(
  conversationId: string,
  messageData: Omit<CoreChatMessage, 'id' | 'timestamp'> // Parameter uses CoreChatMessage now
): Promise<CoreChatMessage> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const newMessage: CoreChatMessage = {
      ...messageData,
      id: uuidv4(), // Generate ID here if not present
      timestamp: new Date(), // Set timestamp here
      conversationId: conversationId, // Ensure conversationId is part of the message
    };

    const tx = db.transaction([MESSAGES_STORE_NAME, CONVERSATIONS_STORE_NAME], 'readwrite');
    const msgStore = tx.objectStore(MESSAGES_STORE_NAME);
    try {
      await msgStore.add(toStorableMessage(newMessage, conversationId));
      await updateConversationTimestampInternal(tx, conversationId);
      await tx.done;
      return newMessage;
    } catch (error) {
      console.error('Error in addMessageToConversation (attempt):', error);
      throw error;
    }
  }, idbRetryConfig);
}

export async function renameConversationInStorage(conversationId: string, newTitle: string): Promise<void> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const tx = db.transaction(CONVERSATIONS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(CONVERSATIONS_STORE_NAME);
    try {
      const storableConvo = await store.get(conversationId) as StorableConversation | undefined;
      if (storableConvo) {
        const conversation = fromStorableConversation(storableConvo)!;
        conversation.title = newTitle;
        conversation.updatedAt = new Date();
        await store.put(toStorableConversation(conversation));
      } else {
        throw new Error(`Conversation with ID ${conversationId} not found for renaming.`);
      }
      await tx.done;
    } catch (error) {
      console.error('Error in renameConversationInStorage (attempt):', error);
      throw error;
    }
  }, idbRetryConfig);
}

export async function deleteConversationFromStorage(conversationId: string): Promise<void> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const tx = db.transaction([MESSAGES_STORE_NAME, CONVERSATIONS_STORE_NAME], 'readwrite');
    const msgStore = tx.objectStore(MESSAGES_STORE_NAME);
    const convoStore = tx.objectStore(CONVERSATIONS_STORE_NAME);
    try {
      const msgIndex = msgStore.index('conversationId');
      const messagesToDeleteKeys = await msgIndex.getAllKeys(conversationId);
      for (const key of messagesToDeleteKeys) {
        await msgStore.delete(key);
      }
      await convoStore.delete(conversationId);
      await tx.done;
    } catch (error) {
      console.error('Error in deleteConversationFromStorage (attempt):', error);
      throw error;
    }
  }, idbRetryConfig);
}

export async function finalizeMessageInConversation(conversationId: string, messageId: string, fullContent: string, isError: boolean = false): Promise<void> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const tx = db.transaction([MESSAGES_STORE_NAME, CONVERSATIONS_STORE_NAME], 'readwrite');
    const msgStore = tx.objectStore(MESSAGES_STORE_NAME);
    try {
      const storableMsg = await msgStore.get(messageId) as StorableMessage | undefined;
      if (storableMsg) {
        const message = fromStorableMessage(storableMsg)!;
        message.content = fullContent; // Use content field
        message.isError = isError;
        message.isLoading = false; // Assuming streaming/loading is finished
        message.timestamp = new Date(); // Update timestamp on finalization
        await msgStore.put(toStorableMessage(message, conversationId));
        await updateConversationTimestampInternal(tx, conversationId);
      } else {
        throw new Error(`Message with ID ${messageId} not found for finalization.`);
      }
      await tx.done;
    } catch (error) {
      console.error('Error in finalizeMessageInConversation (attempt):', error);
      throw error;
    }
  }, idbRetryConfig);
}

export async function deleteMessageFromConversation(conversationId: string, messageId: string): Promise<void> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const tx = db.transaction([MESSAGES_STORE_NAME, CONVERSATIONS_STORE_NAME], 'readwrite');
    const msgStore = tx.objectStore(MESSAGES_STORE_NAME);
    try {
      await msgStore.delete(messageId);
      await updateConversationTimestampInternal(tx, conversationId);
      await tx.done;
    } catch (error) {
      console.error('Error in deleteMessageFromConversation (attempt):', error);
      throw error;
    }
  }, idbRetryConfig);
}

export async function updateMessageFeedback(conversationId: string, messageId: string, feedback: 'liked' | 'disliked' | null): Promise<void> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const tx = db.transaction([MESSAGES_STORE_NAME, CONVERSATIONS_STORE_NAME], 'readwrite');
    const msgStore = tx.objectStore(MESSAGES_STORE_NAME);
    try {
      const storableMsg = await msgStore.get(messageId) as StorableMessage | undefined;
      if (storableMsg) {
        const message = fromStorableMessage(storableMsg)!;
        message.feedback = feedback;
        await msgStore.put(toStorableMessage(message, conversationId));
        await updateConversationTimestampInternal(tx, conversationId);
      } else {
        throw new Error(`Message with ID ${messageId} not found for feedback update.`);
      }
      await tx.done;
    } catch (error) {
      console.error('Error in updateMessageFeedback (attempt):', error);
      throw error;
    }
  }, idbRetryConfig);
}

[end of src/services/indexed-db-conversation-service.ts]
