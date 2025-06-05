import { useState, useEffect, useCallback, useOptimistic } from 'react';
import {
  Conversation,
  CoreChatMessage, // Changed from ChatMessageUI and Message
  MessageFeedback, // Assuming MessageFeedback is still a valid type name in chat-core
  ToolCallData,
  ToolResponseData,
  ErrorDetails,
  ChatRunConfig, // Added, was used by ChatMessageUI
  // TestRunConfig, // This was any, will keep as any if used
} from '@/types/chat-core'; // Updated path
import { v4 as uuidv4 } from 'uuid';
import { useConversationsStorage } from '@/hooks/use-conversations-storage'; // Corrected path based on typical project structure
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

// ExtendedChatMessageUI now extends CoreChatMessage
export interface ExtendedChatMessageUI extends CoreChatMessage {
  // CoreChatMessage already includes most fields from the old ChatMessageUI/ExtendedChatMessageUI
  // Ensure any truly unique fields from the old ExtendedChatMessageUI are explicitly added here if needed.
  // For example, if 'text' or 'sender' were used distinctly from 'content' and 'role' by UI components
  // consuming this specific type, they might need to be re-added or components refactored.
  // For now, assuming CoreChatMessage is comprehensive.
  // 'isStreaming', 'isError', 'imageUrl', 'fileName' are already in CoreChatMessage.
  // 'status' is also in CoreChatMessage.
  // 'appliedUserChatConfig', 'appliedTestRunConfig' are also in CoreChatMessage.
  // 'toolUsed' was deprecated in CoreChatMessage definition.
  conversationId?: string; // Ensure this is present if used for messages not yet in a conversation
}

export type OptimisticUpdateAction =
  | { type: 'add_message'; message: ExtendedChatMessageUI }
  | { type: 'update_message_content'; messageId: string; newContentChunk: string }
  | { type: 'update_message_status'; messageId: string; newStatus: 'completed' | 'error' | 'pending'; newContent?: string; isStreaming?: boolean }
  | { type: 'remove_message'; messageId: string }
  | { type: 'set_messages'; messages: ExtendedChatMessageUI[] }
  | { type: 'update_message_feedback'; messageId: string; feedback: MessageFeedback | null };

export interface ActiveChatTarget {
  id: string;
  name: string;
  type: 'gem' | 'agent' | 'adk-agent';
  config: any; // This 'config' could be more specific, e.g., SavedAgentConfiguration | Gem | ADKAgentConfig
}
type TestRunConfig = any; // Kept as any, as it was before

export interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ExtendedChatMessageUI[]; // True state from DB, now based on CoreChatMessage
  optimisticMessages: ExtendedChatMessageUI[]; // Optimistic state, now based on CoreChatMessage
  isPending: boolean;
  isLoadingMessages: boolean;
  isLoadingConversations: boolean;
  inputContinuation: any; // This type was 'any' before
  selectedFile: File | null;
  selectedFileName: string | null;
  selectedFileDataUri: string | null;
  currentUserId: string | undefined;
  inputValue: string;
  waitingForFeedbackOnMessageId: string | null;

  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setActiveConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  setMessages: React.Dispatch<React.SetStateAction<ExtendedChatMessageUI[]>>;
  setIsPending: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingMessages: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingConversations: React.Dispatch<React.SetStateAction<boolean>>;
  setInputContinuation: React.Dispatch<React.SetStateAction<any>>;
  setSelectedFile: React.Dispatch<React.SetStateAction<File | null>>;
  setSelectedFileName: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedFileDataUri: React.Dispatch<React.SetStateAction<string | null>>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setWaitingForFeedbackOnMessageId: React.Dispatch<React.SetStateAction<string | null>>;

  handleNewConversation: (defaultTitle?: string) => Promise<Conversation | null>;
  handleSelectConversation: (conversationId: string) => void;
  handleDeleteConversation: (conversationId: string) => Promise<void>;
  handleRenameConversation: (conversationId: string, newTitle: string) => Promise<void>;

  submitMessage: (
    messageInputValue: string,
    activeChatTarget?: ActiveChatTarget | null,
    file?: File | null,
    audioDataUri?: string | null,
    userChatConfig?: ChatRunConfig,
    testRunConfig?: TestRunConfig
  ) => Promise<void>;
  handleFeedback: (messageId: string, feedback: MessageFeedback | null) => Promise<void>;
  handleRegenerate: (
    messageIdToRegenerate: string,
    activeChatTarget?: ActiveChatTarget | null,
    testRunConfig?: TestRunConfig,
    userChatConfig?: ChatRunConfig
  ) => Promise<void>;
  clearSelectedFile: () => void;
}

export function useChatStore(): ChatStore {
  const { currentUser } = useAuth();
  const router = useRouter();
  const conversationStorage = useConversationsStorage();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ExtendedChatMessageUI[]>([]);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false);
  const [inputContinuation, setInputContinuation] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileDataUri, setSelectedFileDataUri] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [waitingForFeedbackOnMessageId, setWaitingForFeedbackOnMessageId] = useState<string | null>(null);
  const currentUserId = currentUser?.uid;

  const [optimisticMessages, addOptimisticMessage] = useOptimistic<ExtendedChatMessageUI[], OptimisticUpdateAction>(
    messages,
    (state, action) => {
      switch (action.type) {
        case 'add_message':
          return [...state, action.message];
        case 'update_message_content':
          return state.map(msg =>
            msg.id === action.messageId ? { ...msg, content: (msg.content || "") + action.newContentChunk, isStreaming: true } : msg // Use content
          );
        case 'update_message_status':
          return state.map(msg =>
            msg.id === action.messageId ? { ...msg, status: action.newStatus, content: action.newContent !== undefined ? action.newContent : msg.content, isStreaming: action.isStreaming !== undefined ? action.isStreaming : false, isError: action.newStatus === 'error' } : msg // Use content
          );
        case 'remove_message':
          return state.filter(msg => msg.id !== action.messageId);
        case 'set_messages':
          return action.messages;
        case 'update_message_feedback':
          return state.map(msg =>
            msg.id === action.messageId ? { ...msg, feedback: action.feedback } : msg
          );
        default:
          return state;
      }
    }
  );

  useEffect(() => {
    if (currentUser?.uid) {
      setIsLoadingConversations(true);
      conversationStorage.getAllConversations(currentUser.uid)
        .then((fetchedConversations) => {
          setConversations(fetchedConversations.map(c => ({...c, messages: c.messages.map(m => ({...m, timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)}))}))); // Ensure timestamp is Date
        })
        .catch((error) => {
          console.error("Error loading conversations:", error);
          toast({ title: "Error", description: "Failed to load conversations.", variant: "destructive"});
        })
        .finally(() => setIsLoadingConversations(false));
    }
  }, [currentUser?.uid, conversationStorage]);

  const handleNewConversation = useCallback(async (defaultTitle: string = "New Chat"): Promise<Conversation | null> => {
    if (!currentUserId) { /* ... */ return null; }
    try {
      const newConversation = await conversationStorage.createConversation(currentUserId, defaultTitle);
      setConversations((prevs) => [newConversation, ...prevs]);
      setMessages([]);
      addOptimisticMessage({ type: 'set_messages', messages: [] });
      router.push(`/chat/${newConversation.id}`);
      return newConversation;
    } catch (error) { /* ... */ return null; }
  }, [currentUserId, router, addOptimisticMessage, conversationStorage]);

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setIsLoadingMessages(true);
    setInputContinuation(null);
    try {
      const conversation = await conversationStorage.getConversationById(conversationId);
      const uiMessages: ExtendedChatMessageUI[] = (conversation?.messages || []).map((dbMessage: CoreChatMessage) => ({ // dbMessage is CoreChatMessage
        ...dbMessage, // Spread CoreChatMessage props
        timestamp: dbMessage.timestamp instanceof Date ? dbMessage.timestamp : new Date(dbMessage.timestamp), // Ensure Date object
        // Map CoreChatMessage fields to ExtendedChatMessageUI if there are differences
        // For now, assuming CoreChatMessage is mostly compatible with what ExtendedChatMessageUI needs beyond role/content
        status: dbMessage.status || 'completed', // Default status
      }));
      setMessages(uiMessages);
      addOptimisticMessage({ type: 'set_messages', messages: uiMessages });
    } catch (error) { /* ... */ }
    finally { setIsLoadingMessages(false); }
  }, [addOptimisticMessage, conversationStorage]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => { /* ... */ }, [currentUserId, activeConversationId, router, addOptimisticMessage, conversationStorage]);
  const handleRenameConversation = useCallback(async (conversationId: string, newTitle: string) => { /* ... */ }, [conversationStorage]);

  useEffect(() => { /* ... URL and active conversation sync logic ... */ }, [activeConversationId, conversations, isLoadingConversations, isLoadingMessages, router, handleSelectConversation]);
  useEffect(() => { /* ... localStorage sync for lastActiveConversationId ... */ }, [activeConversationId]);
  const clearSelectedFile = useCallback(() => { /* ... */ }, []);

  const submitMessage = async ( /* ... params ... */ ) => {
    // --- Feedback Capture Mode ---
    if (waitingForFeedbackOnMessageId) {
      // ... (feedback capture logic) ...
      const feedbackConfirmationMessage: ExtendedChatMessageUI = {
        id: uuidv4(),
        content: `Obrigado pelo seu feedback: "${inputValue}"`, // Use content
        role: 'system', // Use role
        timestamp: new Date(),
        status: 'completed', // Use status from CoreChatMessage
        conversationId: activeConversationId!,
      };
      // ...
      return;
    }

    // --- Normal Message Submission Flow ---
    if (!currentUserId) { /* ... */ return; }
    if (!inputValue.trim() && !selectedFile && !selectedFileDataUri) { /* ... */ return; } // Check selectedFileDataUri for audio too

    setIsPending(true);
    const userMessageId = uuidv4();
    const userMessageTimestamp = new Date();
    const userMessagePayload: ExtendedChatMessageUI = {
      id: userMessageId,
      content: inputValue, // Use content
      role: "user", // Use role
      status: "pending", // Use status
      timestamp: userMessageTimestamp,
      imageUrl: selectedFile?.type.startsWith("image/") ? selectedFileDataUri : undefined,
      fileName: selectedFile?.name || (selectedFileDataUri?.startsWith("data:audio") ? "mock_audio.mp3" : undefined), // Adjusted for audio
      appliedUserChatConfig: userChatConfig,
      appliedTestRunConfig: testRunConfig,
      conversationId: activeConversationId || undefined, // Ensure conversationId is set
    };
    addOptimisticMessage({ type: "add_message", message: userMessagePayload });

    let currentConvId = activeConversationId;
    // ... (new conversation handling) ...
    if (!currentConvId) { /* ... error ... */ return; }
    userMessagePayload.conversationId = currentConvId;

    try {
      const userMessageToPersist: CoreChatMessage = { // Use CoreChatMessage for DB
        id: userMessageId,
        role: "user",
        content: inputValue,
        timestamp: userMessageTimestamp,
        imageUrl: userMessagePayload.imageUrl,
        fileName: userMessagePayload.fileName,
        // conversationId is not part of CoreChatMessage but used by storage service wrapper
      };
      await conversationStorage.addMessage(currentConvId, userMessageToPersist, userMessagePayload.imageUrl, userMessagePayload.fileName); // Adjusted addMessage
      setMessages(prev => [...prev, { ...userMessagePayload, status: 'completed' }]);
      addOptimisticMessage({ type: 'update_message_status', messageId: userMessageId, newStatus: 'completed' });
      // ... (update conversation preview) ...
    } catch (error) { /* ... error handling ... */ return; }

    const currentInputForAgent = inputValue;
    const currentFileDataUriForAgent = selectedFile?.type.startsWith("image/") ? selectedFileDataUri : undefined;
    const currentAudioDataUriForAgent = selectedFileDataUri?.startsWith("data:audio") ? selectedFileDataUri : undefined; // Assuming audio uses selectedFileDataUri

    setInputValue("");
    clearSelectedFile();

    const agentMessageId = uuidv4();
    const agentMessageTimestamp = new Date();
    const agentOptimisticPayload: ExtendedChatMessageUI = {
      id: agentMessageId, content: "", role: "assistant", status: "pending", // Use content, role
      isStreaming: true, timestamp: agentMessageTimestamp, conversationId: currentConvId,
      appliedUserChatConfig: userChatConfig, appliedTestRunConfig: testRunConfig,
    };
    addOptimisticMessage({ type: "add_message", message: agentOptimisticPayload });

    const historyForBackend: CoreChatMessage[] = messages // Use CoreChatMessage for history
      .filter(m => m.status === 'completed')
      .map(uiMsg => ({ // Map ExtendedChatMessageUI to CoreChatMessage for backend
        id: uiMsg.id,
        role: uiMsg.role,
        content: uiMsg.content,
        name: uiMsg.name, // if tool message
        timestamp: uiMsg.timestamp,
        // Omit UI-specific fields not in CoreChatMessage for backend if necessary
        // For now, assuming CoreChatMessage can receive these extra fields or they'll be ignored
        ...(uiMsg.toolCall && {toolCall: uiMsg.toolCall}),
        ...(uiMsg.toolResponse && {toolResponse: uiMsg.toolResponse}),
        ...(uiMsg.retrievedContext && {retrievedContext: uiMsg.retrievedContext}),
      } as CoreChatMessage)); // Cast as CoreChatMessage

    historyForBackend.push({ // Current user message for history
        id: userMessageId, role: "user", content: currentInputForAgent,
        timestamp: userMessageTimestamp,
        imageUrl: userMessagePayload.imageUrl, fileName: userMessagePayload.fileName,
    } as CoreChatMessage);


    let apiEndpoint = activeChatTarget?.type === 'adk-agent' ? '/api/agent-creator-stream' : '/api/chat-stream';
    const requestBody = { /* ... */ history: historyForBackend /* ... */ };

    try {
      const response = await fetch(apiEndpoint, { /* ... */ });
      // ... (response processing) ...
      if (contentType && contentType.includes("application/json")) {
        // ...
        if (data.toolRequests && data.toolResults) {
          data.toolRequests.forEach((toolRequest: ToolCallData) => {
            const toolCallMessage: ExtendedChatMessageUI = { /* ... role: 'system', content: ... */ id: uuidv4(), role: 'system', content: `Usando ferramenta: ${toolRequest.name}...`, timestamp: new Date(), toolCall: toolRequest, status: 'completed', conversationId: currentConvId };
            newMessagesToAdd.push(toolCallMessage);
            // ...
            if (toolResult) {
              const toolResponseMessage: ExtendedChatMessageUI = { /* ... role: 'system', content: ... */ id: uuidv4(), role: 'system', content: responseText, timestamp: new Date(), toolResponse: { name: toolResult.name, output: !isError ? toolResult.output : undefined, errorDetails: isError ? (toolResult.errorDetails as ErrorDetails) : undefined, status: toolResult.status as 'success' | 'error' | 'pending' }, status: 'completed', conversationId: currentConvId };
              newMessagesToAdd.push(toolResponseMessage);
            }
          });
        }
        if (data.outputMessage) {
          finalAgentText = data.outputMessage;
          const agentResponseMessage: ExtendedChatMessageUI = { ...agentOptimisticPayload, id: agentMessageId, content: finalAgentText, status: 'completed', isStreaming: false }; // Use content
          newMessagesToAdd.push(agentResponseMessage);
        }
        // ... (ChatEvents processing, ensure mapping to ExtendedChatMessageUI with role 'system' or similar) ...
        // ...
        for (const msg of newMessagesToAdd) {
          if (msg.role === 'assistant' && msg.id === agentMessageId) { // Persist main agent response
            const messageToPersist: CoreChatMessage = { /* ... map from msg ... */ id: msg.id, role: 'assistant', content: msg.content, timestamp: msg.timestamp };
            await conversationStorage.addMessage(currentConvId, messageToPersist);
          }
        }
        // ...
      } else { // Streaming
        // ...
        const finalAgentPayload: ExtendedChatMessageUI = { ...agentOptimisticPayload, content: finalAgentText, status: 'completed', isStreaming: false }; // Use content
        addOptimisticMessage({ type: "update_message_status", messageId: agentMessageId, status: "completed", isStreaming: false, newContent: finalAgentText });
        const agentMessageToPersist: CoreChatMessage = { /* ... map from finalAgentPayload ... */ id: agentMessageId, role: 'assistant', content: finalAgentText, timestamp: agentMessageTimestamp };
        await conversationStorage.addMessage(currentConvId, agentMessageToPersist);
        setMessages(prev => [...prev, finalAgentPayload]);
      }
      // ...
    } catch (error: any) { /* ... error handling ... */
        const agentErrorMessageObject: ExtendedChatMessageUI = { /* ... role: 'assistant', content: errorMsg ... */ id: agentMessageId, role: 'assistant', content: errorMsg, status: 'error', isError: true, timestamp: agentMessageTimestamp, conversationId: currentConvId };
        setMessages(prev => [...prev, agentErrorMessageObject]);
        const agentErrorPersistObject: CoreChatMessage = { /* ... map ... */ id: agentMessageId, role: 'assistant', content: errorMsg, timestamp: agentMessageTimestamp };
        conversationStorage.addMessage(currentConvId, agentErrorPersistObject);
    } finally { setIsPending(false); }
  };

  const handleFeedback = async (messageId: string, feedback: MessageFeedback | null) => { /* ... */
    if (feedback === 'disliked' && messageToUpdate && messageToUpdate.role !== 'user') { // Use role
      const feedbackRequestMessage: ExtendedChatMessageUI = { /* ... role: 'system', content: ... */ id: uuidv4(), role: 'system', content: "Por que você recusou esta sugestão?", timestamp: new Date(), status: 'completed', conversationId: activeConversationId! };
      // ...
    }
    // ...
  };

  const handleRegenerate = async ( /* ... params ... */ ) => { /* ... */
    const historyForBackend: CoreChatMessage[] = messages
      .slice(0, userPromptIndex + 1)
      .filter(m => m.status === 'completed')
      .map(uiMsg => ({ // Map to CoreChatMessage for backend
        id: uiMsg.id, role: uiMsg.role, content: uiMsg.content, name: uiMsg.name, timestamp: uiMsg.timestamp,
        // Omit UI specific fields if not in CoreChatMessage definition for backend
      } as CoreChatMessage));

    historyForBackend.push({ /* ... current user message as CoreChatMessage ... */ } as CoreChatMessage);

    const newAgentOptimisticPayload: ExtendedChatMessageUI = { /* ... role: 'assistant', content: "" ... */ id: newAgentMessageId, role: 'assistant', content: "", status: "pending", isStreaming: true, timestamp: newAgentTimestamp, conversationId: activeConversationId! };
    // ...
    const finalAgentPayload: ExtendedChatMessageUI = { ...newAgentOptimisticPayload, content: accumulatedAgentResponse, status: 'completed', isStreaming: false }; // Use content
    // ...
    const agentMessageToPersist: CoreChatMessage = { /* ... map from finalAgentPayload ... */ id: newAgentMessageId, role: 'assistant', content: accumulatedAgentResponse, timestamp: newAgentTimestamp };
    // ...
  };

  return { /* ... store properties and functions ... */ };
}
