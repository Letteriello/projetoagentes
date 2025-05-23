
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, User, Bot, SparklesIcon, TerminalSquare } from "lucide-react";
import { useState, useRef, useEffect, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
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
  { id: "general", name: "Assistente Geral", prompt: "Você é um assistente prestativo." },
  { id: "creative", name: "Escritor Criativo", prompt: "Você é um escritor criativo, ajude a gerar ideias e textos." },
  { id: "code", name: "Programador Expert", prompt: "Você é um programador expert, ajude com código e depuração." },
];

const initialAgents = [
  { id: "agent_placeholder_1", name: "Agente de Suporte (Mock)" },
  { id: "agent_placeholder_2", name: "Agente de Vendas (Mock)" },
];

const initialState = {
  message: "",
  agentResponse: null,
  errors: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="icon" disabled={pending} aria-disabled={pending}>
      {pending ? <SparklesIcon className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
      <span className="sr-only">Enviar</span>
    </Button>
  );
}

export function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedGem, setSelectedGem] = useState<string>(initialGems[0].id);
  const [selectedAgent, setSelectedAgent] = useState<string>(initialAgents[0].id);
  const [formState, formAction] = useFormState(submitChatMessage, initialState);
  const [isPending, startTransition] = useTransition();
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
       // Reset message in formState to prevent re-adding on subsequent successful submissions without new input
      formState.agentResponse = null; 
      formState.message = "";
    }
    if (formState.message && formState.errors && !isPending) {
       toast({
        title: "Erro no Chat",
        description: formState.message,
        variant: "destructive",
      });
       // Reset message in formState to prevent re-showing toast
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
    
    startTransition(() => {
        formAction(formData);
    });
  };


  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="gem-selector">Personalidade (Gem)</Label>
          <Select value={selectedGem} onValueChange={setSelectedGem}>
            <SelectTrigger id="gem-selector">
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
        <div>
          <Label htmlFor="agent-selector">Agente (ADK)</Label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger id="agent-selector">
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

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.sender === "user" ? "justify-end" : ""
                  }`}
                >
                  {msg.sender === "agent" && (
                    <Bot className="h-8 w-8 text-primary flex-shrink-0" />
                  )}
                  <div
                    className={`p-3 rounded-lg max-w-[70%] ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    {(msg.gem || msg.agent) && msg.sender === "user" && (
                       <p className="text-xs opacity-70 mt-1">
                        {initialGems.find(g => g.id === msg.gem)?.name} via {initialAgents.find(a => a.id === msg.agent)?.name}
                       </p>
                    )}
                  </div>
                  {msg.sender === "user" && (
                    <User className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              ))}
               {isPending && (
                <div className="flex items-start gap-3">
                  <Bot className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="p-3 rounded-lg bg-muted max-w-[70%]">
                    <p className="text-sm">Pensando...</p>
                  </div>
                </div>
              )}
              {formState.errors?.userInput && (
                 <div className="flex justify-end">
                    <p className="text-sm text-destructive mt-1">{formState.errors.userInput.join(", ")}</p>
                 </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <form ref={formRef} action={handleFormSubmit} className="flex items-center gap-2">
        <Input
          name="userInput"
          placeholder="Digite sua mensagem aqui..."
          className="flex-1"
          autoComplete="off"
          required
        />
        <SubmitButton />
      </form>
    </div>
  );
}
