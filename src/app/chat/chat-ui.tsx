
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, User, Bot, SparklesIcon, Settings2, HardDrive } from "lucide-react"; // Updated icons
import { useState, useRef, useEffect, useTransition, useActionState } from "react"; // Changed import
import { submitChatMessage } from "./actions";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  sender: "user" | "agent" | "system";
  gem?: string;
  agent?: string;
}

const initialGems = [
  { id: "general", name: "Assistente Geral", prompt: "Você é um assistente prestativo e conciso." },
  { id: "creative", name: "Escritor Criativo", prompt: "Você é um escritor criativo, ajude a gerar ideias e textos com um tom inspirador." },
  { id: "code", name: "Programador Expert", prompt: "Você é um programador expert, forneça explicações claras e exemplos de código eficientes." },
  { id: "researcher", name: "Pesquisador Analítico", prompt: "Você é um pesquisador analítico, foque em dados e informações factuais." },
];

const initialAgents = [
  { id: "agent_placeholder_1", name: "Agente de Suporte ao Cliente (ADK)" },
  { id: "agent_placeholder_2", name: "Agente de Vendas (ADK)" },
  { id: "agent_custom_flow", name: "Fluxo Personalizado (Genkit)" },
];

const initialState = {
  message: "",
  agentResponse: null,
  errors: null,
};

function SubmitButton() {
  const { pending } = useActionState(async () => {}, undefined); // useActionState expects an async function
  return (
    <Button type="submit" size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 text-primary" disabled={pending} aria-disabled={pending}>
      {pending ? <SparklesIcon className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
      <span className="sr-only">Enviar</span>
    </Button>
  );
}

export function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedGem, setSelectedGem] = useState<string>(initialGems[0].id);
  const [selectedAgent, setSelectedAgent] = useState<string>(initialAgents[0].id);
  const [formState, formAction, isPending] = useActionState(submitChatMessage, initialState); // Updated hook and order
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (formState.agentResponse && !isPending) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: Date.now().toString(), text: formState.agentResponse!, sender: "agent" },
      ]);
      formRef.current?.reset();
      inputRef.current?.focus();
       // Reset message in formState to prevent re-adding on subsequent successful submissions without new input
      // @ts-ignore // formState is mutable here for this reset purpose
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
       // Reset message in formState to prevent re-showing toast
       // @ts-ignore
       formState.message = ""; 
    }
  }, [formState, isPending]);


  const handleFormSubmit = (formData: FormData) => {
    const userInput = formData.get("userInput") as string;
    if (!userInput?.trim()) return;

    setMessages((prevMessages) => [
      ...prevMessages,
      { id: (Date.now() -1).toString(), text: userInput, sender: "user", gem: selectedGem, agent: selectedAgent },
    ]);

    const gemDetails = initialGems.find(g => g.id === selectedGem);
    formData.set("gemPrompt", gemDetails?.prompt || "Você é um assistente prestativo.");
    formData.set("selectedAgent", selectedAgent);
    
    formAction(formData);
  };


  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6 gap-4 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="gem-selector" className="text-xs font-medium text-muted-foreground px-1">Personalidade (Gem)</Label>
          <Select value={selectedGem} onValueChange={setSelectedGem}>
            <SelectTrigger id="gem-selector" className="bg-card border-border focus:ring-primary/50">
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
        <div className="space-y-1">
          <Label htmlFor="agent-selector" className="text-xs font-medium text-muted-foreground px-1">Agente</Label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger id="agent-selector" className="bg-card border-border focus:ring-primary/50">
              <SelectValue placeholder="Selecione um agente" />
            </SelectTrigger>
            <SelectContent>
              {initialAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                    {msg.sender === "user" && (
                       <p className="text-xs opacity-60 mt-1.5 pt-1.5 border-t border-primary-foreground/20">
                        Enviado para: {initialGems.find(g => g.id === msg.gem)?.name} &bull; {initialAgents.find(a => a.id === msg.agent)?.name}
                       </p>
                    )}
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
                    <p className="text-sm text-muted-foreground">Digitando...</p>
                  </div>
                </div>
              )}
              {formState.errors?.userInput && !isPending && ( // Only show if not pending and errors exist
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
        />
        <SubmitButton />
      </form>
    </div>
  );
}

    