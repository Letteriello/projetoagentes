import { Conversation, Message } from '@/types/chat';

const CONVERSATIONS_KEY = 'chatConversations';

// Helper to get all conversations from localStorage
const getStoredConversations = (): Conversation[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(CONVERSATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Helper to save all conversations to localStorage
const storeConversations = (conversations: Conversation[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
};

export const getAllConversations = (): Conversation[] => {
  const conversations = getStoredConversations();
  // Sort by createdAt date, newest first
  return conversations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getConversationById = (id: string): Conversation | undefined => {
  return getStoredConversations().find(conv => conv.id === id);
};

export const createNewConversation = (title?: string): Conversation => {
  const newConversation: Conversation = {
    id: `conv-${Date.now()}`,
    title: title || `Chat ${new Date().toLocaleString()}`,
    createdAt: new Date(),
    messages: [],
  };
  const conversations = getStoredConversations();
  const updatedConversations = [newConversation, ...conversations]; // Add to the beginning
  storeConversations(updatedConversations);
  return newConversation;
};

export const addMessageToConversation = (conversationId: string, message: Message): Conversation | undefined => {
  let conversations = getStoredConversations();
  const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);

  if (conversationIndex === -1) {
    console.error(`Conversation with ID ${conversationId} not found.`);
    return undefined;
  }

  const updatedConversation = {
    ...conversations[conversationIndex],
    messages: [...conversations[conversationIndex].messages, message],
  };

  conversations[conversationIndex] = updatedConversation;
  storeConversations(conversations);
  return updatedConversation;
};

// Placeholder for updating a streaming message - might need more thought for efficiency
export const updateLastMessageInConversation = (conversationId: string, chunk: string, isError: boolean = false): Conversation | undefined => {
  let conversations = getStoredConversations();
  const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);

  if (conversationIndex === -1) {
    console.error(`Conversation with ID ${conversationId} not found during update.`);
    return undefined;
  }
  
  const currentConversation = conversations[conversationIndex];
  const lastMessageIndex = currentConversation.messages.length - 1;

  if (lastMessageIndex < 0 || currentConversation.messages[lastMessageIndex].isUser) {
    // This shouldn't happen if a placeholder AI message was added first
    console.error("No AI message found to update.");
    const aiPlaceholder: Message = {
        id: `msg-${Date.now()}`,
        isUser: false,
        content: chunk,
        timestamp: new Date(),
        isError: isError,
    };
    currentConversation.messages.push(aiPlaceholder);
  } else {
    currentConversation.messages[lastMessageIndex].content += chunk;
    currentConversation.messages[lastMessageIndex].isError = isError; // Update error status if needed
    currentConversation.messages[lastMessageIndex].timestamp = new Date(); // Update timestamp
  }
  
  conversations[conversationIndex] = { ...currentConversation };
  storeConversations(conversations);
  return conversations[conversationIndex];
}

export const renameConversationInStorage = (id: string, newTitle: string): Conversation | undefined => {
  const conversations = getStoredConversations();
  const conversationIndex = conversations.findIndex(conv => conv.id === id);
  if (conversationIndex !== -1) {
    conversations[conversationIndex].title = newTitle;
    storeConversations(conversations);
    return conversations[conversationIndex];
  }
  return undefined;
};

export const deleteConversationFromStorage = (id: string): Conversation[] => {
  let conversations = getStoredConversations();
  conversations = conversations.filter(conv => conv.id !== id);
  storeConversations(conversations);
  return conversations;
};
