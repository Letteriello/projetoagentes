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
// Updated import path for SavedAgentConfigType
import type { AgentConfig, LLMAgentConfig, SavedAgentConfiguration as SavedAgentConfigType } from "@/data/agentBuilderConfig";

// UI Components & Types
import ChatHeader from "@/components/features/chat/ChatHeader";
import WelcomeScreen from "@/components/features/chat/WelcomeScreen";
import MessageList from "@/components/features/chat/MessageList";
import MessageInputArea from "@/components/features/chat/MessageInputArea";
import { ChatMessageUI, Conversation } from "@/types/chat";
import ConversationSidebar from "@/components/features/chat/ConversationSidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label"; 
import { AgentSelector } from "@/components/agent-selector";

// Firestore Conversation Storage
import * as cs from "@/lib/firestoreConversationStorage";

// Client-safe API and types
import { sendMessageToAI, streamChatFromAI } from '@/lib/client-api'; // Not used in the final merged version but kept for now
import { ChatInput, ChatOutput, ChatFormState as ImportedChatFormState } from '@/types/chat-types';
import { ADKAgentConfig, ADKTool } from '@/types/adk-types';

// Import initialGems from its new location
import { initialGems } from '@/data/chatConfig';

// Type definitions that were part of Stashed Changes (kept during merge)
interface ChatHistoryMessage {
  role: 'user' | 'model';
  content: any; 
}

interface ServerMessage { 
  id?: string;
  role: 'user' | 'model' | 'assistant' | 'tool';
  content: string | any; 
  text?: string; 
  createdAt?: Date | string;
  timestamp?: Date | string;
  type?: 'text' | 'image' | 'file' | string; 
  attachments?: any[];
  status?: 'sending' | 'delivered' | 'failed' | 'seen';
}

// `initialGems` is now imported from "@/data/chatConfig"

// Usando o ChatFormState importado dos tipos compartilhados
type ChatFormState = ImportedChatFormState;

const initialChatFormState: ChatFormState = {
  message: "", 
  agentResponse: null,
  errors: null,
};

const initialActionState: { message: string | null; serverResponse?: ChatMessageUI; error?: string } = {
  message: null,
  serverResponse: undefined,
  error: undefined,
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

type OptimisticMessageAction = 
  | { type: 'addUserMessage'; message: ChatMessageUI }
  | { type: 'addAgentMessage'; message: ChatMessageUI } 
  | { type: 'updateAgentMessageChunk'; id: string; chunk: string } 
  | { type: 'finalizeAgentMessage'; id: string; finalMessage?: string; error?: boolean }
  | { type: 'reconcileUserMessage'; id: string; serverId?: string; error?: boolean };

export function ChatUI() {
  const { currentUser, loading: authLoading } = useAuth();
  const currentUserId = currentUser?.uid;

  const { savedAgents, setSavedAgents, availableTools: builderAvailableTools } = useAgents();
  const [pendingAgentConfig, setPendingAgentConfig] = useState<Partial<SavedAgentConfigType> | null>(null);


  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Login Successful",
        description: "You are now logged in.",
      });
    } catch (error) {
      console.error("Error during Google login:", error);
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
      toast({
        title: "Logout Successful",
        description: "You have been logged out.",
      });
      setPendingAgentConfig(null);
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Logout Failed",
        description: "Could not sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useOptimistic<
    ChatMessageUI[],
    ChatMessageUI
  >(messages, (currentMessages, optimisticUpdateMessage) => {
    const existingMessageIndex = currentMessages.findIndex(
      (msg) => msg.id === optimisticUpdateMessage.id,
    );

    if (existingMessageIndex !== -1) {
      const updatedMessage = {
        ...currentMessages[existingMessageIndex],
        ...optimisticUpdateMessage,
        text:
          optimisticUpdateMessage.text !== undefined
            ? optimisticUpdateMessage.text
            : currentMessages[existingMessageIndex].text,
      };
      return currentMessages.map((msg, index) =>
        index === existingMessageIndex ? updatedMessage : msg,
      );
    } else {
      return [...currentMessages, optimisticUpdateMessage];
    }
  });

  const [selectedGemId, setSelectedGemId] = useState<string | null>(
    initialGems[0].id,
  );
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>("none");
  const [selectedADKAgentId, setSelectedADKAgentId] = useState<string | null>(null);

  const activeChatTarget = useMemo(() => {
    if (selectedGemId && selectedGemId !== "none") {
      return initialGems.find(g => g.id === selectedGemId)?.name || "Chat";
    }
    if (selectedAgentId && selectedAgentId !== "none" && savedAgents) { // Ensure savedAgents is not null
      return savedAgents.find(a => a.id === selectedAgentId)?.agentName || "Chat"; // Use agentName
    }
    if (usingADKAgent && selectedADKAgentId && adkAgents) { // Ensure adkAgents is not null
        const adkAgent = adkAgents.find(a => a.name === selectedADKAgentId);
        if (adkAgent) return adkAgent.name;
    }
    return initialGems[0].name;
  }, [selectedGemId, selectedAgentId, savedAgents, usingADKAgent, selectedADKAgentId, adkAgents]);


  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [usingADKAgent, setUsingADKAgent] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null); 
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null); 
  const [selectedFileDataUri, setSelectedFileDataUri] = useState<string | null>(null); 
  
  const [adkAgents, setAdkAgents] = useState<ADKAgentConfig[]>([]);
  const [isADKInitializing, setIsADKInitializing] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isPending, setIsPending] = useState<boolean>(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setPendingAgentConfig(null);
  }, [selectedGemId, selectedAgentId]);

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
      } catch (error) {
        console.error("Error loading conversations:", error);
        toast({ title: "Error", description: "Failed to load conversations.", variant: "destructive" });
      } finally {
        setIsLoadingConversations(false);
      }
    };
    loadConversations();
  }, [currentUserId]);

  useEffect(() => {
    if (activeConversationId) {
      const loadMessages = async () => {
        setIsLoadingMessages(true);
        setMessages([]);
        try {
          const conversationWithMessages = await cs.getConversationById(activeConversationId);
          if (conversationWithMessages && conversationWithMessages.messages) {
            const uiMessages: ChatMessageUI[] = conversationWithMessages.messages.map((msg) => ({
              id: msg.id || uuidv4(),
              text: msg.content || msg.text || "",
              sender: msg.isUser ? "user" : "agent",
              isStreaming: msg.isLoading,
              imageUrl: msg.imageUrl,
              fileName: msg.fileName,
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


  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setSelectedFileDataUri(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        // For non-image files, could also read as data URI if backend expects that for files
        // Or handle ArrayBuffer for direct upload elsewhere
        const reader = new FileReader();
        reader.onloadend = () => setSelectedFileDataUri(reader.result as string);
        reader.readAsDataURL(file); // Example: pass as data URI
      }
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
      toast({ title: "Authentication Error", description: "Please log in.", variant: "destructive" });
      return;
    }
    if (!currentInput && !selectedFile) {
      toast({ title: "Input required", description: "Please type a message or select a file.", variant: "destructive" });
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

    const userMessage: ChatMessageUI = {
      id: userMessageId,
      sender: "user",
      text: currentInput,
      imageUrl: selectedFile && selectedFile.type.startsWith("image/") ? selectedFileDataUri : undefined,
      fileName: selectedFile ? selectedFile.name : undefined,
      // fileDataUri: selectedFile && !selectedFile.type.startsWith("image/") ? selectedFileDataUri : undefined, // If passing non-image file data
      isStreaming: false,
      timestamp: new Date(),
    };
    setOptimisticMessages(userMessage);

    if (activeConversationId) {
        await cs.addMessageToConversation(activeConversationId, {
            id: userMessageId, // ensure we use the same ID
            sender: currentUserId,
            text: currentInput,
            isUser: true,
            isLoading: false,
            isError: false,
            imageUrl: userMessage.imageUrl,
            fileName: userMessage.fileName,
            content: currentInput,
            timestamp: userMessage.timestamp,
        }).catch(err => {
            console.error("Failed to save user message:", err);
            toast({ title: "Error saving message", variant: "destructive" });
        });
        setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, updatedAt: new Date() } : c));
    } else {
      toast({ title: "No Active Conversation", variant: "warning" });
      setIsPending(false);
      return;
    }

    setInputValue("");
    removeSelectedFile();
    inputRef.current?.focus();

    const isAgentCreatorSession = selectedGemId === "agent_creator_assistant";
    let apiEndpoint = isAgentCreatorSession ? "/api/agent-creator-stream" : "/api/chat-stream";

    const historyForBackend = messages.map(msg => ({ // use 'messages' for more stable history
      role: msg.sender === "user" ? "user" : "model",
      content: isAgentCreatorSession ? [{ text: msg.text || "" }] : (msg.text || ""),
    }));

    let requestBody: ChatInput | any = {
      userMessage: currentInput,
      history: historyForBackend,
      userId: currentUserId,
      stream: true,
      fileDataUri: selectedFile && selectedFileDataUri ? selectedFileDataUri : undefined, // Pass file data URI for all types
    };

    if (!isAgentCreatorSession) {
      const currentSavedAgent = savedAgents.find(a => a.id === selectedAgentId);
      const activeADKAgent = usingADKAgent ? adkAgents.find(a => a.name === selectedADKAgentId) : null;

      requestBody = {
        ...requestBody,
        modelName: activeADKAgent
          ? activeADKAgent.model?.name
          : currentSavedAgent?.agentModel,
        systemPrompt: activeADKAgent
          ? activeADKAgent.description
          : currentSavedAgent?.agentDescription || (currentSavedAgent as SavedAgentConfigType)?.globalInstruction,
        temperature: activeADKAgent
          ? activeADKAgent.model?.temperature
          : currentSavedAgent?.agentTemperature,
        agentToolsDetails: activeADKAgent
          ? activeADKAgent.tools?.map((t: ADKTool) => ({ id: t.name, name: t.name, description: t.description || t.name, enabled: true }))
          : currentSavedAgent?.toolsDetails?.map(tool => ({ id: tool.id, name: tool.label, description: tool.genkitToolName || tool.label, enabled: true }))
      };
    }

    const pendingAgentMessage: ChatMessageUI = {
      id: agentMessageId, sender: "agent", text: "", isStreaming: true, timestamp: new Date(),
    };
    setOptimisticMessages(pendingAgentMessage);

    let agentMessageStorageId: string | null = null;
    if (activeConversationId) {
        const placeholder = await cs.addMessageToConversation(activeConversationId, {
            id: agentMessageId, // ensure we use the same ID
            sender: "agent", text: "", content: "", isUser: false, isLoading: true, isError: false,
            timestamp: pendingAgentMessage.timestamp,
        });
        if (placeholder && placeholder.id) agentMessageStorageId = placeholder.id;
        setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, updatedAt: new Date() } : c));
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulatedContent = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
          const line = buffer.substring(0, newlineIndex).trim();
          buffer = buffer.substring(newlineIndex + 1);

          if (line) {
            if (isAgentCreatorSession) {
              try {
                const jsonChunk = JSON.parse(line);
                if (jsonChunk.agentResponseChunk) {
                  accumulatedContent += jsonChunk.agentResponseChunk;
                }
                if (jsonChunk.suggestedConfig) {
                  setPendingAgentConfig(jsonChunk.suggestedConfig as SavedAgentConfigType);
                }
                if (jsonChunk.error) {
                  accumulatedContent += `\n\n[STREAM ERROR]: ${jsonChunk.error}`;
                  console.error("Agent Creator Stream Error Chunk:", jsonChunk.error);
                }
                 if (jsonChunk.rawJsonForDebug) {
                  console.log("Raw JSON for debug (parsing failed by flow):", jsonChunk.rawJsonForDebug);
                }
              } catch (e) {
                console.warn("ChatUI: Failed to parse JSON chunk from agent creator stream:", line, e);
                // If parsing fails, but we have content, append it as text
                if (line.includes("agentResponseChunk") || line.includes("suggestedConfig")) { // Basic check
                    // Avoid adding malformed JSON directly if it's not simple text
                } else {
                    accumulatedContent += line + "\n";
                }
              }
            } else {
              accumulatedContent += line + "\n";
            }
          }
        }
        setOptimisticMessages({ id: agentMessageId, sender: "agent", text: accumulatedContent, isStreaming: true });
      }

      if (buffer.trim()) {
         if (isAgentCreatorSession) {
            try {
                const jsonChunk = JSON.parse(buffer.trim());
                 if (jsonChunk.agentResponseChunk) accumulatedContent += jsonChunk.agentResponseChunk;
                 if (jsonChunk.suggestedConfig) setPendingAgentConfig(jsonChunk.suggestedConfig as SavedAgentConfigType);
                 if (jsonChunk.error) accumulatedContent += `\n\n[STREAM ERROR]: ${jsonChunk.error}`;
            } catch (e) {
                console.warn("ChatUI: Failed to parse final JSON chunk:", buffer.trim(), e);
                if (!isAgentCreatorSession || (!buffer.includes("agentResponseChunk") && !buffer.includes("suggestedConfig"))) {
                   accumulatedContent += buffer.trim();
                }
            }
         } else {
            accumulatedContent += buffer.trim();
         }
      }
      setOptimisticMessages({ id: agentMessageId, sender: "agent", text: accumulatedContent, isStreaming: false });

      if (activeConversationId && agentMessageStorageId) {
        await cs.finalizeMessageInConversation(activeConversationId, agentMessageStorageId, accumulatedContent, false);
      }
      // Final update to the main messages state
        setMessages(prevMsgs =>
            prevMsgs.map(msg =>
                msg.id === userMessageId ? userMessage : // ensure user message is the optimistic one
                (msg.id === agentMessageId ? { ...pendingAgentMessage, text: accumulatedContent, isStreaming: false } : msg)
            ).filter(msg => !(msg.id === agentMessageId && prevMsgs.find(pm => pm.id === agentMessageId && pm.sender === "agent"))) // Avoid duplicates if already added
            .concat(prevMsgs.find(pm => pm.id === agentMessageId) ? [] : [{ ...pendingAgentMessage, text: accumulatedContent, isStreaming: false }]) // Add if not present
        );


    } catch (error: any) {
      console.error("Error during agent response streaming:", error);
      const errorText = `Error: ${error.message}`;
      setOptimisticMessages({ id: agentMessageId, sender: "agent", text: errorText, isStreaming: false, isError: true });
      if (activeConversationId && agentMessageStorageId) {
        await cs.finalizeMessageInConversation(activeConversationId, agentMessageStorageId, errorText, true);
      }
       setMessages(prevMsgs =>
            prevMsgs.map(msg =>
                msg.id === agentMessageId ? { ...pendingAgentMessage, text: errorText, isStreaming: false, isError: true } : msg
            ).filter(msg => !(msg.id === agentMessageId && msg.isError && prevMsgs.find(pm => pm.id === agentMessageId && pm.isError)))
            .concat(prevMsgs.find(pm => pm.id === agentMessageId) ? [] : [{ ...pendingAgentMessage, text: errorText, isStreaming: false, isError: true }])
        );
    } finally {
      setIsPending(false);
    }
  };

  const handleSavePendingAgent = () => {
    if (!pendingAgentConfig || !setSavedAgents) return;

    const toolsDetails = (pendingAgentConfig.agentTools || []).map(toolId => {
        const foundTool = builderAvailableTools.find(t => t.id === toolId);
        return {
            id: toolId,
            label: foundTool?.label || toolId, // Use label from builderAvailableTools
            name: foundTool?.name || toolId, // Ensure name is populated
            description: foundTool?.description || `Details for ${toolId}`,
            hasConfig: foundTool?.hasConfig || false,
            iconName: foundTool?.icon ? (Object.keys(iconComponents).find(key => iconComponents[key] === foundTool.icon) || "Default") : "Default", // Map icon component to name
            genkitToolName: foundTool?.genkitToolName,
        };
    });

    const finalConfig: SavedAgentConfigType = {
      id: pendingAgentConfig.id || uuidv4(),
      agentName: pendingAgentConfig.agentName || "Untitled Agent",
      agentDescription: pendingAgentConfig.agentDescription || "",
      agentVersion: pendingAgentConfig.agentVersion || "1.0.0",
      agentIcon: pendingAgentConfig.agentIcon || "Sparkles",
      agentTools: pendingAgentConfig.agentTools || [],
      agentType: pendingAgentConfig.agentType || 'llm',
      agentFramework: pendingAgentConfig.agentFramework || 'genkit',
      globalInstruction: pendingAgentConfig.globalInstruction || pendingAgentConfig.agentGoal || "",
      agentGoal: pendingAgentConfig.agentGoal || "",
      agentTasks: pendingAgentConfig.agentTasks || "",
      agentPersonality: pendingAgentConfig.agentPersonality || "",
      agentRestrictions: pendingAgentConfig.agentRestrictions || "",
      agentModel: pendingAgentConfig.agentModel || "googleai/gemini-1.5-flash-latest",
      agentTemperature: pendingAgentConfig.agentTemperature !== undefined ? pendingAgentConfig.agentTemperature : 0.7,
      detailedWorkflowType: pendingAgentConfig.detailedWorkflowType,
      workflowDescription: pendingAgentConfig.workflowDescription,
      loopMaxIterations: pendingAgentConfig.loopMaxIterations,
      loopTerminationConditionType: pendingAgentConfig.loopTerminationConditionType,
      loopExitToolName: pendingAgentConfig.loopExitToolName,
      loopExitStateKey: pendingAgentConfig.loopExitStateKey,
      loopExitStateValue: pendingAgentConfig.loopExitStateValue,
      customLogicDescription: pendingAgentConfig.customLogicDescription,
      enableStatePersistence: pendingAgentConfig.enableStatePersistence || false,
      statePersistenceType: pendingAgentConfig.statePersistenceType || 'session',
      initialStateValues: pendingAgentConfig.initialStateValues || [],
      enableStateSharing: pendingAgentConfig.enableStateSharing || false,
      stateSharingStrategy: pendingAgentConfig.stateSharingStrategy || 'none',
      enableRAG: pendingAgentConfig.enableRAG || false,
      enableArtifacts: pendingAgentConfig.enableArtifacts || false,
      artifactStorageType: pendingAgentConfig.artifactStorageType || 'memory',
      artifacts: pendingAgentConfig.artifacts || [],
      cloudStorageBucket: pendingAgentConfig.cloudStorageBucket || "",
      localStoragePath: pendingAgentConfig.localStoragePath || "",
      ragMemoryConfig: pendingAgentConfig.ragMemoryConfig || { enabled: false, serviceType: "", projectId: "", location: "", ragCorpusName: "", similarityTopK: 0, vectorDistanceThreshold: 0, embeddingModel: "", knowledgeSources: [], includeConversationContext: false, persistentMemory: false },
      a2aConfig: pendingAgentConfig.a2aConfig || { enabled: false, communicationChannels: [], defaultResponseFormat: "", maxMessageSize: 0, loggingEnabled: false },
      toolsDetails: toolsDetails,
      toolConfigsApplied: pendingAgentConfig.toolConfigsApplied || {},
      templateId: 'custom_by_creator',
      systemPromptGenerated: pendingAgentConfig.systemPromptGenerated || "",
      subAgents: pendingAgentConfig.subAgents || [],
      isRootAgent: pendingAgentConfig.isRootAgent !== undefined ? pendingAgentConfig.isRootAgent : true,
    };

    setSavedAgents(prev => [...(prev || []), finalConfig]);
    toast({ title: "Agent Saved!", description: `Agent "${finalConfig.agentName}" has been saved.` });
    setPendingAgentConfig(null);
  };

  const handleDiscardPendingAgent = () => {
    toast({ title: "Configuration Discarded", variant: "default" });
    setPendingAgentConfig(null);
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [optimisticMessages, pendingAgentConfig]);

  const handleNewConversation = useCallback(async () => {
    if (!currentUserId) {
      toast({ title: "Authentication Error", description: "Please log in.", variant: "destructive" });
      return;
    }
    setIsLoadingConversations(true);
    try {
      const newConv = await cs.createNewConversation(currentUserId, "Nova Conversa");
      if (newConv) {
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setMessages([]);
        setPendingAgentConfig(null);
        setInputValue("");
        removeSelectedFile();
        toast({ title: "Nova Conversa Criada", description: `"${newConv.title}" iniciada.` });
      } else {
        toast({ title: "Erro", description: "Não foi possível criar uma nova conversa.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating new conversation:", error);
      toast({ title: "Erro ao Criar", description: "Falha ao iniciar uma nova conversa.", variant: "destructive" });
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUserId, removeSelectedFile]);

  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    try {
      await cs.renameConversationInStorage(id, newTitle);
      setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title: newTitle, updatedAt: new Date() } : c));
      toast({ title: "Conversa Renomeada", description: `Conversa renomeada para ${newTitle}.`});
    } catch (error) {
      console.error("Error renaming conversation:", error);
      toast({ title: "Erro", description: "Falha ao renomear conversa.", variant: "destructive" });
    }
  }, []);

  const handleDeleteConversation = useCallback(async (conversationToDelete: Conversation) => {
    if (!conversationToDelete || !conversationToDelete.id) return;
    const { id } = conversationToDelete;
    try {
      await cs.deleteConversationFromStorage(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
        setPendingAgentConfig(null);
      }
      toast({ title: "Conversa Apagada" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast({ title: "Erro", description: "Falha ao apagar conversa.", variant: "destructive" });
    }
  }, [activeConversationId]);

  const handleSelectConversationById = useCallback((id: string): void => {
    if (!id) {
      console.error("handleSelectConversationById called with invalid id");
      return;
    }
    setActiveConversationId(id);
    setPendingAgentConfig(null);
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  useEffect(() => {
    const storedADKAgents = localStorage.getItem("adkAgents");
    if (storedADKAgents) {
      try {
        const parsedAgents = JSON.parse(storedADKAgents) as ADKAgentConfig[];
        setAdkAgents(parsedAgents);
      } catch (e) { console.error("Failed to parse ADK agents from localStorage", e); }
    }
    setIsADKInitializing(false);
  }, []);

  const selectedADKAgent = useMemo(() => {
    if (!selectedADKAgentId || adkAgents.length === 0) return null;
    return adkAgents.find((agent) => agent.name === selectedADKAgentId) || null;
  }, [selectedADKAgentId, adkAgents]);

 const currentSelectedAgentForHeader = useMemo(() => {
    if (selectedGemId && selectedGemId !== "none") {
        const gem = initialGems.find(g => g.id === selectedGemId);
        return gem ? { id: gem.id, name: gem.name, description: gem.description } : null;
    }
    if (selectedAgentId && selectedAgentId !== "none" && savedAgents) {
        const agent = savedAgents.find(a => a.id === selectedAgentId);
        return agent ? { id: agent.id, name: agent.agentName, description: agent.agentDescription } : null;
    }
    if (usingADKAgent && selectedADKAgentId && adkAgents) {
        const adkAgent = adkAgents.find(a => a.name === selectedADKAgentId);
        if (adkAgent) return { id: adkAgent.name, name: adkAgent.name, description: adkAgent.description };
    }
    const defaultGem = initialGems[0];
    return defaultGem ? {id: defaultGem.id, name: defaultGem.name, description: defaultGem.description } : null;
  }, [selectedGemId, selectedAgentId, savedAgents, usingADKAgent, selectedADKAgentId, adkAgents]);


  if (authLoading) {
    return <div className="flex h-full items-center justify-center"><p>Loading authentication...</p></div>;
  }

  return (
    <div className="flex h-full overflow-hidden bg-background text-foreground">
      <ConversationSidebar
        isOpen={isSidebarOpen}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversationById}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatHeader
          activeChatTarget={currentSelectedAgentForHeader?.name || "Chat"}
          usingADKAgent={usingADKAgent}
          setUsingADKAgent={setUsingADKAgent}
          selectedADKAgentId={selectedADKAgentId}
          setSelectedADKAgentId={setSelectedADKAgentId}
          adkAgents={adkAgents.map((agent) => ({ id: agent.name, name: agent.name, displayName: agent.name, description: agent.description }))}
          isADKInitializing={isADKInitializing}
          selectedAgentId={selectedAgentId}
          setSelectedAgentId={setSelectedAgentId}
          savedAgents={(savedAgents || []).map(a => ({id: a.id, name: a.agentName, displayName: a.agentName, description: a.agentDescription}))}
          selectedGemId={selectedGemId}
          setSelectedGemId={setSelectedGemId}
          initialGems={initialGems.map(g => ({...g, displayName: g.name}))}
          handleNewConversation={handleNewConversation}
          isSidebarOpen={isSidebarOpen}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
        />
        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 space-y-4" id="message-scroll-area">
            {!currentUser && !authLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
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
            <Card className="m-4 border-primary shadow-lg">
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
          formRef={useRef<HTMLFormElement>(null)}
          inputRef={inputRef}
          fileInputRef={fileInputRef}
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
