"use client";
// AgentBuilderDialog: Utiliza classes responsivas do Tailwind (ex: md:grid-cols-2, sm:grid-cols-2, lg:grid-cols-3)
// e overflow-y-auto para garantir a usabilidade em diferentes tamanhos de tela, apesar da densidade de informações.
// O conteúdo das abas é rolável, e o diálogo em si pode ter altura máxima controlada (max-h-[90vh]).

// At the top of src/components/features/agent-builder/agent-builder-dialog.tsx

// ADD THESE IMPORTS
import { useForm, FormProvider, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { savedAgentConfigurationSchema } from "@/lib/zod-schemas"; // Assuming this path is correct based on previous steps

// ... other existing imports
import * as React from "react";
// ADD THESE IMPORTS
// import { useForm, FormProvider, SubmitHandler, Controller } from "react-hook-form"; // Already exists
// import { zodResolver } from "@hookform/resolvers/zod"; // Already exists
// import { savedAgentConfigurationSchema } from "@/lib/zod-schemas"; // Already exists

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Ensure Input is imported for Controller use
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // No longer directly used here
import { Switch } from "@/components/ui/switch";
// Componente principal para criar e editar configurações de agentes.
// Permite definir nome, tipo, comportamento, ferramentas, memória, RAG, artefatos e configurações multi-agente/A2A.
// import { CommunicationChannelItem } from "./a2a-communication-channel"; // No longer directly used here
import { Textarea } from "@/components/ui/textarea";
// LUCIDE ICONS - Ensure AlertCircle and Check are here
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
  // Database, // Now passed as a prop to StateMemoryTab
  Share2,
  UploadCloud,
  Binary,
  Palette
  // Waypoints, // Moved to BehaviorTab
  // Wand2,     // Already listed above
  // Settings,  // Already listed above
  // Check,     // Already listed above - CONFIRMED
  // Info,      // Already listed above
  // AlertCircle, // Already listed above - CONFIRMED
} from "lucide-react";

import { v4 as uuidv4 } from "uuid";
// import { zodResolver } from "@hookform/resolvers/zod"; // Already imported above
// Consolidated imports:
import {
  AgentFramework, // Will be part of SavedAgentConfiguration
  AgentConfig, // Will be part of SavedAgentConfiguration
  SavedAgentConfiguration, // Already imported from zod-schemas
  A2AConfig, // Will be part of SavedAgentConfiguration
  RagMemoryConfig, // Will be part of SavedAgentConfiguration
  ArtifactDefinition, // Will be part of SavedAgentConfiguration
  ToolConfigData, // Will be part of SavedAgentConfiguration
  LLMAgentConfig, // Will be part of SavedAgentConfiguration
  WorkflowAgentConfig, // Will be part of SavedAgentConfiguration
  WorkflowDetailedType, // Will be part of SavedAgentConfiguration
  CustomAgentConfig, // Will be part of SavedAgentConfiguration
  AvailableTool,
  TerminationConditionType,
  InitialStateValue,
  StatePersistenceType,
  ArtifactStorageType
} from "@/types/agent-configs"; // These might be needed for defaultValues or internal logic, but schema is king
// import type { KnowledgeSource } from "@/components/features/agent-builder/memory-knowledge-tab"; // This will be part of SavedAgentConfiguration
// import { availableTools as availableToolsList } from "@/data/available-tools"; // availableTools is a prop
import { useAgents } from "@/contexts/AgentsContext";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
// import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Tooltip components are no longer directly used in this file.
// They are used within ToolConfigModal.tsx.
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SubAgentSelector } from "@/components/features/agent-builder/sub-agent-selector";
import { cn } from "@/lib/utils";
import type { ClassValue } from 'clsx';
import GeneralTab from "./GeneralTab";
import BehaviorTab from "./BehaviorTab";
import ToolsTab from "./ToolsTab";
import ToolConfigModal from "./ToolConfigModal";
import StateMemoryTab from "./StateMemoryTab";
import RagTab from "./RagTab";
import ArtifactsTab from "./ArtifactsTab";
import MultiAgentTab from "./MultiAgentTab"; // Import the new MultiAgentTab component
import ReviewTab from "./ReviewTab"; // Import the new ReviewTab component
import { A2AConfig as A2AConfigComponent } from "./a2a-config"; // Import A2AConfig component

// Removed redundant local type definitions for TerminationConditionType and A2AConfigType

import { AgentTemplate } from "@/data/agentBuilderConfig";

// Helper function to safely access nested properties
const get = (obj, path, defaultValue = undefined) => {
  const travel = (regexp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  const result = travel(/[,[\]]+?/) || travel(/[\/\.-]+/);
  return result === undefined || result === obj ? defaultValue : result;
};

const tabSchemaMapping = {
  general: ["agentName", "agentDescription", "agentVersion", "icon", "config.type", "config.framework", "config.agentGoal", "config.agentTasks", "config.agentPersonality", "config.agentModel", "config.agentTemperature", "config.workflowDescription", "config.detailedWorkflowType", "config.customLogicDescription", "config.genkitFlowName"],
  tools: ["tools", "toolConfigsApplied"],
  memory_knowledge: ["config.statePersistence.enabled", "config.statePersistence.type", "config.statePersistence.initialStateValues", "config.rag.enabled", "config.rag.serviceType", "config.rag.knowledgeSources"],
  artifacts: ["config.artifacts.enabled", "config.artifacts.storageType", "config.artifacts.definitions"],
  a2a: ["config.a2a.enabled", "config.a2a.communicationChannels"],
  multi_agent_advanced: ["config.isRootAgent", "config.subAgentIds", "config.globalInstruction"],
  behavior: ["config.agentPersonality", "config.agentRestrictions"], // Added behavior tab fields
  advanced: [ // Added schema paths for ADK Callbacks
    "config.adkCallbacks.beforeAgent",
    "config.adkCallbacks.afterAgent",
    "config.adkCallbacks.beforeModel",
    "config.adkCallbacks.afterModel",
    "config.adkCallbacks.beforeTool",
    "config.adkCallbacks.afterTool",
  ],
};

const tabOrder = ["general", "behavior", "tools", "memory_knowledge", "artifacts", "a2a", "multi_agent_advanced", "advanced", "review"];


interface AgentBuilderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingAgent: SavedAgentConfiguration | null;
  onSave: (agentConfig: SavedAgentConfiguration) => void;
  availableTools: AvailableTool[];
  agentTypeOptions: Array<{ id: "llm" | "workflow" | "custom" | "a2a"; label: string; icon?: React.ReactNode; description: string; }>;
  agentToneOptions: { id: string; label: string; }[];
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>; // Mapeamento de nomes de ícones para componentes React, usado na aba Ferramentas.
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
  iconComponents,
  // agentTemplates, // No longer used directly, defaultValues logic handles template-like setup
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeEditTab, setActiveEditTab] = React.useState<string>("general");
  const methods = useForm<SavedAgentConfiguration>({
    resolver: zodResolver(savedAgentConfigurationSchema),
    mode: "onChange", // Or "onSubmit"
    defaultValues: React.useMemo(() => {
      if (editingAgent) {
        // Ensure all nested structures are defined, even if empty, to match Zod schema
        const config = editingAgent.config || {};
        const statePersistence = config.statePersistence || { enabled: false, type: "session", initialStateValues: [] };
        const rag = config.rag || { enabled: false, serviceType: "in-memory", knowledgeSources: [] };
        const artifacts = config.artifacts || { enabled: false, storageType: "memory", definitions: [] };
        const a2a = config.a2a || { enabled: false, communicationChannels: [], defaultResponseFormat: "text", maxMessageSize: 1024*1024, loggingEnabled: false };
        const adkCallbacks = config.adkCallbacks || { beforeAgent: "", afterAgent: "", beforeModel: "", afterModel: "", beforeTool: "", afterTool: "" };

        let specificConfigPart = {};
        if (config.type === "llm") {
          specificConfigPart = {
            agentGoal: (config as LLMAgentConfig).agentGoal || "",
            agentTasks: (config as LLMAgentConfig).agentTasks || [],
            agentPersonality: (config as LLMAgentConfig).agentPersonality || "",
            agentRestrictions: (config as LLMAgentConfig).agentRestrictions || [],
            agentModel: (config as LLMAgentConfig).agentModel || "gemini-1.5-flash",
            agentTemperature: (config as LLMAgentConfig).agentTemperature !== undefined ? (config as LLMAgentConfig).agentTemperature : 0.7,
            systemPromptGenerated: (config as LLMAgentConfig).systemPromptGenerated || "",
          };
        } else if (config.type === "workflow") {
          specificConfigPart = {
            detailedWorkflowType: (config as WorkflowAgentConfig).detailedWorkflowType || "sequential",
            workflowDescription: (config as WorkflowAgentConfig).workflowDescription || "",
            loopMaxIterations: (config as WorkflowAgentConfig).loopMaxIterations,
            loopTerminationConditionType: (config as WorkflowAgentConfig).loopTerminationConditionType || "none",
            loopExitToolName: (config as WorkflowAgentConfig).loopExitToolName,
            loopExitStateKey: (config as WorkflowAgentConfig).loopExitStateKey,
            loopExitStateValue: (config as WorkflowAgentConfig).loopExitStateValue,
          };
        } else if (config.type === "custom") {
          specificConfigPart = {
            customLogicDescription: (config as CustomAgentConfig).customLogicDescription || "",
            genkitFlowName: (config as CustomAgentConfig).genkitFlowName || "",
            inputSchema: (config as CustomAgentConfig).inputSchema || "",
            outputSchema: (config as CustomAgentConfig).outputSchema || "",
          };
        } else if (config.type === "a2a") {
          // No extra fields beyond base for a2a specialist type in current types
        }

        return {
          id: editingAgent.id || uuidv4(),
          agentName: editingAgent.agentName || "",
          agentDescription: editingAgent.agentDescription || "",
          agentVersion: editingAgent.agentVersion || "1.0.0",
          icon: editingAgent.icon || "",
          templateId: editingAgent.templateId || 'custom_manual_dialog',
          isFavorite: editingAgent.isFavorite || false,
          tags: editingAgent.tags || [],
          // createdAt and updatedAt are usually handled by backend or on save
          config: {
            type: config.type || "llm",
            framework: config.framework || "genkit",
            isRootAgent: config.isRootAgent !== undefined ? config.isRootAgent : true,
            subAgentIds: config.subAgentIds || [],
            globalInstruction: config.globalInstruction || "",
            statePersistence: {
              enabled: statePersistence.enabled,
              type: statePersistence.type || "session",
              defaultScope: statePersistence.defaultScope,
              timeToLiveSeconds: statePersistence.timeToLiveSeconds,
              initialStateValues: statePersistence.initialStateValues || [],
              validationRules: statePersistence.validationRules || [],
            },
            rag: {
              enabled: rag.enabled,
              serviceType: rag.serviceType || "in-memory",
              knowledgeSources: rag.knowledgeSources || [],
              persistentMemory: rag.persistentMemory || { enabled: false },
              retrievalParameters: rag.retrievalParameters,
              embeddingModel: rag.embeddingModel,
              includeConversationContext: rag.includeConversationContext,
            },
            artifacts: {
              enabled: artifacts.enabled,
              storageType: artifacts.storageType || "memory",
              cloudStorageBucket: artifacts.cloudStorageBucket,
              localStoragePath: artifacts.localStoragePath,
              definitions: artifacts.definitions || [],
            },
            a2a: {
              enabled: a2a.enabled,
              communicationChannels: a2a.communicationChannels || [],
              defaultResponseFormat: a2a.defaultResponseFormat || "text",
              maxMessageSize: a2a.maxMessageSize || 1024 * 1024,
              loggingEnabled: a2a.loggingEnabled || false,
              securityPolicy: a2a.securityPolicy,
              apiKeyHeaderName: a2a.apiKeyHeaderName,
            },
            adkCallbacks: {
              beforeAgent: adkCallbacks.beforeAgent || "",
              afterAgent: adkCallbacks.afterAgent || "",
              beforeModel: adkCallbacks.beforeModel || "",
              afterModel: adkCallbacks.afterModel || "",
              beforeTool: adkCallbacks.beforeTool || "",
              afterTool: adkCallbacks.afterTool || "",
            },
            ...specificConfigPart, // Spread the type-specific config parts
          },
          tools: editingAgent.tools || [],
          toolConfigsApplied: editingAgent.toolConfigsApplied || {}, // This replaces the local toolConfigurations state
          toolsDetails: editingAgent.toolsDetails || [],
        };
      }
      // Default values for a new agent
      return {
        id: uuidv4(),
        agentName: "",
        agentDescription: "",
        agentVersion: "1.0.0",
        icon: "llm-agent-icon.svg", // Default icon
        templateId: 'custom_manual_dialog',
        isFavorite: false,
        tags: [],
        config: {
          type: "llm", // Default type
          framework: "genkit", // Default framework
          isRootAgent: true,
          subAgentIds: [],
          globalInstruction: "",
          genkitFlowName: "", // Added for new agents
          inputSchema: "",    // Added for new agents
          outputSchema: "",   // Added for new agents
          statePersistence: { enabled: false, type: "session", initialStateValues: [], validationRules: [] },
          rag: { enabled: false, serviceType: "in-memory", knowledgeSources: [], persistentMemory: {enabled: false} },
          artifacts: { enabled: false, storageType: "memory", definitions: [] },
          a2a: { enabled: false, communicationChannels: [], defaultResponseFormat: "text", maxMessageSize: 1024*1024, loggingEnabled: false },
          adkCallbacks: { // Add default empty ADK callbacks
            beforeAgent: "",
            afterAgent: "",
            beforeModel: "",
            afterModel: "",
            beforeTool: "",
            afterTool: "",
          },
          // LLM specific defaults
          agentGoal: "",
          agentTasks: [],
          agentPersonality: agentToneOptions?.[0]?.id || "",
          agentRestrictions: [],
          agentModel: "gemini-1.5-flash",
          agentTemperature: 0.7,
          systemPromptGenerated: "",
        },
        tools: [],
        toolConfigsApplied: {}, // Initialize as empty object
        toolsDetails: [],
      };
    }, [editingAgent, agentToneOptions]),
    resetOptions: {
      keepDirtyValues: false,
    },
  });

  // REMOVE OR COMMENT OUT ALL React.useState hooks that manage form data.
  // For example:
  // const [agentName, setAgentName] = React.useState<string>(""); // This is now part of RHF
  // ... and all others related to agent configuration fields.

  // --- Estados para Configuração de Ferramentas e Modal de Configuração (Modal é separado, mas data pode vir de RHF) ---
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false); // Modal visibility is local state
  const [configuringTool, setConfiguringTool] = React.useState<AvailableTool | null>(null); // Which tool is being configured
  // const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, ToolConfigData>>({}); // REMOVED - Now part of RHF form state: methods.watch("toolConfigsApplied")

  // --- Wizard Flow State ---
  const [currentStep, setCurrentStep] = React.useState(0);

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, tabOrder.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // --- Estados para Campos do Modal de Configuração de Ferramentas (Mantidos para o modal, mas poderiam ser RHF sub-forms) ---
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
  const [modalAllowedPatterns, setModalAllowedPatterns] = React.useState<string>('');
  const [modalDeniedPatterns, setModalDeniedPatterns] = React.useState<string>('');
  const [modalCustomRules, setModalCustomRules] = React.useState<string>('');

  const { toast } = useToast();
  const { savedAgents: allSavedAgents } = useAgents(); // Used for sub-agent selector

  const handleExport = () => {
    const formData = methods.getValues();
    // Ensure agentName is available for the filename, provide a default if not
    const agentName = formData.agentName?.trim().replace(/[^a-zA-Z0-9]/g, '_') || 'agent_config';
    const filename = `${agentName}.json`;
    const jsonData = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Exportado", description: `Configuração do agente salva em ${filename}` });
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      toast({ title: "Importação Cancelada", description: "Nenhum arquivo selecionado.", variant: "default" });
      return;
    }

    if (file.type !== "application/json") {
      toast({ title: "Erro de Importação", description: "Arquivo inválido. Por favor, selecione um arquivo JSON.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          toast({ title: "Erro de Leitura", description: "Não foi possível ler o conteúdo do arquivo.", variant: "destructive" });
          return;
        }
        const parsedData = JSON.parse(text);
        const validationResult = savedAgentConfigurationSchema.safeParse(parsedData);

        if (validationResult.success) {
          // Merge with default values to ensure all fields are present
          const defaultNewAgentValues = methods.formState.defaultValues; // Get the default structure
          const mergedData = {
            ...defaultNewAgentValues,
            ...validationResult.data,
            id: editingAgent?.id || uuidv4(), // Keep existing ID if editing, or generate new one
            config: {
              ...(defaultNewAgentValues?.config),
              ...(validationResult.data.config),
            },
            tools: validationResult.data.tools || [],
            toolConfigsApplied: validationResult.data.toolConfigsApplied || {},
            toolsDetails: validationResult.data.toolsDetails || [],
          };

          methods.reset(mergedData);
          // If editing an existing agent, this effectively replaces its config.
          // If creating a new agent, this populates the form with the imported data.
          // Resetting view states:
          if (editingAgent === null) { // Wizard mode
            setCurrentStep(0); // Go to the first tab
          } else { // Edit mode
            setActiveEditTab("general"); // Go to general tab
          }
          toast({ title: "Importado com Sucesso", description: `Configuração do agente "${mergedData.agentName}" carregada.` });
        } else {
          console.error("Validation Error:", validationResult.error.flatten());
          toast({
            title: "Erro de Validação",
            description: "O arquivo JSON não corresponde ao esquema esperado. Verifique o console para detalhes.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Import Error:", error);
        toast({ title: "Erro de Importação", description: "Falha ao processar o arquivo JSON. Verifique o console.", variant: "destructive" });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Reset file input in all cases
        }
      }
    };
    reader.onerror = () => {
      toast({ title: "Erro de Leitura", description: "Não foi possível ler o arquivo.", variant: "destructive" });
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const availableAgentsForSubSelector = React.useMemo(() =>
    allSavedAgents.filter(agent => agent.id !== editingAgent?.id), // Ensure editing agent is not in its own sub-agent list
    [allSavedAgents, editingAgent?.id]
  );

  // Opções fixas para o seletor de framework do agente (poderia vir de props ou config)
  const agentFrameworkOptions = [
    { id: "genkit", label: "Genkit" },
    { id: "crewai", label: "CrewAI" },
    { id: "custom", label: "Custom Framework" },
    { id: "none", label: "None (Manual/External)" },
  ];

  React.useEffect(() => {
    if (isOpen) {
      const defaultVals = methods.getValues();
      const newDefaultValues = methods.formState.defaultValues;
      methods.reset(newDefaultValues);
      setActiveEditTab("general");
    } else {
      setIsToolConfigModalOpen(false);
      setConfiguringTool(null);
      if (editingAgent === null) {
        setCurrentStep(0);
      }
      setActiveEditTab("general");
    }
  }, [isOpen, editingAgent, methods]); // methods is stable, defaultValues object from useForm is the key for re-runs if editingAgent changes

  // Helper function to determine tab status icon
  const getTabStatusIcon = (tabValue: string): React.ReactNode | null => {
    const schemaPaths = tabSchemaMapping[tabValue as keyof typeof tabSchemaMapping] || [];
    if (!schemaPaths.length) return null;

    const errors = methods.formState.errors;
    const dirtyFields = methods.formState.dirtyFields;

    const hasError = schemaPaths.some(path => get(errors, path));
    if (hasError) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }

    const isDirty = schemaPaths.some(path => get(dirtyFields, path));
    if (isDirty) { // Considered "complete" if dirty and no errors for this simple proxy
      return <Check className="h-4 w-4 text-green-500" />;
    }

    return null;
  };

  // Manipulador para abrir o modal de configuração de uma ferramenta específica.
  // Popula os campos do modal com a configuração existente da ferramenta, se houver (data from RHF).
  const handleToolConfigure = (tool: AvailableTool) => {
    setConfiguringTool(tool);
    const currentToolConfigs = methods.getValues("toolConfigsApplied") || {};
    const existingConfig = currentToolConfigs[tool.id] || {};

    // Reset all modal fields before populating
    setModalGoogleApiKey(''); setModalGoogleCseId('');
    setModalOpenapiSpecUrl(''); setModalOpenapiApiKey('');
    setModalDbType(''); setModalDbHost(''); setModalDbPort(0); setModalDbName('');
    setModalDbUser(''); setModalDbPassword(''); setModalDbConnectionString(''); setModalDbDescription('');
    setModalKnowledgeBaseId(''); setModalCalendarApiEndpoint('');
    setModalAllowedPatterns(''); setModalDeniedPatterns(''); setModalCustomRules('');

    // Populate based on existingConfig from RHF
    setModalAllowedPatterns(existingConfig.allowedPatterns || '');
    setModalDeniedPatterns(existingConfig.deniedPatterns || '');
    setModalCustomRules(existingConfig.customRules || '');
    if (tool.id === "webSearch") {
      setModalGoogleApiKey(existingConfig.googleApiKey || '');
      setModalGoogleCseId(existingConfig.googleCseId || '');
    } else if (tool.id === "customApiIntegration") {
      setModalOpenapiSpecUrl(existingConfig.openapiSpecUrl || '');
      setModalOpenapiApiKey(existingConfig.openapiApiKey || '');
    } else if (tool.id === "databaseAccess") {
      setModalDbType(existingConfig.dbType || '');
      setModalDbHost(existingConfig.dbHost || '');
      setModalDbPort(Number(existingConfig.dbPort) || 0); // Ensure number conversion
      setModalDbName(existingConfig.dbName || '');
      setModalDbUser(existingConfig.dbUser || '');
      setModalDbPassword(existingConfig.dbPassword || '');
      setModalDbConnectionString(existingConfig.dbConnectionString || '');
      setModalDbDescription(existingConfig.dbDescription || '');
    } else if (tool.id === "knowledgeBase") {
      setModalKnowledgeBaseId(existingConfig.knowledgeBaseId || '');
    } else if (tool.id === "calendarAccess") {
      setModalCalendarApiEndpoint(existingConfig.calendarApiEndpoint || '');
    }
    setIsToolConfigModalOpen(true);
  };

  // Saves tool config data into RHF state.
  const handleSaveToolConfiguration = (toolId: string, configData: ToolConfigData) => {
    const currentToolConfigs = methods.getValues("toolConfigsApplied") || {};
    const updatedToolConfigs = { ...currentToolConfigs, [toolId]: configData };
    methods.setValue("toolConfigsApplied", updatedToolConfigs, { shouldValidate: true, shouldDirty: true });

    setIsToolConfigModalOpen(false);
    setConfiguringTool(null);
    toast({
      title: "Configuração Salva",
      description: `A configuração para a ferramenta foi salva com sucesso.`,
      variant: "default",
    });
  };

  const handleApiKeyIdChange = (toolId: string, apiKeyId?: string) => {
    if (!toolId) return;
    const currentToolConfigs = methods.getValues("toolConfigsApplied") || {};
    const existingToolConfig = currentToolConfigs[toolId] || {};
    const updatedToolConfig = { ...existingToolConfig, selectedApiKeyId: apiKeyId };
    const updatedToolConfigs = { ...currentToolConfigs, [toolId]: updatedToolConfig };
    methods.setValue("toolConfigsApplied", updatedToolConfigs, { shouldValidate: true, shouldDirty: true });

    // Additionally, if a new API key ID is selected, we might want to clear out any old direct-input key
    // that might have been stored previously for that tool, though this is less critical now.
    // For example, if existingToolConfig had 'googleApiKey', we could set it to undefined.
    // This depends on how strictly we want to manage old data.
    // For now, just updating selectedApiKeyId is the primary goal.
  };

// MODIFY handleSaveAgent
const handleSaveAgent: SubmitHandler<SavedAgentConfiguration> = async (data) => {
  // Data is now the validated form data from react-hook-form
  // The logic to construct coreConfig based on selectedAgentType (data.config.type)
  // needs to be done using the `data` object.

  // Basic validation example (though Zod handles most of it)
  if (!data.agentName.trim()) {
    toast({ title: "Erro de Validação", description: "O nome do agente é obrigatório.", variant: "destructive" });
    return;
  }

  // The rest of the handleSaveAgent logic will largely remain the same,
  // but it will use `data.config.type`, `data.agentName`, etc., instead of state variables.
  // For example:
  // let coreConfig: AgentConfig;
  // if (data.config.type === "llm") { coreConfig = { type: "llm", framework: data.config.framework, ... } }
  // ... and so on.

  // Construct the final agentDataToSave using the `data` object
  const agentDataToSave: SavedAgentConfiguration = {
    ...data, // Spread most of the validated data
    id: data.id || editingAgent?.id || uuidv4(), // Ensure ID is correctly handled
    templateId: data.templateId || editingAgent?.templateId || 'custom_manual_dialog',
    icon: data.icon || `${data.config.type}-agent-icon.svg`, // Ensure icon is set
    // Ensure toolsDetails are correctly populated if not directly part of the form schema in this way
    toolsDetails: data.tools
      .map(toolId => {
        const toolDetail = availableTools.find(t => t.id === toolId);
        return toolDetail ? {
          id: toolDetail.id,
          name: toolDetail.name,
          label: toolDetail.label || toolDetail.name, // Ensure label is present
          description: toolDetail.description,
          iconName: typeof toolDetail.icon === 'string' ? toolDetail.icon : "Settings", // Simplified
          hasConfig: toolDetail.hasConfig,
          genkitToolName: toolDetail.genkitToolName
        } : null;
      })
      .filter(Boolean) as SavedAgentConfiguration['toolsDetails'], // Type assertion
    createdAt: editingAgent?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Ensure toolConfigsApplied from RHF is used
    toolConfigsApplied: data.toolConfigsApplied || {},
  };

  // console.log("Agent data to save (from RHF):", JSON.stringify(agentDataToSave, null, 2));
  onSave(agentDataToSave); // This likely calls the context update/add function

  // After the primary onSave logic (which might be asynchronous itself if onSave performs API calls)
  // Update lastUsed for selected API keys
  if (agentDataToSave.toolConfigsApplied) {
    Object.values(agentDataToSave.toolConfigsApplied).forEach(async (toolConfig) => {
      if (toolConfig.selectedApiKeyId) {
        try {
          const response = await fetch(`/api/apikeys/${toolConfig.selectedApiKeyId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lastUsed: new Date().toISOString() }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            console.error(`Failed to update lastUsed for API key ${toolConfig.selectedApiKeyId}: ${errorData.error || response.statusText}`);
            // Non-critical, so don't block UI, just log
          } else {
            console.log(`Successfully updated lastUsed for API key ${toolConfig.selectedApiKeyId}`);
          }
        } catch (error) {
          console.error(`Error updating lastUsed for API key ${toolConfig.selectedApiKeyId}:`, error);
        }
      }
    });
  }

  toast({ title: "Agente Salvo", description: `${data.agentName} foi salvo com sucesso.`, variant: "default" });
  onOpenChange(false);
};

return (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl p-0">
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSaveAgent)}>
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
              value={editingAgent === null ? tabOrder[currentStep] : activeEditTab}
              // defaultValue="general" // defaultValue might conflict with controlled value
              onValueChange={(value) => {
                if (editingAgent === null) {
                  // In wizard mode, tab navigation is controlled by currentStep and Next/Previous buttons.
                  // Direct tab clicking is disabled by the 'disabled' prop on TabsTrigger.
                } else {
                  // Edit mode: update activeEditTab when a tab is clicked.
                  setActiveEditTab(value);
                }
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-9 mb-6"> {/* Adjusted for 9 tabs */}
                {/* Updated TabsTrigger props */}
                {tabOrder.map((tab, index) => (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    disabled={editingAgent === null && index > currentStep && tab !== "review"} // Keep review tab accessible if others are disabled
                    // onClick is not needed here as onValueChange on Tabs handles it.
                    // However, if you need specific logic per trigger click beyond what onValueChange provides:
                    // onClick={() => {
                    //   if (editingAgent !== null) {
                    //     setActiveEditTab(tab);
                    //   } else {
                    //     // Wizard mode logic if needed, though disabled prop should prevent most clicks
                    //     if (index <= currentStep) {
                    //       // Potentially allow jumping back in wizard?
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
                {/* <TabsTrigger value="general" statusIcon={getTabStatusIcon("general")} disabled={editingAgent === null}>Geral</TabsTrigger>
                <TabsTrigger value="behavior" statusIcon={getTabStatusIcon("behavior")} disabled={editingAgent === null}>Comportamento</TabsTrigger>
                <TabsTrigger value="tools" statusIcon={getTabStatusIcon("tools")} disabled={editingAgent === null}>Ferramentas</TabsTrigger>
                <TabsTrigger value="memory_knowledge" statusIcon={getTabStatusIcon("memory_knowledge")} disabled={editingAgent === null}>Memória & Conhecimento</TabsTrigger>
                <TabsTrigger value="artifacts" statusIcon={getTabStatusIcon("artifacts")} disabled={editingAgent === null}>Artefatos</TabsTrigger>
                <TabsTrigger value="a2a" statusIcon={getTabStatusIcon("a2a")} disabled={editingAgent === null}>Comunicação A2A</TabsTrigger>
                <TabsTrigger value="multi_agent_advanced" statusIcon={getTabStatusIcon("multi_agent_advanced")} disabled={editingAgent === null}>Multi-Agente</TabsTrigger>
                <TabsTrigger value="advanced" statusIcon={getTabStatusIcon("advanced")} disabled={editingAgent === null}>Avançado</TabsTrigger>
                <TabsTrigger value="review" statusIcon={getTabStatusIcon("review")} disabled={editingAgent === null}>Revisar</TabsTrigger> */}
              </TabsList>

              {/* General Tab */}
              <TabsContent value="general">
                <GeneralTab
                  agentTypeOptions={agentTypeOptions}
                  agentFrameworkOptions={agentFrameworkOptions}
                  availableTools={availableTools} // For AI suggestions
                  SparklesIcon={Wand2}
                  // agentToneOptions might still be needed if it populates a selector in GeneralTab directly.
                  // If agentPersonality is a selector in GeneralTab, pass agentToneOptions.
                  // Otherwise, if it's handled in BehaviorTab, it's not needed here.
                  // For now, assuming it's NOT for GeneralTab directly, but for BehaviorTab later.
                />
              </TabsContent>

              {/* Tools Tab */}
              <TabsContent value="tools">
                <ToolsTab
                  availableTools={availableTools}
                  selectedTools={methods.watch("tools") || []} // RHF state
                  setSelectedTools={(tools) => methods.setValue("tools", tools, {shouldValidate: true, shouldDirty: true})} // RHF action
                  toolConfigurations={methods.watch("toolConfigsApplied") || {}} // RHF state
                  onToolConfigure={handleToolConfigure} // Still uses local modal state management for now
                  iconComponents={iconComponents}
                  InfoIcon={Info}
                  SettingsIcon={Settings}
                  CheckIcon={Check}
                  PlusCircleIcon={PlusCircle}
                  Trash2Icon={Trash2}
                />
              </TabsContent>

              {/* Behavior Tab - Now uses RHF context */}
              <TabsContent value="behavior">
                <BehaviorTab
                  agentToneOptions={agentToneOptions} // Pass only necessary static options
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
                  // Props will be replaced by useFormContext in StateMemoryTab
                  enableStatePersistence={methods.watch("config.statePersistence.enabled") || false}
                  setEnableStatePersistence={(val) => methods.setValue("config.statePersistence.enabled", val)}
                  statePersistenceType={methods.watch("config.statePersistence.type") || "session"}
                  setStatePersistenceType={(val) => methods.setValue("config.statePersistence.type", val as StatePersistenceType)}
                  initialStateValues={methods.watch("config.statePersistence.initialStateValues") || []}
                  setInitialStateValues={(val) => methods.setValue("config.statePersistence.initialStateValues", val)}
                  SaveIcon={Save}
                  ListChecksIcon={ListChecks}
                  PlusIcon={Plus}
                  Trash2Icon={Trash2}
                  InfoIcon={Info}
                />
                <Separator className="my-6" />
                <RagTab
                  // Props will be replaced by useFormContext in RagTab
                  enableRAG={methods.watch("config.rag.enabled") || false}
                  setEnableRAG={(val) => methods.setValue("config.rag.enabled", val)}
                  ragMemoryConfig={methods.watch("config.rag") as RagMemoryConfig || methods.defaultValues?.config?.rag!}
                  setRagMemoryConfig={(config) => methods.setValue("config.rag", config)}
                  SearchIcon={Search}
                  UploadCloudIcon={UploadCloud}
                  FileTextIcon={FileText}
                  PlusIcon={Plus}
                  Trash2Icon={Trash2}
                  InfoIcon={Info}
                />
              </TabsContent>

              {/* Artifacts Tab */}
              <TabsContent value="artifacts">
                <ArtifactsTab
                  // Props will be replaced by useFormContext in ArtifactsTab
                  enableArtifacts={methods.watch("config.artifacts.enabled") || false}
                  setEnableArtifacts={(val) => methods.setValue("config.artifacts.enabled", val)}
                  artifactStorageType={methods.watch("config.artifacts.storageType") || "memory"}
                  setArtifactStorageType={(val) => methods.setValue("config.artifacts.storageType", val as ArtifactStorageType)}
                  artifacts={methods.watch("config.artifacts.definitions") || []}
                  setArtifacts={(val) => methods.setValue("config.artifacts.definitions", val)}
                  cloudStorageBucket={methods.watch("config.artifacts.cloudStorageBucket") || ""}
                  setCloudStorageBucket={(val) => methods.setValue("config.artifacts.cloudStorageBucket", val)}
                  localStoragePath={methods.watch("config.artifacts.localStoragePath") || ""}
                  setLocalStoragePath={(val) => methods.setValue("config.artifacts.localStoragePath", val)}
                  FileJsonIcon={FileJson}
                  UploadCloudIcon={UploadCloud}
                  BinaryIcon={Binary}
                  PlusIcon={Plus}
                  Trash2Icon={Trash2}
                  InfoIcon={Info}
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
                    <A2AConfigComponent savedAgents={availableAgentsForSubSelector} />
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
                      // Props will be replaced by useFormContext in MultiAgentTab
                      isRootAgent={methods.watch("config.isRootAgent") || false}
                      setIsRootAgent={(val) => methods.setValue("config.isRootAgent", val)}
                      subAgentIds={methods.watch("config.subAgentIds") || []}
                      setSubAgentIds={(val) => methods.setValue("config.subAgentIds", val)}
                      availableAgentsForSubSelector={availableAgentsForSubSelector}
                      SubAgentSelectorComponent={SubAgentSelector} // Keep passing component
                      UsersIcon={Users}
                      LayersIcon={Layers}
                      InfoIcon={Info}
                      ChevronsUpDownIcon={ChevronsUpDown}
                      PlusCircleIcon={PlusCircle}
                      Trash2Icon={Trash2}
                    />
                    <div className="space-y-2 pt-4">
                      <TooltipProvider>
                        {/* ... Tooltip for global instruction ... */}
                      </TooltipProvider>
                      <Controller
                        name="config.globalInstruction"
                        control={methods.control}
                        render={({ field }) => (
                          <Textarea
                            id="globalSubAgentInstructionRHF"
                            placeholder="Ex: 'Você é um assistente especialista...'"
                            value={field.value || ""}
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
                <ReviewTab setActiveEditTab={setActiveEditTab} />
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
                      { name: "beforeAgent", label: "Callback Before Agent", description: "Invocado antes do agente principal processar a requisição. Útil para configuração ou validação inicial." },
                      { name: "afterAgent", label: "Callback After Agent", description: "Invocado após o agente principal concluir. Útil para formatação final ou limpeza." },
                      { name: "beforeModel", label: "Callback Before Model", description: "Invocado antes de uma chamada ao LLM. Permite modificar o prompt ou configurações do modelo." },
                      { name: "afterModel", label: "Callback After Model", description: "Invocado após o LLM retornar uma resposta. Permite modificar ou validar a saída do LLM." },
                      { name: "beforeTool", label: "Callback Before Tool", description: "Invocado antes da execução de uma ferramenta. Permite inspecionar/modificar argumentos ou cancelar a execução." },
                      { name: "afterTool", label: "Callback After Tool", description: "Invocado após uma ferramenta ser executada. Permite inspecionar/modificar o resultado da ferramenta." },
                    ].map(callback => (
                      <div key={callback.name} className="space-y-1">
                        <Label htmlFor={`config.adkCallbacks.${callback.name}`}>{callback.label}</Label>
                        <Controller
                          name={`config.adkCallbacks.${callback.name}` as const}
                          control={methods.control}
                          render={({ field }) => (
                            <Input
                              {...field}
                              id={`config.adkCallbacks.${callback.name}`}
                              placeholder="Nome do fluxo Genkit ou ref da função"
                              value={field.value || ""}
                            />
                          )}
                        />
                        <p className="text-xs text-muted-foreground">{callback.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
          </div>

          <DialogFooter className="p-6 pt-4 border-t">
            {editingAgent === null ? (
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
      <ToolConfigModal
        isOpen={isToolConfigModalOpen}
        onOpenChange={(open) => {
          setIsToolConfigModalOpen(open);
          if (!open) {
            setConfiguringTool(null);
          }
        }}
        configuringTool={configuringTool}
        onSave={handleSaveToolConfiguration}
        currentSelectedApiKeyId={configuringTool ? methods.watch(`toolConfigsApplied.${configuringTool.id}.selectedApiKeyId`) : undefined}
        onApiKeyIdChange={handleApiKeyIdChange}
        modalGoogleApiKey={modalGoogleApiKey} setModalGoogleApiKey={setModalGoogleApiKey}
        modalGoogleCseId={modalGoogleCseId} setModalGoogleCseId={setModalGoogleCseId}
        modalOpenapiSpecUrl={modalOpenapiSpecUrl} setModalOpenapiSpecUrl={setModalOpenapiSpecUrl}
        modalOpenapiApiKey={modalOpenapiApiKey} setModalOpenapiApiKey={setModalOpenapiApiKey}
        modalDbType={modalDbType} setModalDbType={setModalDbType}
        modalDbHost={modalDbHost} setModalDbHost={setModalDbHost}
        modalDbPort={modalDbPort} setModalDbPort={setModalDbPort}
        modalDbName={modalDbName} setModalDbName={setModalDbName}
        modalDbUser={modalDbUser} setModalDbUser={setModalDbUser}
        modalDbPassword={modalDbPassword} setModalDbPassword={setModalDbPassword}
        modalDbConnectionString={modalDbConnectionString} setModalDbConnectionString={setModalDbConnectionString}
        modalDbDescription={modalDbDescription} setModalDbDescription={setModalDbDescription}
        modalKnowledgeBaseId={modalKnowledgeBaseId} setModalKnowledgeBaseId={setModalKnowledgeBaseId}
        modalCalendarApiEndpoint={modalCalendarApiEndpoint} setModalCalendarApiEndpoint={setModalCalendarApiEndpoint}
        modalAllowedPatterns={modalAllowedPatterns} setModalAllowedPatterns={setModalAllowedPatterns}
        modalDeniedPatterns={modalDeniedPatterns} setModalDeniedPatterns={setModalDeniedPatterns}
        modalCustomRules={modalCustomRules} setModalCustomRules={setModalCustomRules}
        InfoIcon={Info}
      />
    </Dialog>
  );
};

export default AgentBuilderDialog;
