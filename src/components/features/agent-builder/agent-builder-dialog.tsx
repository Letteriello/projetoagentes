"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
// Removido import duplicado de tipos já definidos localmente ou importados abaixo para evitar conflito
// Import removido para evitar conflito de tipos já definidos localmente ou importados abaixo.
import { CommunicationChannelItem } from "./a2a-communication-channel";
import { MemoryServiceType } from "./memory-knowledge-tab"; // Ensure this matches the type used in RagMemoryConfig definition
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertCircle, 
  Ban, 
  Brain, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp, 
  Cpu, 
  FileJson, 
  Info, 
  Layers, 
  ListChecks, 
  Loader2, 
  Network, 
  Plus, 
  Save, 
  Search, 
  Settings, 
  Settings2, 
  Smile, 
  Target, 
  Trash2, 
  Users, 
  Wand2, 
  Workflow, 
  X,
  Copy,
  ChevronsUpDown,
  PlusCircle,
  FileText,
  Database,
  Waypoints,
  Share2,
  UploadCloud,
  Binary,
  Palette
} from "lucide-react";

import { v4 as uuidv4 } from "uuid";
import { zodResolver } from "@hookform/resolvers/zod";
import { AgentFramework, AgentConfig, SavedAgentConfiguration, A2AConfig, RagMemoryConfig, ArtifactDefinition, ToolConfigData, AvailableTool, LLMAgentConfig, WorkflowAgentConfig, CustomAgentConfig } from "@/types/agent-configs"; // AvailableTool type is re-exported by agent-configs, KnowledgeSource removed, added specific agent configs
import type { KnowledgeSource } from "@/components/features/agent-builder/memory-knowledge-tab"; // Correct import for KnowledgeSource
import { availableTools as availableToolsList } from "@/data/available-tools"; 
import { useAgents } from "@/contexts/AgentsContext";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubAgentSelector } from "@/components/features/agent-builder/sub-agent-selector";
import { cn } from "@/lib/utils";
import type { ClassValue } from 'clsx';

// Definimos localmente os tipos que estão faltando
// RagMemoryConfig está disponível em memory-knowledge-tab, mas não é exportado, então definimos aqui

// Definindo tipos que estavam faltando
type TerminationConditionType = "none" | "tool" | "state";

// Definindo o tipo A2AConfigType usado nas configurações de comunicação entre agentes
type A2AConfigType = {
  enabled: boolean;
  communicationChannels: any[]; 
  defaultResponseFormat: string;
  maxMessageSize: number;
  loggingEnabled: boolean;
};

import { AgentTemplate } from "@/data/agentBuilderConfig";

interface AgentBuilderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingAgent: SavedAgentConfiguration | null;
  onSave: (agentConfig: SavedAgentConfiguration) => void;
  availableTools: AvailableTool[];
  agentTypeOptions: Array<{ id: "llm" | "workflow" | "custom" | "a2a"; label: string; icon?: React.ReactNode; description: string; }>;
  agentToneOptions: { id: string; label: string; }[];
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>;
  agentTemplates: AgentTemplate[];
}

const AgentBuilderDialog: React.FC<AgentBuilderDialogProps> = ({
  isOpen,
  onOpenChange,
  editingAgent,
  onSave,
  availableTools,
  agentTypeOptions,
  agentToneOptions,
  iconComponents
}) => {
  // Core Agent Properties
  const [agentName, setAgentName] = React.useState<string>("");
  const [agentDescription, setAgentDescription] = React.useState<string>("");
  const [agentVersion, setAgentVersion] = React.useState<string>("1.0.0");
  const [agentFramework, setAgentFramework] = React.useState<AgentFramework>("genkit");
  const [selectedAgentType, setSelectedAgentType] = React.useState<"llm" | "workflow" | "custom" | "a2a">("llm");

  // Multi-Agent Properties
  const [isRootAgent, setIsRootAgent] = React.useState<boolean>(true);
  const [subAgentIds, setSubAgentIds] = React.useState<string[]>([]);

  // Behavior & Prompting - Common
  const [globalInstruction, setGlobalInstruction] = React.useState<string>("");
  const [systemPromptGenerated, setSystemPromptGenerated] = React.useState<string>("");

  // Behavior & Prompting - LLM Specific
  const [agentGoal, setAgentGoal] = React.useState<string>("");
  const [agentTasks, setAgentTasks] = React.useState<string[]>([]);
  const [agentPersonality, setAgentPersonality] = React.useState<string>(agentToneOptions[0]?.id || "");
  const [agentRestrictions, setAgentRestrictions] = React.useState<string[]>([]);
  const [agentModel, setAgentModel] = React.useState<string>("gemini-1.5-flash");
  const [agentTemperature, setAgentTemperature] = React.useState<number>(0.7);

  // Behavior & Prompting - Workflow Specific
  const [detailedWorkflowType, setDetailedWorkflowType] = React.useState<"sequential" | "graph" | "stateMachine" | undefined>("sequential");
  const [workflowDescription, setWorkflowDescription] = React.useState<string>("");
  const [loopMaxIterations, setLoopMaxIterations] = React.useState<number | undefined>(undefined);

  // Behavior & Prompting - Custom Specific
  // customLogicDescription state will be declared once further down.

  // Multi-agent fields (Google ADK)
  // (Removido: declarações duplicadas de isRootAgent, subAgents, globalInstruction e agentFramework)

  // Função genérica para manipular alterações de campo
  const handleFieldChange = (fieldName: string, value: any) => {
    // Manipula diferentes campos com base no nome
    switch (fieldName) {
      case 'agentName':
        setAgentName(value);
        break;
      case 'agentDescription':
        setAgentDescription(value);
        break;
    case 'agentVersion':
      setAgentVersion(value);
      break;
    case 'agentGoal':
      setAgentGoal(value);
      break;
    case 'agentTasks':
      setAgentTasks(value);
      break;
    case 'agentPersonality':
      setAgentPersonality(value);
      break;
    case 'agentRestrictions':
      setAgentRestrictions(value);
      break;
    case 'agentModel':
      setAgentModel(value);
      break;
    case 'isRootAgent':
      setIsRootAgent(value);
      break;
    case 'agentFramework':
      setAgentFramework(value);
      break;
    default:
      console.log(`Campo não manipulado: ${fieldName}`);
  }
};

// (Removido: duplicidades de estados para gerenciamento de estado, memória e RAG)

// Estados para gerenciamento de artefatos
const [enableArtifacts, setEnableArtifacts] = React.useState<boolean>(
    editingAgent?.config.artifacts?.enabled || false
);
const [artifactStorageType, setArtifactStorageType] = React.useState<'memory' | 'local' | 'cloud'>('memory');
// Initialize artifacts as empty; useEffect will populate it from editingAgent.config.artifacts.definitions
const [artifacts, setArtifacts] = React.useState<ArtifactDefinition[]>([]);
const [cloudStorageBucket, setCloudStorageBucket] = React.useState<string>(
    "" // Initialize as empty; useEffect will populate
);
const [localStoragePath, setLocalStoragePath] = React.useState<string>(
    "" // Initialize as empty; useEffect will populate
);

// Estado para ferramentas selecionadas
const [selectedTools, setSelectedTools] = React.useState<string[]>([]); // Initialize as empty; useEffect will populate


// Estados para RAG e memória - Initialize with minimal valid defaults; useEffect will populate
const initialRagMemoryConfig: RagMemoryConfig = {
    enabled: false,
    serviceType: 'vertexAISearch', // Default from UI
    similarityTopK: 5,
    vectorDistanceThreshold: 0.5,
    knowledgeSources: [],
    includeConversationContext: true,
    persistentMemory: { enabled: false },
    vertexAISearchConfig: {
        projectId: '',
        location: '',
        dataStoreId: '', // Was ragCorpusName
        embeddingModelName: '' // Was embeddingModel
    },
    pineconeConfig: undefined,
    localFaissConfig: undefined,
    googleSearchConfig: undefined
};
const [ragMemoryConfig, setRagMemoryConfig] = React.useState<RagMemoryConfig>(initialRagMemoryConfig);

// Estado para configuração A2A - Initialize with minimal valid defaults; useEffect will populate
const initialA2AConfig: A2AConfigType = {
    enabled: false,
    communicationChannels: [],
    defaultResponseFormat: 'text',
    maxMessageSize: 1024 * 1024, // 1MB default
    loggingEnabled: false,
};
const [a2aConfig, setA2aConfig] = React.useState<A2AConfig>({
    ...initialA2AConfig,
    maxMessageSize: initialA2AConfig.maxMessageSize ?? 0,
    defaultResponseFormat: (initialA2AConfig.defaultResponseFormat as A2AConfig['defaultResponseFormat']) || 'text',
});

// Workflow Fields
  // (Removido: duplicidades de workflowDescription, detailedWorkflowType e loopMaxIterations)
  // Simplified initialization, useEffect will populate from editingAgent.config
  const [loopTerminationConditionType, setLoopTerminationConditionType] = React.useState<TerminationConditionType>("none");
  const [loopExitToolName, setLoopExitToolName] = React.useState<string | undefined>(undefined);
  const [loopExitStateKey, setLoopExitStateKey] = React.useState<string | undefined>(undefined);
  const [loopExitStateValue, setLoopExitStateValue] = React.useState<string | undefined>(undefined);
  
  // Custom/A2A/Task Fields (some might overlap or use LLM fields)
  // Simplified initialization for customLogicDescription
  const [customLogicDescription, setCustomLogicDescription] = React.useState<string>("");

  const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, ToolConfigData>>({}); // Initialize as empty
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false);
  const [configuringTool, setConfiguringTool] = React.useState<AvailableTool | null>(null);

  // State & Memory
  const [enableStatePersistence, setEnableStatePersistence] = React.useState<boolean>(false);
  const [statePersistenceType, setStatePersistenceType] = React.useState<string>("session");
  const [initialStateValues, setInitialStateValues] = React.useState<Array<{key: string, value: string}>>([]);

  // RAG
  const [enableRAG, setEnableRAG] = React.useState<boolean>(false);
  // (Removido: declaração duplicada de ragMemoryConfig e a2aConfig)

  // Artifacts
  // (Removido: declarações duplicadas de enableArtifacts, artifactStorageType, cloudStorageBucket e localStoragePath)

  // A2A Config
  // (Removido: declaração duplicada de a2aConfig)

  // Modal specific states for tool configuration
  const [modalGoogleApiKey, setModalGoogleApiKey] = React.useState<string>('');
  const [modalGoogleCseId, setModalGoogleCseId] = React.useState<string>('');
  const [modalOpenapiSpecUrl, setModalOpenapiSpecUrl] = React.useState<string>('');
  const [modalOpenapiApiKey, setModalOpenapiApiKey] = React.useState<string>('');
  const [modalDbType, setModalDbType] = React.useState<string>('');
  const [modalDbHost, setModalDbHost] = React.useState<string>('');
  const [modalDbPort, setModalDbPort] = React.useState<number>(0);
  const [modalDbName, setModalDbName] = React.useState<string>('');
  const [modalDbUser, setModalDbUser] = React.useState<string>('');
  const [modalDbPassword, setModalDbPassword] = React.useState<string>('');
  const [modalDbConnectionString, setModalDbConnectionString] = React.useState<string>('');
  const [modalDbDescription, setModalDbDescription] = React.useState<string>('');
  const [modalKnowledgeBaseId, setModalKnowledgeBaseId] = React.useState<string>('');
  const [modalCalendarApiEndpoint, setModalCalendarApiEndpoint] = React.useState<string>('');

  const { toast } = useToast();
  const { savedAgents: allSavedAgents } = useAgents(); // For SubAgentSelector

  const availableAgentsForSubSelector = React.useMemo(() =>
    allSavedAgents.filter(agent => agent.id !== editingAgent?.id),
    [allSavedAgents, editingAgent?.id]
  );

  const agentFrameworkOptions = [
    { id: "genkit", label: "Genkit" },
    { id: "crewai", label: "CrewAI" },
    { id: "custom", label: "Custom Framework" },
  ];

  React.useEffect(() => {
    if (isOpen) {
      if (editingAgent) {
        // Populate with editingAgent data
        setAgentName(editingAgent.agentName || "Novo Agente");
        setAgentDescription(editingAgent.agentDescription || "");
        setAgentVersion(editingAgent.agentVersion || "1.0.0"); // Use new type structure

        // const config = editingAgent.toolConfigsApplied || {} as AgentConfig; // OLD - Incorrect
        const agentConfig = editingAgent.config; // NEW - Correct way to access core config

        setSelectedAgentType(agentConfig.type || "llm");
        setAgentFramework(agentConfig.framework || "genkit");
        setIsRootAgent(agentConfig.isRootAgent !== undefined ? agentConfig.isRootAgent : true);
        setSubAgentIds(agentConfig.subAgentIds || []);
        setGlobalInstruction(agentConfig.globalInstruction || "");

        if (agentConfig.type === "llm") {
          const llmConfig = agentConfig as LLMAgentConfig;
          setAgentGoal(llmConfig.agentGoal || "");
          setAgentTasks(llmConfig.agentTasks || []); // Simpler assignment
          setAgentPersonality(llmConfig.agentPersonality || agentToneOptions[0]?.id || "");
          setAgentRestrictions(llmConfig.agentRestrictions || []); // Simpler assignment
          setAgentModel(llmConfig.agentModel || "gemini-1.5-flash");
          setAgentTemperature(llmConfig.agentTemperature !== undefined ? llmConfig.agentTemperature : 0.7);
          setSystemPromptGenerated(llmConfig.systemPromptGenerated || "");
        } else { // Reset LLM fields if not LLM type
          setAgentGoal(""); setAgentTasks([]); setAgentPersonality(agentToneOptions[0]?.id || ""); setAgentRestrictions([]);
          setAgentModel("gemini-1.5-flash"); setAgentTemperature(0.7); setSystemPromptGenerated("");
        }

        if (agentConfig.type === "workflow") {
          const workflowConfig = agentConfig as WorkflowAgentConfig;
          setDetailedWorkflowType(workflowConfig.detailedWorkflowType || "sequential");
          setWorkflowDescription(workflowConfig.workflowDescription || "");
          setLoopMaxIterations(workflowConfig.loopMaxIterations);
          setLoopTerminationConditionType(workflowConfig.loopTerminationConditionType || "none");
          setLoopExitToolName(workflowConfig.loopExitToolName);
          setLoopExitStateKey(workflowConfig.loopExitStateKey);
          setLoopExitStateValue(workflowConfig.loopExitStateValue);
        } else { // Reset workflow fields
            setDetailedWorkflowType("sequential"); setWorkflowDescription(""); setLoopMaxIterations(undefined);
            setLoopTerminationConditionType("none"); setLoopExitToolName(undefined);
            setLoopExitStateKey(undefined); setLoopExitStateValue(undefined);
        }

        if (agentConfig.type === "custom") {
            const customConfig = agentConfig as CustomAgentConfig;
            setCustomLogicDescription(customConfig.customLogicDescription || "");
        } else {
            setCustomLogicDescription("");
        }

        setSelectedTools(editingAgent.tools || []);
        setToolConfigurations(editingAgent.toolConfigsApplied || {});

        setEnableStatePersistence(agentConfig.statePersistence?.enabled || false);
        setStatePersistenceType(agentConfig.statePersistence?.type || "session");
        setInitialStateValues(agentConfig.statePersistence?.initialState || []);

        setEnableRAG(agentConfig.rag?.enabled || false);
        // Default for RagMemoryConfig - ensure it matches the type definition
        const defaultRagConfig: RagMemoryConfig = {
          enabled: false, // This refers to RAG itself, config is nested
          serviceType: "vertexAISearch", // A more sensible default from UI
          similarityTopK: 5,
          vectorDistanceThreshold: 0.5,
          knowledgeSources: [],
          includeConversationContext: true,
          persistentMemory: false,
          // Add other required fields from RagMemoryConfig with default values
          // e.g., projectId: "", location: "", ragCorpusName: "" (if these are required)
        };
        setRagMemoryConfig(agentConfig.rag?.config || defaultRagConfig);

        setEnableArtifacts(agentConfig.artifacts?.enabled || false);
        // Use 'local' as the standard storage type
        const artifactStorageTypeValue = agentConfig.artifacts?.storageType;
        setArtifactStorageType(
          artifactStorageTypeValue === 'filesystem' ? 'local' : (artifactStorageTypeValue as "local" | "memory" | "cloud" || 'memory')
        );
        setCloudStorageBucket(agentConfig.artifacts?.cloudStorageBucket || "");
        setLocalStoragePath(agentConfig.artifacts?.localStoragePath || "./artifacts");
        setArtifacts(agentConfig.artifacts?.definitions || []); // Populate artifact definitions

        setA2AConfig(agentConfig.a2a ? {
          ...initialA2AConfig, // Start with defaults to ensure all keys are present
          ...agentConfig.a2a,
          maxMessageSize: agentConfig.a2a.maxMessageSize ?? initialA2AConfig.maxMessageSize ?? 0,
          defaultResponseFormat: (agentConfig.a2a.defaultResponseFormat as A2AConfig['defaultResponseFormat']) || initialA2AConfig.defaultResponseFormat || 'text',
          communicationChannels: Array.isArray(agentConfig.a2a.communicationChannels) ? agentConfig.a2a.communicationChannels : initialA2AConfig.communicationChannels || [],
        } : { ...initialA2AConfig });

      } else {
        // Reset to default values for new agent
        setAgentName(""); setAgentDescription(""); setAgentVersion("1.0.0");
        setSelectedAgentType("llm"); setAgentFramework("genkit");
        setIsRootAgent(true); setSubAgentIds([]);
        setGlobalInstruction(""); setSystemPromptGenerated("");
        setAgentGoal(""); setAgentTasks([]); setAgentPersonality(agentToneOptions[0]?.id || ""); setAgentRestrictions([]);
        setAgentModel("gemini-1.5-flash"); setAgentTemperature(0.7);

        // Reset Workflow fields
        setDetailedWorkflowType("sequential"); setWorkflowDescription(""); setLoopMaxIterations(undefined);
        setLoopTerminationConditionType("none"); setLoopExitToolName(undefined);
        setLoopExitStateKey(undefined); setLoopExitStateValue(undefined);

        setCustomLogicDescription(""); // Reset custom logic description
        setSelectedTools([]); setToolConfigurations({});
        setEnableStatePersistence(false); setStatePersistenceType("session"); setInitialStateValues([]);
        setEnableRAG(false);
        const defaultRagConfig: RagMemoryConfig = {
          enabled: false, serviceType: "vertexAISearch", similarityTopK: 5, vectorDistanceThreshold: 0.5, knowledgeSources: [],
          includeConversationContext: true, persistentMemory: false, projectId: "", location: "", ragCorpusName: "", embeddingModel: ""
        };
        setRagMemoryConfig(defaultRagConfig);
        setEnableArtifacts(false); setArtifactStorageType("memory"); setCloudStorageBucket(""); setLocalStoragePath("./artifacts"); setArtifacts([]); // Reset artifact definitions
        setA2AConfig({ enabled: false, communicationChannels: [], defaultResponseFormat: 'text', maxMessageSize: 1024*1024, loggingEnabled: false });
      }
    }
    if (!isOpen) {
        setIsToolConfigModalOpen(false);
        setConfiguringTool(null);
    }
  }, [isOpen, editingAgent, agentToneOptions]);

  const handleToolConfigure = (tool: AvailableTool) => {
    setConfiguringTool(tool);
    const existingConfig = toolConfigurations[tool.id] || {};

    // Reset all modal states first
    setModalGoogleApiKey(''); setModalGoogleCseId('');
    setModalOpenapiSpecUrl(''); setModalOpenapiApiKey('');
    setModalDbType(''); setModalDbHost(''); setModalDbPort(0); setModalDbName('');
    setModalDbUser(''); setModalDbPassword(''); setModalDbConnectionString(''); setModalDbDescription('');
    setModalKnowledgeBaseId(''); setModalCalendarApiEndpoint('');

    // Populate modal states from existingConfig (Fix A2)
    if (tool.id === "webSearch") {
      setModalGoogleApiKey(existingConfig.googleApiKey || '');
      setModalGoogleCseId(existingConfig.googleCseId || '');
    } else if (tool.id === "customApiIntegration") {
      setModalOpenapiSpecUrl(existingConfig.openapiSpecUrl || '');
      setModalOpenapiApiKey(existingConfig.openapiApiKey || '');
    } else if (tool.id === "databaseAccess") {
      setModalDbType(existingConfig.dbType || '');
      setModalDbHost(existingConfig.dbHost || '');
      setModalDbPort(Number(existingConfig.dbPort) || 0);
      setModalDbName(existingConfig.dbName || '');
      setModalDbUser(existingConfig.dbUser || '');
      setModalDbPassword(existingConfig.dbPassword || ''); // Note: loading passwords into UI state is risky
      setModalDbConnectionString(existingConfig.dbConnectionString || '');
      setModalDbDescription(existingConfig.dbDescription || '');
    } else if (tool.id === "knowledgeBase") {
      setModalKnowledgeBaseId(existingConfig.knowledgeBaseId || '');
    } else if (tool.id === "calendarAccess") {
      setModalCalendarApiEndpoint(existingConfig.calendarApiEndpoint || '');
    }
    setIsToolConfigModalOpen(true);
  };

  const handleSaveToolConfiguration = () => {
    if (!configuringTool) return;

    const newConfig: ToolConfigData = {}; // Fix A1: Build newConfig from modal states

    if (configuringTool.id === "webSearch") {
      newConfig.googleApiKey = modalGoogleApiKey;
      newConfig.googleCseId = modalGoogleCseId;
    } else if (configuringTool.id === "customApiIntegration") {
      newConfig.openapiSpecUrl = modalOpenapiSpecUrl;
      newConfig.openapiApiKey = modalOpenapiApiKey;
    } else if (configuringTool.id === "databaseAccess") {
      newConfig.dbType = modalDbType;
      newConfig.dbHost = modalDbHost;
      newConfig.dbPort = String(modalDbPort);
      newConfig.dbName = modalDbName;
      newConfig.dbUser = modalDbUser;
      newConfig.dbPassword = modalDbPassword; // Storing passwords in state/config is risky
      newConfig.dbConnectionString = modalDbConnectionString;
      newConfig.dbDescription = modalDbDescription;
    } else if (configuringTool.id === "knowledgeBase") {
      newConfig.knowledgeBaseId = modalKnowledgeBaseId;
    } else if (configuringTool.id === "calendarAccess") {
      newConfig.calendarApiEndpoint = modalCalendarApiEndpoint;
    }

    setToolConfigurations((prev: Record<string, ToolConfigData>) => ({ ...prev, [configuringTool.id!]: newConfig }));
    setIsToolConfigModalOpen(false);
    setConfiguringTool(null);

    const toolDisplayName = configuringTool.name || configuringTool.id;
    toast({ title: `Configuração salva para ${toolDisplayName}` });
  };

  // Manipulador para salvar o agente
  const handleSaveAgent = () => {
    if (!agentName.trim()) {
      toast({ title: "Erro de Validação", description: "O nome do agente é obrigatório.", variant: "destructive" });
      return;
    }

    // Construct the core AgentConfig object based on the new structure
    let coreConfig: AgentConfig;

    if (selectedAgentType === "llm") {
      coreConfig = {
        type: "llm",
        framework: agentFramework as AgentFramework,
        isRootAgent, subAgentIds, globalInstruction,
        statePersistence: { enabled: enableStatePersistence, type: statePersistenceType, initialState: initialStateValues },
        rag: { enabled: enableRAG, config: ragMemoryConfig },
        artifacts: {
          enabled: enableArtifacts, storageType: artifactStorageType,
          cloudStorageBucket: artifactStorageType === 'cloud' ? cloudStorageBucket : undefined,
          localStoragePath: artifactStorageType === 'local' ? localStoragePath : undefined,
          definitions: artifacts
        },
        a2a: a2aConfig,
        // LLM-specific fields
        agentGoal, agentTasks, agentPersonality, agentRestrictions,
        agentModel, agentTemperature, systemPromptGenerated,
      };
    } else if (selectedAgentType === "workflow") {
      coreConfig = {
        type: "workflow",
        framework: agentFramework as AgentFramework,
        isRootAgent, subAgentIds, globalInstruction,
        statePersistence: { enabled: enableStatePersistence, type: statePersistenceType, initialState: initialStateValues },
        rag: { enabled: enableRAG, config: ragMemoryConfig },
        artifacts: {
          enabled: enableArtifacts, storageType: artifactStorageType,
          cloudStorageBucket: artifactStorageType === 'cloud' ? cloudStorageBucket : undefined,
          localStoragePath: artifactStorageType === 'local' ? localStoragePath : undefined,
          definitions: artifacts
        },
        a2a: a2aConfig,
        // Workflow-specific fields
        detailedWorkflowType, workflowDescription, loopMaxIterations,
        loopTerminationConditionType, loopExitToolName, loopExitStateKey, loopExitStateValue,
      };
    } else if (selectedAgentType === "custom") {
      coreConfig = {
        type: "custom",
        framework: agentFramework as AgentFramework,
        isRootAgent, subAgentIds, globalInstruction,
        statePersistence: { enabled: enableStatePersistence, type: statePersistenceType, initialState: initialStateValues },
        rag: { enabled: enableRAG, config: ragMemoryConfig },
        artifacts: {
          enabled: enableArtifacts, storageType: artifactStorageType,
          cloudStorageBucket: artifactStorageType === 'cloud' ? cloudStorageBucket : undefined,
          localStoragePath: artifactStorageType === 'local' ? localStoragePath : undefined,
          definitions: artifacts
        },
        a2a: a2aConfig,
        // Custom-specific fields
        customLogicDescription,
      };
    } else if (selectedAgentType === "a2a") {
      coreConfig = {
        type: "a2a",
        framework: agentFramework as AgentFramework,
        isRootAgent, subAgentIds, globalInstruction,
        statePersistence: { enabled: enableStatePersistence, type: statePersistenceType, initialState: initialStateValues },
        rag: { enabled: enableRAG, config: ragMemoryConfig },
        artifacts: {
          enabled: enableArtifacts, storageType: artifactStorageType,
          cloudStorageBucket: artifactStorageType === 'cloud' ? cloudStorageBucket : undefined,
          localStoragePath: artifactStorageType === 'local' ? localStoragePath : undefined,
          definitions: artifacts
        },
        a2a: a2aConfig,
        // A2A specialist might not have additional fields beyond base + a2aConfig
      };
    } else {
      // Should not happen with proper type selection
      toast({ title: "Erro Interno", description: "Tipo de agente desconhecido.", variant: "destructive" });
      return;
    }

    const agentDataToSave: SavedAgentConfiguration = {
      id: editingAgent?.id || uuidv4(),
      templateId: editingAgent?.templateId || 'custom_manual_dialog',
      agentName: agentName, // Renamed from 'name' in new SavedAgentConfiguration
      agentDescription: agentDescription,
      agentVersion: agentVersion,
      icon: editingAgent?.icon || `${selectedAgentType}-agent-icon.svg`, // Default icon if new
      config: coreConfig, // The fully constructed core configuration
      tools: selectedTools, // Renamed from agentTools to match SavedAgentConfiguration type
      toolConfigsApplied: toolConfigurations,
      toolsDetails: selectedTools
        .map(toolId => {
            const toolDetail = availableTools.find(t => t.id === toolId);
            return toolDetail ? {
                id: toolDetail.id,
                name: toolDetail.name,
                label: toolDetail.name, // Usando 'name' em vez de 'label' que não existe no tipo
                description: toolDetail.description, // Keep description
                iconName: toolDetail.icon ? (Object.keys(iconComponents).find(key => iconComponents[key] === toolDetail.icon) || "Settings") : "Settings",
                hasConfig: toolDetail.hasConfig, // Keep hasConfig
                genkitToolName: toolDetail.genkitToolName
            } : null;
        })
        .filter(Boolean) as SavedAgentConfiguration['toolsDetails'], // Ensure type matches
      createdAt: editingAgent?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(agentDataToSave);
    toast({ title: "Agente Salvo", description: `${agentName} foi salvo com sucesso.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && configuringTool) {
        setIsToolConfigModalOpen(false);
        setConfiguringTool(null);
      } else if (!open) {
        setConfiguringTool(null);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{editingAgent ? "Editar Agente" : "Criar Novo Agente"}</DialogTitle>
          <DialogDescription>
            {editingAgent ? `Modifique os detalhes do agente ${editingAgent.agentName}.` : "Configure um novo agente para suas tarefas."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto"> {/* Scrollable area for tabs */}
          <Tabs defaultValue="general" className="w-full p-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-8 mb-4 sticky top-0 bg-background z-10">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="behavior">Comportamento</TabsTrigger>
              <TabsTrigger value="tools">Ferramentas</TabsTrigger>
              <TabsTrigger value="memory">Estado & Memória</TabsTrigger>
              <TabsTrigger value="rag">RAG</TabsTrigger>
              <TabsTrigger value="artifacts">Artefatos</TabsTrigger>
              <TabsTrigger value="multiAgent">Multi-Agente</TabsTrigger>
              <TabsTrigger value="advanced">Avançado/A2A</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="agentName">Nome do Agente</Label>
                  <Input id="agentName" placeholder="Ex: Agente de Pesquisa Avançada" value={agentName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgentName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentVersion">Versão</Label>
                  <Input id="agentVersion" placeholder="Ex: 1.0.1" value={agentVersion} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgentVersion(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentDescription">Descrição do Agente</Label>
                <Textarea id="agentDescription" placeholder="Descreva o propósito principal, capacidades e limitações do agente." value={agentDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAgentDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="selectedAgentType">Tipo de Agente</Label>
                  <Select value={selectedAgentType} onValueChange={(value: "llm" | "workflow" | "custom" | "a2a") => setSelectedAgentType(value)}>
                    <SelectTrigger id="selectedAgentType">
                      <SelectValue placeholder="Selecione o tipo de agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentTypeOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.icon && React.cloneElement(option.icon as React.ReactElement, { className: "inline-block mr-2 h-4 w-4" })}
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                   <p className="text-xs text-muted-foreground">{agentTypeOptions.find(opt => opt.id === selectedAgentType)?.description}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentFramework">Framework do Agente</Label>
                  <Select value={agentFramework} onValueChange={(value) => setAgentFramework(value as AgentFramework)}>
                    <SelectTrigger id="agentFramework">
                      <SelectValue placeholder="Selecione o framework" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentFrameworkOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-6 mt-4">
              {/* Global Instruction */}
              <div className="space-y-2">
                <Label htmlFor="globalInstruction">Instrução Global / Prompt do Sistema Primário</Label>
                <Textarea
                  id="globalInstruction"
                  placeholder="Defina o comportamento central, persona ou prompt de sistema principal para o agente. Isso se aplica a todos os tipos de agente como uma instrução de alto nível."
                  value={globalInstruction}
                  onChange={(e) => setGlobalInstruction(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Para agentes LLM, isso pode ser o início do prompt do sistema. Para outros, uma diretriz geral.
                </p>
              </div>
              <Separator />

              {/* LLM Specific Fields */}
              {selectedAgentType === 'llm' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="agentGoal">Objetivo do Agente (LLM)</Label>
                      <Textarea id="agentGoal" placeholder="Descreva o objetivo principal que o agente LLM deve alcançar." value={agentGoal} onChange={(e) => setAgentGoal(e.target.value)} rows={3}/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agentPersonality">Personalidade/Tom (LLM)</Label>
                      <Select value={agentPersonality} onValueChange={setAgentPersonality}>
                        <SelectTrigger id="agentPersonality">
                          <SelectValue placeholder="Selecione a personalidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {agentToneOptions.map(option => (
                            <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agentTasks">Tarefas Principais (LLM)</Label>
                    <Textarea
                      id="agentTasks"
                      placeholder="Liste as tarefas principais que o agente deve executar. Uma tarefa por linha."
                      value={agentTasks.join("\n")}
                      onChange={(e) => setAgentTasks(e.target.value.split("\n"))}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agentRestrictions">Restrições (LLM)</Label>
                    <Textarea
                      id="agentRestrictions"
                      placeholder="Liste quaisquer restrições ou comportamentos que o agente deve evitar. Uma restrição por linha."
                      value={agentRestrictions.join("\n")}
                      onChange={(e) => setAgentRestrictions(e.target.value.split("\n"))}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="agentModel">Modelo de Linguagem (LLM)</Label>
                      <Input id="agentModel" placeholder="Ex: gemini-1.5-pro-latest" value={agentModel} onChange={(e) => setAgentModel(e.target.value)} />
                       <p className="text-xs text-muted-foreground">Especifique o identificador do modelo LLM a ser usado.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agentTemperature">Temperatura (LLM) - <Badge variant="outline" className="text-xs">{agentTemperature.toFixed(1)}</Badge></Label>
                      <Slider
                        id="agentTemperature"
                        min={0} max={1} step={0.1}
                        value={[agentTemperature]}
                        onValueChange={(value) => setAgentTemperature(value[0])}
                      />
                      <p className="text-xs text-muted-foreground">
                        Controla a criatividade/aleatoriedade das respostas (0=determinístico, 1=máximo).
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="systemPromptGenerated">Prompt do Sistema Gerado (LLM Preview)</Label>
                    <Textarea
                      id="systemPromptGenerated"
                      readOnly
                      value={systemPromptGenerated || "O prompt do sistema será gerado/mostrado aqui com base nas configurações."}
                      rows={5}
                      className="bg-muted/40"
                    />
                     <p className="text-xs text-muted-foreground">Este é um preview (pode ser editável no futuro ou com um botão 'customizar').</p>
                  </div>
                </>
              )}

              {/* Workflow Specific Fields */}
              {selectedAgentType === 'workflow' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="detailedWorkflowType">Tipo de Workflow</Label>
                    <Select 
                      value={detailedWorkflowType} 
                      onValueChange={(value: "sequential" | "graph" | "stateMachine") => setDetailedWorkflowType(value)}
                    >
                      <SelectTrigger id="detailedWorkflowType">
                        <SelectValue placeholder="Selecione o tipo de workflow" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequential">Sequencial</SelectItem>
                        <SelectItem value="graph">Grafo de Tarefas</SelectItem>
                        <SelectItem value="stateMachine">Máquina de Estados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workflowDescription">Descrição do Workflow</Label>
                    <Textarea id="workflowDescription" placeholder="Descreva o objetivo e os passos gerais do workflow." value={workflowDescription} onChange={(e) => setWorkflowDescription(e.target.value)} rows={3}/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loopMaxIterations">Máximo de Iterações (para workflows com loops)</Label>
                    <Input id="loopMaxIterations" type="number" value={loopMaxIterations === undefined ? "" : String(loopMaxIterations)} onChange={(e) => setLoopMaxIterations(e.target.value === "" ? undefined : Number(e.target.value))} placeholder="Opcional"/>
                  </div>
                  {/* Adicionar mais campos específicos para workflow aqui, como definição de passos/tarefas do workflow */}
                </>
              )}

              {/* Custom Logic Specific Fields */}
              {selectedAgentType === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customLogicDescription">Descrição da Lógica Customizada</Label>
                  <Textarea id="customLogicDescription" placeholder="Descreva a lógica customizada que este agente irá executar. Pode incluir referências a scripts ou módulos externos." value={customLogicDescription} onChange={(e) => setCustomLogicDescription(e.target.value)} rows={5}/>
                </div>
              )}
               {selectedAgentType === 'a2a' && (
                <Alert>
                  <Waypoints className="h-4 w-4" />
                  <AlertTitle>Agente de Comunicação (A2A)</AlertTitle>
                  <AlertDescription>
                    Este tipo de agente é especializado em facilitar a comunicação e coordenação entre outros agentes.
                    Configure os canais de comunicação e protocolos na aba 'Avançado/A2A'.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            <TabsContent value="tools" className="space-y-6 mt-4">
              <Alert>
                <Wand2 className="h-4 w-4" />
                <AlertTitle>Gerenciamento de Ferramentas</AlertTitle>
                <AlertDescription>
                  Selecione as ferramentas que este agente poderá utilizar. Algumas ferramentas podem requerer configuração adicional.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTools.map((tool) => (
                  <Card key={tool.id} className={cn("flex flex-col justify-between", selectedTools.includes(tool.id) ? "border-primary" : "")}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        {tool.name}
                        <Checkbox
                          id={`tool-${tool.id}`}
                          checked={selectedTools.includes(tool.id)}
                          onCheckedChange={(checked) => {
                            setSelectedTools((prev: string[]) =>
                              checked ? [...prev, tool.id] : prev.filter(id => id !== tool.id)
                            );
                          }}
                        />
                      </CardTitle>
                      {tool.icon ? 
                        (() => {
                          const IconComponent = iconComponents[tool.icon as string] || Wand2;
                          return <IconComponent className="h-6 w-6 mb-2 text-primary" />;
                        })() : 
                        <Wand2 className="h-5 w-5 text-muted-foreground" />
                      }
                      <CardDescription className="text-xs">{tool.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      {tool.hasConfig ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToolConfigure(tool)}
                          disabled={!selectedTools.includes(tool.id)}
                          className="w-full"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Configurar
                          {toolConfigurations[tool.id] && Object.keys(toolConfigurations[tool.id]).length > 0 && (
                             <Check className="ml-2 h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Não requer configuração.</p>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {availableTools.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">Nenhuma ferramenta disponível no momento.</p>
              )}
            </TabsContent>
            <TabsContent value="memory" className="space-y-6 mt-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>Estado e Memória do Agente</AlertTitle>
                <AlertDescription>
                  Configure como o agente deve persistir seu estado interno e gerenciar a memória de curto e longo prazo.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Persistência de Estado</CardTitle>
                  <CardDescription>Controla se e como o agente salva seu estado entre execuções ou sessões.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableStatePersistence"
                      checked={enableStatePersistence}
                      onCheckedChange={setEnableStatePersistence}
                    />
                    <Label htmlFor="enableStatePersistence" className="text-base">Habilitar Persistência de Estado</Label>
                  </div>

                  {enableStatePersistence && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="statePersistenceType">Tipo de Persistência</Label>
                        <Select value={statePersistenceType} onValueChange={setStatePersistenceType}>
                          <SelectTrigger id="statePersistenceType">
                            <SelectValue placeholder="Selecione o tipo de persistência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="session">Sessão (Temporária, por aba/conexão)</SelectItem>
                            <SelectItem value="memory">Memória (Durante a vida do processo)</SelectItem>
                            <SelectItem value="database">Banco de Dados (Persistente)</SelectItem>
                            {/* <SelectItem value="file">Arquivo Local</SelectItem> */}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {statePersistenceType === 'session' && "O estado é perdido quando a sessão do usuário termina."}
                          {statePersistenceType === 'memory' && "O estado persiste enquanto o agente/aplicação está em execução."}
                          {statePersistenceType === 'database' && "Requer configuração de banco de dados para persistência robusta."}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="initialStateValues">Valores Iniciais do Estado (JSON)</Label>
                        <Textarea
                          id="initialStateValues"
                          placeholder='[{"key": "exemploChave", "value": "exemploValor"}, {"key": "outraChave", "value": "123"}]'
                          value={JSON.stringify(initialStateValues, null, 2)}
                          onChange={(e) => {
                            try {
                              const val = e.target.value.trim();
                              if (!val) { setInitialStateValues([]); return; }
                              const parsed = JSON.parse(val);
                              if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && 'key' in item && 'value' in item)) {
                                setInitialStateValues(parsed);
                              } else {
                                console.warn("Formato JSON inválido para valores iniciais do estado.");
                                toast({variant: "destructive", title: "JSON Inválido", description: "O formato para Valores Iniciais deve ser um array de objetos com 'key' e 'value'."})
                              }
                            } catch (error) {
                              console.error("Erro ao parsear JSON dos valores iniciais:", error);
                               toast({variant: "destructive", title: "Erro no JSON", description: "Verifique a sintaxe do JSON para Valores Iniciais."})
                            }
                          }}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          Defina um array de objetos chave-valor para o estado inicial do agente.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="rag" className="space-y-6 mt-4">
              <Alert>
                <FileJson className="h-4 w-4" />
                <AlertTitle>RAG - Retrieval Augmented Generation</AlertTitle>
                <AlertDescription>
                  Habilite e configure o RAG para permitir que o agente consulte bases de conhecimento externas para enriquecer suas respostas.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Configuração do RAG</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableRAG"
                      checked={enableRAG}
                      onCheckedChange={setEnableRAG}
                    />
                    <Label htmlFor="enableRAG" className="text-base">Habilitar RAG</Label>
                  </div>

                  {enableRAG && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="ragServiceType">Serviço de Busca/Vetorização</Label>
                          <Select
                            value={ragMemoryConfig.serviceType || "vertexAISearch" as MemoryServiceType}
                            onValueChange={(value) => setRagMemoryConfig((prev: RagMemoryConfig) => ({...prev, serviceType: value as MemoryServiceType}))}
                          >
                            <SelectTrigger id="ragServiceType">
                              <SelectValue placeholder="Selecione o serviço" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vertexAISearch">Vertex AI Search & Conversation</SelectItem>
                              <SelectItem value="pinecone">Pinecone</SelectItem>
                              <SelectItem value="localFaiss">FAISS Local</SelectItem>
                              <SelectItem value="googleSearch">Google Custom Search (para RAG simples)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        { (ragMemoryConfig.serviceType === "vertexAISearch") && // Condition updated to be Vertex AI Search specific
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="ragProjectId">ID do Projeto Cloud (Vertex AI)</Label> {/* Label updated for clarity */}
                              <Input
                                id="ragProjectId"
                                placeholder="Seu ID do projeto GCP ou similar"
                                value={ragMemoryConfig.vertexAISearchConfig?.projectId || ""}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  setRagMemoryConfig((prev) => ({
                                    ...prev,
                                    vertexAISearchConfig: {
                                      ...(prev.vertexAISearchConfig || {}),
                                      projectId: newValue,
                                    },
                                  }));
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ragLocation">Localização (Região)</Label>
                              <Input
                                id="ragLocation"
                                placeholder="Ex: us-central1"
                                value={ragMemoryConfig.vertexAISearchConfig?.location || ""}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  setRagMemoryConfig((prev) => ({
                                    ...prev,
                                    vertexAISearchConfig: {
                                      ...(prev.vertexAISearchConfig || {}),
                                      location: newValue,
                                    },
                                  }));
                          <Input
                            id="vertexDataStoreId"
                            placeholder="ID do seu DataStore no Vertex AI Search"
                            value={ragMemoryConfig.vertexAISearchConfig?.dataStoreId || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setRagMemoryConfig((prev) => ({
                                ...prev,
                                vertexAISearchConfig: { ...(prev.vertexAISearchConfig || {}), dataStoreId: newValue },
                              }));
                            }}
                          />
                        </div>
                      )}
                      {ragMemoryConfig.serviceType === 'pinecone' && (
                        <div className="space-y-2">
                          <Label htmlFor="pineconeIndexName">Nome do Índice (Pinecone)</Label>
                          <Input
                            id="pineconeIndexName"
                            placeholder="Nome do seu índice no Pinecone"
                            value={ragMemoryConfig.pineconeConfig?.indexName || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setRagMemoryConfig((prev) => ({
                                ...prev,
                                pineconeConfig: { ...(prev.pineconeConfig || {}), indexName: newValue },
                              }));
                            }}
                            id="ragSimilarityTopK"
                            type="number"
                            value={String(ragMemoryConfig.similarityTopK || 5)}
                            onChange={(e) => setRagMemoryConfig((prev: RagMemoryConfig) => ({...prev, similarityTopK: parseInt(e.target.value, 10) || 5}))}
                          />
                          <p className="text-xs text-muted-foreground">Número de resultados mais similares a serem recuperados.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ragVectorDistanceThreshold">Limiar de Distância Vetorial - <Badge variant="outline" className="text-xs">{(ragMemoryConfig.vectorDistanceThreshold || 0.5).toFixed(2)}</Badge></Label>
                           <Slider
                            id="ragVectorDistanceThreshold"
                            min={0} max={1} step={0.05}
                            value={[ragMemoryConfig.vectorDistanceThreshold || 0.5]}
                            onValueChange={(value) => setRagMemoryConfig((prev: RagMemoryConfig) => ({...prev, vectorDistanceThreshold: value[0]}))}
                          />
                          <p className="text-xs text-muted-foreground">Distância máxima para considerar um resultado relevante (0 a 1).</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ragKnowledgeSources">Fontes de Conhecimento (JSON)</Label>
                        <Textarea
                          id="ragKnowledgeSources"
                          placeholder='[{"type": "web_url", "content": "https://example.com/faq"}, {"type": "gcs_uri", "content": "gs://bucket/doc.pdf"}]'
                          value={JSON.stringify(ragMemoryConfig.knowledgeSources || [], null, 2)}
                          onChange={(e) => {
                            try {
                              const val = e.target.value.trim();
                              if(!val) { setRagMemoryConfig((prev: RagMemoryConfig) => ({...prev, knowledgeSources: []})); return; }
                              const parsed = JSON.parse(val);
                              setRagMemoryConfig((prev: RagMemoryConfig) => ({...prev, knowledgeSources: parsed}));
                            } catch (error) {
                              console.error("Erro ao parsear JSON das fontes de conhecimento:", error);
                              toast({variant: "destructive", title: "Erro no JSON", description: "Verifique Fontes de Conhecimento."})
                            }
                          }}
                          rows={5}
                        />
                        <p className="text-xs text-muted-foreground">
                          Array de objetos especificando as fontes (ex: URLs, URIs GCS) para indexação no RAG.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="artifacts" className="space-y-6 mt-4">
              <Alert>
                <UploadCloud className="h-4 w-4" />
                <AlertTitle>Gerenciamento de Artefatos</AlertTitle>
                <AlertDescription>
                  Configure como o agente irá armazenar e gerenciar arquivos e outros artefatos que ele pode criar ou utilizar.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Armazenamento de Artefatos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableArtifacts"
                      checked={enableArtifacts}
                      onCheckedChange={setEnableArtifacts}
                    />
                    <Label htmlFor="enableArtifacts" className="text-base">Habilitar Armazenamento de Artefatos</Label>
                  </div>

                  {enableArtifacts && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="artifactStorageType">Tipo de Armazenamento</Label>
                        <Select value={artifactStorageType} onValueChange={(value: 'memory' | 'local' | 'cloud') => setArtifactStorageType(value)}>
                          <SelectTrigger id="artifactStorageType">
                            <SelectValue placeholder="Selecione o tipo de armazenamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="memory">Memória (Temporário)</SelectItem>
                            <SelectItem value="local">Sistema de Arquivos Local</SelectItem>
                            <SelectItem value="cloud">Nuvem (Ex: Google Cloud Storage)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {artifactStorageType === 'local' && (
                        <div className="space-y-2">
                          <Label htmlFor="localStoragePath">Caminho de Armazenamento Local</Label>
                          <Input
                            id="localStoragePath"
                            placeholder="./agent_artifacts"
                            value={localStoragePath}
                            onChange={(e) => setLocalStoragePath(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Caminho no sistema de arquivos local onde os artefatos serão salvos.
                          </p>
                        </div>
                      )}

                      {artifactStorageType === 'cloud' && (
                        <div className="space-y-2">
                          <Label htmlFor="cloudStorageBucket">Nome do Bucket de Armazenamento na Nuvem</Label>
                          <Input
                            id="cloudStorageBucket"
                            placeholder="Ex: meu-bucket-de-artefatos"
                            value={cloudStorageBucket}
                            onChange={(e) => setCloudStorageBucket(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Nome do bucket no provedor de nuvem (ex: GCS, S3) para armazenar os artefatos.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="multiAgent" className="space-y-6 mt-4">
              <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>Configurações Multi-Agente</AlertTitle>
                <AlertDescription>
                  Defina o papel deste agente em um sistema com múltiplos agentes e suas relações com outros agentes.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Hierarquia e Colaboração</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isRootAgent"
                      checked={isRootAgent}
                      onCheckedChange={setIsRootAgent}
                    />
                    <Label htmlFor="isRootAgent" className="text-base">Agente Raiz / Orquestrador</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Marque se este agente é o principal ponto de entrada ou o orquestrador em uma equipe de agentes.
                    Agentes não-raiz são tipicamente especialistas invocados por um agente raiz.
                  </p>
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="subAgentIds">IDs dos Sub-Agentes / Colaboradores</Label>
                    { availableAgentsForSubSelector && availableAgentsForSubSelector.length > 0 ? (
                       <SubAgentSelector
                        availableAgents={availableAgentsForSubSelector}
                        selectedAgents={subAgentIds}
                        onChange={setSubAgentIds}
                        disabled={false}
                      />
                    ) : (
                      <Textarea
                        id="subAgentIds"
                        placeholder="Insira IDs de sub-agentes, separados por vírgula. Nenhum outro agente salvo disponível para seleção."
                        value={subAgentIds.join(",")}
                        onChange={(e) => setSubAgentIds(e.target.value.split(",").map(id => id.trim()).filter(id => id))}
                        rows={3}
                        disabled={!(availableAgentsForSubSelector && availableAgentsForSubSelector.length > 0)}
                      />
                    )}
                     <p className="text-xs text-muted-foreground">
                      Liste os IDs dos agentes que este agente pode invocar, delegar tarefas ou colaborar.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="advanced" className="space-y-6 mt-4">
              <Alert>
                <Settings2 className="h-4 w-4" />
                <AlertTitle>Configurações Avançadas e A2A</AlertTitle>
                <AlertDescription>
                  Defina configurações de baixo nível, comunicação entre agentes (A2A) e outros parâmetros avançados.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Comunicação Agente-Agente (A2A)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="a2aEnabled"
                      checked={a2aConfig.enabled || false}
                      onCheckedChange={(checked) => setA2aConfig((prev: A2AConfig) => ({...prev, enabled: !!checked}))}
                    />
                    <Label htmlFor="a2aEnabled" className="text-base">Habilitar Comunicação A2A</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Permite que este agente envie e receba mensagens de outros agentes diretamente.
                  </p>

                  {a2aConfig.enabled && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="a2aCommunicationChannels">Canais de Comunicação A2A (JSON)</Label>
                      <Textarea
                        id="a2aCommunicationChannels"
                        placeholder={`[
  {"type": "direct", "targetAgentId": "outro_agente_id", "protocol": "http", "endpoint": "https://..."},
  {"type": "message_queue", "topic": "tarefas_agentes", "brokerUrl": "amqp://..."}
]`}
                        value={JSON.stringify(a2aConfig.communicationChannels || [], null, 2)}
                        onChange={(e) => {
                          try {
                            const val = e.target.value.trim();
                            if(!val) { setA2aConfig((prev: A2AConfig) => ({...prev, communicationChannels: []})); return; }
                            const parsedChannels = JSON.parse(val);
                            setA2aConfig((prev: A2AConfig) => ({...prev, communicationChannels: parsedChannels}));
                          } catch (error) {
                            console.error("Erro ao parsear JSON dos canais A2A:", error);
                            toast({variant: "destructive", title: "Erro no JSON", description: "Formato inválido para canais A2A."})
                          }
                        }}
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Defina os canais, protocolos e configurações para comunicação com outros agentes.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-muted-foreground/70">Outras Configurações Avançadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configurações adicionais como timeouts específicos, políticas de retry, headers customizados para chamadas externas, etc., serão configuráveis aqui em futuras versões.
                  </p>
                </CardContent>
              </Card>

            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSaveAgent}><Save className="mr-2 h-4 w-4" /> Salvar Agente</Button>
        </DialogFooter>

        {isToolConfigModalOpen && configuringTool && (
           <Dialog open={isToolConfigModalOpen} onOpenChange={(open) => { if (!open) { setIsToolConfigModalOpen(false); setConfiguringTool(null); }}}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configurar Ferramenta: {configuringTool.name}</DialogTitle>
                <DialogDescription>{configuringTool.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                {configuringTool.id === "webSearch" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="modalGoogleApiKey">Chave API Google</Label>
                    <Input id="modalGoogleApiKey" value={modalGoogleApiKey} onChange={(e) => setModalGoogleApiKey(e.target.value)} placeholder="ex: AIzaSy..."/>
                    <p className="text-xs text-muted-foreground">Chave de API do Google (Custom Search API) para busca na web.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modalGoogleCseId">ID do Mecanismo de Busca</Label>
                    <Input id="modalGoogleCseId" value={modalGoogleCseId} onChange={(e) => setModalGoogleCseId(e.target.value)} placeholder="ex: 0123456789abcdefg"/>
                    <p className="text-xs text-muted-foreground">ID do Mecanismo de Busca Personalizado (CSE ID).</p>
                  </div>
                </>
              )}
              {configuringTool.id === "customApiIntegration" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="modalOpenapiSpecUrl">URL Esquema OpenAPI (JSON/YAML)</Label>
                    <Input id="modalOpenapiSpecUrl" value={modalOpenapiSpecUrl} onChange={(e) => setModalOpenapiSpecUrl(e.target.value)} placeholder="ex: https://petstore.swagger.io/v2/swagger.json"/>
                    <p className="text-xs text-muted-foreground">Link para especificação da API.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modalOpenapiApiKey">Chave API Externa (Opcional)</Label>
                    <Input id="modalOpenapiApiKey" value={modalOpenapiApiKey} onChange={(e) => setModalOpenapiApiKey(e.target.value)} placeholder="Se a API requer autenticação" type="password"/>
                    <p className="text-xs text-muted-foreground">Chave de API para autenticação no serviço externo.</p>
                  </div>
                </>
              )}
              {configuringTool.id === "databaseAccess" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="modalDbType">Tipo de Banco</Label>
                    <Select value={modalDbType} onValueChange={setModalDbType}>
                      <SelectTrigger id="modalDbType">
                        <SelectValue placeholder="Selecione o tipo de banco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="sqlserver">SQL Server</SelectItem>
                        <SelectItem value="sqlite">SQLite</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(modalDbType && modalDbType !== 'other' && modalDbType !== 'sqlite') && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="modalDbHost">Host</Label>
                          <Input id="modalDbHost" value={modalDbHost} onChange={(e) => setModalDbHost(e.target.value)} placeholder="ex: localhost"/>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="modalDbPort">Porta</Label>
                          <Input id="modalDbPort" type="number" value={String(modalDbPort)} onChange={(e) => setModalDbPort(Number(e.target.value))} placeholder="ex: 5432"/>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modalDbName">Nome Banco</Label>
                        <Input id="modalDbName" value={modalDbName} onChange={(e) => setModalDbName(e.target.value)} placeholder="ex: meu_banco"/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="modalDbUser">Usuário</Label>
                          <Input id="modalDbUser" value={modalDbUser} onChange={(e) => setModalDbUser(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="modalDbPassword">Senha</Label>
                          <Input id="modalDbPassword" type="password" value={modalDbPassword} onChange={(e) => setModalDbPassword(e.target.value)} />
                        </div>
                      </div>
                    </>
                  )}
                  {(modalDbType === 'other' || modalDbType === 'sqlite') && (
                    <div className="space-y-2">
                      <Label htmlFor="modalDbConnectionString">String Conexão/Caminho</Label>
                      <Input id="modalDbConnectionString" value={modalDbConnectionString} onChange={(e) => setModalDbConnectionString(e.target.value)} placeholder={modalDbType === 'sqlite' ? "ex: /path/to/db.sqlite" : "driver://user:pass@host/db"}/>
                      <p className="text-xs text-muted-foreground">{modalDbType === 'sqlite' ? 'Caminho para arquivo SQLite.' : 'String de conexão completa.'}</p>
                    </div>
                  )}
                   <div className="space-y-2">
                    <Label htmlFor="modalDbDescription">Descrição Banco/Tabelas (Opcional)</Label>
                    <Textarea id="modalDbDescription" value={modalDbDescription} onChange={(e) => setModalDbDescription(e.target.value)} placeholder="Ex: Tabela 'usuarios' com colunas id, nome, email. Tabela 'pedidos' com id, usuario_id, produto, quantidade, preco." rows={3}/>
                    <p className="text-xs text-muted-foreground">Ajuda o agente a entender o contexto do banco de dados e a formular queries.</p>
                  </div>
                </>
              )}
              {configuringTool.id === "knowledgeBase" && (
                <div className="space-y-2">
                  <Label htmlFor="modalKnowledgeBaseId">ID/Nome Base Conhecimento</Label>
                  <Input id="modalKnowledgeBaseId" value={modalKnowledgeBaseId} onChange={(e) => setModalKnowledgeBaseId(e.target.value)} placeholder="ex: docs_produto_xyz"/>
                  <p className="text-xs text-muted-foreground">Identificador único para a base de conhecimento a ser utilizada (RAG).</p>
                </div>
              )}
              {configuringTool.id === "calendarAccess" && (
                <div className="space-y-2">
                  <Label htmlFor="modalCalendarApiEndpoint">Endpoint API Calendário / ID Fluxo Genkit</Label>
                  <Input id="modalCalendarApiEndpoint" value={modalCalendarApiEndpoint} onChange={(e) => setModalCalendarApiEndpoint(e.target.value)} placeholder="ex: https://api.example.com/calendar ou meuFluxoCalendario"/>
                  <p className="text-xs text-muted-foreground">URL da API ou ID do fluxo Genkit para acesso à agenda.</p>
                </div>
              )}
              </div>
              <DialogFooter>
                 <Button variant="outline" onClick={() => { setIsToolConfigModalOpen(false); setConfiguringTool(null);}}>Cancelar</Button>
                 <Button onClick={handleSaveToolConfiguration}>Salvar Configuração da Ferramenta</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AgentBuilderDialog;
