import { useCallback } from 'react';
import { Conversation, Message } from '@/types/chat'; // Assuming types are in @/types/chat
import * as idbConversationService from '@/services/indexed-db-conversation-service';

// Define the interface for the conversation storage operations
export interface IConversationStorage {
  getAllConversations: (userId: string) => Promise<Conversation[]>;
  getConversationById: (conversationId: string) => Promise<Conversation | undefined>;
  createConversation: (userId: string, title?: string, agentId?: string) => Promise<Conversation | null>;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => Promise<Message | null>;
  // updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => Promise<void>; // Not directly in idbService, finalizeMessage is closer
  deleteConversation: (conversationId: string) => Promise<void>;
  renameConversation: (conversationId: string, newTitle: string) => Promise<void>;
  finalizeMessage: (conversationId: string, messageId: string, fullContent: string, isError?: boolean) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  updateMessageFeedback: (conversationId: string, messageId: string, feedback: 'liked' | 'disliked' | null) => Promise<void>;
  // clearConversations: (userId?: string) => Promise<void>; // Not directly in idbService, would need custom implementation
}

/**
 * Hook to interact with conversation storage.
 * Currently uses IndexedDB as the backend.
 *
 * Future Enhancement: This hook could be made configurable to switch between
 * different storage backends (e.g., IndexedDB, Firestore) by introducing
 * a configuration parameter or using a context to provide the storage service.
 */
export function useConversationsStorage(): IConversationStorage {
  // Map the hook's methods to the functions from indexed-db-conversation-service.ts
  // Using useCallback for methods that might be used in useEffect dependencies, though for simple passthroughs it's minor.

  const getAllConversations = useCallback(
    (userId: string): Promise<Conversation[]> => {
      return idbConversationService.getAllConversations(userId);
    },
    []
  );

  const getConversationById = useCallback(
    (conversationId: string): Promise<Conversation | undefined> => {
      return idbConversationService.getConversationById(conversationId);
    },
    []
  );

  const createConversation = useCallback(
    (userId: string, title?: string, agentId?: string): Promise<Conversation | null> => {
      return idbConversationService.createNewConversation(userId, title, agentId);
    },
    []
  );

  const addMessage = useCallback(
    (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<Message | null> => {
      return idbConversationService.addMessageToConversation(conversationId, message);
    },
    []
  );

  const deleteConversation = useCallback(
    (conversationId: string): Promise<void> => {
      return idbConversationService.deleteConversationFromStorage(conversationId);
    },
    []
  );

  const renameConversation = useCallback(
    (conversationId: string, newTitle: string): Promise<void> => {
      return idbConversationService.renameConversationInStorage(conversationId, newTitle);
    },
    []
  );

  const finalizeMessage = useCallback(
    (conversationId: string, messageId: string, fullContent: string, isError?: boolean): Promise<void> => {
      return idbConversationService.finalizeMessageInConversation(conversationId, messageId, fullContent, isError);
    },
    []
  );

  const deleteMessage = useCallback(
    (conversationId: string, messageId: string): Promise<void> => {
      return idbConversationService.deleteMessageFromConversation(conversationId, messageId);
    },
    []
  );

  const updateMessageFeedback = useCallback(
    (conversationId: string, messageId: string, feedback: 'liked' | 'disliked' | null): Promise<void> => {
      return idbConversationService.updateMessageFeedback(conversationId, messageId, feedback);
    },
    []
  );

  // Note: `updateMessage` and `clearConversations` are not directly mapped as they
  // don't have one-to-one equivalents in the current idbConversationService.
  // `finalizeMessage` serves a specific kind of update. A generic `updateMessage`
  // would require a new service function. `clearConversations` would also need a new service function.

  return {
    getAllConversations,
    getConversationById,
    createConversation,
    addMessage,
    deleteConversation,
    renameConversation,
    finalizeMessage,
    deleteMessage,
    updateMessageFeedback,
  };
}
