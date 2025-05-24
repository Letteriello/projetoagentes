
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, User, Bot, SparklesIcon, Cpu, RefreshCcw, MessageSquare, Paperclip, Search as SearchIcon, X, UploadCloud, FileUp, Code2 } from "lucide-react";
import { useState, useRef, useEffect, useActionState, ChangeEvent } from "react";
import { submitChatMessage } from "./actions";
import { toast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import type { SavedAgentConfiguration, LLMAgentConfig } from "@/app/agent-builder/page";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator"; // Importado
import { Label } from "@/components/ui/label"; // Importado

interface ChatMessageUI {
  id: string;
  text: string;
  sender: "user" | "agent" | "system";
  imageUrl?: string;
  fileName?: string;
}

interface ChatHistoryMessage {
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
  const [messages, setMessages] = useState<ChatMessageUI[]>([]); // Para renderização da UI
  const [chatHistory, setChatHistory] = useState<ChatHistoryMessage[]>([]); // Para enviar ao backend
  const [selectedGemId, setSelectedGemId] = useState<string>(initialGems[0].id);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("none");
  const [activeChatTarget, setActiveChatTarget] = useState<string>(initialGems[0].name);

  const [selectedFileDataUri, setSelectedFileDataUri] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  
  const [isPopoverOpen, setIsPopoverOpen] = useState(false); 

  const { savedAgents } = useAgents();
  const [formState, formAction, isPending] = useActionState(submitChatMessage, initialState);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let targetName = "Chat";
    if (selectedAgentId !== 'none') {
      const agent = savedAgents.find(a => a.id === selectedAgentId);
      targetName = agent ? `${agent.agentName}` : "Agente não encontrado";
    } else {
      const gem = initialGems.find(g => g.id === selectedGemId);
      targetName = gem ? `${gem.name} (Gem)` : "Gem não encontrado";
    }
    setActiveChatTarget(targetName);
  }, [selectedAgentId, selectedGemId, savedAgents]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (formState.agentResponse && !isPending) {
      const newAgentMessageUI: ChatMessageUI = {
        id: Date.now().toString(),
        text: formState.agentResponse!,
        sender: "agent",
      };
      const newAgentMessageHistory: ChatHistoryMessage = {
        role: "model",
        content: formState.agentResponse!,
      };
      setMessages((prevMessages) => [...prevMessages, newAgentMessageUI]);
      setChatHistory((prevHistory) => [...prevHistory, newAgentMessageHistory]);
      formRef.current?.reset(); 
      if (inputRef.current) inputRef.current.value = ""; 
      setSelectedFileDataUri(null);
      setSelectedFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Tipo de arquivo inválido", description: "Por favor, selecione um arquivo de imagem.", variant: "destructive" });
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFileDataUri(reader.result as string);
        setSelectedFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFileDataUri(null);
    setSelectedFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFormSubmit = (formData: FormData) => {
    const userInput = formData.get("userInput") as string;
    if (!userInput?.trim() && !selectedFileDataUri) {
        toast({ title: "Mensagem vazia", description: "Digite uma mensagem ou anexe um arquivo.", variant: "destructive" });
        return;
    }

    const userMessageContent = userInput || ""; 
    const historyContentForUser = userMessageContent + (selectedFileName ? `\n[Arquivo anexado: ${selectedFileName}]` : "");

    const newUserMessageUI: ChatMessageUI = {
      id: (Date.now() - 1).toString(),
      text: userMessageContent,
      sender: "user",
      imageUrl: selectedFileDataUri || undefined,
      fileName: selectedFileName || undefined,
    };
    const newUserMessageHistory: ChatHistoryMessage = {
      role: "user",
      content: historyContentForUser,
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessageUI]);
    
    const currentHistory = [...chatHistory, newUserMessageHistory];
    formData.set("chatHistoryJson", JSON.stringify(currentHistory)); // Envia histórico para o backend
    setChatHistory(currentHistory); // Atualiza histórico local para o próximo turno

    if (selectedFileDataUri) {
      formData.set("fileDataUri", selectedFileDataUri);
    }

    const currentAgent = savedAgents.find(a => a.id === selectedAgentId);

    if (currentAgent && selectedAgentId !== 'none') {
      const llmAgentConfig = currentAgent as LLMAgentConfig; 
      formData.set("agentSystemPrompt", llmAgentConfig.systemPromptGenerated || "Você é um assistente prestativo.");
      if (llmAgentConfig.agentModel) formData.set("agentModel", llmAgentConfig.agentModel!);
      if (llmAgentConfig.agentTemperature !== undefined) formData.set("agentTemperature", llmAgentConfig.agentTemperature!.toString());
      // Passar detalhes das ferramentas do agente
      if (currentAgent.toolsDetails) {
        formData.set("agentToolsDetailsJson", JSON.stringify(currentAgent.toolsDetails));
      }
    } else {
      const currentGem = initialGems.find(g => g.id === selectedGemId) || initialGems[0];
      formData.set("agentSystemPrompt", currentGem.prompt);
      // Para o assistente geral, não passamos agentToolsDetailsJson, então o fluxo usará um conjunto padrão ou nenhum.
    }
    formAction(formData);
  };

  const handleNewConversation = () => {
    setMessages([]);
    setChatHistory([]); // Limpa o histórico para o backend também
    setSelectedFileDataUri(null);
    setSelectedFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (inputRef.current) inputRef.current.value = "";
    toast({ title: "Nova Conversa Iniciada", description: "O histórico do chat e anexos foram limpos." });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background text-foreground">
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 min-w-0">
            <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
            <h1 className="text-lg font-semibold text-foreground truncate" title={activeChatTarget || "Chat"}>
              {activeChatTarget || "Chat"}
            </h1>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <Select
            value={selectedAgentId}
            onValueChange={(value) => { setSelectedAgentId(value); handleNewConversation(); }}
          >
            <SelectTrigger
              id="agent-selector"
              className="w-auto md:w-[150px] lg:w-[180px] h-8 text-xs bg-card hover:bg-muted/70 border-border/70 focus:ring-primary/50 text-foreground"
              aria-label="Selecionar Agente"
            >
              <Cpu size={14} className="mr-1.5 text-primary/80 hidden sm:inline-block" />
              <SelectValue placeholder="Agente Específico" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              <SelectItem value="none" className="text-xs hover:bg-accent/50">Assistente Geral (Usar Gem)</SelectItem>
              {savedAgents.length > 0 && <Separator className="my-1" />} 
              {savedAgents.length > 0 && <Label className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Meus Agentes</Label>}
              {savedAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id} className="text-xs hover:bg-accent/50">
                  <span className="truncate" title={agent.agentName}>{agent.agentName}</span>
                  <span className="text-muted-foreground/70 ml-1 hidden md:inline">({agent.agentType})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedGemId}
            onValueChange={(value) => { setSelectedGemId(value); handleNewConversation(); }}
            disabled={selectedAgentId !== 'none'}
          >
            <SelectTrigger
              id="gem-selector"
              className={cn(
                "w-auto md:w-[140px] lg:w-[160px] h-8 text-xs bg-card hover:bg-muted/70 border-border/70 focus:ring-primary/50 text-foreground",
                selectedAgentId !== 'none' && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Selecionar Personalidade (Gem)"
            >
              <SparklesIcon size={14} className="mr-1.5 text-primary/80 hidden sm:inline-block"/>
              <SelectValue placeholder="Personalidade Base" />
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground">
              {initialGems.map((gem) => (
                <SelectItem key={gem.id} value={gem.id} className="text-xs hover:bg-accent/50">
                  {gem.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleNewConversation} className="h-8 w-8 text-primary/90 hover:text-primary hover:bg-muted/70 border-border/70" aria-label="Nova Conversa">
              <RefreshCcw size={16}/>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full p-4 md:p-6" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && !isPending && (
                 <div className="flex flex-col items-center justify-center h-[calc(100%-4rem)] text-center text-muted-foreground">
                    <MessageSquare size={48} className="mb-4 opacity-30"/>
                    <p className="text-lg font-medium">AgentVerse Chat</p>
                    <p className="text-sm">
                      {activeChatTarget ? `Comece a conversar com ${activeChatTarget}.` : "Selecione um agente ou use o Assistente Geral para começar."}
                    </p>
                 </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2.5 w-full ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "agent" && (
                  <div className="flex-shrink-0 p-1.5 rounded-full bg-card border border-border/50 self-start">
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
                  {msg.imageUrl && (
                    <div className="mt-2">
                      <Image
                        src={msg.imageUrl}
                        alt={msg.fileName || "Imagem anexada"}
                        width={200}
                        height={200}
                        className="rounded-md object-contain max-h-[200px] border border-border/30"
                      />
                      {msg.fileName && <p className="text-xs text-muted-foreground/80 mt-1">{msg.fileName}</p>}
                    </div>
                  )}
                </div>
                {msg.sender === "user" && (
                  <div className="flex-shrink-0 p-1.5 rounded-full bg-muted border border-border/50 self-start">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isPending && (
              <div className="flex items-end gap-2.5 justify-start">
                <div className="flex-shrink-0 p-1.5 rounded-full bg-card border border-border/50 self-start">
                  <Bot className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <div className="p-3 rounded-lg bg-card max-w-[70%] shadow-sm rounded-bl-none border border-border/50">
                  <p className="text-sm text-muted-foreground">Digitando...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="p-3 md:p-4 border-t border-border/50 bg-background/95">
        {selectedFileDataUri && (
          <div className="mb-2 p-2 border border-border/50 rounded-lg flex items-center justify-between bg-card">
            <div className="flex items-center gap-2">
              <Image src={selectedFileDataUri} alt={selectedFileName || "Preview"} width={40} height={40} className="rounded object-contain"/>
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{selectedFileName || "Imagem selecionada"}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={removeSelectedFile} className="h-7 w-7 text-muted-foreground hover:text-destructive">
              <X size={16}/>
            </Button>
          </div>
        )}
        <form
            ref={formRef}
            action={handleFormSubmit}
            className="flex items-center gap-2 p-1.5 bg-card border border-border/70 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/70 transition-shadow"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*" 
            className="hidden"
          />
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-primary h-8 w-8"
                aria-label="Anexar arquivo"
                disabled={isPending}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 space-y-1 bg-popover text-popover-foreground rounded-lg shadow-xl" side="top" align="start">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm h-9 px-3 py-2"
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsPopoverOpen(false);
                }}
              >
                <FileUp className="mr-2 h-4 w-4" />
                Enviar arquivos
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm h-9 px-3 py-2"
                onClick={() => {
                  toast({ title: "Em breve!", description: "Integração com Google Drive será implementada." });
                  setIsPopoverOpen(false);
                }}
              >
                <UploadCloud className="mr-2 h-4 w-4" /> 
                Adicionar do Drive
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-sm h-9 px-3 py-2"
                onClick={() => {
                  toast({ title: "Em breve!", description: "Funcionalidade de importar código." });
                  setIsPopoverOpen(false);
                }}
              >
                <Code2 className="mr-2 h-4 w-4" />
                Importar código
              </Button>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary h-8 w-8"
            onClick={() => toast({ title: "Funcionalidade em Breve", description: "A busca na web integrada será implementada futuramente."})}
            aria-label="Buscar na Web"
            disabled={isPending}
          >
            <SearchIcon className="h-5 w-5" />
          </Button>
          <Input
            ref={inputRef}
            name="userInput"
            placeholder="Digite sua mensagem ou use '/' para comandos..."
            className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-9 placeholder:text-muted-foreground/70"
            autoComplete="off"
            disabled={isPending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && (inputRef.current?.value?.trim() || selectedFileDataUri)) {
                e.preventDefault(); 
                if (formRef.current) {
                   handleFormSubmit(new FormData(formRef.current));
                }
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg disabled:opacity-60 h-8 w-8"
            disabled={isPending || (!inputRef.current?.value?.trim() && !selectedFileDataUri)}
            aria-label="Enviar mensagem"
          >
            {isPending ? <SparklesIcon className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

    