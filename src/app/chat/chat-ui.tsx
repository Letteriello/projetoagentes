"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LogIn,
  Menu,
  Save,
  Trash2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  useState,
  useRef,
  useEffect,
  ChangeEvent,
  useCallback,
  useOptimistic,
  useMemo,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebaseClient";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import type { AgentConfig, LLMAgentConfig, SavedAgentConfiguration as SavedAgentConfigType, AgentFramework, Gem, ADKTool } from "@/data/agentBuilderConfig";
import { initialGems, iconComponents, availableTools as builderAvailableTools } from "@/data/agentBuilderConfig";

export type ADKAgentConfig = {
  name: string;
  [key: string]: any; 
};

import ChatHeader from "@/components/features/chat/ChatHeader";
import WelcomeScreen from "@/components/features/chat/WelcomeScreen";
import MessageList from "@/components/features/chat/MessageList";
import MessageInputArea from "@/components/features/chat/MessageInputArea";
import { Message } from "@/types/chat";
import { Conversation, ChatMessageUI } from "@/types/chat";
import ConversationSidebar from "@/components/features/chat/ConversationSidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label"; 
import { AgentSelector } from "@/components/agent-selector";
import * as cs from "@/lib/firestoreConversationStorage";

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

export default function ChatPage() {
  return <ChatUI />;
}

export function ChatUI() {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.uid;

  const {
    savedAgents,
    setSavedAgents,
    addAgent,
    updateAgent,
    deleteAgent,
    isLoadingAgents
  } = useAgents();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileDataUri, setSelectedFileDataUri] = useState<string | null>(null);

  const [selectedGemId, setSelectedGemId] = useState<string | null>(
    initialGems[0]?.id ?? null
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedAgentConfig, setSelectedAgentConfig] = useState<SavedAgentConfigType | null>(null);
  const [selectedADKAgentId, setSelectedADKAgentId] = useState<string | null>(null);
  const [adkAgents, setAdkAgents] = useState<ADKAgentConfig[]>([]);
  const [isADKInitializing, setIsADKInitializing] = useState(false);

  const usingADKAgent = useMemo(() => !!selectedADKAgentId, [selectedADKAgentId]);

  const activeChatTarget = useMemo(() => {
    if (usingADKAgent && selectedADKAgentId && adkAgents.length > 0) {
      const adkAgent = adkAgents.find((agent: ADKAgentConfig) => agent.name === selectedADKAgentId);
      if (adkAgent) return { id: adkAgent.name, name: adkAgent.name, type: 'adk-agent' as const, config: adkAgent };
    }
    if (selectedAgentId && savedAgents.length > 0) {
      const currentSavedAgent = savedAgents.find((a: SavedAgentConfigType) => a.id === selectedAgentId);
      if (currentSavedAgent) return { id: currentSavedAgent.id, name: currentSavedAgent.name, type: 'agent' as const, config: currentSavedAgent };
    }
    if (selectedGemId && initialGems.length > 0) {
      const gem = initialGems.find((g: Gem) => g.id === selectedGemId);
      if (gem) return { id: gem.id, name: gem.name, type: 'gem' as const, config: gem };
    }
    return initialGems.length > 0 ? { id: initialGems[0].id, name: initialGems[0].name, type: 'gem' as const, config: initialGems[0] } : null;
  }, [selectedAgentId, savedAgents, selectedGemId, selectedADKAgentId, adkAgents, usingADKAgent, initialGems]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingAgentConfig, setPendingAgentConfig] = useState<AgentConfig | null>(null);

  type OptimisticUpdateAction =
    | { type: "add"; message: Message }
    | { type: "update"; id: string; text?: string; isStreaming?: boolean; imageUrl?: string; fileName?: string; fileDataUri?: string; }
    | { type: "remove"; id: string };

  const optimisticUpdateReducer = (
    state: Message[],
    action: OptimisticUpdateAction
  ): Message[] => {
    switch (action.type) {
      case "add":
        return state.find(m => m.id === action.message.id) ? state : [...state, action.message];
      case "update":
        const { type, ...updatePayload } = action;
        return state.map(msg =>
          msg.id === action.id ? { ...msg, ...updatePayload } : msg
        );
      case "remove":
        return state.filter(msg => msg.id !== action.id);
      default:
        const _exhaustiveCheck: never = action;
        return state;
    }
  };

  const [optimisticMessages, setOptimisticMessages] = useOptimistic<Message[], OptimisticUpdateAction>(
    messages,
    optimisticUpdateReducer
  );

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  useEffect(() => {
    setPendingAgentConfig(null);
  }, [selectedGemId, selectedAgentId, selectedADKAgentId]);

  useEffect(() => {
    const loadConversations = async () => {
      if (!currentUserId) {
        setIsLoadingConversations(false);
        setConversations([]);
        return;
      }
      setIsLoadingConversations(true);
      try {
        const fetchedConversations = await cs.getAllConversations(currentUserId);
        setConversations(fetchedConversations);
        if (fetchedConversations.length > 0 && !activeConversationId) {
           setActiveConversationId(fetchedConversations[0].id);
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
        toast({ title: "Error", description: "Failed to load conversations.", variant: "destructive" });
      } finally {
        setIsLoadingConversations(false);
      }
    };
    loadConversations();
  }, [currentUserId, activeConversationId]); // Ensure activeConversationId is a dependency if it can change elsewhere and require reload

  useEffect(() => {
    if (activeConversationId) {
      const loadMessages = async () => {
        setIsLoadingMessages(true);
        setMessages([]); 
        try {
          const conversationWithMessages = await cs.getConversationById(activeConversationId);
          if (conversationWithMessages && conversationWithMessages.messages) {
            const uiMessages: Message[] = conversationWithMessages.messages.map((dbMessage: Message) => ({
              id: dbMessage.id || uuidv4(),
              isUser: dbMessage.isUser,
              content: dbMessage.content || "",
              timestamp: dbMessage.timestamp ? (dbMessage.timestamp instanceof Date ? dbMessage.timestamp : (dbMessage.timestamp as any).toDate()) : new Date(),
              // isLoading and isError are UI concerns, not directly from DB message generally
            }));
            setMessages(uiMessages);
          } else {
            setMessages([]);
          }
        } catch (error) {
          console.error(`Error loading messages for conversation ${activeConversationId}:`, error);
          toast({ title: "Error", description: "Failed to load messages.", variant: "destructive" });
          setMessages([]);
        } finally {
          setIsLoadingMessages(false);
        }
      };
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Login Successful", variant: "default" });
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      toast({
        title: "Login Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logout Successful", variant: "default" });
      setMessages([]);
      setConversations([]);
      setActiveConversationId(null);
      setPendingAgentConfig(null);
    } catch (error) {
      console.error("Error during logout:", error);
      toast({ title: "Logout Failed", variant: "destructive" });
    }
  };

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setSelectedFileDataUri(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setSelectedFileName(null);
      setSelectedFileDataUri(null);
    }
  }, []);

  const removeSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setSelectedFileName(null);
    setSelectedFileDataUri(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentInput = inputValue.trim();

    if (!currentUserId) {
      toast({ title: "Authentication Error", description: "Please log in.", variant: "default" });
      return;
    }
    if (!currentInput && !selectedFile) {
      toast({ title: "Input required", description: "Please type a message or select a file.", variant: "default" });
      return;
    }
    if (pendingAgentConfig && isPending) {
      toast({ title: "Aguarde", description: "Por favor, salve ou descarte a configuração do agente pendente antes de enviar uma nova mensagem.", variant: "default"});
      return;
    }

    setIsPending(true);
    setPendingAgentConfig(null); 

    const userMessageId = uuidv4();
    const agentMessageId = uuidv4();

    const userMessageForOptimistic: Message = {
      id: userMessageId,
      isUser: true,
      content: currentInput,
      timestamp: new Date(), // Add timestamp for Message type
      // imageUrl and fileName are not part of Message type, handle separately if needed for UI
    };
    setOptimisticMessages({ type: "add", message: userMessageForOptimistic });

    let currentConvId = activeConversationId;
    if (!currentConvId) {
      const newConv = await cs.createNewConversation(currentUserId, activeChatTarget?.name || "New Chat");
      if (newConv) {
        currentConvId = newConv.id;
        setActiveConversationId(newConv.id);
        setConversations(prev => [newConv, ...prev]);
      } else {
        toast({ title: "Error", description: "Failed to create new conversation.", variant: "destructive" });
        setIsPending(false);
        return;
      }
    }
    
    if (currentConvId) {
      // Note: The object passed to addMessageToConversation should match what Firestore expects.
      // If Firestore auto-generates IDs for messages, userMessageId might not be needed here or could cause issues.
      // For now, assuming cs.addMessageToConversation handles the ID.
      // Also, Message does not have timestamp, so we don't pass it to Firestore if Message type doesn't have it.
      await cs.addMessageToConversation(currentConvId, {
        // id: userMessageId, // Let Firestore handle ID if that's the design
        isUser: true, // Store the actual user ID
        content: currentInput,
        // timestamp: serverTimestamp(), // Let Firestore handle timestamp
        // imageUrl: uploadedImageUrl, // Message type doesn't have imageUrl directly, handle this if needed
        // fileName: uploadedFileName, // Message type doesn't have fileName directly
      }).catch(err => {
        console.error("Failed to save user message:", err);
        toast({ title: "Error saving message", variant: "destructive" });
        // Optionally revert optimistic update for user message on failure
        setOptimisticMessages({ type: "remove", id: userMessageId });
      });
      setConversations(prevConvs => prevConvs.map(c => c.id === currentConvId ? { ...c, updatedAt: new Date(), lastMessagePreview: currentInput.substring(0,30) } : c));
    } else {
      // This case should ideally not be reached if new conversation creation is successful
      toast({ title: "No Active Conversation", variant: "destructive" });
      setIsPending(false);
      return;
    }

    setInputValue("");
    removeSelectedFile();
    inputRef.current?.focus();

    const isAgentCreatorSession = selectedGemId === "agent_creator_assistant";
    const apiEndpoint = isAgentCreatorSession ? "/api/agent-creator-stream" : "/api/chat-stream";

    const historyForBackend = messages.map(msg => ({
      role: msg.isUser ? "user" : "model",
      content: isAgentCreatorSession && msg.isUser ? [{ text: msg.content || "" }] : (msg.content || ""),
    })); 

    const requestBody: any = {
      userMessage: currentInput,
      history: historyForBackend,
      userId: currentUserId,
      stream: true,
      fileDataUri: selectedFile && selectedFileDataUri ? selectedFileDataUri : undefined,
      conversationId: currentConvId, // Pass conversation ID
    };

    if (!isAgentCreatorSession && activeChatTarget?.type === 'agent' && activeChatTarget.config) {
      const agentCfg = activeChatTarget.config as SavedAgentConfigType;
      requestBody.modelName = agentCfg.agentModel;
      requestBody.systemPrompt = agentCfg.agentDescription || agentCfg.globalInstruction;
      requestBody.temperature = agentCfg.agentTemperature;
      requestBody.agentToolsDetails = agentCfg.toolsDetails?.map(tool => ({ 
        id: tool.id, 
        name: tool.label, 
        description: tool.genkitToolName || tool.label, 
        enabled: true 
      }));
    } else if (!isAgentCreatorSession && activeChatTarget?.type === 'adk-agent' && activeChatTarget.config) {
      const adkCfg = activeChatTarget.config as ADKAgentConfig;
      requestBody.modelName = adkCfg.model?.name;
      requestBody.systemPrompt = adkCfg.description;
      requestBody.temperature = adkCfg.model?.temperature;
      requestBody.agentToolsDetails = adkCfg.tools?.map((t: ADKTool) => ({ 
        id: t.name, 
        name: t.name, 
        description: t.description || t.name, 
        enabled: true 
      }));
    }

    setOptimisticMessages({ type: "add", message: { id: agentMessageId, isUser: false, content: "", timestamp: new Date(), isLoading: true } });

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error occurred" }));
        throw new Error(response.statusText + ": " + (errorData.message || "Failed to fetch stream"));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedAgentResponse = "";
      let finalAgentConfig: AgentConfig | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        
        // Check for special JSON block for agent configuration
        if (chunk.includes('{"agentConfig":')) { // Basic check for the start of our special block
          try {
            const potentialJsonBlock = chunk.substring(chunk.indexOf('{"agentConfig":'));
            const parsedChunk = JSON.parse(potentialJsonBlock);
            if (parsedChunk.agentConfig) {
              finalAgentConfig = parsedChunk.agentConfig;
              // Don't add this control message to chat, but process it
              setPendingAgentConfig(finalAgentConfig);
              continue; // Skip adding this chunk to the message text
            }
          } catch (e) { 
            // Not a valid JSON block or not our agentConfig block, treat as regular text
          }
        }
        
        accumulatedAgentResponse += chunk;
        setOptimisticMessages({ type: "update", id: agentMessageId, text: accumulatedAgentResponse, isStreaming: true });
      }
      
      setOptimisticMessages({ type: "update", id: agentMessageId, text: accumulatedAgentResponse, isStreaming: false });
      
      if (currentConvId && !finalAgentConfig) { // Only save if not an agent-creator response with pending config
        await cs.addMessageToConversation(currentConvId, {
          isUser: false,
          content: accumulatedAgentResponse,
          // timestamp: serverTimestamp(), // Let Firestore handle timestamp
        });
        setConversations(prevConvs => prevConvs.map(c => c.id === currentConvId ? { ...c, updatedAt: new Date(), lastMessagePreview: accumulatedAgentResponse.substring(0,30) } : c));
      }

    } catch (error: any) {
      console.error("Error streaming chat response:", error);
      toast({ title: "Error", description: error.message || "Failed to get response from AI.", variant: "destructive" });
      setOptimisticMessages({ type: "update", id: agentMessageId, text: "Sorry, something went wrong.", isStreaming: false });
      if (currentConvId) {
         await cs.addMessageToConversation(currentConvId, {
          isUser: false,
          content: "Sorry, something went wrong.",
          // timestamp: serverTimestamp(), // Let Firestore handle timestamp
        });
      }
    } finally {
      setIsPending(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setMessages([]); // Clear messages briefly while new ones load
  };

  const handleNewConversation = async () => {
    if (!currentUserId) return;
    try {
      const newConv = await cs.createNewConversation(currentUserId, activeChatTarget?.name || "New Chat");
      if (newConv) {
        setConversations(prev => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setMessages([]);
        setPendingAgentConfig(null);
      }
    } catch (error) {
      console.error("Error creating new conversation:", error);
      toast({ title: "Error", description: "Failed to create new conversation.", variant: "destructive" });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!currentUserId) return;
    try {
      await cs.deleteConversationAndMessages(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
      }
      toast({ title: "Conversation Deleted" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({ title: "Error", description: "Failed to delete conversation.", variant: "destructive" });
    }
  };
  
  const fetchADKAgents = async () => {
    setIsADKInitializing(true);
    try {
      const response = await fetch('/api/adk-agents');
      if (!response.ok) throw new Error('Failed to fetch ADK agents');
      const data = await response.json();
      setAdkAgents(data.agents || []);
    } catch (error) {
      console.error('Error fetching ADK agents:', error);
      toast({ title: 'Error Fetching ADK Agents', variant: 'destructive' });
    } finally {
      setIsADKInitializing(false);
    }
  };

  useEffect(() => {
    fetchADKAgents();
  }, []);

  const handleSaveAgent = async (configToSave: AgentConfig | SavedAgentConfigType) => {
    if (!currentUserId) return;
    
    const agentDataToSave: Omit<SavedAgentConfigType, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { userId: string } = {
      ...configToSave,
      userId: currentUserId,
      framework: ('framework' in configToSave ? configToSave.framework : undefined) || ('agentFramework' in configToSave ? configToSave.agentFramework : undefined) || 'custom',
      templateId: configToSave.templateId || "custom_llm", // Default templateId
      toolsDetails: configToSave.toolsDetails || [], // Default toolsDetails
      // Ensure other required fields from SavedAgentConfigType are present or defaulted
      agentType: configToSave.agentType || "llm", // Example default for agentType
    };

    try {
      let savedAgent;
      if ('id' in configToSave && configToSave.id) { // It's an existing agent, update it
        savedAgent = await updateAgent(configToSave.id, agentDataToSave);
        toast({ title: "Agent Updated", description: `${savedAgent?.name || 'The agent'} has been updated.` });
      } else { // It's a new agent, add it
        savedAgent = await addAgent(agentDataToSave);
        toast({ title: "Agent Saved", description: `${savedAgent?.name || 'The agent'} has been saved.` });
      }
      // Optionally, select the newly saved/updated agent
      setSelectedAgentId(savedAgent.id);
      setSelectedGemId(null); // Deselect any gem
      setSelectedADKAgentId(null); // Deselect ADK agent
      setPendingAgentConfig(null); // Clear pending config
    } catch (error) {
      console.error("Error saving agent:", error);
      toast({ title: "Error Saving Agent", variant: "destructive" });
    }
  };

  const handleSavePendingAgent = () => {
    if (pendingAgentConfig) {
      handleSaveAgent(pendingAgentConfig);
    }
  };

  const handleDiscardPendingAgent = () => {
    setPendingAgentConfig(null);
    toast({ title: "Draft Discarded", description: "The proposed agent configuration has been discarded." });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    // Optionally auto-submit or focus input
    inputRef.current?.focus();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    if (typeof e === 'string') {
      setInputValue(e);
    } else {
      setInputValue(e.target.value);
    }
  };

  // Scroll to bottom when messages change, or pending state changes
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('div'); // Target the inner div for scrolling
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [optimisticMessages, isPending]);

  if (!currentUser && auth.currentUser === null) { // Check auth.currentUser for initial load
    // This block can be simplified if loading state from useAuth is used
  }

  return (
    <div className="flex h-screen w-full flex-col bg-muted/50">
      <ConversationSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId || undefined}
        onSelectConversation={async (id: string) => { setActiveConversationId(id); }}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isLoading={isLoadingConversations}
        currentUserId={currentUserId}
      />
      <div className={cn("flex flex-col flex-1 transition-all duration-300 ease-in-out", isSidebarOpen ? "md:ml-72" : "ml-0")}>
        <ChatHeader 
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          isSidebarOpen={isSidebarOpen}
          activeChatTargetName={activeChatTarget?.name || "Chat"}
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
          savedAgents={savedAgents}
          adkAgents={adkAgents}
          initialGems={initialGems}
          iconComponents={iconComponents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={(id) => { setSelectedAgentId(id); setSelectedGemId(null); setSelectedADKAgentId(null); setActiveConversationId(null); setMessages([]);}}
          selectedGemId={selectedGemId}
          onSelectGem={(id) => { setSelectedGemId(id); setSelectedAgentId(null); setSelectedADKAgentId(null); setActiveConversationId(null); setMessages([]);}}
          onSelectADKAgent={(id) => { setSelectedADKAgentId(id); setSelectedAgentId(null); setSelectedGemId(null); setActiveConversationId(null); setMessages([]);}}
          isLoadingAgents={isLoadingAgents || isADKInitializing}
          onSaveAgentConfig={handleSaveAgent} // Pass the handler for saving
          currentAgentConfig={selectedAgentConfig} // Pass the config for the agent being edited/viewed
        />

        <div className="flex-1 overflow-hidden relative">
          <ScrollArea ref={scrollAreaRef} className="h-full p-4 pt-0">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading messages...</p> {/* Or a spinner component */}
              </div>
            ) : !currentUser ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <LogIn size={48} className="mb-4 text-primary" />
                <h2 className="text-2xl font-semibold mb-2">Welcome to the Chat</h2>
                <p className="mb-4 text-lg">Please log in to use the chat.</p>
                <Button onClick={handleLogin} variant="default" size="lg">
                  <LogIn className="mr-2 h-5 w-5" /> Login with Google
                </Button>
              </div>
            ) : optimisticMessages.length === 0 && !isPending && !pendingAgentConfig ? (
              <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
            ) : (
              <MessageList messages={optimisticMessages} isPending={isPending} />
            )}
          </ScrollArea>

          {pendingAgentConfig && (
            <Card className="m-4 border-primary shadow-lg absolute bottom-0 left-0 right-0 mb-20 bg-background z-10">
              <CardHeader>
                <CardTitle>Review Proposed Agent Configuration</CardTitle>
                <CardDescription>
                  The Agent Creator Assistant has drafted the following configuration. You can save it or discard and continue chatting to refine it.
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-60 overflow-y-auto bg-muted/30 p-4 rounded-md">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(pendingAgentConfig, null, 2)}
                </pre>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleDiscardPendingAgent}>
                    <Trash2 className="mr-2 h-4 w-4"/> Discard & Continue
                </Button>
                <Button onClick={handleSavePendingAgent}>
                    <Save className="mr-2 h-4 w-4"/> Save This Agent
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <MessageInputArea
          formRef={useRef<HTMLFormElement>(null)} // This ref is local to MessageInputArea, not needed from ChatUI state
          inputRef={inputRef} // Pass the shared inputRef
          fileInputRef={fileInputRef} // Pass the shared fileInputRef
          onSubmit={handleFormSubmit}
          isPending={isPending || !!pendingAgentConfig}
          selectedFile={selectedFile}
          selectedFileName={selectedFileName ?? ""}
          selectedFileDataUri={selectedFileDataUri}
          onRemoveAttachment={removeSelectedFile}
          handleFileChange={handleFileChange}
          inputValue={inputValue}
          onInputChange={handleInputChange}
        />
      </div>
    </div>
  );
}
