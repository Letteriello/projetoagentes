
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; // Card might not be needed directly
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Label might not be needed directly
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator"; // Keep for dropdowns if needed
import { Send, User, Bot, SparklesIcon, Settings2, Cpu, RefreshCcw, MessageSquare, Paperclip, Search as SearchIcon, ChevronDown } from "lucide-react"; // Added Paperclip, SearchIcon
import { useState, useRef, useEffect, useActionState } from "react";
import { submitChatMessage } from "./actions";
import { toast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import type { SavedAgentConfiguration, LLMAgentConfig } from "@/app/agent-builder/page";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "agent" | "system";
  role: "user" | "model"; 
}

interface HistoryMessage {
  role: 'user' | 'model';
  content: string;
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
  const [messages, setMessages] = useState<ChatMessage[]>([]); 
  const [chatHistory, setChatHistory] = useState<HistoryMessage[]>([]);
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
      const newAgentMessageUI: ChatMessage = {
        id: Date.now().toString(),
        text: formState.agentResponse!,
        sender: "agent",
        role: "model",
      };
      const newAgentMessageHistory: HistoryMessage = {
        role: "model",
        content: formState.agentResponse!,
      };
      setMessages((prevMessages) => [...prevMessages, newAgentMessageUI]);
      setChatHistory((prevHistory) => [...prevHistory, newAgentMessageHistory]);
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
    const newUserMessageHistory: HistoryMessage = {
      role: "user",
      content: userInput,
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessageUI]);
    
    const currentTurnHistory = [...chatHistory, newUserMessageHistory];
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
    }
    formAction(formData);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setChatHistory([]);
    if (inputRef.current) inputRef.current.value = "";
    toast({ title: "Nova Conversa Iniciada", description: "O histórico do chat foi limpo." });
  };

  const handleFileUpload = () => {
    toast({ title: "Funcionalidade em Breve", description: "O envio de arquivos será implementado futuramente."});
  };

  const handleWebSearch = () => {
    toast({ title: "Funcionalidade em Breve", description: "A busca na web integrada será implementada futuramente."});
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background text-foreground">
      {/* Cabeçalho do Chat - Tech Style */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground truncate max-w-xs md:max-w-sm">
              {activeChatTarget || "Chat"}
            </h1>
        </div>
        <div className="flex items-center gap-2">
          <Select 
            value={selectedAgentId} 
            onValueChange={(value) => { setSelectedAgentId(value); const agent = savedAgents.find(a => a.id === value); if(agent) { setActiveChatTarget(`${agent.agentName}`); } else if (value === 'none') { const gem = initialGems.find(g => g.id === selectedGemId); setActiveChatTarget(gem ? `${gem.name} (Gem)`:''); } }}
          >
            <SelectTrigger 
              id="agent-selector" 
              className="w-auto md:w-[180px] h-9 text-xs bg-card hover:bg-muted/70 border-border/70 focus:ring-primary/50 text-foreground"
              aria-label="Selecionar Agente"
            >
              <Cpu size={14} className="mr-1.5 text-primary/80 hidden sm:inline-block" />
              <SelectValue placeholder="Agente" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              <SelectItem value="none" className="text-xs hover:bg-accent/50">Assistente Geral (Gem)</SelectItem>
              {savedAgents.length > 0 && <Separator className="my-1 bg-border/50" />}
              {savedAgents.length > 0 && <Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Meus Agentes</Label>}
              {savedAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id} className="text-xs hover:bg-accent/50">
                  {agent.agentName} <span className="text-muted-foreground/70 ml-1">({agent.agentType})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select 
            value={selectedGemId} 
            onValueChange={(value) => { setSelectedGemId(value); if(selectedAgentId === 'none') { const gem = initialGems.find(g => g.id === value); setActiveChatTarget(gem ? `${gem.name} (Gem)`:'');} }} 
            disabled={selectedAgentId !== 'none'}
          >
            <SelectTrigger 
              id="gem-selector" 
              className={cn(
                "w-auto md:w-[160px] h-9 text-xs bg-card hover:bg-muted/70 border-border/70 focus:ring-primary/50 text-foreground",
                selectedAgentId !== 'none' && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Selecionar Personalidade (Gem)"
            >
              <SparklesIcon size={14} className="mr-1.5 text-primary/80 hidden sm:inline-block"/>
              <SelectValue placeholder="Personalidade" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              {initialGems.map((gem) => (
                <SelectItem key={gem.id} value={gem.id} className="text-xs hover:bg-accent/50">
                  {gem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleNewConversation} className="h-9 w-9 text-primary/90 hover:text-primary hover:bg-muted/70 border-border/70" aria-label="Nova Conversa">
              <RefreshCcw size={16}/>
          </Button>
        </div>
      </div>
        
      {/* Área de Mensagens */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4 md:p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 w-full ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "agent" && (
                  <div className="flex-shrink-0 p-1.5 rounded-full bg-card border border-border/50">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "p-3 rounded-lg max-w-[75%] md:max-w-[70%] shadow-sm text-sm",
                    msg.sender === "user"
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-card text-foreground rounded-bl-none border border-border/50"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                {msg.sender === "user" && (
                  <div className="flex-shrink-0 p-1.5 rounded-full bg-muted border border-border/50">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isPending && (
              <div className="flex items-end gap-2.5 justify-start">
                <div className="flex-shrink-0 p-1.5 rounded-full bg-card border border-border/50">
                  <Bot className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <div className="p-3 rounded-lg bg-card max-w-[70%] shadow-sm rounded-bl-none border border-border/50">
                  <p className="text-sm text-muted-foreground">Digitando...</p>
                </div>
              </div>
            )}
            {/* Empty state can be added here if messages.length === 0 && !isPending */}
            {messages.length === 0 && !isPending && (
                 <div className="flex flex-col items-center justify-center h-[calc(100%-4rem)] text-center text-muted-foreground">
                    <MessageSquare size={48} className="mb-4 opacity-30"/>
                    <p className="text-lg font-medium">AgentVerse Chat</p>
                    <p className="text-sm">Selecione um agente ou use o Assistente Geral para começar.</p>
                 </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Área de Input - Tech Style */}
      <div className="p-3 md:p-4 border-t border-border/50 bg-background/95">
        <form 
            ref={formRef} 
            action={handleFormSubmit} 
            className="flex items-center gap-2 p-2 bg-card border border-border/70 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/70 transition-shadow"
        >
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-primary h-8 w-8"
            onClick={handleFileUpload}
            aria-label="Anexar arquivo"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-primary h-8 w-8"
            onClick={handleWebSearch}
            aria-label="Buscar na Web"
          >
            <SearchIcon className="h-5 w-5" />
          </Button>
          <Input
            ref={inputRef}
            name="userInput"
            placeholder="Digite sua mensagem ou use '/' para comandos..."
            className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-10 placeholder:text-muted-foreground/70"
            autoComplete="off"
            required
            disabled={isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="ghost" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg disabled:opacity-60 h-8 w-8" 
            disabled={isPending} 
            aria-label="Enviar mensagem"
          >
            {isPending ? <SparklesIcon className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
