import { useState, useEffect, useCallback, useOptimistic } from 'react';
import { Conversation, ChatMessageUI, Message, MessageFeedback, ToolCallData, ToolResponseData, ErrorDetails } from '@/types/chat';
// import { User } from 'firebase/auth'; // No longer directly needed for User type here
import { v4 as uuidv4 } from 'uuid';
import {
  getAllConversations,
  getConversationById,
  createNewConversation,
  deleteConversationFromStorage,
  renameConversationInStorage,
  addMessageToConversation,
  updateMessageFeedback,
  deleteMessageFromConversation,
  // finalizeMessageInConversation, // Not used in this hook, but available from service
} from '@/services/indexed-db-conversation-service'; // UPDATED IMPORT
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
// import { Timestamp } from 'firebase/firestore'; // No longer needed

// Define ExtendedChatMessageUI and OptimisticUpdateAction
export interface ExtendedChatMessageUI extends ChatMessageUI {
  isStreaming?: boolean;
  isError?: boolean;
  imageUrl?: string;
  fileName?: string;
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
  config: any;
}
type TestRunConfig = any;


export interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ExtendedChatMessageUI[];
  optimisticMessages: ExtendedChatMessageUI[];
  isPending: boolean;
  isLoadingMessages: boolean;
  isLoadingConversations: boolean;
  inputContinuation: any;
  selectedFile: File | null;
  selectedFileName: string | null;
  selectedFileDataUri: string | null;
  currentUserId: string | undefined;
  inputValue: string;
  waitingForFeedbackOnMessageId: string | null; // Added

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
  setWaitingForFeedbackOnMessageId: React.Dispatch<React.SetStateAction<string | null>>; // Added

  handleNewConversation: (defaultTitle?: string) => Promise<Conversation | null>; // Added optional param
  handleSelectConversation: (conversationId: string) => void;
  handleDeleteConversation: (conversationId: string) => Promise<void>;
  handleRenameConversation: (conversationId: string, newTitle: string) => Promise<void>;

  submitMessage: (messageInputValue: string, activeChatTarget?: ActiveChatTarget | null, testRunConfig?: TestRunConfig) => Promise<void>;
  handleFeedback: (messageId: string, feedback: MessageFeedback | null) => Promise<void>; // Corrected type
  handleRegenerate: (messageIdToRegenerate: string, activeChatTarget?: ActiveChatTarget | null, testRunConfig?: TestRunConfig) => Promise<void>;
  clearSelectedFile: () => void;
}


export function useChatStore(): ChatStore {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ExtendedChatMessageUI[]>([]); // True state from DB
  const [isPending, setIsPending] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false);
  const [inputContinuation, setInputContinuation] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileDataUri, setSelectedFileDataUri] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [waitingForFeedbackOnMessageId, setWaitingForFeedbackOnMessageId] = useState<string | null>(null); // Added
  const currentUserId = currentUser?.uid;

  const [optimisticMessages, addOptimisticMessage] = useOptimistic<ExtendedChatMessageUI[], OptimisticUpdateAction>(
    messages, // Initialize optimisticMessages with messages from DB
    (state, action) => {
      switch (action.type) {
        case 'add_message':
          return [...state, action.message];
        case 'update_message_content':
          return state.map(msg =>
            msg.id === action.messageId ? { ...msg, text: (msg.text || "") + action.newContentChunk, isStreaming: true } : msg
          );
        case 'update_message_status':
          return state.map(msg =>
            msg.id === action.messageId ? { ...msg, status: action.newStatus, text: action.newContent !== undefined ? action.newContent : msg.text, isStreaming: action.isStreaming !== undefined ? action.isStreaming : false, isError: action.newStatus === 'error' } : msg
          );
        case 'remove_message':
          return state.filter(msg => msg.id !== action.messageId);
        case 'set_messages':
          return action.messages; // Used to reset or initialize optimistic messages
        case 'update_message_feedback':
          return state.map(msg =>
            msg.id === action.messageId ? { ...msg, feedback: action.feedback } : msg
          );
        default:
          return state;
      }
    }
  );

  // Effect to update messages (true state) when optimisticMessages change AFTER an action
  // This is tricky with useOptimistic. The source of truth `messages` should be updated
  // after successful persistence, not directly from optimisticMessages.
  // So, setMessages will be called in specific handlers after DB operations.

  useEffect(() => {
    if (currentUser?.uid) {
      setIsLoadingConversations(true);
      getAllConversations(currentUser.uid)
        .then((fetchedConversations) => {
          setConversations(fetchedConversations);
        })
        .catch((error) => {
          console.error("Error loading conversations:", error);
          toast({ title: "Error", description: "Failed to load conversations.", variant: "destructive"});
        })
        .finally(() => setIsLoadingConversations(false));
    }
  }, [currentUser?.uid]);

  const handleNewConversation = useCallback(async (defaultTitle: string = "New Chat"): Promise<Conversation | null> => {
    if (!currentUserId) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
      return null;
    }
    try {
      const newConversation = await createNewConversation(currentUserId, defaultTitle);
      setConversations((prevs) => [newConversation, ...prevs]);
      setMessages([]);
      addOptimisticMessage({ type: 'set_messages', messages: [] });
      router.push(`/chat/${newConversation.id}`);
      return newConversation;
    } catch (error) {
      console.error("Error creating new conversation:", error);
      toast({ title: "Error", description: "Failed to create new conversation.", variant: "destructive" });
      return null;
    }
  }, [currentUserId, router, addOptimisticMessage]);

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setIsLoadingMessages(true);
    setInputContinuation(null);

    try {
      const conversation = await getConversationById(conversationId);
      const uiMessages: ExtendedChatMessageUI[] = (conversation?.messages || []).map((dbMessage: Message) => ({
        id: dbMessage.id || uuidv4(),
        text: dbMessage.content || "", // Assuming content is string, adjust if structured
        sender: dbMessage.isUser ? "user" : "agent",
        timestamp: dbMessage.timestamp, // Already a Date object from the service
        status: 'completed',
        feedback: dbMessage.feedback,
        isStreaming: false,
        isError: false,
        conversationId: conversation?.id
      }));
      setMessages(uiMessages); // Set the true state
      addOptimisticMessage({ type: 'set_messages', messages: uiMessages }); // Sync optimistic state
    } catch (error) {
      console.error("Error selecting conversation:", error);
      toast({ title: "Error", description: "Failed to load conversation messages.", variant: "destructive" });
      setMessages([]);
      addOptimisticMessage({ type: 'set_messages', messages: [] });
    } finally {
      setIsLoadingMessages(false);
    }
  }, [addOptimisticMessage]); // Removed router dependency

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    if (!currentUserId) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" }); return;
    }
    try {
      await deleteConversationFromStorage(conversationId);
      setConversations((prevs) => prevs.filter((conv) => conv.id !== conversationId));
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
        addOptimisticMessage({ type: 'set_messages', messages: [] });
        router.push('/chat');
      }
      toast({ title: "Success", description: "Conversation deleted." });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({ title: "Error", description: "Failed to delete conversation.", variant: "destructive" });
    }
  }, [currentUserId, activeConversationId, router, addOptimisticMessage]);

  const handleRenameConversation = useCallback(async (conversationId: string, newTitle: string) => {
    try {
      await renameConversationInStorage(conversationId, newTitle);
      setConversations((prevs) => prevs.map((conv) => (conv.id === conversationId ? { ...conv, title: newTitle } : conv)));
      toast({ title: "Success", description: "Conversation renamed." });
    } catch (error) {
      console.error("Error renaming conversation:", error);
      toast({ title: "Error", description: "Failed to rename conversation.", variant: "destructive" });
    }
  }, []);

  useEffect(() => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const pathConvId = currentPath.startsWith('/chat/') ? currentPath.split('/')[2] : null;

    if (pathConvId && pathConvId !== activeConversationId) {
        setActiveConversationId(pathConvId); // Sync activeId from URL
    }

    // If activeConversationId is set, and messages are not loaded for it (or empty), load them.
    if (activeConversationId &&
        (!messages.length || messages[0]?.conversationId !== activeConversationId || messages.some(m => !m.id)) &&
        !isLoadingMessages) {
      const conversationExists = conversations.find(c => c.id === activeConversationId);
      if (conversationExists) {
        handleSelectConversation(activeConversationId);
      } else if (conversations.length > 0 && !isLoadingConversations) {
        // Active ID from URL is invalid/stale, redirect to first valid conversation
        router.push(`/chat/${conversations[0].id}`);
      }
    } else if (!activeConversationId && pathConvId === null && conversations.length > 0 && !isLoadingConversations && !isLoadingMessages) {
      // No active ID, no ID in path, but conversations are loaded. Select one.
      const lastActiveConversationId = localStorage.getItem('lastActiveConversationId');
      const targetConversation = conversations.find(c => c.id === lastActiveConversationId) || conversations[0];
      if (targetConversation) {
         router.push(`/chat/${targetConversation.id}`); // Navigate, then this effect will re-run and load
      }
    } // Case for no conversations and no active ID: remain on /chat or show empty state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, conversations, isLoadingConversations, isLoadingMessages, router]); // handleSelectConversation removed from deps

  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem('lastActiveConversationId', activeConversationId);
    }
  }, [activeConversationId]);

  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null); setSelectedFileName(null); setSelectedFileDataUri(null);
  }, []);

  const submitMessage = async ( messageInputValue: string, activeChatTarget?: ActiveChatTarget | null, testRunConfig?: TestRunConfig) => {
    // --- Feedback Capture Mode ---
    // Check if the store is currently waiting for feedback on a specific message.
    // If so, the current input is treated as the feedback reason.
    if (waitingForFeedbackOnMessageId) {
      console.log(`User feedback for message ${waitingForFeedbackOnMessageId}: ${messageInputValue}`);
      toast({ title: "Feedback Recebido", description: `Obrigado: "${messageInputValue}"`});

      // Optionally: Store this feedback more permanently.
      // This could involve updating the original disliked message object in the DB
      // or sending the feedback to an analytics service.
      // For now, we'll add a confirmation message to the chat UI.

      const originalMessageIndex = messages.findIndex(m => m.id === waitingForFeedbackOnMessageId);
      if (originalMessageIndex !== -1 && activeConversationId) { // Ensure activeConversationId is available
        const feedbackConfirmationMessage: ExtendedChatMessageUI = {
          id: uuidv4(),
          text: `Obrigado pelo seu feedback: "${messageInputValue}"`,
          sender: 'system', // Or 'assistant'
          timestamp: new Date(),
          status: 'delivered',
          conversationId: activeConversationId, // Assign to current conversation
        };

        // Add confirmation message optimistically and to true state
        addOptimisticMessage({ type: 'add_message', message: feedbackConfirmationMessage });
        setMessages(prev => {
          const msgs = [...prev];
          // Attempt to insert the confirmation message after the feedback question.
          // The feedback question is expected to be at originalMessageIndex + 1.
          // So, the confirmation message goes to originalMessageIndex + 2.
          // A more robust approach might involve searching for the question message by ID if it had one.
          const confirmationIndex = originalMessageIndex + 2;
          if (confirmationIndex <= msgs.length) {
            msgs.splice(confirmationIndex, 0, feedbackConfirmationMessage);
          } else {
            msgs.push(feedbackConfirmationMessage); // Fallback: append if index is out of bounds
          }
          return msgs;
        });
        // TODO: Consider persisting the feedbackConfirmationMessage to DB for history consistency.
        // await addMessageToConversation(activeConversationId, { ...feedbackConfirmationMessage, isUser: false, content: feedbackConfirmationMessage.text });
      }

      // Reset feedback mode
      setWaitingForFeedbackOnMessageId(null);
      setInputValue(""); // Clear the input field as the feedback has been captured
      setIsPending(false); // Ensure pending state is reset if it was set before entering feedback mode
      return; // Important: Bypass normal message submission flow
    }

    // --- Normal Message Submission Flow ---
    if (!currentUserId) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
      return;
    }
    if (!messageInputValue.trim() && !selectedFile) { /* ... */ return; }

    setIsPending(true);
    const userMessageId = uuidv4();
    const userMessageTimestamp = new Date();
    const userMessagePayload: ExtendedChatMessageUI = {
      id: userMessageId, text: messageInputValue, sender: "user", status: "pending",
      timestamp: userMessageTimestamp,
      imageUrl: selectedFile?.type.startsWith("image/") ? selectedFileDataUri : undefined,
      fileName: selectedFileName || undefined,
    };
    addOptimisticMessage({ type: "add_message", message: userMessagePayload });

    let currentConvId = activeConversationId;
    if (!currentConvId) {
      const newConv = await handleNewConversation(activeChatTarget?.name || messageInputValue.substring(0, 30) || "New Chat");
      if (newConv) currentConvId = newConv.id;
      else { /* revert, set pending false, return */
        addOptimisticMessage({ type: "remove_message", messageId: userMessageId });
        setIsPending(false); return;
      }
    }
    if (!currentConvId) { /* error, revert, set pending false, return */
        toast({ title: "Error", description: "No active conversation selected.", variant: "destructive" });
        addOptimisticMessage({ type: "remove_message", messageId: userMessageId });
        setIsPending(false); return;
    }
    userMessagePayload.conversationId = currentConvId; // Add convId after it's confirmed

    try {
      const userMessageToPersist: Message = {
        id: userMessageId, isUser: true, content: messageInputValue,
        timestamp: userMessageTimestamp, // Use Date object directly
        imageUrl: userMessagePayload.imageUrl, fileName: userMessagePayload.fileName,
        conversationId: currentConvId,
        // Ensure other fields like 'text' are aligned if Message type expects it
        // For IndexedDB service, content is the primary text field.
        text: messageInputValue,
      };
      await addMessageToConversation(currentConvId, userMessageToPersist);
      // Update true `messages` state
      setMessages(prev => [...prev, { ...userMessagePayload, status: 'completed' }]);
      addOptimisticMessage({ type: 'update_message_status', messageId: userMessageId, newStatus: 'completed' });
      setConversations(prev => prev.map(c => c.id === currentConvId ? ({ ...c, updatedAt: new Date(), lastMessagePreview: messageInputValue.substring(0,50) }) : c));
    } catch (error) { /* error handling, revert optimistic, set pending false */
        console.error("Error persisting user message:", error);
        toast({ title: "Error", description: "Failed to send your message.", variant: "destructive" });
        addOptimisticMessage({ type: "update_message_status", messageId: userMessageId, newStatus: "error", newContent: messageInputValue });
        setIsPending(false); return;
    }

    const currentInputForAgent = messageInputValue;
    const currentFileDataUriForAgent = selectedFileDataUri;
    setInputValue(""); clearSelectedFile();

    const agentMessageId = uuidv4();
    const agentMessageTimestamp = new Date();
    const agentOptimisticPayload: ExtendedChatMessageUI = {
      id: agentMessageId, text: "", sender: "agent", status: "pending",
      isStreaming: true, timestamp: agentMessageTimestamp, conversationId: currentConvId,
    };
    addOptimisticMessage({ type: "add_message", message: agentOptimisticPayload });

    const historyForBackend: Message[] = messages // Use true `messages` state for history
      .filter(m => m.status === 'completed') // only completed from true state
      .map(uiMsg => ({
        id: uiMsg.id, isUser: uiMsg.sender === 'user', content: uiMsg.text,
        timestamp: uiMsg.timestamp, // Use Date object directly
        feedback: uiMsg.feedback,
        imageUrl: uiMsg.imageUrl, fileName: uiMsg.fileName,
        conversationId: uiMsg.conversationId,
        text: uiMsg.text, // Ensure text field if Message type expects it
      }));
    // Add the current user message to history as it's now completed
    historyForBackend.push({
        id: userMessageId, isUser: true, content: currentInputForAgent,
        timestamp: userMessageTimestamp, // Use Date object directly
        imageUrl: userMessagePayload.imageUrl, fileName: userMessagePayload.fileName,
        conversationId: currentConvId,
        text: currentInputForAgent, // Ensure text field
    });


    let apiEndpoint = activeChatTarget?.type === 'adk-agent' ? '/api/agent-creator-stream' : '/api/chat-stream';
    const requestBody = {
      userMessage: currentInputForAgent, history: historyForBackend, userId: currentUserId, stream: true, // stream: true might be problematic if we expect a JSON object with tool data
      fileDataUri: currentFileDataUriForAgent, conversationId: currentConvId,
      agentConfig: activeChatTarget?.config, testRunConfig: testRunConfig,
    };

    try {
      const response = await fetch(apiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      if (!response.ok) { throw new Error(`API Error: ${response.status} ${await response.text()}`); }

      // Check content type to decide how to process
      const contentType = response.headers.get("content-type");
      let finalAgentText = "";
      const newMessagesToAdd: ExtendedChatMessageUI[] = [];

      if (contentType && contentType.includes("application/json")) {
        const data = await response.json(); // Assuming BasicChatOutput structure

        // Process Tool Requests and Results first
        if (data.toolRequests && data.toolResults) {
          data.toolRequests.forEach((toolRequest: ToolCallData) => { // Assuming ChatToolRequest is compatible with ToolCallData
            const toolCallMessage: ExtendedChatMessageUI = {
              id: uuidv4(),
              sender: 'system',
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

            // Find corresponding toolResult
            // Assuming 'ref' is used for matching, or fallback to name/order if not.
            // For this implementation, let's assume order or a direct match by name if ref is not robustly implemented/available.
            // A more robust solution would use 'toolRequest.ref' if available on both request and result.
            const toolResult = data.toolResults.find((tr: ToolResponseData) => tr.name === toolRequest.name); // Simplified matching

            if (toolResult) {
              // Assuming toolResult is of type ToolExecutionResult from chat-flow.ts which now has errorDetails
              const isError = toolResult.status === 'error';
              const responseText = isError
                ? `Erro na ferramenta ${toolResult.name}: ${toolResult.errorDetails ? toolResult.errorDetails.message : 'Erro desconhecido'}`
                : `Resultado da ferramenta ${toolResult.name}: ${typeof toolResult.output === 'object' ? JSON.stringify(toolResult.output, null, 2) : toolResult.output}`;

              const toolResponseMessage: ExtendedChatMessageUI = {
                id: uuidv4(),
                sender: 'system',
                text: responseText,
                timestamp: new Date(),
                toolResponse: { // This should conform to ToolResponseData from @/types/chat
                  name: toolResult.name,
                  output: !isError ? toolResult.output : undefined, // Only set output if not an error
                  errorDetails: isError ? (toolResult.errorDetails as ErrorDetails) : undefined, // Pass the full ErrorDetails object
                  status: toolResult.status as 'success' | 'error' | 'pending', // status is non-optional in ToolResponseData
                },
                status: 'completed', // Message status itself
                conversationId: currentConvId,
              };
              newMessagesToAdd.push(toolResponseMessage);
            }
          });
        }

        if (data.outputMessage) {
          finalAgentText = data.outputMessage;
          const agentResponseMessage: ExtendedChatMessageUI = {
            ...agentOptimisticPayload, // Use the ID of the pending message
            id: agentMessageId,
            text: finalAgentText,
            status: 'completed',
            isStreaming: false,
          };
          newMessagesToAdd.push(agentResponseMessage);
        }

        // Update optimistic messages: remove pending, add all new ones
        addOptimisticMessage({ type: 'remove_message', messageId: agentMessageId });
        newMessagesToAdd.forEach(msg => {
          // Ensure msg includes conversationId
          const messageWithConvId = { ...msg, conversationId: currentConvId };
          addOptimisticMessage({ type: 'add_message', message: messageWithConvId });
        });

        // Persist new messages to Firestore (tool calls, tool responses, final agent message)
        // This part needs careful implementation to match Firestore structure
        for (const msg of newMessagesToAdd) {
          const messageToPersist: Message = {
            id: msg.id,
            isUser: msg.sender === 'user',
            content: msg.text,
            timestamp: msg.timestamp, // Use Date object directly
            conversationId: currentConvId,
            text: msg.text, // Ensure text field
            // Map toolCall/toolResponse if needed
            // For now, assuming content/text is sufficient for display.
          };
          if (msg.sender !== 'user') { // User message already persisted
             await addMessageToConversation(currentConvId, messageToPersist);
          }
        }
        setMessages(prev => [...prev.filter(m => m.id !== agentMessageId), ...newMessagesToAdd]);


      } else { // Fallback to existing streaming logic if not JSON
        const reader = response.body?.getReader(); const decoder = new TextDecoder();
        let accumulatedAgentResponse = "";
        if (reader) {
          while (true) {
            const { done, value } = await reader.read(); if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            accumulatedAgentResponse += chunk;
            addOptimisticMessage({ type: "update_message_content", messageId: agentMessageId, newContentChunk: chunk });
          }
        }
        finalAgentText = accumulatedAgentResponse;
        const finalAgentPayload: ExtendedChatMessageUI = { ...agentOptimisticPayload, text: finalAgentText, status: 'completed', isStreaming: false};
        addOptimisticMessage({ type: "update_message_status", messageId: agentMessageId, status: "completed", isStreaming: false, newContent: finalAgentText });

        const agentMessageToPersist: Message = {
            id: agentMessageId, isUser: false, content: finalAgentText,
            timestamp: agentMessageTimestamp, // Use Date object directly
            conversationId: currentConvId,
            text: finalAgentText, // Ensure text field
        };
        await addMessageToConversation(currentConvId, agentMessageToPersist);
        setMessages(prev => [...prev, finalAgentPayload]);
      }

      // Common post-processing for both JSON and stream paths
      if (currentConvId && finalAgentText) { // Ensure there's an agent text to update preview
         setConversations(prev => prev.map(c => c.id === currentConvId ? ({ ...c, updatedAt: new Date(), lastMessagePreview: finalAgentText.substring(0,50) }) : c));
      }

    } catch (error: any) {
        console.error("Error during agent response:", error);
        const errorMsg = error.message || "Agent response error.";
        addOptimisticMessage({ type: "update_message_status", messageId: agentMessageId, status: "error", isStreaming: false, newContent: errorMsg });

        // Persist the agent error message
        if (currentConvId) {
          const agentErrorMessageObject: ExtendedChatMessageUI = {
            id: agentMessageId,
            text: errorMsg,
            sender: "agent",
            status: "error",
            isStreaming: false,
            isError: true,
            timestamp: agentMessageTimestamp, // Ensure this is available in scope
            conversationId: currentConvId,
          };
          setMessages(prev => [...prev, agentErrorMessageObject]);

          const agentErrorPersistObject: Message = { // Renamed for clarity
            id: agentMessageId,
            content: errorMsg,
            isUser: false,
            timestamp: agentMessageTimestamp, // Use Date object directly. Ensure this is available
            conversationId: currentConvId,
            text: errorMsg, // Ensure text field
          };
          addMessageToConversation(currentConvId, agentErrorPersistObject)
            .catch(err => {
              console.error("Failed to persist agent error message to IndexedDB:", err);
              // Optionally, toast another error or handle this failure
            });
        }

        toast({title: "Error", description: errorMsg, variant: "destructive"});
    } finally {
      setIsPending(false);
    }
  };

  const handleFeedback = async (messageId: string, feedback: MessageFeedback | null) => {
    if (!activeConversationId) {
      toast({ title: "Error", description: "No active conversation.", variant: "destructive" });
      return;
    }
    const originalMessage = messages.find(msg => msg.id === messageId);
    const originalFeedback = originalMessage?.feedback || null; // Store original feedback for potential revert

    // Optimistically update the UI
    addOptimisticMessage({ type: "update_message_feedback", messageId, feedback });

    try {
      // Attempt to persist the feedback to the database
      await updateMessageFeedback(activeConversationId, messageId, feedback);

      // If successful, update the true `messages` state to reflect the change
      const updatedMessagesTrueState = messages.map(msg =>
        msg.id === messageId ? { ...msg, feedback } : msg
      );
      setMessages(updatedMessagesTrueState);

      // --- Feedback Loop Logic ---
      const messageToUpdate = updatedMessagesTrueState.find(m => m.id === messageId);

      // If an agent's message is disliked, set the state to wait for feedback reason
      // and inject a system message asking for clarification.
      if (feedback === 'disliked' && messageToUpdate && messageToUpdate.sender !== 'user') {
        setWaitingForFeedbackOnMessageId(messageId); // Set that we are now waiting for feedback for this message

        const feedbackRequestMessage: ExtendedChatMessageUI = {
          id: uuidv4(), // Generate a unique ID for the system message
          text: "Por que você recusou esta sugestão?",
          sender: 'system', // Or 'assistant', depending on desired UI styling
          timestamp: new Date(),
          status: 'delivered', // System messages are considered delivered
          conversationId: activeConversationId, // Associate with the current conversation
        };

        // Add the feedback request message optimistically and to the true messages state
        addOptimisticMessage({ type: 'add_message', message: feedbackRequestMessage });
        setMessages(prev => {
          const msgs = [...prev];
          const dislikedMessageIndex = msgs.findIndex(m => m.id === messageId);
          // Insert the question right after the disliked message
          if (dislikedMessageIndex !== -1) {
            msgs.splice(dislikedMessageIndex + 1, 0, feedbackRequestMessage);
          } else {
            msgs.push(feedbackRequestMessage); // Fallback: append if original somehow not found
          }
          return msgs;
        });

        // TODO: Consider if this system message ("Por que você recusou...") should be persisted to DB.
        // If so, call: await addMessageToConversation(activeConversationId, { ...feedbackRequestMessage, isUser: false, content: feedbackRequestMessage.text });

      } else if (waitingForFeedbackOnMessageId === messageId && (feedback === 'liked' || feedback === null)) {
        // If the user changes their mind (e.g., likes a previously disliked message for which a question was asked, or removes feedback)
        // and we are currently waiting for feedback on THAT message:
        // 1. Reset the waiting state.
        // 2. Remove the "Por que você recusou..." question message.
        setWaitingForFeedbackOnMessageId(null);

        // Find and remove the feedback question message.
        // This assumes the question message is identifiable (e.g., immediately follows the original message and has specific text).
        // A more robust way would be to store the ID of the question message when it's created and use that ID for removal.
        const dislikedMessageIndex = updatedMessagesTrueState.findIndex(m => m.id === messageId);
        if (dislikedMessageIndex !== -1 && dislikedMessageIndex + 1 < updatedMessagesTrueState.length) {
          const potentialQuestionMessage = updatedMessagesTrueState[dislikedMessageIndex + 1];
          if (potentialQuestionMessage.sender === 'system' && potentialQuestionMessage.text === "Por que você recusou esta sugestão?") {
            addOptimisticMessage({ type: 'remove_message', messageId: potentialQuestionMessage.id });
            setMessages(prev => prev.filter(m => m.id !== potentialQuestionMessage.id));
            // TODO: If the question message was persisted, remove it from DB here.
            // await deleteMessageFromConversation(activeConversationId, potentialQuestionMessage.id);
          }
        }
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast({ title: "Error", description: "Failed to save feedback.", variant: "destructive" });
      // Revert optimistic update on error
      addOptimisticMessage({ type: "update_message_feedback", messageId, feedback: originalFeedback });
    }
  };

  const handleRegenerate = async (messageIdToRegenerate: string, activeChatTarget?: ActiveChatTarget | null, testRunConfig?: TestRunConfig) => {
    if (!currentUserId || !activeConversationId) {
      toast({ title: "Error", description: "User or conversation not identified.", variant: "destructive" });
      return;
    }

    const agentMessageIndex = optimisticMessages.findIndex(msg => msg.id === messageIdToRegenerate && msg.sender === 'agent');
    if (agentMessageIndex === -1) {
      toast({ title: "Error", description: "Agent message to regenerate not found.", variant: "destructive" });
      return;
    }

    let userPromptIndex = -1;
    for (let i = agentMessageIndex - 1; i >= 0; i--) {
      if (optimisticMessages[i].sender === 'user') {
        userPromptIndex = i;
        break;
      }
    }
    if (userPromptIndex === -1) {
      toast({ title: "Error", description: "Original user prompt not found.", variant: "destructive" });
      return;
    }
    const userPromptMessage = optimisticMessages[userPromptIndex];

    setIsPending(true);

    // Optimistically remove messages from the agent message to be regenerated onwards
    const messagesToRemove = optimisticMessages.slice(agentMessageIndex);
    for (const msgToRemove of messagesToRemove) {
      addOptimisticMessage({ type: "remove_message", messageId: msgToRemove.id });
    }

    // Actual deletion from DB (can happen in background, errors logged but don't block UI flow)
    for (const msgToRemove of messagesToRemove) {
      try {
        await deleteMessageFromConversation(activeConversationId, msgToRemove.id);
      } catch (error) {
        console.error(`Failed to delete message ${msgToRemove.id} from DB:`, error);
        // Not re-throwing or toasting for these, to keep regeneration flow smooth
      }
    }
    // Update the true `messages` state after removal
    setMessages(prev => prev.slice(0, agentMessageIndex));


    const historyForBackend: Message[] = messages // Use true `messages` state BEFORE regeneration
      .slice(0, userPromptIndex + 1) // History up to and including the user prompt
      .filter(m => m.status === 'completed')
      .map(uiMsg => ({
        id: uiMsg.id, isUser: uiMsg.sender === 'user', content: uiMsg.text,
        timestamp: uiMsg.timestamp, // Use Date object directly
        feedback: uiMsg.feedback,
        imageUrl: uiMsg.imageUrl, fileName: uiMsg.fileName,
        conversationId: uiMsg.conversationId,
        text: uiMsg.text, // Ensure text field
      }));

    // The userPromptMessage.text is the input for this new agent turn.
    // File data from original user prompt (if any) should also be used.
    const currentFileDataUriForAgent = userPromptMessage.imageUrl ? userPromptMessage.imageUrl : (userPromptMessage.fileName ? "file_placeholder_for_non_image" : undefined);


    const newAgentMessageId = uuidv4();
    const newAgentTimestamp = new Date();
    const newAgentOptimisticPayload: ExtendedChatMessageUI = {
      id: newAgentMessageId, text: "", sender: "agent", status: "pending",
      isStreaming: true, timestamp: newAgentTimestamp, conversationId: activeConversationId,
    };
    addOptimisticMessage({ type: "add_message", message: newAgentOptimisticPayload });

    let apiEndpoint = activeChatTarget?.type === 'adk-agent' ? '/api/agent-creator-stream' : '/api/chat-stream';
    const requestBody = {
      userMessage: userPromptMessage.text, // Use original prompt text
      history: historyForBackend.slice(0, -1), // History EXCLUDES the user prompt itself
      userId: currentUserId, stream: true,
      fileDataUri: currentFileDataUriForAgent, // Use original file if any
      conversationId: activeConversationId,
      agentConfig: activeChatTarget?.config, testRunConfig: testRunConfig,
    };

    try {
      const response = await fetch(apiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) });
      if (!response.ok) { throw new Error(`API Error: ${response.status}`); }

      const reader = response.body?.getReader(); const decoder = new TextDecoder();
      let accumulatedAgentResponse = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulatedAgentResponse += chunk;
          addOptimisticMessage({ type: "update_message_content", messageId: newAgentMessageId, newContentChunk: chunk });
        }
      }

      const finalAgentPayload: ExtendedChatMessageUI = { ...newAgentOptimisticPayload, text: accumulatedAgentResponse, status: 'completed', isStreaming: false};
      addOptimisticMessage({ type: "update_message_status", messageId: newAgentMessageId, status: "completed", isStreaming: false, newContent: accumulatedAgentResponse });

      const agentMessageToPersist: Message = {
          id: newAgentMessageId, isUser: false, content: accumulatedAgentResponse,
          timestamp: newAgentTimestamp, // Use Date object directly
          conversationId: activeConversationId,
          text: accumulatedAgentResponse, // Ensure text field
      };
      await addMessageToConversation(activeConversationId, agentMessageToPersist);
      setMessages(prev => [...prev, finalAgentPayload]); // Update true state
      setConversations(prev => prev.map(c => c.id === activeConversationId ? ({ ...c, updatedAt: new Date(), lastMessagePreview: accumulatedAgentResponse.substring(0,50) }) : c));

    } catch (error: any) {
        console.error("Error during agent response regeneration:", error);
        const errorMsg = error.message || "Agent response regeneration error.";
        addOptimisticMessage({ type: "update_message_status", messageId: newAgentMessageId, status: "error", isStreaming: false, newContent: errorMsg });
        toast({title: "Error", description: errorMsg, variant: "destructive"});
    } finally {
      setIsPending(false);
      // Do not clear inputValue or selectedFile here as they were not used for regeneration.
    }
  };

  return {
    conversations, activeConversationId, messages, optimisticMessages, isPending, isLoadingMessages,
    isLoadingConversations, inputContinuation, selectedFile, selectedFileName, selectedFileDataUri,
    currentUserId, inputValue, waitingForFeedbackOnMessageId, // Added
    setConversations, setActiveConversationId, setMessages, setIsPending,
    setIsLoadingMessages, setIsLoadingConversations, setInputContinuation, setSelectedFile,
    setSelectedFileName, setSelectedFileDataUri, setInputValue,
    setWaitingForFeedbackOnMessageId, // Added
    handleNewConversation,
    handleSelectConversation, handleDeleteConversation, handleRenameConversation, submitMessage,
    handleFeedback, handleRegenerate, clearSelectedFile,
  };
}
