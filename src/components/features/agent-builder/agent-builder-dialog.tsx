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

import { SubAgentSelector } from './sub-agent-selector';
import { v4 as uuidv4 } from 'uuid'; // For generating default IDs
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
  AgentFramework, // Added as per subtask example
  // WorkflowStep // Removed from here if it was, will be specifically imported
  // Add any other specific config types that were imported from agent-configs-fixed if they were missed
  // For example, if WorkflowDetailedType, TerminationConditionType etc. were used here, they would be added.
  // For now, sticking to the explicitly mentioned ones and those directly replacing the old imports.
} from '@/types/agent-types';
// Import WorkflowStep directly from agent-configs-new
import { WorkflowStep } from '@/types/agent-configs-new';

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
  const [currentStep, setCurrentStep] = React.useState(0);
  const tabOrder = ['general', 'behavior', 'tools', 'memory_knowledge', 'artifacts', 'a2a', 'multi_agent_advanced', 'advanced', 'deploy', 'callbacks', 'review'];

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
                <TabsList className="grid w-full grid-cols-11 mb-6"> {/* Adjusted for 11 tabs */}
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
                      selectedTools={methods.watch("tools") || []} // RHF state
                    setSelectedTools={(tools) => methods.setValue("tools", tools, {shouldValidate: true, shouldDirty: true})} // RHF action
                    iconComponents={iconComponents}
                    InfoIcon={InfoIcon} // Pass the imported InfoIcon
                    SettingsIcon={Settings}
                    CheckIcon={Check}
                    PlusCircleIcon={PlusCircle}
                    Trash2Icon={Trash2}
                    showHelpModal={showHelpModal}
                    availableApiKeys={availableApiKeys || []} // Pass the keys from the hook
                    setToolConfiguration={(toolId, config) => {
                      const currentConfigs = methods.getValues("toolConfigsApplied") || {};
                      methods.setValue("toolConfigsApplied", { ...currentConfigs, [toolId]: config }, { shouldValidate: true, shouldDirty: true });
                    }}
                    toolConfigurations={methods.watch("toolConfigsApplied") || {}} // Still pass current configs for reading
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
                        <A2AConfig savedAgents={availableAgentsForSubSelector} showHelpModal={showHelpModal} />
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
                      <div className="space-y-2 pt-4">
                        <TooltipProvider>
                          {/* ... Tooltip for global instruction ... */}
                        </TooltipProvider>
                        <Controller
                          name="config.globalInstruction" // This path is correct for SavedAgentConfiguration.config
                          control={methods.control}
                          render={({ field }) => (
                            <Textarea
                              id="globalSubAgentInstructionRHF"
                              placeholder="Ex: 'Você é um assistente especialista...'"
                              value={field.value || ""} // Ensure field.value is not null/undefined before passing to textarea
                              onChange={field.onChange}
                              rows={3}
                            />
                          )}
                        />
                        <p className="text-xs text-muted-foreground">
                          Uma diretiva geral que se aplica a todos os sub-agentes orquestrados por este agente.
                        </p>
                      </div>
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

                {/* Review Tab */}
                <TabsContent value="review">
                  <Suspense fallback={<LoadingFallback />}>
                    <ReviewTab setActiveEditTab={setActiveEditTab} showHelpModal={showHelpModal} />
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
                  <Alert variant="warning" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Performance Considerations</AlertTitle>
                    <AlertDescription>
                      Operações longas dentro de callbacks podem impactar a performance do agente, seguindo a documentação do ADK.
                    </AlertDescription>
                  </Alert>
                  <Card>
                    <CardHeader>
                      <CardTitle>Model Callbacks</CardTitle>
                      <CardDescription>
                        Define snippets of logic to be executed before and after model calls.
                        These will be stored in the new `callbacks` field in the agent configuration.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Before Model Callback Section */}
                      <div className="space-y-2">
                        <FormLabel>Before Model Callback</FormLabel>
                        <FormField
                          control={control}
                          name="config.callbacks.beforeModelLogic" // Assuming this path
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Enter logic for Before Model callback (e.g., modify request object)"
                                  rows={3}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="config.callbacks.beforeModelEnabled" // Assuming this path
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 mt-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Enable Before Model Callback
                              </FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* After Model Callback Section */}
                      <div className="space-y-2">
                        <FormLabel>After Model Callback</FormLabel>
                        <FormField
                          control={control}
                          name="config.callbacks.afterModelLogic" // Assuming this path
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Enter logic for After Model callback (e.g., log response or modify it)"
                                  rows={3}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="config.callbacks.afterModelEnabled" // Assuming this path
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 mt-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Enable After Model Callback
                              </FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tool Callbacks Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tool Callbacks</CardTitle>
                      <CardDescription>
                        Define snippets of logic to be executed before and after tool calls.
                        These will also be stored in the `callbacks` field.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Before Tool Callback Section */}
                      <div className="space-y-2">
                        <FormLabel>Before Tool Callback</FormLabel>
                        <FormField
                          control={control}
                          name="config.callbacks.beforeToolLogic" // Assuming this path
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Enter logic for Before Tool callback (e.g., validate tool input)"
                                  rows={3}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="config.callbacks.beforeToolEnabled" // Assuming this path
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 mt-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Enable Before Tool Callback
                              </FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* After Tool Callback Section */}
                      <div className="space-y-2">
                        <FormLabel>After Tool Callback</FormLabel>
                        <FormField
                          control={control}
                          name="config.callbacks.afterToolLogic" // Assuming this path
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Enter logic for After Tool callback (e.g., process tool output)"
                                  rows={3}
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={control}
                          name="config.callbacks.afterToolEnabled" // Assuming this path
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 mt-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                Enable After Tool Callback
                              </FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Advanced Tab (ADK Callbacks) */}
                <TabsContent value="advanced" className="space-y-6 mt-4">
                  <Alert variant="warning">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Considerações de Segurança para RunConfig</AlertTitle>
                    <AlertDescription>
                      Parâmetros de RunConfig (como 'max_tokens' para limitar a geração de conteúdo, 'temperature' para controlar a aleatoriedade, ou configurações de 'compositional_function_calling' para controlar a complexidade e execução de múltiplas funções) podem impactar a segurança, o custo e o comportamento do agente. Revise estas configurações cuidadosamente, especialmente em ambientes de produção.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    {/* Note: This tab does not seem to use a lazy-loaded component directly at its root.
                        If specific components *within* this tab were to be lazy-loaded, they would need
                        their own Suspense boundaries. For now, assuming the content is static or
                        already handled if it were a separate component. The prompt asked for specific
                        components like ToolsTab, BehaviorTab etc. to be lazy loaded.
                        If 'Advanced' itself was a component like 'AdvancedTab', it would be lazy loaded.
                        Since it's direct JSX, no Suspense is added here unless a sub-component needs it.
                    */}
                    <Settings2 className="h-4 w-4" />
                    <AlertTitle>Configurações Avançadas</AlertTitle>
                    <AlertDescription>
                      Configure callbacks do ciclo de vida do agente ADK e outras opções avançadas.
                    </AlertDescription>
                  </Alert>
                  <Card>
                    <CardHeader>
                      <CardTitle>Callbacks do Ciclo de Vida ADK</CardTitle>
                      <CardDescription>
                        Especifique nomes de fluxos Genkit ou referências de funções para serem invocadas em pontos chave do ciclo de vida do agente.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { name: "beforeAgent", label: "Callback Before Agent", description: "Invocado antes do agente principal processar a requisição. Útil para configuração, validação inicial ou **verificação de conformidade de segurança da requisição de entrada**." },
                        { name: "afterAgent", label: "Callback After Agent", description: "Invocado após o agente principal concluir. Útil para formatação final, limpeza ou **registro de auditoria seguro da transação completa**." },
                        { name: "beforeModel", label: "Callback Before Model", description: "Invocado antes de uma chamada ao LLM. Permite modificar o prompt ou configurações do modelo, **adicionar contexto de segurança ou verificar o prompt contra políticas de uso aceitável**." },
                        { name: "afterModel", label: "Callback After Model", description: "Invocado após o LLM retornar uma resposta. Permite modificar ou validar a saída do LLM, **verificar conformidade com políticas de conteúdo ou remover informações sensíveis antes de serem usadas por uma ferramenta ou retornadas ao usuário**." },
                        { name: "beforeTool", label: "Callback Before Tool", description: "Invocado antes da execução de uma ferramenta. Permite inspecionar/modificar argumentos, **validar permissões ou cancelar a execução por razões de segurança (ex: usando um fluxo Genkit de validação)**." },
                        { name: "afterTool", label: "Callback After Tool", description: "Invocado após uma ferramenta ser executada. Permite inspecionar/modificar o resultado da ferramenta ou **realizar verificações de segurança nos dados retornados pela ferramenta antes de serem usados em etapas subsequentes**." },
                      ].map(callback => (
                        <FormField
                          key={callback.name}
                          control={methods.control}
                          name={`config.adkCallbacks.${callback.name}` as const}
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel htmlFor={field.name}>{callback.label}</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  id={field.name}
                                  placeholder="Nome do fluxo Genkit ou ref da função"
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-muted-foreground pt-1">{callback.description}</p>
                            </FormItem>
                          )}
                        />
                      ))}
                    </CardContent>
                  </Card>

                  {/* Additional Security Settings Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Segurança Adicionais</CardTitle>
                      <CardDescription>
                        Ajustes finos para segurança na execução de código e outras operações sensíveis.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={methods.control}
                        name="config.sandboxedCodeExecution"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Habilitar Execução de Código em Sandbox
                              </FormLabel>
                              <p className="text-xs text-muted-foreground pt-1">
                                Quando habilitado, o código executado pela ferramenta codeExecutor será invocado em um ambiente sandbox simulado para maior segurança.
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
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
