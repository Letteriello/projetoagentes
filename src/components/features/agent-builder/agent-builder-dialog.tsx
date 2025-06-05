"use client";

import * as React from "react";
import { lazy, Suspense } from 'react'; // Moved lazy and Suspense up
import { useSearchParams, useRouter } from "next/navigation"; // Assuming next/navigation is correct
import { v4 as uuidv4 } from "uuid";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import JsonEditorField from '@/components/ui/JsonEditorField';
import { FormProvider, useForm, useFormContext, Controller, SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";


// Icons
import {
  AlertCircle, Ban, Brain, Check, ChevronDown, ChevronRight, ChevronUp, Cpu, FileJson, Info, Layers, ListChecks,
  Loader2, Network, Plus, Save, Search, Settings, Settings2, Smile, Target, Trash2, Users, Wand2, Workflow, X,
  Copy, ChevronsUpDown, PlusCircle, FileText, Database, Waypoints, Share2, UploadCloud, Binary, Palette,
  MessageSquareText, Book, GitCommit, RotateCcw, Download, Undo2, AlertTriangle
} from "lucide-react";
import { Gauge, RefreshCw } from "lucide-react"; // These were separate, kept them if distinct
import { TbBuildingStore, TbBarbell } from "react-icons/tb";
import { RiArrowGoBackFill } from "react-icons/ri";
import { InfoIcon } from '@/components/ui/InfoIcon'; // Specific component

// Hooks
import { useToast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
// import { useAgentStorage } from "@/hooks/use-agent-storage"; // Not used in the provided snippet
import { useAchievements } from "@/hooks/useAchievements";
import useApiKeyVault from '../../../hooks/use-api-key-vault';

// Core Types
import type {
  SavedAgentConfiguration,
  AgentFormData,
  AgentConfig as AgentConfigUnion,
  LLMAgentConfig,
  WorkflowAgentConfig,
  CustomAgentConfig,
  A2AAgentSpecialistConfig,
  ActualA2AConfig as AgentA2AConfig, // Renamed from A2AConfig to ActualA2AConfig in agent-core
  StatePersistenceConfig, // Added as it's used by default configs
  EvaluationGuardrails, // Added
  AgentFramework, // Used in props and default configs
  AgentType, // Used in props and default configs
  ArtifactStorageType, // Used in default configs
  ArtifactsConfig, // Used in default configs
  StateScope, // Used by local states, should be from agent-core
  TerminationConditionType as UnifiedTerminationConditionType, // Used by local states
  WorkflowStep // Used in RHF array
} from '@/types/agent-core';

import type {
  AvailableTool,
  ToolConfigData,
  MCPServerConfig,
  ApiKeyEntry
} from "@/types/tool-core";

// A2A specific types (from its own file)
import { type A2AConfig as SharedA2AConfigType, type CommunicationChannel as SharedCommunicationChannel } from "@/types/a2a-types";

// Local/Feature Specific Types (assuming these are defined within these components or their modules)
import { ArtifactManagementTab, type ArtifactDefinition as SharedArtifactDefinition } from "@/components/features/agent-builder/artifact-management-tab";
import { RagMemoryTab } from "@/components/features/agent-builder/rag-memory-tab"; // Assuming this exports necessary types if not using core
import { type RagMemoryConfig, type KnowledgeSource, type MemoryServiceType } from "@/components/features/agent-builder/memory-knowledge-tab"; // Path had .tsx
// import { A2AConfig as A2AConfigComponent } from "@/components/features/agent-builder/a2a-config"; // Component, not type

// Page specific type aliases (from props or for adapting)
import type {
  SavedAgentConfiguration as PageSavedAgentConfiguration,
  AgentConfig as PageAgentConfig,
  LLMAgentConfig as PageLLMAgentConfig,
  WorkflowAgentConfig as PageWorkflowAgentConfig,
  CustomAgentConfig as PageCustomAgentConfig,
  ToolConfigData as PageToolConfigData, // This was aliasing from unified-agent-types which got from tool-types
  AgentConfigBase as PageAgentConfigBase,
  // AgentFramework, // Now from agent-core
  agentToneOptions as pageAgentToneOptions,
} from '@/app/agent-builder/page'; // This import is from another page, not /types

// Utils
import { cn } from "@/lib/utils";
// import { toAgentFormData, toSavedAgentConfiguration } from "@/lib/agent-type-utils"; // Not used in snippet
import { generateAgentManifestJson, generateAgentManifestYaml } from '../../../lib/agent-utils';
import { savedAgentConfigurationSchema } from '../../../lib/zod-schemas';
import { aiConfigurationAssistantFlow, AiConfigurationAssistantOutput } from '@/ai/flows/aiConfigurationAssistantFlow'; // Path seems okay
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content'; // Data import

// Components
import ContextualHelp from "@/components/shared/ContextualHelp";
import EmptyState from "@/components/shared/EmptyState";
import Link from "next/link";
// import AgentBuilderDialog from "@/components/features/agent-builder/agent-builder-dialog"; // Self import, remove
import AgentCard from "@/components/features/agent-builder/agent-card"; // Used in types
import { HelpModal } from '@/components/ui/HelpModal'; // UI component
import AISuggestionDisplay from './AISuggestionDisplay';
import GeneralTab from './tabs/general-tab';
const ToolsTab = lazy(() => import('./tabs/tools-tab'));
const BehaviorTab = lazy(() => import('./tabs/behavior-tab'));
const StateMemoryTab = lazy(() => import('./tabs/state-memory-tab'));
const RagTab = lazy(() => import('./tabs/rag-tab'));
const ArtifactsTab = lazy(() => import('./tabs/artifacts-tab'));
const A2AConfigComponent = lazy(() => import('./tabs/a2a-config')); // Renamed import from A2AConfig
const MultiAgentTab = lazy(() => import('./tabs/multi-agent-tab'));
const ReviewTab = lazy(() => import('./tabs/review-tab'));
const DeployTab = lazy(() => import('./tabs/DeployTab'));
const CallbacksTab = lazy(() => import('./tabs/CallbacksTab'));
const AdvancedSettingsTab = lazy(() => import('./tabs/AdvancedSettingsTab'));
const EvaluationSecurityTab = lazy(() => import('./tabs/evaluation-security-tab'));
import { SubAgentSelector } from './sub-agent-selector'; // Not lazy

// Fallback component for lazy loading
const LoadingFallback = () => <div>Loading tab...</div>;

// Define a default for ArtifactsConfig to ensure it's always present
const DEFAULT_ARTIFACTS_CONFIG: ArtifactsConfig = {
  enabled: false,
  storageType: 'memory' as ArtifactStorageType,
  cloudStorageBucket: '',
  localStoragePath: '',
  definitions: [],
};

// Aliases for convenience if props expect these exact names from the page context
type AdaptedSavedAgentConfiguration = PageSavedAgentConfiguration;
type AdaptedAgentFormData = PageAgentConfig; // Assuming AgentFormData from page was PageAgentConfig

interface AgentBuilderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingAgent?: SavedAgentConfiguration | null; // Use core type
  onSave: (config: SavedAgentConfiguration) => void; // Use core type
  availableTools: AvailableTool[]; // Use core type
  agentTypeOptions: Array<{ id: AgentType; label: string; icon?: React.ReactNode; description: string; }>;
  agentToneOptions: Array<{ id: string; label: string; }>;
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>; // This remains as is
  availableAgentsForSubSelector: Array<{ id: string; agentName: string }>;
  mcpServers?: MCPServerConfig[];
  onConfigureToolInDialog: (tool: AvailableTool) => void;
}

// These types seem to be for local component state or specific UI interpretations
type BaseAgentType = Extract<AgentType, "llm" | "workflow" | "custom">;
type DialogAgentType = AgentType | "sequential" | "parallel" | "loop" ; // Extended AgentType
type TerminationConditionType = UnifiedTerminationConditionType | "subagent_signal";


// ... (rest of the component code from the previous read_files output, starting from `function safeToReactNode...`)
// Make sure to paste the exact code from the previous `read_files` for the component body.
// The following is a placeholder for brevity in this diff plan.
// function safeToReactNode ...
// const toBaseAgentTypeUI ...
// ... all the way to the end of the file ...
function safeToReactNode(value: unknown): React.ReactNode {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (React.isValidElement(value)) return value;
  return String(value);
}

const toBaseAgentTypeUI = (type: DialogAgentType): BaseAgentType => {
  if (type === 'a2a' || type === 'task' || type === 'reactive' || type === 'sequential' || type === 'parallel' || type === 'loop') return 'custom'; // Or map to workflow for seq/par/loop
  return type as BaseAgentType;
};

const getToolDisplayName = (tool: AvailableTool): React.ReactNode => safeToReactNode(tool.name || tool.id);
const getToolDescription = (tool: AvailableTool): React.ReactNode => safeToReactNode(tool.description || '');
const getNeedsConfiguration = (tool: AvailableTool): boolean => tool?.hasConfig || false;
const getToolGenkitName = (tool: AvailableTool): string | undefined => tool.genkitToolName;

// Default values for form sections, ensure types match agent-core.ts structures
const defaultLLMConfigValues: Partial<LLMAgentConfig> = { // Using Partial from agent-core
    agentGoal: "", agentTasks: [], agentPersonality: "", agentRestrictions: [],
    agentModel: "googleai/gemini-1.5-flash-latest", agentTemperature: 0.7, // Matched name from agent-core
};

const defaultWorkflowConfigValues: Partial<WorkflowAgentConfig> = { // Using Partial from agent-core
  workflowDescription: "", workflowType: undefined, // workflowType is WorkflowDetailedType
  // loopMaxIterations: undefined, loopTerminationConditionType: 'none', // These are in agent-core
};

const defaultCustomConfigValues: Partial<CustomAgentConfig> = { customLogicDescription: "" }; // Using Partial from agent-core

const defaultA2AConfigValues: Partial<A2AAgentSpecialistConfig> = { // Using Partial from agent-core
    customLogicDescription: "Este agente é projetado para interagir e coordenar com outros agentes.",
    a2a: { // This is ActualA2AConfig structure
        enabled: true, communicationChannels: [], defaultResponseFormat: 'json',
        maxMessageSize: 1024 * 1024, loggingEnabled: true,
    }
};


const AgentBuilderDialog: React.FC<AgentBuilderDialogProps> = ({
  isOpen, onOpenChange, editingAgent, onSave, availableTools,
  agentTypeOptions: propAgentTypeOptions,
  agentToneOptions, iconComponents,
  availableAgentsForSubSelector,
  mcpServers = [], // Default to empty array if not provided
  onConfigureToolInDialog,
}: AgentBuilderDialogProps) => {

  const { toast } = useToast();
  // const { savedAgents } = useAgents(); // Not directly used in this snippet
  // const [isLoading, setIsLoading] = React.useState(false); // Not directly used

  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false);
  const [configuringToolForModal, setConfiguringToolForModal] = React.useState<AvailableTool | null>(null);

  const [activeTab, setActiveTab] = React.useState("general");


  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = React.useState(0);
  const tabOrder = ['general', 'behavior', 'tools', 'memory_knowledge', 'artifacts', 'a2a', 'multi_agent_advanced', 'evaluation_security', 'advanced', 'deploy', 'callbacks', 'review'];

  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const [helpModalContent, setHelpModalContent] = React.useState<{ title: string; body: React.ReactNode } | null>(null);

  const [aiSuggestions, setAiSuggestions] = React.useState<AiConfigurationAssistantOutput | null>(null);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [suggestionError, setSuggestionError] = React.useState<string | null>(null);

  const [isSystemPromptManuallyEdited, setIsSystemPromptManuallyEdited] = React.useState(false);

  const showHelpModal = (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => {
    const content = agentBuilderHelpContent[contentKey.tab]?.[contentKey.field]?.modal;
    if (content) {
      let modalBody = content.body;
      if (typeof modalBody === 'string') {
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
      icon: '',
      templateId: '',
      isTemplate: false,
      isFavorite: false,
      tags: [],
      createdAt: now,
      updatedAt: now,
      userId: '',
      config: {
        type: 'llm',
        framework: 'genkit',
        agentGoal: '',
        agentTasks: [],
        agentPersonality: 'neutral',
        agentRestrictions: [],
        agentModel: 'gemini-1.5-flash-latest',
        agentTemperature: 0.7,
        systemPromptGenerated: '',
        // safetySettings: [], // From agent-core LLMAgentConfig if needed
        // enableCompositionalFunctionCalling: false, // from agent-core LLMAgentConfig
        statePersistence: { type: 'session', initialValues: [] } as StatePersistenceConfig, // Simplified, ensure all fields of StatePersistenceConfig
        ragMemoryConfig: { enabled: false } as RagMemoryConfig, // Simplified
        artifacts: { ...DEFAULT_ARTIFACTS_CONFIG },
        a2a: { enabled: false, communicationChannels: [], defaultResponseFormat: 'json', maxMessageSize: 1024, loggingEnabled: false } as AgentA2AConfig,
        evaluationGuardrails: { prohibitedKeywords: [], checkForToxicity: false } as EvaluationGuardrails,
        // adkCallbacks: {}, // Not in agent-core AgentConfigBase
        runConfig: { stream_response: true, speech_config: { voice: 'alloy', speed: 1.0 } } // Matches ChatRunConfig structure
      } as LLMAgentConfig,
      tools: [],
      toolConfigsApplied: {},
      toolsDetails: [],
      // internalVersion: 1, // Not in agent-core SavedAgentConfiguration
      // isLatest: true, // Not in agent-core
      // originalAgentId: newId, // Not in agent-core
      deploymentConfig: { environment: "development" }, // Simplified
    };
  };

  const prepareFormDefaultValues = (agent?: SavedAgentConfiguration | null): SavedAgentConfiguration => {
    const baseConfig = agent || createDefaultSavedAgentConfiguration();
    const isLLM = baseConfig.config?.type === 'llm';

    return {
      ...baseConfig,
      config: {
        ...(agent?.config || createDefaultSavedAgentConfiguration().config), // Ensure config is always fully populated
        artifacts: baseConfig.config?.artifacts || { ...DEFAULT_ARTIFACTS_CONFIG },
        ...(isLLM && { enableCompositionalFunctionCalling: (baseConfig.config as LLMAgentConfig).forceToolUsage || false }), // map forceToolUsage
        runConfig: {
          ...(createDefaultSavedAgentConfiguration().config.runConfig!),
          ...(baseConfig.config?.runConfig || {}),
          speech_config: {
            ...(createDefaultSavedAgentConfiguration().config.runConfig?.speech_config!),
            ...(baseConfig.config?.runConfig?.speech_config || {}),
          }
        },
        // Ensure other specific config types are defaulted if not present
        ...(baseConfig.config?.type === 'workflow' && { workflowSteps: (baseConfig.config as WorkflowAgentConfig).workflowSteps || [] }),
        ...(baseConfig.config?.type === 'a2a' && { a2a: (baseConfig.config as A2AAgentSpecialistConfig).a2a || defaultA2AConfigValues.a2a }),
      },
    };
  };

  const methods = useForm<SavedAgentConfiguration>({
    defaultValues: prepareFormDefaultValues(editingAgent),
    resolver: zodResolver(savedAgentConfigurationSchema),
  });

  React.useEffect(() => {
    const defaultVals = prepareFormDefaultValues(editingAgent);
    methods.reset(defaultVals);
    setIsSystemPromptManuallyEdited(!!methods.getValues('config.manualSystemPromptOverride'));
  }, [editingAgent, methods]);

  const { control, watch, setValue, getValues, formState: { errors } } = methods; // Added errors for debugging
  // React.useEffect(() => { // For debugging form errors
  //   if (Object.keys(errors).length > 0) {
  //     console.log("RHF Errors:", errors);
  //   }
  // }, [errors]);

  const agentTypeRHF = watch("config.type");
  const agentGoalRHF = watch("config.agentGoal");
  const agentTasksRHF = watch("config.agentTasks");
  const agentPersonalityRHF = watch("config.agentPersonality");
  const agentRestrictionsRHF = watch("config.agentRestrictions");
  const workflowTypeRHF = watch("config.workflowType");
  const workflowStepsRHF = watch("config.workflowSteps");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "config.workflowSteps" as 'config.workflowSteps', // Explicit cast
  });

  const constructSystemPromptFromRHF = (
    rhfData: SavedAgentConfiguration,
    availableAgentsSubSelector: Array<{ id: string; agentName: string }>, // Renamed to avoid conflict
    aiSuggestionsParam?: AiConfigurationAssistantOutput | null, // Renamed
    allAvailableToolsParam?: AvailableTool[] // Renamed
  ): string => {
    if (!rhfData.config) return "No configuration provided.";
    let promptParts: string[] = [];
    promptParts.push(`Você é um agente de IA. Seu nome é "${rhfData.agentName || 'Agente'}".`);
    if (rhfData.agentDescription) promptParts.push(`Sua descrição geral é: "${rhfData.agentDescription}".`);

    const agentTypeDetail = propAgentTypeOptions.find(opt => opt.id === rhfData.config.type);
    if(agentTypeDetail) promptParts.push(`Seu tipo principal é ${agentTypeDetail.label.split(' (')[0].trim()}. ${agentTypeDetail.description}`);

    if (rhfData.config.type === 'llm') {
      const llmConfig = rhfData.config as LLMAgentConfig;
      const personality = aiSuggestionsParam?.suggestedPersonality || llmConfig.agentPersonality;
      if (personality) promptParts.push(`Sua personalidade é: ${personality}.`);
      if (llmConfig.agentGoal) promptParts.push(`Seu objetivo principal é: ${llmConfig.agentGoal}.`);
      const tasksToUse = (aiSuggestionsParam?.suggestedTasks && aiSuggestionsParam.suggestedTasks.length > 0) ? aiSuggestionsParam.suggestedTasks : llmConfig.agentTasks;
      if (tasksToUse && tasksToUse.length > 0) {
        promptParts.push("Para alcançar este objetivo, você deve realizar as seguintes tarefas:");
        promptParts.push(...tasksToUse.map(task => `- ${task}`));
      }
      const restrictionsToUse = (aiSuggestionsParam?.suggestedRestrictions && aiSuggestionsParam.suggestedRestrictions.length > 0) ? aiSuggestionsParam.suggestedRestrictions : llmConfig.agentRestrictions;
      if (restrictionsToUse && restrictionsToUse.length > 0) {
        promptParts.push("\nVocê deve aderir às seguintes restrições:");
        promptParts.push(...restrictionsToUse.map(restriction => `- ${restriction}`));
      }
    } else if (rhfData.config.type === 'workflow') {
      const wfConfig = rhfData.config as WorkflowAgentConfig;
      if (wfConfig.workflowType) promptParts.push(`Subtipo de fluxo de trabalho: ${wfConfig.workflowType}.`);
      if (wfConfig.workflowDescription) promptParts.push(`Descrição do fluxo: ${wfConfig.workflowDescription}.`);
    } else if (rhfData.config.type === 'custom' || rhfData.config.type === 'a2a') {
      const customConfig = rhfData.config as CustomAgentConfig | A2AAgentSpecialistConfig;
      if (customConfig.customLogicDescription) promptParts.push(`Descrição da lógica customizada/interação: ${customConfig.customLogicDescription}.`);
    }

    if (allAvailableToolsParam && rhfData.toolsDetails && rhfData.toolsDetails.length > 0) {
      promptParts.push("\nFerramentas Disponíveis:");
      rhfData.toolsDetails.forEach(selectedToolInfo => {
        const fullToolDetail = allAvailableToolsParam.find(t => t.id === selectedToolInfo.id);
        if (fullToolDetail) {
          promptParts.push(`- Nome: ${fullToolDetail.name}`);
          promptParts.push(`  Descrição: ${fullToolDetail.description}`);
          // const snippet = generateToolSnippet(fullToolDetail.name, stringifySchema(fullToolDetail.inputSchema)); // stringifySchema was removed
          const snippet = generateToolSnippet(fullToolDetail.name, fullToolDetail.inputSchema as string | undefined);
          if (snippet) promptParts.push(`  Uso: ${snippet}`);
        }
      });
    } else {
      promptParts.push(`Nenhuma ferramenta externa está configurada para este agente.`);
    }
    return promptParts.join('\n\n');
  };

  React.useEffect(() => {
    if (!isSystemPromptManuallyEdited) {
      const currentFullConfig = getValues();
      if (currentFullConfig.config) {
        const newPromptString = constructSystemPromptFromRHF(
          currentFullConfig,
          availableAgentsForSubSelector,
          aiSuggestions,
          availableTools
        );
        if (newPromptString !== getValues('config.systemPromptGenerated')) {
          setValue('config.systemPromptGenerated', newPromptString, { shouldDirty: false, shouldValidate: false });
        }
      }
    }
  }, [
    watch('agentName'), watch('agentDescription'), agentTypeRHF, agentGoalRHF, agentTasksRHF, agentPersonalityRHF, agentRestrictionsRHF,
    workflowTypeRHF, workflowStepsRHF,
    watch('config.customLogicDescription'),
    watch('toolsDetails'),
    watch('toolConfigsApplied'),
    availableAgentsForSubSelector,
    aiSuggestions,
    setValue,
    getValues,
    isSystemPromptManuallyEdited,
    availableTools,
    // propAgentTypeOptions, // Added propAgentTypeOptions as it's used in constructSystemPromptFromRHF
  ]);

  const onSubmit: SubmitHandler<SavedAgentConfiguration> = async (submittedData) => {
    const currentFormData = methods.getValues();
    let finalData: SavedAgentConfiguration = { ...currentFormData };

    if (!finalData.config) {
        console.error("Agent config is missing in onSubmit!");
        return; // Or handle error appropriately
    }

    if (isSystemPromptManuallyEdited && typeof finalData.config.manualSystemPromptOverride === 'string') {
      finalData.config.systemPromptGenerated = finalData.config.manualSystemPromptOverride;
    }

    const currentConfig = finalData.config;
    const finalSystemPromptForHistory = currentConfig.systemPromptGenerated;

    if (finalSystemPromptForHistory) {
      let history = currentConfig.systemPromptHistory || [];
      if (history.length === 0 || history[0].prompt !== finalSystemPromptForHistory) {
        history.unshift({ prompt: finalSystemPromptForHistory, timestamp: new Date().toISOString() });
      }
      currentConfig.systemPromptHistory = history.slice(0, 3);
    }

    const { id: saveToastId, update: updateSaveToast, dismiss: dismissSaveToast } = toast({
      title: "Saving Agent...", description: "Please wait while the configuration is being saved.", variant: "default",
    });

    try {
      const now = new Date().toISOString();
      finalData.updatedAt = now;
      if (!finalData.createdAt) {
        finalData.createdAt = now;
      }
      await onSave(finalData);

      updateSaveToast({ title: "Success!", description: "Agent configuration saved successfully.", variant: "default" });
    } catch (error) {
      console.error("Failed to save agent configuration:", error);
      updateSaveToast({ title: "Error Saving", description: "Failed to save agent configuration. Please try again.", variant: "destructive" });
    } finally {
      setTimeout(() => dismissSaveToast(), 5000);
    }
  };

  const handleGetAiSuggestions = async () => {
    setIsSuggesting(true);
    setSuggestionError(null);
    setAiSuggestions(null);
    const { id: suggestionToastId, update: updateSuggestionToast, dismiss: dismissSuggestionToast } = toast({
      title: "Fetching AI Suggestions...", description: "Please wait while we generate suggestions.",
    });

    try {
      const currentFormValues = methods.getValues();
      const currentConfig = currentFormValues.config; // This is AgentConfigUnion | undefined
      const agentGoalValue = (currentConfig as LLMAgentConfig)?.agentGoal; // Access specific fields after type check or casting
      const agentTasksValue = (currentConfig as LLMAgentConfig)?.agentTasks;
      const currentToolsValue = currentFormValues.toolsDetails?.map(td => ({
        id: td.id, name: td.name, description: td.description, configData: currentFormValues.toolConfigsApplied?.[td.id]
      }));

      if (currentConfig?.type === 'llm' && (!agentGoalValue || !agentTasksValue || agentTasksValue.length === 0)) {
        setSuggestionError("Por favor, defina o objetivo e as tarefas do agente primeiro para obter sugestões relevantes.");
        updateSuggestionToast({ title: "Input Required", description: "Goal and tasks must be set for LLM agent suggestions.", variant: "destructive" });
        setIsSuggesting(false);
        return;
      }

      const response = await runFlow(aiConfigurationAssistantFlow, {
        agentGoal: agentGoalValue,
        agentTasks: agentTasksValue,
        suggestionContext: 'fullConfig',
        currentTools: currentToolsValue,
        fullAgentConfig: currentFormValues
      });

      setAiSuggestions(response);
      updateSuggestionToast({ title: "Suggestions Ready", description: "AI suggestions have been loaded.", variant: "default" });

    } catch (error) {
      console.error("Failed to get AI suggestions:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setSuggestionError(`Falha ao obter sugestões da IA. ${errorMessage}`);
      updateSuggestionToast({ title: "Error Fetching Suggestions", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSuggesting(false);
      setTimeout(() => dismissSuggestionToast(), 5000);
    }
  };

  const handleApplySuggestions = (suggestionsToApply: AiConfigurationAssistantOutput) => {
    const configPath = 'config';
    if (suggestionsToApply.suggestedPersonality) methods.setValue(`${configPath}.agentPersonality` as any, suggestionsToApply.suggestedPersonality, { shouldValidate: true, shouldDirty: true });
    if (suggestionsToApply.suggestedRestrictions) methods.setValue(`${configPath}.agentRestrictions` as any, suggestionsToApply.suggestedRestrictions, { shouldValidate: true, shouldDirty: true });
    if (suggestionsToApply.suggestedModel) methods.setValue(`${configPath}.agentModel` as any, suggestionsToApply.suggestedModel, { shouldValidate: true, shouldDirty: true });
    if (suggestionsToApply.suggestedTemperature !== undefined) methods.setValue(`${configPath}.agentTemperature` as any, suggestionsToApply.suggestedTemperature, { shouldValidate: true, shouldDirty: true });

    if (suggestionsToApply.suggestedTools && suggestionsToApply.suggestedTools.length > 0) {
      const toolIds = suggestionsToApply.suggestedTools.map(t => t.id);
      methods.setValue('tools', toolIds, { shouldValidate: true, shouldDirty: true });
      const toolsDetails = suggestionsToApply.suggestedTools.map(t => ({ id: t.id, name: t.name, description: t.description, icon: t.iconName || 'Cpu' })); // Assuming iconName maps to icon string
      methods.setValue('toolsDetails', toolsDetails as any, { shouldValidate: true, shouldDirty: true }); // Cast if types slightly differ
      const currentToolConfigs = methods.getValues("toolConfigsApplied") || {};
      let updatedToolConfigs = { ...currentToolConfigs };
      suggestionsToApply.suggestedTools.forEach(toolSuggestion => {
        if (toolSuggestion.id && toolSuggestion.suggestedConfigData) {
          updatedToolConfigs[toolSuggestion.id] = { ...(updatedToolConfigs[toolSuggestion.id] || {}), ...toolSuggestion.suggestedConfigData };
        }
      });
      methods.setValue("toolConfigsApplied", updatedToolConfigs, { shouldValidate: true, shouldDirty: true });
    }
    setAiSuggestions(null);
    toast({ title: "Suggestions Applied", description: "AI suggestions have been applied to the form.", variant: "default" });
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => { /* ... */ };
  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, tabOrder.length - 1));
  const handlePrevious = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const triggerDownload = (content: string, fileName: string, mimeType: string) => { /* ... */ };
  const handleGenerateManifest = (format: 'json' | 'yaml') => { /* ... uses getValues ... */ };
  const handleSaveToGit = () => { /* ... */ };
  const handleRevertFromGit = () => { /* ... uses editingAgent and prepareFormDefaultValues ... */ };

  // Dummy functions from original code, ensure they are defined if called
  const handleSaveToolConfiguration = () => { console.log("handleSaveToolConfiguration called");};
  const generateAgentCardJson = (data: any) => JSON.stringify(data);
  const generateAgentCardYaml = (data: any) => "yaml_data"; // Placeholder

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange as (open: boolean) => void}>
      <DialogContent className="max-w-4xl p-0">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)}>
            {/* ... DialogHeader ... */}
            <DialogHeader className="p-6 pb-4 border-b">
              <div className="flex items-center">
                <DialogTitle>{editingAgent ? "Editar Agente IA" : "Criar Novo Agente IA"}</DialogTitle>
                {editingAgent && (<Badge variant="outline" className="ml-3 text-sm">Editando: {editingAgent.agentName}</Badge>)}
              </div>
              <DialogDescription>
                {editingAgent ? `Modifique as configurações do agente.` : "Configure um novo agente inteligente para suas tarefas."}
              </DialogDescription>
              <input type="file" accept=".json" style={{ display: "none" }} onChange={handleFileImport} ref={fileInputRef} />
              <Button variant="outline" size="sm" type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 ml-auto">
                <UploadCloud className="mr-2 h-4 w-4" /> Importar Configuração
              </Button>
            </DialogHeader>

            <div className="p-6">
              <Tabs value={editingAgent === undefined ? tabOrder[currentStep] : activeTab} onValueChange={editingAgent !== undefined ? setActiveTab : undefined} className="w-full">
                <TabsList className="grid w-full grid-cols-11 mb-6">
                  {tabOrder.map((tab, index) => (
                    <TabsTrigger key={tab} value={tab} disabled={editingAgent === undefined && index > currentStep && tab !== "review"}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/_/g, " ")}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="flex-grow overflow-y-auto pr-2 space-y-6" style={{maxHeight: '60vh'}}> {/* Added maxHeight for scroll */}
                  <TabsContent value="general">
                    <GeneralTab agentTypeOptions={propAgentTypeOptions.map(opt => ({value: opt.id, label: opt.label}))}
                                agentFrameworkOptions={[ { value: "genkit", label: "Genkit (Default)" }, { value: "langchain", label: "Langchain (Simulated)" }, { value: "crewai", label: "CrewAI (Simulated)" }, { value: "custom", label: "Custom Genkit Flow" }, { value: "none", label: "None (Agent will not be directly executable)" }]}
                                availableTools={availableTools} SparklesIcon={Wand2} showHelpModal={showHelpModal} />
                    {agentTypeRHF === 'workflow' && (
                      <Card className="mt-6"><CardHeader><CardTitle>Passos do Workflow</CardTitle><CardDescription>Defina os passos sequenciais para este agente workflow.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                          {fields.map((item, index) => (
                            <Card key={item.id} className="p-4">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold">Passo {index + 1}</h4>
                                <Button variant="ghost" size="sm" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={control} name={`config.workflowSteps.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Nome do Passo (Opcional)</FormLabel><FormControl><Input {...field} placeholder="Ex: Validar Pedido" /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={control} name={`config.workflowSteps.${index}.agentId`} render={({ field }) => (<FormItem><FormLabel>Agente ID</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um agente" /></SelectTrigger></FormControl><SelectContent>{availableAgentsForSubSelector.map(agent => (<SelectItem key={agent.id} value={agent.id}>{agent.agentName}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
                              </div>
                              <FormField control={control} name={`config.workflowSteps.${index}.description`} render={({ field }) => (<FormItem className="mt-4"><FormLabel>Descrição do Passo (Opcional)</FormLabel><FormControl><Textarea {...field} placeholder="Ex: Este passo verifica os detalhes do pedido..." /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={control} name={`config.workflowSteps.${index}.inputMapping`} render={({ field }) => (<FormItem className="mt-4"><FormLabel>Mapeamento de Input (JSON)</FormLabel><FormControl><JsonEditorField value={field.value as string | Record<string, any>} onChange={(value) => field.onChange(typeof value === 'object' ? JSON.stringify(value) : value)} height="150px" /></FormControl><FormMessage /></FormItem>)} />
                              <FormField control={control} name={`config.workflowSteps.${index}.outputKey`} render={({ field }) => (<FormItem className="mt-4"><FormLabel>Chave de Saída</FormLabel><FormControl><Input {...field} placeholder="Ex: resultadoValidacao" /></FormControl><FormMessage /></FormItem>)} />
                            </Card>
                          ))}
                          <Button type="button" variant="outline" onClick={() => append({ agentId: '', inputMapping: '{}', outputKey: '', name: '', description: '' } as WorkflowStep)} className="mt-4"><PlusCircle className="mr-2 h-4 w-4" />Adicionar Passo</Button>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  <TabsContent value="tools"><Suspense fallback={<LoadingFallback />}><ToolsTab availableTools={availableTools} handleToolConfigure={onConfigureToolInDialog} iconComponents={iconComponents} InfoIconComponent={InfoIcon} SettingsIcon={Settings} CheckIcon={Check} PlusCircleIcon={PlusCircle} Trash2Icon={Trash2} showHelpModal={showHelpModal} availableApiKeys={availableApiKeys || []} mcpServers={mcpServers} /></Suspense></TabsContent>
                  <TabsContent value="behavior"><Suspense fallback={<LoadingFallback />}><BehaviorTab agentToneOptions={agentToneOptions} showHelpModal={showHelpModal} onGetAiSuggestions={handleGetAiSuggestions} isSuggesting={isSuggesting} isSystemPromptManuallyEdited={isSystemPromptManuallyEdited} setIsSystemPromptManuallyEdited={setIsSystemPromptManuallyEdited} /></Suspense></TabsContent>
                  <TabsContent value="memory_knowledge" className="space-y-6 mt-4"><Suspense fallback={<LoadingFallback />}><Alert><Brain className="h-4 w-4" /><AlertTitle>Memória & Conhecimento</AlertTitle><AlertDescription>Configure a persistência de estado do agente e a capacidade de usar RAG (Retrieval Augmented Generation) para acesso a conhecimento externo.</AlertDescription></Alert><StateMemoryTab SaveIcon={Save} ListChecksIcon={ListChecks} PlusIcon={Plus} Trash2Icon={Trash2} InfoIcon={InfoIcon} showHelpModal={showHelpModal} /><Separator className="my-6" /><RagTab SearchIcon={Search} UploadCloudIcon={UploadCloud} FileTextIcon={FileText} PlusIcon={Plus} Trash2Icon={Trash2} InfoIcon={InfoIcon} showHelpModal={showHelpModal} /></Suspense></TabsContent>
                  <TabsContent value="artifacts"><Suspense fallback={<LoadingFallback />}><ArtifactsTab FileJsonIcon={FileJson} UploadCloudIcon={UploadCloud} BinaryIcon={Binary} PlusIcon={Plus} Trash2Icon={Trash2} InfoIcon={InfoIcon} showHelpModal={showHelpModal} /></Suspense></TabsContent>
                  <TabsContent value="a2a" className="space-y-6 mt-4"><Suspense fallback={<LoadingFallback />}><Alert><Share2 className="h-4 w-4" /><AlertTitle>Comunicação Agente-Agente (A2A)</AlertTitle><AlertDescription>Configure como este agente se comunica com outros agentes no sistema, incluindo canais e protocolos.</AlertDescription></Alert><Card><CardContent className="space-y-4 pt-6"><A2AConfigComponent showHelpModal={showHelpModal} PlusIcon={Plus} Trash2Icon={Trash2} /></CardContent></Card></Suspense></TabsContent>
                  <TabsContent value="multi_agent_advanced" className="space-y-6 mt-4"><Suspense fallback={<LoadingFallback />}><Alert><Users className="h-4 w-4" /><AlertTitle>Multi-Agente & Configurações Avançadas</AlertTitle><AlertDescription>Defina o papel deste agente em uma colaboração (raiz ou sub-agente), configure sub-agentes e outras configurações avançadas do sistema.</AlertDescription></Alert><Card><CardHeader><CardTitle>Configurações de Hierarquia e Colaboração Multi-Agente</CardTitle><CardDescription>Defina o papel do agente (raiz ou sub-agente) e gerencie seus colaboradores.</CardDescription></CardHeader><CardContent className="space-y-4"><MultiAgentTab availableAgentsForSubSelector={availableAgentsForSubSelector} SubAgentSelectorComponent={SubAgentSelector} UsersIcon={Users} LayersIcon={Layers} InfoIcon={InfoIcon} ChevronsUpDownIcon={ChevronsUpDown} PlusCircleIcon={PlusCircle} Trash2Icon={Trash2} showHelpModal={showHelpModal} /></CardContent></Card><Card className="mt-6"><CardHeader><CardTitle className="text-muted-foreground/70">Outras Configurações Avançadas (Não Multi-Agente)</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Configurações adicionais...</p></CardContent></Card></Suspense></TabsContent>
                  <TabsContent value="evaluation_security"><Suspense fallback={<LoadingFallback />}><EvaluationSecurityTab /></Suspense></TabsContent>
                  <TabsContent value="review"><Suspense fallback={<LoadingFallback />}><ReviewTab setActiveEditTab={setActiveEditTab} showHelpModal={showHelpModal} availableTools={availableTools} /></Suspense></TabsContent>
                  <TabsContent value="deploy"><Suspense fallback={<LoadingFallback />}><DeployTab /></Suspense></TabsContent>
                  <TabsContent value="callbacks" className="space-y-6 mt-4"><Suspense fallback={<LoadingFallback />}><CallbacksTab /></Suspense></TabsContent>
                  <TabsContent value="advanced" className="space-y-6 mt-4"><Suspense fallback={<LoadingFallback />}><AdvancedSettingsTab /></Suspense></TabsContent>
                </div>
              </Tabs>
            </div>

            {/* ... DialogFooter ... */}
            <DialogFooter className="p-6 pt-4 border-t">
              {helpModalContent && (<HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} title={helpModalContent.title}>{helpModalContent.body}</HelpModal>)}
              {editingAgent === undefined ? (
                <div className="flex justify-between w-full">
                  <Button variant="outline" type="button" onClick={() => { onOpenChange(false); setCurrentStep(0); }}>Cancelar</Button>
                  <div className="flex gap-2">
                    <Button type="button" onClick={handlePrevious} disabled={currentStep === 0}>Anterior</Button>
                    {currentStep < tabOrder.length - 1 && tabOrder[currentStep + 1] !== "review" && (<Button type="button" onClick={handleNext}>Próximo</Button>)}
                    {currentStep < tabOrder.length - 1 && tabOrder[currentStep + 1] === "review" && (<Button type="button" onClick={handleNext}>Revisar</Button>)}
                    {tabOrder[currentStep] === "review" && (<Button type="submit" disabled={!methods.formState.isValid || methods.formState.isSubmitting}>{methods.formState.isSubmitting ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<Save className="mr-2 h-4 w-4" />)}Salvar Agente</Button>)}
                  </div>
                </div>
              ) : (
                <>
                  <div className="mr-auto flex flex-wrap gap-2">
                    <Button variant="outline" type="button" onClick={() => handleGenerateManifest('json')}><Download className="mr-2 h-4 w-4" />Exportar Manifesto (JSON)</Button>
                    <Button variant="outline" type="button" onClick={() => handleGenerateManifest('yaml')}><Download className="mr-2 h-4 w-4" />Exportar Manifesto (YAML)</Button>
                    <Button variant="outline" type="button" onClick={handleSaveToGit}><GitCommit className="mr-2 h-4 w-4" />Salvar no Git (Simulado)</Button>
                    <Button variant="outline" type="button" onClick={handleRevertFromGit}><RotateCcw className="mr-2 h-4 w-4" />Reverter do Git (Simulado)</Button>
                  </div>
                  <DialogClose asChild><Button variant="outline" type="button">Cancelar</Button></DialogClose>
                  <Button variant="outline" type="button" onClick={() => { if (editingAgent) { const defaultVals = prepareFormDefaultValues(editingAgent); methods.reset(defaultVals); setIsSystemPromptManuallyEdited(!!defaultVals.config.manualSystemPromptOverride); toast({ title: "Alterações Revertidas", description: "Os dados do formulário foram revertidos para o original." }); } }} className="mr-2"><Undo2 className="mr-2 h-4 w-4" />Reverter</Button>
                  <Button type="submit" disabled={!methods.formState.isValid || methods.formState.isSubmitting}>{methods.formState.isSubmitting ? (<Loader2 className="mr-2 h-4 w-4 animate-spin" />) : (<Save className="mr-2 h-4 w-4" />)}Salvar Agente</Button>
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
