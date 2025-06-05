"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LogIn,
  Menu,
  Save,
  Trash2,
  Settings2, // Or another icon
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  useCallback,
  // useOptimistic, // Removed
  useMemo,
  Suspense,
  lazy,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/hooks/use-toast";
// import { useAgents } from "@/contexts/AgentsContext"; // Will be removed
import { useAgentStore } from '@/stores/agentStore'; // Added
import { useAuth } from "@/contexts/AuthContext";
import { saveAgentConfiguration } from "@/lib/agentServices";
import { auth } from "@/lib/firebaseClient";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import type { AgentConfig, LLMAgentConfig, SavedAgentConfiguration as SavedAgentConfigType, AgentFramework } from '@/types/agent-configs-fixed';
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

// Define the action type for optimistic updates - MOVED TO useChatStore
// Adicionando isStreaming à interface ChatMessageUI - This specific interface is now in useChatStore
// interface ExtendedChatMessageUI extends ChatMessageUI {
//   isStreaming?: boolean;
// }

// type OptimisticUpdateAction =
//   | { type: "add_message"; message: ExtendedChatMessageUI }
//   | { type: "update_message_content"; id: string; content: string } // content, not text
//   | { type: "update_message_status"; id: string; status: ChatMessageUI['status']; isStreaming?: boolean }
//   | { type: "remove_message"; id: string }
//   | { type: "set_messages"; messages: ExtendedChatMessageUI[] }
//   | { type: "update_message_feedback"; id: string; feedback: 'liked' | 'disliked' | null }; // Added feedback action

import ChatHeader from "@/components/features/chat/ChatHeader";
// Corrigindo a importação do tipo ChatHeaderProps
import type ChatHeaderProps from "@/components/features/chat/ChatHeader";
import WelcomeScreen from "@/components/features/chat/WelcomeScreen";
import MessageList from "@/components/features/chat/MessageList";
import MessageInputArea from "@/components/features/chat/MessageInputArea";
// import { Message } from "@/types/chat"; // Message type is used by useChatStore
import { Conversation, ChatMessageUI, TestRunConfig, ChatRunConfig } from "@/types/chat"; // Added ChatRunConfig
// LoadingState might be replaced or used alongside skeletons
import LoadingState from "@/components/shared/LoadingState";
import ChatMessageSkeleton from "@/components/shared/ChatMessageSkeleton"; // Import ChatMessageSkeleton
// import { TestRunConfigPanel } from "@/components/features/chat/TestRunConfigPanel"; // Lazy loaded
// import ConversationSidebar from "@/components/features/chat/ConversationSidebar"; // Lazy loaded
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label"; 
import { AgentSelector } from "@/components/features/agent-selector/agent-selector";
// import * as cs from "@/lib/firestoreConversationStorage"; // No longer directly used here
import { useRouter, useParams } from "next/navigation";
// import { useChatStore, ActiveChatTarget } from '@/hooks/use-chat-store'; // Removed old hook import
import { useChatStore, ActiveChatTarget, ExtendedChatMessageUI, OptimisticUpdateAction } from '@/stores/chatStore'; // Import Zustand store and types
import { llmModels as appLlmModels } from '@/data/llm-models'; // For ChatHeader llmModels prop


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

  // Instantiate the Zustand store
  const store = useChatStore();

  // Re-introduce useOptimistic here, using store.messages as the source of truth
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<ExtendedChatMessageUI[], OptimisticUpdateAction>(
    store.messages, // Initialize with the "true" messages from the Zustand store
    (state, action) => { // Reducer logic remains the same as in the old hook
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

  // Effect to update store's currentUserId when currentUser changes from AuthContext
  useEffect(() => {
    store.setCurrentUserId(currentUser?.uid);
  }, [currentUser?.uid, store.setCurrentUserId]);

  // Effect to load conversations when currentUserId is available in the store
  useEffect(() => {
    if (store.currentUserId && store.conversations.length === 0 && !store.isLoadingConversations) {
      store.loadConversations(store.currentUserId);
    }
  }, [store.currentUserId, store.conversations.length, store.isLoadingConversations, store.loadConversations]);


  const ConversationSidebar = lazy(() => import("@/components/features/chat/ConversationSidebar"));
  const TestRunConfigPanel = lazy(() => import("@/components/features/chat/TestRunConfigPanel"));

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
  // const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null); // From store

  const activeChatTargetName = useMemo(() => {
    if (currentAgent) {
      if ('name' in currentAgent) return currentAgent.name;
      if ('agentName' in currentAgent) return currentAgent.agentName;
    }
    const activeConv = store.conversations.find(c => c.id === store.activeConversationId);
    if (activeConv?.title) return activeConv.title;
    return "New Chat";
  }, [currentAgent, store.conversations, store.activeConversationId]);

  const {
    savedAgents,
    // setSavedAgents, // Not available/needed from Zustand store directly like this
    // addAgent, // Not directly used by chat-ui for adding agents
    // updateAgent, // Not directly used by chat-ui for updating
    // deleteAgent, // Not directly used by chat-ui for deleting
    isLoadingAgents, // Might be useful for conditional rendering if agents list is loading
  } = useAgentStore();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isVerboseMode, setIsVerboseMode] = useState<boolean>(false); // Added verbose mode state
  // const [inputValue, setInputValue] = useState(""); // From store
  // const [isPending, setIsPending] = useState(false); // From store
  // const [isLoadingMessages, setIsLoadingMessages] = useState(false); // From store
  const [isADKInitializing, setIsADKInitializing] = useState<boolean>(false); // Keep for ADK specific UI

  // Test Run Config State
  const [testRunConfig, setTestRunConfig] = useState<TestRunConfig>({
    temperature: undefined,
    streamingEnabled: true,
  });
  const [isTestConfigPanelOpen, setIsTestConfigPanelOpen] = useState(false);

  // User-facing chat configuration state
  const [userChatConfig, setUserChatConfig] = useState<ChatRunConfig>({
    streamingEnabled: true,
    simulatedVoiceConfig: {
      voice: 'alloy',
      speed: 1.0,
    },
  });

  const handleUserChatConfigChange = (newConfig: Partial<ChatRunConfig>) => {
    setUserChatConfig(prev => ({
      ...prev,
      ...newConfig,
      simulatedVoiceConfig: newConfig.simulatedVoiceConfig
        ? { ...prev.simulatedVoiceConfig, ...newConfig.simulatedVoiceConfig }
        : prev.simulatedVoiceConfig,
    }));
  };

  // Message and Conversation State - MOVED TO useChatStore
  // const [messages, setMessages] = useState<ExtendedChatMessageUI[]>([]);
  // const [conversations, setConversations] = useState<Conversation[]>([]);
  // const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  // const [inputContinuation, setInputContinuation] = useState<any>(null);

  // File Handling State - REMOVED as it's now in MessageInputArea.tsx
  // const [selectedFile, setSelectedFile] = useState<File | null>(null); // REMOVED
  // const [selectedFileName, setSelectedFileName] = useState<string | null>(null); // REMOVED
  // const [selectedFileDataUri, setSelectedFileDataUri] = useState<string | null>(null); // REMOVED

  // Agent and Gem Selection State
  const [selectedGemId, setSelectedGemId] = useState<string | null>(
    initialGems[0]?.id ?? null
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedADKAgentId, setSelectedADKAgentId] = useState<string | null>(null);
  const [adkAgents, setADKAgents] = useState<ADKAgent[]>([]);
  const [pendingAgentConfig, setPendingAgentConfig] = useState<AgentConfig | ExtendedSavedAgentConfigType | null>(null); // Keep for Agent Creator UI
  const [selectedAgentConfig, setSelectedAgentConfig] = useState<ExtendedSavedAgentConfigType | null>(null);
  const mappedAdkAgents: AgentSelectItem[] = adkAgents.map((agentConfig: ADKAgent): AgentSelectItem => ({
    id: agentConfig.id, 
    displayName: agentConfig.displayName,
  }));

  const usingADKAgent = useMemo(() => !!selectedADKAgentId, [selectedADKAgentId]);

  // activeChatTarget is now a prop for store functions, but its computation logic can remain here
  const activeChatTarget = useMemo((): ActiveChatTarget | null => {
    if (usingADKAgent && selectedADKAgentId && adkAgents.length > 0) {
      const adkAgent = adkAgents.find((agent: ADKAgent) => agent.id === selectedADKAgentId);
      if (adkAgent && adkAgent.config) return { id: adkAgent.id, name: adkAgent.displayName, type: 'adk-agent' as const, config: adkAgent.config };
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
  }, [selectedAgentId, savedAgents, selectedGemId, selectedADKAgentId, adkAgents, usingADKAgent]);


  // Optimistic messages logic MOVED TO useChatStore
  // const [optimisticMessages, addOptimisticMessage] = useOptimistic(...)

  // isLoadingConversations is now store.isLoadingConversations

  useEffect(() => {
    setPendingAgentConfig(null); // This can remain if pendingAgentConfig is UI specific for agent creator
  }, [selectedGemId, selectedAgentId, selectedADKAgentId]);

  // useEffect for loading conversations is now triggered by store.currentUserId change.
  // handleSelectConversation is a store action, router is passed for navigation.
  // useEffect for loading messages is effectively part of handleSelectConversation store action.

  // useEffect to sync activeConversationId from URL params and load initial conversation
  useEffect(() => {
    const pathConvId = params.conversationId as string | undefined;
    if (pathConvId) {
      if (pathConvId !== store.activeConversationId) {
        // Pass router to handleSelectConversation for navigation if needed
        store.handleSelectConversation(pathConvId, router);
      }
    } else if (store.conversations.length > 0 && !store.activeConversationId && !store.isLoadingConversations) {
      const lastActiveId = localStorage.getItem('lastActiveConversationId');
      const targetConv = store.conversations.find(c => c.id === lastActiveId) || store.conversations[0];
      if (targetConv) {
        router.push(`/chat/${targetConv.id}`); // This will trigger the above block via params change
      }
    }
    // If still no activeConversationId (e.g. no conversations at all), do nothing, stay on /chat
  }, [params.conversationId, store.activeConversationId, store.handleSelectConversation, router, store.conversations, store.isLoadingConversations]);

  useEffect(() => {
    if (store.activeConversationId) {
      localStorage.setItem('lastActiveConversationId', store.activeConversationId);
    }
  }, [store.activeConversationId]);


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

  const handleLogout = async () => { // This can remain as UI specific logic
    try {
      await signOut(auth);
      toast({ title: "Logout Successful", variant: "default" });
      // Resetting store state related to user might be needed if not handled by auth context listeners
      // For now, assuming useAuth and useChatStore handle this appropriately
      // store.setMessages([]); // Example, if store needs explicit reset
      // store.setConversations([]);
      // store.setActiveConversationId(null);
      setPendingAgentConfig(null); // UI specific state
    } catch (error) {
      console.error("Error during logout:", error);
      toast({ title: "Logout Failed", variant: "destructive" });
    }
  };

  // handleFileChange is now INTERNAL to MessageInputArea.tsx
  // removeSelectedFile is now INTERNAL to MessageInputArea.tsx

  // handleFormSubmit is now largely store.submitMessage
  // It now needs to accept the file and audio data from MessageInputArea
  const handleFormSubmitWrapper = async (
    event: React.FormEvent<HTMLFormElement>,
    file?: File | null,
    audioDataUri?: string | null,
    attachmentType?: 'file' | 'audio'
  ) => {
    event.preventDefault();
    if (pendingAgentConfig && store.isPending) { // Check store.isPending
      toast({ title: "Aguarde", description: "Por favor, salve ou descarte a configuração do agente pendente antes de enviar uma nova mensagem.", variant: "default"});
      return;
    }
    setPendingAgentConfig(null); // UI specific state for agent creator

    const { id: msgToastId, update: updateMsgToast, dismiss: dismissMsgToast } = toast({
      title: "Sending Message...",
      description: "Please wait.",
      variant: "default"
    });

    try {
      // Call the Zustand store's submitMessage action
      await store.submitMessage(
        store.inputValue,
        activeChatTarget,
        store.currentUserId, // Pass currentUserId from store
        store.activeConversationId, // Pass activeConversationId from store
        optimisticMessages, // Pass current optimistic messages for history construction in action
        attachmentType === 'audio' ? undefined : file,
        attachmentType === 'audio' ? audioDataUri : undefined,
        userChatConfig,
        testRunConfig,
        router // Pass router for navigation if new conversation is created
      );
      // Optimistic updates are handled by useOptimistic hook based on store.messages changes.
      // The store.submitMessage updates the "true" store.messages state.
      updateMsgToast({
        title: "Message Sent!",
        variant: "default"
      });
    } catch (error) {
      console.error("Error submitting message:", error);
      updateMsgToast({
        title: "Error Sending Message",
        description: "Failed to send your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Dismiss the toast after a short delay
      setTimeout(() => {
        dismissMsgToast();
      }, 3000); // 3 seconds
    }
    inputRef.current?.focus(); // Keep UI focus logic
  };


  // handleNewConversation, handleDeleteConversation, handleRenameConversation are store actions.
  // They need currentUserId and router passed if they cause navigation or user-specific ops.

  // fetchADKAgents can remain UI specific for fetching ADK agents list
  const fetchADKAgents = async () => {
    setIsADKInitializing(true);
    try {
      const response = await fetch('/api/adk-agents');
      if (!response.ok) throw new Error('Failed to fetch ADK agents');
      const data = await response.json();
      const formattedAgents: ADKAgent[] = (data.agents || []).map((agent: ADKAgentConfig) => ({
        id: agent.name,
        displayName: agent.name,
        config: agent,
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
    fetchADKAgents(); // This can remain as UI specific logic
  }, []);

  // handleSaveAgent and related pendingAgentConfig logic remains UI specific for agent creator
  const handleSaveAgent = (configToSave: ExtendedAgentConfig | ExtendedSavedAgentConfigType) => {
    if (!currentUser) { /* ... */ return; }
    try {
      if ('agentName' in configToSave) {
        saveAgentConfiguration(
          { /* ... config ... */
            id: configToSave.id || uuidv4(), // Ensure ID if new
            agentName: configToSave.agentName || '',
            agentDescription: configToSave.agentDescription || '',
            agentVersion: configToSave.agentVersion || '1.0.0',
            config: configToSave.config,
            tools: configToSave.tools || [],
            toolConfigsApplied: configToSave.toolConfigsApplied || {}, // ensure it's an object
            toolsDetails: configToSave.toolsDetails || [],
            createdAt: configToSave.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isFavorite: configToSave.isFavorite,
            tags: configToSave.tags,
           },
          currentUser.uid
        ).then(() => toast({ title: "Agent Saved" }))
         .catch((error: Error) => toast({ title: "Save Failed", description: error.message, variant: "destructive" }));
      } else if ('name' in configToSave) {
        saveAgentConfiguration(
          { /* ... config ... */
            id: uuidv4(),
            agentName: configToSave.name || "New Agent",
            agentDescription: configToSave.description || "",
            agentVersion: "1.0.0",
            config: { 
              type: 'custom', 
              framework: 'genkit' as AgentFramework,
              customLogicDescription: configToSave.description,
              globalInstruction: configToSave.description
            },
            tools: [],
            toolConfigsApplied: {},
            toolsDetails: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            templateId: undefined,
            isFavorite: false,
            tags: [],
          },
          currentUser.uid
        ).then(() => toast({ title: "Agent Saved" }))
         .catch((error: Error) => toast({ title: "Save Failed", description: error.message, variant: "destructive" }));
      } else {
        toast({ title: "Error", description: "Unknown agent configuration type", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error Saving Agent", variant: "destructive" });
    }
  };

  const handleSavePendingAgent = () => {
    if (pendingAgentConfig) {
      if ('agentName' in pendingAgentConfig || 'name' in pendingAgentConfig) {
        handleSaveAgent(pendingAgentConfig as ExtendedAgentConfig | ExtendedSavedAgentConfigType);
      } else {
        toast({ title: "Error", description: "Invalid agent configuration format", variant: "destructive"});
      }
    }
  };

  const handleDiscardPendingAgent = () => {
    setPendingAgentConfig(null);
    toast({ title: "Draft Discarded" });
  };

  // handleExportChatLog remains UI specific
  const handleExportChatLog = () => {
    if (!store.activeConversationId) { /* ... */ return; }
    if (store.optimisticMessages.length === 0) { /* ... */ return; }
    const conversationName = activeChatTargetName || `conversation_${store.activeConversationId}`;
    const safeConversationName = conversationName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filename = `${safeConversationName}_log.json`;
    const exportData = {
      conversationId: store.activeConversationId,
      conversationTitle: activeChatTargetName,
      exportedAt: new Date().toISOString(),
      userId: store.currentUserId,
      messages: store.optimisticMessages.map(msg => ({
        id: msg.id, text: msg.text, sender: msg.sender,
        timestamp: msg.timestamp ? (msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp) : undefined,
        status: msg.status, isStreaming: msg.isStreaming, feedback: msg.feedback,
        imageUrl: msg.imageUrl, fileName: msg.fileName,
      })),
    };
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
    toast({ title: "Exportado", description: `Histórico da conversa salvo em ${filename}` });
  };

  // handleSuggestionClick remains UI specific
  const handleSuggestionClick = (suggestion: string) => {
    store.setInputValue(suggestion);
    inputRef.current?.focus();
  };

  // handleFeedback, handleRegenerate are store actions.
  // They will need parameters like activeConversationId, optimisticMessages (for context).

  // handleInputChange is store.setInputValue

  // Scroll to bottom effect now uses `optimisticMessages` from the local `useOptimistic` hook
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('div');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [optimisticMessages, store.isPending]); // store.isPending still relevant for agent typing


  // Test config related functions remain UI specific
  const handleTestConfigChange = (newConfig: Partial<TestRunConfig>) => {
    setTestRunConfig(prev => ({ ...prev, ...newConfig }));
  };
  const handleApplyTestConfig = () => {
    setIsTestConfigPanelOpen(false);
    toast({ title: "Test Settings Applied" });
  };

  // handleFileChange needs to be added to the store if not already.
  // For now, assuming store.handleFileChange exists. If it's just simple state updates,
  // store.setSelectedFile, store.setSelectedFileName, store.setSelectedFileDataUri can be used.
  // Let's assume a simple version for now if handleFileChange is not in the store:
  // const handleFileChangeForStore = (event: ChangeEvent<HTMLInputElement>) => { // REMOVED
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     store.setSelectedFile(file);
  //     store.setSelectedFileName(file.name);
  //     const reader = new FileReader();
  //     reader.onloadend = () => store.setSelectedFileDataUri(reader.result as string);
  //     reader.readAsDataURL(file);
  //   } else {
  //     store.clearSelectedFile();
  //   }
  // };


  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Suspense fallback={<div>Carregando painel de configuração...</div>}>
        {isTestConfigPanelOpen && (
          <TestRunConfigPanel
            isOpen={isTestConfigPanelOpen}
            onClose={() => setIsTestConfigPanelOpen(false)}
            config={testRunConfig}
            onConfigChange={handleTestConfigChange}
            onApply={handleApplyTestConfig}
          />
        )}
      </Suspense>
      <Suspense fallback={<div className="fixed md:relative inset-y-0 left-0 z-20 w-72 h-full bg-gray-800 text-gray-200 p-4">Carregando sidebar...</div>}>
        {isClient && isSidebarOpen && ( // Ensure isClient and isSidebarOpen are true for Suspense
          <div
            className={cn(
              "fixed md:relative inset-y-0 left-0 z-20 w-72 h-full transition-transform duration-300 ease-in-out bg-gray-800",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
            )}
          >
            <ConversationSidebar
              isOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(false)}
              conversations={store.conversations}
              activeConversationId={store.activeConversationId}
              onSelectConversation={(id) => store.handleSelectConversation(id, router)}
              onNewConversation={() => store.handleNewConversation(store.currentUserId!, "New Chat", router)}
              onDeleteConversation={(conversation) => store.handleDeleteConversation(conversation.id, store.currentUserId, router)}
              onRenameConversation={store.handleRenameConversation}
              isLoading={store.isLoadingConversations}
              currentUserId={store.currentUserId}
              gems={initialGems}
              savedAgents={savedAgents}
              adkAgents={adkAgents}
              onSelectAgent={(agent) => {
                if ('displayName' in agent) setSelectedADKAgentId(agent.id);
                else if ('prompt' in agent) setSelectedGemId(agent.id);
                else if ('agentName' in agent || 'id' in agent) setSelectedAgentId(agent.id);
              }}
            />
          </div>
        )}
      </Suspense>

      <div className="flex flex-col flex-1 w-full md:w-auto overflow-hidden">
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <ChatHeader
            isSidebarOpen={isSidebarOpen}
            activeChatTargetDetails={activeChatTarget}
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            handleLogin={handleLogin}
            handleLogout={handleLogout}
            adkAgents={adkAgents}
            usingADKAgent={!!selectedADKAgentId}
            setUsingADKAgent={(value) => { if (!value) setSelectedADKAgentId(null); }}
            selectedADKAgentId={selectedADKAgentId}
            setSelectedADKAgentId={setSelectedADKAgentId} // These props are for ChatHeader's internal state passed to ChatTargetSelector
            selectedGemId={selectedGemId}
            setSelectedGemId={setSelectedGemId}
            initialGems={initialGems} // Pass initialGems
            llmModels={appLlmModels} // Pass appLlmModels for ChatTargetSelector
            handleNewConversation={() => store.handleNewConversation(store.currentUserId!, "New Chat", router)}
            isADKInitializing={isADKInitializing}
            onExportChatLog={handleExportChatLog}
            isVerboseMode={isVerboseMode} // Pass verbose mode state
            onToggleVerboseMode={() => setIsVerboseMode(!isVerboseMode)} // Pass toggle function
            // User Chat Config props
            userChatConfig={userChatConfig}
            onUserChatConfigChange={handleUserChatConfigChange}
          >
            {/* Test settings button can remain or be moved if header gets too cluttered */}
            <Button variant="outline" size="icon" onClick={() => setIsTestConfigPanelOpen(true)} title="Test Settings" className="ml-2">
              <Settings2 className="h-5 w-5" />
            </Button>
          </ChatHeader>
        </div>
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ScrollArea ref={scrollAreaRef} className="h-full p-4 pt-2">
              {store.isLoadingMessages ? (
                <div className="space-y-4 pb-20">
                  <ChatMessageSkeleton senderType="agent" />
                  <ChatMessageSkeleton senderType="user" />
                  <ChatMessageSkeleton senderType="agent" />
                </div>
              ) : !currentUser ? (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] text-center">
                  <LogIn size={48} className="mb-4 text-primary" />
                  <h2 className="text-2xl font-semibold mb-2">Bem-vindo ao Chat</h2>
                  <p className="mb-4 text-lg">Por favor, faça login para usar o chat.</p>
                  <Button onClick={handleLogin} variant="default" size="lg">
                    <LogIn className="mr-2 h-5 w-5" /> Entrar com Google
                  </Button>
                </div>
              ) : store.optimisticMessages.length === 0 && !store.isPending && !pendingAgentConfig ? (
                <div className="min-h-[calc(100vh-180px)]">
                  <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
                </div>
              ) : (
                <div className="pb-20">
                  <MessageList
                    messages={store.optimisticMessages.map(m => ({...m, isUser: m.sender === 'user'}))}
                    isPending={store.isPending}
                    onRegenerate={(messageId) => store.handleRegenerate(messageId, activeChatTarget, testRunConfig)}
                    onFeedback={store.handleFeedback}
                    isVerboseMode={isVerboseMode} // Pass isVerboseMode to MessageList
                  />
                </div>
              )}
            </ScrollArea>
          </div>

          {pendingAgentConfig && ( // Keep pendingAgentConfig UI for agent creator
            <Card className="m-4 border-primary shadow-lg absolute bottom-0 left-0 right-0 mb-20 bg-background z-10">
              <CardHeader>
                <CardTitle>Revisar Configuração Proposta do Agente</CardTitle>
                <CardDescription>
                  O Assistente de Criação de Agentes elaborou a seguinte configuração. Você pode salvá-la ou descartá-la e continuar conversando para refiná-la.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-60 overflow-y-auto bg-muted/30 p-4 rounded-md">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(pendingAgentConfig, null, 2)}
                </pre>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleDiscardPendingAgent}>
                    <Trash2 className="mr-2 h-4 w-4"/> Descartar e Continuar
                </Button>
                <Button onClick={handleSavePendingAgent}>
                    <Save className="mr-2 h-4 w-4"/> Salvar Este Agente
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <div className="sticky bottom-0 w-full bg-background border-t p-2 z-10">
          <div className="mx-auto max-w-4xl flex items-end gap-2">
            <MessageInputArea
              formRef={useRef<HTMLFormElement>(null)}
              inputRef={inputRef}
              fileInputRef={fileInputRef}
              onSubmit={handleFormSubmitWrapper} // Pass the updated wrapper
              isPending={store.isPending || !!pendingAgentConfig} // Combine store pending with UI pending for agent creator
              // selectedFile, selectedFileName, selectedFileDataUri, onRemoveAttachment, handleFileChange props are removed
              inputValue={store.inputValue}
              onInputChange={(e) => store.setInputValue(typeof e === 'string' ? e : e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
