import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message } from '@/types/chat';
import { openDatabase } from '@/lib/indexed-db-manager';
import { retryWithBackoff, isRetryableIDBError, RetryConfig } from '@/lib/utils';

// Store names are defined locally but must match those in indexed-db-manager.ts
export const CONVERSATIONS_STORE_NAME = 'conversations';
export const MESSAGES_STORE_NAME = 'messages';

// Default retry configuration for IndexedDB operations (can be shared or customized)
const idbRetryConfig: RetryConfig = {
  maxRetries: 2,
  initialDelayMs: 100,
  shouldRetry: isRetryableIDBError,
  logRetries: true,
};

type Transaction = IDBTransaction;

// Helper functions for Date conversion (omitted for brevity, assume they are the same)
// For Conversation
const toStorableConversation = (conversation: Conversation): any => {
  return {
    ...conversation,
    createdAt: conversation.createdAt instanceof Date ? conversation.createdAt.toISOString() : conversation.createdAt,
    updatedAt: conversation.updatedAt instanceof Date ? conversation.updatedAt.toISOString() : conversation.updatedAt,
    messages: [], // Messages are stored separately
  };
};

const fromStorableConversation = (storable: any): Conversation => {
  if (!storable) return storable;
  return {
    ...storable,
    createdAt: new Date(storable.createdAt),
    updatedAt: new Date(storable.updatedAt),
    messages: storable.messages || [],
  } as Conversation;
};

// For Message
const toStorableMessage = (message: Message | Omit<Message, 'id' | 'timestamp'>): any => {
  const timestamp = (message as Message).timestamp || new Date();
  return {
    ...message,
    timestamp: timestamp instanceof Date ? timestamp.toISOString() : timestamp,
  };
};

const fromStorableMessage = (storable: any): Message => {
  if (!storable) return storable;
  return {
    ...storable,
    timestamp: new Date(storable.timestamp),
  } as Message;
};


async function updateConversationTimestampInternal(transaction: Transaction, conversationId: string): Promise<void> {
  const store = transaction.objectStore(CONVERSATIONS_STORE_NAME);
  const storableConvo = await store.get(conversationId); // This is a request, not a direct result
  if (storableConvo) {
    const conversation = fromStorableConversation(storableConvo);
    conversation.updatedAt = new Date();
    await store.put(toStorableConversation(conversation)); // This is also a request
  }
}

export async function getAllConversations(userId: string): Promise<Conversation[]> {
  // Read operation - no retry
  const db = await openDatabase();
  const tx = db.transaction(CONVERSATIONS_STORE_NAME, 'readonly');
  const store = tx.objectStore(CONVERSATIONS_STORE_NAME);
  const index = store.index('userId');
  const storableConversations = await index.getAll(userId);

  const conversations = storableConversations.map(fromStorableConversation);
  conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return conversations;
}

export async function getConversationById(conversationId: string): Promise<Conversation | undefined> {
  // Read operation - no retry
  const db = await openDatabase();

  const convoTx = db.transaction(CONVERSATIONS_STORE_NAME, 'readonly');
  const convoStore = convoTx.objectStore(CONVERSATIONS_STORE_NAME);
  const storableConvo = await convoStore.get(conversationId);

  if (!storableConvo) {
    return undefined;
  }
  const conversation = fromStorableConversation(storableConvo);

  const msgTx = db.transaction(MESSAGES_STORE_NAME, 'readonly');
  const msgStore = msgTx.objectStore(MESSAGES_STORE_NAME);
  const msgIndex = msgStore.index('conversationId');
  const storableMessages = await msgIndex.getAll(conversationId);

  conversation.messages = storableMessages.map(fromStorableMessage);
  conversation.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return conversation;
}

export async function createNewConversation(userId: string, title?: string, agentId?: string): Promise<Conversation> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const newConversation: Conversation = {
      id: uuidv4(),
      userId,
      title: title || 'New Conversation',
      createdAt: new Date(),
      updatedAt: new Date(),
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

export async function addMessageToConversation(conversationId: string, messageData: Message | Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const fullMessageData = messageData as Message;
    const newMessage: Message = {
      ...messageData,
      id: fullMessageData.id || uuidv4(),
      timestamp: fullMessageData.timestamp || new Date(),
    };

    const tx = db.transaction([MESSAGES_STORE_NAME, CONVERSATIONS_STORE_NAME], 'readwrite');
    const msgStore = tx.objectStore(MESSAGES_STORE_NAME);
    try {
      await msgStore.add(toStorableMessage(newMessage));
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
      const storableConvo = await store.get(conversationId);
      if (storableConvo) {
        const conversation = fromStorableConversation(storableConvo);
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
      const storableMsg = await msgStore.get(messageId);
      if (storableMsg) {
        const message = fromStorableMessage(storableMsg);
        message.text = fullContent;
        message.content = [{ type: 'text', text: fullContent }];
        message.isError = isError;
        message.isLoading = false;
        await msgStore.put(toStorableMessage({ ...message, timestamp: new Date() }));
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
      const storableMsg = await msgStore.get(messageId);
      if (storableMsg) {
        const message = fromStorableMessage(storableMsg);
        message.feedback = feedback;
        await msgStore.put(toStorableMessage(message));
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
