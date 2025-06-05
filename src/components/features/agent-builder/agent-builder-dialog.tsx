
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
import { RagMemoryConfig, KnowledgeSource, MemoryServiceType } from "@/components/features/agent-builder/memory-knowledge-tab.tsx"; // Changed to .tsx
import { A2AConfig as A2AConfigComponent } from "@/components/features/agent-builder/a2a-config";
import { ToolsTab } from "@/components/features/agent-builder/tools-tab";
// import type { A2AConfig as A2AConfigType } from "@/types/a2a-types"; // Already imported and aliased
import { convertToGoogleADKConfig } from "@/lib/google-adk-utils"; // Assuming this is used or will be

import * as React from 'react';
import { lazy, Suspense } from 'react';
import { useForm, FormProvider, useFormContext, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod'; // z is imported via savedAgentConfigurationSchema

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge'; // Import Badge
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select
import { Switch } from "@/components/ui/switch"; // Added Switch
import { Checkbox } from "@/components/ui/checkbox"; // Added Checkbox
import JsonEditorField from '@/components/ui/JsonEditorField'; // Added JsonEditorField
// Label replaced by FormLabel where appropriate
import { Label } from '@/components/ui/label'; // Keep for direct use if any, or remove if all are FormLabel
import { toast } from '@/hooks/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
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
  agentToneOptions as pageAgentToneOptions, // Import value for agentToneOptions
} from '@/app/agent-builder/page';

// Types like AvailableTool, SavedAgentConfiguration, AgentConfig etc. are now imported from '@/types/unified-agent-types'
// in the main import block for types.
// A2AAgentConfig specific type is covered by A2AAgentSpecialistConfig from unified types.

import type {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"; // Import Form components
import {
  UploadCloud,
  Wand2,
  Info,
  Settings,
  Check,
  PlusCircle,
  Trash2,
  Save,
  ListChecks,
  Plus,
  Search,
  FileText,
  FileJson,
  Binary,
  Share2,
  Users,
  Layers,
  ChevronsUpDown,
  Brain,
  Settings2,
  Loader2,
  ClipboardCopy,
  Undo2, // Import Undo2
  AlertTriangle, // Import AlertTriangle
  Download, // Import Download icon
  GitCommit, // Added for Git operations
  RotateCcw, // Added for Git revert
  // Wand2 // Already imported
} from 'lucide-react';

import { HelpModal } from '@/components/ui/HelpModal';
import { generateAgentManifestJson, generateAgentManifestYaml } from '../../../lib/agent-utils'; // Updated import
import { aiConfigurationAssistantFlow, AiConfigurationAssistantOutput } from '@/ai/flows/aiConfigurationAssistantFlow';
import AISuggestionDisplay from './AISuggestionDisplay';
import { runFlow } from 'genkit';
import { InfoIcon } from '@/components/ui/InfoIcon'; // Though used in tabs, modal logic is here
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';

import GeneralTab from './tabs/general-tab';
// Lazy load tab components
const ToolsTab = lazy(() => import('./tabs/tools-tab'));
const BehaviorTab = lazy(() => import('./tabs/behavior-tab'));
const StateMemoryTab = lazy(() => import('./tabs/state-memory-tab'));
const RagTab = lazy(() => import('./tabs/rag-tab'));
const ArtifactsTab = lazy(() => import('./tabs/artifacts-tab'));
const A2AConfig = lazy(() => import('./tabs/a2a-config'));
const MultiAgentTab = lazy(() => import('./tabs/multi-agent-tab'));
const ReviewTab = lazy(() => import('./tabs/review-tab'));
const DeployTab = lazy(() => import('./tabs/DeployTab')); // Import DeployTab
const CallbacksTab = lazy(() => import('./tabs/CallbacksTab'));
const AdvancedSettingsTab = lazy(() => import('./tabs/AdvancedSettingsTab'));
const EvaluationSecurityTab = lazy(() => import('./tabs/evaluation-security-tab')); // Added for Task 9.4

import { SubAgentSelector } from './sub-agent-selector';
import { v4 as uuidv4 } from 'uuid';
import useApiKeyVault from '../../../hooks/use-api-key-vault'; // Import default está correto, pois o hook exporta default

import type {
  SavedAgentConfiguration,
  AgentConfig as AgentConfigUnion,
  LLMAgentConfig,
  WorkflowAgentConfig,
  CustomAgentConfig,
  A2AAgentSpecialistConfig,
  ToolConfigData,
  StatePersistenceConfig,
  RagMemoryConfig,
  ArtifactsConfig,
  ArtifactStorageType,
  A2AConfig as AgentA2AConfig, // This is ActualA2AConfig from a2a-types, re-exported or direct
  AvailableTool,
  AgentType,
  EvaluationGuardrails,
  AgentFramework,
  WorkflowStep, // Now from unified-agent-types
  MCPServerConfig, // Ensure this is correctly re-exported or defined in unified
  StateScope, // Added based on usage below
  TerminationConditionType as UnifiedTerminationConditionType, // Added based on usage below
  // Add other specific types like ModelSafetySettingItem, DeploymentConfig etc. if they are directly used in this file
} from '@/types/unified-agent-types';
// WorkflowStep import from agent-configs-new is removed as it's now part of the above unified import.


import { type A2AConfig as SharedA2AConfigType, type CommunicationChannel as SharedCommunicationChannel } from "@/types/a2a-types";
import { type ArtifactDefinition as SharedArtifactDefinition } from "@/components/features/agent-builder/artifact-management-tab";
// RagMemoryConfig is already imported from memory-knowledge-tab.tsx

// Type conversion helper
// Parameter 'agent' is the more general type from 'agent-types.ts'
// Return type is the page-specific configuration
const mapToPageAgentConfig = (agent: SavedAgentConfiguration): PageSavedAgentConfiguration => {
  // Ensure iconComponents is available in this scope if used for iconName validation,
  // or ensure iconName is of type `keyof typeof iconComponents | "default"`.
  // For now, we'll cast to any if direct mapping is complex, assuming validation happens elsewhere or types are compatible.
  // The main issue is `label` must be string, and `iconName` needs to fit PageSavedAgentConfiguration.
  return {
    ...agent,
    toolsDetails: (agent.toolsDetails || []).map(toolInput => {
      const tool = toolInput as any; // Treat input tool as any for flexibility from different sources
      let label = 'Unknown Tool';
      if (typeof tool.name === 'string') label = tool.name;
      else if (typeof tool.label === 'string') label = tool.label;
      else if (typeof tool.id === 'string') label = tool.id;

      // Assuming iconComponents is defined elsewhere and accessible for more robust iconName typing.
      // For now, keep it simple or cast.
      const iconName = tool.iconName || 'Default';

      return {
        id: String(tool.id || 'unknown'),
        label: label,
        iconName: iconName, // This needs to conform to `keyof typeof iconComponents | "default"`
                            // If `iconComponents` is not available here, this might need further refinement
                            // or the type for `iconName` in `PageSavedAgentConfiguration` might need to be broader.
        needsConfiguration: !!(tool.needsConfiguration || tool.hasConfig), // Standardize to boolean
        genkitToolName: tool.genkitToolName,
      };
    }) as PageSavedAgentConfiguration['toolsDetails'], // Assert to the target type
  };
};

interface AgentBuilderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingAgent: PageSavedAgentConfiguration | null; // Use aliased type from page.tsx
  onSave: (agentConfig: PageSavedAgentConfiguration) => void; // Use aliased type from page.tsx
  availableTools: AvailableTool[]; // Use AvailableTool from agent-types.ts
  agentTypeOptions: Array<{ id: AgentType; label: string; icon?: React.ReactNode; description: string; }>; // Use unified AgentType
  agentToneOptions: Array<{ id: string; label: string; }>; // Prop type for agentToneOptions
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>;
}

type BaseAgentType = Extract<AgentType, "llm" | "workflow" | "custom">; // More type-safe with unified AgentType
// Extended AgentType to include more specific workflow/task types if dialog needs to handle them
type DialogAgentType = PageAgentConfig['agentType'] | "a2a" | "task" | "sequential" | "parallel" | "loop" ; // PageAgentConfig['agentType'] already includes most of these. Consider aligning with unified AgentType.
type TerminationConditionType = UnifiedTerminationConditionType | "subagent_signal"; // Align with unified, extend if needed


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

const AgentBuilderDialog: React.FC<AgentBuilderDialogProps> = ({
  isOpen, onOpenChange, editingAgent, onSave, availableTools,
  agentTypeOptions: propAgentTypeOptions, // Renamed prop to avoid conflict
  agentToneOptions, iconComponents,
}: AgentBuilderDialogProps) {

  const { toast } = useToast();
  const { savedAgents } = useAgents();
  const [isLoading, setIsLoading] = React.useState(false);

  // Consolidate ALL useState calls here
  // Local states for agentName, agentDescription, agentVersion are removed as they are handled by RHF via GeneralTab.
  const [currentAgentTools, setCurrentAgentTools] = React.useState<string[]>(editingAgent?.agentTools || []);

  // Use propAgentTypeOptions for initialization
  const initialAgentTypeFromEditingAgent = editingAgent?.config?.type || (propAgentTypeOptions.length > 0 ? propAgentTypeOptions[0].id : 'llm');
  // Local state for agentType and selectedAgentTypeUI might still be needed if parts of the dialog
  // (outside RHF context of GeneralTab) depend on it directly.
  // However, config.type is part of RHF. This needs careful watching.
  // For now, assuming these are for parts of the UI not yet fully RHF-controlled or for internal logic.
  const [agentTypeLocal, setAgentTypeLocal] = React.useState<DialogAgentType>(initialAgentTypeFromEditingAgent as DialogAgentType);
  const [selectedAgentTypeUI, setSelectedAgentTypeUI] = React.useState<BaseAgentType>(toBaseAgentTypeUI(initialAgentTypeFromEditingAgent as DialogAgentType));

  // These local states for LLM fields also seem redundant if BehaviorTab uses RHF.
  // For now, keeping them if they are used by `constructSystemPrompt` or other non-RHF parts.
  // A deeper refactor would move all these to RHF.
  const [agentGoalLocal, setAgentGoalLocal] = React.useState(editingAgent?.config?.agentGoal || defaultLLMConfigValues.agentGoal);
  const [agentTasksLocal, setAgentTasksLocal] = React.useState(editingAgent?.config?.agentTasks || defaultLLMConfigValues.agentTasks);
  const [agentPersonalityLocal, setAgentPersonalityLocal] = React.useState(editingAgent?.config?.agentPersonality || (pageAgentToneOptions.length > 0 ? pageAgentToneOptions[0].label : ""));
  const [agentRestrictionsLocal, setAgentRestrictionsLocal] = React.useState(editingAgent?.config?.agentRestrictions || defaultLLMConfigValues.agentRestrictions);
  const [agentModelLocal, setAgentModelLocal] = React.useState(editingAgent?.config?.agentModel || defaultLLMConfigValues.agentModel);
  const [agentTemperatureLocal, setAgentTemperatureLocal] = React.useState([editingAgent?.config?.agentTemperature === undefined ? defaultLLMConfigValues.agentTemperature : editingAgent.config.agentTemperature]);

  // agentFramework is part of RHF (config.framework)
  // const [agentFramework, setAgentFramework] = React.useState<AgentFramework>(editingAgent?.config?.framework || 'custom');


  const [isRootAgent, setIsRootAgent] = React.useState(editingAgent?.config?.isRootAgent || false);
  const [subAgents, setSubAgents] = React.useState<string[]>(editingAgent?.config?.subAgentIds || []);
  const [globalInstruction, setGlobalInstruction] = React.useState(editingAgent?.config?.globalInstruction || "");

  // These state persistence fields are part of RHF (config.statePersistence)
  // const [enableStatePersistence, setEnableStatePersistence] = React.useState<boolean>(editingAgent?.config?.statePersistence?.enabled || false);
  // const [statePersistenceType, setStatePersistenceType] = React.useState<StatePersistenceType>(editingAgent?.config?.statePersistence?.type || 'memory'); // Use unified StatePersistenceType
  // const [initialStateValues, setInitialStateValues] = React.useState<Array<{key: string; value: string; scope: StateScope; description: string;}>>(editingAgent?.config?.statePersistence?.initialStateValues || []); // Use unified StateScope
  // const [enableStateSharing, setEnableStateSharing] = React.useState<boolean>(editingAgent?.config?.statePersistence?.enableStateSharing || false); // Assuming enableStateSharing is part of statePersistence
  // const [stateSharingStrategy, setStateSharingStrategy] = React.useState<'all' | 'explicit' | 'none'>(editingAgent?.config?.statePersistence?.stateSharingStrategy || 'explicit'); // Assuming stateSharingStrategy is part of statePersistence

  // RAG config is part of RHF (config.rag)
  // const [enableRAG, setEnableRAG] = React.useState<boolean>(editingAgent?.config?.rag?.enabled || false);
  // const [ragMemoryConfig, setRagMemoryConfig] = React.useState<RagMemoryConfig>(
  //   editingAgent?.config?.rag || { // Defaulting to a structure similar to RHF
  //     enabled: false, serviceType: 'in-memory' as MemoryServiceType, knowledgeSources: [], retrievalParameters: {}, persistentMemory: {enabled: false}
  //   }
  // );

// Helper function to generate a tool usage snippet from JSON schema
const generateToolSnippet = (toolName: string, jsonSchemaString: string | undefined): string => {
  if (!jsonSchemaString) {
    return `${toolName}(...args)`; // Fallback if no schema
  }
  try {
    const schema = JSON.parse(jsonSchemaString);
    if (schema.type !== 'object' || !schema.properties) {
      return `${toolName}(...args)`; // Fallback if schema is not an object with properties

    }


  // Artifacts config is part of RHF (config.artifacts)
  // const [enableArtifacts, setEnableArtifacts] = React.useState<boolean>(editingAgent?.config?.artifacts?.enabled || false);
  // const [artifactStorageType, setArtifactStorageType] = React.useState<ArtifactStorageType>(editingAgent?.config?.artifacts?.storageType || 'memory'); // Use unified ArtifactStorageType
  // const [artifacts, setArtifacts] = React.useState<SharedArtifactDefinition[]>(editingAgent?.config?.artifacts?.definitions || []);
  // const [cloudStorageBucket, setCloudStorageBucket] = React.useState<string>(editingAgent?.config?.artifacts?.cloudStorageBucket || '');
  // const [localStoragePath, setLocalStoragePath] = React.useState<string>(editingAgent?.config?.artifacts?.localStoragePath || '');

  // A2A config is part of RHF (config.a2a)
  // const [a2aConfig, setA2AConfig] = React.useState<SharedA2AConfigType>(
  //   editingAgent?.config?.a2a || {
  //     enabled: false, communicationChannels: [], defaultResponseFormat: 'json',
  //     maxMessageSize: 1024 * 1024, loggingEnabled: false,
  //   }
  // );
  
  // Workflow specific fields are part of RHF (config.workflowType, config.workflowDescription etc. for workflow agents)
  // const [workflowDescription, setWorkflowDescription] = React.useState(editingAgent?.config?.workflowDescription || defaultWorkflowConfigValues.workflowDescription || "");
  // const [detailedWorkflowType, setDetailedWorkflowType] = React.useState<'sequential' | 'parallel' | 'loop' | undefined>(editingAgent?.config?.workflowType || defaultWorkflowConfigValues.detailedWorkflowType);
  // const [loopMaxIterations, setLoopMaxIterations] = React.useState<number | undefined>(editingAgent?.config?.loopMaxIterations || defaultWorkflowConfigValues.loopMaxIterations); // Assuming these are part of workflow config in RHF
  // const [loopTerminationConditionType, setLoopTerminationConditionType] = React.useState<TerminationConditionType>((editingAgent?.config?.loopTerminationConditionType as TerminationConditionType) || "none");
  // const [loopExitToolName, setLoopExitToolName] = React.useState<string | undefined>(editingAgent?.config?.loopExitToolName);
  // const [loopExitStateKey, setLoopExitStateKey] = React.useState<string | undefined>(editingAgent?.config?.loopExitStateKey);
  // const [loopExitStateValue, setLoopExitStateValue] = React.useState<string | undefined>(editingAgent?.config?.loopExitStateValue);

  // Custom logic description is part of RHF (config.customLogicDescription for custom agents)
  // const [customLogicDescription, setCustomLogicDescription] = React.useState(editingAgent?.config?.customLogicDescription || defaultCustomConfigValues.customLogicDescription || "");

  // toolConfigurations (toolConfigsApplied in RHF) and currentAgentTools (tools in RHF) are managed by RHF via ToolsTab
  // const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, PageToolConfigData>>(editingAgent?.toolConfigsApplied || {});
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false); // This state is for the ToolConfigModal itself
  const [configuringToolForModal, setConfiguringToolForModal] = React.useState<AvailableTool | null>(null); // Renamed to avoid conflict with RHF's 'configuringTool' if any

  // States for ToolConfigModal props that are not part of RHF schemas for specific tools
  // These are typically for generic parts of the tool config modal or for tools not yet refactored.
  const [modalGoogleApiKey, setModalGoogleApiKey] = React.useState(""); // Example, might be fully from vault
  const [modalGoogleCseId, setModalGoogleCseId] = React.useState(""); // Will be handled by RHF for google-search
  const [modalOpenapiSpecUrl, setModalOpenapiSpecUrl] = React.useState(""); // Will be handled by RHF for openapi-custom
  const [modalOpenapiApiKey, setModalOpenapiApiKey] = React.useState(""); // Example, might be fully from vault
  // Database fields will be handled by RHF for database-connector
  const [modalDbType, setModalDbType] = React.useState("");
  const [modalDbConnectionString, setModalDbConnectionString] = React.useState("");
  const [modalDbUserLocal, setModalDbUserLocal] = React.useState(""); // Renamed to avoid RHF conflict
  const [modalDbPassword, setModalDbPassword] = React.useState(""); // Example, might be fully from vault
  const [modalDbNameLocal, setModalDbNameLocal] = React.useState(""); // Renamed to avoid RHF conflict
  const [modalDbHostLocal, setModalDbHostLocal] = React.useState(""); // Renamed to avoid RHF conflict
  const [modalDbPortLocal, setModalDbPortLocal] = React.useState<number | undefined>(undefined); // Renamed & typed
  const [modalDbDescriptionLocal, setModalDbDescriptionLocal] = React.useState(""); // Renamed

  const [modalKnowledgeBaseId, setModalKnowledgeBaseId] = React.useState("");
  const [modalCalendarApiEndpoint, setModalCalendarApiEndpoint] = React.useState("");

  const [activeTab, setActiveTab] = React.useState("general"); // Default to general tab now


  // Initialize default personalities if not set by editingAgent
  // This logic should ideally use RHF's defaultValues or watch RHF fields
  // if (agentToneOptions.length > 0 && !defaultLLMConfigValues.agentPersonality) {
    // defaultLLMConfigValues.agentPersonality = agentToneOptions[0].label; // This might be outdated
  // }

  // resetLLMFields and resetWorkflowFields are removed as their corresponding local states are removed.
  // Form reset/population should be handled by RHF's reset method with defaultValues.

    const params = Object.entries(schema.properties).map(([name, propDetails]) => {
      const type = (propDetails as any).type || 'any';
      const isRequired = schema.required && schema.required.includes(name);
      return `${name}${isRequired ? '' : '?'}: ${type}`;
    });

    return `${toolName}(${params.join(', ')})`;
  } catch (error) {
    console.warn(`Failed to parse JSON schema for tool ${toolName}:`, error);
    return `${toolName}(...args)`; // Fallback on parsing error
  }
};


/**
 * Constructs a system prompt string based on the agent's RHF configuration.
 * This prompt is typically used to guide the behavior of an LLM agent.
 */
const constructSystemPromptFromRHF = (
  rhfData: SavedAgentConfiguration, // Get data from RHF
  availableAgents: Array<{ id: string; agentName: string }>,
  aiSuggestions?: AiConfigurationAssistantOutput | null,
  allAvailableTools?: AvailableTool[]
): string => {
  if (!rhfData.config) return "No configuration provided.";

  let promptParts: string[] = [];
  const agentNameValue = rhfData.agentName; // From RHF
  const agentDescriptionValue = rhfData.agentDescription; // From RHF

  promptParts.push(`Você é um agente de IA. Seu nome é "${agentNameValue || 'Agente'}".`);
  if (agentDescriptionValue) {
    promptParts.push(`Sua descrição geral é: "${agentDescriptionValue}".`);
  }

  const agentTypeDetail = propAgentTypeOptions.find(opt => opt.id === rhfData.config.type);
  if(agentTypeDetail){
    promptParts.push(`Seu tipo principal é ${agentTypeDetail.label.split(' (')[0].trim()}. ${agentTypeDetail.description}`);
  }

  if (rhfData.config.type === 'llm') {
    const llmConfig = rhfData.config as LLMAgentConfig;
    const personality = aiSuggestions?.suggestedPersonality || llmConfig.agentPersonality;
    if (personality) promptParts.push(`Sua personalidade é: ${personality}.`);
    if (llmConfig.agentGoal) promptParts.push(`Seu objetivo principal é: ${llmConfig.agentGoal}.`);

    const tasksToUse = (aiSuggestions?.suggestedTasks && aiSuggestions.suggestedTasks.length > 0)
      ? aiSuggestions.suggestedTasks
      : llmConfig.agentTasks;
    if (tasksToUse && tasksToUse.length > 0) {
      promptParts.push("Para alcançar este objetivo, você deve realizar as seguintes tarefas:");
      promptParts.push(...tasksToUse.map(task => `- ${task}`));
    }

    const restrictionsToUse = (aiSuggestions?.suggestedRestrictions && aiSuggestions.suggestedRestrictions.length > 0)
      ? aiSuggestions.suggestedRestrictions
      : llmConfig.agentRestrictions;
    if (restrictionsToUse && restrictionsToUse.length > 0) {
      promptParts.push("\nVocê deve aderir às seguintes restrições:");
      promptParts.push(...restrictionsToUse.map(restriction => `- ${restriction}`));
    }
  } else if (rhfData.config.type === 'workflow') {
    const wfConfig = rhfData.config as WorkflowAgentConfig;
    if (wfConfig.workflowType) promptParts.push(`Subtipo de fluxo de trabalho: ${wfConfig.workflowType}.`);
    if (wfConfig.workflowDescription) promptParts.push(`Descrição do fluxo: ${wfConfig.workflowDescription}.`);
    // Add loop conditions if applicable, from RHF data
  } else if (rhfData.config.type === 'custom' || rhfData.config.type === 'a2a') {
    const customConfig = rhfData.config as CustomAgentConfig | A2AAgentSpecialistConfig;
    if (customConfig.customLogicDescription) promptParts.push(`Descrição da lógica customizada/interação: ${customConfig.customLogicDescription}.`);
  }

  if (allAvailableTools && rhfData.toolsDetails && rhfData.toolsDetails.length > 0) {
    promptParts.push("\nFerramentas Disponíveis:");
    rhfData.toolsDetails.forEach(selectedToolInfo => {
      const fullToolDetail = allAvailableTools.find(t => t.id === selectedToolInfo.id);
      if (fullToolDetail) {
        promptParts.push(`- Nome: ${fullToolDetail.name}`);
        promptParts.push(`  Descrição: ${fullToolDetail.description}`);
        const snippet = generateToolSnippet(fullToolDetail.name, fullToolDetail.inputSchema);
        if (snippet) promptParts.push(`  Uso: ${snippet}`);
        // TODO: Add tool configuration status message here based on rhfData.toolConfigsApplied
      }
    });
  } else {
    promptParts.push(`Nenhuma ferramenta externa está configurada para este agente.`);
  }
  return promptParts.join('\n\n');
};


// This function might be part of an older UI structure or for specific non-RHF interactions.
// It's NOT the main RHF form submission handler.
// If this is truly unused or fully superseded by RHF, it can be removed.
// For now, just removing the manual agentName check as RHF handles it.
const handleInternalSave = () => {
    // if (!agentName) { // This check is removed as RHF handles agentName validation.
    //   toast({ title: "Campo Obrigatório", description: "Nome do Agente é obrigatório.", variant: "destructive" });
    //   return;
    // }
    // The systemPromptGenerated and selectedToolsDetails are now derived from RHF state
    // This function, if still needed, should take RHF values as arguments or call getValues().
    // For example:
    // const currentRHFValues = methods.getValues();
    // const systemPromptGenerated = constructSystemPromptFromRHF(currentRHFValues, ...);
    // const selectedToolsDetails = currentRHFValues.toolsDetails;

    // The original logic that used local state for currentAgentTools and toolConfigurations
    // would need to be updated if this function is still in use.
    // For now, this function's direct utility is questionable with RHF managing the primary state.
    console.warn("handleInternalSave called - review its necessity and usage of local vs RHF state.");
    return "System prompt generation logic needs review for RHF integration.";
};
  const constructSystemPrompt = () => {
    const rhfValues = methods.getValues();
    // Use a local copy of currentAgentTools if RHF 'tools' array isn't directly what's needed here
    // This part of constructSystemPrompt seems to be the older version.
    // It uses local state variables that were removed or are becoming stale.
    // This should be replaced by constructSystemPromptFromRHF.

    let systemPromptText = `Você é um agente de IA. Seu nome é "${rhfValues.agentName || 'Agente'}".\n`;
    if (rhfValues.agentDescription) {
      systemPromptText += `Sua descrição geral é: "${rhfValues.agentDescription}".\n`;
    }
  
    const agentTypeDetail = propAgentTypeOptions.find(opt => opt.id === rhfValues.config.type);
    if(agentTypeDetail){
      systemPromptText += `Seu tipo principal é ${agentTypeDetail.label.split(' (')[0].trim()}. ${agentTypeDetail.description}\n`;
    }
  
    // Logic for workflow, custom, a2a types using rhfValues.config
    // ...
    
    // This uses `currentAgentTools` (local state) and `toolConfigurations` (local state)
    // These should ideally come from RHF's `tools` and `toolConfigsApplied`
    const selectedToolObjects = (rhfValues.tools || [])
        .map(toolId => availableTools.find(t => t.id === toolId))
        .filter(Boolean) as AvailableTool[];

    if (selectedToolObjects.length > 0) {
        systemPromptText += `\nFERRAMENTAS DISPONÍVEIS PARA USO (Você deve decidir quando e como usá-las):\n`;
        selectedToolObjects.forEach(tool => {
            const currentToolConfig = rhfValues.toolConfigsApplied?.[tool.id]; // from RHF
            // ... rest of the logic for status message ...
            const toolName = typeof tool.name === 'string' ? tool.name : (typeof (tool as any).label === 'string' ? (tool as any).label : tool.id);
            const toolNameForPrompt = getToolGenkitName(tool) || toolName.replace(/\s+/g, '');
            const toolDesc = typeof tool.description === 'string' ? tool.description : '';
            systemPromptText += `- Nome da Ferramenta para uso: '${toolNameForPrompt}'. Descrição: ${toolDesc}\n`; // Simplified status
        });
        systemPromptText += "\n";
    } else {
        systemPromptText += `Nenhuma ferramenta externa está configurada para este agente.\n\n`;
    }

    // LLM relevant sections from rhfValues.config (LLMAgentConfig part)
    // ...
    return systemPromptText;
  };


  const handleInternalSave = () => {
    // This function's direct dependency on local state like `agentName` is removed.
    // It was primarily for generating system prompt text or tool details, which should now
    // rely on RHF's `getValues()`.
    // The toast for missing agentName is removed as RHF handles this via schema.

    // Example of how it might be updated if still needed:
    const currentRHFData = methods.getValues();
    // const systemPromptGenerated = constructSystemPrompt(); // constructSystemPrompt now uses RHF values
    // const selectedToolsDetails = currentRHFData.toolsDetails;

    // If this function's output was used elsewhere, that usage needs to be reviewed.
    // For now, its direct utility is reduced.
    console.warn("handleInternalSave called - its role should be re-evaluated with RHF.")
    return; // Or return relevant data derived from RHF if needed.
    /*
    const systemPromptGenerated = constructSystemPrompt();
    const selectedToolsDetails = (methods.getValues('tools') || [])
        .map(toolId => {
            const tool = availableTools.find(t => t.id === toolId);
            // ... mapping logic based on RHF values ...
          });
        // .filter(Boolean) as PageSavedAgentConfiguration['toolsDetails'];

    // const appliedToolConfigs: Record<string, PageToolConfigData> = methods.getValues('toolConfigsApplied') || {};
    */
  };

// Fallback component for lazy loading
const LoadingFallback = () => <div>Loading tab...</div>;

// Define a default for ArtifactsConfig to ensure it's always present
const DEFAULT_ARTIFACTS_CONFIG: ArtifactsConfig = { // ArtifactsConfig from unified
  enabled: false,
  storageType: 'memory' as ArtifactStorageType, // ArtifactStorageType from unified
  cloudStorageBucket: '',
  localStoragePath: '',
  definitions: [],
};

// Local AgentConfig type is removed.
// Import the Zod schema
import { savedAgentConfigurationSchema } from '../../../lib/zod-schemas'; // Adjusted path

interface AgentBuilderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingAgent?: SavedAgentConfiguration | null;
  onSave: (config: SavedAgentConfiguration) => void;
  availableTools: Array<{ id: string; name: string; description: string }>;
  agentTypeOptions: string[];
  agentToneOptions: string[];
  iconComponents: Record<string, React.ComponentType>;
  availableAgentsForSubSelector: Array<{ id: string; agentName: string }>;
  mcpServers?: MCPServerConfig[]; // Prop if passed from parent, otherwise mock
  onConfigureToolInDialog: (tool: AvailableTool) => void; // New prop from AgentBuilderPage
}

// Mock MCP Servers data for now
const mockMcpServers: MCPServerConfig[] = [
  { id: 'mcp-server-1', name: 'MCP Server Alpha', url: 'https://mcp.example.com/alpha', description: 'Primary MCP processing server.' },
  { id: 'mcp-server-2', name: 'MCP Server Beta (Experimental)', url: 'https://mcp.example.com/beta', description: 'Experimental MCP server with new features.' },
  { id: 'mcp-server-3', name: 'MCP Server Gamma (Legacy)', url: 'https://mcp.example.com/gamma', description: 'Legacy MCP server for specific tools.' },
];

const AgentBuilderDialog: React.FC<AgentBuilderDialogProps> = ({
  isOpen,
  onOpenChange,
  editingAgent,
  onSave,
  availableTools,
  agentTypeOptions,
  agentToneOptions,
  iconComponents,
  availableAgentsForSubSelector,
  mcpServers = mockMcpServers, // Use prop or default to mock
  onConfigureToolInDialog, // Destructure the new prop
}) => {
  const { apiKeys: availableApiKeys, isLoading: apiKeysLoading, error: apiKeysError } = useApiKeyVault();
  // TODO: Handle apiKeysLoading and apiKeysError appropriately
  if (apiKeysLoading) console.log("API Keys Loading...");
  if (apiKeysError) console.error("Error loading API Keys:", apiKeysError);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeEditTab, setActiveEditTab] = React.useState('general');
  const [currentStep, setCurrentStep] = React.useState(0); // tabOrder updated below
  const tabOrder = ['general', 'behavior', 'tools', 'memory_knowledge', 'artifacts', 'a2a', 'multi_agent_advanced', 'evaluation_security', 'advanced', 'deploy', 'callbacks', 'review']; // Added evaluation_security

  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const [helpModalContent, setHelpModalContent] = React.useState<{ title: string; body: React.ReactNode } | null>(null);

  // State for AI Suggestions
  const [aiSuggestions, setAiSuggestions] = React.useState<AiConfigurationAssistantOutput | null>(null);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [suggestionError, setSuggestionError] = React.useState<string | null>(null);

  // State for manual system prompt editing
  const [isSystemPromptManuallyEdited, setIsSystemPromptManuallyEdited] = React.useState(false);

  const showHelpModal = (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => {
    const content = agentBuilderHelpContent[contentKey.tab]?.[contentKey.field]?.modal;
    if (content) {
      let modalBody = content.body;
      if (typeof modalBody === 'string') {
        // Ensure agent-builder-help-content.ts provides sanitized HTML or preferably JSX.
        modalBody = <div dangerouslySetInnerHTML={{ __html: modalBody }} />;
      }
      setHelpModalContent({ title: content.title, body: modalBody });
      setIsHelpModalOpen(true);
    }
  };

  const createDefaultSavedAgentConfiguration = (): SavedAgentConfiguration => {
    const newId = uuidv4();
    const now = new Date().toISOString();
    return {
      id: newId,
      agentName: '',
      agentDescription: '',
      agentVersion: '1.0.0',
      icon: '', // Default icon
      templateId: '',
      isTemplate: false,
      isFavorite: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
      userId: '', // This might be set by the backend or context
      config: {
        type: 'llm', // Default agent type
        framework: 'genkit', // Default framework // Ensure 'framework' is here
        agentGoal: '',
        agentTasks: [],
        agentPersonality: 'neutral', // Default personality
        agentRestrictions: [],
        agentModel: 'gemini-1.5-flash-latest', // Default model
        agentTemperature: 0.7,
        systemPromptGenerated: '', // Will be generated based on fields
        safetySettings: [],
        enableCompositionalFunctionCalling: false, // Initialize CFC to false
        // Initialize other optional base fields with default 'disabled' states
        statePersistence: { enabled: false, type: 'session', defaultScope: 'AGENT', initialStateValues: [], validationRules: [] },
        rag: { enabled: false, serviceType: 'in-memory', knowledgeSources: [], retrievalParameters: {}, persistentMemory: {enabled: false} },
        artifacts: { ...DEFAULT_ARTIFACTS_CONFIG }, // Use the defined default
        a2a: { enabled: false, communicationChannels: [], defaultResponseFormat: 'json', maxMessageSize: 1024, loggingEnabled: false },
        evaluationGuardrails: { // Default for Task 9.4
          prohibitedKeywords: [],
          checkForToxicity: false,
          maxResponseLength: undefined, // Explicitly undefined or a sensible default like 500
        },
        adkCallbacks: {}, // Initialize empty ADK callbacks
        runConfig: {
          max_llm_calls: undefined,
          stream_response: true,
          speech_config: {
            voice: 'alloy',
            speed: 1.0
          }
        }
      } as LLMAgentConfig, // Type assertion for the default config
      tools: [],
      toolConfigsApplied: {},
      toolsDetails: [],
      internalVersion: 1,
      isLatest: true,
      originalAgentId: newId, // For new agents, originalId is the same as id
      // Initialize deploymentConfig
      deploymentConfig: {
        targetPlatform: undefined,
        environmentVariables: [],
        resourceRequirements: {
          cpu: '',
          memory: '',
        },
      },
    };
  };

  // Helper function to prepare default values ensuring artifacts config is present
  const prepareFormDefaultValues = (agent?: SavedAgentConfiguration | null): SavedAgentConfiguration => {
    const baseConfig = agent || createDefaultSavedAgentConfiguration();
  // Ensure LLM-specific fields like enableCompositionalFunctionCalling are preserved or defaulted
  // if the baseConfig.config is already an LLMAgentConfig.
  // If baseConfig.config is not an LLMAgentConfig (e.g., workflow), these fields wouldn't apply.
  const isLLM = baseConfig.config?.type === 'llm';

  const preparedConfig = {
      ...baseConfig,
      config: {
        ...baseConfig.config,
        artifacts: baseConfig.config?.artifacts || { ...DEFAULT_ARTIFACTS_CONFIG },
        // Explicitly ensure CFC field for LLM agents
        ...(isLLM && { enableCompositionalFunctionCalling: (baseConfig.config as LLMAgentConfig).enableCompositionalFunctionCalling || false }),
        runConfig: {
          ...(createDefaultSavedAgentConfiguration().config.runConfig!), // Get all runConfig defaults
          ...(baseConfig.config?.runConfig || {}), // Override with agent's runConfig if it exists
          speech_config: {
            ...(createDefaultSavedAgentConfiguration().config.runConfig?.speech_config!), // Get speech defaults
            ...(baseConfig.config?.runConfig?.speech_config || {}), // Override with agent's speech_config
          }
        },
      },
    };

  // Ensure workflowSteps is initialized for workflow agents
  if (preparedConfig.config.type === 'workflow') {
    const workflowConfig = preparedConfig.config as WorkflowAgentConfig;
    if (workflowConfig.workflowSteps === undefined) {
      workflowConfig.workflowSteps = [];
    }
  }

  return preparedConfig;
  };

  const methods = useForm<SavedAgentConfiguration>({
    defaultValues: prepareFormDefaultValues(editingAgent),
    resolver: zodResolver(savedAgentConfigurationSchema), // Use Zod schema for validation
  });

  React.useEffect(() => {
    const defaultVals = prepareFormDefaultValues(editingAgent);
    methods.reset(defaultVals);
    // Initialize isSystemPromptManuallyEdited based on the new default values from the form after reset
    // Ensure this reflects the actual persisted state if manualSystemPromptOverride has content
    setIsSystemPromptManuallyEdited(!!methods.getValues('config.manualSystemPromptOverride'));
  }, [editingAgent, methods]); // methods is stable, editingAgent triggers this.

  const { control, watch, setValue, getValues, formState } = methods; // Get control, watch,setValue, getValues from methods
  const agentTypeRHF = watch("config.type"); // RHF watched value for agent type
  const agentGoalRHF = watch("config.agentGoal"); // RHF watched value for agent goal
  const agentTasksRHF = watch("config.agentTasks"); // RHF watched value for agent tasks
  const agentPersonalityRHF = watch("config.agentPersonality"); // RHF watched value for agent personality
  const agentRestrictionsRHF = watch("config.agentRestrictions"); // RHF watched value for agent restrictions
  // For workflow specific fields, watch them from config. e.g. watch("config.workflowType")
  const workflowTypeRHF = watch("config.workflowType");
  const workflowStepsRHF = watch("config.workflowSteps"); // This is an array
  // Watch fields related to system prompt. These can be passed to BehaviorTab or used here.
  // const systemPromptGenerated = watch("config.systemPromptGenerated"); // Not strictly needed to watch at this level if BehaviorTab handles its display via useFormContext
  // const manualSystemPromptOverride = watch("config.manualSystemPromptOverride"); // Same as above


  const { fields, append, remove } = useFieldArray({
    control,
    name: "config.workflowSteps",
  });

  /**
   * Effect to automatically update the `systemPromptGenerated` field in the form
   * whenever relevant configuration fields change or AI suggestions are updated.
   * This provides a live preview of the system prompt that would be used by the agent.
   */
  React.useEffect(() => {
    // Only auto-generate system prompt if not in manual edit mode
    if (!isSystemPromptManuallyEdited) {
      const currentFullConfig = getValues();
      if (currentFullConfig.config) { // Check if config is defined
        const newPromptString = constructSystemPromptFromRHF( // Use the RHF-based prompt constructor
          currentFullConfig,
          availableAgentsForSubSelector,
          aiSuggestions,
          availableTools
        );
        if (newPromptString !== getValues('config.systemPromptGenerated')) {
          setValue('config.systemPromptGenerated', newPromptString, {
            shouldDirty: false,
            shouldValidate: false,
          });
        }
      }
    }
  }, [
    // Dependencies that trigger system prompt regeneration:
    // Watch relevant RHF fields that affect the system prompt
    watch('agentName'), watch('agentDescription'), agentTypeRHF, agentGoalRHF, agentTasksRHF, agentPersonalityRHF, agentRestrictionsRHF,
    workflowTypeRHF, workflowStepsRHF, // RHF workflow fields
    watch('config.customLogicDescription'), // For custom agents
    watch('toolsDetails'), // RHF field for selected tools
    watch('toolConfigsApplied'), // RHF field for tool configurations
    availableAgentsForSubSelector,
    aiSuggestions,
    setValue, // setValue is stable but good to include if used in effect
    getValues, // getValues is stable
    isSystemPromptManuallyEdited,
    availableTools,
  ]);

  const onSubmit: SubmitHandler<SavedAgentConfiguration> = async (submittedData) => {
    // It's crucial to get the absolute latest values from the form,
    // especially if setValue was called recently without an immediate re-render cycle.
    const currentFormData = methods.getValues();
    let finalData: SavedAgentConfiguration = { ...currentFormData }; // Make a mutable copy

    // Ensure config exists, should always be true due to form structure
    if (!finalData.config) {
        // This case should ideally not happen if form is initialized correctly
        console.error("Agent config is missing in onSubmit!");
        // Potentially initialize to a default base config if absolutely necessary
        // For now, we'll assume config is present.
    }


    if (isSystemPromptManuallyEdited && typeof finalData.config.manualSystemPromptOverride === 'string') {
      finalData.config.systemPromptGenerated = finalData.config.manualSystemPromptOverride;
    }
    // According to the plan, manualSystemPromptOverride IS saved to the DB.
    // If we wanted to NOT save it, we would uncomment the next line:
    // delete finalData.config.manualSystemPromptOverride;

    // Update system prompt history
    const currentConfig = finalData.config; // Already type asserted or will be AgentConfigUnion
    const finalSystemPromptForHistory = currentConfig.systemPromptGenerated;

    if (finalSystemPromptForHistory) {
      let history = currentConfig.systemPromptHistory || [];
      // Avoid adding duplicate of the most recent prompt
      if (history.length === 0 || history[0].prompt !== finalSystemPromptForHistory) {
        history.unshift({ prompt: finalSystemPromptForHistory, timestamp: new Date().toISOString() });
      }
      // Keep last 3 versions (or whatever number is desired)
      currentConfig.systemPromptHistory = history.slice(0, 3);
    }

    const { id: saveToastId, update: updateSaveToast, dismiss: dismissSaveToast } = toast({
      title: "Saving Agent...",
      description: "Please wait while the configuration is being saved.",
      variant: "default",
    });

    try {
      // Ensure timestamps and versions are correctly handled before saving
      const now = new Date().toISOString();
      finalData.updatedAt = now; // Use finalData
      if (!finalData.createdAt) { // If it's a new agent (though default function sets it)
        finalData.createdAt = now; // Use finalData
      }
      // internalVersion could be incremented here if logic requires
      await onSave(finalData); // Use the potentially modified finalData

      updateSaveToast({
        title: "Success!",
        description: "Agent configuration saved successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to save agent configuration:", error);
      updateSaveToast({
        title: "Error Saving",
        description: "Failed to save agent configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => dismissSaveToast(), 5000); // Auto-dismiss after 5 seconds
    }
  };

  const handleSaveToGit = () => {
    toast({
      title: "Simulação: Salvo no Git",
      description: "A configuração do agente foi 'salva' no repositório Git (simulado).",
      duration: 3000,
    });
    // No actual Git operation
  };

  const handleRevertFromGit = () => {
    if (editingAgent) {
      // Re-use the logic from prepareFormDefaultValues to reset the form
      // This effectively reverts to the state when the dialog was opened for this agent.
      // In a real scenario, this would fetch from Git and then reset.
      const defaultValsForEditingAgent = prepareFormDefaultValues(editingAgent);
      methods.reset(defaultValsForEditingAgent);
      setIsSystemPromptManuallyEdited(!!defaultValsForEditingAgent.config.manualSystemPromptOverride);

      toast({
        title: "Simulação: Revertido do Git",
        description: "A configuração do agente foi 'revertida' para a última versão do Git (simulado e formulário resetado).",
        duration: 3000,
      });
    } else {
      toast({
        title: "Simulação: Revertido do Git",
        description: "Nenhum agente em edição para reverter (simulado).",
        variant: "default",
        duration: 3000,
      });
    }
  };

  /**
   * Fetches AI-generated suggestions for the agent's configuration.
   * It uses the current agent's goal and tasks as input for the AI flow.
   * Updates the `aiSuggestions` state with the response or an error message.
   */
  const handleGetAiSuggestions = async () => {
    // Start loading state and clear previous errors/suggestions
    setIsSuggesting(true);
    setSuggestionError(null);
    setAiSuggestions(null);
    const { id: suggestionToastId, update: updateSuggestionToast, dismiss: dismissSuggestionToast } = toast({
      title: "Fetching AI Suggestions...",
      description: "Please wait while we generate suggestions.",
    });

    try {
      // Get current agent goal and tasks from the form (assuming LLM type for these fields)
      const currentFormValues = methods.getValues();
      const currentConfig = currentFormValues.config as LLMAgentConfig;
      const agentGoalValue = currentConfig?.agentGoal;
      const agentTasksValue = currentConfig?.agentTasks;
      const currentToolsValue = currentFormValues.toolsDetails?.map(td => ({ // Get currently selected tools with their data
        id: td.id,
        name: td.name,
        description: td.description,
        configData: currentFormValues.toolConfigsApplied?.[td.id] // Include existing config
      }));


      // Basic validation: Ensure goal and tasks are defined before calling the AI.
      if (!agentGoalValue || !agentTasksValue || agentTasksValue.length === 0) {
        setSuggestionError("Por favor, defina o objetivo e as tarefas do agente primeiro para obter sugestões relevantes.");
        updateSuggestionToast({ title: "Input Required", description: "Goal and tasks must be set.", variant: "destructive" });
        setIsSuggesting(false);
        return;
      }

      // Call the AI configuration assistant flow
      // console.log("Requesting AI suggestions with goal:", agentGoalValue, "tasks:", agentTasksValue, "currentTools:", currentToolsValue);
      const response = await runFlow(aiConfigurationAssistantFlow, {
        agentGoal: agentGoalValue,
        agentTasks: agentTasksValue,
        suggestionContext: 'fullConfig', // Requesting a comprehensive set of suggestions
        currentTools: currentToolsValue, // Provide context of already selected/configured tools
        fullAgentConfig: methods.getValues() // Provide full config for broader context if needed by the flow
      });

      // console.log("AI suggestions received:", response);
      setAiSuggestions(response); // Store the suggestions
      updateSuggestionToast({ title: "Suggestions Ready", description: "AI suggestions have been loaded.", variant: "default" });

    } catch (error) {
      console.error("Failed to get AI suggestions:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setSuggestionError(`Falha ao obter sugestões da IA. ${errorMessage}`);
      updateSuggestionToast({ title: "Error Fetching Suggestions", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSuggesting(false); // Reset loading state
      setTimeout(() => dismissSuggestionToast(), 5000); // Dismiss toast after 5 seconds
    }
  };


  /**
   * Applies the AI-generated suggestions to the form fields.
   * Iterates through the `suggestionsToApply` object and updates the form
   * using `methods.setValue` for each relevant field.
   * @param suggestionsToApply The AI suggestions object from `aiSuggestions` state.
   */
  const handleApplySuggestions = (suggestionsToApply: AiConfigurationAssistantOutput) => {
    // console.log("Applying AI suggestions to form:", suggestionsToApply);
    const configPath = 'config'; // Base path for LLMAgentConfig fields within the form

    // Apply suggested personality
    if (suggestionsToApply.suggestedPersonality) {
      methods.setValue(`${configPath}.agentPersonality` as any, suggestionsToApply.suggestedPersonality, { shouldValidate: true, shouldDirty: true });
    }
    // Apply suggested restrictions
    if (suggestionsToApply.suggestedRestrictions) {
      methods.setValue(`${configPath}.agentRestrictions` as any, suggestionsToApply.suggestedRestrictions, { shouldValidate: true, shouldDirty: true });
    }
    // Apply suggested AI model
    if (suggestionsToApply.suggestedModel) {
      methods.setValue(`${configPath}.agentModel` as any, suggestionsToApply.suggestedModel, { shouldValidate: true, shouldDirty: true });
    }
    // Apply suggested temperature
    if (suggestionsToApply.suggestedTemperature !== undefined) {
      methods.setValue(`${configPath}.agentTemperature` as any, suggestionsToApply.suggestedTemperature, { shouldValidate: true, shouldDirty: true });
    }

    // Apply suggested tools and their configurations
    if (suggestionsToApply.suggestedTools && suggestionsToApply.suggestedTools.length > 0) {
      // Extract IDs of suggested tools
      const toolIds = suggestionsToApply.suggestedTools.map(t => t.id);
      methods.setValue('tools', toolIds, { shouldValidate: true, shouldDirty: true });

      // Update toolsDetails (name, description - assuming these are part of the suggestion)
      const toolsDetails = suggestionsToApply.suggestedTools.map(t => ({
        id: t.id,
        name: t.name,
        description: t.description
      }));
      methods.setValue('toolsDetails', toolsDetails, { shouldValidate: true, shouldDirty: true });

      // Apply suggested configuration data for each tool
      const currentToolConfigs = methods.getValues("toolConfigsApplied") || {};
      let updatedToolConfigs = { ...currentToolConfigs };
      suggestionsToApply.suggestedTools.forEach(toolSuggestion => {
        if (toolSuggestion.id && toolSuggestion.suggestedConfigData) {
          // This will merge suggested config with existing, or add new if toolId wasn't there.
          // For a more sophisticated merge, you might need a deep merge utility.
          updatedToolConfigs[toolSuggestion.id] = {
            ...(updatedToolConfigs[toolSuggestion.id] || {}),
            ...toolSuggestion.suggestedConfigData
          };
        }
      });
      methods.setValue("toolConfigsApplied", updatedToolConfigs, { shouldValidate: true, shouldDirty: true });
    }

    // TODO: Apply other suggestions like suggestedName, suggestedDescription, suggestedTasks if the UI/flow supports it directly.
    // For example, if there's a button to apply suggested tasks:
    // if (suggestionsToApply.suggestedTasks && suggestionsToApply.suggestedTasks.length > 0) {
    //   methods.setValue(`${configPath}.agentTasks`, suggestionsToApply.suggestedTasks, { shouldValidate: true, shouldDirty: true });
    // }

    setAiSuggestions(null); // Clear suggestions after applying them, closing the suggestion display
    toast({ title: "Suggestions Applied", description: "AI suggestions have been applied to the form.", variant: "default" });
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Process the file
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, tabOrder.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleExport = () => {
    // This function is now effectively replaced by handleGenerateManifest('json')
    // Keeping it here in case of other export types in future, but for now it's unused for manifest.
    const agentData = methods.getValues();
    const jsonString = generateAgentManifestJson(agentData);
    triggerDownload(jsonString, `${agentData.agentName || 'agent'}-manifest.json`, 'application/json');
    toast({
      title: "Agent Manifest (JSON) Gerado",
      description: "O manifesto do agente (JSON) foi baixado.",
    });
  };

  const triggerDownload = (content: string, fileName: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  const handleGenerateAgentCard = (format: 'json' | 'yaml') => {
    const agentData = methods.getValues();
    const agentName = agentData.name || 'agent'; // Use agent name for the file
    if (format === 'json') {
      const jsonString = generateAgentCardJson(agentData);
      triggerDownload(jsonString, `${agentName}-agent-card.json`, 'application/json');
    } else {
      const yamlString = generateAgentCardYaml(agentData);
      triggerDownload(yamlString, `${agentName}-agent-card.yaml`, 'application/x-yaml');

    }
    toast({
      title: "Agent Card Gerado",
      description: `O Agent Card (${format.toUpperCase()}) foi baixado.`,
    });
  };

  const handleGenerateManifest = (format: 'json' | 'yaml') => {
    const agentData = methods.getValues();
    const agentName = agentData.agentName || 'agent'; // Use agent name for the file
    if (format === 'json') {
      const jsonString = generateAgentManifestJson(agentData);
      triggerDownload(jsonString, `${agentName}-manifest.json`, 'application/json');
      toast({
        title: "Agent Manifest (JSON) Gerado",
        description: "O manifesto do agente (JSON) foi baixado.",
      });
    } else {
      const yamlString = generateAgentManifestYaml(agentData);
      triggerDownload(yamlString, `${agentName}-manifest.yaml`, 'application/x-yaml');
      toast({
        title: "Agent Manifest (YAML) Gerado",
        description: "O manifesto do agente (YAML) foi baixado.",
      });
    }
  };

  // const handleToolConfigure = (toolId: string) => { // REMOVED
  //   // Handle tool configuration
  // };

  const getTabStatusIcon = (tab: string) => {
    // Return appropriate icon based on tab status
    return null;
  };

  const options = availableTools.map(item => ({ value: item.id, label: item.name }));

  const tools: AvailableTool[] = availableTools.map(tool => ({
    ...tool,
    label: tool.name,
    type: tool.type || 'default',
    requiresAuth: tool.requiresAuth || false,
    serviceTypeRequired: tool.serviceTypeRequired || undefined
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange as (open: boolean) => void}>
      <DialogContent className="max-w-4xl p-0">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <DialogHeader className="p-6 pb-4 border-b">
              <div className="flex items-center">
                <DialogTitle>{editingAgent ? "Editar Agente IA" : "Criar Novo Agente IA"}</DialogTitle>
                {editingAgent && (
                  <Badge variant="outline" className="ml-3 text-sm">
                    Editando: {editingAgent.agentName}
                  </Badge>
                )}
              </div>
              <DialogDescription>
                {editingAgent ? `Modifique as configurações do agente.` : "Configure um novo agente inteligente para suas tarefas."}
              </DialogDescription>
              <input
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleFileImport}
                ref={fileInputRef}
              />
              <Button variant="outline" size="sm" type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 ml-auto"> {/* Added ml-auto to push to right */}
                <UploadCloud className="mr-2 h-4 w-4" /> {/* Or FileInput icon */}
                Importar Configuração
              </Button>
            </DialogHeader>
            <div className="p-6"> {/* This div will contain Tabs and its content, allowing padding */}
              <Tabs
                value={editingAgent === undefined ? tabOrder[currentStep] : activeEditTab}
                // defaultValue="general" // defaultValue might conflict with controlled value
                onValueChange={(value) => {
                  if (editingAgent === undefined) {
                    // In wizard mode, tab navigation is controlled by currentStep and Next/Previous buttons.
                    // Direct tab clicking is disabled by the 'disabled' prop on TabsTrigger.
                  } else {
                    // Edit mode: update activeEditTab when a tab is clicked.
                    setActiveEditTab(value);
                  }
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-11 mb-6"> {/* Adjusted for 11 tabs after removing configPrincipal */}
                  {/* Updated TabsTrigger props - Filter out "configPrincipal" if it was in tabOrder */}
                  {tabOrder.filter(tab => tab !== "configPrincipal").map((tab, index) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      disabled={editingAgent === undefined && index > currentStep && tab !== "review"}
                      statusIcon={getTabStatusIcon(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/_/g, " ")}
                    </TabsTrigger>
                  ))}
                </TabsList>

                
                {/* This div will contain all TabsContent and allow scrolling */}
                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    {/* The TabsContent for "configPrincipal" is removed. */}

                {/* General Tab */}
                <TabsContent value="general">
                  <GeneralTab
                    // agentTypeOptions is passed to GeneralTab which uses RHF for config.type
                    // So, local agentTypeLocal and handleAgentTypeChange are no longer needed for this.
                    agentTypeOptions={propAgentTypeOptions.map(opt => ({value: opt.id, label: opt.label}))} // Ensure correct format for GeneralTab
                    agentFrameworkOptions={[ // This should be centrally managed or passed if dynamic
                      { value: "genkit", label: "Genkit (Default)" },
                      { value: "langchain", label: "Langchain (Simulated)" },
                      { value: "crewai", label: "CrewAI (Simulated)" },
                      { value: "custom", label: "Custom Genkit Flow" },
                      { value: "none", label: "None (Agent will not be directly executable)" }
                    ]}
                    availableTools={availableTools}
                    SparklesIcon={Wand2} // Assuming Wand2 is appropriate
                    showHelpModal={showHelpModal}
                  />

                  {/* Workflow Steps UI - Rendered conditionally within General Tab Content */}
                  {/* This uses agentTypeRHF (which is watch('config.type')) */}
                  {agentTypeRHF === 'workflow' && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Passos do Workflow</CardTitle>
                        <CardDescription>Defina os passos sequenciais para este agente workflow.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {fields.map((item, index) => ( // `fields` comes from useFieldArray for "config.workflowSteps"
                          <Card key={item.id} className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-semibold">Passo {index + 1}</h4>
                              <Button variant="ghost" size="sm" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {/* FormField components for each step property, e.g., name, agentId, description, inputMapping, outputKey */}
                            {/* These directly use RHF's `control` */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={control}
                                name={`config.workflowSteps.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome do Passo (Opcional)</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="Ex: Validar Pedido" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={control}
                                name={`config.workflowSteps.${index}.agentId`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Agente ID</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione um agente" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {availableAgentsForSubSelector.map(agent => (
                                          <SelectItem key={agent.id} value={agent.id}>
                                            {agent.agentName}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>

                                )}
                              />
                            </div>
                            <FormField
                              control={control}
                              name={`config.workflowSteps.${index}.description`}
                              render={({ field }) => (
                                <FormItem className="mt-4">
                                  <FormLabel>Descrição do Passo (Opcional)</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Ex: Este passo verifica os detalhes do pedido..." />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={control}
                              name={`config.workflowSteps.${index}.inputMapping`}
                              render={({ field }) => (
                                <FormItem className="mt-4">
                                  <FormLabel>Mapeamento de Input (JSON)</FormLabel>
                                  <FormControl>
                                    <JsonEditorField
                                      value={field.value as string | Record<string, any>} // Expects string or object
                                      onChange={(value) => field.onChange(typeof value === 'object' ? JSON.stringify(value) : value)}
                                      height="150px"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={control}
                              name={`config.workflowSteps.${index}.outputKey`}
                              render={({ field }) => (
                                <FormItem className="mt-4">
                                  <FormLabel>Chave de Saída</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Ex: resultadoValidacao" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </Card>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => append({ agentId: '', inputMapping: '{}', outputKey: '', name: '', description: '' } as WorkflowStep)}
                          className="mt-4"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Adicionar Passo
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Tools Tab */}
                <TabsContent value="tools">
                  <Suspense fallback={<LoadingFallback />}>
                    <ToolsTab
                      availableTools={availableTools}
                      // selectedTools, setSelectedTools, toolConfigurations are from useFormContext
                      handleToolConfigure={onConfigureToolInDialog} // Pass the handler to ToolsTab
                      iconComponents={iconComponents}
                      InfoIconComponent={InfoIcon}
                      SettingsIcon={Settings}
                      CheckIcon={Check}
                      PlusCircleIcon={PlusCircle}
                      Trash2Icon={Trash2}
                      showHelpModal={showHelpModal}
                      availableApiKeys={availableApiKeys || []}
                      mcpServers={mcpServers} // Pass mcpServers from props (which defaults to mockMcpServers)
                    />
                  </Suspense>
                </TabsContent>

                {/* Behavior Tab - Now uses RHF context */}
                <TabsContent value="behavior">
                  <Suspense fallback={<LoadingFallback />}>
                    <BehaviorTab
                      agentToneOptions={agentToneOptions}
                      showHelpModal={showHelpModal}
                      onGetAiSuggestions={handleGetAiSuggestions}
                      isSuggesting={isSuggesting}
                      // Props for manual system prompt editing passed to BehaviorTab
                      isSystemPromptManuallyEdited={isSystemPromptManuallyEdited}
                      setIsSystemPromptManuallyEdited={setIsSystemPromptManuallyEdited}
                    />
                  </Suspense>
                </TabsContent>

                {/* Memory & Knowledge Tab */}
                <TabsContent value="memory_knowledge" className="space-y-6 mt-4">
                  <Suspense fallback={<LoadingFallback />}>
                    <Alert>
                      <Brain className="h-4 w-4" />
                      <AlertTitle>Memória & Conhecimento</AlertTitle>
                    <AlertDescription>
                      Configure a persistência de estado do agente e a capacidade de usar RAG (Retrieval Augmented Generation) para acesso a conhecimento externo.
                    </AlertDescription>
                  </Alert>
                  <StateMemoryTab
                    // Form-related props removed. StateMemoryTab will use useFormContext.
                    // It needs to be updated to watch "config.statePersistence.enabled",
                    // and use Controller for fields like "config.statePersistence.type",
                    // "config.statePersistence.initialStateValues" etc.
                    // The types for persistenceType 'local' | 'indexedDB' also need to align with StatePersistenceType ('session' | 'memory' | 'database')
                    // from agent-configs.ts. This will be part of StateMemoryTab's own refactoring.
                    SaveIcon={Save}
                    ListChecksIcon={ListChecks}
                    PlusIcon={Plus}
                    Trash2Icon={Trash2}
                    InfoIcon={InfoIcon} // Pass the imported InfoIcon
                    showHelpModal={showHelpModal}
                  />
                    <Separator className="my-6" />
                    <RagTab
                      // Form-related props removed. RagTab will use useFormContext.
                      // It needs to be updated to watch "config.rag.enabled" and use Controller
                    // for fields within "config.rag.*".
                    // The structure of ragMemoryConfig also needs to align with RagMemoryConfig from agent-configs.ts.
                    SearchIcon={Search}
                    UploadCloudIcon={UploadCloud}
                    FileTextIcon={FileText}
                    PlusIcon={Plus}
                    Trash2Icon={Trash2}
                    InfoIcon={InfoIcon} // Pass the imported InfoIcon
                    showHelpModal={showHelpModal}
                    />
                  </Suspense>
                </TabsContent>

                {/* Artifacts Tab */}
                <TabsContent value="artifacts">
                  <Suspense fallback={<LoadingFallback />}>
                    <ArtifactsTab
                      // Form-related props removed. ArtifactsTab will use useFormContext.
                      // It needs to be updated to use Controller for fields like "config.artifacts.enabled",
                    // "config.artifacts.storageType", "config.artifacts.definitions", etc.
                    // The type for artifactStorageType ('local' | 'cloud') needs to align with
                    // ArtifactStorageType ('local' | 'cloud' | 'memory' | 'filesystem') from agent-configs.ts.
                    FileJsonIcon={FileJson}
                    UploadCloudIcon={UploadCloud}
                    BinaryIcon={Binary}
                    PlusIcon={Plus}
                    Trash2Icon={Trash2}
                    InfoIcon={InfoIcon} // Pass the imported InfoIcon
                    showHelpModal={showHelpModal}
                    />
                  </Suspense>
                </TabsContent>

                {/* A2A Communication Tab */}
                <TabsContent value="a2a" className="space-y-6 mt-4">
                  <Suspense fallback={<LoadingFallback />}>
                    <Alert>
                      <Share2 className="h-4 w-4" />
                      <AlertTitle>Comunicação Agente-Agente (A2A)</AlertTitle>
                    <AlertDescription>
                      Configure como este agente se comunica com outros agentes no sistema, incluindo canais e protocolos.
                    </AlertDescription>
                  </Alert>
                  <Card>
                    <CardHeader>
                      {/* Title and Description are now part of A2AConfigComponent */}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* The A2AConfigComponent will have its own internal switch for enabling/disabling */}
                      {/* It will use useFormContext to manage config.a2a directly */}
                      {/* savedAgents prop removed as A2AConfigTab uses useAppContext for agent list */}
                      <A2AConfig
                        showHelpModal={showHelpModal}
                        PlusIcon={Plus} // Added PlusIcon
                        Trash2Icon={Trash2} // Added Trash2Icon
                      />
                    </CardContent>
                    </Card>
                  </Suspense>
                </TabsContent>

                {/* Multi-Agent & Advanced Tab */}
                <TabsContent value="multi_agent_advanced" className="space-y-6 mt-4">
                  <Suspense fallback={<LoadingFallback />}>
                    <Alert>
                      <Users className="h-4 w-4" />
                      <AlertTitle>Multi-Agente & Configurações Avançadas</AlertTitle>
                    <AlertDescription>
                      Defina o papel deste agente em uma colaboração (raiz ou sub-agente), configure sub-agentes e outras configurações avançadas do sistema.
                    </AlertDescription>
                  </Alert>
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Hierarquia e Colaboração Multi-Agente</CardTitle>
                      <CardDescription>
                        Defina o papel do agente (raiz ou sub-agente) e gerencie seus colaboradores.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <MultiAgentTab
                        // Form-related props removed. MultiAgentTab will use useFormContext.
                        // It needs to be updated to use Controller for "config.isRootAgent", "config.subAgentIds".
                        // The previous mapping of isRootAgent to "config.a2a.enabled" was incorrect for SavedAgentConfiguration.
                        availableAgentsForSubSelector={availableAgentsForSubSelector}
                        SubAgentSelectorComponent={SubAgentSelector} // Keep passing component
                        UsersIcon={Users}
                        LayersIcon={Layers}
                        InfoIcon={InfoIcon} // Pass the imported InfoIcon
                        ChevronsUpDownIcon={ChevronsUpDown}
                        PlusCircleIcon={PlusCircle}
                        Trash2Icon={Trash2}
                        showHelpModal={showHelpModal}
                      />
                      {/* The globalInstruction field is now handled within MultiAgentTab.tsx */}
                    </CardContent>
                    </Card>
                    {/* This section seems to be a placeholder, no RHF fields to change here yet */}
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle className="text-muted-foreground/70">Outras Configurações Avançadas (Não Multi-Agente)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Configurações adicionais...
                        </p>
                      </CardContent>
                    </Card>
                  </Suspense>
                </TabsContent>

                {/* Evaluation and Security Tab (Task 9.4) */}
                <TabsContent value="evaluation_security">
                  <Suspense fallback={<LoadingFallback />}>
                    <EvaluationSecurityTab /> {/* Assume this new component is created */}
                  </Suspense>
                </TabsContent>

                {/* Review Tab */}
                <TabsContent value="review">
                  <Suspense fallback={<LoadingFallback />}>
                    <ReviewTab
                      setActiveEditTab={setActiveEditTab}
                      showHelpModal={showHelpModal}
                      availableTools={availableTools} // Pass availableTools
                    />
                  </Suspense>
                </TabsContent>

                {/* Deploy Tab */}
                <TabsContent value="deploy">
                  <Suspense fallback={<LoadingFallback />}>
                    <DeployTab />
                  </Suspense>
                </TabsContent>

                {/* Callbacks Tab */}
                <TabsContent value="callbacks" className="space-y-6 mt-4">
                  <Suspense fallback={<LoadingFallback />}>
                    <CallbacksTab />
                  </Suspense>
                </TabsContent>

                {/* Advanced Tab (ADK Callbacks) */}
                <TabsContent value="advanced" className="space-y-6 mt-4">
                  <Suspense fallback={<LoadingFallback />}>
                    <AdvancedSettingsTab />
                  </Suspense>
                </TabsContent>

              </Tabs>
            </div>

            <DialogFooter className="p-6 pt-4 border-t">
              {helpModalContent && (
                <HelpModal
                  isOpen={isHelpModalOpen}
                  onClose={() => setIsHelpModalOpen(false)}
                  title={helpModalContent.title}
                >
                  {helpModalContent.body}
                </HelpModal>
              )}
              {editingAgent === undefined ? (
                // New agent wizard flow
                <div className="flex justify-between w-full">
                  <Button variant="outline" type="button" onClick={() => { onOpenChange(false); setCurrentStep(0); }}>Cancelar</Button>
                  <div className="flex gap-2">
                    <Button type="button" onClick={handlePrevious} disabled={currentStep === 0}>
                      Anterior
                    </Button>
                    {/* Show "Next" if not the step before "review" and not the last step overall */}
                    {currentStep < tabOrder.length - 1 && tabOrder[currentStep + 1] !== "review" && (
                      <Button type="button" onClick={handleNext}>
                        Próximo
                      </Button>
                    )}
                    {/* Show "Revisar" if the next step is "review" */}
                    {currentStep < tabOrder.length - 1 && tabOrder[currentStep + 1] === "review" && (
                      <Button type="button" onClick={handleNext}>
                        Revisar
                      </Button>
                    )}
                    {/* Show "Salvar Agente" only on the "review" tab */}
                    {tabOrder[currentStep] === "review" && (
                      <Button type="submit" disabled={!methods.formState.isValid || methods.formState.isSubmitting}>
                        {methods.formState.isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Salvar Agente
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                // Editing existing agent
                <>
                  <div className="mr-auto flex flex-wrap gap-2"> {/* Container for left-aligned buttons, added flex-wrap */}
                    <Button variant="outline" type="button" onClick={() => handleGenerateManifest('json')}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Manifesto (JSON)
                    </Button>
                    <Button variant="outline" type="button" onClick={() => handleGenerateManifest('yaml')}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Manifesto (YAML)
                    </Button>
                    {/* Git Simulation Buttons */}
                    <Button variant="outline" type="button" onClick={handleSaveToGit}>
                      <GitCommit className="mr-2 h-4 w-4" />
                      Salvar no Git (Simulado)
                    </Button>
                    <Button variant="outline" type="button" onClick={handleRevertFromGit}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reverter do Git (Simulado)
                    </Button>
                  </div>
                  <DialogClose asChild>
                    <Button variant="outline" type="button">Cancelar</Button>
                  </DialogClose>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => {
                      if (editingAgent) {
                        const defaultVals = prepareFormDefaultValues(editingAgent);
                        methods.reset(defaultVals);
                        // Also reset the manual edit state based on the override field from default values
                        setIsSystemPromptManuallyEdited(!!defaultVals.config.manualSystemPromptOverride);
                        toast({
                          title: "Alterações Revertidas",
                          description: "Os dados do formulário foram revertidos para o original.",
                        });
                      }
                    }}
                    className="mr-2" // Added margin for spacing
                  >
                    <Undo2 className="mr-2 h-4 w-4" />
                    Reverter
                  </Button>
                  <Button type="submit" disabled={methods.formState.isSubmitting}>
                    {methods.formState.isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    <Button type="submit" disabled={!methods.formState.isValid || methods.formState.isSubmitting}>
                      {methods.formState.isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Salvar Agente
                    </Button>
                  </>
                )}
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    );
  };

  export default AgentBuilderDialog;

// Adicionado export default para garantir compatibilidade com import dinâmico
export default AgentBuilderDialog;
