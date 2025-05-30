"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAgents } from '@/contexts/AgentsContext';
import { cn } from "@/lib/utils";
import type { ClassValue } from 'clsx';

// Import page-specific types
import type { 
  SavedAgentConfiguration as ImportedPageSavedAgentConfiguration,
  AvailableTool as ImportedPageAvailableTool,
  AgentConfigBase,
  LLMAgentConfig,
  WorkflowAgentConfig,
  CustomAgentConfig,
  AgentConfig as PageAgentConfig,
  ToolConfigData as PageToolConfigData
} from '@/app/agent-builder/page';

// Import shared types
import type { 
  SavedAgentConfiguration,
  A2AAgentConfig,
  AvailableTool,
  ToolConfigData as SharedToolConfigData
} from '@/types/agent-types';

import { type MemoryServiceType } from '@/components/features/agent-builder/memory-knowledge-tab';

// Type conversion helper
const mapToPageAgentConfig = (agent: SavedAgentConfiguration): PageSavedAgentConfiguration => {
  return {
    ...agent,
    toolsDetails: (agent.toolsDetails || []).map(tool => {
      // Handle both the original AvailableTool and the page-specific tool format
      const toolName = typeof tool === 'object' && tool !== null 
        ? (tool as any).name || (tool as any).label || (tool as any).id 
        : String(tool);
        
      return {
        id: (tool as any).id || String(tool),
        label: toolName,
        iconName: (tool as any).iconName || undefined,
        needsConfiguration: (tool as any).needsConfiguration || (tool as any).hasConfig || false,
        genkitToolName: (tool as any).genkitToolName,
      };
    }),
  };
};

interface AgentBuilderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingAgent: PageSavedAgentConfiguration | null;
  onSave: (agentConfig: PageSavedAgentConfiguration) => void;
  availableTools: PageAvailableTool[];
  agentTypeOptions: Array<{ 
    id: AgentType; 
    label: string; 
    icon?: React.ReactNode; 
    description: string 
  }>;
  agentToneOptions: Array<{ 
    id: string;
    label: string;
    description?: string;
  }>;
  iconComponents: Record<string, React.ComponentType<any>>;
}

// Define local types for compatibility
type BaseAgentType = 'llm' | 'workflow' | 'custom' | 'a2a';
type AgentType = 'llm' | 'workflow' | 'sequential' | 'parallel' | 'loop' | 'custom' | 'a2a';

// Define LoopTerminationCondition as a type to avoid duplicates
type LoopTerminationCondition = 'tool' | 'state' | 'none'; // Simplified to only include valid values

// Define RAG configuration type
interface RagMemoryConfig {
  enabled: boolean;
  serviceType: 'in-memory' | 'vector-db' | 'hybrid';
  similarityTopK: number;
  vectorDistanceThreshold: number;
  embeddingModel: string;
  knowledgeSources: Array<{
    type: 'text' | 'url' | 'file' | 'database';
    content: string;
    metadata?: Record<string, any>;
  }>;
  includeConversationContext: boolean;
  persistentMemory: boolean;
}

// Define Artifact type
interface ArtifactDefinition {
  id: string;
  name: string;
  type: 'file' | 'data' | 'image' | 'document';
  description: string;
  storagePath: string;
  metadata?: Record<string, any>;
}

// Define A2A Configuration type
interface A2AConfigType {
  enabled: boolean;
  communicationChannels: Array<{
    id: string;
    type: 'http' | 'websocket' | 'grpc' | 'message-queue';
    endpoint: string;
    config: Record<string, any>;
  }>;
  defaultResponseFormat: 'json' | 'xml' | 'text' | 'binary';
  maxMessageSize: number;
  loggingEnabled: boolean;
}

// Define Tool Configuration type
interface ToolConfigData {
  [key: string]: any;
  apiKey?: string;
  apiEndpoint?: string;
  isConfigured?: boolean;
  // Add other tool-specific configuration properties as needed
}

// Helper type to map between agent types and their configs
type AgentConfigMap = {
  llm: LLMAgentConfig;
  workflow: WorkflowAgentConfig;
  sequential: WorkflowAgentConfig;
  parallel: WorkflowAgentConfig;
  loop: WorkflowAgentConfig;
  custom: CustomAgentConfig;
  a2a: A2AAgentConfig;
};

// Type for the page-specific AvailableTool
type PageAvailableTool = ImportedPageAvailableTool;

// Type for the saved agent configuration in the page component
type PageSavedAgentConfiguration = ImportedPageSavedAgentConfiguration;

// Type guard to check if a string is a valid AgentType
const isAgentType = (type: string): type is AgentType => {
  return ['llm', 'workflow', 'sequential', 'parallel', 'loop', 'custom', 'a2a'].includes(type);
};

// Helper functions for tool configuration
// Helper function to safely get tool property
const getToolProperty = <T,>(tool: PageAvailableTool | undefined, prop: keyof PageAvailableTool, defaultValue: T): T => {
  return tool ? (tool[prop] as T) ?? defaultValue : defaultValue;
};

// Helper function to safely convert unknown values to ReactNode
const safeToReactNode = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (React.isValidElement(value)) {
    return value;
  }
  // For objects and arrays, convert to string representation
  try {
    return JSON.stringify(value, null, 2);
  } catch (e) {
    return String(value);
  }
};

// Helper function to convert AgentType to BaseAgentType
const toBaseAgentType = (type: AgentType): 'llm' | 'workflow' | 'custom' => {
  // Map workflow types to 'workflow'
  if (['sequential', 'parallel', 'loop', 'workflow'].includes(type)) {
    return 'workflow';
  }
  // Map 'a2a' to 'custom' for compatibility
  if (type === 'a2a') {
    return 'custom';
  }
  // Default to 'llm' if the type is not recognized
  return type === 'llm' || type === 'custom' ? type : 'llm';
};

// Utility function to safely access tool properties and return ReactNode
const getToolDisplayName = (tool: PageAvailableTool): React.ReactNode => {
  return tool?.name || tool?.label || tool?.id || 'Unknown Tool';
};

const getToolDescription = (tool: PageAvailableTool): React.ReactNode => {
  return tool?.description || 'No description available';
};

const getNeedsConfiguration = (tool: PageAvailableTool): boolean => {
  return tool?.needsConfiguration || tool?.hasConfig || false;
};

const getToolGenkitName = (tool: PageAvailableTool): string | undefined => {
  return tool?.genkitToolName;
};

const getToolIconName = (tool: PageAvailableTool): string | undefined => {
  if (!tool?.icon) return undefined;
  
  const icon = tool.icon as any;
  return icon.displayName || icon.name || 'Default';
};

export default function AgentBuilderDialog({
  isOpen,
  onOpenChange,
  editingAgent,
  onSave,
  availableTools = [],
  agentTypeOptions = [],
  agentToneOptions = [],
  iconComponents = {}
}: AgentBuilderDialogProps) {
  const { toast } = useToast();
  const { saveAgent } = useAgents();

  // Agent configuration state
  const [agentName, setAgentName] = React.useState(editingAgent?.agentName || "");
  const [agentDescription, setAgentDescription] = React.useState(editingAgent?.agentDescription || "");
  const [selectedAgentType, setSelectedAgentType] = React.useState<AgentType>('llm');
  const [selectedTone, setSelectedTone] = React.useState('professional');
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false);
  const [configuringTool, setConfiguringTool] = React.useState<string[]>(editingAgent?.agentTools || []);
  const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, any>>({});
  const [llmConfig, setLlmConfig] = React.useState({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2048,
  });
  const [workflowDescription, setWorkflowDescription] = React.useState('');
  const [ragMemoryConfig, setRagMemoryConfig] = React.useState<RagMemoryConfig>({
    enabled: false,
    collectionName: '',
    maxResults: 5,
    minRelevanceScore: 0.7,
  });
  const [a2aConfig, setA2AConfig] = React.useState<A2AConfigType>(editingAgent?.a2aConfig || { enabled: false, communicationChannels: [], defaultResponseFormat: 'json', loggingEnabled: false, maxMessageSize: 1024 * 1024 });
  const [artifacts, setArtifacts] = React.useState<ArtifactDefinition[]>([]);
  const [activeTab, setActiveTab] = React.useState('general');
  const [isSaving, setIsSaving] = React.useState(false);

  // Derived state
  const currentAgentTools = React.useMemo(() => {
    return availableTools.filter(tool => 
      editingAgent?.tools?.some(t => t.toolId === tool.id)
    );
  }, [availableTools, editingAgent?.tools]);

  // Update state when editingAgent changes
  React.useEffect(() => {
    if (editingAgent) {
      setAgentName(editingAgent.agentName || "");
      setAgentDescription(editingAgent.agentDescription || "");
      setSelectedAgentType(editingAgent.agentType as AgentType);
      // Update other states based on editingAgent
    }
  }, [editingAgent]);

  // Handle tool configuration
  const handleToolConfigure = (tool: PageAvailableTool) => {
    setConfiguringTool(tool);
    setIsToolConfigModalOpen(true);
  };

  const handleSaveToolConfig = (config: any) => {
    if (configuringTool) {
      setToolConfigurations(prev => ({
        ...prev,
        [configuringTool.id]: config
      }));
      setIsToolConfigModalOpen(false);
      setConfiguringTool(null);
      
      toast({
        title: "Tool configured",
        description: `${configuringTool.name} has been configured.`,
      });
    }
  };

  // Handle form submission
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const agentConfig: AgentConfigBase = {
        id: editingAgent?.id || `agent-${Date.now()}`,
        agentName: agentName,
        agentDescription: agentDescription,
        agentType: selectedAgentType,
        createdAt: editingAgent?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tools: currentAgentTools.map(tool => ({
          toolId: tool.id,
          configuration: toolConfigurations[tool.id] || {}
        })),
        ragMemory: ragMemoryConfig,
        a2aConfig,
      };

      await saveAgent(agentConfig);
      onSave?.(agentConfig);
      
      toast({
        title: "Agent saved",
        description: `${agentName} has been saved successfully.`,
      });
      
      onOpenChange?.(false);
    } catch (error) {
      console.error("Failed to save agent:", error);
      toast({
        title: "Error",
        description: "Failed to save agent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Form state
  const [agentName, setAgentName] = React.useState(editingAgent?.agentName || '');
  const [agentDescription, setAgentDescription] = React.useState(editingAgent?.agentDescription || '');
  const [selectedAgentType, setSelectedAgentType] = React.useState<AgentType>(editingAgent?.agentType || 'llm');
  const [selectedTone, setSelectedTone] = React.useState(editingAgent?.agentPersonality || (agentToneOptions.length > 0 ? agentToneOptions[0].label : ""));
  
  // Tool configuration state
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false);
  // Agent configuration state
  const [llmConfig, setLlmConfig] = React.useState<LLMAgentConfig>(
    editingAgent?.agentType === 'llm' ? { ...defaultLLMConfigValues, ...editingAgent } : defaultLLMConfigValues
  );
  
  // Workflow state
  const [workflowDescription, setWorkflowDescription] = React.useState(
    editingAgent?.agentType === 'workflow' ? editingAgent.workflowDescription : ''
  );
  
  // RAG configuration state
  const [ragMemoryConfig, setRagMemoryConfig] = React.useState<RagMemoryConfig>(editingAgent?.ragMemoryConfig || { enabled: false, serviceType: 'in-memory', similarityTopK: 5, vectorDistanceThreshold: 0.7, embeddingModel: "", knowledgeSources: [], includeConversationContext: true, persistentMemory: false });
  
  // A2A configuration state
  const [a2aConfig, setA2AConfig] = React.useState<A2AConfigType>({
    enabled: false,
    communicationChannels: [],
    defaultResponseFormat: 'json',
    loggingEnabled: false,
    maxMessageSize: 1024 * 1024
  });
  
  // Artifacts state
  const [artifacts, setArtifacts] = React.useState<ArtifactDefinition[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = React.useState('configuracao');
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Derived state
  const showCustomLogicDescription = selectedAgentType === 'custom' || selectedAgentType === 'a2a';
  const showWorkflowFields = selectedAgentType === 'workflow' || 
                           selectedAgentType === 'sequential' || 
                           selectedAgentType === 'parallel' || 
                           selectedAgentType === 'loop';
  const { toast } = useToast();
  const { savedAgents } = useAgents();
  
  // Custom logic description state
  const [customLogicDescription, setCustomLogicDescription] = React.useState<string>(
    editingAgent?.agentType === 'custom' ? editingAgent.customLogicDescription || "" : ""
  );
  
  // Tools state
  const [currentAgentTools, setCurrentAgentTools] = React.useState<string[]>(
    editingAgent?.agentTools || []
  );
  const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, PageToolConfigData>>(editingAgent?.toolConfigsApplied || {});
  
  // State persistence
  const [enableStatePersistence, setEnableStatePersistence] = React.useState<boolean>(false);
  const [statePersistenceType, setStatePersistenceType] = React.useState<"memory" | "database" | "file">("memory");
  const [initialStateValues, setInitialStateValues] = React.useState<Record<string, string>>({});
  
  // State sharing
  const [enableStateSharing, setEnableStateSharing] = React.useState<boolean>(false);
  const [stateSharingStrategy, setStateSharingStrategy] = React.useState<"broadcast" | "selective">("selective");
  
  // RAG
  const [enableRAG, setEnableRAG] = React.useState<boolean>(false);
  const [ragMemoryConfig, setRagMemoryConfig] = React.useState<RagMemoryConfig>({
    enabled: false,
    serviceType: "in-memory",
    similarityTopK: 5,
    vectorDistanceThreshold: 0.7,
    embeddingModel: "",
    knowledgeSources: [],
    includeConversationContext: true,
    persistentMemory: false
  });
  
  // Artifacts
  const [enableArtifacts, setEnableArtifacts] = React.useState<boolean>(false);
  const [artifactStorageType, setArtifactStorageType] = React.useState<"local" | "cloud">("local");
  const [artifacts, setArtifacts] = React.useState<ArtifactDefinition[]>([]);
  const [cloudStorageBucket, setCloudStorageBucket] = React.useState<string>("");
  const [localStoragePath, setLocalStoragePath] = React.useState<string>("");
  
  // A2A Config
  const [a2aConfig, setA2AConfig] = React.useState<A2AConfigType>({
    communicationChannels: [],
    enabled: false,
    defaultResponseFormat: "json",
    loggingEnabled: false,
    maxMessageSize: 1024 * 1024
  });
  
  // Tool configuration modal
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState<boolean>(false);
  const [configuringTool, setConfiguringTool] = React.useState<PageAvailableTool | null>(null);
  
  // Modal form state for tool configurations
  const [modalGoogleApiKey, setModalGoogleApiKey] = React.useState<string>("");
  const [modalGoogleCseId, setModalGoogleCseId] = React.useState<string>("");
  const [modalOpenapiSpecUrl, setModalOpenapiSpecUrl] = React.useState<string>("");
  const [modalOpenapiApiKey, setModalOpenapiApiKey] = React.useState<string>("");
  const [modalApiEndpoint, setModalApiEndpoint] = React.useState<string>("");
  const [modalDbType, setModalDbType] = React.useState<string>("");
  const [modalDbHost, setModalDbHost] = React.useState<string>("");
  const [modalDbPort, setModalDbPort] = React.useState<string>("");
  const [modalDbName, setModalDbName] = React.useState<string>("");
  const [modalDbUser, setModalDbUser] = React.useState<string>("");
  const [modalDbPassword, setModalDbPassword] = React.useState<string>("");
  const [modalDbConnectionString, setModalDbConnectionString] = React.useState<string>("");
  const [modalDbDescription, setModalDbDescription] = React.useState<string>("");
  const [modalKnowledgeBaseId, setModalKnowledgeBaseId] = React.useState<string>("");
  const [modalCalendarApiEndpoint, setModalCalendarApiEndpoint] = React.useState<string>("");

  // Handle tool selection changes
  const handleToolSelectionChange = (toolId: string, isSelected: boolean) => {
    if (isSelected) {
      // Add the tool to the current selection if not already present
      if (!currentAgentTools.includes(toolId)) {
        setCurrentAgentTools([...currentAgentTools, toolId]);
      }
    } else {
      // Remove the tool from the current selection
      setCurrentAgentTools(currentAgentTools.filter(id => id !== toolId));
    }
  };
  
  // Handle saving tool configuration from the modal
  const handleSaveToolConfiguration = () => {
    if (!configuringTool) return;
    
    const newConfig: ToolConfigData = {};
    
    if (configuringTool.id === "webSearch") {
      newConfig.googleApiKey = modalGoogleApiKey;
      newConfig.googleCseId = modalGoogleCseId;
    } else if (configuringTool.id === "customApiIntegration") {
      newConfig.openapiSpecUrl = modalOpenapiSpecUrl;
      newConfig.openapiApiKey = modalOpenapiApiKey;
    } else if (configuringTool.id === "databaseAccess") {
      newConfig.dbType = modalDbType;
      newConfig.dbHost = modalDbHost;
      newConfig.dbPort = modalDbPort;
      newConfig.dbName = modalDbName;
      newConfig.dbUser = modalDbUser;
      newConfig.dbPassword = modalDbPassword;
      newConfig.dbConnectionString = modalDbConnectionString;
      newConfig.dbDescription = modalDbDescription;
    } else if (configuringTool.id === "knowledgeBase") {
      newConfig.knowledgeBaseId = modalKnowledgeBaseId;
    } else if (configuringTool.id === "calendarAccess") {
      newConfig.calendarApiEndpoint = modalCalendarApiEndpoint;
    }
    
    setToolConfigurations(prev => ({
      ...prev,
      [configuringTool.id]: newConfig
    }));
    
    setIsToolConfigModalOpen(false);
    setConfiguringTool(null);
    
    toast({
      title: "Configuração salva",
      description: `Configuração da ferramenta ${configuringTool.label} foi salva.`
    });
  };

  // Define baseConfig at component level to be accessible in the switch statement
  const baseConfig: AgentConfigBase = {
    agentName: "Novo Agente", // This would be populated from a form field
    agentDescription: "Descrição do agente", // This would be populated from a form field
    agentVersion: "1.0.0",
    agentTools: currentAgentTools || []
  };
  
  // Define agentConfigData at component level
  const [agentConfigData, setAgentConfigData] = React.useState<AgentConfig | null>(null);
  
  const handleInternalSave = () => {
    // Implementation for saving the agent configuration
    // Prepare the final configuration based on agent type
    let finalConfig: PageSavedAgentConfiguration;
    
    // Prepare workflow config if applicable
    const workflowConfig = prepareWorkflowConfig();
    
    // Create the final configuration to save
    finalConfig = {
      id: editingAgent?.id || `agent-${Date.now()}`,
      agentType: selectedAgentType,
      agentName: agentName,
      agentDescription: agentDescription,
      agentVersion: "1.0.0",
      templateId: editingAgent?.templateId || "custom",
      agentTools: currentAgentTools,
      toolsDetails: currentAgentTools.map(toolId => {
        const tool = availableTools.find(t => t.id === toolId);
        return {
          id: toolId,
          label: tool?.label || toolId,
          iconName: getToolIconName(tool),
          needsConfiguration: getNeedsConfiguration(tool),
          genkitToolName: getToolGenkitName(tool)
        };
      }),
      agentGoal: "",
      agentTasks: "",
      agentPersonality: "",
      agentRestrictions: "",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.7
    };
    
    // Call the onSave callback with the prepared configuration
    onSave(finalConfig);
  };

  const defaultLLMConfigValues: Omit<LLMAgentConfig, 'agentType'> = {
    agentGoal: "",
    agentTasks: "",
    agentPersonality: "", // Will be filled by the first agentToneOptions
    agentRestrictions: "",
    agentModel: "googleai/gemini-1.5-flash-latest",
    agentTemperature: 0.7,
    agentTools: [],
    agentName: "",
    agentDescription: "",
    agentVersion: "1.0.0"
  };

const defaultWorkflowConfigValues: Omit<WorkflowAgentConfig, 'agentType'> = {
    workflowDescription: "",
    detailedWorkflowType: "sequential",
    loopMaxIterations: 3,
    loopTerminationConditionType: "none",
    loopExitToolName: "",
    loopExitStateKey: "",
    loopExitStateValue: "",
    agentGoal: "Coordenar e gerenciar um fluxo de trabalho de múltiplas etapas.",
    agentTasks: "1. \n2. \n3. ",
    agentPersonality: "Sistemático e Organizado",
    agentRestrictions: "",
    agentModel: "googleai/gemini-1.5-pro-latest",
    agentTemperature: 0.3,
    agentTools: [],
    agentName: "",
    agentDescription: "",
    agentVersion: "1.0.0"
};

// ...

const handleWorkflowTypeChange = (type: 'sequential' | 'parallel' | 'loop') => {
    setDetailedWorkflowType(type);
    // Reset loop-specific states when changing away from loop
    if (type !== 'loop') {
      setLoopMaxIterations(3);
      setLoopTerminationConditionType('none');
      setLoopExitToolName('');
      setLoopExitStateKey('');
      setLoopExitStateValue('');
    } else {
      // Set default values when switching to loop
      setLoopTerminationConditionType('tool');
    }
  };

  // Handle loop termination condition type change with proper type safety
  const handleLoopTerminationChange = (value: "none" | "subagent_signal") => {
    setLoopTerminationConditionType(value);
  };

// Workflow Fields
  const [workflowDescription, setWorkflowDescription] = React.useState(editingAgent?.agentType === 'workflow' ? editingAgent.workflowDescription : (editingAgent?.workflowDescription || defaultWorkflowConfigValues.workflowDescription || ""));
  const [detailedWorkflowType, setDetailedWorkflowType] = React.useState<'sequential' | 'parallel' | 'loop' | undefined>(editingAgent?.agentType === 'workflow' ? editingAgent.detailedWorkflowType : defaultWorkflowConfigValues.detailedWorkflowType);
  const [loopMaxIterations, setLoopMaxIterations] = React.useState<number | undefined>(editingAgent?.agentType === 'workflow' ? editingAgent.loopMaxIterations : defaultWorkflowConfigValues.loopMaxIterations);
  const [loopTerminationConditionType, setLoopTerminationConditionType] = React.useState<"none" | "subagent_signal">(
    (editingAgent?.agentType === 'workflow' && editingAgent.loopTerminationConditionType) 
      ? (editingAgent.loopTerminationConditionType as "none" | "subagent_signal") 
      : 'none'
  );
  
  const [loopExitToolName, setLoopExitToolName] = React.useState<string>(
    (editingAgent?.agentType === 'workflow' && editingAgent.loopExitToolName) 
      ? editingAgent.loopExitToolName 
      : ''
  );
  
  const [loopExitStateKey, setLoopExitStateKey] = React.useState<string>(
    (editingAgent?.agentType === 'workflow' && editingAgent.loopExitStateKey) 
      ? editingAgent.loopExitStateKey 
      : ''
  );
  
  const [loopExitStateValue, setLoopExitStateValue] = React.useState<string>(
    (editingAgent?.agentType === 'workflow' && editingAgent.loopExitStateValue) 
      ? editingAgent.loopExitStateValue 
      : ''
  );
  
  // Ensure agentType is properly typed and initialized
  const [agentType, setAgentType] = React.useState<AgentType>(
    editingAgent?.agentType || 'llm'
  );
  
  // Track if we should show custom logic description
  const showCustomLogicDescription = agentType === 'custom' || agentType === 'a2a';
  
  // Ensure we have a valid agent type
  const safeAgentType = isAgentType(agentType) ? agentType : 'llm';

  // Function to render loop configuration UI
  const renderLoopConfiguration = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="loopMaxIterations">Número Máximo de Iterações</Label>
            <Input
              id="loopMaxIterations"
              type="number"
              min="1"
              value={loopMaxIterations}
              onChange={(e) => setLoopMaxIterations(Number(e.target.value))}
              placeholder="Ex: 5"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loopTerminationCondition">Condição de Término</Label>
            <Select
              value={loopTerminationConditionType}
              onValueChange={handleLoopTerminationChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma condição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma (executa até o final)</SelectItem>
                <SelectItem value="tool">Quando uma ferramenta específica for chamada</SelectItem>
                <SelectItem value="state">Quando o estado atender uma condição</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  };

// Function to prepare workflow config
const prepareWorkflowConfig = () => {
  if (['workflow', 'sequential', 'parallel', 'loop'].includes(agentType)) {
    const workflowConfig: WorkflowAgentConfig = {
      ...baseConfig,
      agentType: 'workflow',
      detailedWorkflowType: agentType === 'workflow' ? detailedWorkflowType || 'sequential' : agentType as any,
      workflowDescription: workflowDescription || '',
    };
    
    // Add loop-specific properties if this is a loop workflow
    if (agentType === 'loop') {
      workflowConfig.loopMaxIterations = loopMaxIterations || 3;
      workflowConfig.loopTerminationConditionType = loopTerminationConditionType;
      workflowConfig.loopExitToolName = loopExitToolName || '';
      workflowConfig.loopExitStateKey = loopExitStateKey || '';
      workflowConfig.loopExitStateValue = loopExitStateValue || '';
    }
    
    setAgentConfigData(workflowConfig);
    return workflowConfig;
  }
  return null;
};
                                                <>
                                                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                                                        <Label htmlFor="loopExitStateKey" className="text-left flex items-center">
                                                            Chave do Estado
                                                            <Tooltip>
                                                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                                                <TooltipContent className="max-w-xs"><p>Nome da variável de estado que determina o fim do loop.</p></TooltipContent>
                                                            </Tooltip>
                                                        </Label>
                                                        <Input 
                                                            id="loopExitStateKey" 
                                                            placeholder="ex: loopComplete" 
                                                            value={loopExitStateKey || ""} 
                                                            onChange={(e) => setLoopExitStateKey(e.target.value)}
                                                            className="h-10"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                                                        <Label htmlFor="loopExitStateValue" className="text-left flex items-center">
                                                            Valor do Estado para Saída
                                                            <Tooltip>
                                                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                                                <TooltipContent className="max-w-xs"><p>Valor da chave de estado que termina o loop.</p></TooltipContent>
                                                            </Tooltip>
                                                        </Label>
                                                        <Input 
                                                            id="loopExitStateValue" 
                                                            placeholder="ex: true" 
                                                            value={loopExitStateValue || ""} 
                                                            onChange={(e) => setLoopExitStateValue(e.target.value)}
                                                            className="h-10"
                                                        />
                                                    </div>
                                                </>
                                            </>
                                        )}
                                    </>
                                </div>
                            </>
                        )}
                        {showCustomLogicDescription && (
                            <div className="grid grid-cols-[200px_1fr] items-start gap-x-4 gap-y-3 mt-3">
                                <Label htmlFor="customLogicDescription" className="text-left pt-2.5 flex items-center">
                                    {safeAgentType === 'a2a' ? "Descrição da Interação A2A" : "Descrição da Lógica Personalizada"}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground">
                                                <Info size={14} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            {safeAgentType === 'a2a' ? (
                                                <p>Descreve padrões de interação A2A e protocolos.</p>
                                            ) : (
                                                <p>Descreve a funcionalidade do fluxo Genkit customizado.</p>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                </Label>
                                <Textarea 
                                    id="customLogicDescription" 
                                    placeholder={
                                        safeAgentType === 'a2a' 
                                            ? "Descreva como este agente deve interagir com outros agentes, quais informações ele troca, etc..."
                                            : "Descreva a funcionalidade principal e a lógica que seu fluxo Genkit customizado implementará..."
                                    } 
                                    value={customLogicDescription} 
                                    onChange={(e) => setCustomLogicDescription(e.target.value)} 
                                    rows={safeAgentType === 'a2a' ? 4 : 6}
                                />
                            </div>
                        )}
                    </TooltipProvider>
                </TabsContent>

                <TabsContent value="ferramentas" className="space-y-6">
                    <TooltipProvider>
                        <div>
                            <h3 className="text-lg font-medium mb-1 flex items-center gap-2">
                                <Network className="w-5 h-5 text-primary/80" /> 
                                Ferramentas do Agente
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                    <TooltipContent className="max-w-xs"><p>Capacidades (via Genkit) para interagir com sistemas externos ou executar ações.</p></TooltipContent>
                                </Tooltip>
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Capacite seu agente com funcionalidades para interagir com o mundo exterior. 
                                A execução real de cada ferramenta é gerenciada por um fluxo Genkit no backend.
                            </p>
                            
                            <ToolsTab
                                availableTools={availableTools}
                                selectedToolIds={currentAgentTools}
                                onToolSelectionChange={handleToolSelectionChange}
                                onConfigureTool={openToolConfigModal}
                                toolConfigsApplied={toolConfigurations}
                            />
                        </div>
                    </TooltipProvider>
                </TabsContent>

                <TabsContent value="memoriaConhecimento" className="space-y-6">
                    <TooltipProvider>
                        <RagMemoryTab
                            // Propriedades de Estado e Memória
                            enableStatePersistence={enableStatePersistence}
                            setEnableStatePersistence={setEnableStatePersistence}
                            statePersistenceType={statePersistenceType}
                            setStatePersistenceType={setStatePersistenceType}
                            initialStateValues={initialStateValues}
                            setInitialStateValues={setInitialStateValues}
                            enableStateSharing={enableStateSharing}
                            setEnableStateSharing={setEnableStateSharing}
                            stateSharingStrategy={stateSharingStrategy}
                            setStateSharingStrategy={setStateSharingStrategy}
                            enableRAG={enableRAG}
                            setEnableRAG={setEnableRAG}
                            // Propriedades de RAG e Conhecimento
                            ragMemoryConfig={ragMemoryConfig}
                            setRagMemoryConfig={setRagMemoryConfig}
                        />
                    </TooltipProvider>
                </TabsContent>

                <TabsContent value="artefatos" className="space-y-6">
                    <TooltipProvider>
                        <ArtifactManagementTab
                            enableArtifacts={enableArtifacts}
                            setEnableArtifacts={setEnableArtifacts}
                            artifactStorageType={artifactStorageType}
                            setArtifactStorageType={setArtifactStorageType}
                            artifacts={artifacts}
                            setArtifacts={setArtifacts}
                            cloudStorageBucket={cloudStorageBucket}
                            setCloudStorageBucket={setCloudStorageBucket}
                            localStoragePath={localStoragePath}
                            setLocalStoragePath={setLocalStoragePath}
                        />
                    </TooltipProvider>
                </TabsContent>
                
                <TabsContent value="a2a" className="space-y-6">
                    <TooltipProvider>
                        <A2AConfig
                            a2aConfig={a2aConfig}
                            setA2AConfig={setA2AConfig}
                            savedAgents={savedAgents || []}
                        />
                    </TooltipProvider>
                </TabsContent>


            </Tabs>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <DialogClose asChild><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button></DialogClose>
          <Button onClick={handleInternalSave} className="button-live-glow">
            <Save className="mr-2 h-4 w-4" /> {editingAgent ? "Salvar Alterações" : "Salvar e Criar Agente"}
          </Button>
        </DialogFooter>

        {isToolConfigModalOpen && configuringTool && (
            <Dialog 
                open={isToolConfigModalOpen} 
                onOpenChange={(open) => {
                    if (!open) setConfiguringTool(null);
                    setIsToolConfigModalOpen(open);
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Configurar: {configuringTool.name}
                        </DialogTitle>
                        <DialogDescription>
                            {configuringTool.description} Forneça os detalhes de configuração abaixo.
                        </DialogDescription>
                    </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                {configuringTool.id === "webSearch" && ( <>
                        <div className="space-y-2">
                            <Label htmlFor="modalGoogleApiKey">Chave de API do Google Custom Search</Label>
                            <Input id="modalGoogleApiKey" value={modalGoogleApiKey} onChange={(e) => setModalGoogleApiKey(e.target.value)} placeholder="Cole sua chave API aqui" type="password"/>
                            <p className="text-xs text-muted-foreground">Necessária para autenticar suas solicitações.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="modalGoogleCseId">ID do Mecanismo de Busca (CSE ID)</Label>
                            <Input id="modalGoogleCseId" value={modalGoogleCseId} onChange={(e) => setModalGoogleCseId(e.target.value)} placeholder="Cole seu CSE ID aqui"/>
                            <p className="text-xs text-muted-foreground">Identifica seu mecanismo de busca personalizado.</p>
                        </div>
                    </>)}
                {configuringTool.id === "customApiIntegration" && ( <>
                    <div className="space-y-2">
                        <Label htmlFor="modalOpenapiSpecUrl">URL do Esquema OpenAPI (JSON ou YAML)</Label>
                        <Input id="modalOpenapiSpecUrl" value={modalOpenapiSpecUrl} onChange={(e) => setModalOpenapiSpecUrl(e.target.value)} placeholder="ex: https://petstore.swagger.io/v2/swagger.json"/>
                        <p className="text-xs text-muted-foreground">Link para o arquivo de especificação da API.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="modalOpenapiApiKey">Chave de API da API Externa (Opcional)</Label>
                        <Input id="modalOpenapiApiKey" value={modalOpenapiApiKey} onChange={(e) => setModalOpenapiApiKey(e.target.value)} placeholder="Se a API requer autenticação" type="password"/>
                        <p className="text-xs text-muted-foreground">Usada para interagir com a API externa.</p>
                    </div>
                </>)}
                {configuringTool.id === "databaseAccess" && ( <>
                    <div className="space-y-2">
                        <Label htmlFor="modalDbType">Tipo de Banco de Dados</Label>
                        <Select value={modalDbType} onValueChange={setModalDbType}>
                            <SelectTrigger id="modalDbType" className="h-10"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                                <SelectItem value="mysql">MySQL</SelectItem>
                                <SelectItem value="sqlserver">SQL Server</SelectItem>
                                <SelectItem value="sqlite">SQLite</SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {(modalDbType !== 'other' && modalDbType !== 'sqlite' && modalDbType !== "") && (<>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="modalDbHost">Host</Label><Input id="modalDbHost" value={modalDbHost} onChange={(e) => setModalDbHost(e.target.value)} placeholder="ex: localhost" className="h-10"/></div>
                            <div className="space-y-2"><Label htmlFor="modalDbPort">Porta</Label><Input id="modalDbPort" type="number" value={modalDbPort} onChange={(e) => setModalDbPort(e.target.value)} placeholder="ex: 5432" className="h-10"/></div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="modalDbName">Nome do Banco</Label><Input id="modalDbName" value={modalDbName} onChange={(e) => setModalDbName(e.target.value)} placeholder="ex: meu_banco" className="h-10"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="modalDbUser">Usuário</Label><Input id="modalDbUser" value={modalDbUser} onChange={(e) => setModalDbUser(e.target.value)} className="h-10"/></div>
                            <div className="space-y-2"><Label htmlFor="modalDbPassword">Senha</Label><Input id="modalDbPassword" type="password" value={modalDbPassword} onChange={(e) => setModalDbPassword(e.target.value)} className="h-10"/></div>
                        </div>
                    </>)}
                    {(modalDbType === 'other' || modalDbType === 'sqlite') && (
                        <div className="space-y-2">
                            <Label htmlFor="modalDbConnectionString">String de Conexão (ou Caminho)</Label>
                            <Input id="modalDbConnectionString" value={modalDbConnectionString} onChange={(e) => setModalDbConnectionString(e.target.value)} placeholder={modalDbType === 'sqlite' ? "ex: /path/to/db.sqlite" : "driver://user:pass@host/db"} className="h-10"/>
                            <p className="text-xs text-muted-foreground">{modalDbType === 'sqlite' ? 'Caminho para o arquivo SQLite.' : 'String de conexão completa.'}</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="modalDbDescription">Descrição do Banco/Tabelas (Opcional)</Label>
                        <Textarea id="modalDbDescription" value={modalDbDescription} onChange={(e) => setModalDbDescription(e.target.value)} placeholder="Ex: Tabela 'usuarios' com colunas id, nome, email." rows={3}/>
                        <p className="text-xs text-muted-foreground">Ajuda o agente a entender o contexto dos dados.</p>
                    </div>
                </>)}
                {configuringTool.id === "knowledgeBase" && ( <div className="space-y-2">
                        <Label htmlFor="modalKnowledgeBaseId">ID/Nome da Base de Conhecimento</Label>
                        <Input id="modalKnowledgeBaseId" value={modalKnowledgeBaseId} onChange={(e) => setModalKnowledgeBaseId(e.target.value)} placeholder="ex: documentos_produto_xyz" className="h-10"/>
                        <p className="text-xs text-muted-foreground">Identificador para a base de conhecimento (RAG).</p>
                    </div>)}
                {configuringTool.id === "calendarAccess" && ( <div className="space-y-2">
                        <Label htmlFor="modalCalendarApiEndpoint">Endpoint da API ou ID do Fluxo Genkit</Label>
                        <Input id="modalCalendarApiEndpoint" value={modalCalendarApiEndpoint} onChange={(e) => setModalCalendarApiEndpoint(e.target.value)} placeholder="ex: https://api.example.com/calendar" className="h-10"/>
                        <p className="text-xs text-muted-foreground">URL ou identificador do fluxo Genkit para agenda.</p>
                    </div>)}
                </div>
                <DialogFooter>
                <DialogClose asChild><Button variant="outline" onClick={() => { setIsToolConfigModalOpen(false); setConfiguringTool(null);}}>Cancelar</Button></DialogClose>
                <Button onClick={handleSaveToolConfiguration} className="button-live-glow">Salvar Configuração</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
