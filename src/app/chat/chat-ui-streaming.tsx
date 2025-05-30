"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, Plus, SparklesIcon, Bug } from "lucide-react";
import { useAgents } from "@/contexts/AgentsContext";
import { v4 as uuidv4 } from 'uuid';
import { useGenkitSession } from "@/hooks/useGenkitSession";
import { toast } from "@/hooks/use-toast";
import { genkitSessionService } from "@/services/GenkitSessionService";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { StreamingMessageList } from "@/components/features/chat/streaming/StreamingMessageList";
import { StreamingInputArea } from "@/components/features/chat/streaming/StreamingInputArea";
import { EventDebugPanel } from "@/components/features/chat/streaming/EventDebugPanel";
import ChatHeader from "@/components/features/chat/ChatHeader";
import WelcomeScreen from "@/components/features/chat/WelcomeScreen";
import ConversationSidebar from "@/components/features/chat/ConversationSidebar";
import { SavedAgentConfiguration } from "@/app/agent-builder/page";
import { getToolsByIds } from "@/ai/tools";

// Mapa de ferramentas disponíveis
const availableTools = {
  webSearch: performWebSearchTool,
};

export function ChatUIStreaming() {
  // Estado para gestão de agentes e UI
  const { savedAgents, isLoading } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [conversationId, setConversationId] = useState<string>(uuidv4());
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  
  // Referências para o scroll e controle de UI
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Selecionar o primeiro agente quando a lista é carregada
  useEffect(() => {
    if (savedAgents && savedAgents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(savedAgents[0].id);
    }
  }, [savedAgents, selectedAgentId]);
  
  // Obter o agente selecionado
  const selectedAgent = savedAgents?.find(agent => agent.id === selectedAgentId);
  
  // Callback para processar eventos Genkit
  const handleEvent = useCallback((event: any) => {
    setEvents(prev => [...prev, {...event, timestamp: new Date().toISOString()}]);
    
    // Log de eventos importante para depuração
    console.log(`[Genkit Event] ${event.type}:`, event);
  }, []);
  
  // Hook de sessão Genkit com captura de eventos
  const {
    sessionId,
    messages,
    isProcessing,
    sessionState,
    error,
    sendMessage,
    clearMessages,
    createNewSession
  } = useGenkitSession({
    initialSessionId: `conversation-${conversationId}`,
    onEvent: handleEvent,
    onError: (error) => {
      toast({
        title: 'Erro na sessão',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Efeito para notificar erros
  useEffect(() => {
    if (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
      
      // Adicionar erro ao log de eventos
      setEvents(prev => [...prev, {
        type: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [error, toast]);
  
  // Efeito para rolar para o fim quando novas mensagens chegam
  useEffect(() => {
    if (scrollAreaRef.current && messages.length > 0) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Processar ferramentas configuradas do agente
  const getConfiguredTools = useCallback(() => {
    if (!selectedAgent?.config.tools) return [];
    
    const enabledToolIds = selectedAgent.config.tools
      .filter(tool => tool.enabled)
      .map(tool => tool.id);
    
    return getToolsByIds(enabledToolIds);
  }, [selectedAgent]);
  
  // Manipular envio de mensagem
  const handleSendMessage = async (message: string, fileDataUri?: string) => {
    if (!message.trim() && !fileDataUri) return;
    
    try {
      // Registrar o evento de envio de mensagem no log
      setEvents(prev => [...prev, {
        type: 'user-message',
        content: message,
        timestamp: new Date().toISOString()
      }]);
      
      await sendMessage(message, {
        modelId: selectedAgent?.config.model || 'googleai/gemini-1.5-flash-latest',
        systemPrompt: selectedAgent?.config.systemPrompt,
        tools: getConfiguredTools(),
        temperature: selectedAgent?.config.temperature || 0.7,
        fileDataUri
      });
      
      // Atualizar o scroll depois da resposta
      setTimeout(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('Erro ao processar mensagem:', err);
      
      // Registrar erro no log de eventos
      setEvents(prev => [...prev, {
        type: 'error',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }]);
    }
  };
  
  // Limpar todos os eventos do log
  const clearEvents = () => {
    setEvents([]);
  };
  
  // Manipular sugestão clicada
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };
  
  // Iniciar nova conversa
  const handleNewConversation = () => {
    const newConversationId = uuidv4();
    setConversationId(newConversationId);
    clearMessages();
    createNewSession();
    clearEvents();
  };

  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[280px_1fr] gap-0">
      {/* Sidebar para agentes e conversas */}
      <ConversationSidebar
        selectedAgentId={selectedAgentId}
        setSelectedAgentId={setSelectedAgentId}
        savedAgents={savedAgents}
        handleNewConversation={handleNewConversation}
        isSidebarOpen={isSidebarOpen}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      {/* Área principal de chat */}
      <Card className="flex flex-col h-full overflow-hidden border-0 rounded-none md:border md:rounded-lg md:ml-2">
        {/* Cabeçalho do chat */}
        <ChatHeader
          title={selectedAgent?.name || 'Chat com IA'}
          description={selectedAgent?.description || 'AgentVerse Chat'}
          modelInfo={selectedAgent?.config.model || 'Modelo padrão'}
          tools={selectedAgent?.config.tools?.filter(t => t.enabled).length || 0}
        >
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsDebugPanelOpen(!isDebugPanelOpen)}
            className="ml-2"
            title="Painel de depuração"
          >
            <Bug className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleNewConversation} 
            className="ml-2"
          >
            <Plus className="h-4 w-4 mr-2" /> Nova conversa
          </Button>
        </ChatHeader>
        
        {/* Área de mensagens */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea 
            ref={scrollAreaRef} 
            className="h-full overflow-auto" 
            id="message-scroll-area"
          >
            <div className={cn(
              "flex flex-col gap-6 p-4 pb-20",
              messages.length === 0 && "h-full"
            )}>
              {messages.length === 0 ? (
                <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
              ) : (
                <StreamingMessageList
                  messages={messages}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          </ScrollArea>
        </div>
        
        {/* Área de entrada de mensagem */}
        <StreamingInputArea
          onSubmit={handleSendMessage}
          isProcessing={isProcessing}
          placeholder="Envie uma mensagem..."
        />
      </Card>
      
      {/* Painel de depuração */}
      <EventDebugPanel
        events={events}
        sessionState={sessionState}
        isVisible={isDebugPanelOpen}
        onClose={() => setIsDebugPanelOpen(false)}
      />
    </div>
  );
}