"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, User, Bot, SparklesIcon, Cpu, RefreshCcw, MessageSquare, Paperclip, Search as SearchIcon, X, UploadCloud, FileUp, Code2, Image as ImageIcon, Mic, Menu, Plus, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useRef, useEffect, useActionState, ChangeEvent, useCallback } from "react";
import { submitChatMessage } from "./actions";
import { toast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import type { SavedAgentConfiguration, LLMAgentConfig } from "@/app/agent-builder/page";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator"; 
import { Label } from "@/components/ui/label"; 
import { AgentSelector } from "@/components/agent-selector";
import { googleADK, sendMessageToAgent } from "@/lib/google-adk";
import ChatHeader from "@/components/chat/ChatHeader"; // Import the new ChatHeader component
import WelcomeScreen from "@/components/chat/WelcomeScreen"; // Import WelcomeScreen
import MessageList from "@/components/chat/MessageList"; // Import MessageList
import MessageInputArea from "@/components/chat/MessageInputArea"; // Import MessageInputArea
import { ChatMessageUI, Conversation } from '@/types/chat'; // Import shared type & Conversation
import ConversationSidebar from "@/components/chat/ConversationSidebar"; // Import ConversationSidebar

// DEBUG: Inspect the imported googleADK object
console.log("Inspecting imported googleADK (top level):", googleADK);

interface ChatHistoryMessage {
  role: 'user' | 'model';
  content: any; // Pode ser string ou array de partes (texto/mídia)
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

// Componente de botão de recurso estilo Gemini aprimorado
const FeatureButton = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 p-2 feature-button-hover rounded-lg transition-all duration-200 cursor-pointer group"
  >
    <div className="p-2.5 feature-button-bg rounded-full shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-200">
      {icon}
    </div>
    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-200">{label}</span>
  </button>
);

export function ChatUI() {
  const [messages, setMessages] = useState<ChatMessageUI[]>([]); // Para renderização da UI
  const [chatHistory, setChatHistory] = useState<ChatHistoryMessage[]>([]); // Para enviar ao backend
  const [selectedGemId, setSelectedGemId] = useState<string>(initialGems[0].id);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("none");
  const [selectedADKAgentId, setSelectedADKAgentId] = useState<string>("");
  const [activeChatTarget, setActiveChatTarget] = useState<string>(initialGems[0].name);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [usingADKAgent, setUsingADKAgent] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Keep for logic
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null); // Keep for logic
  const [selectedFileDataUri, setSelectedFileDataUri] = useState<string | null>(null); // Keep for logic
  
  const [adkAgents, setAdkAgents] = useState<any[]>([]); 
  const [isADKInitializing, setIsADKInitializing] = useState(true);

  // States for ConversationSidebar
  const [conversations, setConversations] = useState<Conversation[]>([]); // TODO: Load actual conversations
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const { savedAgents } = useAgents(); // Only get savedAgents from context
  const [formState, formAction, isPending] = useActionState(submitChatMessage, initialState);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null); // Changed to HTMLTextAreaElement
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    let targetName = "Chat";
    if (usingADKAgent && selectedADKAgentId) {
      // Busca o nome do agente ADK
      if (typeof window !== 'undefined') {
        try {
          const savedADKAgents = JSON.parse(localStorage.getItem('ADK_AGENTS') || '{}');
          const adkAgent = savedADKAgents[selectedADKAgentId];
          targetName = adkAgent ? `${adkAgent.displayName} (ADK)` : "Agente ADK";
        } catch (error) {
          console.error('Erro ao buscar agente ADK:', error);
          targetName = "Agente ADK";
        }
      }
    } else if (selectedAgentId !== 'none') {
      const agent = savedAgents.find(a => a.id === selectedAgentId);
      targetName = agent ? `${agent.agentName}` : "Agente não encontrado";
    } else {
      const gem = initialGems.find(g => g.id === selectedGemId);
      targetName = gem ? `${gem.name} (Gem)` : "Gem não encontrado";
    }
    setActiveChatTarget(targetName);
  }, [selectedAgentId, selectedGemId, savedAgents, selectedADKAgentId, usingADKAgent]);

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
        content: [{ text: formState.agentResponse! }],
      };
      setMessages((prevMessages) => [...prevMessages, newAgentMessageUI]);
      setChatHistory((prevHistory) => [...prevHistory, newAgentMessageHistory]);
      
      formRef.current?.reset(); 
      if (inputRef.current) inputRef.current.value = ""; 
      setSelectedFile(null);
      setSelectedFileName(null);
      setSelectedFileDataUri(null);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState, isPending]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedFileDataUri(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setSelectedFileName(null);
    setSelectedFileDataUri(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleFormSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Prevent default if not already handled by useActionState
    const formData = new FormData(event.currentTarget);
    formAction(formData); // Call the server action
  }, [formAction]);

  const handleSuggestionClick = useCallback((suggestionText: string) => {
    setInputValue(suggestionText); // Update controlled input state
    if (inputRef.current) {
      inputRef.current.focus(); // Focus the textarea
    }
  }, []);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  }, []);

  // Fetch ADK agents on component mount
  useEffect(() => {
    const fetchADKAgents = async () => {
      // DEBUG: Inspect googleADK inside useEffect
      console.log("Inspecting googleADK (inside useEffect):", googleADK);
      setIsADKInitializing(true); // Uses local state setter
      try {
        const agents = await googleADK.listAgents(); // Changed getAgents to listAgents
        setAdkAgents(agents || []); // Uses local state setter
      } catch (error) {
        console.error("Failed to fetch ADK agents:", error);
        toast({ title: "Erro", description: "Falha ao carregar agentes ADK.", variant: "destructive" });
        setAdkAgents([]); // Ensure it's an empty array on error
      } finally {
        setIsADKInitializing(false);
      }
    };
    fetchADKAgents();
  }, []); // Dependency array should be empty to run only on mount

  // Scroll to bottom when new messages are added or pending state changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setChatHistory([]);
    setInputValue("");
    setSelectedFile(null);
    setSelectedFileName(null);
    setSelectedFileDataUri(null);
    setActiveConversationId(null); // Reset active conversation
    // TODO: Potentially create a new conversation entry in `conversations` state or backend
    toast({ title: "Nova Conversa", description: "Histórico de chat limpo e nova conversa iniciada." });
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    // TODO: Load messages for this conversation id
    setActiveConversationId(id);
    const selectedConv = conversations.find(c => c.id === id);
    setMessages(selectedConv?.messages || []); // Example: load messages if stored in Conversation type
    toast({ title: "Conversa Carregada", description: `Conversa ${selectedConv?.title} selecionada.` });
  }, [conversations]);

  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    // TODO: Implement backend update and update local state
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    toast({ title: "Conversa Renomeada", description: `Conversa renomeada para ${newTitle}.` });
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    // TODO: Implement backend update and update local state
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(null);
      setMessages([]);
    }
    toast({ title: "Conversa Apagada", variant: "destructive" });
  }, [activeConversationId]);

  // Mock conversations for testing - replace with actual data loading
  useEffect(() => {
    setConversations([
      { id: '1', title: 'Primeira Conversa Legal', messages: [], createdAt: new Date(), updatedAt: new Date() },
      { id: '2', title: 'Ideias para o Projeto X', messages: [], createdAt: new Date(), updatedAt: new Date() },
      { id: '3', title: 'Rascunho do Email', messages: [], createdAt: new Date(), updatedAt: new Date() },
    ]);
  }, []);

  return (
    <div className="flex h-full overflow-hidden bg-background text-foreground">
      <ConversationSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(false)} // Sidebar closes itself
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation} // Can also be triggered from sidebar
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatHeader 
          activeChatTarget={activeChatTarget}
          usingADKAgent={usingADKAgent}
          setUsingADKAgent={setUsingADKAgent}
          selectedADKAgentId={selectedADKAgentId}
          setSelectedADKAgentId={setSelectedADKAgentId}
          adkAgents={adkAgents} 
          isADKInitializing={isADKInitializing} 
          selectedAgentId={selectedAgentId}
          setSelectedAgentId={setSelectedAgentId}
          savedAgents={savedAgents}
          selectedGemId={selectedGemId}
          setSelectedGemId={setSelectedGemId}
          initialGems={initialGems} 
          handleNewConversation={handleNewConversation} // For the button in header
          isSidebarOpen={isSidebarOpen} // To potentially change menu icon
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} // To toggle sidebar from header
        />
        <div className="flex-1 overflow-hidden">
          {/* Messages Area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 space-y-4" id="message-scroll-area">
            {messages.length === 0 && !isPending ? (
              <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
            ) : (
              <MessageList messages={messages} isPending={isPending} />
            )}
          </ScrollArea>
        </div>

        {/* Message Input Area */}
        <MessageInputArea
          formRef={formRef}
          inputRef={inputRef}
          fileInputRef={fileInputRef}
          onSubmit={handleFormSubmit} // Pass the new handler
          isPending={isPending}
          selectedFile={selectedFile} // Pass the actual file object
          selectedFileName={selectedFileName ?? ""} // Pass name, ensure string
          selectedFileDataUri={selectedFileDataUri} // Pass URI
          onRemoveAttachment={removeSelectedFile}
          handleFileChange={handleFileChange}
          inputValue={inputValue} 
          onInputChange={handleInputChange} 
        />
      </div>
    </div>
  );
}
