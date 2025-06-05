import { useCallback } from 'react';
import { Conversation, Message } from '@/types/chat';
// Changed import to use the new unified conversation service
import * as conversationService from '@/services/conversation-service';

// Define the interface for the conversation storage operations
// Updated to reflect that Firestore service now throws errors instead of returning null for some operations
export interface IConversationStorage {
  getAllConversations: (userId: string) => Promise<Conversation[]>;
  getConversationById: (conversationId: string) => Promise<Conversation | undefined>;
  createConversation: (userId: string, title?: string, agentId?: string) => Promise<Conversation>;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => Promise<Message>;
  deleteConversation: (conversationId: string) => Promise<void>;
  renameConversation: (conversationId: string, newTitle: string) => Promise<void>;
  finalizeMessage: (conversationId: string, messageId: string, fullContent: string, isError?: boolean) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  updateMessageFeedback: (conversationId: string, messageId: string, feedback: 'liked' | 'disliked' | null) => Promise<void>;
}

/**
 * Hook to interact with conversation storage.
 * Uses the unified conversation service.
 */
export function useConversationsStorage(): IConversationStorage {

  const getAllConversations = useCallback(
    (userId: string): Promise<Conversation[]> => {
      return conversationService.getAllConversations(userId);
    },
    []
  );

  const getConversationById = useCallback(
    (conversationId: string): Promise<Conversation | undefined> => {
      return conversationService.getConversationById(conversationId);
    },
    []
  );

  const createConversation = useCallback(
    (userId: string, title?: string, agentId?: string): Promise<Conversation> => {
      return conversationService.createNewConversation(userId, title, agentId);
    },
    []
  );

  const addMessage = useCallback(
    (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> => {
      return conversationService.addMessageToConversation(conversationId, message);
    },
    []
  );

  const deleteConversation = useCallback(
    (conversationId: string): Promise<void> => {
      return conversationService.deleteConversationFromStorage(conversationId);
    },
    []
  );

  const renameConversation = useCallback(
    (conversationId: string, newTitle: string): Promise<void> => {
      return conversationService.renameConversationInStorage(conversationId, newTitle);
    },
    []
  );

  const finalizeMessage = useCallback(
    (conversationId: string, messageId: string, fullContent: string, isError?: boolean): Promise<void> => {
      return conversationService.finalizeMessageInConversation(conversationId, messageId, fullContent, isError);
    },
    []
  );

  const deleteMessage = useCallback(
    (conversationId: string, messageId: string): Promise<void> => {
      return conversationService.deleteMessageFromConversation(conversationId, messageId);
    },
    []
  );

  const updateMessageFeedback = useCallback(
    (conversationId: string, messageId: string, feedback: 'liked' | 'disliked' | null): Promise<void> => {
      return conversationService.updateMessageFeedback(conversationId, messageId, feedback);
    },
    []
  );

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
