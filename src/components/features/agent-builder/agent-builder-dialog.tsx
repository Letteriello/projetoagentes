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
import { A2AConfig as A2AConfigType, CommunicationChannel } from "@/types/a2a-types"; // Renamed A2AConfig to A2AConfigType
import { CommunicationChannelItem } from "./a2a-communication-channel";
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

import { useToast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubAgentSelector } from "@/components/features/agent-builder/sub-agent-selector";
// import { MultiAgentTab } from "@/components/features/agent-builder/multi-agent-tab"; // Assuming this was for the removed tab or integrated elsewhere
import { ArtifactManagementTab, ArtifactDefinition } from "@/components/features/agent-builder/artifact-management-tab";
import { RagMemoryTab } from "@/components/features/agent-builder/rag-memory-tab";
import { RagMemoryConfig, KnowledgeSource, MemoryServiceType } from "@/components/features/agent-builder/memory-knowledge-tab"; // Added MemoryServiceType
import { A2AConfig as A2AConfigComponent } from "@/components/features/agent-builder/a2a-config";
import { ToolsTab } from "@/components/features/agent-builder/tools-tab";
// import type { A2AConfig as A2AConfigType } from "@/types/a2a-types"; // Already imported and aliased
import { convertToGoogleADKConfig } from "@/lib/google-adk-utils"; // Assuming this is used or will be
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils"; // Was previously removed, adding back as it's very common
import type { ClassValue } from 'clsx';

import type {
  SavedAgentConfiguration as PageSavedAgentConfiguration, // Aliased to avoid conflict if used directly
  AgentConfig as PageAgentConfig, // Aliased
  LLMAgentConfig as PageLLMAgentConfig, // Aliased
  WorkflowAgentConfig as PageWorkflowAgentConfig, // Aliased
  CustomAgentConfig as PageCustomAgentConfig, // Aliased
  ToolConfigData as PageToolConfigData,
  AgentConfigBase as PageAgentConfigBase,
  AgentFramework, // Added from page.tsx fixes
} from '@/app/agent-builder/page';

import type {
  AvailableTool, // This should come from agent-types now, which re-exports from tool-types
  A2AAgentConfig, // This is a specific config type, ensure it matches or is properly used
  // AgentConfig, // Defined in page.tsx, using aliased PageAgentConfig above
  // LLMAgentConfig, // Defined in page.tsx
  // WorkflowAgentConfig, // Defined in page.tsx
  // CustomAgentConfig, // Defined in page.tsx
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAgents } from "@/lib/hooks/use-agents";
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
  AgentConfig,
  ToolConfigData
} from '@/app/agent-builder/page';

// Import shared types
import type { 
  SavedAgentConfiguration,
  A2AAgentConfig,
  AvailableTool,
  ToolConfigData as SharedToolConfigData
} from '@/types/agent-types';


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
  editingAgent: PageSavedAgentConfiguration | null; // Use aliased type
  onSave: (agentConfig: PageSavedAgentConfiguration) => void; // Use aliased type
  availableTools: AvailableTool[]; // This should use the type from agent-types
  agentTypeOptions: Array<{ id: "llm" | "workflow" | "custom" | "a2a"; label: string; icon?: React.ReactNode; description: string; }>;
  agentToneOptions: { id: string; label: string; }[];
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>;
}

type BaseAgentType = "llm" | "workflow" | "custom";
// Extended AgentType to include more specific workflow/task types if dialog needs to handle them
type DialogAgentType = PageAgentConfig['agentType'] | "a2a" | "task" | "sequential" | "parallel" | "loop" ;
type TerminationConditionType = "none" | "subagent_signal" | "tool" | "state";


function safeToReactNode(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (React.isValidElement(value)) return value;
  return String(value);
}

const toBaseAgentTypeUI = (type: DialogAgentType): BaseAgentType => {
  if (type === 'a2a' || type === 'task' || type === 'sequential' || type === 'parallel' || type === 'loop') return 'custom'; // Or map to workflow for seq/par/loop
  return type as BaseAgentType;
};

const getToolDisplayName = (tool: AvailableTool): React.ReactNode => safeToReactNode(tool.name || tool.id);
const getToolDescription = (tool: AvailableTool): React.ReactNode => safeToReactNode(tool.description || '');
const getNeedsConfiguration = (tool: AvailableTool): boolean => tool?.hasConfig || false; // Standardized
const getToolGenkitName = (tool: AvailableTool): string | undefined => tool.genkitToolName;


const defaultLLMConfigValues: Omit<PageLLMAgentConfig, keyof PageAgentConfigBase | 'agentType'> = {
    agentGoal: "", agentTasks: "", agentPersonality: "", agentRestrictions: "",
    agentModel: "googleai/gemini-2.0-flash", agentTemperature: 0.7,
};

const defaultWorkflowConfigValues: Partial<PageWorkflowAgentConfig> = {
  workflowDescription: "", detailedWorkflowType: undefined, loopMaxIterations: undefined, loopTerminationConditionType: 'none',
};

const defaultCustomConfigValues: Partial<PageCustomAgentConfig> = { customLogicDescription: "" };

const defaultA2AConfigValues: Partial<A2AAgentConfig> = {
    customLogicDescription: "Este agente é projetado para interagir e coordenar com outros agentes.", // A2A can also have custom logic description
    a2aConfig: {
        enabled: true, communicationChannels: [], defaultResponseFormat: 'json',
        maxMessageSize: 1024 * 1024, loggingEnabled: true,
    }
};

export function AgentBuilderDialog({
  isOpen, onOpenChange, editingAgent, onSave, availableTools,
  agentTypeOptions: propAgentTypeOptions, // Renamed prop to avoid conflict
  agentToneOptions, iconComponents,
}: AgentBuilderDialogProps) {

  const { toast } = useToast();
  const { savedAgents } = useAgents();
  const [isLoading, setIsLoading] = React.useState(false);

  // Consolidate ALL useState calls here
  const [agentName, setAgentName] = React.useState(editingAgent?.agentName || "");
  const [agentDescription, setAgentDescription] = React.useState(editingAgent?.agentDescription || "");
  const [agentVersion, setAgentVersion] = React.useState(editingAgent?.agentVersion || "1.0.0");
  const [currentAgentTools, setCurrentAgentTools] = React.useState<string[]>(editingAgent?.agentTools || []);

  // Use propAgentTypeOptions for initialization
  const initialAgentType = editingAgent?.agentType || (propAgentTypeOptions.length > 0 ? propAgentTypeOptions[0].id : 'llm');
  const [agentType, setAgentType] = React.useState<DialogAgentType>(initialAgentType as DialogAgentType);
  const [selectedAgentTypeUI, setSelectedAgentTypeUI] = React.useState<BaseAgentType>(toBaseAgentTypeUI(initialAgentType as DialogAgentType));

  const [agentGoal, setAgentGoal] = React.useState(editingAgent?.agentGoal || defaultLLMConfigValues.agentGoal);
  const [agentTasks, setAgentTasks] = React.useState(editingAgent?.agentTasks || defaultLLMConfigValues.agentTasks);
  const [agentPersonality, setAgentPersonality] = React.useState(editingAgent?.agentPersonality || (agentToneOptions.length > 0 ? agentToneOptions[0].label : ""));
  const [agentRestrictions, setAgentRestrictions] = React.useState(editingAgent?.agentRestrictions || defaultLLMConfigValues.agentRestrictions);
  const [agentModel, setAgentModel] = React.useState(editingAgent?.agentModel || defaultLLMConfigValues.agentModel);
  const [agentTemperature, setAgentTemperature] = React.useState([editingAgent?.agentTemperature === undefined ? defaultLLMConfigValues.agentTemperature : editingAgent.agentTemperature]);

  const [agentFramework, setAgentFramework] = React.useState<AgentFramework>(editingAgent?.agentFramework || 'custom');


  const [isRootAgent, setIsRootAgent] = React.useState(editingAgent?.isRootAgent || false);
  const [subAgents, setSubAgents] = React.useState<string[]>(editingAgent?.subAgents || []);
  const [globalInstruction, setGlobalInstruction] = React.useState(editingAgent?.globalInstruction || "");

  const [enableStatePersistence, setEnableStatePersistence] = React.useState<boolean>(editingAgent?.enableStatePersistence || false);
  const [statePersistenceType, setStatePersistenceType] = React.useState<'session' | 'memory' | 'database'>(editingAgent?.statePersistenceType || 'memory');
  const [initialStateValues, setInitialStateValues] = React.useState<Array<{key: string; value: string; scope: 'global' | 'agent' | 'temporary'; description: string;}>>(editingAgent?.initialStateValues || []);
  const [enableStateSharing, setEnableStateSharing] = React.useState<boolean>(editingAgent?.enableStateSharing || false);
  const [stateSharingStrategy, setStateSharingStrategy] = React.useState<'all' | 'explicit' | 'none'>(editingAgent?.stateSharingStrategy || 'explicit');

  const [enableRAG, setEnableRAG] = React.useState<boolean>(editingAgent?.enableRAG || false);
  const [ragMemoryConfig, setRagMemoryConfig] = React.useState<RagMemoryConfig>(
    editingAgent?.ragMemoryConfig || {
      enabled: false, serviceType: 'in-memory' as MemoryServiceType, projectId: "", location: "", ragCorpusName: "",
      similarityTopK: 5, vectorDistanceThreshold: 0.7, embeddingModel: "", knowledgeSources: [],
      includeConversationContext: true, persistentMemory: false,
    }
  );

  const [enableArtifacts, setEnableArtifacts] = React.useState<boolean>(editingAgent?.enableArtifacts || false);
  const [artifactStorageType, setArtifactStorageType] = React.useState<'memory' | 'filesystem' | 'cloud'>(editingAgent?.artifactStorageType || 'memory');
  const [artifacts, setArtifacts] = React.useState<ArtifactDefinition[]>(editingAgent?.artifacts || []);
  const [cloudStorageBucket, setCloudStorageBucket] = React.useState<string>(editingAgent?.cloudStorageBucket || '');
  const [localStoragePath, setLocalStoragePath] = React.useState<string>(editingAgent?.localStoragePath || '');

  const [a2aConfig, setA2AConfig] = React.useState<A2AConfigType>(
    editingAgent?.a2aConfig || {
      enabled: false, communicationChannels: [], defaultResponseFormat: 'json',
      maxMessageSize: 1024 * 1024, loggingEnabled: false,
    }
  );

  const [workflowDescription, setWorkflowDescription] = React.useState(editingAgent?.workflowDescription || defaultWorkflowConfigValues.workflowDescription || "");
  const [detailedWorkflowType, setDetailedWorkflowType] = React.useState<'sequential' | 'parallel' | 'loop' | undefined>(editingAgent?.detailedWorkflowType || defaultWorkflowConfigValues.detailedWorkflowType);
  const [loopMaxIterations, setLoopMaxIterations] = React.useState<number | undefined>(editingAgent?.loopMaxIterations || defaultWorkflowConfigValues.loopMaxIterations);
  const [loopTerminationConditionType, setLoopTerminationConditionType] = React.useState<TerminationConditionType>((editingAgent?.loopTerminationConditionType as TerminationConditionType) || "none");
  const [loopExitToolName, setLoopExitToolName] = React.useState<string | undefined>(editingAgent?.loopExitToolName);
  const [loopExitStateKey, setLoopExitStateKey] = React.useState<string | undefined>(editingAgent?.loopExitStateKey);
  const [loopExitStateValue, setLoopExitStateValue] = React.useState<string | undefined>(editingAgent?.loopExitStateValue);
  
  const [customLogicDescription, setCustomLogicDescription] = React.useState(editingAgent?.customLogicDescription || defaultCustomConfigValues.customLogicDescription || "");

  const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, PageToolConfigData>>(editingAgent?.toolConfigsApplied || {});
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false);
  const [configuringTool, setConfiguringTool] = React.useState<AvailableTool | null>(null);

  const [modalGoogleApiKey, setModalGoogleApiKey] = React.useState("");
  const [modalGoogleCseId, setModalGoogleCseId] = React.useState("");
  const [modalOpenapiSpecUrl, setModalOpenapiSpecUrl] = React.useState("");
  const [modalOpenapiApiKey, setModalOpenapiApiKey] = React.useState("");
  const [modalDbType, setModalDbType] = React.useState("");
  const [modalDbConnectionString, setModalDbConnectionString] = React.useState("");
  const [modalDbUser, setModalDbUser] = React.useState("");
  const [modalDbPassword, setModalDbPassword] = React.useState("");
  const [modalDbName, setModalDbName] = React.useState("");
  const [modalDbHost, setModalDbHost] = React.useState("");
  const [modalDbPort, setModalDbPort] = React.useState("");
  const [modalDbDescription, setModalDbDescription] = React.useState("");
  const [modalKnowledgeBaseId, setModalKnowledgeBaseId] = React.useState("");
  const [modalCalendarApiEndpoint, setModalCalendarApiEndpoint] = React.useState("");

  const [activeTab, setActiveTab] = React.useState("configPrincipal");


  // Initialize default personalities if not set by editingAgent
  if (agentToneOptions.length > 0 && !defaultLLMConfigValues.agentPersonality) {
    defaultLLMConfigValues.agentPersonality = agentToneOptions[0].label;
  }
  // This was for defaultTaskAgentConfigValues, which is not used directly for state
  // if (agentToneOptions.length > 0 && !defaultTaskAgentConfigValues.agentPersonality) {
  //   defaultTaskAgentConfigValues.agentPersonality = agentToneOptions.find(opt => opt.id === "concise")?.label || agentToneOptions[0].label;
  // }

  const resetLLMFields = (config: Partial<PageLLMAgentConfig> = {}) => {
    setAgentGoal(config.agentGoal || defaultLLMConfigValues.agentGoal);
    setAgentTasks(config.agentTasks || defaultLLMConfigValues.agentTasks);
    setAgentPersonality(config.agentPersonality || defaultLLMConfigValues.agentPersonality || (agentToneOptions.length > 0 ? agentToneOptions[0].label : ""));
    setAgentRestrictions(config.agentRestrictions || defaultLLMConfigValues.agentRestrictions);
    setAgentModel(config.agentModel || defaultLLMConfigValues.agentModel);
    setAgentTemperature([config.agentTemperature === undefined ? defaultLLMConfigValues.agentTemperature : config.agentTemperature]);
  };

  const resetWorkflowFields = (config: Partial<PageWorkflowAgentConfig> = {}) => {
    setWorkflowDescription(config.workflowDescription || defaultWorkflowConfigValues.workflowDescription || "");
    setDetailedWorkflowType(config.detailedWorkflowType || defaultWorkflowConfigValues.detailedWorkflowType);
    setLoopMaxIterations(config.loopMaxIterations || defaultWorkflowConfigValues.loopMaxIterations);
    setLoopTerminationConditionType((config.loopTerminationConditionType as TerminationConditionType) || defaultWorkflowConfigValues.loopTerminationConditionType || 'none');
    setLoopExitToolName(config.loopExitToolName);
    setLoopExitStateKey(config.loopExitStateKey);
    setLoopExitStateValue(config.loopExitStateValue);
  };

  const resetCustomLogicFields = (config: Partial<PageCustomAgentConfig | A2AAgentConfig> = {}) => {
    setCustomLogicDescription(config.customLogicDescription || defaultCustomConfigValues.customLogicDescription || "");
    if ('a2aConfig' in config && config.a2aConfig) {
        setA2AConfig(config.a2aConfig);
    } else if (agentType === 'a2a' && !config.a2aConfig) { // Ensure A2A defaults if switching to A2A
        setA2AConfig(defaultA2AAgentConfigValues.a2aConfig!);
    }
  };
  
  const resetFormFields = (selectedType: DialogAgentType) => {
    const typeOption = propAgentTypeOptions.find(opt => opt.id === selectedType);
    const isEditingCurrentType = editingAgent?.agentType === selectedType;
    const baseEditingAgent = editingAgent as PageSavedAgentConfiguration | null; // Cast for easier access

    setAgentName(isEditingCurrentType ? baseEditingAgent!.agentName : "");
    setAgentDescription(isEditingCurrentType ? baseEditingAgent!.agentDescription : (typeOption?.description || ""));
    setAgentVersion(isEditingCurrentType ? baseEditingAgent!.agentVersion : "1.0.0");
    setAgentFramework(isEditingCurrentType ? baseEditingAgent!.agentFramework || 'custom' : 'custom');
    setCurrentAgentTools(isEditingCurrentType ? baseEditingAgent!.agentTools : []);
    setToolConfigurations(isEditingCurrentType ? baseEditingAgent!.toolConfigsApplied || {} : {});

    setIsRootAgent(isEditingCurrentType ? baseEditingAgent!.isRootAgent || false : false);
    setSubAgents(isEditingCurrentType ? baseEditingAgent!.subAgents || [] : []);
    setGlobalInstruction(isEditingCurrentType ? baseEditingAgent!.globalInstruction || "" : "");

    setEnableStatePersistence(isEditingCurrentType ? baseEditingAgent!.enableStatePersistence || false : false);
    setStatePersistenceType(isEditingCurrentType ? baseEditingAgent!.statePersistenceType || 'memory' : 'memory');
    setInitialStateValues(isEditingCurrentType ? baseEditingAgent!.initialStateValues || [] : []);
    setEnableStateSharing(isEditingCurrentType ? baseEditingAgent!.enableStateSharing || false : false);
    setStateSharingStrategy(isEditingCurrentType ? baseEditingAgent!.stateSharingStrategy || 'explicit' : 'explicit');
    setEnableRAG(isEditingCurrentType ? baseEditingAgent!.enableRAG || false : false);
    setRagMemoryConfig(isEditingCurrentType ? baseEditingAgent!.ragMemoryConfig || ragMemoryConfig : { enabled: false, serviceType: 'in-memory', projectId: "", location: "", ragCorpusName: "", similarityTopK: 5, vectorDistanceThreshold: 0.7, embeddingModel: "", knowledgeSources: [], includeConversationContext: true, persistentMemory: false });
    
    setEnableArtifacts(isEditingCurrentType ? baseEditingAgent!.enableArtifacts || false : false);
    setArtifactStorageType(isEditingCurrentType ? baseEditingAgent!.artifactStorageType || 'memory' : 'memory');
    setArtifacts(isEditingCurrentType ? baseEditingAgent!.artifacts || [] : []);
    setCloudStorageBucket(isEditingCurrentType ? baseEditingAgent!.cloudStorageBucket || "" : "");
    setLocalStoragePath(isEditingCurrentType ? baseEditingAgent!.localStoragePath || "" : "");

    setA2AConfig(isEditingCurrentType ? baseEditingAgent!.a2aConfig || a2aConfig : { enabled: false, communicationChannels: [], defaultResponseFormat: 'json', maxMessageSize: 1024 * 1024, loggingEnabled: false });


    if (selectedType === 'llm') {
      resetLLMFields(isEditingCurrentType ? baseEditingAgent as PageLLMAgentConfig : defaultLLMConfigValues);
      resetWorkflowFields(); // Clear other type fields
      resetCustomLogicFields();
    } else if (selectedType === 'workflow' || selectedType === 'sequential' || selectedType === 'parallel' || selectedType === 'loop') {
      resetWorkflowFields(isEditingCurrentType ? baseEditingAgent as PageWorkflowAgentConfig : defaultWorkflowConfigValues);
      resetLLMFields(isEditingCurrentType ? baseEditingAgent as PageLLMAgentConfig : {}); // Allow optional LLM fields
      resetCustomLogicFields();
    } else if (selectedType === 'custom' ) {
      resetCustomLogicFields(isEditingCurrentType ? baseEditingAgent as PageCustomAgentConfig : defaultCustomConfigValues);
      resetLLMFields(isEditingCurrentType ? baseEditingAgent as PageLLMAgentConfig : {});
      resetWorkflowFields();
    } else if (selectedType === 'a2a') {
        resetCustomLogicFields(isEditingCurrentType ? baseEditingAgent as A2AAgentConfig : defaultA2AConfigValues); // A2A uses customLogicDescription and its own a2aConfig
        resetLLMFields(isEditingCurrentType ? baseEditingAgent as PageLLMAgentConfig : {});
        resetWorkflowFields();
    } else { // task or other unhandled - treat as simple LLM for now or clear all
      resetLLMFields(isEditingCurrentType ? baseEditingAgent as PageLLMAgentConfig : defaultLLMConfigValues); // Sensible default
      resetWorkflowFields();
      resetCustomLogicFields();
    }
  };

  React.useEffect(() => {
    if (editingAgent) {
      const currentType = editingAgent.agentType as DialogAgentType;
      setAgentType(currentType);
      setSelectedAgentTypeUI(toBaseAgentTypeUI(currentType));
      resetFormFields(currentType);
    } else {
      // For new agent, reset to the initially selected type (or the first in the list)
      const typeToReset = agentType || (propAgentTypeOptions.length > 0 ? propAgentTypeOptions[0].id : 'llm');
      resetFormFields(typeToReset as DialogAgentType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingAgent]); // Removed agentType from dependency array to avoid loop with setAgentType in handleAgentTypeChange

  const handleAgentTypeChange = (newAgentTypeValue: string) => {
    const newAgentType = newAgentTypeValue as DialogAgentType;
    setAgentType(newAgentType);
    setSelectedAgentTypeUI(toBaseAgentTypeUI(newAgentType));
    // When type changes for a new agent or even during editing, reset fields according to the new type
    resetFormFields(newAgentType);
  };

  // ... (constructSystemPrompt, handleInternalSave, handleToolSelectionChange, resetModalInputs, openToolConfigModal, handleSaveToolConfiguration remain largely the same for now)
  // But handleInternalSave will need careful type alignment for finalConfig
  // And handleFieldChange calls need to be implemented or removed

  // Placeholder for handleFieldChange - this needs proper implementation based on how state is structured
  const handleFieldChange = (field: string, value: any) => {
    console.warn(`handleFieldChange called for ${field} with value ${value} - needs implementation.`);
    // Example: if (field === 'agentFramework') setAgentFramework(value as AgentFramework);
    if (field === 'agentFramework') {
        setAgentFramework(value as AgentFramework);
    }
  };


  const constructSystemPrompt = () => {
    // This function's logic seems mostly okay, ensure variables used are correctly scoped and available
    let prompt = `Você é um agente de IA. Seu nome é "${agentName || 'Agente'}".\n`;
    if (agentDescription) {
      prompt += `Sua descrição geral é: "${agentDescription}".\n`;
    }
  
    const agentTypeDetail = propAgentTypeOptions.find(opt => opt.id === agentType); // Use propAgentTypeOptions
    if(agentTypeDetail){
      prompt += `Seu tipo principal é ${agentTypeDetail.label.split(' (')[0].trim()}. ${agentTypeDetail.description}\n`;
    }
  
    if (agentType === 'workflow') {
        if (detailedWorkflowType) prompt += `Subtipo de fluxo de trabalho: ${detailedWorkflowType}.\n`;
        if (workflowDescription) prompt += `Descrição do fluxo: ${workflowDescription}.\n`;
        if(detailedWorkflowType === 'loop' && loopMaxIterations) prompt += `O loop repetirá no máximo ${loopMaxIterations} vezes.\n`;
        if(detailedWorkflowType === 'loop' && loopTerminationConditionType === 'subagent_signal') {
            prompt += `O loop também pode terminar se um subagente sinalizar (ex: via ferramenta '${loopExitToolName || 'exit_loop'}' ou estado '${loopExitStateKey || 'status_documento'}' atingir '${loopExitStateValue || 'FINALIZADO'}').\n`;
        }
    } else if (agentType === 'custom' || agentType === 'a2a') {
        if (customLogicDescription) prompt += `Descrição da lógica customizada/interação: ${customLogicDescription}.\n`;
    }
    
    const isLLMRelevant = ['llm', 'task', 'a2a'].includes(agentType) || 
                         ( ['workflow', 'custom'].includes(agentType) && // Adjusted this condition
                           (agentGoal || agentTasks || agentPersonality || agentRestrictions || agentModel) );

    if (isLLMRelevant) {
        prompt += "\nA seguir, as instruções de comportamento para qualquer capacidade de LLM que você possua:\n\n";
        if (agentGoal) prompt += `OBJETIVO PRINCIPAL:\n${agentGoal}\n\n`;
        if (agentTasks) prompt += `TAREFAS PRINCIPAIS A SEREM REALIZADAS:\n${agentTasks}\n\n`;
        if (agentPersonality) prompt += `PERSONALIDADE/TOM DE COMUNICAÇÃO:\n${agentPersonality}\n\n`;
        if (agentRestrictions) prompt += `RESTRIÇÕES E DIRETRIZES IMPORTANTES A SEGUIR RIGOROSAMENTE:\n${agentRestrictions}\n\n`;
    }
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
  const [agentName, setAgentName] = React.useState(editingAgent?.name || '');
  const [agentDescription, setAgentDescription] = React.useState(editingAgent?.description || '');
  const [selectedAgentType, setSelectedAgentType] = React.useState<AgentType>('llm');
  const [selectedTone, setSelectedTone] = React.useState('professional');
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false);
  const [configuringTool, setConfiguringTool] = React.useState<PageAvailableTool | null>(null);
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
  const [a2aConfig, setA2aConfig] = React.useState<A2AConfigType>({
    enabled: false,
    communicationChannels: [],
  });
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
      setAgentName(editingAgent.name || '');
      setAgentDescription(editingAgent.description || '');
      setSelectedAgentType(editingAgent.type as AgentType);
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
        name: agentName,
        description: agentDescription,
        type: selectedAgentType,
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
  const [selectedTone, setSelectedTone] = React.useState(editingAgent?.tone || agentToneOptions[0]?.id || '');
  
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
  const [ragMemoryConfig, setRagMemoryConfig] = React.useState<RagMemoryConfig>({
    enabled: false,
    serviceType: 'in-memory',
    similarityTopK: 5,
    vectorDistanceThreshold: 0.8,
    embeddingModel: 'default',
    knowledgeSources: [],
    includeConversationContext: true,
    persistentMemory: false
  });
  
    if (selectedToolObjects.length > 0) {
        prompt += `FERRAMENTAS DISPONÍVEIS PARA USO (Você deve decidir quando e como usá-las):\n`;
        selectedToolObjects.forEach(tool => {
            const currentToolConfig = toolConfigurations[tool.id];
            let statusMessage = "";
            if (getNeedsConfiguration(tool)) { // Use helper
                const isConfigured = 
                    (tool.id === 'webSearch' && currentToolConfig?.googleApiKey && currentToolConfig?.googleCseId) ||
                    (tool.id === 'customApiIntegration' && currentToolConfig?.openapiSpecUrl) ||
                    (tool.id === 'databaseAccess' && (currentToolConfig?.dbConnectionString || (currentToolConfig?.dbHost && currentToolConfig?.dbName))) ||
                    (tool.id === 'knowledgeBase' && currentToolConfig?.knowledgeBaseId) ||
                    (tool.id === 'calendarAccess' && currentToolConfig?.calendarApiEndpoint) ||
                    (!['webSearch', 'customApiIntegration', 'databaseAccess', 'knowledgeBase', 'calendarAccess'].includes(tool.id) && currentToolConfig && Object.keys(currentToolConfig).length > 0);
                statusMessage = isConfigured ? "(Status: Configurada e pronta para uso)" : "(Status: Requer configuração. Verifique antes de usar ou informe a necessidade de configuração)";
            }
            const toolName = typeof tool.name === 'string' ? tool.name : tool.id;
            const toolNameForPrompt = getToolGenkitName(tool) || toolName.replace(/\s+/g, '');
            const toolDesc = typeof tool.description === 'string' ? tool.description : '';
            prompt += `- Nome da Ferramenta para uso: '${toolNameForPrompt}'. Descrição: ${toolDesc} ${statusMessage}\n`;
        });
        prompt += "\n";
    } else {
        prompt += `Nenhuma ferramenta externa está configurada para este agente.\n\n`;
    }
  // A2A configuration state
  const [a2aConfig, setA2AConfig] = React.useState<A2AConfigType>({
    enabled: false,
    communicationChannels: [],
    defaultResponseFormat: 'json',
    maxMessageSize: 4096,
    loggingEnabled: true
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
  const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, ToolConfigData>>({});
  
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
    vectorDistanceThreshold: 0.8,
    embeddingModel: "openai",
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
    maxMessageSize: 4096,
    loggingEnabled: true
  });
  
  // Tool configuration modal
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState<boolean>(false);
  const [configuringTool, setConfiguringTool] = React.useState<PageAvailableTool | null>(null);
  
  // Modal form state for tool configurations
  const [modalGoogleApiKey, setModalGoogleApiKey] = React.useState<string>("");
  const [modalGoogleCseId, setModalGoogleCseId] = React.useState<string>("");
  const [modalOpenapiSpecUrl, setModalOpenapiSpecUrl] = React.useState<string>("");
  const [modalApiKey, setModalApiKey] = React.useState<string>("");
  const [modalApiEndpoint, setModalApiEndpoint] = React.useState<string>("");
  const [modalOpenapiApiKey, setModalOpenapiApiKey] = React.useState<string>("");
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
  // handleSaveToolConfiguration is defined later in the file, so we'll remove this duplicate

  const handleInternalSave = () => {
    if (!agentName) {
      toast({ title: "Campo Obrigatório", description: "Nome do Agente é obrigatório.", variant: "destructive" });
      return;
    }
    const systemPrompt = constructSystemPrompt();
    const selectedToolsDetails = currentAgentTools
        .map(toolId => {
            const tool = availableTools.find(t => t.id === toolId);
            if (!tool) return null;
            const labelString = typeof tool.name === 'string' ? tool.name : tool.id;
            // iconName derivation logic might need refinement if icon components are not directly named in iconComponents map
            const iconName = getToolIconName(tool) || 'Default';

            return {
              id: tool.id,
              label: labelString, 
              iconName: iconName as keyof typeof iconComponents | 'default',
              hasConfig: getNeedsConfiguration(tool), // Use hasConfig
              genkitToolName: getToolGenkitName(tool),
            };
          })
        .filter(Boolean) as PageSavedAgentConfiguration['toolsDetails']; // Use aliased type

    const appliedToolConfigs: Record<string, PageToolConfigData> = {};
    currentAgentTools.forEach(toolId => {
        if (toolConfigurations[toolId]) {
            appliedToolConfigs[toolId] = toolConfigurations[toolId];
        }
    });

    // Construct the base config ensuring AgentType from page.tsx is used where SavedAgentConfiguration expects it.
    // The internal 'dialogAgentType' might be more specific (e.g. 'loop') but needs to map to a valid 'agentType' for saving.
    let finalAgentTypeForSave: PageAgentConfig['agentType'] = 'custom'; // Default
    if (agentType === 'llm' || agentType === 'workflow' || agentType === 'custom' || agentType === 'a2a') {
        finalAgentTypeForSave = agentType as PageAgentConfig['agentType'];
    } else if (['sequential', 'parallel', 'loop', 'task'].includes(agentType)) {
        // Map specific workflow/task types if necessary or handle as 'workflow' or 'custom'
        // For now, let's assume these can be mapped to 'workflow' or 'custom' if page.tsx AgentType is limited
        // Based on Phase 2, page.tsx AgentType was expanded.
        finalAgentTypeForSave = agentType as PageAgentConfig['agentType'];
    }


    let agentSpecificConfig: Partial<PageAgentConfig> = {};
    if (finalAgentTypeForSave === 'llm') {
        agentSpecificConfig = {
            agentGoal, agentTasks, agentPersonality, agentRestrictions, agentModel,
            agentTemperature: agentTemperature[0],
        };
    } else if (finalAgentTypeForSave === 'workflow' ||
               ['sequential', 'parallel', 'loop'].includes(agentType) ) { // Map detailed types to workflow
        agentSpecificConfig = {
            workflowDescription, detailedWorkflowType, loopMaxIterations, loopTerminationConditionType,
            loopExitToolName, loopExitStateKey, loopExitStateValue,
            // Optional LLM fields for workflow
            agentGoal: agentGoal || undefined, agentTasks: agentTasks || undefined, agentPersonality: agentPersonality || undefined,
            agentRestrictions: agentRestrictions || undefined, agentModel: agentModel || undefined, agentTemperature: agentTemperature[0] ?? undefined,
        };
    } else if (finalAgentTypeForSave === 'custom' || finalAgentTypeForSave === 'a2a' || agentType === 'task') {
        agentSpecificConfig = {
            customLogicDescription,
             // Optional LLM fields
            agentGoal: agentGoal || undefined, agentTasks: agentTasks || undefined, agentPersonality: agentPersonality || undefined,
            agentRestrictions: agentRestrictions || undefined, agentModel: agentModel || undefined, agentTemperature: agentTemperature[0] ?? undefined,
        };
        if (finalAgentTypeForSave === 'a2a') {
            (agentSpecificConfig as A2AAgentConfig).a2aConfig = a2aConfig;
        }
    }

    const completeAgentConfig: PageSavedAgentConfiguration = {
      id: editingAgent?.id || `agent-${Date.now()}`,
      templateId: editingAgent?.templateId || "custom",
      agentName,
      agentDescription,
      agentVersion,
      agentTools: currentAgentTools,
      agentType: finalAgentTypeForSave,
      agentFramework,
      isRootAgent,
      subAgents: isRootAgent ? subAgents : [],
      globalInstruction: isRootAgent ? globalInstruction : "",
      enableStatePersistence, statePersistenceType, initialStateValues,
      enableStateSharing, stateSharingStrategy, enableRAG,
      ragMemoryConfig: ragMemoryConfig.enabled ? ragMemoryConfig : undefined,
      enableArtifacts, artifactStorageType, artifacts,
      cloudStorageBucket: artifactStorageType === 'cloud' ? cloudStorageBucket : undefined,
      localStoragePath: artifactStorageType === 'filesystem' ? localStoragePath : undefined,

      ...agentSpecificConfig, // Spread the type-specific properties

      systemPromptGenerated: systemPrompt,
      toolsDetails: selectedToolsDetails,
      toolConfigsApplied: appliedToolConfigs,
    };

    onSave(completeAgentConfig);
    onOpenChange(false);
  };

  const handleToolSelectionChange = (toolId: string, checked: boolean) => {
    setCurrentAgentTools(prevTools => {
        if (checked) {
            return [...prevTools, toolId];
        } else {
            const newToolConfigs = { ...toolConfigurations };
            delete newToolConfigs[toolId]; 
            setToolConfigurations(newToolConfigs);
            return prevTools.filter(id => id !== toolId);
        }
    });
  };

  const resetModalInputs = () => {
    setModalGoogleApiKey(""); setModalGoogleCseId(""); setModalOpenapiSpecUrl("");
    setModalOpenapiApiKey(""); setModalDbType(""); setModalDbConnectionString("");
    setModalDbUser(""); setModalDbPassword(""); setModalDbName("");
    setModalDbHost(""); setModalDbPort(""); setModalDbDescription("");
    setModalKnowledgeBaseId(""); setModalCalendarApiEndpoint("");
  };

  const openToolConfigModal = (tool: AvailableTool) => {
  const openToolConfigModal = (tool: PageAvailableTool) => {
    setConfiguringTool(tool);
    setIsToolConfigModalOpen(true);
    
    // Load existing configuration if available
    const existingConfig = toolConfigurations[tool.id];
    if (existingConfig) {
      if (tool.id === "webSearch") {
        setModalGoogleApiKey(existingConfig.googleApiKey || "");
        setModalGoogleCseId(existingConfig.googleCseId || "");
      } else if (tool.id === "customApiIntegration") {
        setModalOpenapiSpecUrl(existingConfig.openapiSpecUrl || "");
        setModalOpenapiApiKey(existingConfig.apiKey || "");
        setModalApiEndpoint(existingConfig.apiEndpoint || "");
      } else if (tool.id === "databaseAccess") {
        setModalDbType(existingConfig.dbType || "");
        setModalDbHost(existingConfig.dbHost || "");
        setModalDbPort(existingConfig.dbPort || "");
        setModalDbName(existingConfig.dbName || "");
        setModalDbUser(existingConfig.dbUser || "");
        setModalDbPassword(existingConfig.dbPassword || "");
        setModalDbConnectionString(existingConfig.dbConnectionString || "");
        setModalDbDescription(existingConfig.dbDescription || "");
      } else if (tool.id === "knowledgeBase") {
        setModalKnowledgeBaseId(existingConfig.knowledgeBaseId || "");
      } else if (tool.id === "calendarAccess") {
        setModalCalendarApiEndpoint(existingConfig.calendarApiEndpoint || "");
      }
    } else {
      // Reset form fields if no existing configuration
      setModalGoogleApiKey("");
      setModalGoogleCseId("");
      setModalOpenapiSpecUrl("");
      setModalOpenapiApiKey("");
      setModalApiEndpoint("");
      setModalDbType("");
      setModalDbHost("");
      setModalDbPort("");
      setModalDbName("");
      setModalDbUser("");
      setModalDbPassword("");
      setModalDbConnectionString("");
      setModalDbDescription("");
      setModalKnowledgeBaseId("");
      setModalCalendarApiEndpoint("");
      setModalGoogleCseId(existingConfig.googleCseId || "");
    } else if (tool.id === "customApiIntegration") {
        setModalOpenapiSpecUrl(existingConfig.openapiSpecUrl || "");
        setModalOpenapiApiKey(existingConfig.openapiApiKey || "");
      } else if (tool.id === "databaseAccess") {
        setModalDbType(existingConfig.dbType || "");
        setModalDbHost(existingConfig.dbHost || "");
        setModalDbPort(existingConfig.dbPort || "");
        setModalDbName(existingConfig.dbName || "");
        setModalDbUser(existingConfig.dbUser || "");
        setModalDbPassword(existingConfig.dbPassword || "");
        setModalDbConnectionString(existingConfig.dbConnectionString || "");
        setModalDbDescription(existingConfig.dbDescription || "");
      } else if (tool.id === "knowledgeBase") {
        setModalKnowledgeBaseId(existingConfig.knowledgeBaseId || "");
      } else if (tool.id === "calendarAccess") {
        setModalCalendarApiEndpoint(existingConfig.calendarApiEndpoint || "");
      }
    }
    setIsToolConfigModalOpen(true);
  };

  const handleSaveToolConfiguration = () => {
    if (!configuringTool) return;
    let newConfigData: Partial<PageToolConfigData> = { ...toolConfigurations[configuringTool.id] };
    
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
    setToolConfigurations(prev => ({ ...prev, [configuringTool.id!]: newConfigData as PageToolConfigData, }));
    setIsToolConfigModalOpen(false); setConfiguringTool(null);
    // Use configuringTool.name if it's a string, otherwise fallback to id or a generic name
    const toolDisplayName = typeof configuringTool.name === 'string' ? configuringTool.name : configuringTool.id;
    toast({ title: `Configuração salva para ${toolDisplayName}`});
  };

  const selectedAgentTypeOption = propAgentTypeOptions.find(opt => opt.id === agentType); // Use propAgentTypeOptions
  // const selectedAgentTypeDescription = selectedAgentTypeOption?.description || "Configure seu agente."; // Unused
  // const selectedAgentTypeLabel = selectedAgentTypeOption?.label.split(' (')[0].trim() || "Agente"; // Unused

  const isLLMConfigRelevant = agentType === 'llm' || agentType === 'a2a' ||
                             ((agentType === 'workflow' || agentType === 'custom' || agentType === 'task' || agentType === 'sequential' || agentType === 'parallel' || agentType === 'loop') &&
                               (agentGoal || agentTasks || agentPersonality || agentRestrictions || agentModel)
                             );
  const showLLMSections = agentType === 'llm' || agentType === 'a2a' || agentType === 'task';
  const showWorkflowDescriptionFields = agentType === 'workflow' || agentType === 'sequential' || agentType === 'parallel' || agentType === 'loop';
  const showCustomLogicDescription = agentType === 'custom' || agentType === 'a2a';

  const agentFrameworkOptions = [
    { id: "custom", label: "Customizado / Padrão", description: "Configuração padrão ou customizada sem um framework específico.", icon: <Settings2 className="h-4 w-4" /> },
    { id: "genkit", label: "Google Genkit", description: "Agente construído com o Google Genkit.", icon: <Brain className="h-4 w-4 text-blue-500" /> },
    { id: "langchain", label: "Langchain", description: "Agente construído com Langchain.", icon: <Layers className="h-4 w-4 text-green-500" /> },
    { id: "crewai", label: "Crew AI", description: "Agente construído com Crew AI para colaboração.", icon: <Users className="h-4 w-4 text-purple-500" /> },
  ];

  // Removed problematic JSX block: const prepareWorkflowConfig = () => { ... } </>

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
          <DialogTitle className="text-2xl">
            {editingAgent ? `Editar Agente: ${agentName || 'Agente'}` : "Novo Agente"}
          </DialogTitle>
          <DialogDescription>
            {editingAgent ? "Modifique as propriedades e configurações do seu agente." : "Defina as propriedades e configurações para seu novo agente."}
          </DialogDescription>
        </DialogHeader>

        {/* Changed main content wrapper to allow Tabs to control its own scrolling for content */}
        <div className="flex-grow p-6 space-y-6 overflow-hidden">
            <Tabs defaultValue="configPrincipal" value={activeTab} onValueChange={(value) => setActiveTab(value)} className="w-full h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-5 mb-6 h-auto shrink-0"> {/* TabsList should not shrink */}
                    <TabsTrigger value="configPrincipal" className="py-2">Principal</TabsTrigger>
                    <TabsTrigger value="ferramentas" className="py-2">Ferramentas</TabsTrigger>
                    <TabsTrigger value="memoriaConhecimento" className="py-2">Memória/RAG</TabsTrigger>
                    <TabsTrigger value="artefatos" className="py-2">Artefatos</TabsTrigger>
                    <TabsTrigger value="a2a" className="py-2">A2A</TabsTrigger>
                </TabsList>
                
                {/* This div will contain all TabsContent and allow scrolling */}
                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    <TabsContent value="configPrincipal" className="space-y-6 mt-0"> {/* Removed mt-0 from here if not needed */}
                        <TooltipProvider>
                            <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                                <Label htmlFor="agentType" className="text-left flex items-center">
                                    <FileJson className="text-amber-500 mr-2" size={20} />Tipo de Agente
                                    <Tooltip>
                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                        <TooltipContent className="max-w-md">
                                            <p>Define a arquitetura e o comportamento fundamental do agente:</p>
                                            <ul className="list-disc pl-4 mt-1 text-xs">
                                                {propAgentTypeOptions.map(opt => <li key={opt.id}><strong>{opt.label.split(' (')[0]}:</strong> {opt.description}</li>)}
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                </Label>
                                <Select value={agentType} onValueChange={handleAgentTypeChange}>
                                    <SelectTrigger id="agentType" className="h-10"><SelectValue placeholder="Selecione o tipo de agente" /></SelectTrigger>
                                    <SelectContent>
                                        {propAgentTypeOptions.map(option => (
                                        <SelectItem key={option.id} value={option.id}>
                                            <div className="flex items-center">
                                            {option.icon ? React.cloneElement(option.icon as React.ReactElement, { className: "mr-2 h-4 w-4 text-muted-foreground"}) : <Cpu size={16} className="mr-2 h-4 w-4 text-muted-foreground"/>}
                                            {option.label}
                                            </div>
                                        </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedAgentTypeOption?.description && (
                                <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 mt-1">
                                    <div></div>
                                    <Alert variant="default" className="bg-card border-border/60">
                                        {selectedAgentTypeOption.icon ? React.cloneElement(selectedAgentTypeOption.icon as React.ReactElement, { className: "h-4 w-4 text-primary/80" }) : <Cpu className="h-4 w-4 text-primary/80" />}
                                        <AlertTitle>{selectedAgentTypeOption.label.split(' (')[0].trim()}</AlertTitle>
                                        <AlertDescription>{selectedAgentTypeOption.description}</AlertDescription>
                                    </Alert>
                                </div>
                            )}

                            <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                                <Label htmlFor="agentFramework" className="text-left flex items-center">
                                    <Settings2 className="mr-2 h-5 w-5 text-primary/80" />Framework
                                    <Tooltip>
                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                        <TooltipContent className="max-w-xs"><p>Framework base para o agente (opcional).</p></TooltipContent>
                                    </Tooltip>
                                </Label>
                                <Select value={agentFramework} onValueChange={(value) => handleFieldChange('agentFramework', value as AgentFramework)}>
                                    <SelectTrigger id="agentFramework" className="h-10"><SelectValue placeholder="Selecione o framework" /></SelectTrigger>
                                    <SelectContent>
                                        {agentFrameworkOptions.map(framework => (
                                            <SelectItem key={framework.id} value={framework.id}>
                                                <div className="flex items-center gap-2">
                                                    {framework.icon}<span>{framework.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                                <Label htmlFor="agentName" className="text-left">Nome do Agente</Label>
                                <Input id="agentName" placeholder="ex: Suporte Nível 1" value={agentName} onChange={(e) => setAgentName(e.target.value)} className="h-10"/>

                                <Label htmlFor="agentDescription" className="text-left flex items-start pt-2.5">Descrição Geral</Label>
                                <Textarea id="agentDescription" placeholder="Descreva a função principal..." value={agentDescription} onChange={(e) => setAgentDescription(e.target.value)} rows={3}/>
                            </div>

                            {showWorkflowDescriptionFields && ( // Changed variable name
                                <div className="grid grid-cols-[200px_1fr] items-start gap-x-4 gap-y-3 mt-3">
                                    <Label htmlFor="workflowDescription" className="text-left pt-2.5">Descrição do Fluxo</Label>
                                    <Textarea id="workflowDescription" placeholder="Descreva o objetivo e funcionamento do fluxo..." value={workflowDescription} onChange={(e) => setWorkflowDescription(e.target.value)} rows={3}/>
                                </div>
                            )}
                            {showCustomLogicDescription && (
                                 <div className="grid grid-cols-[200px_1fr] items-start gap-x-4 gap-y-3 mt-3">
                                    <Label htmlFor="customLogicDescription" className="text-left pt-2.5">
                                        {agentType === 'a2a' ? "Interação A2A" : "Lógica Customizada"}
                                    </Label>
                                    <Textarea id="customLogicDescription" placeholder={ agentType === 'a2a' ? "Como este agente interage..." : "Funcionalidade do fluxo Genkit..."} value={customLogicDescription} onChange={(e) => setCustomLogicDescription(e.target.value)} rows={4}/>
                                </div>
                            )}

                            {(showLLMSections || isLLMConfigRelevant) && (
                                <> <Separator className="my-6"/>
                                <div> <h3 className="text-lg font-medium mb-4 flex items-center gap-2"> <Settings className="w-5 h-5 text-primary/80" /> Comportamento e Instruções {!showLLMSections && '(Opcional)'}</h3>
                                     <div className="space-y-3">
                                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4"> <Label htmlFor="agentGoal" className="text-left flex items-center gap-1.5"><Target size={16}/>Objetivo</Label> <Input id="agentGoal" placeholder="ex: Ajudar usuários..." value={agentGoal} onChange={(e) => setAgentGoal(e.target.value)} className="h-10"/></div>
                                        <div className="grid grid-cols-[200px_1fr] items-start gap-x-4"> <Label htmlFor="agentTasks" className="text-left flex items-center gap-1.5 pt-2.5"><ListChecks size={16}/>Tarefas</Label> <Textarea id="agentTasks" placeholder="ex: 1. Responder..." value={agentTasks} onChange={(e) => setAgentTasks(e.target.value)} rows={3} /></div>
                                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4"> <Label htmlFor="agentPersonality" className="text-left flex items-center gap-1.5"><Smile size={16}/>Personalidade</Label>
                                            <Select value={agentPersonality} onValueChange={setAgentPersonality}> <SelectTrigger id="agentPersonality" className="h-10"><SelectValue placeholder="Selecione um tom" /></SelectTrigger>
                                            <SelectContent>{agentToneOptions.map(option => <SelectItem key={option.id} value={option.label}>{option.label}</SelectItem>)}</SelectContent></Select></div>
                                        <div className="grid grid-cols-[200px_1fr] items-start gap-x-4"> <Label htmlFor="agentRestrictions" className="text-left flex items-center gap-1.5 pt-2.5"><Ban size={16}/>Restrições</Label> <Textarea id="agentRestrictions" placeholder="ex: Nunca fornecer..." value={agentRestrictions} onChange={(e) => setAgentRestrictions(e.target.value)} rows={3}/></div>
                                    </div></div>
                                <Separator className="my-6"/>
                                <div> <h3 className="text-lg font-medium mb-4 flex items-center gap-2"> <Brain className="w-5 h-5 text-primary/80" /> Modelo de IA {!showLLMSections && !agentModel && '(Opcional)'} {!showLLMSections && agentModel && '(Opcional)'}</h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4"> <Label htmlFor="agentModel" className="text-left">Modelo</Label>
                                            <Select value={agentModel} onValueChange={setAgentModel}> <SelectTrigger id="agentModel" className="h-10"><SelectValue placeholder="Selecione um modelo" /></SelectTrigger>
                                            <SelectContent> <SelectItem value="googleai/gemini-1.5-pro-latest">Gemini 1.5 Pro</SelectItem> <SelectItem value="googleai/gemini-1.5-flash-latest">Gemini 1.5 Flash</SelectItem> <SelectItem value="googleai/gemini-pro">Gemini 1.0 Pro</SelectItem> <SelectItem value="googleai/gemini-2.0-flash">Gemini 2.0 Flash</SelectItem> <SelectItem value="openrouter/custom">OpenRouter</SelectItem> <SelectItem value="requestly/custom">Requestly Mock</SelectItem> <SelectItem value="custom-http/genkit">Outro HTTP</SelectItem></SelectContent></Select></div>
                                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4"> <Label htmlFor="agentTemperature" className="text-left">Temperatura: {agentTemperature[0].toFixed(1)}</Label> <Slider id="agentTemperature" min={0} max={1} step={0.1} value={agentTemperature} onValueChange={setAgentTemperature} /></div>
                                    </div></div></>
                            )}
                            
                            <Separator className="my-6"/>
                            <div className="grid grid-cols-[200px_1fr] items-center gap-x-4"> <Label htmlFor="agentVersion" className="text-left">Versão</Label> <Input id="agentVersion" placeholder="ex: 1.0.0" value={agentVersion} onChange={(e) => setAgentVersion(e.target.value)} className="h-10"/></div>
                            
                            <Separator className="my-6" />
                            <div className="space-y-4"> <div className="flex items-center gap-2"> <Users className="h-5 text-primary/80" /> <h3 className="text-lg font-medium">Multi-Agente (ADK)</h3></div>
                                <div className="flex items-center space-x-2"> <Switch id="isRootAgent" checked={isRootAgent} onCheckedChange={setIsRootAgent}/> <Label htmlFor="isRootAgent" className="flex items-center gap-1">Agente Raiz</Label></div>
                                {isRootAgent && (<> <Alert variant="default" className="bg-muted/30 border-border/50"><AlertCircle className="h-4 w-4 text-primary/80" /><AlertTitle className="text-sm">Agente Raiz ADK</AlertTitle><AlertDescription className="text-xs">Coordena sub-agentes (Google Agent Development Kit).</AlertDescription></Alert>
                                    <div className="space-y-4 mt-2">
                                        <div className="grid grid-cols-[200px_1fr] items-start gap-x-4"><Label htmlFor="globalInstruction" className="text-left pt-2">Instrução Global</Label><Textarea id="globalInstruction" placeholder="Instrução para todos os sub-agentes..." value={globalInstruction} onChange={(e) => setGlobalInstruction(e.target.value)} className="min-h-20 resize-y"/></div>
                                        <div className="space-y-2"><Label className="text-sm font-medium">Sub-Agentes</Label><Card className="border-border/50"><CardContent className="p-4"><SubAgentSelector selectedAgents={subAgents} onChange={setSubAgents} availableAgents={savedAgents || []}/></CardContent></Card></div>
                                    </div></>
                                )}
                            </div>
                            
                            {showWorkflowDescriptionFields && ( // Changed variable name
                                <> <Separator className="my-6" />
                                <div className="space-y-4"> <div className="flex items-center gap-2"> <Workflow className="h-5 w-5 text-primary/80" /> <h3 className="text-lg font-medium">Definição do Fluxo</h3></div>
                                    {propAgentTypeOptions.find(opt => opt.id === agentType) && (<Alert variant="default" className="mb-4 bg-card border-border/60"> {propAgentTypeOptions.find(opt => opt.id === agentType)!.icon ? React.cloneElement(propAgentTypeOptions.find(opt => opt.id === agentType)!.icon as React.ReactElement, { className: "h-4 w-4 text-primary/80" }) : <Cpu className="h-4 w-4 text-primary/80" />} <AlertTitle>{propAgentTypeOptions.find(opt => opt.id === agentType)!.label.split(' (')[0].trim()}</AlertTitle><AlertDescription>{propAgentTypeOptions.find(opt => opt.id === agentType)!.description}</AlertDescription></Alert>)}
                                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3 mb-4"> <Label htmlFor="detailedWorkflowType" className="text-left">Tipo Detalhado</Label>
                                        <Select value={detailedWorkflowType} onValueChange={(value) => setDetailedWorkflowType(value as 'sequential' | 'parallel' | 'loop' | undefined)}> <SelectTrigger id="detailedWorkflowType" className="h-10"><SelectValue placeholder="Selecione o tipo de fluxo" /></SelectTrigger>
                                        <SelectContent><SelectItem value="sequential">Sequencial</SelectItem><SelectItem value="parallel">Paralelo</SelectItem><SelectItem value="loop">Loop</SelectItem></SelectContent></Select></div>
                                    <div className="grid grid-cols-[200px_1fr] items-start gap-x-4 gap-y-3"><Label htmlFor="workflowDescription" className="text-left pt-2">Descrição do Fluxo (Interno)</Label><Textarea id="workflowDescription" placeholder="Descreva como as ferramentas serão executadas..." value={workflowDescription} onChange={(e) => setWorkflowDescription(e.target.value)} className="min-h-24 resize-y"/></div>
                                    {detailedWorkflowType === 'loop' && (<>
                                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3 mt-6"><Label htmlFor="loopMaxIterations" className="text-left">Max Iterações</Label><Input id="loopMaxIterations" type="number" placeholder="ex: 10" value={loopMaxIterations?.toString() || ""} onChange={(e) => setLoopMaxIterations(e.target.value ? parseInt(e.target.value) : undefined)} className="h-10"/></div>
                                        <div className="grid grid-cols-[200px_1fr] items-start gap-x-4 gap-y-3"><Label className="text-left pt-1">Condição de Término</Label>
                                            <RadioGroup value={loopTerminationConditionType || 'tool'} onValueChange={(value) => setLoopTerminationConditionType(value as 'tool' | 'state')} className="pt-1">
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="tool" id="tool-condition" /><Label htmlFor="tool-condition" className="font-normal">Baseado em Ferramenta</Label></div>
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="state" id="state-condition" /><Label htmlFor="state-condition" className="font-normal">Baseado em Estado</Label></div></RadioGroup></div>
                                        {loopTerminationConditionType === 'tool' && (<div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3"><Label htmlFor="loopExitToolName" className="text-left">Nome Ferramenta Saída</Label><Input id="loopExitToolName" placeholder="ex: exitLoop" value={loopExitToolName || ""} onChange={(e) => setLoopExitToolName(e.target.value)} className="h-10"/></div>)}
                                        {loopTerminationConditionType === 'state' && (<>
                                            <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3"><Label htmlFor="loopExitStateKey" className="text-left">Chave do Estado</Label><Input id="loopExitStateKey" placeholder="ex: loopComplete" value={loopExitStateKey || ""} onChange={(e) => setLoopExitStateKey(e.target.value)} className="h-10"/></div>
                                            <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3"><Label htmlFor="loopExitStateValue" className="text-left">Valor Estado Saída</Label><Input id="loopExitStateValue" placeholder="ex: true" value={loopExitStateValue || ""} onChange={(e) => setLoopExitStateValue(e.target.value)} className="h-10"/></div></>
                                        )}</>
                                    )}</div></>
                            )}
                        </TooltipProvider>
                    </TabsContent>

                    <TabsContent value="ferramentas" className="space-y-6 mt-0"><TooltipProvider><div> <h3 className="text-lg font-medium mb-1 flex items-center gap-2"> <Network className="w-5 h-5 text-primary/80" /> Ferramentas do Agente</h3> <p className="text-sm text-muted-foreground mb-4">Capacite seu agente com funcionalidades para interagir com o mundo exterior.</p><ToolsTab availableTools={availableTools} selectedToolIds={currentAgentTools} onToolSelectionChange={handleToolSelectionChange} onConfigureTool={openToolConfigModal} toolConfigsApplied={toolConfigurations}/></div></TooltipProvider></TabsContent>
                    <TabsContent value="memoriaConhecimento" className="space-y-6 mt-0"><TooltipProvider><RagMemoryTab enableStatePersistence={enableStatePersistence} setEnableStatePersistence={setEnableStatePersistence} statePersistenceType={statePersistenceType} setStatePersistenceType={setStatePersistenceType} initialStateValues={initialStateValues} setInitialStateValues={setInitialStateValues} enableStateSharing={enableStateSharing} setEnableStateSharing={setEnableStateSharing} stateSharingStrategy={stateSharingStrategy} setStateSharingStrategy={setStateSharingStrategy} enableRAG={enableRAG} setEnableRAG={setEnableRAG} ragMemoryConfig={ragMemoryConfig} setRagMemoryConfig={setRagMemoryConfig}/></TooltipProvider></TabsContent>
                    <TabsContent value="artefatos" className="space-y-6 mt-0"><TooltipProvider><ArtifactManagementTab enableArtifacts={enableArtifacts} setEnableArtifacts={setEnableArtifacts} artifactStorageType={artifactStorageType} setArtifactStorageType={setArtifactStorageType} artifacts={artifacts} setArtifacts={setArtifacts} cloudStorageBucket={cloudStorageBucket} setCloudStorageBucket={setCloudStorageBucket} localStoragePath={localStoragePath} setLocalStoragePath={setLocalStoragePath}/></TooltipProvider></TabsContent>
                    <TabsContent value="a2a" className="space-y-6 mt-0"><TooltipProvider><A2AConfigComponent a2aConfig={a2aConfig} setA2AConfig={setA2AConfig} savedAgents={(savedAgents || []) as any}/></TooltipProvider></TabsContent>
                </div> {/* End of scrolling div for TabsContent */}
    
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
                                            )}
                                        </>
                                    )}
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

        <DialogFooter className="p-6 pt-4 border-t shrink-0"> {/* Footer should not shrink */}
          <DialogClose asChild><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button></DialogClose>
          <Button onClick={handleInternalSave} className="button-live-glow">
            <Save className="mr-2 h-4 w-4" /> {editingAgent ? "Salvar Alterações" : "Salvar e Criar Agente"}
          </Button>
        </DialogFooter>

        {isToolConfigModalOpen && configuringTool && (
            <Dialog open={isToolConfigModalOpen} onOpenChange={(open) => { if (!open) setConfiguringTool(null); setIsToolConfigModalOpen(open); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader> <DialogTitle>Configurar: {getToolDisplayName(configuringTool)}</DialogTitle> <DialogDescription>{getToolDescription(configuringTool)} Forneça os detalhes abaixo.</DialogDescription></DialogHeader>
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
                {configuringTool.id === "webSearch" && ( <> <div className="space-y-2"> <Label htmlFor="modalGoogleApiKey">Chave API Google Custom Search</Label> <Input id="modalGoogleApiKey" value={modalGoogleApiKey} onChange={(e) => setModalGoogleApiKey(e.target.value)} placeholder="Cole sua chave API" type="password"/> <p className="text-xs text-muted-foreground">Necessária para autenticar.</p></div> <div className="space-y-2"> <Label htmlFor="modalGoogleCseId">ID Mecanismo de Busca (CSE ID)</Label> <Input id="modalGoogleCseId" value={modalGoogleCseId} onChange={(e) => setModalGoogleCseId(e.target.value)} placeholder="Cole seu CSE ID"/> <p className="text-xs text-muted-foreground">Identifica seu mecanismo.</p></div></>)}
                {configuringTool.id === "customApiIntegration" && ( <> <div className="space-y-2"> <Label htmlFor="modalOpenapiSpecUrl">URL Esquema OpenAPI (JSON/YAML)</Label> <Input id="modalOpenapiSpecUrl" value={modalOpenapiSpecUrl} onChange={(e) => setModalOpenapiSpecUrl(e.target.value)} placeholder="ex: https://petstore.swagger.io/v2/swagger.json"/> <p className="text-xs text-muted-foreground">Link para especificação da API.</p></div> <div className="space-y-2"> <Label htmlFor="modalOpenapiApiKey">Chave API Externa (Opcional)</Label> <Input id="modalOpenapiApiKey" value={modalOpenapiApiKey} onChange={(e) => setModalOpenapiApiKey(e.target.value)} placeholder="Se API requer autenticação" type="password"/> <p className="text-xs text-muted-foreground">Usada para interagir com API externa.</p></div></>)}
                {configuringTool.id === "databaseAccess" && ( <> <div className="space-y-2"> <Label htmlFor="modalDbType">Tipo de Banco</Label> <Select value={modalDbType} onValueChange={setModalDbType}><SelectTrigger id="modalDbType" className="h-10"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger><SelectContent><SelectItem value="postgresql">PostgreSQL</SelectItem><SelectItem value="mysql">MySQL</SelectItem><SelectItem value="sqlserver">SQL Server</SelectItem><SelectItem value="sqlite">SQLite</SelectItem><SelectItem value="other">Outro</SelectItem></SelectContent></Select></div>
                    {(modalDbType !== 'other' && modalDbType !== 'sqlite' && modalDbType !== "") && (<> <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="modalDbHost">Host</Label><Input id="modalDbHost" value={modalDbHost} onChange={(e) => setModalDbHost(e.target.value)} placeholder="ex: localhost" className="h-10"/></div><div className="space-y-2"><Label htmlFor="modalDbPort">Porta</Label><Input id="modalDbPort" type="number" value={modalDbPort} onChange={(e) => setModalDbPort(e.target.value)} placeholder="ex: 5432" className="h-10"/></div></div><div className="space-y-2"><Label htmlFor="modalDbName">Nome Banco</Label><Input id="modalDbName" value={modalDbName} onChange={(e) => setModalDbName(e.target.value)} placeholder="ex: meu_banco" className="h-10"/></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="modalDbUser">Usuário</Label><Input id="modalDbUser" value={modalDbUser} onChange={(e) => setModalDbUser(e.target.value)} className="h-10"/></div><div className="space-y-2"><Label htmlFor="modalDbPassword">Senha</Label><Input id="modalDbPassword" type="password" value={modalDbPassword} onChange={(e) => setModalDbPassword(e.target.value)} className="h-10"/></div></div></>)}
                    {(modalDbType === 'other' || modalDbType === 'sqlite') && (<div className="space-y-2"><Label htmlFor="modalDbConnectionString">String Conexão/Caminho</Label><Input id="modalDbConnectionString" value={modalDbConnectionString} onChange={(e) => setModalDbConnectionString(e.target.value)} placeholder={modalDbType === 'sqlite' ? "ex: /path/to/db.sqlite" : "driver://user:pass@host/db"} className="h-10"/><p className="text-xs text-muted-foreground">{modalDbType === 'sqlite' ? 'Caminho SQLite.' : 'String de conexão.'}</p></div>)}
                    <div className="space-y-2"><Label htmlFor="modalDbDescription">Descrição Banco/Tabelas (Opcional)</Label><Textarea id="modalDbDescription" value={modalDbDescription} onChange={(e) => setModalDbDescription(e.target.value)} placeholder="Ex: Tabela 'usuarios' (id, nome, email)." rows={3}/><p className="text-xs text-muted-foreground">Ajuda o agente a entender o contexto.</p></div></>)}
                {configuringTool.id === "knowledgeBase" && ( <div className="space-y-2"><Label htmlFor="modalKnowledgeBaseId">ID/Nome Base Conhecimento</Label><Input id="modalKnowledgeBaseId" value={modalKnowledgeBaseId} onChange={(e) => setModalKnowledgeBaseId(e.target.value)} placeholder="ex: docs_produto_xyz" className="h-10"/><p className="text-xs text-muted-foreground">Identificador para base (RAG).</p></div>)}
                {configuringTool.id === "calendarAccess" && ( <div className="space-y-2"><Label htmlFor="modalCalendarApiEndpoint">Endpoint API/ID Fluxo Genkit</Label><Input id="modalCalendarApiEndpoint" value={modalCalendarApiEndpoint} onChange={(e) => setModalCalendarApiEndpoint(e.target.value)} placeholder="ex: https://api.example.com/calendar" className="h-10"/><p className="text-xs text-muted-foreground">URL ou ID do fluxo Genkit para agenda.</p></div>)}
                </div>
                <DialogFooter><DialogClose asChild><Button variant="outline" onClick={() => { setIsToolConfigModalOpen(false); setConfiguringTool(null);}}>Cancelar</Button></DialogClose><Button onClick={handleSaveToolConfiguration} className="button-live-glow">Salvar Configuração</Button></DialogFooter>
            </DialogContent>
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
