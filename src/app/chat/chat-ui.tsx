"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LogIn,
  Menu,
  Save,
  Trash2,
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
import { useAuth } from "@/contexts/AuthContext";
import { saveAgentConfiguration } from "@/lib/agentServices";
import { auth } from "@/lib/firebaseClient";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import type { AgentConfig, LLMAgentConfig, SavedAgentConfiguration as SavedAgentConfigType, AgentFramework } from "@/types/agent-configs";
// Data imports from "@/data/agentBuilderConfig" are problematic as the file is missing.
// const { initialGems, iconComponents, availableTools: builderAvailableTools } = await import("@/data/agentBuilderConfig"); // This will fail if file doesn't exist
// Placeholder for data that would come from agentBuilderConfig.ts - USER NEEDS TO FIX THIS MISSING FILE OR PATH
const initialGems: Gem[] = []; 
const iconComponents: any = {};
const builderAvailableTools: any[] = [];


export type ADKAgentConfig = {
  name: string;
  description?: string;
  model?: { name?: string; temperature?: number };
  tools?: Array<ADKTool>;
  agentModel?: string;
  agentTemperature?: number;
  [key: string]: any;
};

// Interface auxiliar para tipos de configuração de agentes com propriedades adicionais
// Não podemos estender diretamente um tipo union, então criamos uma interface separada
export interface ExtendedAgentConfig {
  description?: string;
  name: string;
  type: string;
  framework: AgentFramework;
  // Outras propriedades opcionais que podem estar presentes em qualquer tipo de agente
  [key: string]: any;
};

export type ADKTool = {
  name: string;
  description?: string;
  [key: string]: any;
};

interface AgentSelectItem {
  id: string;
  displayName: string;
  // Add other properties if AgentSelector expects them, e.g., description, icon
}

// Adicionando uma interface para ADKAgent que é compatível com AgentSelectItem
export interface ADKAgent extends AgentSelectItem {
  // Propriedades adicionais que ADKAgent pode ter
  config?: ADKAgentConfig;
  [key: string]: any;
}

// Temporary Gem definition - ideally should be in a shared types file and its data source (initialGems) resolved
interface Gem {
  id: string;
  name: string;
  prompt?: string;
  // Add other properties if necessary, like 'description' or 'iconName' if used by AgentSelectItem mapping
}

// Define the action type for optimistic updates
// Adicionando isStreaming à interface ChatMessageUI
interface ExtendedChatMessageUI extends ChatMessageUI {
  isStreaming?: boolean;
}

type OptimisticUpdateAction =
  | { type: "add_message"; message: ExtendedChatMessageUI }
  | { type: "update_message_content"; id: string; content: string } // content, not text
  | { type: "update_message_status"; id: string; status: ChatMessageUI['status']; isStreaming?: boolean }
  | { type: "remove_message"; id: string }
  | { type: "set_messages"; messages: ExtendedChatMessageUI[] };

import ChatHeader from "@/components/features/chat/ChatHeader";
// Corrigindo a importação do tipo ChatHeaderProps
import type ChatHeaderProps from "@/components/features/chat/ChatHeader";
import WelcomeScreen from "@/components/features/chat/WelcomeScreen";
import MessageList from "@/components/features/chat/MessageList";
import MessageInputArea from "@/components/features/chat/MessageInputArea";
import { Message } from "@/types/chat";
import { Conversation, ChatMessageUI } from "@/types/chat";
import ConversationSidebar from "@/components/features/chat/ConversationSidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label"; 
import { AgentSelector } from "@/components/agent-selector";
import * as cs from "@/lib/firestoreConversationStorage";
import { useRouter, useParams } from "next/navigation";

const FeatureButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 p-2 feature-button-hover rounded-lg transition-all duration-200 cursor-pointer group"
  >
    <div className="p-2.5 feature-button-bg rounded-full shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-200">
      {icon}
    </div>
    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-200">{label}</span>
  </button>
);

export default function ChatPage() {
  return <ChatUI />;
}

export function ChatUI() {
  const router = useRouter();
  const params = useParams();
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.uid;

  // State for current agent and conversation context
  // Definindo uma interface estendida de SavedAgentConfigType que inclui todas as propriedades necessárias
  interface ExtendedSavedAgentConfigType {
    id: string;
    agentName: string;
    agentDescription: string;
    agentVersion: string;
    // Campos adicionais que podem estar presentes
    agentModel?: string;
    globalInstruction?: string;
    agentTemperature?: number;
    // O config não pode ser opcional para ser compatível com SavedAgentConfigType
    config: AgentConfig;
    tools: string[];
    toolConfigsApplied?: boolean;
    toolsDetails?: any[];
    userId?: string;
    createdAt?: string;
    updatedAt?: string;
    templateId?: string;
    isFavorite?: boolean;
    tags?: string[];
    icon?: string;
  }
  
  const [currentAgent, setCurrentAgent] = useState<ExtendedSavedAgentConfigType | Gem | ADKAgentConfig | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);

  const activeChatTargetName = useMemo(() => {
    if (currentAgent) {
      // Verificar o tipo do objeto e acessar a propriedade name de acordo
      if ('name' in currentAgent) return currentAgent.name;
      if ('agentName' in currentAgent) return currentAgent.agentName;
    }
    if (currentConversation?.title) return currentConversation.title;
    return "New Chat";
  }, [currentAgent, currentConversation]);

  const {
    savedAgents,
    setSavedAgents,
    addAgent,
    updateAgent,
    deleteAgent,
    isLoadingAgents
  } = useAgents();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isADKInitializing, setIsADKInitializing] = useState<boolean>(false);

  // Message and Conversation State
  const [messages, setMessages] = useState<ExtendedChatMessageUI[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputContinuation, setInputContinuation] = useState<any>(null); // TODO: Define a proper type if possible

  // File Handling State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileDataUri, setSelectedFileDataUri] = useState<string | null>(null);

  // Agent and Gem Selection State
  const [selectedGemId, setSelectedGemId] = useState<string | null>(
    initialGems[0]?.id ?? null
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedADKAgentId, setSelectedADKAgentId] = useState<string | null>(null);
  const [adkAgents, setADKAgents] = useState<ADKAgent[]>([]);
  const [pendingAgentConfig, setPendingAgentConfig] = useState<AgentConfig | ExtendedSavedAgentConfigType | null>(null);
  // Removed duplicate/simpler activeChatTarget definition here
  const [selectedAgentConfig, setSelectedAgentConfig] = useState<ExtendedSavedAgentConfigType | null>(null);
  const mappedAdkAgents: AgentSelectItem[] = adkAgents.map((agentConfig: ADKAgent): AgentSelectItem => ({
    id: agentConfig.id, 
    displayName: agentConfig.displayName,
  }));
  // Removed duplicate isADKInitializing state declaration here

  const usingADKAgent = useMemo(() => !!selectedADKAgentId, [selectedADKAgentId]);

  const activeChatTarget = useMemo(() => {
    if (usingADKAgent && selectedADKAgentId && adkAgents.length > 0) {
      const adkAgent = adkAgents.find((agent: ADKAgent) => agent.id === selectedADKAgentId);
      if (adkAgent) return { id: adkAgent.id, name: adkAgent.displayName, type: 'adk-agent' as const, config: adkAgent.config };
    }
    if (selectedAgentId && savedAgents.length > 0) {
      const currentSavedAgent = savedAgents.find((a: SavedAgentConfigType) => a.id === selectedAgentId);
      if (currentSavedAgent) return { id: currentSavedAgent.id, name: currentSavedAgent.name, type: 'agent' as const, config: currentSavedAgent };
    }
    if (selectedGemId && initialGems.length > 0) {
      const gem = initialGems.find((g: Gem) => g.id === selectedGemId);
      if (gem) return { id: gem.id, name: gem.name, type: 'gem' as const, config: gem };
    }
    return initialGems.length > 0 ? { id: initialGems[0].id, name: initialGems[0].name, type: 'gem' as const, config: initialGems[0] } : null;
  }, [selectedAgentId, savedAgents, selectedGemId, selectedADKAgentId, adkAgents, usingADKAgent, initialGems]);
  // Removed duplicate messages and pendingAgentConfig state declarations here

  // Removing duplicate OptimisticUpdateAction definition here, the one above is complete

  const [optimisticMessages, addOptimisticMessage] = useOptimistic<
    ExtendedChatMessageUI[],
    OptimisticUpdateAction
  >(
    messages,
    (state, action) => {
      switch (action.type) {
        case "add_message":
          return [...state, action.message];
        case "update_message_content":
          return state.map((msg) =>
            msg.id === action.id ? { ...msg, text: action.content } : msg // Use action.content as dispatched
          );
        case "update_message_status":
          return state.map((msg) => {
            if (msg.id === action.id) {
              const updatedMsg: ChatMessageUI = { ...msg, status: action.status };
              // Now action is correctly typed, (action as any) is not needed for isStreaming
              if (typeof action.isStreaming === 'boolean') { 
                updatedMsg.isStreaming = action.isStreaming;
              }
              return updatedMsg;
            }
            return msg;
          });
        case "remove_message":
          return state.filter((msg) => msg.id !== action.id);
        case "set_messages":
          return action.messages;
        default:
          return state;
      }
    }
  );

  // const uiMessagesForMessageList: ChatMessageUI[] = optimisticMessages.map(msg => ({
  //   id: msg.id,
  //   text: msg.content, // This was incorrect as msg is already ChatMessageUI
  //   sender: msg.isUser ? "user" : "agent", // This was incorrect
  //   // TODO: Map other ChatMessageUI fields like imageUrl, fileName if available in Message or optimistic state
  // }));

  // Removed duplicate declarations for conversations, setConversations, activeConversationId, setActiveConversationId here
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  useEffect(() => {
    setPendingAgentConfig(null);
  }, [selectedGemId, selectedAgentId, selectedADKAgentId]);

  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUserId) {
        setIsLoadingConversations(false);
        setConversations([]);
        setActiveConversationId(null); 
        setMessages([]); 
        return;
      }
      setIsLoadingConversations(true);
      try {
        const fetchedConversations = await cs.getAllConversations(currentUserId);
        setConversations(fetchedConversations);
        if (fetchedConversations.length > 0 && !activeConversationId) {
          setActiveConversationId(fetchedConversations[0].id);
        } else if (fetchedConversations.length === 0 && activeConversationId) {
          // If current activeConversationId is no longer valid (e.g. deleted from another client)
          setActiveConversationId(null);
          setMessages([]);
        } else if (fetchedConversations.length === 0) {
          setActiveConversationId(null);
          setMessages([]);
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
        toast({ title: "Error", description: "Failed to load conversations.", variant: "destructive" });
        setConversations([]); 
        setActiveConversationId(null);
        setMessages([]);
      } finally {
        setIsLoadingConversations(false);
      }
    };
    loadConversations();
  }, [currentUserId, activeConversationId]);

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    addOptimisticMessage({ type: "set_messages", messages: [] }); // Clear messages optimistically
    setInputContinuation(null);
    setSelectedFile(null);
    setSelectedFileName(null);
    setInputValue("");
    router.push(`/chat/${conversationId}`);
  };

  useEffect(() => {
    if (activeConversationId) {
      const loadMessages = async () => {
        setIsLoadingMessages(true);
        setMessages([]); 
        try {
          const conversationWithMessages = await cs.getConversationById(activeConversationId);
          if (conversationWithMessages && conversationWithMessages.messages) {
            const loadedUiMessages: ExtendedChatMessageUI[] = conversationWithMessages.messages.map((dbMessage: Message): ExtendedChatMessageUI => ({
              id: dbMessage.id || uuidv4(),
              text: dbMessage.content || "", // Map content to text
              sender: dbMessage.isUser ? "user" : "agent", // Map isUser to sender
              // @ts-ignore TODO: Fix timestamp type issue if any. Firestore specific handling might be needed.
              timestamp: dbMessage.timestamp ? (dbMessage.timestamp instanceof Date ? dbMessage.timestamp : (dbMessage.timestamp as any).toDate()) : new Date(),
              status: 'completed', // Messages from DB are completed
            }));
            setMessages(loadedUiMessages);
          } else {
            setMessages([]); // Keep this to clear messages if conversation has none
          }
        } catch (error) {
          console.error(`Error loading messages for conversation ${activeConversationId}:`, error);
          toast({ title: "Error", description: "Failed to load messages.", variant: "destructive" });
          setMessages([]);
        } finally {
          setIsLoadingMessages(false);
        }
      };
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Login Successful", variant: "default" });
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      toast({
        title: "Login Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logout Successful", variant: "default" });
      setMessages([]);
      setConversations([]);
      setActiveConversationId(null);
      setPendingAgentConfig(null);
    } catch (error) {
      console.error("Error during logout:", error);
      toast({ title: "Logout Failed", variant: "destructive" });
    }
  };

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setSelectedFileDataUri(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setSelectedFileName(null);
      setSelectedFileDataUri(null);
    }
  }, []);

  const removeSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setSelectedFileName(null);
    setSelectedFileDataUri(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentInput = inputValue.trim();

    if (!currentUserId) {
      toast({ title: "Authentication Error", description: "Please log in.", variant: "default" });
      return;
    }
    if (!currentInput && !selectedFile) {
      toast({ title: "Input required", description: "Please type a message or select a file.", variant: "default" });
      return;
    }
    if (pendingAgentConfig && isPending) {
      toast({ title: "Aguarde", description: "Por favor, salve ou descarte a configuração do agente pendente antes de enviar uma nova mensagem.", variant: "default"});
      return;
    }

    setIsPending(true);
    setPendingAgentConfig(null); 

    const userMessageId = uuidv4();
    const agentMessageId = uuidv4();

    const timestamp = new Date();
    const optimisticMessagePayload: ExtendedChatMessageUI = {
      id: userMessageId,
      text: currentInput,
      sender: "user",
      // timestamp: timestamp, // Removed: timestamp is not in ChatMessageUI
      status: 'pending',
    };

    if (selectedFile && selectedFileDataUri) {
      if (selectedFile.type.startsWith("image/")) {
        optimisticMessagePayload.imageUrl = selectedFileDataUri;
      }
      optimisticMessagePayload.fileName = selectedFileName || selectedFile.name;
      // optimisticMessagePayload.fileSize = formatFileSize(selectedFile.size); // formatFileSize not available yet
      // optimisticMessagePayload.fileType = selectedFile.type; // Removed: fileType is not in ChatMessageUI
    }

    addOptimisticMessage({ type: "add_message", message: optimisticMessagePayload });

    let currentConvId = activeConversationId;
    if (!currentConvId) {
      const newConv = await cs.createNewConversation(currentUserId, activeChatTarget?.name || "New Chat");
      if (newConv) {
        currentConvId = newConv.id;
        setActiveConversationId(newConv.id);
        setConversations(prev => [newConv, ...prev]);
      } else {
        toast({ title: "Error", description: "Failed to create new conversation.", variant: "destructive" });
        setIsPending(false);
        return;
      }
    }
    
    if (currentConvId) {
      // Note: The object passed to addMessageToConversation should match what Firestore expects.
      // If Firestore auto-generates IDs for messages, userMessageId might not be needed here or could cause issues.
      // For now, assuming cs.addMessageToConversation handles the ID.
      // Also, Message does not have timestamp, so we don't pass it to Firestore if Message type doesn't have it.
      await cs.addMessageToConversation(currentConvId, {
        // id: userMessageId, // Let Firestore handle ID if that's the design
        isUser: true, // Store the actual user ID
        content: currentInput,
        // timestamp: serverTimestamp(), // Let Firestore handle timestamp
        // imageUrl: uploadedImageUrl, // Message type doesn't have imageUrl directly, handle this if needed
        // fileName: uploadedFileName, // Message type doesn't have fileName directly
      }).catch(err => {
        console.error("Failed to save user message:", err);
        toast({ title: "Error saving message", variant: "destructive" });
        // Optionally revert optimistic update for user message on failure
        addOptimisticMessage({ type: "remove_message", id: userMessageId });
      });
      setConversations(prevConvs => prevConvs.map(c => c.id === currentConvId ? { ...c, updatedAt: new Date(), lastMessagePreview: currentInput.substring(0,30) } : c));
    } else {
      // This case should ideally not be reached if new conversation creation is successful
      toast({ title: "No Active Conversation", variant: "destructive" });
      setIsPending(false);
      return;
    }

    setInputValue("");
    removeSelectedFile();
    inputRef.current?.focus();

    const isAgentCreatorSession = selectedGemId === "agent_creator_assistant";
    const apiEndpoint = isAgentCreatorSession ? "/api/agent-creator-stream" : "/api/chat-stream";

    const historyForBackend = messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      content: isAgentCreatorSession && msg.sender === "user" ? [{ text: msg.text || "" }] : (msg.text || ""),
    })); 

    const requestBody: any = {
      userMessage: currentInput,
      history: historyForBackend,
      userId: currentUserId,
      stream: true,
      fileDataUri: selectedFile && selectedFileDataUri ? selectedFileDataUri : undefined,
      conversationId: currentConvId, // Pass conversation ID
    };

    if (!isAgentCreatorSession && activeChatTarget?.type === 'agent' && activeChatTarget.config) {
      const agentCfg = activeChatTarget.config as ExtendedSavedAgentConfigType;
      // Access these properties corretamente do objeto de configuração
      // Para acessar agentModel, globalInstruction e agentTemperature, verificamos em diferentes locais
      if (agentCfg.config && typeof agentCfg.config === 'object') {
        // Primeiro verificamos se existe na propriedade config e ela é um LLMAgentConfig
        if ('type' in agentCfg.config && agentCfg.config.type === 'llm') {
          const llmConfig = agentCfg.config as LLMAgentConfig;
          requestBody.modelName = llmConfig.agentModel;
          requestBody.systemPrompt = agentCfg.agentDescription || llmConfig.globalInstruction;
          requestBody.temperature = llmConfig.agentTemperature;
        } else {
          // Caso contrário, usamos as propriedades de fallback no nível superior
          requestBody.modelName = agentCfg.agentModel;
          requestBody.systemPrompt = agentCfg.agentDescription || agentCfg.globalInstruction;
          requestBody.temperature = agentCfg.agentTemperature;
        }
      } else {
        // Fallback para propriedades de nível superior
        requestBody.modelName = agentCfg.agentModel;
        requestBody.systemPrompt = agentCfg.agentDescription || agentCfg.globalInstruction;
        requestBody.temperature = agentCfg.agentTemperature;
      }
      requestBody.agentToolsDetails = agentCfg.toolsDetails?.map(tool => ({ 
        id: tool.id, 
        name: tool.label, 
        description: tool.genkitToolName || tool.label, 
        enabled: true 
      }));
    } else if (!isAgentCreatorSession && activeChatTarget?.type === 'adk-agent' && activeChatTarget.config) {
      const adkCfg = activeChatTarget.config as ADKAgentConfig;
      requestBody.modelName = adkCfg.model?.name;
      requestBody.systemPrompt = adkCfg.description;
      requestBody.temperature = adkCfg.model?.temperature;
      // Mapeamento seguro sem depender do tipo ADKTool
      requestBody.agentToolsDetails = adkCfg.tools?.map((t) => ({
        id: t.name, 
        name: t.name, 
        description: t.description || t.name, 
        enabled: true 
      }));
    }

    addOptimisticMessage({ 
      type: "add_message", 
      message: { 
        id: agentMessageId, 
        text: "", 
        sender: "agent", 
        status: "pending", 
        isStreaming: true 
      } 
    }); // Agent message with isStreaming

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error occurred" }));
        throw new Error(response.statusText + ": " + (errorData.message || "Failed to fetch stream"));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedAgentResponse = "";
      let finalAgentConfig: AgentConfig | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        
        // Check for special JSON block for agent configuration
        if (chunk.includes('{"agentConfig":')) { // Basic check for the start of our special block
          try {
            const potentialJsonBlock = chunk.substring(chunk.indexOf('{"agentConfig":'));
            const parsedChunk = JSON.parse(potentialJsonBlock);
            if (parsedChunk.agentConfig) {
              finalAgentConfig = parsedChunk.agentConfig;
              // Don't add this control message to chat, but process it
              setPendingAgentConfig(finalAgentConfig);
              continue; // Skip adding this chunk to the message text
            }
          } catch (e) { 
            // Not a valid JSON block or not our agentConfig block, treat as regular text
          }
        }
        
        accumulatedAgentResponse += chunk;
        addOptimisticMessage({ type: "update_message_content", id: agentMessageId, content: accumulatedAgentResponse }); // Dispatch with content property
        addOptimisticMessage({ type: "update_message_status", id: agentMessageId, status: "pending" }); // Status is pending during stream
      }
      
      // Update message status with isStreaming property
      addOptimisticMessage({ 
        type: "update_message_status", 
        id: agentMessageId, 
        status: "completed", 
        isStreaming: false 
      }); // Stream ended, set status to completed and isStreaming to false
      
      if (currentConvId && !finalAgentConfig) { // Only save if not an agent-creator response with pending config
        await cs.addMessageToConversation(currentConvId, {
          isUser: false,
          content: accumulatedAgentResponse,
          // timestamp: serverTimestamp(), // Let Firestore handle timestamp
        });
        setConversations((prevConvs: Conversation[]) => prevConvs.map((c: Conversation) => c.id === currentConvId ? { ...c, updatedAt: new Date(), lastMessagePreview: accumulatedAgentResponse.substring(0,30) } : c));
      }

    } catch (error: any) {
      console.error("Error streaming chat response:", error);
      toast({ title: "Error", description: error.message || "Failed to get response from AI.", variant: "destructive" });
      addOptimisticMessage({ type: "update_message_status", id: agentMessageId, status: "error" });
      addOptimisticMessage({ type: "update_message_content", id: agentMessageId, content: "Sorry, something went wrong." });
      if (currentConvId) {
         await cs.addMessageToConversation(currentConvId, {
          isUser: false,
          content: "Sorry, something went wrong.",
          // timestamp: serverTimestamp(), // Let Firestore handle timestamp
        });
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleNewConversation = async (): Promise<Conversation | null> => {
    if (!currentUserId) return null;
    try {
      // Determine o nome da maneira correta baseado no tipo do activeChatTarget
      const targetName = activeChatTarget?.type === 'agent' ? 
        (activeChatTarget.config as SavedAgentConfigType).agentName : 
        (activeChatTarget?.type === 'gem' || activeChatTarget?.type === 'adk-agent' ? 
          activeChatTarget.name : "New Chat");
      
      const newConv = await cs.createNewConversation(currentUserId, targetName);
      if (newConv) {
        setConversations((prev: Conversation[]) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setMessages([]);
        setPendingAgentConfig(null);
        return newConv; // Retorna a nova conversa explicitamente
      }
      return null; // Se não conseguir criar, retorna null
    } catch (error) {
      console.error("Error creating new conversation:", error);
      toast({ title: "Error", description: "Failed to create new conversation.", variant: "destructive" });
      return null; // Em caso de erro, retorna null também
    }
  };

  const handleDeleteConversation = async (conversation: Conversation) => {
    if (!currentUserId) return;
    try {
      await cs.deleteConversationFromStorage(conversation.id); // Corrected function name and arguments
      setConversations((prev: Conversation[]) => prev.filter((c: Conversation) => c.id !== conversation.id));
      if (activeConversationId === conversation.id) {
        setActiveConversationId(null);
        setMessages([]);
      }
      toast({ title: "Conversation Deleted" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({ title: "Error", description: "Failed to delete conversation.", variant: "destructive" });
    }
  };
  
  const fetchADKAgents = async () => {
    setIsADKInitializing(true);
    try {
      const response = await fetch('/api/adk-agents');
      if (!response.ok) throw new Error('Failed to fetch ADK agents');
      const data = await response.json();
      // Transformar os dados recebidos para o formato ADKAgent que é compatível com AgentSelectItem
      const formattedAgents: ADKAgent[] = (data.agents || []).map((agent: ADKAgentConfig) => ({
        id: agent.name, // Usando o name como id
        displayName: agent.name,
        config: agent, // Armazenando a configuração original no campo config
        description: agent.description
      }));
      setADKAgents(formattedAgents);
    } catch (error: any) {
      console.error('Error fetching ADK agents:', error);
      toast({ title: 'Error Fetching ADK Agents', variant: 'destructive' });
    } finally {
      setIsADKInitializing(false);
    }
  };

  useEffect(() => {
    fetchADKAgents();
  }, []);

  const handleSaveAgent = (configToSave: ExtendedAgentConfig | ExtendedSavedAgentConfigType) => {
    // Check if we have a user
    if (!currentUser) {
      toast({
        title: "Not Logged In",
        description: "Please log in to save agent configurations.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Determine type of config and handle appropriately
      // Verificar se é uma ExtendedSavedAgentConfigType (tem agentName)
      if ('agentName' in configToSave) {
        // Handle SavedAgentConfiguration
        // Passando userId como segundo parâmetro separado para saveAgentConfiguration
        saveAgentConfiguration(
          {
            id: configToSave.id || '',  // Might need to generate an ID if not present
            agentName: configToSave.agentName || '',
            agentDescription: configToSave.agentDescription || '',
            agentVersion: configToSave.agentVersion || '1.0.0',
            config: configToSave.config,
            // Copy over other fields from configToSave that should be preserved
            tools: configToSave.tools || [],
            toolConfigsApplied: configToSave.toolConfigsApplied || {},
            toolsDetails: configToSave.toolsDetails || [],
            // Set timestamps
            createdAt: configToSave.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Outros campos metadados
            isFavorite: configToSave.isFavorite,
            tags: configToSave.tags,
          },
          currentUser.uid // Passando o userId como segundo parâmetro
        )
          .then(() => {
            toast({
              title: "Agent Saved",
              description: `${configToSave.agentName} has been saved successfully.`,
            });
          })
          .catch((error: Error) => {
            console.error('Error saving agent configuration:', error);
            toast({
              title: "Save Failed",
              description: `Failed to save ${configToSave.agentName}: ${error.message}`,
              variant: "destructive",
            });
          });
      } else if ('name' in configToSave) {
        // Assegurando que configToSave pode ser tratado como ExtendedAgentConfig
        // Handle AgentConfig - o objeto AgentConfig tem a propriedade name, não agentName
        saveAgentConfiguration(
          {
            // Generate new IDs for new configs
            id: uuidv4(),
            agentName: configToSave.name || "New Agent",
            // Utilizando a interface estendida
            agentDescription: configToSave.description || "",
            agentVersion: "1.0.0",
            config: { 
              type: 'custom', 
              framework: 'genkit' as AgentFramework,
              // Verificando se é um objeto ExtendedAgentConfig
              // e mapeando seus campos para propriedades válidas em CustomAgentConfig
              customLogicDescription: configToSave.description,
              // Outras propriedades customizadas precisam ser definidas conforme a interface CustomAgentConfig
              globalInstruction: configToSave.description // usando description como globalInstruction
            },
            tools: [], // AgentConfig não tem a propriedade tools diretamente
            toolConfigsApplied: {}, // Deve ser um objeto Record<string, ToolConfigData> vazio, não um boolean
            toolsDetails: [],
            // Set timestamps
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Adicionando campos metadata válidos
            templateId: undefined,
            isFavorite: false,
            tags: [],
          },
          currentUser.uid // Passando o userId como segundo parâmetro
        )
          .then(() => {
            toast({
              title: "Agent Saved",
              description: `${configToSave.name} has been saved successfully.`,
            });
          })
          .catch((error: Error) => {
            console.error('Error saving agent configuration:', error);
            toast({
              title: "Save Failed",
              description: `Failed to save ${configToSave.name}: ${error.message}`,
              variant: "destructive",
            });
          });
      } else {
        // Caso não seja nem SavedAgentConfiguration nem AgentConfig
        console.error("Unknown agent config type");
        toast({
          title: "Error",
          description: "Unknown agent configuration type",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving agent:", error);
      toast({ title: "Error Saving Agent", variant: "destructive" });
    }
  };

  const handleSavePendingAgent = () => {
    if (pendingAgentConfig) {
      // Verificando o tipo do pendingAgentConfig antes de passar para handleSaveAgent
      if ('agentName' in pendingAgentConfig || 'name' in pendingAgentConfig) {
        // TypeScript verificará a compatibilidade com ExtendedAgentConfig | ExtendedSavedAgentConfigType
        handleSaveAgent(pendingAgentConfig as ExtendedAgentConfig | ExtendedSavedAgentConfigType);
      } else {
        console.error('Invalid agent configuration format');
        toast({
          title: "Error",
          description: "Invalid agent configuration format",
          variant: "destructive"
        });
      }
    }
  };

  const handleDiscardPendingAgent = () => {
    setPendingAgentConfig(null);
    toast({ title: "Draft Discarded", description: "The proposed agent configuration has been discarded." });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    // Optionally auto-submit or focus input
    inputRef.current?.focus();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    if (typeof e === 'string') {
      setInputValue(e);
    } else {
      setInputValue(e.target.value);
    }
  };

  // Scroll to bottom when messages change, or pending state changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('div'); // Target the inner div for scrolling
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [optimisticMessages, isPending]);

  if (!currentUser && auth.currentUser === null) { // Check auth.currentUser for initial load
    // This block can be simplified if loading state from useAuth is used
  }

  return (
    <div className="flex h-screen w-full flex-col bg-muted/50">
      <ConversationSidebar
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={(conversation) => handleDeleteConversation(conversation)}
        onRenameConversation={(id, newTitle) => console.log(`Renaming ${id} to ${newTitle}`)}
        isLoading={isLoadingConversations}
        currentUserId={currentUser?.uid}
        gems={initialGems}
        savedAgents={savedAgents}
        adkAgents={adkAgents}
        onSelectAgent={(agent) => {
          if ('displayName' in agent) {
            // É um ADKAgent
            setSelectedADKAgentId(agent.id);
          } else if ('prompt' in agent) {
            // É um Gem
            setSelectedGemId(agent.id);
          } else if ('agentName' in agent || 'id' in agent) {
            // É um SavedAgentConfiguration
            setSelectedAgentId(agent.id);
          }
        }}
      />
      <div className={cn("flex flex-col flex-1 transition-all duration-300 ease-in-out", isSidebarOpen ? "md:ml-72" : "ml-0")}>
        <ChatHeader
        isSidebarOpen={isSidebarOpen}
        activeChatTarget={activeChatTargetName}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        adkAgents={adkAgents}
        usingADKAgent={!!selectedADKAgentId}
        setUsingADKAgent={(value) => {
          if (!value) setSelectedADKAgentId(null);
        }}
        selectedADKAgentId={selectedADKAgentId}
        setSelectedADKAgentId={setSelectedADKAgentId}
        selectedGemId={selectedGemId}
        setSelectedGemId={setSelectedGemId}
        initialGems={initialGems}
        handleNewConversation={() => handleNewConversation()}
        isADKInitializing={isADKInitializing}
      />
        <div className="flex-1 overflow-hidden relative">
          <ScrollArea ref={scrollAreaRef} className="h-full p-4 pt-0">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading messages...</p> {/* Or a spinner component */}
              </div>
            ) : !currentUser ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <LogIn size={48} className="mb-4 text-primary" />
                <h2 className="text-2xl font-semibold mb-2">Welcome to the Chat</h2>
                <p className="mb-4 text-lg">Please log in to use the chat.</p>
                <Button onClick={handleLogin} variant="default" size="lg">
                  <LogIn className="mr-2 h-5 w-5" /> Login with Google
                </Button>
              </div>
            ) : optimisticMessages.length === 0 && !isPending && !pendingAgentConfig ? (
              <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
            ) : (
              <MessageList messages={optimisticMessages.map(m => ({...m, isUser: m.sender === 'user'}))} isPending={isPending} />
            )}
          </ScrollArea>

          {pendingAgentConfig && (
            <Card className="m-4 border-primary shadow-lg absolute bottom-0 left-0 right-0 mb-20 bg-background z-10">
              <CardHeader>
                <CardTitle>Review Proposed Agent Configuration</CardTitle>
                <CardDescription>
                  The Agent Creator Assistant has drafted the following configuration. You can save it or discard and continue chatting to refine it.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-60 overflow-y-auto bg-muted/30 p-4 rounded-md">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(pendingAgentConfig, null, 2)}
                </pre>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleDiscardPendingAgent}>
                    <Trash2 className="mr-2 h-4 w-4"/> Discard & Continue
                </Button>
                <Button onClick={handleSavePendingAgent}>
                    <Save className="mr-2 h-4 w-4"/> Save This Agent
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <MessageInputArea
          formRef={useRef<HTMLFormElement>(null)} // This ref is local to MessageInputArea, not needed from ChatUI state
          inputRef={inputRef} // Pass the shared inputRef
          fileInputRef={fileInputRef} // Pass the shared fileInputRef
          onSubmit={handleFormSubmit}
          isPending={isPending || !!pendingAgentConfig}
          selectedFile={selectedFile}
          selectedFileName={selectedFileName ?? ""}
          selectedFileDataUri={selectedFileDataUri}
          onRemoveAttachment={removeSelectedFile}
          handleFileChange={handleFileChange}
          inputValue={inputValue}
          onInputChange={handleInputChange}
        />
      </div>
    </div>
  );
}
