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
import { useAgents } from "@/contexts/AgentsContext"; // For saving agents
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebaseClient";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import type { AgentConfig, LLMAgentConfig, SavedAgentConfiguration as SavedAgentConfigType } from "@/app/agent-builder/page"; // Renamed to avoid conflict

import ChatHeader from "@/components/features/chat/ChatHeader";
import WelcomeScreen from "@/components/features/chat/WelcomeScreen";
import MessageList from "@/components/features/chat/MessageList";
import MessageInputArea from "@/components/features/chat/MessageInputArea";
import { ChatMessageUI, Conversation } from "@/types/chat";
import ConversationSidebar from "@/components/features/chat/ConversationSidebar";
// BasicChatInput is used for /api/chat-stream, AgentCreatorFlowInputSchema for /api/agent-creator-stream
// import { BasicChatInput } from "@/ai/flows/chat-flow";
// import { AgentCreatorFlowInputSchema } from "@/ai/flows/agent-creator-flow";
import { ADKAgentConfig, ADKTool } from "@/lib/google-adk";
import * as cs from "@/lib/firestoreConversationStorage";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";


const initialGems = [
  {
    id: "general",
    name: "Assistente Geral",
    description: "Um assistente de IA de uso geral para ajudar com uma variedade de tarefas e perguntas.",
    prompt: "Você é um assistente prestativo e conciso.",
  },
  {
    id: "creative",
    name: "Escritor Criativo",
    description: "Um assistente de IA para ajudar na escrita criativa, brainstorming e geração de ideias.",
    prompt:
      "Você é um escritor criativo, ajude a gerar ideias e textos com um tom inspirador.",
  },
  {
    id: "code",
    name: "Programador Expert",
    description: "Um assistente de IA especializado em programação, explicação de código e depuração.",
    prompt:
      "Você é um programador expert, forneça explicações claras e exemplos de código eficientes.",
  },
  {
    id: "researcher",
    name: "Pesquisador Analítico",
    description: "Um assistente de IA focado em pesquisa, análise de dados e fornecimento de informações factuais.",
    prompt:
      "Você é um pesquisador analítico, foque em dados e informações factuais.",
  },
  {
    id: "agent_creator_assistant",
    name: "Agent Creator Assistant",
    description: "Converse comigo para projetar e configurar novos agentes de IA. Eu o guiarei pelo processo.",
  },
];

export function ChatUI() {
  const { currentUser, loading: authLoading } = useAuth();
  const currentUserId = currentUser?.uid;

  const { savedAgents, setSavedAgents, availableTools: builderAvailableTools } = useAgents(); // Get saving capabilities and available tools for details
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
      setPendingAgentConfig(null); // Clear pending config on logout
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
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>("none"); // For saved agents
  const [selectedADKAgentId, setSelectedADKAgentId] = useState<string | null>(null); // For ADK agents

  // Determine activeChatTarget based on selection
  const activeChatTarget = useMemo(() => {
    if (selectedGemId && selectedGemId !== "none") {
      return initialGems.find(g => g.id === selectedGemId)?.name || "Chat";
    }
    if (selectedAgentId && selectedAgentId !== "none") {
      return savedAgents.find(a => a.id === selectedAgentId)?.name || "Chat";
    }
    // Could add ADK agent name here too if needed
    return initialGems[0].name; // Default
  }, [selectedGemId, selectedAgentId, savedAgents]);


  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [usingADKAgent, setUsingADKAgent] = useState(false); // Example state

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileDataUri, setSelectedFileDataUri] = useState<string | null>(null);

  const [adkAgents, setAdkAgents] = useState<ADKAgentConfig[]>([]); // ADK agents list
  const [isADKInitializing, setIsADKInitializing] = useState(true); // ADK initialization status

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
    // Reset pending config if the selected agent changes
    setPendingAgentConfig(null);
  }, [selectedGemId, selectedAgentId]);

  // Load initial conversations (useEffect for this remains unchanged)
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

  // Load messages when activeConversationId changes (useEffect for this remains unchanged)
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
    // Simplified, actual implementation has more validation
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setSelectedFileDataUri(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setSelectedFileDataUri(null);
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
     if (pendingAgentConfig && isPending) { // Prevent sending new messages while reviewing a config and another response is pending
      toast({ title: "Aguarde", description: "Por favor, salve ou descarte a configuração do agente pendente antes de enviar uma nova mensagem.", variant: "default"});
      return;
    }


    setIsPending(true);
    setPendingAgentConfig(null); // Clear any previous pending config when a new message is sent

    const userMessageId = uuidv4();
    const agentMessageId = uuidv4();

    const userMessage: ChatMessageUI = {
      id: userMessageId,
      sender: "user",
      text: currentInput,
      imageUrl: selectedFile && selectedFile.type.startsWith("image/") ? selectedFileDataUri : undefined,
      fileName: selectedFile ? selectedFile.name : undefined,
      isStreaming: false,
      timestamp: new Date(),
    };
    setOptimisticMessages(userMessage);

    if (activeConversationId) {
        await cs.addMessageToConversation(activeConversationId, {
            sender: currentUserId, text: currentInput, isUser: true, isLoading: false, isError: false,
            imageUrl: userMessage.imageUrl, fileName: userMessage.fileName, content: currentInput,
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

    const historyForBackend = messages.map(msg => ({
      role: msg.sender === "user" ? "user" : "model",
      content: isAgentCreatorSession ? [{ text: msg.text || "" }] : (msg.text || ""),
    }));

    let requestBody: any = {
      userMessage: currentInput,
      history: historyForBackend,
      userId: currentUserId,
      stream: true,
    };

    if (!isAgentCreatorSession) {
      const currentSavedAgentConfig = savedAgents.find(a => a.id === selectedAgentId)?.config;
      requestBody = {
        ...requestBody,
        fileDataUri: selectedFile && !selectedFile.type.startsWith("image/") ? selectedFileDataUri : undefined, // Assuming non-image files might be passed as data URIs
        modelName: (currentSavedAgentConfig as LLMAgentConfig)?.agentModel,
        systemPrompt: (currentSavedAgentConfig as AgentConfig)?.globalInstruction, // Or agentDescription
        temperature: (currentSavedAgentConfig as LLMAgentConfig)?.agentTemperature,
        agentToolsDetails: (currentSavedAgentConfig as AgentConfig)?.agentTools?.map(toolId => {
            const toolDetail = builderAvailableTools.find(t => t.id === toolId);
            return { id: toolId, name: toolDetail?.name || toolId, description: toolDetail?.description || `Tool: ${toolId}`, enabled: true };
        })
      };
    }

    const pendingAgentMessage: ChatMessageUI = {
      id: agentMessageId, sender: "agent", text: "", isStreaming: true, timestamp: new Date(),
    };
    setOptimisticMessages(pendingAgentMessage);

    let agentMessageStorageId: string | null = null;
    if (activeConversationId) {
        const placeholder = await cs.addMessageToConversation(activeConversationId, {
            sender: "agent", text: "", content: "", isUser: false, isLoading: true, isError: false,
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
                  // No need to add to accumulatedContent, the confirmation message will be separate
                }
                if (jsonChunk.error) {
                  accumulatedContent += `\n\n[STREAM ERROR]: ${jsonChunk.error}`;
                  console.error("Agent Creator Stream Error Chunk:", jsonChunk.error);
                }
                 if (jsonChunk.rawJsonForDebug) {
                  console.log("Raw JSON for debug (parsing failed by flow):", jsonChunk.rawJsonForDebug);
                  // Potentially display this to user or in a debug view
                }
              } catch (e) {
                console.warn("ChatUI: Failed to parse JSON chunk from agent creator stream:", line, e);
              }
            } else {
              accumulatedContent += line + "\n"; // Regular chat stream, treat as plain text lines
            }
          }
        }
        setOptimisticMessages({ id: agentMessageId, sender: "agent", text: accumulatedContent, isStreaming: true });
      }
      // Process any remaining data in buffer
      if (buffer.trim()) {
         if (isAgentCreatorSession) {
            try {
                const jsonChunk = JSON.parse(buffer.trim());
                 if (jsonChunk.agentResponseChunk) accumulatedContent += jsonChunk.agentResponseChunk;
                 if (jsonChunk.suggestedConfig) setPendingAgentConfig(jsonChunk.suggestedConfig as SavedAgentConfigType);
                 if (jsonChunk.error) accumulatedContent += `\n\n[STREAM ERROR]: ${jsonChunk.error}`;
            } catch (e) {console.warn("ChatUI: Failed to parse final JSON chunk:", buffer.trim(), e);}
         } else {
            accumulatedContent += buffer.trim();
         }
      }
      setOptimisticMessages({ id: agentMessageId, sender: "agent", text: accumulatedContent, isStreaming: false });

      if (activeConversationId && agentMessageStorageId) {
        await cs.finalizeMessageInConversation(activeConversationId, agentMessageStorageId, accumulatedContent, false);
        setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, updatedAt: new Date() } : c));
      }
      setMessages(prev => prev.map(m => m.id === agentMessageId ? {...m, text: accumulatedContent, isStreaming: false} : m));


    } catch (error: any) {
      console.error("Error during agent response streaming:", error);
      const errorText = `Error: ${error.message}`;
      setOptimisticMessages({ id: agentMessageId, sender: "agent", text: errorText, isStreaming: false, isError: true });
      if (activeConversationId && agentMessageStorageId) {
        await cs.finalizeMessageInConversation(activeConversationId, agentMessageStorageId, errorText, true);
         setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, updatedAt: new Date() } : c));
      }
       setMessages(prev => prev.map(m => m.id === agentMessageId ? {...m, text: errorText, isStreaming: false, isError: true} : m));
    } finally {
      setIsPending(false);
    }
  };

  const handleSavePendingAgent = () => {
    if (!pendingAgentConfig || !setSavedAgents) return;

    // Simplified toolsDetails population
    const toolsDetails = (pendingAgentConfig.agentTools || []).map(toolId => {
        const foundTool = builderAvailableTools.find(t => t.id === toolId);
        return {
            id: toolId,
            name: foundTool?.name || toolId,
            description: foundTool?.description || `Details for ${toolId}`,
            // Ensure other required fields for AvailableTool are present, even if minimal
            hasConfig: foundTool?.hasConfig || false,
            icon: foundTool?.icon || "Settings", // Default icon
            schema: foundTool?.schema || {},
        };
    });


    const finalConfig: SavedAgentConfigType = {
      id: pendingAgentConfig.id || uuidv4(),
      name: pendingAgentConfig.agentName || "Untitled Agent",
      description: pendingAgentConfig.agentDescription || "",
      version: pendingAgentConfig.agentVersion || "1.0.0",
      icon: pendingAgentConfig.icon || "Sparkles", // Default icon
      config: { // This should be the 'config' object within SavedAgentConfiguration
        type: pendingAgentConfig.agentType || 'llm',
        framework: pendingAgentConfig.agentFramework || 'genkit',
        globalInstruction: pendingAgentConfig.globalInstruction || pendingAgentConfig.agentGoal || "", // Map from old structure potentially
        // LLM specific
        ...(pendingAgentConfig.agentType === 'llm' && {
            agentGoal: pendingAgentConfig.agentGoal || "",
            agentTasks: pendingAgentConfig.agentTasks ? (Array.isArray(pendingAgentConfig.agentTasks) ? pendingAgentConfig.agentTasks : [pendingAgentConfig.agentTasks]) : [],
            agentPersonality: pendingAgentConfig.agentPersonality || "",
            agentModel: pendingAgentConfig.agentModel || "googleai/gemini-1.5-flash-latest",
            agentTemperature: pendingAgentConfig.agentTemperature !== undefined ? pendingAgentConfig.agentTemperature : 0.7,
        }),
        // Workflow specific (add if defined in your pendingAgentConfig structure from LLM)
        ...(pendingAgentConfig.agentType === 'workflow' && {
            detailedWorkflowType: pendingAgentConfig.detailedWorkflowType || "sequential",
            workflowDescription: pendingAgentConfig.workflowDescription || "",
        }),
        // Other common config fields like statePersistence, rag, artifacts, a2a, subAgentIds, isRootAgent
        // should be part of pendingAgentConfig.config if the LLM structures it that way,
        // or handled here if the LLM provides them at the top level of pendingAgentConfig.
        // For simplicity, assuming they might be top-level in pendingAgentConfig for now if LLM sends flat structure.
        agentTools: pendingAgentConfig.agentTools || [], // Ensure agentTools is an array
        // Default other complex configs if not provided by LLM
        statePersistence: pendingAgentConfig.statePersistence || { enabled: false, type: 'session', initialState: [] },
        rag: pendingAgentConfig.rag || { enabled: false, config: {} },
        artifacts: pendingAgentConfig.artifacts || { enabled: false, storageType: 'local' },
        a2a: pendingAgentConfig.a2a || { enabled: false, communicationChannels: [] },
        subAgentIds: pendingAgentConfig.subAgentIds || [],
        isRootAgent: pendingAgentConfig.isRootAgent !== undefined ? pendingAgentConfig.isRootAgent : true,

      },
      tools: pendingAgentConfig.agentTools || [], // Already an array of strings from LLM
      toolConfigsApplied: pendingAgentConfig.toolConfigsApplied || {},
      toolsDetails: toolsDetails, // Populate based on agentTools
      createdAt: pendingAgentConfig.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      templateId: 'custom_by_creator', // Special ID for agents created this way
    };

    setSavedAgents(prev => [...(prev || []), finalConfig]);
    toast({ title: "Agent Saved!", description: `Agent "${finalConfig.name}" has been saved.` });
    setPendingAgentConfig(null);

    // Optionally send a follow-up message
    // This would require adding this message to `messages` and `optimisticMessages`
    // and potentially re-triggering a non-streaming call to the agent creator if you want its response.
    // For simplicity, just clearing the config for now.
  };

  const handleDiscardPendingAgent = () => {
    toast({ title: "Configuration Discarded", variant: "default" });
    setPendingAgentConfig(null);
    // Optionally send a message like "Let's try again" or "I want to make some changes."
    // setInputValue("I'd like to make some changes to that configuration.");
    // setTimeout(() => formRef.current?.requestSubmit(), 100); // Auto-submit this message
  };


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [optimisticMessages, pendingAgentConfig]); // Also scroll if pending config appears/disappears

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
        setMessages([]); // Clear messages for new conversation
        setPendingAgentConfig(null); // Clear pending config
        setInputValue("");
        setSelectedFile(null);
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
  }, [currentUserId]);

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
    setPendingAgentConfig(null); // Clear pending config when switching conversations
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  // Load ADK agents from localStorage (example)
  useEffect(() => {
    const storedADKAgents = localStorage.getItem("adkAgents");
    if (storedADKAgents) {
      try {
        setAdkAgents(JSON.parse(storedADKAgents));
      } catch (e) { console.error("Failed to parse ADK agents from localStorage", e); }
    }
    setIsADKInitializing(false); // Assuming quick load or default to false
  }, []);

  const selectedADKAgent = useMemo(() => {
    if (!selectedADKAgentId || adkAgents.length === 0) return null;
    return adkAgents.find((agent) => (agent.agentId ?? agent.displayName) === selectedADKAgentId) || null;
  }, [selectedADKAgentId, adkAgents]);

  const currentSelectedAgentForHeader = useMemo(() => {
    if (selectedGemId && selectedGemId !== "none") {
        return initialGems.find(g => g.id === selectedGemId);
    }
    if (selectedAgentId && selectedAgentId !== "none") {
        return savedAgents.find(a => a.id === selectedAgentId);
    }
    // Add ADK agent logic here if applicable
    return initialGems[0]; // Default
  }, [selectedGemId, selectedAgentId, savedAgents]);


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
          activeChatTarget={activeChatTarget}
          usingADKAgent={usingADKAgent} // Pass actual state if ADK agents are selectable
          setUsingADKAgent={setUsingADKAgent} // Pass actual setter
          selectedADKAgentId={selectedADKAgentId}
          setSelectedADKAgentId={setSelectedADKAgentId}
          adkAgents={adkAgents.map((agent) => ({ ...agent, id: agent.agentId || agent.displayName }))}
          isADKInitializing={isADKInitializing}
          selectedAgentId={selectedAgentId} // For saved agents
          setSelectedAgentId={setSelectedAgentId}
          savedAgents={savedAgents.map(a => ({...a, displayName: a.name}))} // Adapt SavedAgentConfigType to AgentSelector's expected type
          selectedGemId={selectedGemId} // For initial gems
          setSelectedGemId={setSelectedGemId}
          initialGems={initialGems.map(g => ({...g, displayName: g.name}))} // Adapt Gem to AgentSelector's expected type
          handleNewConversation={handleNewConversation}
          isSidebarOpen={isSidebarOpen}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
        />
        <div className="flex-1 overflow-hidden flex flex-col"> {/* Ensure this can flex */}
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

          {/* Pending Agent Configuration Review UI */}
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
          formRef={useRef<HTMLFormElement>(null)} // Local ref for MessageInputArea if it needs one
          inputRef={inputRef}
          fileInputRef={fileInputRef}
          onSubmit={handleFormSubmit}
          isPending={isPending || !!pendingAgentConfig} // Disable input while pending response or reviewing config
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
