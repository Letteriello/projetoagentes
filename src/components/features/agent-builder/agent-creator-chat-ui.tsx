// src/components/features/agent-builder/agent-creator-chat-ui.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SavedAgentConfiguration, AgentConfig } from "@/types/agent-configs"; // Importar tipo unificado
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

export function AgentCreatorChatUI({ initialAgentConfig }: AgentCreatorChatUIProps) {
  const [conversation, setConversation] = React.useState<CreatorChatMessage[]>([]);
  const [userInput, setUserInput] = React.useState<string>("");
  const [currentAgentConfig, setCurrentAgentConfig] = React.useState<Partial<SavedAgentConfiguration>>(
    initialAgentConfig || { agentName: "", config: { type: 'llm', framework: 'genkit' } as any }
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
       setCurrentAgentConfig({ agentName: "", config: { type: 'llm', framework: 'genkit' } as any });
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
      const result = await getAiConfigurationSuggestionsAction({
        userNaturalLanguageInput: userMessageText,
        currentAgentConfig: currentAgentConfig,
        chatHistory: currentConversationHistory
      });

      if (result.error) {
        toast({ title: "Erro do Assistente", description: result.error, variant: "destructive" });
        const errorResponse: CreatorChatMessage = {
          id: (Date.now() + 1).toString(),
          text: `Erro: ${result.error}`,
          sender: "assistant",
        };
        setConversation(prev => [...prev, errorResponse]);
      } else if (result.assistantResponse && result.updatedAgentConfigJson) {
        const assistantResponse: CreatorChatMessage = {
          id: (Date.now() + 1).toString(),
          text: result.assistantResponse,
          sender: "assistant",
        };
        setConversation(prev => [...prev, assistantResponse]);
        try {
          const updatedConfig = JSON.parse(result.updatedAgentConfigJson);
          setCurrentAgentConfig(updatedConfig);
        } catch (parseError) {
          console.error("Error parsing updatedAgentConfigJson:", parseError);
          toast({ title: "Erro de Configuração", description: "O assistente retornou uma configuração inválida.", variant: "destructive" });
        }
      }
    } catch (e: any) {
      console.error("Failed to send message to creator flow:", e);
      toast({ title: "Erro de Comunicação", description: e.message || "Não foi possível comunicar com o assistente.", variant: "destructive" });
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
    if (!currentAgentConfig.agentName?.trim()) {
      toast({ title: "Nome Necessário", description: "Por favor, defina um nome para o agente antes de salvar.", variant: "destructive" });
      return;
    }
    if (!currentAgentConfig.config?.type) {
      toast({ title: "Tipo Necessário", description: "Por favor, defina um tipo para o agente (LLM, Workflow, etc.).", variant: "destructive" });
      return;
    }

    setIsLoading(true); // Use a different loading state or disable send button too
    try {
      const completeConfigToSave: SavedAgentConfiguration = {
        id: currentAgentConfig.id || uuidv4(),
        agentName: currentAgentConfig.agentName,
        agentDescription: currentAgentConfig.agentDescription || "",
        agentVersion: currentAgentConfig.agentVersion || "1.0.0",
        icon: currentAgentConfig.icon || (currentAgentConfig.config?.type ? `${currentAgentConfig.config.type}-agent-icon.svg` : 'Cpu'),
        templateId: currentAgentConfig.templateId || 'chat_created',
        isFavorite: currentAgentConfig.isFavorite || false,
        tags: currentAgentConfig.tags || [],
        createdAt: currentAgentConfig.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: currentAgentConfig.userId || "defaultUser",
        config: currentAgentConfig.config as AgentConfig,
        tools: currentAgentConfig.tools || [],
        toolConfigsApplied: currentAgentConfig.toolConfigsApplied || {},
        toolsDetails: currentAgentConfig.toolsDetails || [],
      };

      if (currentAgentConfig.id && initialAgentConfig && currentAgentConfig.id === initialAgentConfig.id) {
        const updatedAgent = await agentsContext.updateAgent(currentAgentConfig.id, completeConfigToSave);
        if (updatedAgent) {
          setCurrentAgentConfig(updatedAgent);
          toast({ title: "Agente Atualizado", description: `O agente "${updatedAgent.agentName}" foi atualizado com sucesso.` });
        }
      } else {
        const savedAgent = await agentsContext.addAgent(completeConfigToSave);
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
