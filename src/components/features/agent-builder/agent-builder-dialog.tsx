import * as React from 'react';
import { useForm, FormProvider, useFormContext, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
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
  // Wand2 // Already imported
} from 'lucide-react';

import { HelpModal } from '@/components/ui/HelpModal';
import { aiConfigurationAssistantFlow, AiConfigurationAssistantOutput } from '@/ai/flows/aiConfigurationAssistantFlow';
import AISuggestionDisplay from './AISuggestionDisplay';
import { runFlow } from 'genkit';
import { InfoIcon } from '@/components/ui/InfoIcon'; // Though used in tabs, modal logic is here
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';

import GeneralTab from './tabs/general-tab';
import ToolsTab from './tabs/tools-tab';
import BehaviorTab from './tabs/behavior-tab';
import StateMemoryTab from './tabs/state-memory-tab';
import RagTab from './tabs/rag-tab';
import ArtifactsTab from './tabs/artifacts-tab';
import A2AConfig from './tabs/a2a-config';
import MultiAgentTab from './tabs/multi-agent-tab';
import ReviewTab from './tabs/review-tab';
import DeployTab from './tabs/DeployTab'; // Import DeployTab
import { SubAgentSelector } from './sub-agent-selector';
import { v4 as uuidv4 } from 'uuid'; // For generating default IDs
import useApiKeyVault from '../../../hooks/use-api-key-vault';

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
  AgentFramework // Added as per subtask example
  // Add any other specific config types that were imported from agent-configs-fixed if they were missed
  // For example, if WorkflowDetailedType, TerminationConditionType etc. were used here, they would be added.
  // For now, sticking to the explicitly mentioned ones and those directly replacing the old imports.
} from '@/types/agent-types';

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
  const tabOrder = ['general', 'behavior', 'tools', 'memory_knowledge', 'artifacts', 'a2a', 'multi_agent_advanced', 'advanced', 'deploy', 'review'];

  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const [helpModalContent, setHelpModalContent] = React.useState<{ title: string; body: React.ReactNode } | null>(null);

  // State for AI Suggestions
  const [aiSuggestions, setAiSuggestions] = React.useState<AiConfigurationAssistantOutput | null>(null);
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const [suggestionError, setSuggestionError] = React.useState<string | null>(null);

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
    return {
      ...baseConfig,
      config: {
        ...baseConfig.config,
        artifacts: baseConfig.config?.artifacts || { ...DEFAULT_ARTIFACTS_CONFIG },
      },
    };
  };

  const methods = useForm<SavedAgentConfiguration>({
    defaultValues: prepareFormDefaultValues(editingAgent),
    resolver: zodResolver(savedAgentConfigurationSchema), // Use Zod schema for validation
  });

  React.useEffect(() => {
    methods.reset(prepareFormDefaultValues(editingAgent));
  }, [editingAgent, methods]); // methods should be in dependency array if it could change, but typically it doesn't for useForm.

  const onSubmit: SubmitHandler<SavedAgentConfiguration> = async (data) => {
    const { id: saveToastId, update: updateSaveToast, dismiss: dismissSaveToast } = toast({
      title: "Saving Agent...",
      description: "Please wait while the configuration is being saved.",
      variant: "default",
    });

    try {
      // Ensure timestamps and versions are correctly handled before saving
      const now = new Date().toISOString();
      data.updatedAt = now;
      if (!data.createdAt) { // If it's a new agent (though default function sets it)
        data.createdAt = now;
      }
      // internalVersion could be incremented here if logic requires
      await onSave(data); // Assuming onSave might be async

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

  const handleGetAiSuggestions = async () => {
    const { id: suggestionToastId, update: updateSuggestionToast, dismiss: dismissSuggestionToast } = toast({
      title: "Fetching AI Suggestions...",
      description: "Please wait while we generate suggestions.",
      variant: "default",
    });
    setIsSuggesting(true);
    setSuggestionError(null);
    setAiSuggestions(null); // Clear previous suggestions

    try {
      const currentConfig = methods.getValues().config as LLMAgentConfig; // Assuming LLM type for goal/tasks
      const agentGoal = currentConfig?.agentGoal;
      const agentTasks = currentConfig?.agentTasks;

      if (!agentGoal || !agentTasks || agentTasks.length === 0) {
        setSuggestionError("Por favor, defina o objetivo e as tarefas do agente primeiro para obter sugestões relevantes.");
        setIsSuggesting(false);
        return;
      }

      // console.log("Requesting AI suggestions with goal:", agentGoal, "and tasks:", agentTasks);
      const response = await runFlow(aiConfigurationAssistantFlow, {
        agentGoal,
        agentTasks,
        suggestionContext: 'fullConfig',
      });
      // console.log("AI suggestions received:", response);
      setAiSuggestions(response);
      updateSuggestionToast({
        title: "Suggestions Ready",
        description: "AI suggestions have been loaded.",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to get AI suggestions:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      setSuggestionError(`Falha ao obter sugestões da IA. ${errorMessage}`);
      updateSuggestionToast({
        title: "Error Fetching Suggestions",
        description: suggestionError || "An unknown error occurred.", // Use state value if set, otherwise generic
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
      setTimeout(() => dismissSuggestionToast(), 5000);
    }
  };

  const handleApplySuggestions = (suggestionsToApply: AiConfigurationAssistantOutput) => {
    // console.log("Applying suggestions:", suggestionsToApply);
    const configPath = 'config'; // Base path for LLMAgentConfig fields

    if (suggestionsToApply.suggestedPersonality) {
      methods.setValue(`${configPath}.agentPersonality` as any, suggestionsToApply.suggestedPersonality, { shouldValidate: true, shouldDirty: true });
    }
    if (suggestionsToApply.suggestedRestrictions) {
      methods.setValue(`${configPath}.agentRestrictions` as any, suggestionsToApply.suggestedRestrictions, { shouldValidate: true, shouldDirty: true });
    }
    if (suggestionsToApply.suggestedModel) {
      methods.setValue(`${configPath}.agentModel` as any, suggestionsToApply.suggestedModel, { shouldValidate: true, shouldDirty: true });
    }
    if (suggestionsToApply.suggestedTemperature !== undefined) {
      methods.setValue(`${configPath}.agentTemperature` as any, suggestionsToApply.suggestedTemperature, { shouldValidate: true, shouldDirty: true });
    }
    if (suggestionsToApply.suggestedTools && suggestionsToApply.suggestedTools.length > 0) {
      const toolIds = suggestionsToApply.suggestedTools.map(t => t.id);
      methods.setValue('tools', toolIds, { shouldValidate: true, shouldDirty: true });
       // Additionally, update toolsDetails if your structure requires it
      const toolsDetails = suggestionsToApply.suggestedTools.map(t => ({ id: t.id, name: t.name, description: t.description }));
      methods.setValue('toolsDetails', toolsDetails, { shouldValidate: true, shouldDirty: true });
    }

    setAiSuggestions(null); // Close the suggestion display
    // Optionally, trigger a toast notification for success
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
              <DialogTitle>{editingAgent ? "Editar Agente IA" : "Criar Novo Agente IA"}</DialogTitle>
              <DialogDescription>
                {editingAgent ? `Modifique as configurações do agente "${editingAgent.agentName}".` : "Configure um novo agente inteligente para suas tarefas."}
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
                <TabsList className="grid w-full grid-cols-10 mb-6"> {/* Adjusted for 10 tabs */}
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
                </TabsContent>

                {/* Tools Tab */}
                <TabsContent value="tools">
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
                </TabsContent>

                {/* Behavior Tab - Now uses RHF context */}
                <TabsContent value="behavior">
                  <BehaviorTab
                    agentToneOptions={agentToneOptions} // Pass only necessary static options
                    showHelpModal={showHelpModal}
                    onGetAiSuggestions={handleGetAiSuggestions}
                    isSuggesting={isSuggesting}
                  />
                </TabsContent>

                {/* Memory & Knowledge Tab */}
                <TabsContent value="memory_knowledge" className="space-y-6 mt-4">
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
                </TabsContent>

                {/* Artifacts Tab */}
                <TabsContent value="artifacts">
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
                </TabsContent>

                {/* A2A Communication Tab */}
                <TabsContent value="a2a" className="space-y-6 mt-4">
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
                </TabsContent>

                {/* Multi-Agent & Advanced Tab */}
                <TabsContent value="multi_agent_advanced" className="space-y-6 mt-4">
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
                </TabsContent>

                {/* Review Tab */}
                <TabsContent value="review">
                  <ReviewTab setActiveEditTab={setActiveEditTab} showHelpModal={showHelpModal} />
                </TabsContent>

                {/* Deploy Tab */}
                <TabsContent value="deploy">
                  <DeployTab />
                </TabsContent>

                {/* Advanced Tab (ADK Callbacks) */}
                <TabsContent value="advanced" className="space-y-6 mt-4">
                  <Alert>
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
                  <Button variant="outline" type="button" onClick={handleExport} className="mr-auto"> {/* Added mr-auto to push to left */}
                    <Share2 className="mr-2 h-4 w-4" /> {/* Or DownloadCloud icon */}
                    Exportar Configuração
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline" type="button">Cancelar</Button>
                  </DialogClose>
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
