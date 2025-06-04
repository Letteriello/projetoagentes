import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message } from '@/types/chat';
import { openDatabase } from '@/lib/indexed-db-manager';

// Store names are defined locally but must match those in indexed-db-manager.ts
export const CONVERSATIONS_STORE_NAME = 'conversations';
export const MESSAGES_STORE_NAME = 'messages';


// Helper functions for Date conversion
// No changes to helper functions themselves

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
    messages: storable.messages || [], // Ensure messages array exists, though it will be populated separately
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

// CRUD function implementations

export async function getAllConversations(userId: string): Promise<Conversation[]> {
  const db = await openDatabase();
  const tx = db.transaction(CONVERSATIONS_STORE_NAME, 'readonly');
  const store = tx.objectStore(CONVERSATIONS_STORE_NAME);
  const index = store.index('userId');
  const storableConversations = await index.getAll(userId);
  await tx.done;

  const conversations = storableConversations.map(fromStorableConversation);
  // Sort by updatedAt descending
  conversations.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return conversations;
}

export async function getConversationById(conversationId: string): Promise<Conversation | undefined> {
  const db = await openDatabase();

  // Get Conversation
  const convoTx = db.transaction(CONVERSATIONS_STORE_NAME, 'readonly');
  const convoStore = convoTx.objectStore(CONVERSATIONS_STORE_NAME);
  const storableConvo = await convoStore.get(conversationId);
  await convoTx.done;

  if (!storableConvo) {
    return undefined;
  }
  const conversation = fromStorableConversation(storableConvo);

  // Get Messages
  const msgTx = db.transaction(MESSAGES_STORE_NAME, 'readonly');
  const msgStore = msgTx.objectStore(MESSAGES_STORE_NAME);
  const msgIndex = msgStore.index('conversationId');
  const storableMessages = await msgIndex.getAll(conversationId);
  await msgTx.done;

  conversation.messages = storableMessages.map(fromStorableMessage);
  // Sort messages by timestamp ascending
  conversation.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return conversation;
}

export async function createNewConversation(userId: string, title?: string, agentId?: string): Promise<Conversation | null> {
  const db = await openDatabase();
  const newConversation: Conversation = {
    id: uuidv4(),
    userId,
    title: title || 'New Conversation',
    createdAt: new Date(),
    updatedAt: new Date(),
    messages: [], // Messages are not stored directly in the conversation object in DB
    ...(agentId && { agentId }),
  };

  const tx = db.transaction(CONVERSATIONS_STORE_NAME, 'readwrite');
  const store = tx.objectStore(CONVERSATIONS_STORE_NAME);
  await store.add(toStorableConversation(newConversation));
  await tx.done;
  return newConversation; // Already in correct Date format
}

async function updateConversationTimestamp(db: IDBDatabase, conversationId: string): Promise<void> {
  const tx = db.transaction(CONVERSATIONS_STORE_NAME, 'readwrite');
  const store = tx.objectStore(CONVERSATIONS_STORE_NAME);
  const storableConvo = await store.get(conversationId);
  if (storableConvo) {
    const conversation = fromStorableConversation(storableConvo);
    conversation.updatedAt = new Date();
    await store.put(toStorableConversation(conversation));
  }
  await tx.done;
}

export async function addMessageToConversation(conversationId: string, messageData: Message | Omit<Message, 'id' | 'timestamp'>): Promise<Message | null> {
  const db = await openDatabase();
  const fullMessageData = messageData as Message; // Type assertion
  const newMessage: Message = {
    ...messageData,
    id: fullMessageData.id || uuidv4(),
    timestamp: fullMessageData.timestamp || new Date(),
  };

  const msgTx = db.transaction(MESSAGES_STORE_NAME, 'readwrite');
  const msgStore = msgTx.objectStore(MESSAGES_STORE_NAME);
  await msgStore.add(toStorableMessage(newMessage));
  await msgTx.done;

  await updateConversationTimestamp(db, conversationId);

  return newMessage; // Already in correct Date format
}

export async function renameConversationInStorage(conversationId: string, newTitle: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(CONVERSATIONS_STORE_NAME, 'readwrite');
  const store = tx.objectStore(CONVERSATIONS_STORE_NAME);
  const storableConvo = await store.get(conversationId);

  if (storableConvo) {
    const conversation = fromStorableConversation(storableConvo);
    conversation.title = newTitle;
    conversation.updatedAt = new Date();
    await store.put(toStorableConversation(conversation));
  }
  await tx.done;
}

export async function deleteConversationFromStorage(conversationId: string): Promise<void> {
  const db = await openDatabase();

  // Delete Messages
  const msgTx = db.transaction(MESSAGES_STORE_NAME, 'readwrite');
  const msgStore = msgTx.objectStore(MESSAGES_STORE_NAME);
  const msgIndex = msgStore.index('conversationId');
  const messagesToDelete = await msgIndex.getAllKeys(conversationId); // Get only keys
  for (const key of messagesToDelete) {
    await msgStore.delete(key);
  }
  await msgTx.done;

  // Delete Conversation
  const convoTx = db.transaction(CONVERSATIONS_STORE_NAME, 'readwrite');
  const convoStore = convoTx.objectStore(CONVERSATIONS_STORE_NAME);
  await convoStore.delete(conversationId);
  await convoTx.done;
}

export async function finalizeMessageInConversation(conversationId: string, messageId: string, fullContent: string, isError: boolean = false): Promise<void> {
  const db = await openDatabase();
  const msgTx = db.transaction(MESSAGES_STORE_NAME, 'readwrite');
  const msgStore = msgTx.objectStore(MESSAGES_STORE_NAME);
  const storableMsg = await msgStore.get(messageId);

  if (storableMsg) {
    const message = fromStorableMessage(storableMsg);
    message.text = fullContent; // Assuming 'text' is the primary content field. Adjust if 'content' is structured.
    message.content = [{ type: 'text', text: fullContent }]; // Or however content is structured
    message.isError = isError;
    message.isLoading = false;
    // message.timestamp = new Date(); // Keep original timestamp or update? Instruction says update.
    await msgStore.put(toStorableMessage({ ...message, timestamp: new Date() })); // Ensure timestamp is updated
  }
  await msgTx.done;

  await updateConversationTimestamp(db, conversationId);
}

export async function deleteMessageFromConversation(conversationId: string, messageId: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(MESSAGES_STORE_NAME, 'readwrite');
  const store = tx.objectStore(MESSAGES_STORE_NAME);
  await store.delete(messageId);
  await tx.done;

  // Optionally update parent conversation's updatedAt
  await updateConversationTimestamp(db, conversationId);
}

export async function updateMessageFeedback(conversationId: string, messageId: string, feedback: 'liked' | 'disliked' | null): Promise<void> {
  const db = await openDatabase();
  const msgTx = db.transaction(MESSAGES_STORE_NAME, 'readwrite');
  const msgStore = msgTx.objectStore(MESSAGES_STORE_NAME);
  const storableMsg = await msgStore.get(messageId);

  if (storableMsg) {
    const message = fromStorableMessage(storableMsg);
    message.feedback = feedback;
    await msgStore.put(toStorableMessage(message)); // Timestamp of message itself doesn't change for feedback
  }
  await msgTx.done;

  await updateConversationTimestamp(db, conversationId);
}
