/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense, lazy } from "react";
import Link from "next/link"; // Added Link for ContextualHelp
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Plus, Bug, Settings2, AlertTriangle } from "lucide-react"; // Added Settings2, AlertTriangle
import { useAgents } from "@/contexts/AgentsContext";
import { v4 as uuidv4 } from "uuid";
import { useGenkitSession, UseGenkitSessionOptions } from "@/hooks/useGenkitSession";
import { toast } from "@/hooks/use-toast";
import { useAchievements } from "@/hooks/useAchievements"; // Added useAchievements
import ContextualHelp from "@/components/shared/ContextualHelp"; // Added ContextualHelp
// import { GenkitSessionService } from "@/services/GenkitSessionService"; // Not directly used
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import type { TestRunConfig } from "@/types/chat-types"; // Added TestRunConfig
// import { TestRunConfigPanel } from "@/components/features/chat/TestRunConfigPanel"; // Lazy loaded
import { StreamingMessageList } from "@/components/features/chat/streaming/StreamingMessageList";
import { StreamingInputArea } from "@/components/features/chat/streaming/StreamingInputArea";
import { EventDebugPanel } from "@/components/features/chat/streaming/EventDebugPanel";
import SimpleChatHeader from "@/components/features/chat/SimpleChatHeader";
import WelcomeScreen from "@/components/features/chat/WelcomeScreen";
// import ConversationSidebar from "@/components/features/chat/ConversationSidebar"; // Lazy loaded
import type { SavedAgentConfiguration, AgentConfig } from '@/types/agent-configs-fixed';
import { getToolsByIds } from "@/ai/tools";
import type { Tool } from '@genkit-ai/sdk';

export function ChatUIStreaming() {
  const { savedAgents } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  // const [isLoadingAgents, setIsLoadingAgents] = useState(true); // Not strictly used, can be removed if not needed for UI
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string>(uuidv4());

  const ConversationSidebar = lazy(() => import("@/components/features/chat/ConversationSidebar"));
  const TestRunConfigPanel = lazy(() => import("@/components/features/chat/TestRunConfigPanel"));
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [testRunConfig, setTestRunConfig] = useState<TestRunConfig>({
    temperature: undefined, // Or a default like 0.7
    streamingEnabled: true, // Default to true for streaming UI
  });
  const [isTestConfigPanelOpen, setIsTestConfigPanelOpen] = useState(false);
  const [showChatErrorHelp, setShowChatErrorHelp] = useState(false); // State for chat error help

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { unlockAchievement } = useAchievements(); // Initialize achievements hook

  const selectedAgent = React.useMemo<SavedAgentConfiguration | undefined>(() => {
    return savedAgents?.find(agent => agent.id === selectedAgentId);
  }, [savedAgents, selectedAgentId]);

  const getConfiguredTools = useCallback((): Tool[] => {
    if (!selectedAgent?.tools) return [];
    return getToolsByIds(selectedAgent.tools);
  }, [selectedAgent]);

  useEffect(() => {
    if (savedAgents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(savedAgents[0].id);
    }
    // setIsLoadingAgents(false);
  }, [savedAgents, selectedAgentId]);

  const handleEvent = useCallback((event: any) => {
    setEvents((prev) => [
      ...prev,
      { ...event, timestamp: new Date().toISOString() },
    ]);
  }, []);

  const genkitSessionOptions: UseGenkitSessionOptions = React.useMemo(() => ({
    initialSessionId: `conversation-${currentConversationId}`,
    context: { tools: getConfiguredTools() },
    onEvent: handleEvent,
    onError: (genkitError: Error) => {
      toast({
        title: "Erro na sessão Genkit",
        description: genkitError.message,
        variant: "destructive",
      });
    },
    // Conditionally set flowName if an agent is selected and it's a Genkit agent
    // Adjust this logic based on how flows are identified/named in your system
    flowName: selectedAgent?.config?.framework === 'genkit' ? selectedAgent.agentName : undefined,
  }), [currentConversationId, getConfiguredTools, handleEvent, selectedAgent]);

  const {
    messages,
    isProcessing,
    sessionState,
    error: genkitError, // Renamed to avoid conflict with other error variables if any
    sendMessage,
    clearMessages,
    updateMessageExtras, // Added from useGenkitSession
    // createNewSession, // Not directly used, session re-initializes with options change
  } = useGenkitSession(genkitSessionOptions);

  const getAgentConfigForMessage = () => {
    let modelId = "googleai/gemini-1.5-flash-latest";
    let systemPrompt = "Você é um assistente útil.";
    // Use temperature from testRunConfig if available, otherwise agent's, then default
    let temperature = testRunConfig.temperature !== undefined
                      ? testRunConfig.temperature
                      : 0.7; // Default if not in testRunConfig or agent config

    const currentAgentTools = getConfiguredTools();

    if (selectedAgent?.config?.type === "llm") {
      const llmConfig = selectedAgent.config as Extract<AgentConfig, {type: 'llm'}>;
      modelId = llmConfig.agentModel || modelId;
      systemPrompt = llmConfig.systemPromptGenerated || systemPrompt;
      // Prioritize testRunConfig, then agent config, then default
      temperature = testRunConfig.temperature !== undefined
                    ? testRunConfig.temperature
                    : (llmConfig.agentTemperature !== undefined ? llmConfig.agentTemperature : temperature);
    }
    // Note: The streamingEnabled from testRunConfig is not directly used here yet,
    // as useGenkitSession inherently streams. This would be part of Step 5 if we were to
    // dynamically switch streaming behavior.
    return { modelId, systemPrompt, tools: currentAgentTools, temperature };
  };

  useEffect(() => {
    if (genkitError) {
      toast({
        title: "Erro na Sessão",
        description: genkitError.message,
        variant: "destructive",
      });
      setEvents((prev) => [
        ...prev,
        { type: "error-hook", message: genkitError.message, timestamp: new Date().toISOString() },
      ]);
    }
  }, [genkitError]);

  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSendMessage = async (messageText: string, fileDataUri?: string) => {
    if (!messageText.trim() && !fileDataUri) return;

    // --- Achievement: First Chat ---
    const hasSentFirstMessage = localStorage.getItem('hasSentFirstChatMessage');
    if (!hasSentFirstMessage) {
      unlockAchievement('first-chat');
      localStorage.setItem('hasSentFirstChatMessage', 'true');
    }
    // --- End Achievement ---

    try {
      setEvents((prev) => [
        ...prev,
        { type: "user-message", content: messageText, timestamp: new Date().toISOString() },
      ]);

      const agentConfigForMessage = getAgentConfigForMessage(); // Call it once
      
      await sendMessage(messageText, {
        ...agentConfigForMessage, // Spread the config object
        fileDataUri: fileDataUri || undefined,
      });

      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    } catch (err: any) {
      console.error("Erro ao processar mensagem:", err);
      setEvents((prev) => [
        ...prev,
        { type: "error-send-message", message: err instanceof Error ? err.message : "Erro desconhecido", timestamp: new Date().toISOString() },
      ]);
    }
  };

  const clearEventsLog = () => {
    setEvents([]);
  };

  const handleRegenerate = async (messageId: string) => {
    const agentMessageIndex = messages.findIndex(msg => msg.id === messageId);

    if (agentMessageIndex === -1) {
      toast({ title: "Error", description: "Agent message to regenerate not found.", variant: "destructive" });
      return;
    }

    const agentMessage = messages[agentMessageIndex];
    if (agentMessage.role !== 'model') {
      toast({ title: "Error", description: "Only model responses can be regenerated.", variant: "destructive" });
      return;
    }

    // Find the last user message before this agent message
    let userMessageIndex = -1;
    for (let i = agentMessageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMessageIndex = i;
        break;
      }
    }

    if (userMessageIndex === -1) {
      toast({ title: "Error", description: "Could not find the original user prompt for this message.", variant: "destructive" });
      return;
    }

    const userPromptMessage = messages[userMessageIndex];

    // History is all messages UP TO (but not including) the user prompt message
    const historyForRegeneration = messages.slice(0, userMessageIndex);

    const agentConfig = getAgentConfigForMessage();

    try {
      setEvents((prev) => [
        ...prev,
        { type: "user-message-regenerate", originalPrompt: userPromptMessage.content, fromMessageId: messageId, timestamp: new Date().toISOString() },
      ]);

      // As per subtask, assume sendMessage appends. Old message remains.
      await sendMessage(userPromptMessage.content, {
        ...agentConfig,
        // fileDataUri: userPromptMessage.fileDataUri || undefined, // Assuming no re-attachment for now
      }, historyForRegeneration); // Pass history as the third argument

      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);

    } catch (err: any) {
      console.error("Erro ao regenerar mensagem:", err);
      setEvents((prev) => [
        ...prev,
        { type: "error-regenerate-message", message: err instanceof Error ? err.message : "Erro desconhecido", timestamp: new Date().toISOString() },
      ]);
       toast({ title: "Error", description: "Failed to regenerate response.", variant: "destructive" });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleNewConversation = () => {
    const newConvId = uuidv4();
    setCurrentConversationId(newConvId); // This will trigger re-memoization of genkitSessionOptions
    clearMessages(); 
    // createNewSession(); // Call if useGenkitSession needs explicit re-init beyond options change
    clearEventsLog();
  };

  const handleFeedback = (messageId: string, feedback: 'liked' | 'disliked' | null) => {
    console.log("Feedback for streaming message:", { messageId, feedback });
    if (updateMessageExtras) {
      updateMessageExtras(messageId, { feedback });
    } else {
      // Fallback or error if updateMessageExtras is not available
      // This might involve manually updating the messages array if it were directly state managed here
      console.warn("updateMessageExtras is not available from useGenkitSession. Cannot update feedback in state.");
      // As a temporary workaround if messages were local state:
      // setMessages(prevMessages => prevMessages.map(m => m.id === messageId ? { ...m, feedback } : m));
      toast({
        title: "Warning",
        description: "Could not persist feedback change in the UI state directly. The hook needs an update mechanism.",
        variant: "default",
      });
    }
  };

  const handleTestConfigChange = (newConfig: Partial<TestRunConfig>) => {
    setTestRunConfig(prev => ({ ...prev, ...newConfig }));
  };

  const handleApplyTestConfig = () => {
    setIsTestConfigPanelOpen(false);
    toast({ title: "Test Settings Applied", description: "Temporary settings will be used for the next interaction." });
    // Potentially inform useGenkitSession or re-evaluate options if streamingEnabled changed
    if (testRunConfig.streamingEnabled === false) {
        // Handle logic for disabling streaming if possible,
        // or inform user they might need to switch to non-streaming chat.
        toast({ title: "Streaming Disabled", description: "Consider switching to the non-streaming chat if issues occur.", variant: "default"});
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
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
      <Suspense fallback={<div className="w-64 p-4 bg-gray-800 text-gray-200">Carregando sidebar...</div>}>
        {isSidebarOpen && ( // Conditionally render based on isSidebarOpen for Suspense to work correctly
          <ConversationSidebar
            // Props seem mismatched with ConversationSidebar's definition.
            // Passing what's currently used in this file.
            // TODO: Reconcile props for ConversationSidebar.
            // Expected: isOpen, conversations, activeConversationId, onSelectConversation, etc.
            // Current pass: selectedAgentId, setSelectedAgentId, savedAgents, handleNewConversation, isSidebarOpen, onMenuToggle
            isOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            conversations={[]} // Placeholder - this component manages its own conversations via useChatStore or similar
            activeConversationId={null} // Placeholder
            onSelectConversation={() => {}} // Placeholder
            onNewConversation={handleNewConversation}
            onDeleteConversation={async () => {}} // Placeholder
            onRenameConversation={() => {}} // Placeholder
            isLoading={false} // Placeholder
            gems={[]} // Placeholder
            savedAgents={savedAgents}
            adkAgents={[]} // Placeholder
            onSelectAgent={() => {}} // Placeholder
            // Original props from this file's usage:
            // selectedAgentId={selectedAgentId}
            // setSelectedAgentId={setSelectedAgentId} - This should be handled internally or via onSelectAgent
            // handleNewConversation={handleNewConversation} - Correctly passed to onNewConversation
            // isSidebarOpen={isSidebarOpen} - Correctly passed to isOpen
            // onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} - Correctly passed to onToggleSidebar
          />
        )}
      </Suspense>

      <Card className="flex flex-col flex-1 h-full overflow-hidden border-0 rounded-none md:border md:rounded-lg md:ml-0">
        <div className="flex items-center justify-between p-2 border-b">
            <SimpleChatHeader
                title={selectedAgent?.agentName || "Chat com IA"}
                description={selectedAgent?.agentDescription || "AgentVerse Chat"}
                modelInfo={(selectedAgent?.config?.type === "llm" ? (selectedAgent.config as Extract<AgentConfig, {type: 'llm'}>).agentModel : undefined) || "Modelo padrão"}
                tools={(selectedAgent?.tools || []).length}
            />
            <div className="flex items-center space-x-2">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="md:hidden" // Only show on small screens to toggle sidebar
                    title="Toggle Sidebar"
                >
                    <Menu className="w-4 h-4" />
                </Button>
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setIsDebugPanelOpen(!isDebugPanelOpen)}
                    title="Painel de depuração"
                >
                    <Bug className="w-4 h-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsTestConfigPanelOpen(true)}
                    title="Test Settings"
                >
                    <Settings2 className="w-4 h-4" />
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNewConversation}
                >
                    <Plus className="w-4 h-4 mr-2" /> Nova conversa
                </Button>
                 <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowChatErrorHelp(true)}
                    title="Simular Erro"
                    className="ml-2" // Add some margin if needed
                >
                    <AlertTriangle className="w-4 h-4 mr-2" /> Simular Erro
                </Button>
            </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-full" id="message-scroll-area">
            <div className={cn("flex flex-col gap-4 p-4", messages.length === 0 && "h-full")}> {/* Removed pb-20 for contextual help */}
              {messages.length === 0 && !showChatErrorHelp ? ( // Hide welcome if error help is shown
                <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
              ) : (
                <StreamingMessageList
                  messages={messages}
                  isProcessing={isProcessing}
                  onRegenerate={handleRegenerate}
                  onFeedback={handleFeedback}
                />
              )}
            </div>
          </ScrollArea>
        </div>
        <ContextualHelp
          type="alert"
          variant="destructive"
          show={showChatErrorHelp}
          icon={<AlertTriangle className="h-4 w-4" />}
          alertTitle="Erro ao Enviar Mensagem"
          content={
            <>
              Ocorreu um erro simulado ao enviar a mensagem. Verifique sua conexão ou{" "}
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowChatErrorHelp(false);
                  toast({ title: "Ação 'Tentar Novamente' clicada (simulado)"});
                }}
                className="underline hover:text-destructive-foreground font-semibold"
              >
                tente novamente
              </Link>.
              Se o problema persistir, consulte a{" "}
              <Link
                href="/docs/errors#chat"
                onClick={() => setShowChatErrorHelp(false)}
                className="underline hover:text-destructive-foreground font-semibold"
              >
                documentação de erros comuns
              </Link>.
            </>
          }
        />
        <StreamingInputArea
          onSubmit={handleSendMessage}
          isProcessing={isProcessing}
          placeholder="Envie uma mensagem..."
        />
      </Card>

      <EventDebugPanel 
        events={events}
        sessionState={sessionState}
        isVisible={isDebugPanelOpen}
        onClose={() => setIsDebugPanelOpen(false)}
      />
    </div>
  );
}
