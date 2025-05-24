
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Send, User, Bot, SparklesIcon, Settings2, HardDrive, Cpu, RefreshCcw } from "lucide-react"; // Added RefreshCcw
import { useState, useRef, useEffect, useActionState } from "react";
import { submitChatMessage } from "./actions";
import { toast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import type { SavedAgentConfiguration, LLMAgentConfig } from "@/app/agent-builder/page";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "agent" | "system";
  role: "user" | "model"; // For Genkit history
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
  const [messages, setMessages] = useState<ChatMessage[]>([]); // UI messages, includes sender for styling
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
      setActiveChatTarget(agent ? `Agente: ${agent.agentName}` : "Agente não encontrado");
    } else {
      const gem = initialGems.find(g => g.id === selectedGemId);
      setActiveChatTarget(gem ? `Gem: ${gem.name}` : "Gem não encontrado");
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

    const newUserMessage: ChatMessage = {
      id: (Date.now() - 1).toString(),
      text: userInput,
      sender: "user",
      role: "user",
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    const currentChatHistory = [...chatHistory, { role: "user" as const, content: userInput }];
    setChatHistory(currentChatHistory);

    formData.set("chatHistoryJson", JSON.stringify(currentChatHistory));

    const currentAgent = savedAgents.find(a => a.id === selectedAgentId);

    if (currentAgent && selectedAgentId !== 'none') {
      formData.set("agentSystemPrompt", (currentAgent as LLMAgentConfig).systemPromptGenerated || "Você é um assistente prestativo.");
      if ((currentAgent as LLMAgentConfig).agentModel) formData.set("agentModel", (currentAgent as LLMAgentConfig).agentModel!);
      if ((currentAgent as LLMAgentConfig).agentTemperature !== undefined) formData.set("agentTemperature", (currentAgent as LLMAgentConfig).agentTemperature!.toString());
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 gap-4 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="space-y-1 md:col-span-1">
          <Label htmlFor="gem-selector" className="text-xs font-medium text-muted-foreground px-1">
            <SparklesIcon size={14} className="inline-block mr-1.5 text-primary/70" />
            Personalidade Base (Gem)
          </Label>
          <Select 
            value={selectedGemId} 
            onValueChange={(value) => { setSelectedGemId(value); if(selectedAgentId === 'none') { const gem = initialGems.find(g => g.id === value); setActiveChatTarget(gem ? `Gem: ${gem.name}`:'');} }} 
            disabled={selectedAgentId !== 'none'}
          >
            <SelectTrigger id="gem-selector" className="bg-card border-border focus:ring-primary/50 disabled:opacity-70">
              <SelectValue placeholder="Selecione uma personalidade" />
            </SelectTrigger>
            <SelectContent>
              {initialGems.map((gem) => (
                <SelectItem key={gem.id} value={gem.id}>
                  {gem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 md:col-span-1">
          <Label htmlFor="agent-selector" className="text-xs font-medium text-muted-foreground px-1">
            <Cpu size={14} className="inline-block mr-1.5 text-primary/70" />
            Agente Específico
          </Label>
          <Select 
            value={selectedAgentId} 
            onValueChange={(value) => { setSelectedAgentId(value); const agent = savedAgents.find(a => a.id === value); if(agent) { setActiveChatTarget(`Agente: ${agent.agentName}`); } else if (value === 'none') { const gem = initialGems.find(g => g.id === selectedGemId); setActiveChatTarget(gem ? `Gem: ${gem.name}`:''); } }}
          >
            <SelectTrigger id="agent-selector" className="bg-card border-border focus:ring-primary/50">
              <SelectValue placeholder="Selecione um agente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Assistente Geral (Usar Gem)</SelectItem>
              <Separator />
              {savedAgents.length > 0 && <Label className="px-2 py-1.5 text-xs font-semibold">Meus Agentes Criados</Label>}
              {savedAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.agentName} ({agent.agentType})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-1 flex justify-end items-center md:mt-5">
            <Button variant="outline" size="sm" onClick={handleNewConversation}>
                <RefreshCcw size={14} className="mr-2"/> Nova Conversa
            </Button>
        </div>
      </div>
        
      {activeChatTarget && (
        <div className="text-center text-sm text-muted-foreground py-2 border-b border-border">
          Conversando com: <span className="font-semibold text-foreground">{activeChatTarget}</span>
        </div>
      )}

      <Card className="flex-1 flex flex-col overflow-hidden shadow-sm border-border bg-card">
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

      <form ref={formRef} action={handleFormSubmit} className="flex items-center gap-3 p-2 bg-card border border-border rounded-xl shadow-sm">
        <Input
          ref={inputRef}
          name="userInput"
          placeholder="Digite sua mensagem..."
          className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          autoComplete="off"
          required
          disabled={isPending}
        />
        <Button type="submit" size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 text-primary disabled:opacity-50" disabled={isPending} aria-disabled={isPending}>
          {isPending ? <SparklesIcon className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
          <span className="sr-only">Enviar</span>
        </Button>
      </form>
    </div>
  );
}

    