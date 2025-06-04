// src/components/features/agent-builder/agent-creator-chat-ui.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SavedAgentConfiguration, AgentConfig, LLMAgentConfig } from '@/types/agent-configs-fixed'; // Importar tipo unificado
import { Send, Loader2 } from "lucide-react"; // Adicionado Loader2
import { getAiConfigurationSuggestionsAction } from "@/app/agent-builder/actions";
import { toast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import { v4 as uuidv4 } from 'uuid';

interface CreatorChatMessage {
  id: string;
  text: string;
  sender: "user" | "assistant";
}

interface AgentCreatorChatUIProps {
  initialAgentConfig?: SavedAgentConfiguration | null;
}

interface AssistantResponse {
  success: boolean;
  suggestions?: {
    suggestedAgentDescription?: string;
  };
  updatedConfig?: SavedAgentConfiguration;
}

export function AgentCreatorChatUI({ initialAgentConfig }: AgentCreatorChatUIProps) {
  const [conversation, setConversation] = React.useState<CreatorChatMessage[]>([]);
  const [userInput, setUserInput] = React.useState<string>("");
  const [currentAgentConfig, setCurrentAgentConfig] = React.useState<Partial<SavedAgentConfiguration>>(
    initialAgentConfig || { 
      agentName: "", 
      config: { 
        type: 'llm', 
        framework: 'genkit' 
      } as LLMAgentConfig 
    }
  );
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const agentsContext = useAgents();

  React.useEffect(() => {
    if (initialAgentConfig) {
      setCurrentAgentConfig(initialAgentConfig);
      // Optionally, add a starting message if editing
      // setConversation([{id: 'init-edit', text: `Editing agent: ${initialAgentConfig.agentName}. How can I help?`, sender: 'assistant'}]);
    } else {
      // Reset for a new agent
       setCurrentAgentConfig({ 
         agentName: "", 
         config: { 
           type: 'llm', 
           framework: 'genkit' 
         } as LLMAgentConfig 
       });
       setConversation([]);
    }
  }, [initialAgentConfig]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const userMessageText = userInput;
    const currentConversationHistory = conversation.map(msg => ({ role: msg.sender, content: msg.text }));

    const newUserMessage: CreatorChatMessage = { id: Date.now().toString(), text: userMessageText, sender: "user" };
    setConversation(prev => [...prev, newUserMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
      const result = await getAiConfigurationSuggestionsAction(
        currentAgentConfig as SavedAgentConfiguration,
        {
          chatHistory: currentConversationHistory,
          userInput: userMessageText
        }
      );

      if (!result.success) {
        throw new Error(result.error || "Falha ao obter sugestões");
      }

      if (result.data) {
        const responseData = result.data as {
          suggestions?: string[];
          updatedConfig?: Partial<SavedAgentConfiguration>;
        };

        // Atualizar configuração se houver mudanças
        if (responseData.updatedConfig) {
          setCurrentAgentConfig(prev => ({
            ...prev,
            ...responseData.updatedConfig
          }));
        }

        // Adicionar respostas ao chat
        if (responseData.suggestions?.length) {
          responseData.suggestions.forEach(suggestion => {
            const assistantMessage: CreatorChatMessage = {
              id: Date.now().toString(),
              text: suggestion,
              sender: "assistant"
            };
            setConversation(prev => [...prev, assistantMessage]);
          });
        } else {
          const defaultResponse: CreatorChatMessage = {
            id: Date.now().toString(),
            text: "Aqui estão algumas sugestões para melhorar seu agente...",
            sender: "assistant"
          };
          setConversation(prev => [...prev, defaultResponse]);
        }
      }
    } catch (error: any) {
      console.error("Failed to send message to creator flow:", error);
      toast({ title: "Erro de Comunicação", description: error.message || "Não foi possível comunicar com o assistente.", variant: "destructive" });
      const commErrorResponse: CreatorChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Desculpe, ocorreu um erro ao tentar processar sua solicitação.",
        sender: "assistant",
      };
      setConversation(prev => [...prev, commErrorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAgentFromChat = async () => {
    try {
      const fullAgentConfig: SavedAgentConfiguration = {
        ...currentAgentConfig,
        id: currentAgentConfig.id || `agent-${Date.now()}`,
        agentName: currentAgentConfig.agentName || "Novo Agente",
        agentDescription: currentAgentConfig.agentDescription || "",
        agentVersion: currentAgentConfig.agentVersion || "1.0.0",
        icon: currentAgentConfig.icon || "default-icon.svg",
        templateId: currentAgentConfig.templateId || "",
        isTemplate: currentAgentConfig.isTemplate || false,
        isFavorite: currentAgentConfig.isFavorite || false,
        tags: currentAgentConfig.tags || [],
        createdAt: currentAgentConfig.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: currentAgentConfig.userId || "defaultUser",
        config: currentAgentConfig.config || { type: 'llm', framework: 'genkit' } as LLMAgentConfig,
        tools: currentAgentConfig.tools || [],
        toolConfigsApplied: currentAgentConfig.toolConfigsApplied || {},
        toolsDetails: currentAgentConfig.toolsDetails || [],
        internalVersion: 1,
        isLatest: true,
        originalAgentId: currentAgentConfig.id || `agent-${Date.now()}`
      };

      if (currentAgentConfig.id && initialAgentConfig && currentAgentConfig.id === initialAgentConfig.id) {
        const updatedAgent = await agentsContext.updateAgent(currentAgentConfig.id, fullAgentConfig);
        if (updatedAgent) {
          setCurrentAgentConfig(updatedAgent);
          toast({ title: "Agente Atualizado", description: `O agente "${updatedAgent.agentName}" foi atualizado com sucesso.` });
        }
      } else {
        const savedAgent = await agentsContext.addAgent(fullAgentConfig);
        if (savedAgent) {
          setCurrentAgentConfig(savedAgent);
          toast({ title: "Agente Salvo", description: `Novo agente "${savedAgent.agentName}" criado com sucesso!` });
        }
      }
    } catch (error: any) {
      toast({ title: "Erro ao Salvar", description: error.message || "Não foi possível salvar o agente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[700px] border rounded-lg">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Construtor de Agente Assistido por IA</h2>
        <p className="text-sm text-muted-foreground">
          Descreva o agente que você quer criar ou modificar. O assistente fará perguntas para refinar.
        </p>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {conversation.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted dark:bg-slate-700'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ex: Crie um agente chamado 'Resumidor' do tipo LLM..."
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
            disabled={isLoading}
            className="h-10"
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !userInput.trim()} size="lg">
            {/* Show loader inside button if this specific message is being sent */}
            {isLoading && conversation.some(m => m.sender === 'user' && m.text === userInput && m.id === conversation[conversation.length-1].id)
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : <Send size={18} />}
          </Button>
        </div>
      </div>
      <div className="p-4 border-t bg-muted/20 dark:bg-slate-800/50">
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Configuração Atual do Agente (Preview):</h3>
        <ScrollArea className="h-[200px] bg-white dark:bg-slate-900 border rounded-md">
          <pre className="text-xs p-3 text-gray-700 dark:text-gray-300">
            {JSON.stringify(currentAgentConfig, null, 2)}
          </pre>
        </ScrollArea>
        <Button
          onClick={handleSaveAgentFromChat}
          disabled={isLoading || !currentAgentConfig.agentName?.trim() || !currentAgentConfig.config?.type}
          className="w-full mt-3"
          size="lg"
        >
          {/* Show loader if saving is in progress (isLoading is true AND it's not due to message sending) */}
          {isLoading && !(conversation.some(m => m.sender === 'user' && m.text === userInput && m.id === conversation[conversation.length-1].id))
            ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>)
            : (currentAgentConfig.id && initialAgentConfig && currentAgentConfig.id === initialAgentConfig.id ? "Salvar Alterações do Agente" : "Criar e Salvar Novo Agente")}
        </Button>
      </div>
    </div>
  );
}
