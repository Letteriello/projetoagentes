
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

import type {
  AvailableTool, // This should come from agent-types now, which re-exports from tool-types
  A2AAgentConfig, // This is a specific config type, ensure it matches or is properly used
  SavedAgentConfiguration, // Import from agent-types for mapToPageAgentConfig parameter
  AgentConfig, // Keep AgentConfig from agent-types.ts for internal use if needed
  LLMAgentConfig, // Keep LLMAgentConfig from agent-types.ts
  WorkflowAgentConfig, // Keep WorkflowAgentConfig from agent-types.ts
  CustomAgentConfig, // Keep CustomAgentConfig from agent-types.ts
  ToolConfigData, // Keep ToolConfigData from agent-types.ts
  AgentConfigBase, // Keep AgentConfigBase from agent-types.ts

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
  // Wand2 // Already imported
} from 'lucide-react';

import { HelpModal } from '@/components/ui/HelpModal';
import { generateAgentCardJson, generateAgentCardYaml } from '../../../lib/agent-utils'; // Added import
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
  AgentConfig as AgentConfigUnion, // Keep alias
  LLMAgentConfig,
  WorkflowAgentConfig,
  CustomAgentConfig,
  A2AAgentSpecialistConfig,
  ToolConfigData,
  StatePersistenceConfig,
  RagMemoryConfig,
  ArtifactsConfig, // Existing import
  ArtifactStorageType, // Import for DEFAULT_ARTIFACTS_CONFIG
  A2AConfig as AgentA2AConfig, // Keep alias
  AvailableTool, // Now from agent-types
  AgentType, // Added as per subtask example
  EvaluationGuardrails, // Added for Task 9.4
  AgentFramework, // Added as per subtask example
  // WorkflowStep // Removed from here if it was, will be specifically imported
  // Add any other specific config types that were imported from agent-configs-fixed if they were missed
  // For example, if WorkflowDetailedType, TerminationConditionType etc. were used here, they would be added.
  // For now, sticking to the explicitly mentioned ones and those directly replacing the old imports.

} from '@/types/agent-types';
// Import WorkflowStep directly from agent-configs-new
import { WorkflowStep } from '@/types/agent-configs-new';


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
  agentTypeOptions: Array<{ id: "llm" | "workflow" | "custom" | "a2a"; label: string; icon?: React.ReactNode; description: string; }>;
  agentToneOptions: Array<{ id: string; label: string; }>; // Prop type for agentToneOptions
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>;
}

type BaseAgentType = "llm" | "workflow" | "custom";
// Extended AgentType to include more specific workflow/task types if dialog needs to handle them
type DialogAgentType = PageAgentConfig['agentType'] | "a2a" | "task" | "sequential" | "parallel" | "loop" ; // PageAgentConfig['agentType'] already includes most of these
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
  const [agentPersonality, setAgentPersonality] = React.useState(editingAgent?.agentPersonality || (pageAgentToneOptions.length > 0 ? pageAgentToneOptions[0].label : ""));
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


  const [enableArtifacts, setEnableArtifacts] = React.useState<boolean>(editingAgent?.enableArtifacts || false);
  const [artifactStorageType, setArtifactStorageType] = React.useState<'memory' | 'filesystem' | 'cloud'>(editingAgent?.artifactStorageType || 'memory');
  const [artifacts, setArtifacts] = React.useState<SharedArtifactDefinition[]>(editingAgent?.artifacts || []);
  const [cloudStorageBucket, setCloudStorageBucket] = React.useState<string>(editingAgent?.cloudStorageBucket || '');
  const [localStoragePath, setLocalStoragePath] = React.useState<string>(editingAgent?.localStoragePath || '');

  const [a2aConfig, setA2AConfig] = React.useState<SharedA2AConfigType>(
    editingAgent?.a2aConfig || {
      enabled: false, communicationChannels: [], defaultResponseFormat: 'json', // Make sure defaultResponseFormat matches SharedA2AConfigType
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

  const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, PageToolConfigData>>(editingAgent?.toolConfigsApplied || {}); // Uses PageToolConfigData from page.tsx
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false);
  const [configuringTool, setConfiguringTool] = React.useState<AvailableTool | null>(null); // Uses AvailableTool from agent-types.ts

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
    setAgentPersonality(config.agentPersonality || defaultLLMConfigValues.agentPersonality || (pageAgentToneOptions.length > 0 ? pageAgentToneOptions[0].label : ""));
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
 * Constructs a system prompt string based on the agent's configuration.
 * This prompt is typically used to guide the behavior of an LLM agent.
 * It incorporates AI suggestions for personality, tasks, and restrictions if available,
 * otherwise, it falls back to the manually configured values.
 *
 * @param config The agent's configuration object (LLMAgentConfig or WorkflowAgentConfig).
 * @param availableAgents A list of available agents, used for resolving agent IDs in workflow steps.
 * @param aiSuggestions Optional AI-generated suggestions that can override parts of the manual config.
 * @param allAvailableTools Full list of tools available in the system.
 * @param selectedToolsDetails List of tools currently selected/configured for this agent.
 * @returns A string representing the constructed system prompt.
 */
const constructSystemPrompt = (
  config: AgentConfigUnion | null | undefined,
  availableAgents: Array<{ id: string; agentName: string }>,
  aiSuggestions?: AiConfigurationAssistantOutput | null,
  allAvailableTools?: AvailableTool[], // Added: Full list of tools
  selectedToolsDetails?: Array<{ id: string; name: string; description: string }> // Added: Selected tools for the agent
): string => {
  if (!config) return "No configuration provided."; // Should not happen with proper form initialization

  let promptParts: string[] = [];

  if (config.type === 'llm') {
    const llmConfig = config as LLMAgentConfig;

    // --- Personality ---
    // Use AI suggested personality if available, otherwise use the one from the form.
    const personality = aiSuggestions?.suggestedPersonality || llmConfig.agentPersonality;
    promptParts.push(`You are an AI agent${personality ? ` with the personality of a ${personality}` : ''}.`);

    // --- Goal ---
    // The agent's goal is fundamental and primarily driven by manual configuration.
    // AI suggestions could refine it, but that's not implemented here.
    if (llmConfig.agentGoal) {
      promptParts.push(`Your primary goal is: ${llmConfig.agentGoal}.`);
    }

    // --- Tasks ---
    // Use AI suggested tasks if available and they are not empty, otherwise use form tasks.
    const tasksToUse = (aiSuggestions?.suggestedTasks && aiSuggestions.suggestedTasks.length > 0)
      ? aiSuggestions.suggestedTasks
      : llmConfig.agentTasks;
    if (tasksToUse && tasksToUse.length > 0) {
      promptParts.push("To achieve this goal, you must perform the following tasks:");
      promptParts.push(...tasksToUse.map(task => `- ${task}`));
    }

    // --- Restrictions ---
    // Use AI suggested restrictions if available and not empty, otherwise use form restrictions.
    const restrictionsToUse = (aiSuggestions?.suggestedRestrictions && aiSuggestions.suggestedRestrictions.length > 0)
      ? aiSuggestions.suggestedRestrictions
      : llmConfig.agentRestrictions;
    if (restrictionsToUse && restrictionsToUse.length > 0) {
      promptParts.push("\nYou must adhere to the following restrictions:");
      promptParts.push(...restrictionsToUse.map(restriction => `- ${restriction}`));
    }

    // --- Available Tools ---
    if (allAvailableTools && selectedToolsDetails && selectedToolsDetails.length > 0) {
      promptParts.push("\nFerramentas Disponíveis:");
      selectedToolsDetails.forEach(selectedToolInfo => {
        const fullToolDetail = allAvailableTools.find(t => t.id === selectedToolInfo.id);
        if (fullToolDetail) {
          promptParts.push(`- Nome: ${fullToolDetail.name}`);
          promptParts.push(`  Descrição: ${fullToolDetail.description}`);
          // Assuming AvailableTool now has inputSchema: string (as per plan)
          const snippet = generateToolSnippet(fullToolDetail.name, fullToolDetail.inputSchema);
          if (snippet) {
            promptParts.push(`  Uso: ${snippet}`);
          }
        }
      });
    }


  const constructSystemPrompt = () => {
    let systemPromptText = `Você é um agente de IA. Seu nome é "${agentName || 'Agente'}".\n`;
    if (agentDescription) {
      systemPromptText += `Sua descrição geral é: "${agentDescription}".\n`;
    }
  
    const agentTypeDetail = propAgentTypeOptions.find(opt => opt.id === agentType); // Use propAgentTypeOptions
    if(agentTypeDetail){
      systemPromptText += `Seu tipo principal é ${agentTypeDetail.label.split(' (')[0].trim()}. ${agentTypeDetail.description}\n`;
    }
  
    if (agentType === 'workflow') {
        if (detailedWorkflowType) systemPromptText += `Subtipo de fluxo de trabalho: ${detailedWorkflowType}.\n`;
        if (workflowDescription) systemPromptText += `Descrição do fluxo: ${workflowDescription}.\n`;
        if(detailedWorkflowType === 'loop' && loopMaxIterations) systemPromptText += `O loop repetirá no máximo ${loopMaxIterations} vezes.\n`;
        if(detailedWorkflowType === 'loop' && loopTerminationConditionType === 'subagent_signal') {
            systemPromptText += `O loop também pode terminar se um subagente sinalizar (ex: via ferramenta '${loopExitToolName || 'exit_loop'}' ou estado '${loopExitStateKey || 'status_documento'}' atingir '${loopExitStateValue || 'FINALIZADO'}').\n`;
        }
    } else if (agentType === 'custom' || agentType === 'a2a') {
        if (customLogicDescription) systemPromptText += `Descrição da lógica customizada/interação: ${customLogicDescription}.\n`;
    }
    
    const selectedToolObjects = currentAgentTools
        .map(toolId => availableTools.find(t => t.id === toolId))
        .filter(Boolean) as AvailableTool[];

    if (selectedToolObjects.length > 0) {
        systemPromptText += `\nFERRAMENTAS DISPONÍVEIS PARA USO (Você deve decidir quando e como usá-las):\n`;
        selectedToolObjects.forEach(tool => { // tool here is AvailableTool
            const currentToolConfig = toolConfigurations[tool.id];
            let statusMessage = "";
            if (getNeedsConfiguration(tool)) {
                const isConfigured = 
                    (tool.id === 'webSearch' && currentToolConfig?.googleApiKey && currentToolConfig?.googleCseId) ||
                    (tool.id === 'customApiIntegration' && currentToolConfig?.openapiSpecUrl) ||
                    (tool.id === 'databaseAccess' && (currentToolConfig?.dbConnectionString || (currentToolConfig?.dbHost && currentToolConfig?.dbName))) ||
                    (tool.id === 'knowledgeBase' && currentToolConfig?.knowledgeBaseId) ||
                    (tool.id === 'calendarAccess' && currentToolConfig?.calendarApiEndpoint) ||
                    (!['webSearch', 'customApiIntegration', 'databaseAccess', 'knowledgeBase', 'calendarAccess'].includes(tool.id) && currentToolConfig && Object.keys(currentToolConfig).length > 0);
                statusMessage = isConfigured ? "(Status: Configurada e pronta para uso)" : "(Status: Requer configuração. Verifique antes de usar ou informe a necessidade de configuração)";
            }
            const toolName = typeof tool.name === 'string' ? tool.name : (typeof (tool as any).label === 'string' ? (tool as any).label : tool.id);
            const toolNameForPrompt = getToolGenkitName(tool) || toolName.replace(/\s+/g, '');
            const toolDesc = typeof tool.description === 'string' ? tool.description : '';
            systemPromptText += `- Nome da Ferramenta para uso: '${toolNameForPrompt}'. Descrição: ${toolDesc} ${statusMessage}\n`;
        });
        systemPromptText += "\n";
    } else {
        systemPromptText += `Nenhuma ferramenta externa está configurada para este agente.\n\n`;
    }

    const isLLMRelevant = ['llm', 'task', 'a2a'].includes(agentType) ||
                         ( ['workflow', 'custom'].includes(agentType) &&
                           (agentGoal || agentTasks || agentPersonality || agentRestrictions || agentModel) );

    if (isLLMRelevant) {
        systemPromptText += "\nA seguir, as instruções de comportamento para qualquer capacidade de LLM que você possua:\n\n";
        if (agentGoal) systemPromptText += `OBJETIVO PRINCIPAL:\n${agentGoal}\n\n`;
        if (agentTasks) systemPromptText += `TAREFAS PRINCIPAIS A SEREM REALIZADAS:\n${agentTasks}\n\n`;
        if (agentPersonality) systemPromptText += `PERSONALIDADE/TOM DE COMUNICAÇÃO:\n${agentPersonality}\n\n`;
        if (agentRestrictions) systemPromptText += `RESTRIÇÕES E DIRETRIZES IMPORTANTES A SEGUIR RIGOROSAMENTE:\n${agentRestrictions}\n\n`;
    }

  // handleSaveToolConfiguration is defined later in the file, so we'll remove this duplicate

  const handleInternalSave = () => {
    if (!agentName) {
      toast({ title: "Campo Obrigatório", description: "Nome do Agente é obrigatório.", variant: "destructive" });
      return;
    }
    const systemPromptGenerated = constructSystemPrompt(); // Ensure this matches the renamed variable
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
              needsConfiguration: getNeedsConfiguration(tool), // Use helper, ensures it checks tool.hasConfig
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

    return promptParts.join('\n');
  } else if (config.type === 'workflow') {
    const wfConfig = config as WorkflowAgentConfig;
    promptParts.push("You are a workflow orchestrator agent.");
    if (wfConfig.agentGoal) {
      promptParts.push(`Your primary goal is: ${wfConfig.agentGoal}.`);
    }
    if (wfConfig.workflowType) {
      promptParts.push(`This is a '${wfConfig.workflowType}' workflow, executing the following steps:`);
    }
    if (wfConfig.workflowSteps && wfConfig.workflowSteps.length > 0) {
      const stepDescriptions = wfConfig.workflowSteps.map((step, index) => {
        const agentName = availableAgents.find(a => a.id === step.agentId)?.agentName || step.agentId || "Unknown Agent";
        let inputMappingStr = typeof step.inputMapping === 'string' ? step.inputMapping : JSON.stringify(step.inputMapping);
        try {
          // Attempt to parse and re-stringify for consistent formatting if it's a JSON string
          inputMappingStr = JSON.stringify(JSON.parse(inputMappingStr), null, 2);
        } catch (e) {
          // If it's not a valid JSON string, use it as is
        }

        return `\nStep ${index + 1}: ${step.name || 'Unnamed Step'}
  Description: ${step.description || 'N/A'}
  Agent: ${agentName}
  Input Mapping: ${inputMappingStr}
  Output Key: ${step.outputKey || 'N/A'}`;
      });
      promptParts.push(...stepDescriptions);
    } else {
      promptParts.push("No workflow steps defined.");
    }
    return promptParts.join('\n');
  }

  return "System prompt generation for this agent type is not yet configured.";
};

// Fallback component for lazy loading
const LoadingFallback = () => <div>Loading tab...</div>;

// Define a default for ArtifactsConfig to ensure it's always present
const DEFAULT_ARTIFACTS_CONFIG: ArtifactsConfig = {
  enabled: false,
  storageType: 'memory' as ArtifactStorageType, // Default to 'memory'
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
}

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
        framework: 'genkit', // Default framework
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

  const { control, watch, setValue, getValues } = methods; // Get control, watch,setValue, getValues from methods
  const agentType = watch("config.type");
  const agentGoal = watch("config.agentGoal");
  const agentTasks = watch("config.agentTasks");
  const agentPersonality = watch("config.agentPersonality");
  const agentRestrictions = watch("config.agentRestrictions");
  const workflowType = watch("config.workflowType");
  const workflowSteps = watch("config.workflowSteps");
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
      const currentFullConfig = getValues(); // Includes 'tools' and 'toolsDetails'
      const currentAgentConfig = currentFullConfig.config;

      if (currentAgentConfig) {
        const newPromptString = constructSystemPrompt(
          currentAgentConfig,
          availableAgentsForSubSelector,
          aiSuggestions, // Pass current AI suggestions to the prompt constructor
          availableTools, // Pass the master list of all available tools
          currentFullConfig.toolsDetails // Pass the details of currently selected tools for this agent
        );
        // Check if the new prompt is different before setting to avoid unnecessary re-renders/dirtying
        if (newPromptString !== getValues('config.systemPromptGenerated')) {
          setValue('config.systemPromptGenerated', newPromptString, {
            shouldDirty: false, // Auto-generation should not dirty the form initially
            shouldValidate: false,
          });
        }
      }
    }
  }, [
    // Dependencies that trigger system prompt regeneration:
    agentType,
    agentGoal,
    agentTasks,
    agentPersonality,
    agentRestrictions,
    workflowType,
    workflowSteps,
    availableAgentsForSubSelector,
    aiSuggestions,
    setValue,
    getValues,
    isSystemPromptManuallyEdited, // Key dependency to control auto-generation
    availableTools, // Added: Master list of tools from props
    watch('toolsDetails') // Added: Watch selected tools details, as this influences the prompt
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
      setTimeout(() => dismissSaveToast(), 5000);
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
    // Handle export logic
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
                <TabsList className="grid w-full grid-cols-12 mb-6"> {/* Adjusted for 12 tabs */}
                  {/* Updated TabsTrigger props */}
                  {tabOrder.map((tab, index) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      disabled={editingAgent === undefined && index > currentStep && tab !== "review"} // Keep review tab accessible if others are disabled
                      // onClick is not needed here as onValueChange on Tabs handles it.
                      // However, if you need specific logic per trigger click beyond what onValueChange provides:
                      // onClick={() => {
                      //   if (editingAgent !== undefined) {
                      //     setActiveEditTab(tab);
                      //   } else {
                      //     // Wizard mode logic if needed, though disabled prop should prevent most clicks
                      //     if (index <= currentStep) {
                      //       // Potentially allow jumping back in wizard
                      //       // setCurrentStep(index); // This would make tabs navigable in wizard
                      //     }
                      //   }
                      // }}
                      statusIcon={getTabStatusIcon(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/_/g, " ")} {/* Format tab name */}
                    </TabsTrigger>
                  ))}
                  {/* Original TabsTriggers are replaced by the map above */}
                  {/* <TabsTrigger value="general" statusIcon={getTabStatusIcon("general")} disabled={editingAgent === undefined}>Geral</TabsTrigger>
                  <TabsTrigger value="behavior" statusIcon={getTabStatusIcon("behavior")} disabled={editingAgent === undefined}>Comportamento</TabsTrigger>
                  <TabsTrigger value="tools" statusIcon={getTabStatusIcon("tools")} disabled={editingAgent === undefined}>Ferramentas</TabsTrigger>
                  <TabsTrigger value="memory_knowledge" statusIcon={getTabStatusIcon("memory_knowledge")} disabled={editingAgent === undefined}>Memória & Conhecimento</TabsTrigger>
                  <TabsTrigger value="artifacts" statusIcon={getTabStatusIcon("artifacts")} disabled={editingAgent === undefined}>Artefatos</TabsTrigger>
                  <TabsTrigger value="a2a" statusIcon={getTabStatusIcon("a2a")} disabled={editingAgent === undefined}>Comunicação A2A</TabsTrigger>
                  <TabsTrigger value="multi_agent_advanced" statusIcon={getTabStatusIcon("multi_agent_advanced")} disabled={editingAgent === undefined}>Multi-Agente</TabsTrigger>
                  <TabsTrigger value="advanced" statusIcon={getTabStatusIcon("advanced")} disabled={editingAgent === undefined}>Avançado</TabsTrigger>
                  <TabsTrigger value="review" statusIcon={getTabStatusIcon("review")} disabled={editingAgent === undefined}>Revisar</TabsTrigger> */}
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
                                                {propAgentTypeOptions.map((opt: typeof propAgentTypeOptions[number]) => <li key={opt.id}><strong>{opt.label.split(' (')[0]}:</strong> {opt.description}</li>)}
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                </Label>
                                <Select value={agentType} onValueChange={handleAgentTypeChange}>
                                    <SelectTrigger id="agentType" className="h-10"><SelectValue placeholder="Selecione o tipo de agente" /></SelectTrigger>
                                    <SelectContent>
                                        {propAgentTypeOptions.map((option: typeof propAgentTypeOptions[number]) => (
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



                {/* General Tab */}
                <TabsContent value="general">
                  <GeneralTab
                    agentTypeOptions={agentTypeOptions}
                    // agentFrameworkOptions={agentFrameworkOptions} // This prop seems to be missing in GeneralTab's definition based on previous files
                    availableTools={availableTools} // For AI suggestions
                    SparklesIcon={Wand2}
                    showHelpModal={showHelpModal}
                  />

                  {/* Workflow Steps UI - Rendered conditionally within General Tab Content */}
                  {agentType === 'workflow' && (
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle>Passos do Workflow</CardTitle>
                        <CardDescription>Defina os passos sequenciais para este agente workflow.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {fields.map((item, index) => (
                          <Card key={item.id} className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-semibold">Passo {index + 1}</h4>
                              <Button variant="ghost" size="sm" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
                                            <SelectContent>{pageAgentToneOptions.map((option: typeof pageAgentToneOptions[number]) => <SelectItem key={option.id} value={option.label}>{option.label}</SelectItem>)}</SelectContent></Select></div>
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
                      // selectedTools, setSelectedTools, toolConfigurations, setToolConfiguration are managed by useFormContext in ToolsTab
                      iconComponents={iconComponents}
                      InfoIconComponent={InfoIcon} // Pass the imported InfoIcon, ToolsTab expects InfoIconComponent
                      SettingsIcon={Settings}
                    CheckIcon={Check}
                    PlusCircleIcon={PlusCircle} // Keep passing for now, ToolsTabProps includes it
                    Trash2Icon={Trash2} // Keep passing for now, ToolsTabProps includes it
                    showHelpModal={showHelpModal}
                    availableApiKeys={availableApiKeys || []}
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
                  <div className="mr-auto flex gap-2"> {/* Container for left-aligned buttons */}
                    <Button variant="outline" type="button" onClick={handleExport}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Exportar Config.
                    </Button>
                    <Button variant="outline" type="button" onClick={() => handleGenerateAgentCard('json')}>
                      <Download className="mr-2 h-4 w-4" />
                      Gerar Agent Card (JSON)
                    </Button>
                    {/* <Button variant="outline" type="button" onClick={() => handleGenerateAgentCard('yaml')}>
                      <Download className="mr-2 h-4 w-4" />
                      Gerar Agent Card (YAML)
                    </Button> */}
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
