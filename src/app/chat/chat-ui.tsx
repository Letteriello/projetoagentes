"use client";

import { Button } from "@/components/ui/button"; // Keep for now, FeatureButton uses it
import { Input } from "@/components/ui/input"; // Keep for now, passed to MessageInputArea
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  User,
  Bot,
  // SparklesIcon, // Removed
  Cpu,
  // RefreshCcw, // Removed
  // MessageSquare, // Removed
  // Paperclip, // Keep, for MessageInputArea
  // Search as SearchIcon, // Keep, for possible search features
  // X, // Keep, for closable elements
  // UploadCloud, // Keep, for MessageInputArea
  // FileUp, // Keep, for MessageInputArea
  // Code2, // Keep, for possible code blocks
  // Image as ImageIcon, // Keep, for image messages
  // Mic, // Keep, for voice input
  Menu,
  Plus,
  Sparkles,
  // Added Send, User, Bot from previous step if they were removed
  Send,
  User,
  Bot,
  Paperclip, // Explicitly keep
  SearchIcon, // Explicitly keep
  X, // Explicitly keep
  UploadCloud, // Explicitly keep
  FileUp, // Explicitly keep
  Code2, // Explicitly keep
  ImageIcon, // Explicitly keep
  Mic, // Explicitly keep
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  useCallback,
  useOptimistic,
  useMemo,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import { useAuth } from "@/contexts/AuthContext"; // Added
import type { AgentConfig, LLMAgentConfig } from "@/app/agent-builder/page";

// Define SavedAgentConfiguration interface to match actual structure used in the app
interface SavedAgentConfiguration {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  config: AgentConfig;
}
// cn unused
// Image unused
// Popover unused
// Separator unused
// Label unused
import { AgentSelector } from "@/components/agent-selector";
import {
  googleADK,
  // GoogleADKType, // Unused
  // sendMessageToAgent, // Unused
} from "@/lib/google-adk";
import ChatHeader from "@/components/features/chat/ChatHeader";
import WelcomeScreen from "@/components/features/chat/WelcomeScreen";
import MessageList from "@/components/features/chat/MessageList";
import MessageInputArea from "@/components/features/chat/MessageInputArea";
import { ChatMessageUI, Conversation } from "@/types/chat";
import ConversationSidebar from "@/components/features/chat/ConversationSidebar";
import { BasicChatInput } from "@/ai/flows/chat-flow";
import { ADKAgentConfig, ADKTool } from "@/lib/google-adk"; // Import ADK types
import * as cs from "@/lib/firestoreConversationStorage"; // Firestore Conversation Storage

// DEBUG: Inspect the imported googleADK object
console.log("Inspecting imported googleADK (top level):", googleADK);

// Define currentUserId - replace with actual auth context later
// const currentUserId = "TEMP_USER_ID"; // Replaced by auth context

interface ChatHistoryMessage {
  role: "user" | "model";
  content: any;
}

// ServerMessage interface is unused

const initialGems = [
  {
    id: "general",
    name: "Assistente Geral",
    prompt: "Você é um assistente prestativo e conciso.",
  },
  {
    id: "creative",
    name: "Escritor Criativo",
    prompt:
      "Você é um escritor criativo, ajude a gerar ideias e textos com um tom inspirador.",
  },
  {
    id: "code",
    name: "Programador Expert",
    prompt:
      "Você é um programador expert, forneça explicações claras e exemplos de código eficientes.",
  },
  {
    id: "researcher",
    name: "Pesquisador Analítico",
    prompt:
      "Você é um pesquisador analítico, foque em dados e informações factuais.",
  },
];

// Define ChatFormState based on the return type of submitChatMessage from actions.ts
interface ChatFormState {
  message: string;
  agentResponse?: string | null;
  errors?: { [key: string]: string[] } | null;
}

// initialChatFormState is unused (ChatFormState interface is kept as it's referenced in a comment, but could be removed too)
// initialActionState is unused
// FeatureButton component is unused
// OptimisticMessageAction type is unused

export function ChatUI() {
  const { currentUser, loading: authLoading } = useAuth(); // Added
  const currentUserId = currentUser?.uid; // Added

  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useOptimistic<
    ChatMessageUI[],
    ChatMessageUI
  >(messages, (currentMessages, optimisticUpdateMessage) => {
    const existingMessageIndex = currentMessages.findIndex(
      (msg) => msg.id === optimisticUpdateMessage.id,
    );

    if (existingMessageIndex !== -1) {
      // Update existing message: Merge new properties.
      const updatedMessage = {
        ...currentMessages[existingMessageIndex],
        ...optimisticUpdateMessage,
        text:
          optimisticUpdateMessage.text !== undefined
            ? optimisticUpdateMessage.text
            : currentMessages[existingMessageIndex].text,
      };
      return currentMessages.map((msg, index) =>
        index === existingMessageIndex ? updatedMessage : msg,
      );
    } else {
      // Add new message
      return [...currentMessages, optimisticUpdateMessage];
    }
  });

  const [chatHistory, setChatHistory] = useState<ChatHistoryMessage[]>([]);
  const [selectedGemId, setSelectedGemId] = useState<string | null>(
    initialGems[0].id,
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>("none");
  const [selectedADKAgentId, setSelectedADKAgentId] = useState<string | null>(
    null,
  );
  const [activeChatTarget, setActiveChatTarget] = useState<string>(
    initialGems[0].name,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [usingADKAgent, setUsingADKAgent] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileDataUri, setSelectedFileDataUri] = useState<string | null>(
    null,
  );

  const [adkAgents, setAdkAgents] = useState<ADKAgentConfig[]>([]);
  const [isADKInitializing, setIsADKInitializing] = useState(true);

  // States for ConversationSidebar
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const { savedAgents } = useAgents();
  // Removed useActionState for submitChatMessage
  // const [formState, runFormAction, isActionPending] = useActionState(
  //   submitChatMessage,
  //   initialChatFormState
  // );

  const [isPending, setIsPending] = useState<boolean>(false); // For streaming fetch. This is the primary pending state now.

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState("");

  // const [lastSentUserMessageInfo, setLastSentUserMessageInfo] = useState<{ id: string; text: string; imageUrl?: string; fileName?: string; timestamp: Date } | null>(null); // For reconciliation

  // Load initial conversations
  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUserId) {
        // Added check for currentUserId
        setIsLoadingConversations(false);
        setConversations([]); // Clear conversations if no user
        return;
      }
      setIsLoadingConversations(true);
      try {
        const fetchedConversations =
          await cs.getAllConversations(currentUserId);
        setConversations(fetchedConversations);
        if (fetchedConversations.length > 0) {
          // Automatically select the first conversation
          // setActiveConversationId(fetchedConversations[0].id); // This will trigger another effect to load messages
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
        toast({
          title: "Error",
          description: "Failed to load conversations.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingConversations(false);
      }
    };
    loadConversations();
  }, []);

  // Load messages when activeConversationId changes
  useEffect(() => {
    if (activeConversationId) {
      const loadMessages = async () => {
        setIsLoadingMessages(true);
        setMessages([]); // Clear previous messages
        try {
          const conversationWithMessages =
            await cs.getConversationById(activeConversationId);
          if (conversationWithMessages && conversationWithMessages.messages) {
            const uiMessages: ChatMessageUI[] =
              conversationWithMessages.messages.map((msg) => ({
                id: msg.id || uuidv4(),
                text: msg.content || msg.text || "",
                sender: msg.isUser ? "user" : "agent",
                isStreaming: msg.isLoading,
                imageUrl: msg.imageUrl,
                fileName: msg.fileName,
                // map other fields if necessary
              }));
            setMessages(uiMessages);
          } else {
            setMessages([]); // No messages or conversation not found
          }
        } catch (error) {
          console.error(
            `Error loading messages for conversation ${activeConversationId}:`,
            error,
          );
          toast({
            title: "Error",
            description: "Failed to load messages.",
            variant: "destructive",
          });
          setMessages([]);
        } finally {
          setIsLoadingMessages(false);
        }
      };
      loadMessages();
    } else {
      setMessages([]); // No active conversation, so no messages
    }
  }, [activeConversationId]);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        // Validação de tipo (exemplo expandido)
        const allowedImageTypes = [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        // Adicionar outros tipos permitidos, ex: PDF, TXT
        const allowedOtherTypes = ["application/pdf", "text/plain"];
        const allAllowedTypes = [...allowedImageTypes, ...allowedOtherTypes];
        const maxFileSizeMB = 10; // Exemplo: 10MB

        if (!allAllowedTypes.includes(file.type)) {
          toast({
            title: "Tipo de arquivo inválido",
            description: `Por favor, selecione um tipo de arquivo suportado (${allAllowedTypes.join(", ")}).`,
            variant: "destructive",
          });
          if (fileInputRef.current) fileInputRef.current.value = "";
          removeSelectedFile();
          return;
        }

        if (file.size > maxFileSizeMB * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `O tamanho máximo do arquivo é ${maxFileSizeMB}MB.`,
            variant: "destructive",
          });
          if (fileInputRef.current) fileInputRef.current.value = "";
          removeSelectedFile();
          return;
        }

        setSelectedFile(file);
        setSelectedFileName(file.name);
        // Preview para imagens
        if (allowedImageTypes.includes(file.type)) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedFileDataUri(reader.result as string);
          };
          reader.readAsDataURL(file);
        } else {
          // Para outros tipos de arquivo, não geramos data URI por padrão para preview,
          // mas você pode querer armazenar o arquivo de outra forma ou mostrar um ícone.
          setSelectedFileDataUri(null); // Limpa se não for imagem, ou define um placeholder/ícone
        }
        // Limpa o valor do input para permitir selecionar o mesmo arquivo novamente após remoção
        // event.target.value = ''; // Cuidado: isso pode ser feito no removeSelectedFile
      } else {
        removeSelectedFile();
      }
    },
    [],
  );

  const removeSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setSelectedFileName(null);
    setSelectedFileDataUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // formData is unused
    const currentInput = inputValue.trim();

    if (!currentUserId) {
      // Added check for currentUserId
      toast({
        title: "Authentication Error",
        description: "You are not logged in. Please log in to send messages.",
        variant: "destructive",
      });
      setIsPending(false);
      return;
    }

    if (!currentInput && !selectedFile) {
      toast({
        title: "Input required",
        description: "Please type a message or select a file.",
        variant: "destructive",
      });
      return;
    }

    setIsPending(true); // For streaming UI indication

    const currentSelectedFile = selectedFile;
    const currentSelectedFileDataUri = selectedFileDataUri;

    const userMessageId = uuidv4();
    const agentMessageId = uuidv4();
    const messageTimestamp = new Date();

    const userMessage: ChatMessageUI = {
      id: userMessageId,
      sender: "user",
      text: currentInput,
      imageUrl:
        currentSelectedFile && currentSelectedFile.type.startsWith("image/")
          ? currentSelectedFileDataUri
          : undefined,
      fileName: currentSelectedFile ? currentSelectedFile.name : undefined,
      fileDataUri:
        currentSelectedFile && !currentSelectedFile.type.startsWith("image/")
          ? currentSelectedFileDataUri
          : undefined,
      isStreaming: false,
      timestamp: messageTimestamp, // Add timestamp for UI consistency
    };
    setOptimisticMessages(userMessage);

    // Save user message to Firestore
    if (activeConversationId) {
      const userMessageForStorage: Omit<cs.Message, "id" | "timestamp"> = {
        sender: currentUserId, // Save actual user ID as sender
        text: currentInput,
        content: currentInput, // Ensure content is populated
        isUser: true,
        isLoading: false,
        isError: false,
        imageUrl: userMessage.imageUrl,
        fileName: userMessage.fileName,
        // Timestamp will be server-generated
      };
      cs.addMessageToConversation(activeConversationId, userMessageForStorage)
        .then((savedUserMsg) => {
          if (savedUserMsg) {
            console.log("User message saved to Firestore:", savedUserMsg.id);
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversationId
                  ? { ...c, updatedAt: new Date() }
                  : c,
              ),
            );
            // Optionally, update userMessage in messages state with server ID/timestamp
            // For optimistic updates, this might not be strictly necessary if UI uses client ID
            // e.g., setMessages(prev => prev.map(m => m.id === userMessageId ? {...m, id: savedUserMsg.id, timestamp: savedUserMsg.timestamp} : m));
          }
        })
        .catch((err) => {
          console.error("Failed to save user message to Firestore:", err);
          toast({
            title: "Error",
            description: "Failed to save your message.",
            variant: "destructive",
          });
          // Mark the optimistic message as having an error
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMessageId ? { ...m, isError: true } : m,
            ),
          );
        });
    } else if (!activeConversationId) {
      toast({
        title: "No Active Conversation",
        description:
          "Please select or start a new conversation to send messages.",
        variant: "warning",
      });
      setIsPending(false); // Reset pending state
      return; // Stop if no active conversation
    }

    setInputValue("");
    removeSelectedFile();
    inputRef.current?.focus();
    setIsPending(true); // Set pending state for UI feedback

    // Prepare data for the API route
    const chatInputForStream: BasicChatInput = {
      userMessage: currentInput,
      history: messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        content: msg.text, // Assuming msg.text holds the content for history
      })),
      fileDataUri: currentSelectedFile ? currentSelectedFileDataUri : undefined,
      // Cast to LLMAgentConfig
      modelName:
        usingADKAgent && selectedADKAgent
          ? selectedADKAgent.model
          : (selectedSavedAgent?.config as LLMAgentConfig)?.agentModel ||
            undefined,
      // Cast to AgentConfig
      systemPrompt:
        usingADKAgent && selectedADKAgent
          ? selectedADKAgent.description
          : (selectedSavedAgent?.config as AgentConfig)?.agentDescription ||
            undefined,
      // Cast to LLMAgentConfig
      temperature:
        usingADKAgent && selectedADKAgent
          ? (selectedADKAgent as any).temperature
          : (selectedSavedAgent?.config as LLMAgentConfig)?.agentTemperature ||
            undefined,
      agentToolsDetails:
        usingADKAgent && selectedADKAgent
          ? selectedADKAgent.tools?.map((t: ADKTool) => ({
              id: t.name,
              name: t.name,
              description: t.description || "",
              enabled: true,
            }))
          : (selectedSavedAgent?.config as AgentConfig)?.agentTools?.map(
              (toolId: string) => ({
                id: toolId,
                name: toolId,
                description: `Tool: ${toolId}`,
                enabled: true,
              }),
            ),
    };

    const pendingAgentMessage: ChatMessageUI = {
      id: agentMessageId,
      sender: "agent",
      text: "",
      isStreaming: true,
      timestamp: new Date(), // Add timestamp for UI consistency
    };
    setOptimisticMessages(pendingAgentMessage);

    let agentMessageStorageId: string | null = null;
    if (activeConversationId) {
      const agentPlaceholderForStorage: Omit<cs.Message, "id" | "timestamp"> = {
        sender: "agent", // Or specific agent ID, e.g., selectedADKAgent?.id || selectedSavedAgent?.id
        text: "",
        content: "",
        isUser: false,
        isLoading: true,
        isError: false,
      };
      try {
        const savedPlaceholder = await cs.addMessageToConversation(
          activeConversationId,
          agentPlaceholderForStorage,
        );
        if (savedPlaceholder && savedPlaceholder.id) {
          agentMessageStorageId = savedPlaceholder.id;
          console.log(
            "Agent placeholder message saved to Firestore:",
            savedPlaceholder.id,
          );
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversationId
                ? { ...c, updatedAt: new Date() }
                : c,
            ),
          );
        } else {
          throw new Error(
            "Failed to save agent placeholder message or ID is missing.",
          );
        }
      } catch (placeholderError) {
        console.error(
          "Error saving agent placeholder to Firestore:",
          placeholderError,
        );
        toast({
          title: "Error",
          description: "Failed to initiate agent response saving.",
          variant: "destructive",
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMessageId
              ? {
                  ...m,
                  text: "Error: Could not save placeholder.",
                  isStreaming: false,
                  isError: true,
                }
              : m,
          ),
        );
        setIsPending(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/chat-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chatInputForStream),
      });

      if (!response.ok) {
        let errorMessageText = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessageText = errorData.error;
          }
        } catch (e) {
          console.warn("Could not parse error response as JSON:", e);
        }
        throw new Error(errorMessageText);
      }

      if (!response.body) {
        throw new Error("Failed to get readable stream body.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get readable stream reader.");
      }

      const decoder = new TextDecoder();
      let done = false;
      let accumulatedContent = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          accumulatedContent += chunk;
          setOptimisticMessages({
            id: agentMessageId,
            sender: "agent",
            text: accumulatedContent,
            isStreaming: true,
          });
          // Scroll as new content arrives
        }
      }
      // Finalize the message after stream ends
      const finalAgentOptimisticMessage: ChatMessageUI = {
        id: agentMessageId, // Keep client-side optimistic ID for UI mapping
        sender: "agent",
        text: accumulatedContent,
        isStreaming: false,
        timestamp: new Date(),
      };
      setOptimisticMessages(finalAgentOptimisticMessage);

      if (activeConversationId && agentMessageStorageId) {
        cs.finalizeMessageInConversation(
          activeConversationId,
          agentMessageStorageId,
          accumulatedContent,
          false,
        )
          .then(() => {
            console.log(
              "Agent message finalized in Firestore:",
              agentMessageStorageId,
            );
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversationId
                  ? { ...c, updatedAt: new Date() }
                  : c,
              ),
            );
          })
          .catch((err) => {
            console.error(
              "Failed to finalize agent message in Firestore:",
              err,
            );
            toast({
              title: "Error Saving Response",
              description: "Agent's full response could not be saved.",
              variant: "destructive",
            });
            setMessages((prev) =>
              prev.map((m) =>
                m.id === agentMessageId
                  ? {
                      ...m,
                      text:
                        accumulatedContent + "\n(Error saving final response)",
                      isError: true,
                      isStreaming: false,
                    }
                  : m,
              ),
            );
          });
      } else if (!activeConversationId) {
        console.warn("No active conversation to finalize agent message.");
      }

      // Update main messages state after stream completion
      setMessages((prevMessages) => {
        // Ensure user message is in main state
        const userMessageInState = prevMessages.find(
          (msg) => msg.id === userMessageId,
        );
        let messagesWithUser = prevMessages;
        if (!userMessageInState) {
          messagesWithUser = [...prevMessages, userMessage];
        }

        // Update or add the agent message
        const agentMsgIndex = messagesWithUser.findIndex(
          (m) => m.id === agentMessageId,
        );
        if (agentMsgIndex !== -1) {
          const updatedMessages = [...messagesWithUser];
          updatedMessages[agentMsgIndex] = {
            ...finalAgentOptimisticMessage,
            id: agentMessageStorageId || agentMessageId,
          }; // Prefer storage ID if available
          return updatedMessages;
        } else {
          return [
            ...messagesWithUser,
            {
              ...finalAgentOptimisticMessage,
              id: agentMessageStorageId || agentMessageId,
            },
          ];
        }
      });
    } catch (error: any) {
      let caughtErrorMessage =
        "Failed to get agent response. Please try again.";
      if (error instanceof Error) {
        caughtErrorMessage = error.message;
      }
      console.error("Error during agent response streaming:", error);
      toast({
        title: "Error",
        description: caughtErrorMessage,
        variant: "destructive",
      });

      const errorAgentOptimisticMessage: ChatMessageUI = {
        id: agentMessageId, // Keep client-side optimistic ID
        sender: "agent",
        text: `Error: ${caughtErrorMessage}`,
        isStreaming: false,
        isError: true,
        timestamp: new Date(),
      };
      setOptimisticMessages(errorAgentOptimisticMessage);

      if (activeConversationId && agentMessageStorageId) {
        cs.finalizeMessageInConversation(
          activeConversationId,
          agentMessageStorageId,
          `Error: ${caughtErrorMessage}`,
          true,
        )
          .then(() => {
            console.log(
              "Agent error message finalized in Firestore:",
              agentMessageStorageId,
            );
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversationId
                  ? { ...c, updatedAt: new Date() }
                  : c,
              ),
            );
          })
          .catch((err) => {
            console.error(
              "Failed to finalize agent error message in Firestore:",
              err,
            );
          });
      } else if (!activeConversationId) {
        console.warn("No active conversation to finalize agent error message.");
      }

      // Update main messages state with the error
      setMessages((prevMessages) => {
        const userMessageInState = prevMessages.find(
          (msg) => msg.id === userMessageId,
        );
        let messagesWithUser = prevMessages;
        if (!userMessageInState) {
          messagesWithUser = [...prevMessages, userMessage];
        }

        const agentMsgIndex = messagesWithUser.findIndex(
          (m) => m.id === agentMessageId,
        );
        if (agentMsgIndex !== -1) {
          const updatedMessages = [...messagesWithUser];
          updatedMessages[agentMsgIndex] = {
            ...errorAgentOptimisticMessage,
            id: agentMessageStorageId || agentMessageId,
          };
          return updatedMessages;
        } else {
          return [
            ...messagesWithUser,
            {
              ...errorAgentOptimisticMessage,
              id: agentMessageStorageId || agentMessageId,
            },
          ];
        }
      });
    } finally {
      setIsPending(false);
      // Final check to ensure user message is in main state
      setMessages((prevMessages) => {
        if (!prevMessages.find((msg) => msg.id === userMessageId)) {
          return [...prevMessages, userMessage];
        }
        return prevMessages;
      });
    }
  };

  // Removed useEffect for formState as it's considered redundant

  // Scroll to bottom when messages change or pending state changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [optimisticMessages]);

  const handleNewConversation = useCallback(async () => {
    if (!currentUserId) {
      // Added check for currentUserId
      toast({
        title: "Authentication Error",
        description: "Please log in to start a new conversation.",
        variant: "destructive",
      });
      return;
    }
    // Consider adding a loading state specific to creating a new conversation if preferred
    setIsLoadingConversations(true); // Re-use general loading state for now
    try {
      const newConv = await cs.createNewConversation(
        currentUserId,
        "Nova Conversa",
      ); // Default title
      if (newConv) {
        setConversations((prev) => [newConv, ...prev]); // Add to the top
        setActiveConversationId(newConv.id); // This will trigger message loading via useEffect
        // messages will be cleared by the useEffect for activeConversationId
        setChatHistory([]);
        setInputValue("");
        setSelectedFile(null);
        setSelectedFileName(null);
        setSelectedFileDataUri(null);
        toast({
          title: "Nova Conversa Criada",
          description: `"${newConv.title}" iniciada.`,
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar uma nova conversa.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating new conversation:", error);
      toast({
        title: "Erro ao Criar",
        description: "Falha ao iniciar uma nova conversa.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConversations(false);
    }
  }, [
    setConversations,
    setActiveConversationId,
    setChatHistory,
    setInputValue,
    setSelectedFile,
    setSelectedFileName,
    setSelectedFileDataUri,
  ]); // Dependencies for useCallback

  // handleSelectConversation removed as handleSelectConversationById is used by ConversationSidebar

  const handleRenameConversation = useCallback(
    async (id: string, newTitle: string) => {
      try {
        await cs.renameConversationInStorage(id, newTitle);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, title: newTitle, updatedAt: new Date() } : c,
          ),
        );
        toast({
          title: "Conversa Renomeada",
          description: `Conversa renomeada para ${newTitle}.`,
        });
      } catch (error) {
        console.error("Error renaming conversation:", error);
        toast({
          title: "Erro",
          description: "Falha ao renomear conversa.",
          variant: "destructive",
        });
      }
    },
    [],
  );

  const handleDeleteConversation = useCallback(
    async (conversationToDelete: Conversation) => {
      if (!conversationToDelete || !conversationToDelete.id) {
        toast({
          title: "Erro",
          description: "Tentativa de apagar conversa inválida.",
          variant: "destructive",
        });
        return;
      }
      const { id } = conversationToDelete;

      try {
        await cs.deleteConversationFromStorage(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          setActiveConversationId(null); // This will trigger useEffect to clear messages
        }
        toast({ title: "Conversa Apagada", variant: "default" });
      } catch (error) {
        console.error("Error deleting conversation:", error);
        toast({
          title: "Erro",
          description: "Falha ao apagar conversa.",
          variant: "destructive",
        });
      }
    },
    [activeConversationId],
  );

  // Callback for ConversationSidebar that expects (id: string) => void
  // This function is now the primary way to select a conversation from the sidebar.
  const handleSelectConversationById = useCallback(
    (id: string): void => {
      if (!id) {
        console.error("handleSelectConversationById called with invalid id");
        toast({
          title: "Erro",
          description: "ID da conversa inválido.",
          variant: "destructive",
        });
        return;
      }
      setActiveConversationId(id); // This will trigger the useEffect to load messages for this conversation
      // The actual loading of messages is handled by the useEffect watching activeConversationId
    },
    [setActiveConversationId],
  );

  // handleSetActiveIdExplicitly removed as it's unused
  // loadConversationMessages removed as its logic is covered by useEffect[activeConversationId]

  // Handle input change
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setInputValue(event.target.value);
  };

  // Handle suggestion click (placeholder)
  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    // Optionally, auto-submit the form
    // formRef.current?.requestSubmit(); // Or call handleFormSubmit directly if appropriate
  };

  // Load ADK agents from localStorage
  useEffect(() => {
    const storedADKAgents = localStorage.getItem("adkAgents");
    if (storedADKAgents) {
      setAdkAgents(JSON.parse(storedADKAgents));
    }
  }, []);

  const selectedADKAgent = useMemo(() => {
    if (!selectedADKAgentId || adkAgents.length === 0) return null;
    // Map ADKAgentConfig to include id property needed by ADKAgent
    return (
      adkAgents.find(
        (agent) => (agent.agentId ?? agent.displayName) === selectedADKAgentId,
      ) || null
    );
  }, [selectedADKAgentId, adkAgents]);

  const selectedSavedAgent = useMemo(() => {
    if (
      !selectedAgentId ||
      selectedAgentId === "none" ||
      savedAgents.length === 0
    )
      return null;
    return savedAgents.find((agent) => agent.id === selectedAgentId) || null;
  }, [selectedAgentId, savedAgents]);

  if (authLoading) {
    // Added authLoading check
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (!currentUser && !authLoading) {
    // Added currentUser check
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p className="mb-4 text-lg">Please log in to use the chat.</p>
        {/* Login button will be in ChatHeader */}
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background text-foreground">
      <ConversationSidebar
        isOpen={isSidebarOpen}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversationById}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} // Added onToggleSidebar
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatHeader
          activeChatTarget={activeChatTarget}
          usingADKAgent={usingADKAgent}
          setUsingADKAgent={setUsingADKAgent}
          selectedADKAgentId={selectedADKAgentId}
          setSelectedADKAgentId={setSelectedADKAgentId}
          adkAgents={adkAgents.map((agent) => ({
            ...agent,
            id: agent.agentId || agent.displayName, // Ensure id property is present
          }))}
          isADKInitializing={isADKInitializing}
          selectedAgentId={selectedAgentId}
          setSelectedAgentId={setSelectedAgentId}
          savedAgents={savedAgents}
          selectedGemId={selectedGemId}
          setSelectedGemId={setSelectedGemId}
          initialGems={initialGems}
          handleNewConversation={handleNewConversation}
          isSidebarOpen={isSidebarOpen}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <div className="flex-1 overflow-hidden">
          {/* Messages Area */}
          <ScrollArea
            ref={scrollAreaRef}
            className="flex-1 p-4 space-y-4"
            id="message-scroll-area"
          >
            {optimisticMessages.length === 0 && !isPending ? (
              <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
            ) : (
              <MessageList
                messages={optimisticMessages}
                isPending={isPending}
              />
            )}
          </ScrollArea>
        </div>

        {/* Message Input Area */}
        <MessageInputArea
          formRef={formRef} // Pass formRef if MessageInputArea needs to submit the form directly
          inputRef={inputRef}
          fileInputRef={fileInputRef}
          onSubmit={handleFormSubmit} // This now handles fetch-based streaming
          isPending={isPending} // Use only isPending from useState
          selectedFile={selectedFile}
          selectedFileName={selectedFileName ?? ""}
          selectedFileDataUri={selectedFileDataUri}
          onRemoveAttachment={removeSelectedFile}
          handleFileChange={handleFileChange}
          inputValue={inputValue}
          onInputChange={handleInputChange} // Pass handleInputChange
        />
      </div>
    </div>
  );
}
