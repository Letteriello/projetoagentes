
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
  // Ban, // Removed, moved to PromptBuilder
  Brain, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp, 
  Cpu, 
  FileJson, 
  Info, 
  Layers, 
  // ListChecks, // Removed, moved to PromptBuilder
  Loader2, 
  Network, 
  Plus, 
  Save, 
  Search, 
  Settings, 
  Settings2, 
  // Smile, // Removed, moved to PromptBuilder
  // Target, // Removed, moved to PromptBuilder
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
// import { useAgents } from "@/contexts/AgentsContext"; // Will be removed
import { useAgentStore } from '@/stores/agentStore'; // Added
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox"; // Keep Checkbox if used by other tabs
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubAgentSelector } from "@/components/features/agent-builder/sub-agent-selector"; // Keep if used by other tabs
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
  // agentToneOptions as pageAgentToneOptions, // Will be imported by PromptBuilder directly
} from '@/app/agent-builder/page';

import type {
  AvailableTool, // This should come from agent-types now, which re-exports from tool-types
  A2AAgentConfig, // This is a specific config type, ensure it matches or is properly used
  SavedAgentConfiguration, // Import from agent-types for mapToPageAgentConfig parameter
  AgentConfig, // Keep AgentConfig from agent-types.ts for internal use if needed
  LLMAgentConfig, // Keep LLMAgentConfig from agent-types.ts (used in createDefault)
  WorkflowAgentConfig, // Keep WorkflowAgentConfig from agent-types.ts (used in createDefault)
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
  MCPServerConfig, // Added for MCP Server mock data
} from '@/types/agent-types';
// Import WorkflowStep directly from agent-configs-new
import { WorkflowStep } from '@/types/agent-configs-new'; // Keep

// Import PromptBuilder and its constructSystemPrompt
import PromptBuilder, { constructSystemPrompt } from './PromptBuilder';
// Import ToolConfigModal (which now internally handles specific forms)
import ToolConfigModal from './ToolConfigModal';


import { type A2AConfig as SharedA2AConfigType, type CommunicationChannel as SharedCommunicationChannel } from "@/types/a2a-types"; // Keep
import { type ArtifactDefinition as SharedArtifactDefinition } from "@/components/features/agent-builder/artifact-management-tab"; // Keep
// RagMemoryConfig is already imported from memory-knowledge-tab.tsx


interface AgentBuilderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingAgent: PageSavedAgentConfiguration | null;
  onSave: (agentConfig: PageSavedAgentConfiguration) => void;
  availableTools: AvailableTool[];
  agentTypeOptions: Array<{ id: "llm" | "workflow" | "custom" | "a2a"; label: string; icon?: React.ReactNode; description: string; }>;
  agentToneOptions: Array<{ id: string; label: string; }>;
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>;
  availableAgentsForSubSelector: Array<{ id: string; agentName: string }>;
  mcpServers?: MCPServerConfig[];
  // onConfigureToolInDialog is no longer needed here, ToolsTab will handle modal opening.
}

const LoadingFallback = () => <div>Loading tab...</div>; // Keep

const DEFAULT_ARTIFACTS_CONFIG: ArtifactsConfig = { // Keep
  enabled: false,
  storageType: 'memory' as ArtifactStorageType,
  cloudStorageBucket: '',
  localStoragePath: '',
  definitions: [],
};

import { savedAgentConfigurationSchema } from '../../../lib/zod-schemas'; // Keep

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
  mcpServers = mockMcpServers,
  // onConfigureToolInDialog, // Removed
}) => {
  const { savedAgents } = useAgentStore(); // Use Zustand store
  const { apiKeys: availableApiKeys, isLoading: apiKeysLoading, error: apiKeysError } = useApiKeyVault();
  if (apiKeysLoading) console.log("API Keys Loading...");
  if (apiKeysError) console.error("Error loading API Keys:", apiKeysError);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeEditTab, setActiveEditTab] = React.useState('general');
  const [currentStep, setCurrentStep] = React.useState(0);
  const tabOrder = ['general', 'behavior', 'tools', 'memory_knowledge', 'artifacts', 'a2a', 'multi_agent_advanced', 'evaluation_security', 'advanced', 'deploy', 'callbacks', 'review'];

  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const [helpModalContent, setHelpModalContent] = React.useState<{ title: string; body: React.ReactNode } | null>(null);

  const [aiSuggestions, setAiSuggestions] = React.useState<AiConfigurationAssistantOutput | null>(null);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [suggestionError, setSuggestionError] = React.useState<string | null>(null);

  const [isSystemPromptManuallyEdited, setIsSystemPromptManuallyEdited] = React.useState(false);

  // States for ToolConfigModal opening and the tool being configured
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false);
  const [configuringTool, setConfiguringTool] = React.useState<AvailableTool | null>(null);

  // Removed all 'modal...' useState variables for tool configurations
  // e.g., modalGoogleCseId, modalDbHost, modalAllowedPatterns, etc.

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
        agentGoal: '', // Defaulted here, will be managed by PromptBuilder via RHF
        agentTasks: [], // Defaulted here, will be managed by PromptBuilder via RHF
        agentPersonality: 'neutral', // Defaulted here, will be managed by PromptBuilder via RHF
        agentRestrictions: [], // Defaulted here, will be managed by PromptBuilder via RHF
        agentModel: 'gemini-1.5-flash-latest',
        agentTemperature: 0.7,
        systemPromptGenerated: '',
        safetySettings: [],
        enableCompositionalFunctionCalling: false,
        statePersistence: { enabled: false, type: 'session', defaultScope: 'AGENT', initialStateValues: [], validationRules: [] },
        rag: { enabled: false, serviceType: 'in-memory', knowledgeSources: [], retrievalParameters: {}, persistentMemory: {enabled: false} },
        artifacts: { ...DEFAULT_ARTIFACTS_CONFIG },
        a2a: { enabled: false, communicationChannels: [], defaultResponseFormat: 'json', maxMessageSize: 1024, loggingEnabled: false },
        evaluationGuardrails: {
          prohibitedKeywords: [],
          checkForToxicity: false,
          maxResponseLength: undefined,
        },
        adkCallbacks: {},
      } as LLMAgentConfig,
      tools: [],
      toolConfigsApplied: {},
      toolsDetails: [],
      internalVersion: 1,
      isLatest: true,
      originalAgentId: newId,
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

  const prepareFormDefaultValues = (agent?: SavedAgentConfiguration | null): SavedAgentConfiguration => {
    const baseConfig = agent || createDefaultSavedAgentConfiguration();
    const isLLM = baseConfig.config?.type === 'llm';
    const preparedConfig = {
      ...baseConfig,
      config: {
        ...baseConfig.config,
        artifacts: baseConfig.config?.artifacts || { ...DEFAULT_ARTIFACTS_CONFIG },
        ...(isLLM && { enableCompositionalFunctionCalling: (baseConfig.config as LLMAgentConfig).enableCompositionalFunctionCalling || false }),
      },
    };
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
    resolver: zodResolver(savedAgentConfigurationSchema),
  });

  React.useEffect(() => {
    const defaultVals = prepareFormDefaultValues(editingAgent);
    methods.reset(defaultVals);
    setIsSystemPromptManuallyEdited(!!methods.getValues('config.manualSystemPromptOverride'));
  }, [editingAgent, methods]);

  const { control, watch, setValue, getValues } = methods; // Keep RHF methods
  const agentType = watch("config.type"); // Used for conditional UI
  // agentGoal, agentTasks, etc. are no longer watched here, but within PromptBuilder
  const workflowType = watch("config.workflowType"); // Used for conditional UI
  const workflowSteps = watch("config.workflowSteps"); // Used for conditional UI and useEffect dependency

  const { fields, append, remove } = useFieldArray({ // Keep for workflow steps
    control,
    name: "config.workflowSteps",
  });

  /**
   * Effect to automatically update the `systemPromptGenerated` field in the form.
   * This now uses the imported `constructSystemPrompt` from `PromptBuilder.tsx`.
   */
  React.useEffect(() => {
    if (!isSystemPromptManuallyEdited) {
      const currentFullConfig = getValues();
      const currentAgentConfig = currentFullConfig.config;
      if (currentAgentConfig) {
        const newPromptString = constructSystemPrompt( // Uses imported function
          currentAgentConfig,
          availableAgentsForSubSelector,
          aiSuggestions,
          availableTools,
          currentFullConfig.toolsDetails
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
    agentType, // Keep
    watch("config.agentGoal"), // Keep: RHF field, influences prompt
    watch("config.agentTasks"), // Keep: RHF field, influences prompt
    watch("config.agentPersonality"), // Keep: RHF field, influences prompt
    watch("config.agentRestrictions"), // Keep: RHF field, influences prompt
    workflowType, // Keep
    workflowSteps, // Keep
    availableAgentsForSubSelector, // Keep
    aiSuggestions, // Keep
    setValue, // Keep
    getValues, // Keep
    isSystemPromptManuallyEdited, // Keep
    availableTools, // Keep
    watch('toolsDetails') // Keep
  ]);

  const onSubmit: SubmitHandler<SavedAgentConfiguration> = async (submittedData) => { // Keep onSubmit
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

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, tabOrder.length - 1)); // Keep
  const handlePrevious = () => setCurrentStep(prev => Math.max(prev - 1, 0)); // Keep
  const handleExport = () => { /* Handle export */ }; // Keep

  const triggerDownload = (content: string, fileName: string, mimeType: string) => { // Keep
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

  // Removed handleSaveToolConfiguration as RHF handles data saving via sub-forms

  const handleGenerateAgentCard = (format: 'json' | 'yaml') => { // Keep
    const agentData = methods.getValues();
    const agentName = agentData.agentName || 'agent'; // Corrected: agentData.name to agentData.agentName
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

  const getTabStatusIcon = (tab: string) => null; // Keep

  // options and tools mapping seem to be for a specific select component, possibly not used or for another tab. Review if needed.
  // const options = availableTools.map(item => ({ value: item.id, label: item.name }));
  // const tools: AvailableTool[] = availableTools.map(tool => ({ /* ... */ }));


  // Handler to open the ToolConfigModal
  const handleConfigureToolInDialog = (tool: AvailableTool) => {
    setConfiguringTool(tool);
    setIsToolConfigModalOpen(true);
  };


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
                <TabsList className="grid w-full grid-cols-12 mb-6">
                  {tabOrder.map((tab, index) => (
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
                {/* The old "configPrincipal" TabsContent is removed. */}
                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                  {/* General Tab */}
                  <TabsContent value="general">
                    <GeneralTab
                      // agentTypeOptions prop is passed from AgentBuilderDialogProps
                      // availableTools prop is passed from AgentBuilderDialogProps
                      SparklesIcon={Wand2} // Keep Wand2 if GeneralTab uses it
                      showHelpModal={showHelpModal}
                      // RHF control and watch are available via FormProvider context
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
                              {/* FormField components for workflow steps remain the same */}
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
                      handleToolConfigure={handleConfigureToolInDialog} // Updated to use local handler
                      iconComponents={iconComponents}
                      InfoIconComponent={InfoIcon} // Assuming InfoIcon is still relevant or passed down
                      SettingsIcon={Settings} // Keep if ToolsTab uses it
                      CheckIcon={Check} // Keep if ToolsTab uses it
                      PlusCircleIcon={PlusCircle} // Keep if ToolsTab uses it
                      Trash2Icon={Trash2} // Keep if ToolsTab uses it
                      showHelpModal={showHelpModal}
                      availableApiKeys={availableApiKeys || []} // Pass API keys
                      mcpServers={mcpServers} // Pass MCP servers
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
              {/* HelpModal remains */}
              {helpModalContent && (
                <HelpModal
                  isOpen={isHelpModalOpen}
                  onClose={() => setIsHelpModalOpen(false)}
                  title={helpModalContent.title}
                >
                  {helpModalContent.body}
                </HelpModal>
              )}

              {/* ToolConfigModal is instantiated here, outside the main Tabs but within FormProvider */}
              {isToolConfigModalOpen && configuringTool && (
                <ToolConfigModal
                  isOpen={isToolConfigModalOpen}
                  onOpenChange={setIsToolConfigModalOpen}
                  configuringTool={configuringTool}
                  // Pass API key and MCP server related props
                  currentSelectedApiKeyId={methods.getValues(`toolConfigsApplied.${configuringTool.id}.selectedApiKeyId`)}
                  onApiKeyIdChange={(toolId, apiKeyId) => methods.setValue(`toolConfigsApplied.${toolId}.selectedApiKeyId` as any, apiKeyId, { shouldDirty: true })}
                  availableApiKeys={availableApiKeys || []}
                  mcpServers={mcpServers}
                  currentSelectedMcpServerId={methods.getValues(`toolConfigsApplied.${configuringTool.id}.selectedMcpServerId`)}
                  onMcpServerIdChange={(toolId, mcpServerId) => methods.setValue(`toolConfigsApplied.${toolId}.selectedMcpServerId` as any, mcpServerId, { shouldDirty: true })}
                  InfoIcon={InfoIcon as React.FC<React.SVGProps<SVGSVGElement>>} // Pass InfoIcon if needed by ToolConfigModal's common sections
                />
              )}

              {editingAgent === undefined ? (
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
