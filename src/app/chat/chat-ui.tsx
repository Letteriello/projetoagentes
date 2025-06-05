"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LogIn,
  Menu,
  Save,
  Trash2,
  Settings2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  Suspense,
  lazy,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import { useAuth } from "@/contexts/AuthContext";
import { saveAgentConfiguration } from "@/lib/agentServices"; // Assuming this service is correctly defined
import { auth } from "@/lib/firebaseClient";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

// Core Type Imports
import type {
  AgentConfig,
  LLMAgentConfig, // Used by ExtendedSavedAgentConfigType if config is LLM
  SavedAgentConfiguration, // Used as SavedAgentConfigType alias and ExtendedSavedAgentConfigType
  AgentFramework
} from '@/types/agent-core';
import type {
  Conversation,
  CoreChatMessage, // Replaces ChatMessageUI
  TestRunConfig, // Re-exported by chat-core
  ChatRunConfig // Extended in chat-core
} from "@/types/chat-core";
import type { AvailableTool } from '@/types/tool-core'; // For builderAvailableTools if used

// Data imports (Placeholder data is used in the original snippet, actual imports would be from new paths)
// For example: import { initialGemsData } from '@/data/agent-builder-config';
// import { allAvailableTools } from '@/data/available-tools';
// Using placeholders as in the original for now:
const initialGems: Gem[] = []; 
const iconComponents: any = {};
// const builderAvailableTools: AvailableTool[] = []; // If this was from a data file, import it. Using local mock for now.


// Local type definitions from the original file - review if they can use core types
export type ADKAgentConfig = {
  name: string;
  description?: string;
  model?: { name?: string; temperature?: number };
  tools?: Array<ADKTool>; // ADKTool is also local
  agentModel?: string;
  agentTemperature?: number;
  framework?: AgentFramework; // Added to use core type
  [key: string]: any;
};

export interface ExtendedAgentConfig { // This seems like a local utility type
  description?: string;
  name: string;
  type: string; // Should ideally be AgentType from agent-core
  framework: AgentFramework; // Uses core type
  [key: string]: any;
};

export type ADKTool = { // Local type
  name: string;
  description?: string;
  [key: string]: any;
};

interface AgentSelectItem { // Local type
  id: string;
  displayName: string;
}

export interface ADKAgent extends AgentSelectItem { // Local type
  config?: ADKAgentConfig;
  [key: string]: any;
}

interface Gem { // Local type
  id: string;
  name: string;
  prompt?: string;
  // Add other properties if necessary
}

// Component Imports
import ChatHeader from "@/components/features/chat/ChatHeader";
import type { ChatHeaderProps } from "@/components/features/chat/ChatHeader";
import WelcomeScreen from "@/components/features/chat/WelcomeScreen";
import MessageList from "@/components/features/chat/MessageList";
import MessageInputArea from "@/components/features/chat/MessageInputArea";
import LoadingState from "@/components/shared/LoadingState";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label"; 
import { AgentSelector } from "@/components/features/agent-selector/agent-selector";
import { useRouter, useParams } from "next/navigation";
import { useChatStore, ActiveChatTarget } from '@/hooks/use-chat-store';

// Mock data for builderAvailableTools as it was local in the original snippet
const builderAvailableTools: AvailableTool[] = [
  {
    id: 'web-search',
    name: 'Pesquisa Web',
    description: 'Permite ao agente buscar informações na internet',
    category: 'knowledge',
    icon: 'Search', // String icon name
    hasConfig: true, // Example property
    needsApiKey: true
  },
  {
    id: 'code-interpreter',
    name: 'Interpretador de Código',
    description: 'Permite ao agente executar código Python',
    category: 'coding',
    icon: 'Code2', // String icon name
    hasConfig: true, // Example property
    needsMcpServer: true
  }
];


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

  const store = useChatStore();

  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const toggleFocusMode = () => setIsFocusModeActive(prev => !prev);

  const ConversationSidebar = lazy(() => import("@/components/features/chat/ConversationSidebar"));
  const TestRunConfigPanel = lazy(() => import("@/components/features/chat/TestRunConfigPanel"));

  // Using SavedAgentConfiguration from agent-core for currentAgent state
  // Gem and ADKAgentConfig are local types or might need their own core definitions if widely used
  const [currentAgent, setCurrentAgent] = useState<SavedAgentConfiguration | Gem | ADKAgentConfig | null>(null);

  const activeChatTargetName = useMemo(() => {
    if (currentAgent) {
      if ('name' in currentAgent && typeof currentAgent.name === 'string') return currentAgent.name; // For Gem and ADKAgentConfig
      if ('agentName' in currentAgent && typeof currentAgent.agentName === 'string') return currentAgent.agentName; // For SavedAgentConfiguration
    }
    const activeConv = store.conversations.find(c => c.id === store.activeConversationId);
    if (activeConv?.title) return activeConv.title;
    return "New Chat";
  }, [currentAgent, store.conversations, store.activeConversationId]);

  const {
    savedAgents,
    // setSavedAgents, // Assuming this is not directly used by ChatUI
    addAgent,
    // updateAgent, // Assuming this is not directly used by ChatUI
    // deleteAgent, // Assuming this is not directly used by ChatUI
  } = useAgents();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const TOOL_KEYWORD = "/tool_weather";
  const MAX_TOOL_USES = 3;
  const toolUseCountRef = useRef<Record<string, number>>({});

  const RATE_LIMIT_WINDOW_MS = 15000;
  const RATE_LIMIT_MAX_MESSAGES = 5;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messageTimestampsRef = useRef<number[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [timeToNextMessage, setTimeToNextMessage] = useState(0);
  const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isVerboseMode, setIsVerboseMode] = useState<boolean>(false);
  const [isADKInitializing, setIsADKInitializing] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);

  const [testRunConfig, setTestRunConfig] = useState<TestRunConfig>({ // TestRunConfig from chat-core
    temperature: undefined,
    streamingEnabled: true,
  });
  const [isTestConfigPanelOpen, setIsTestConfigPanelOpen] = useState(false);

  const [userChatConfig, setUserChatConfig] = useState<ChatRunConfig>({ // ChatRunConfig from chat-core
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
        ? { ...(prev.simulatedVoiceConfig || { voice: 'alloy', speed: 1.0 }), ...newConfig.simulatedVoiceConfig }
        : prev.simulatedVoiceConfig,
    }));
  };

  const [selectedGemId, setSelectedGemId] = useState<string | null>(
    initialGems[0]?.id ?? null
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedADKAgentId, setSelectedADKAgentId] = useState<string | null>(null);
  const [adkAgents, setADKAgents] = useState<ADKAgent[]>([]);
  // pendingAgentConfig might be a partial or full SavedAgentConfiguration or a local ADK/Gem config
  const [pendingAgentConfig, setPendingAgentConfig] = useState<Partial<SavedAgentConfiguration> | ADKAgentConfig | Gem | null>(null);

  const mappedAdkAgents: AgentSelectItem[] = adkAgents.map((agentConfig: ADKAgent): AgentSelectItem => ({
    id: agentConfig.id, 
    displayName: agentConfig.displayName,
  }));

  const usingADKAgent = useMemo(() => !!selectedADKAgentId, [selectedADKAgentId]);

  const activeChatTarget = useMemo((): ActiveChatTarget | null => {
    if (usingADKAgent && selectedADKAgentId && adkAgents.length > 0) {
      const adkAgent = adkAgents.find((agent: ADKAgent) => agent.id === selectedADKAgentId);
      if (adkAgent && adkAgent.config) return { id: adkAgent.id, name: adkAgent.displayName, type: 'adk-agent' as const, config: adkAgent.config as any }; // Cast config to any for now
    }
    if (selectedAgentId && savedAgents.length > 0) {
      const currentSavedAgent = savedAgents.find((a: SavedAgentConfiguration) => a.id === selectedAgentId);
      if (currentSavedAgent) return { id: currentSavedAgent.id, name: currentSavedAgent.agentName, type: 'agent' as const, config: currentSavedAgent };
    }
    if (selectedGemId && initialGems.length > 0) {
      const gem = initialGems.find((g: Gem) => g.id === selectedGemId);
      // Assuming Gem config needs to be mapped or is compatible with AgentConfig or a known structure
      if (gem) return { id: gem.id, name: gem.name, type: 'gem' as const, config: gem as any }; // Cast config to any for now
    }
    return initialGems.length > 0 ? { id: initialGems[0].id, name: initialGems[0].name, type: 'gem' as const, config: initialGems[0] as any } : null;
  }, [selectedAgentId, savedAgents, selectedGemId, selectedADKAgentId, adkAgents, usingADKAgent]);

  useEffect(() => {
    setIsClient(true);
    setPendingAgentConfig(null);
    return () => {
      if (rateLimitTimerRef.current) {
        clearTimeout(rateLimitTimerRef.current);
      }
    };
  }, [selectedGemId, selectedAgentId, selectedADKAgentId]);

  useEffect(() => {
    const pathConvId = params.conversationId as string | undefined;
    if (pathConvId && pathConvId !== store.activeConversationId) {
      store.handleSelectConversation(pathConvId);
    }
  // store.handleSelectConversation is a function, if it's stable, this is fine.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.conversationId, store.activeConversationId]);


  const handleLogin = async () => { /* ... */ };
  const handleLogout = async () => { /* ... */ };

  const handleFormSubmitWrapper = async (
    event: React.FormEvent<HTMLFormElement>,
    file?: File | null,
    audioDataUri?: string | null,
    attachmentType?: 'file' | 'audio'
  ) => {
    event.preventDefault();
    if (!currentUser) { /* ... */ return; }
    // ... (tool use limit check) ...
    // ... (rate limit check) ...
    if (pendingAgentConfig && store.isPending) { /* ... */ return; }
    setPendingAgentConfig(null);
    // ... (message timestamp logic) ...

    const { id: msgToastId, update: updateMsgToast, dismiss: dismissMsgToast } = toast({ /* ... */ });

    try {
      await store.submitMessage( // This now sends CoreChatMessage compatible data
        store.inputValue,
        activeChatTarget,
        attachmentType === 'audio' ? undefined : file,
        attachmentType === 'audio' ? audioDataUri : undefined,
        userChatConfig, // This is ChatRunConfig
        testRunConfig // This is TestRunConfig
      );
      updateMsgToast({ title: "Message Sent!", variant: "default" });
    } catch (error) { /* ... */ }
    finally { setTimeout(() => dismissMsgToast(), 3000); }
    inputRef.current?.focus();
  };

  const fetchADKAgents = async () => { /* ... uses ADKAgent, ADKAgentConfig ... */ };
  useEffect(() => { fetchADKAgents(); }, []);

  // handleSaveAgent needs to ensure it passes SavedAgentConfiguration to agentServices
  const handleSaveAgent = (configToSave: Partial<SavedAgentConfiguration> | ADKAgentConfig | Gem) => {
    if (!currentUser) { return; }
    try {
      let agentToSave: SavedAgentConfiguration;
      if ('agentName' in configToSave && 'config' in configToSave) { // Likely SavedAgentConfiguration or compatible
        agentToSave = {
          id: configToSave.id || uuidv4(),
          agentName: configToSave.agentName!,
          agentDescription: configToSave.agentDescription || "",
          agentVersion: (configToSave as SavedAgentConfiguration).agentVersion || '1.0.0',
          config: configToSave.config as AgentConfig, // Needs to be AgentConfig
          tools: (configToSave as SavedAgentConfiguration).tools || [],
          toolConfigsApplied: (configToSave as SavedAgentConfiguration).toolConfigsApplied || {},
          toolsDetails: (configToSave as SavedAgentConfiguration).toolsDetails || [],
          createdAt: (configToSave as SavedAgentConfiguration).createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          userId: currentUser.uid,
          isTemplate: !!(configToSave as SavedAgentConfiguration).isTemplate,
          // Ensure all required fields from SavedAgentConfiguration are present
          icon: (configToSave as SavedAgentConfiguration).icon || '',
          isFavorite: !!(configToSave as SavedAgentConfiguration).isFavorite,
          tags: (configToSave as SavedAgentConfiguration).tags || [],
          templateId: (configToSave as SavedAgentConfiguration).templateId || '',
        };
      } else if ('name' in configToSave && 'framework' in configToSave) { // Likely ExtendedAgentConfig from before, map to SavedAgentConfiguration
         const extConfig = configToSave as ExtendedAgentConfig;
         agentToSave = {
            id: uuidv4(),
            agentName: extConfig.name,
            agentDescription: extConfig.description || "",
            agentVersion: "1.0.0",
            config: { // This needs to be a valid AgentConfig member
                type: extConfig.type as AgentType || 'custom', // Cast or validate
                framework: extConfig.framework,
                agentGoal: extConfig.agentGoal || "", // Assuming these might exist
                agentTasks: extConfig.agentTasks || [],
                // Add other necessary fields based on extConfig.type
            } as AgentConfig,
            tools: [], toolConfigsApplied: {}, toolsDetails: [],
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
            userId: currentUser.uid, isTemplate: false, icon: '', isFavorite: false, tags: [], templateId: '',
         };
      } else if ('name' in configToSave) { // Could be Gem or ADKAgentConfig
        const simpleConfig = configToSave as Gem | ADKAgentConfig;
        agentToSave = {
          id: uuidv4(),
          agentName: simpleConfig.name,
          agentDescription: simpleConfig.description || "",
          agentVersion: "1.0.0",
          config: (simpleConfig as ADKAgentConfig).config ?
            (simpleConfig as ADKAgentConfig).config as AgentConfig : // Risky cast, ADKAgentConfig.config needs mapping
            { type: 'llm', framework: 'genkit', agentGoal: simpleConfig.prompt || "Chat", agentTasks:[], agentModel: "gemini-pro", agentTemperature: 0.7 } as LLMAgentConfig,
          tools: [], toolConfigsApplied: {}, toolsDetails: [],
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          userId: currentUser.uid, isTemplate: false, icon: '', isFavorite: false, tags: [], templateId: '',
        };
      } else {
        toast({ title: "Error", description: "Unknown agent configuration type for saving", variant: "destructive" });
        return;
      }
      // saveAgentConfiguration expects a fully compliant SavedAgentConfiguration
      saveAgentConfiguration(agentToSave, currentUser.uid)
        .then(() => toast({ title: "Agent Saved" }))
        .catch((error: Error) => toast({ title: "Save Failed", description: error.message, variant: "destructive" }));

    } catch (error) {
      toast({ title: "Error Saving Agent", variant: "destructive" });
    }
  };


  const handleSavePendingAgent = () => { /* ... uses handleSaveAgent ... */ };
  const handleDiscardPendingAgent = () => { /* ... */ };
  const handleExportChatLog = () => { /* ... uses store.optimisticMessages (now CoreChatMessage[]) ... */
    if (!store.activeConversationId || store.optimisticMessages.length === 0) return;
    const conversationName = activeChatTargetName || `conversation_${store.activeConversationId}`;
    const safeConversationName = conversationName.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filename = `${safeConversationName}_log.json`;
    const exportData = {
      // ...
      messages: store.optimisticMessages.map(msg => ({ // msg is CoreChatMessage
        id: msg.id,
        role: msg.role, // Use role
        content: msg.content, // Use content
        timestamp: msg.timestamp ? (msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp) : undefined,
        status: msg.status,
        isStreaming: msg.isStreaming,
        feedback: msg.feedback,
        imageUrl: msg.imageUrl,
        fileName: msg.fileName,
        // toolCall, toolResponse if needed
      })),
    };
    // ... (rest of download logic) ...
  };

  const handleSuggestionClick = (suggestion: string) => { /* ... */ };

  useEffect(() => { // Scroll logic
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('div'); // This might be too generic
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [store.optimisticMessages, store.isPending]);

  const handleTestConfigChange = (newConfig: Partial<TestRunConfig>) => { /* ... */ };
  const handleApplyTestConfig = () => { /* ... */ };

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
        {isClient && isSidebarOpen && !isFocusModeActive && (
          <div className={cn( "fixed md:relative inset-y-0 left-0 z-20 w-72 h-full transition-transform duration-300 ease-in-out bg-gray-800", isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0" )}>
            <ConversationSidebar
              isOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(false)}
              conversations={store.conversations.map(conv => ({ // Ensure Conversation type matches if it was changed in chat-core
                ...conv,
                messages: conv.messages // These are already CoreChatMessage[] from chat-core's Conversation type
              }))}
              activeConversationId={store.activeConversationId}
              onSelectConversation={store.handleSelectConversation}
              onNewConversation={() => store.handleNewConversation()}
              onDeleteConversation={(conversation) => store.handleDeleteConversation(conversation.id)}
              onRenameConversation={store.handleRenameConversation}
              isLoading={store.isLoadingConversations}
              currentUserId={store.currentUserId}
              gems={initialGems} // Gem[]
              savedAgents={savedAgents} // SavedAgentConfiguration[]
              adkAgents={adkAgents} // ADKAgent[]
              onSelectAgent={(agent) => { /* ... */ }}
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
            setSelectedADKAgentId={setSelectedADKAgentId}
            selectedGemId={selectedGemId}
            setSelectedGemId={setSelectedGemId}
            initialGems={initialGems}
            handleNewConversation={() => store.handleNewConversation()}
            isADKInitializing={isADKInitializing}
            onExportChatLog={handleExportChatLog}
            isVerboseMode={isVerboseMode}
            onToggleVerboseMode={() => setIsVerboseMode(!isVerboseMode)}
            isFocusModeActive={isFocusModeActive}
            onToggleFocusMode={toggleFocusMode}
            userChatConfig={userChatConfig}
            onUserChatConfigChange={handleUserChatConfigChange}
          >
            <Button variant="outline" size="icon" onClick={() => setIsTestConfigPanelOpen(true)} title="Test Settings" className="ml-2">
              <Settings2 className="h-5 w-5" />
            </Button>
          </ChatHeader>
        </div>
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ScrollArea ref={scrollAreaRef} className="h-full p-4 pt-2">
              <LoadingState isLoading={store.isLoadingMessages} loadingText="Carregando mensagens..." loadingType="spinner" >
                {!currentUser ? (
                  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] text-center">
                    {/* ... Login prompt ... */}
                  </div>
                ) : store.optimisticMessages.length === 0 && !store.isPending && !pendingAgentConfig ? (
                  <div className="min-h-[calc(100vh-180px)]">
                    <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
                  </div>
                ) : (
                  <div className="pb-20">
                    <MessageList
                      messages={store.optimisticMessages.map(m => ({ // m is CoreChatMessage
                        ...m,
                        // Map CoreChatMessage fields to what MessageList expects, if different
                        // Example: if MessageList still expects 'text' and 'isUser'
                        // text: m.content,
                        // isUser: m.role === 'user',
                        // sender: m.role, // if MessageList expects sender
                      }))}
                      isPending={store.isPending}
                      onRegenerate={(messageId) => store.handleRegenerate(messageId, activeChatTarget, testRunConfig)}
                      onFeedback={store.handleFeedback}
                      isVerboseMode={isVerboseMode}
                    />
                  </div>
                )}
              </LoadingState>
            </ScrollArea>
          </div>

          {pendingAgentConfig && ( /* ... Pending agent card ... */ )}
        </div>

        <div className="sticky bottom-0 w-full bg-background border-t p-2 z-10">
          {/* ... MessageInputArea ... */}
           <MessageInputArea
              formRef={useRef<HTMLFormElement>(null)}
              inputRef={inputRef}
              fileInputRef={fileInputRef}
              onSubmit={handleFormSubmitWrapper}
              isPending={store.isPending || !!pendingAgentConfig || isRateLimited}
              inputValue={store.inputValue}
              onInputChange={(e) => store.setInputValue(typeof e === 'string' ? e : e.target.value)}
            />
        </div>
      </div>
    </div>
  );
}
