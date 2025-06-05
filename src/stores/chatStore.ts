import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // Added for potential persistence
import { Conversation, ChatMessageUI, MessageFeedback, ToolCallData, ToolResponseData, ErrorDetails, TestRunConfig, ChatRunConfig, Message } from '@/types/chat';
import { v4 as uuidv4 } from 'uuid';
import { useConversationsStorage } from '@/hooks/useConversationsStorage';
import { toast } from '@/hooks/use-toast';
// Note: useRouter and useAuth cannot be directly used in Zustand store.
// They need to be passed into actions or the logic needs to be adapted.

// Define ExtendedChatMessageUI and OptimisticUpdateAction (copied from use-chat-store.ts)
export interface ExtendedChatMessageUI extends ChatMessageUI {
  isStreaming?: boolean;
  isError?: boolean;
  imageUrl?: string;
  fileName?: string;
  // Ensure all fields from ChatMessageUI are here or inherited
}

// ActiveChatTarget definition (copied from use-chat-store.ts)
export interface ActiveChatTarget {
  id: string;
  name: string;
  type: 'gem' | 'agent' | 'adk-agent';
  config: any; // This should be typed more specifically if possible
}

export interface ChatStoreState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ExtendedChatMessageUI[]; // This will be the "true" state from DB
  // optimisticMessages are handled by components using useOptimistic with this true state
  isPending: boolean; // For user input submission
  isLoadingMessages: boolean;
  isLoadingConversations: boolean;
  inputContinuation: any; // Type this if known
  selectedFile: File | null;
  selectedFileName: string | null;
  selectedFileDataUri: string | null;
  currentUserId: string | undefined; // From auth context
  inputValue: string;
  waitingForFeedbackOnMessageId: string | null;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversationId: (conversationId: string | null) => void;
  setMessages: (messages: ExtendedChatMessageUI[]) => void;
  addMessageOptimistic: (message: ExtendedChatMessageUI) => void; // For optimistic updates
  updateMessageOptimistic: (messageId: string, updates: Partial<ExtendedChatMessageUI>) => void; // For optimistic updates
  removeMessageOptimistic: (messageId: string) => void; // For optimistic updates

  setIsPending: (isPending: boolean) => void;
  setIsLoadingMessages: (isLoading: boolean) => void;
  setIsLoadingConversations: (isLoading: boolean) => void;
  setInputContinuation: (continuation: any) => void;
  setSelectedFile: (file: File | null) => void;
  setSelectedFileName: (name: string | null) => void;
  setSelectedFileDataUri: (uri: string | null) => void;
  setCurrentUserId: (userId: string | undefined) => void;
  setInputValue: (value: string) => void;
  setWaitingForFeedbackOnMessageId: (messageId: string | null) => void;

  loadConversations: (userId: string) => Promise<void>;
  handleNewConversation: (userId: string, defaultTitle?: string, router?: any /* NextRouter */) => Promise<Conversation | null>;
  handleSelectConversation: (conversationId: string, router?: any /* NextRouter */) => Promise<void>;
  handleDeleteConversation: (conversationId: string, currentUserId?: string, router?: any /* NextRouter */) => Promise<void>;
  handleRenameConversation: (conversationId: string, newTitle: string) => Promise<void>;

  submitMessage: (
    messageInputValue: string,
    activeChatTarget: ActiveChatTarget | null, // Made non-optional for clarity in store action
    currentUserId: string | undefined,
    activeConversationId: string | null, // Passed in explicitly
    // True messages state for history, passed in
    currentMessages: ExtendedChatMessageUI[],
    file?: File | null,
    audioDataUri?: string | null,
    userChatConfig?: ChatRunConfig,
    testRunConfig?: TestRunConfig,
    router?: any // NextRouter for navigation
  ) => Promise<void>;

  handleFeedback: (
    conversationId: string,
    messageId: string,
    feedback: MessageFeedback | null,
    currentMessages: ExtendedChatMessageUI[] // Pass current messages for context
  ) => Promise<void>;

  handleRegenerate: (
    messageIdToRegenerate: string,
    activeChatTarget: ActiveChatTarget | null, // Made non-optional
    currentUserId: string | undefined,
    activeConversationId: string | null, // Passed in
    currentMessages: ExtendedChatMessageUI[], // Passed in for history
    testRunConfig?: TestRunConfig,
    userChatConfig?: ChatRunConfig
  ) => Promise<void>;

  clearSelectedFile: () => void;
}

// Initializing storage outside the store creator function might be problematic if it relies on hooks.
// This is a placeholder for how storage interaction would be structured.
// Ideally, conversationStorage functions are plain async functions not requiring React context.
// For this exercise, we'll assume `conversationStorage` can be used like this.
const conversationStorage = useConversationsStorage.getState ? useConversationsStorage.getState() : useConversationsStorage();

export const useChatStore = create<ChatStoreState>()(
  // persist( // Example of persistence, can be configured as needed
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      messages: [],
      isPending: false,
      isLoadingMessages: false,
      isLoadingConversations: false,
      inputContinuation: null,
      selectedFile: null,
      selectedFileName: null,
      selectedFileDataUri: null,
      currentUserId: undefined,
      inputValue: "",
      waitingForFeedbackOnMessageId: null,

      setConversations: (conversations) => set({ conversations }),
      setActiveConversationId: (activeConversationId) => set({ activeConversationId }),
      setMessages: (messages) => set({ messages }),
      // Simple optimistic setters, actual useOptimistic hook will be in the component
      addMessageOptimistic: (message) => set(state => ({ messages: [...state.messages, message] })),
      updateMessageOptimistic: (messageId, updates) => set(state => ({
        messages: state.messages.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg)
      })),
      removeMessageOptimistic: (messageId) => set(state => ({
        messages: state.messages.filter(msg => msg.id !== messageId)
      })),

      setIsPending: (isPending) => set({ isPending }),
      setIsLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),
      setIsLoadingConversations: (isLoadingConversations) => set({ isLoadingConversations }),
      setInputContinuation: (inputContinuation) => set({ inputContinuation }),
      setSelectedFile: (selectedFile) => set({ selectedFile }),
      setSelectedFileName: (selectedFileName) => set({ selectedFileName }),
      setSelectedFileDataUri: (selectedFileDataUri) => set({ selectedFileDataUri }),
      setCurrentUserId: (currentUserId) => set({ currentUserId }),
      setInputValue: (inputValue) => set({ inputValue }),
      setWaitingForFeedbackOnMessageId: (waitingForFeedbackOnMessageId) => set({ waitingForFeedbackOnMessageId }),

      loadConversations: async (userId) => {
        set({ isLoadingConversations: true });
        try {
          const fetchedConversations = await conversationStorage.getAllConversations(userId);
          set({ conversations: fetchedConversations, isLoadingConversations: false });
        } catch (error) {
          console.error("Error loading conversations:", error);
          toast({ title: "Error", description: "Failed to load conversations.", variant: "destructive"});
          set({ isLoadingConversations: false });
        }
      },

      handleNewConversation: async (userId, defaultTitle = "New Chat", router) => {
        if (!userId) {
          toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
          return null;
        }
        try {
          const newConversation = await conversationStorage.createConversation(userId, defaultTitle);
          set(state => ({
            conversations: [newConversation, ...state.conversations],
            messages: [], // Clear messages for new conversation
            activeConversationId: newConversation.id // Set new conversation as active
          }));
          if (router) router.push(`/chat/${newConversation.id}`);
          return newConversation;
        } catch (error) {
          console.error("Error creating new conversation:", error);
          toast({ title: "Error", description: "Failed to create new conversation.", variant: "destructive" });
          return null;
        }
      },

      handleSelectConversation: async (conversationId, router) => {
        set({ activeConversationId: conversationId, isLoadingMessages: true, inputContinuation: null });
        try {
          const conversation = await conversationStorage.getConversationById(conversationId);
          const uiMessages: ExtendedChatMessageUI[] = (conversation?.messages || []).map((dbMessage: Message) => ({
            id: dbMessage.id || uuidv4(),
            text: dbMessage.content || "",
            sender: dbMessage.isUser ? "user" : "agent",
            timestamp: dbMessage.timestamp,
            status: 'completed',
            feedback: dbMessage.feedback,
            isStreaming: false,
            isError: false,
            conversationId: conversation?.id,
            // Ensure all other fields from ChatMessageUI are mapped if necessary
          }));
          set({ messages: uiMessages, isLoadingMessages: false });
          if (router && router.pathname !== `/chat/${conversationId}`) { // Check current path before pushing
            router.push(`/chat/${conversationId}`);
          }
        } catch (error) {
          console.error("Error selecting conversation:", error);
          toast({ title: "Error", description: "Failed to load conversation messages.", variant: "destructive" });
          set({ messages: [], isLoadingMessages: false });
        }
      },

      handleDeleteConversation: async (conversationId, currentUserId, router) => {
        if (!currentUserId) {
          toast({ title: "Error", description: "User not logged in.", variant: "destructive" }); return;
        }
        try {
          await conversationStorage.deleteConversation(conversationId);
          set(state => {
            const newConversations = state.conversations.filter((conv) => conv.id !== conversationId);
            let newActiveConversationId = state.activeConversationId;
            if (state.activeConversationId === conversationId) {
              newActiveConversationId = null;
              if (router) router.push('/chat');
            }
            return {
              conversations: newConversations,
              activeConversationId: newActiveConversationId,
              messages: state.activeConversationId === conversationId ? [] : state.messages,
            };
          });
          toast({ title: "Success", description: "Conversation deleted." });
        } catch (error) {
          console.error("Error deleting conversation:", error);
          toast({ title: "Error", description: "Failed to delete conversation.", variant: "destructive" });
        }
      },

      handleRenameConversation: async (conversationId, newTitle) => {
        try {
          await conversationStorage.renameConversation(conversationId, newTitle);
          set(state => ({
            conversations: state.conversations.map((conv) =>
              conv.id === conversationId ? { ...conv, title: newTitle, updatedAt: new Date() } : conv
            )
          }));
          toast({ title: "Success", description: "Conversation renamed." });
        } catch (error) {
          console.error("Error renaming conversation:", error);
          toast({ title: "Error", description: "Failed to rename conversation.", variant: "destructive" });
        }
      },


      submitMessage: async (
        messageInputValue,
        activeChatTarget,
        currentUserId,
        activeConversationId, // Passed in
        currentMessages, // Passed in (represents get().messages before this action started)
        file,
        audioDataUri,
        userChatConfig,
        testRunConfig,
        router
      ) => {
        const { set, getState } = useChatStore; // Access to set and get from Zustand

        if (getState().waitingForFeedbackOnMessageId) {
          // Feedback capture logic (simplified, actual update would be in handleFeedback)
          console.log(`User feedback for message ${getState().waitingForFeedbackOnMessageId}: ${messageInputValue}`);
          toast({ title: "Feedback Recebido", description: `Obrigado: "${messageInputValue}"`});

          const feedbackConfirmationMessage: ExtendedChatMessageUI = {
            id: uuidv4(),
            text: `Obrigado pelo seu feedback: "${messageInputValue}"`,
            sender: 'system',
            timestamp: new Date(),
            status: 'completed', // Or 'delivered'
            conversationId: activeConversationId!,
          };
          set(state => ({ messages: [...state.messages, feedbackConfirmationMessage] }));
          // TODO: Persist feedbackConfirmationMessage if necessary
          // await conversationStorage.addMessage(activeConversationId!, { /* ... */ });

          set({ waitingForFeedbackOnMessageId: null, inputValue: "", isPending: false });
          return;
        }

        if (!currentUserId) {
          toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
          return;
        }
        if (!messageInputValue.trim() && !file && !audioDataUri) {
          toast({ title: "Input Required", description: "Please type a message or attach a file/audio.", variant: "default" });
          return;
        }

        set({ isPending: true });
        const userMessageId = uuidv4();
        const userMessageTimestamp = new Date();

        let currentConvId = activeConversationId;
        if (!currentConvId) {
          const newConv = await getState().handleNewConversation(currentUserId, activeChatTarget?.name || messageInputValue.substring(0, 30) || "New Chat", router);
          if (newConv) currentConvId = newConv.id;
          else {
            set({ isPending: false }); return;
          }
        }
        if (!currentConvId) {
          toast({ title: "Error", description: "No active conversation selected.", variant: "destructive" });
          set({ isPending: false }); return;
        }

        const userMessagePayload: ExtendedChatMessageUI = {
          id: userMessageId, text: messageInputValue, sender: "user", status: "pending",
          timestamp: userMessageTimestamp,
          imageUrl: file?.type.startsWith("image/") ? getState().selectedFileDataUri : undefined,
          fileName: file?.name || (audioDataUri ? "mock_audio.mp3" : undefined),
          appliedUserChatConfig: userChatConfig,
          appliedTestRunConfig: testRunConfig,
          conversationId: currentConvId,
        };

        // Optimistic update for user message - component using store can use useOptimistic for this
        // For now, directly update the "true" state and then update status
        set(state => ({ messages: [...state.messages, userMessagePayload] }));

        try {
          const userMessageToPersist: Message = {
            id: userMessageId, isUser: true, content: messageInputValue,
            timestamp: userMessageTimestamp,
            imageUrl: userMessagePayload.imageUrl,
            fileName: userMessagePayload.fileName,
            conversationId: currentConvId,
            text: messageInputValue,
          };
          await conversationStorage.addMessage(currentConvId, userMessageToPersist);
          set(state => ({
            messages: state.messages.map(m => m.id === userMessageId ? { ...m, status: 'completed' } : m),
            conversations: state.conversations.map(c => c.id === currentConvId ? ({ ...c, updatedAt: new Date(), lastMessagePreview: messageInputValue.substring(0,50) }) : c)
          }));
        } catch (error) {
          console.error("Error persisting user message:", error);
          toast({ title: "Error", description: "Failed to send your message.", variant: "destructive" });
          set(state => ({
            messages: state.messages.map(m => m.id === userMessageId ? { ...m, status: 'error' } : m),
            isPending: false
          }));
          return;
        }

        const currentInputForAgent = messageInputValue;
        const currentFileDataUriForAgent = file?.type.startsWith("image/") ? getState().selectedFileDataUri : undefined;
        const currentAudioDataUriForAgent = audioDataUri;

        set({ inputValue: "" });
        getState().clearSelectedFile();

        const agentMessageId = uuidv4();
        const agentMessageTimestamp = new Date();
        const agentOptimisticPayload: ExtendedChatMessageUI = {
          id: agentMessageId, text: "", sender: "agent", status: "pending",
          isStreaming: true, timestamp: agentMessageTimestamp, conversationId: currentConvId,
          appliedUserChatConfig: userChatConfig,
          appliedTestRunConfig: testRunConfig,
        };
        set(state => ({ messages: [...state.messages, agentOptimisticPayload] }));

        const historyForBackend: Message[] = currentMessages // Use passed-in currentMessages for history
          .filter(m => m.status === 'completed')
          .map(uiMsg => ({
            id: uiMsg.id, isUser: uiMsg.sender === 'user', content: uiMsg.text,
            timestamp: uiMsg.timestamp, feedback: uiMsg.feedback,
            imageUrl: uiMsg.imageUrl, fileName: uiMsg.fileName,
            conversationId: uiMsg.conversationId, text: uiMsg.text,
          }));
        historyForBackend.push({
            id: userMessageId, isUser: true, content: currentInputForAgent,
            timestamp: userMessageTimestamp, imageUrl: userMessagePayload.imageUrl,
            fileName: userMessagePayload.fileName, conversationId: currentConvId, text: currentInputForAgent,
        });

        const apiEndpoint = activeChatTarget?.type === 'adk-agent' ? '/api/agent-creator-stream' : '/api/chat-stream';
        const requestBody = {
          userMessage: currentInputForAgent, history: historyForBackend.slice(0, -1), // History excludes current user message for some models
          userId: currentUserId, stream: userChatConfig?.streamingEnabled ?? true,
          fileDataUri: currentFileDataUriForAgent, audioDataUri: currentAudioDataUriForAgent,
          conversationId: currentConvId, agentConfig: activeChatTarget?.config,
          userChatConfig: userChatConfig, testRunConfig: testRunConfig,
        };

        try {
          const response = await fetch(apiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
          if (!response.ok) { throw new Error(`API Error: ${response.status} ${await response.text()}`); }

          const contentType = response.headers.get("content-type");
          let finalAgentText = "";

          if (userChatConfig?.streamingEnabled && response.body && (!contentType || !contentType.includes("application/json"))) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedAgentResponse = "";
            while (true) {
              const { done, value } = await reader.read(); if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              accumulatedAgentResponse += chunk;
              set(state => ({
                messages: state.messages.map(m => m.id === agentMessageId ? { ...m, text: accumulatedAgentResponse, isStreaming: true } : m)
              }));
            }
            finalAgentText = accumulatedAgentResponse;
            set(state => ({
              messages: state.messages.map(m => m.id === agentMessageId ? { ...m, status: 'completed', isStreaming: false, text: finalAgentText } : m)
            }));
          } else { // Non-streaming or JSON response
            const data = await response.json();
            const newMessagesToAdd: ExtendedChatMessageUI[] = [];

            // Process Tool Requests and Results first
            if (data.toolRequests && data.toolResults) {
              data.toolRequests.forEach((toolRequest: ToolCallData) => {
                const toolCallMessage: ExtendedChatMessageUI = {
                  id: uuidv4(),
                  sender: 'system', // Or 'tool_request' if you have specific styling
                  text: `Usando ferramenta: ${toolRequest.name}...`,
                  timestamp: new Date(),
                  toolCall: {
                    name: toolRequest.name,
                    input: toolRequest.input as Record<string, any>,
                  },
                  status: 'completed',
                  conversationId: currentConvId,
                };
                newMessagesToAdd.push(toolCallMessage);

                const toolResult = data.toolResults.find((tr: ToolResponseData) => tr.name === toolRequest.name);
                if (toolResult) {
                  const isError = toolResult.status === 'error';
                  const responseText = isError
                    ? `Erro na ferramenta ${toolResult.name}: ${toolResult.errorDetails?.message || 'Erro desconhecido'}`
                    : `Resultado da ferramenta ${toolResult.name}: ${typeof toolResult.output === 'object' ? JSON.stringify(toolResult.output, null, 2) : toolResult.output}`;

                  const toolResponseMessage: ExtendedChatMessageUI = {
                    id: uuidv4(),
                    sender: 'system', // Or 'tool_response'
                    text: responseText,
                    timestamp: new Date(),
                    toolResponse: {
                      name: toolResult.name,
                      output: !isError ? toolResult.output : undefined,
                      errorDetails: isError ? (toolResult.errorDetails as ErrorDetails) : undefined,
                      status: toolResult.status as 'success' | 'error' | 'pending',
                    },
                    status: 'completed',
                    conversationId: currentConvId,
                  };
                  newMessagesToAdd.push(toolResponseMessage);
                }
              });
            }

            if (data.outputMessage) {
              finalAgentText = data.outputMessage;
              const agentResponseMessage: ExtendedChatMessageUI = {
                ...agentOptimisticPayload, // Uses original agentMessageId and configs
                id: agentMessageId,
                text: finalAgentText,
                status: 'completed',
                isStreaming: false,
              };
              newMessagesToAdd.push(agentResponseMessage); // Add this to newMessages, replacing the pending one later
            }

            if (data.chatEvents && Array.isArray(data.chatEvents)) {
              data.chatEvents.forEach((event: any) => {
                const chatEventMessage: ExtendedChatMessageUI = {
                  id: event.id || uuidv4(),
                  type: 'event',
                  sender: 'system',
                  text: event.eventDetails || event.eventTitle,
                  timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
                  status: 'completed',
                  conversationId: currentConvId,
                  eventType: event.eventType,
                  eventTitle: event.eventTitle,
                  eventDetails: event.eventDetails,
                  toolName: event.toolName,
                  callbackType: event.callbackType,
                  callbackAction: event.callbackAction,
                  originalData: event.originalData,
                  modifiedData: event.modifiedData,
                };
                newMessagesToAdd.push(chatEventMessage);
              });
            }

            // Update messages state: remove pending agent message, add all new messages
            set(state => ({
              messages: [...state.messages.filter(m => m.id !== agentMessageId), ...newMessagesToAdd]
            }));

            // Persist relevant new messages (main agent response, tool calls/responses if desired)
            for (const msg of newMessagesToAdd) {
              if ((msg.sender === 'agent' && msg.id === agentMessageId) || msg.sender === 'system') { // Example: persist agent response and system/tool messages
                const messageToPersist: Message = {
                  id: msg.id,
                  isUser: false, // agent and system are not user
                  content: msg.text,
                  timestamp: msg.timestamp,
                  conversationId: currentConvId!,
                  text: msg.text,
                  toolCall: msg.toolCall,
                  toolResponse: msg.toolResponse,
                  // Map other relevant fields if your Message type supports them
                };
                await conversationStorage.addMessage(currentConvId!, messageToPersist);
              }
            }
          }

          const agentMessageToPersist: Message = {
              id: agentMessageId, isUser: false, content: finalAgentText,
              timestamp: agentMessageTimestamp, conversationId: currentConvId, text: finalAgentText,
          };
          await conversationStorage.addMessage(currentConvId, agentMessageToPersist);
          // setMessages is already handled by the optimistic updates for the agent message becoming complete

          if (currentConvId && finalAgentText) {
            set(state => ({
              conversations: state.conversations.map(c => c.id === currentConvId ? ({ ...c, updatedAt: new Date(), lastMessagePreview: finalAgentText.substring(0,50) }) : c)
            }));
          }
        } catch (error: any) {
            console.error("Error during agent response:", error);
            const errorMsg = error.message || "Agent response error.";
            set(state => ({
              messages: state.messages.map(m => m.id === agentMessageId ? { ...m, status: 'error', isStreaming: false, text: errorMsg, isError: true } : m)
            }));
            // Persist error message
            if (currentConvId) {
              const agentErrorPersistObject: Message = {
                id: agentMessageId, content: errorMsg, isUser: false,
                timestamp: agentMessageTimestamp, conversationId: currentConvId, text: errorMsg,
              };
              conversationStorage.addMessage(currentConvId, agentErrorPersistObject).catch(err => console.error("Failed to persist agent error message:", err));
            }
            toast({title: "Error", description: errorMsg, variant: "destructive"});
        } finally {
          set({ isPending: false });
        }
      },

      handleFeedback: async (
        conversationId, // No longer from get().activeConversationId directly
        messageId,
        feedback,
        currentMessages // Passed in
      ) => {
        const { set, getState } = useChatStore; // Direct access to set and getState

        if (!conversationId) {
          toast({ title: "Error", description: "No active conversation.", variant: "destructive" });
          return;
        }

        const originalMessage = currentMessages.find(msg => msg.id === messageId);
        const originalFeedback = originalMessage?.feedback || null;

        // Optimistically update UI (components will use useOptimistic based on store's `messages`)
        // For the store, we directly update the "true" state after DB operations.
        // However, to allow components to react, we can update the store's messages array here,
        // and it acts as the "true" state that useOptimistic would be based on.

        // Simulate optimistic update by updating the store's true state for now
        set(state => ({
          messages: state.messages.map(msg =>
            msg.id === messageId ? { ...msg, feedback } : msg
          )
        }));

        try {
          await conversationStorage.updateMessageFeedback(conversationId, messageId, feedback);
          // True state already updated above for simplicity in this step.
          // In a more complex setup, you might only call set() here after successful DB op.

          const messageToUpdate = getState().messages.find(m => m.id === messageId);

          if (feedback === 'disliked' && messageToUpdate && messageToUpdate.sender !== 'user') {
            set({ waitingForFeedbackOnMessageId: messageId });

            const feedbackRequestMessage: ExtendedChatMessageUI = {
              id: uuidv4(),
              text: "Por que você recusou esta sugestão?",
              sender: 'system',
              timestamp: new Date(),
              status: 'completed', // Or 'delivered'
              conversationId: conversationId,
            };
            set(state => {
              const msgs = [...state.messages];
              const dislikedMessageIndex = msgs.findIndex(m => m.id === messageId);
              if (dislikedMessageIndex !== -1) {
                msgs.splice(dislikedMessageIndex + 1, 0, feedbackRequestMessage);
              } else {
                msgs.push(feedbackRequestMessage);
              }
              return { messages: msgs };
            });
            // TODO: Persist feedbackRequestMessage if necessary
            // await conversationStorage.addMessage(conversationId, { ... });
          } else if (getState().waitingForFeedbackOnMessageId === messageId && (feedback === 'liked' || feedback === null)) {
            set({ waitingForFeedbackOnMessageId: null });
            set(state => {
              const msgs = [...state.messages];
              const dislikedMessageIndex = msgs.findIndex(m => m.id === messageId);
              if (dislikedMessageIndex !== -1 && dislikedMessageIndex + 1 < msgs.length) {
                const potentialQuestionMessage = msgs[dislikedMessageIndex + 1];
                if (potentialQuestionMessage.sender === 'system' && potentialQuestionMessage.text === "Por que você recusou esta sugestão?") {
                  return { messages: msgs.filter(m => m.id !== potentialQuestionMessage.id) };
                  // TODO: If question was persisted, delete from DB.
                  // await conversationStorage.deleteMessage(conversationId, potentialQuestionMessage.id);
                }
              }
              return {}; // No change if question not found
            });
          }
        } catch (error) {
          console.error("Error updating feedback:", error);
          toast({ title: "Error", description: "Failed to save feedback.", variant: "destructive" });
          // Revert optimistic update on error
          set(state => ({
            messages: state.messages.map(msg =>
              msg.id === messageId ? { ...msg, feedback: originalFeedback } : msg
            )
          }));
        }
      },

      handleRegenerate: async (
        messageIdToRegenerate,
        activeChatTarget,
        currentUserId,
        activeConversationId, // Passed in
        currentMessages, // Passed in
        testRunConfig,
        userChatConfig
      ) => {
        const { set, getState } = useChatStore;

        if (!currentUserId || !activeConversationId) {
          toast({ title: "Error", description: "User or conversation not identified.", variant: "destructive" });
          return;
        }

        const agentMessageIndex = currentMessages.findIndex(msg => msg.id === messageIdToRegenerate && msg.sender === 'agent');
        if (agentMessageIndex === -1) {
          toast({ title: "Error", description: "Agent message to regenerate not found.", variant: "destructive" });
          return;
        }

        let userPromptIndex = -1;
        for (let i = agentMessageIndex - 1; i >= 0; i--) {
          if (currentMessages[i].sender === 'user') {
            userPromptIndex = i;
            break;
          }
        }
        if (userPromptIndex === -1) {
          toast({ title: "Error", description: "Original user prompt not found.", variant: "destructive" });
          return;
        }
        const userPromptMessage = currentMessages[userPromptIndex];

        set({ isPending: true });

        const messagesToRemove = currentMessages.slice(agentMessageIndex);
        // Optimistic update in component: user would filter these out using useOptimistic
        // True state update:
        set(state => ({
          messages: state.messages.filter(m => !messagesToRemove.find(r => r.id === m.id))
        }));

        for (const msgToRemove of messagesToRemove) {
          try {
            await conversationStorage.deleteMessage(activeConversationId, msgToRemove.id);
          } catch (error) {
            console.error(`Failed to delete message ${msgToRemove.id} from DB:`, error);
          }
        }

        const historyForBackend: Message[] = currentMessages
          .slice(0, userPromptIndex + 1)
          .filter(m => m.status === 'completed')
          .map(uiMsg => ({
            id: uiMsg.id, isUser: uiMsg.sender === 'user', content: uiMsg.text,
            timestamp: uiMsg.timestamp, feedback: uiMsg.feedback,
            imageUrl: uiMsg.imageUrl, fileName: uiMsg.fileName,
            conversationId: uiMsg.conversationId, text: uiMsg.text,
          }));

        const currentFileDataUriForAgent = userPromptMessage.imageUrl ? userPromptMessage.imageUrl : (userPromptMessage.fileName ? "file_placeholder_for_non_image" : undefined);

        const newAgentMessageId = uuidv4();
        const newAgentTimestamp = new Date();
        const newAgentOptimisticPayload: ExtendedChatMessageUI = {
          id: newAgentMessageId, text: "", sender: "agent", status: "pending",
          isStreaming: true, timestamp: newAgentTimestamp, conversationId: activeConversationId,
          appliedUserChatConfig: userPromptMessage.appliedUserChatConfig || userChatConfig,
          appliedTestRunConfig: userPromptMessage.appliedTestRunConfig || testRunConfig,
        };
        set(state => ({ messages: [...state.messages, newAgentOptimisticPayload] }));

        const apiEndpoint = activeChatTarget?.type === 'adk-agent' ? '/api/agent-creator-stream' : '/api/chat-stream';
        const requestBody = {
          userMessage: userPromptMessage.text,
          history: historyForBackend.slice(0, -1),
          userId: currentUserId, stream: userChatConfig?.streamingEnabled ?? true,
          fileDataUri: currentFileDataUriForAgent,
          conversationId: activeConversationId,
          agentConfig: activeChatTarget?.config,
          userChatConfig: userPromptMessage.appliedUserChatConfig || userChatConfig,
          testRunConfig: userPromptMessage.appliedTestRunConfig || testRunConfig,
        };

        try {
          const response = await fetch(apiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
          if (!response.ok) { throw new Error(`API Error: ${response.status} ${await response.text()}`); }

          const contentType = response.headers.get("content-type");
          let finalAgentText = "";

          if (userChatConfig?.streamingEnabled && response.body && (!contentType || !contentType.includes("application/json"))) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedAgentResponse = "";
            while (true) {
              const { done, value } = await reader.read(); if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              accumulatedAgentResponse += chunk;
              set(state => ({
                messages: state.messages.map(m => m.id === newAgentMessageId ? { ...m, text: accumulatedAgentResponse, isStreaming: true } : m)
              }));
            }
            finalAgentText = accumulatedAgentResponse;
            set(state => ({
              messages: state.messages.map(m => m.id === newAgentMessageId ? { ...m, status: 'completed', isStreaming: false, text: finalAgentText } : m)
            }));
          } else {
            const data = await response.json();
            finalAgentText = data.outputMessage || (data.toolResults ? JSON.stringify(data.toolResults) : "No textual output from non-streaming JSON response.");
            set(state => ({
              messages: state.messages.map(m => m.id === newAgentMessageId ? { ...m, status: 'completed', isStreaming: false, text: finalAgentText } : m)
            }));
          }

          const agentMessageToPersist: Message = {
              id: newAgentMessageId, isUser: false, content: finalAgentText,
              timestamp: newAgentTimestamp, conversationId: activeConversationId, text: finalAgentText,
          };
          await conversationStorage.addMessage(activeConversationId, agentMessageToPersist);

          if (activeConversationId && finalAgentText) {
            set(state => ({
              conversations: state.conversations.map(c => c.id === activeConversationId ? ({ ...c, updatedAt: new Date(), lastMessagePreview: finalAgentText.substring(0,50) }) : c)
            }));
          }
        } catch (error: any) {
            console.error("Error during agent response regeneration:", error);
            const errorMsg = error.message || "Agent response regeneration error.";
            set(state => ({
              messages: state.messages.map(m => m.id === newAgentMessageId ? { ...m, status: 'error', isStreaming: false, text: errorMsg, isError: true } : m)
            }));
            if (activeConversationId) {
              const agentErrorPersistObject: Message = {
                id: newAgentMessageId, content: errorMsg, isUser: false,
                timestamp: newAgentTimestamp, conversationId: activeConversationId, text: errorMsg,
              };
              conversationStorage.addMessage(activeConversationId, agentErrorPersistObject).catch(err => console.error("Failed to persist agent error message:", err));
            }
            toast({title: "Error", description: errorMsg, variant: "destructive"});
        } finally {
          set({ isPending: false });
        }
      },

      clearSelectedFile: () => set({ selectedFile: null, selectedFileName: null, selectedFileDataUri: null }),
    }),
    // {
    //   name: 'chat-storage', // name of the item in the storage (must be unique)
    //   storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    //   partialize: (state) => ({ activeConversationId: state.activeConversationId }), // Persist only activeConversationId
    // }
  // )
);

// TODO: Move detailed logic for submitMessage, handleFeedback, handleRegenerate from use-chat-store.ts
// into the actions above, adapting for Zustand's set/get and ensuring dependencies like router/auth are handled.
// The useOptimistic hook logic needs to be managed carefully: components will use useOptimistic
// based on the "true" state from this store, and actions here will update the true state.
