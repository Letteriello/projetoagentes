
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Send, User, Bot, SparklesIcon, Settings2, HardDrive, Cpu, RefreshCcw, MessageSquare } from "lucide-react";
import { useState, useRef, useEffect, useActionState } from "react";
import { submitChatMessage } from "./actions";
import { toast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import type { SavedAgentConfiguration, LLMAgentConfig } from "@/app/agent-builder/page";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "agent" | "system";
  role: "user" | "model"; 
}

const initialGems = [
  { id: "general", name: "Assistente Geral", prompt: "Você é um assistente prestativo e conciso." },
  { id: "creative", name: "Escritor Criativo", prompt: "Você é um escritor criativo, ajude a gerar ideias e textos com um tom inspirador." },
  { id: "code", name: "Programador Expert", prompt: "Você é um programador expert, forneça explicações claras e exemplos de código eficientes." },
  { id: "researcher", name: "Pesquisador Analítico", prompt: "Você é um pesquisador analítico, foque em dados e informações factuais." },
];

const initialState = {
  message: "",
  agentResponse: null,
  errors: null,
};

export function ChatUI() {
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'model', content: string }>>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]); 
  const [selectedGemId, setSelectedGemId] = useState<string>(initialGems[0].id);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("none");
  const [activeChatTarget, setActiveChatTarget] = useState<string>(initialGems[0].name);

  const { savedAgents } = useAgents();
  const [formState, formAction, isPending] = useActionState(submitChatMessage, initialState);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedAgentId !== 'none') {
      const agent = savedAgents.find(a => a.id === selectedAgentId);
      setActiveChatTarget(agent ? `${agent.agentName}` : "Agente não encontrado");
    } else {
      const gem = initialGems.find(g => g.id === selectedGemId);
      setActiveChatTarget(gem ? `${gem.name} (Gem)` : "Gem não encontrado");
    }
  }, [selectedAgentId, selectedGemId, savedAgents]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (formState.agentResponse && !isPending) {
      const newAgentMessage: ChatMessage = {
        id: Date.now().toString(),
        text: formState.agentResponse!,
        sender: "agent",
        role: "model",
      };
      setMessages((prevMessages) => [...prevMessages, newAgentMessage]);
      setChatHistory((prevHistory) => [...prevHistory, { role: "model", content: formState.agentResponse! }]);
      formRef.current?.reset();
      inputRef.current?.focus();
      // @ts-ignore
      formState.agentResponse = null;
      // @ts-ignore
      formState.message = "";
    }
    if (formState.message && formState.errors && !isPending) {
      toast({
        title: "Erro no Chat",
        description: formState.message,
        variant: "destructive",
      });
      // @ts-ignore
      formState.message = "";
    }
  }, [formState, isPending]);

  const handleFormSubmit = (formData: FormData) => {
    const userInput = formData.get("userInput") as string;
    if (!userInput?.trim()) return;

    const newUserMessageUI: ChatMessage = {
      id: (Date.now() - 1).toString(),
      text: userInput,
      sender: "user",
      role: "user",
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessageUI]);
    
    const currentTurnHistory = [...chatHistory, { role: "user" as const, content: userInput }];
    setChatHistory(currentTurnHistory);

    formData.set("chatHistoryJson", JSON.stringify(currentTurnHistory));

    const currentAgent = savedAgents.find(a => a.id === selectedAgentId);

    if (currentAgent && selectedAgentId !== 'none' && currentAgent.agentType === 'llm') {
      const llmAgentConfig = currentAgent as LLMAgentConfig;
      formData.set("agentSystemPrompt", llmAgentConfig.systemPromptGenerated || "Você é um assistente prestativo.");
      if (llmAgentConfig.agentModel) formData.set("agentModel", llmAgentConfig.agentModel!);
      if (llmAgentConfig.agentTemperature !== undefined) formData.set("agentTemperature", llmAgentConfig.agentTemperature!.toString());
    } else {
      const currentGem = initialGems.find(g => g.id === selectedGemId) || initialGems[0];
      formData.set("agentSystemPrompt", currentGem.prompt);
      // Se nenhum agente específico ou um agente não-LLM for selecionado, podemos limpar/ignorar agentModel e agentTemperature
      // ou usar padrões do Genkit, o que o chat-flow.ts já faz.
    }
    formAction(formData);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setChatHistory([]);
    if (inputRef.current) inputRef.current.value = "";
    toast({ title: "Nova Conversa Iniciada", description: "O histórico do chat foi limpo." });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Cabeçalho do Chat */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">
              {activeChatTarget || "Chat com Agentes"}
            </h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <Select 
            value={selectedGemId} 
            onValueChange={(value) => { setSelectedGemId(value); if(selectedAgentId === 'none') { const gem = initialGems.find(g => g.id === value); setActiveChatTarget(gem ? `${gem.name} (Gem)`:'');} }} 
            disabled={selectedAgentId !== 'none'}
          >
            <SelectTrigger id="gem-selector" className="w-auto md:w-[180px] h-9 text-xs bg-card border-border focus:ring-primary/50 disabled:opacity-70">
              <SelectValue placeholder="Personalidade" />
            </SelectTrigger>
            <SelectContent>
              {initialGems.map((gem) => (
                <SelectItem key={gem.id} value={gem.id} className="text-xs">
                  {gem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={selectedAgentId} 
            onValueChange={(value) => { setSelectedAgentId(value); const agent = savedAgents.find(a => a.id === value); if(agent) { setActiveChatTarget(`${agent.agentName}`); } else if (value === 'none') { const gem = initialGems.find(g => g.id === selectedGemId); setActiveChatTarget(gem ? `${gem.name} (Gem)`:''); } }}
          >
            <SelectTrigger id="agent-selector" className="w-auto md:w-[200px] h-9 text-xs bg-card border-border focus:ring-primary/50">
              <SelectValue placeholder="Agente Específico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">Assistente Geral (Usar Gem)</SelectItem>
              {savedAgents.length > 0 && <Separator className="my-1" />}
              {savedAgents.length > 0 && <Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Meus Agentes</Label>}
              {savedAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id} className="text-xs">
                  {agent.agentName} <span className="text-muted-foreground/80 ml-1">({agent.agentType})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleNewConversation} className="h-9 text-xs">
              <RefreshCcw size={14} className="mr-1.5 hidden sm:inline-block"/> Nova
          </Button>
        </div>
      </div>
        
      <Card className="flex-1 flex flex-col overflow-hidden shadow-none border-none rounded-none bg-transparent">
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4 md:p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 w-full ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "agent" && (
                    <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                      <Bot className="h-5 w-5" />
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-xl max-w-[75%] md:max-w-[70%] shadow-sm ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted text-foreground rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {msg.sender === "user" && (
                    <div className="p-2 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}
              {isPending && (
                <div className="flex items-start gap-3 justify-start">
                  <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                    <Bot className="h-5 w-5 animate-pulse" />
                  </div>
                  <div className="p-3 rounded-xl bg-muted max-w-[70%] shadow-sm rounded-bl-none">
                    <p className="text-sm text-muted-foreground">Pensando...</p>
                  </div>
                </div>
              )}
              {formState.errors?.userInput && !isPending && (
                <div className="flex justify-end">
                  <p className="text-sm text-destructive mt-1">{formState.errors.userInput.join(", ")}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="p-2 md:p-3 border-t border-border bg-background">
        <form ref={formRef} action={handleFormSubmit} className="flex items-center gap-3 p-1 bg-card border border-border rounded-xl shadow-sm">
          <Input
            ref={inputRef}
            name="userInput"
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-10"
            autoComplete="off"
            required
            disabled={isPending}
          />
          <Button type="submit" size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 text-primary disabled:opacity-50 h-9 w-9" disabled={isPending} aria-disabled={isPending}>
            {isPending ? <SparklesIcon className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

    