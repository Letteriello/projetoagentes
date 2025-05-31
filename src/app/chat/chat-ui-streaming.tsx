/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Plus, Bug } from "lucide-react"; // Removed SparklesIcon if not used
import { useAgents } from "@/contexts/AgentsContext";
import { v4 as uuidv4 } from "uuid";
import { useGenkitSession, UseGenkitSessionOptions } from "@/hooks/useGenkitSession";
import { toast } from "@/hooks/use-toast";
// import { GenkitSessionService } from "@/services/GenkitSessionService"; // Not directly used
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { StreamingMessageList } from "@/components/features/chat/streaming/StreamingMessageList";
import { StreamingInputArea } from "@/components/features/chat/streaming/StreamingInputArea";
import { EventDebugPanel } from "@/components/features/chat/streaming/EventDebugPanel";
import SimpleChatHeader from "@/components/features/chat/SimpleChatHeader";
import WelcomeScreen from "@/components/features/chat/WelcomeScreen";
import ConversationSidebar from "@/components/features/chat/ConversationSidebar";
import type { SavedAgentConfiguration, AgentConfig } from "@/types/agent-configs";
import { getToolsByIds } from "@/ai/tools";
import type { Tool } from '@genkit-ai/sdk';

export function ChatUIStreaming() {
  const { savedAgents } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  // const [isLoadingAgents, setIsLoadingAgents] = useState(true); // Not strictly used, can be removed if not needed for UI
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string>(uuidv4());
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

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
    // createNewSession, // Not directly used, session re-initializes with options change
  } = useGenkitSession(genkitSessionOptions);

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
    try {
      setEvents((prev) => [
        ...prev,
        { type: "user-message", content: messageText, timestamp: new Date().toISOString() },
      ]);

      let modelId = "googleai/gemini-1.5-flash-latest";
      let systemPrompt = "Você é um assistente útil.";
      let temperature = 0.7;
      const currentAgentTools = getConfiguredTools();

      if (selectedAgent?.config?.type === "llm") {
        const llmConfig = selectedAgent.config as Extract<AgentConfig, {type: 'llm'}>; // Type assertion
        modelId = llmConfig.agentModel || modelId;
        systemPrompt = llmConfig.systemPromptGenerated || systemPrompt;
        temperature = llmConfig.agentTemperature !== undefined ? llmConfig.agentTemperature : temperature;
      }
      
      await sendMessage(messageText, {
        modelId,
        systemPrompt,
        tools: currentAgentTools,
        temperature,
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

  return (
    <div className="flex h-full flex-col bg-background">
      <ConversationSidebar
        selectedAgentId={selectedAgentId}
        setSelectedAgentId={setSelectedAgentId}
        savedAgents={savedAgents}
        handleNewConversation={handleNewConversation}
        isSidebarOpen={isSidebarOpen}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

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
                    size="sm" 
                    onClick={handleNewConversation}
                >
                    <Plus className="w-4 h-4 mr-2" /> Nova conversa
                </Button>
            </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ScrollArea ref={scrollAreaRef} className="h-full" id="message-scroll-area">
            <div className={cn("flex flex-col gap-4 p-4 pb-20", messages.length === 0 && "h-full")}>
              {messages.length === 0 ? (
                <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
              ) : (
                <StreamingMessageList messages={messages} isProcessing={isProcessing} />
              )}
            </div>
          </ScrollArea>
        </div>

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
