// src/hooks/useConversationsStorage.ts
import { useCallback } from 'react';
import { Conversation, CoreChatMessage } from '@/types/chat-core'; // Updated path and Message to CoreChatMessage
import * as firestoreConversationService from '@/lib/firestoreConversationStorage';

export interface IConversationStorage {
  getAllConversations: (userId: string) => Promise<Conversation[]>;
  getConversationById: (conversationId: string) => Promise<Conversation | undefined>;
  createConversation: (userId: string, title?: string, agentId?: string) => Promise<Conversation>;
  addMessage: (conversationId: string, message: Omit<CoreChatMessage, 'id' | 'timestamp'>) => Promise<CoreChatMessage>; // Updated to CoreChatMessage
  deleteConversation: (conversationId: string) => Promise<void>;
  renameConversation: (conversationId: string, newTitle: string) => Promise<void>;
  finalizeMessage: (conversationId: string, messageId: string, fullContent: string, isError?: boolean) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  updateMessageFeedback: (conversationId: string, messageId: string, feedback: 'liked' | 'disliked' | null) => Promise<void>;
}

export function useConversationsStorage(): IConversationStorage {
  const getAllConversations = useCallback(
    (userId: string): Promise<Conversation[]> => {
      return firestoreConversationService.getAllConversations(userId);
    }, []
  );

  const getConversationById = useCallback(
    (conversationId: string): Promise<Conversation | undefined> => {
      return firestoreConversationService.getConversationById(conversationId);
    }, []
  );

  const createConversation = useCallback(
    (userId: string, title?: string, agentId?: string): Promise<Conversation> => {
      return firestoreConversationService.createNewConversation(userId, title, agentId);
    }, []
  );

  const addMessage = useCallback(
    (conversationId: string, message: Omit<CoreChatMessage, 'id' | 'timestamp'>): Promise<CoreChatMessage> => {
      // The firestoreConversationService.addMessageToConversation might still expect the old Message type.
      // This would be a deeper issue to resolve by updating the service itself.
      // For now, casting to 'any' to satisfy the immediate type signature here.
      // This signals that firestoreConversationService.addMessageToConversation needs review.
      return firestoreConversationService.addMessageToConversation(conversationId, message as any) as Promise<CoreChatMessage>;
    }, []
  );

  const deleteConversation = useCallback(
    (conversationId: string): Promise<void> => {
      return firestoreConversationService.deleteConversationFromStorage(conversationId);
    }, []
  );

  const renameConversation = useCallback(
    (conversationId: string, newTitle: string): Promise<void> => {
      return firestoreConversationService.renameConversationInStorage(conversationId, newTitle);
    }, []
  );

  const finalizeMessage = useCallback(
    (conversationId: string, messageId: string, fullContent: string, isError?: boolean): Promise<void> => {
      return firestoreConversationService.finalizeMessageInConversation(conversationId, messageId, fullContent, isError);
    }, []
  );

  const deleteMessage = useCallback(
    (conversationId: string, messageId: string): Promise<void> => {
      return firestoreConversationService.deleteMessageFromConversation(conversationId, messageId);
    }, []
  );

  const updateMessageFeedback = useCallback(
    (conversationId: string, messageId: string, feedback: 'liked' | 'disliked' | null): Promise<void> => {
      return firestoreConversationService.updateMessageFeedback(conversationId, messageId, feedback);
    }, []
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
