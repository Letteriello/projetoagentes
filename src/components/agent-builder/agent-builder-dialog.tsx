
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { A2AConfig, CommunicationChannel } from "@/types/a2a-types";
import { CommunicationChannelItem } from "./a2a-communication-channel";
import { Textarea } from "@/components/ui/textarea";
import { Cpu, PlusCircle, Save, Info, Workflow, Settings, Brain, Target, ListChecks, Smile, Ban, Search, Calculator, FileText, CalendarDays, Network, Layers, Trash2, Edit, MessageSquare, Share2, FileJson, Database, Code2, BookText, Languages, Settings2 as ConfigureIcon, ClipboardCopy, Briefcase, Stethoscope, Plane, GripVertical, AlertCircle, Plus, Bot, Rows3, LucideToyBrick, Users, Repeat, Shuffle, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubAgentSelector } from "@/components/agent-builder/sub-agent-selector";
import { MultiAgentTab } from "@/components/agent-builder/multi-agent-tab";
import { ArtifactManagementTab, ArtifactDefinition } from "@/components/agent-builder/artifact-management-tab";
import { MemoryKnowledgeTab, RagMemoryConfig, KnowledgeSource } from "@/components/agent-builder/memory-knowledge-tab";
import { A2AConfig as A2AConfigComponent } from "@/components/agent-builder/a2a-config";
import type { A2AConfig as A2AConfigType } from "@/types/a2a-types";
import { convertToGoogleADKConfig } from "@/lib/google-adk-utils";
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
import { cn } from "@/lib/utils";

import type {
  SavedAgentConfiguration,
  AgentConfig,
  LLMAgentConfig,
  WorkflowAgentConfig,
  CustomAgentConfig,
  AvailableTool,
  ToolConfigData,
  AgentConfigBase
} from '@/app/agent-builder/page'; // Tipos ainda da página, podem ser movidos

interface AgentBuilderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingAgent: SavedAgentConfiguration | null;
  onSave: (agentConfig: SavedAgentConfiguration) => void;
  // agentTemplates removido
  availableTools: AvailableTool[];
  agentTypeOptions: Array<{ id: AgentConfig["agentType"]; label: string; icon?: React.ReactNode; description: string; }>;
  agentToneOptions: { id: string; label: string; }[];
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>;
}

const defaultLLMConfigValues: Omit<LLMAgentConfig, keyof AgentConfigBase | 'agentType'> = {
    agentGoal: "",
    agentTasks: "",
    agentPersonality: "", // Será preenchido pelo primeiro agentToneOptions
    agentRestrictions: "",
    agentModel: "googleai/gemini-2.0-flash",
    agentTemperature: 0.7,
};

// Valores padrão para outros tipos de agente, se necessário
const defaultWorkflowConfigValues: Partial<WorkflowAgentConfig> = {
  workflowDescription: "",
  detailedWorkflowType: undefined,
  loopMaxIterations: undefined,
  loopTerminationConditionType: 'none',
};

const defaultCustomConfigValues: Partial<CustomAgentConfig> = {
  customLogicDescription: "",
};

const defaultTaskAgentConfigValues: Partial<LLMAgentConfig> = { // Pode ser um LLM simplificado
    agentGoal: "Realizar uma tarefa específica e bem definida.",
    agentTasks: "1. ",
    agentPersonality: "Conciso e Objetivo",
    agentRestrictions: "",
    agentModel: "googleai/gemini-1.5-flash-latest",
    agentTemperature: 0.5,
};

const defaultA2AAgentConfigValues: Partial<CustomAgentConfig> = { // Pode ser um Custom especializado
    customLogicDescription: "Este agente é projetado para interagir e coordenar com outros agentes.",
};


export function AgentBuilderDialog({
  isOpen,
  onOpenChange,
  editingAgent,
  onSave,
  availableTools,
  agentTypeOptions,
  agentToneOptions,
  iconComponents,
}: AgentBuilderDialogProps) {
  const { toast } = useToast();
  const { savedAgents } = useAgents(); // Acessa a lista de agentes salvos para o seletor de sub-agentes

  if (agentToneOptions.length > 0 && !defaultLLMConfigValues.agentPersonality) {
    defaultLLMConfigValues.agentPersonality = agentToneOptions[0].label;
  }
  if (agentToneOptions.length > 0 && !defaultTaskAgentConfigValues.agentPersonality) {
    defaultTaskAgentConfigValues.agentPersonality = agentToneOptions.find(opt => opt.id === "concise")?.label || agentToneOptions[0].label;
  }


  const [agentType, setAgentType] = React.useState<AgentConfig["agentType"]>(editingAgent?.agentType || agentTypeOptions[0].id);

  const [agentName, setAgentName] = React.useState(editingAgent?.agentName || "");
  const [agentDescription, setAgentDescription] = React.useState(editingAgent?.agentDescription || "");
  const [agentVersion, setAgentVersion] = React.useState(editingAgent?.agentVersion || "1.0.0");
  const [currentAgentTools, setCurrentAgentTools] = React.useState<string[]>(editingAgent?.agentTools || []);

  // LLM Fields
  const [agentGoal, setAgentGoal] = React.useState(editingAgent?.agentType === 'llm' ? editingAgent.agentGoal : (editingAgent?.agentGoal || defaultLLMConfigValues.agentGoal));
  const [agentTasks, setAgentTasks] = React.useState(editingAgent?.agentType === 'llm' ? editingAgent.agentTasks : (editingAgent?.agentTasks || defaultLLMConfigValues.agentTasks));
  const [agentPersonality, setAgentPersonality] = React.useState(editingAgent?.agentType === 'llm' ? editingAgent.agentPersonality : (editingAgent?.agentPersonality || defaultLLMConfigValues.agentPersonality));
  const [agentRestrictions, setAgentRestrictions] = React.useState(editingAgent?.agentType === 'llm' ? editingAgent.agentRestrictions : (editingAgent?.agentRestrictions || defaultLLMConfigValues.agentRestrictions));
  const [agentModel, setAgentModel] = React.useState(editingAgent?.agentModel || defaultLLMConfigValues.agentModel);
  const [agentTemperature, setAgentTemperature] = React.useState([(editingAgent?.agentTemperature === undefined ? defaultLLMConfigValues.agentTemperature : editingAgent.agentTemperature)]);

  // Multi-agent fields (Google ADK)
const [isRootAgent, setIsRootAgent] = React.useState(editingAgent?.isRootAgent || false);
const [subAgents, setSubAgents] = React.useState<string[]>(editingAgent?.subAgents || []);
const [globalInstruction, setGlobalInstruction] = React.useState(editingAgent?.globalInstruction || "");

// Estados para gerenciamento de estado e memória
const [enableStatePersistence, setEnableStatePersistence] = React.useState<boolean>(
    editingAgent?.enableStatePersistence || false
);
const [statePersistenceType, setStatePersistenceType] = React.useState<'session' | 'memory' | 'database'>(
    editingAgent?.statePersistenceType || 'memory'
);
const [initialStateValues, setInitialStateValues] = React.useState<Array<{
    key: string;
    value: string;
    scope: 'global' | 'agent' | 'temporary';
    description: string;
}>>(editingAgent?.initialStateValues || []);
const [enableStateSharing, setEnableStateSharing] = React.useState<boolean>(
    editingAgent?.enableStateSharing || false
);
const [stateSharingStrategy, setStateSharingStrategy] = React.useState<'all' | 'explicit' | 'none'>(
    editingAgent?.stateSharingStrategy || 'explicit'
);
const [enableRAG, setEnableRAG] = React.useState<boolean>(
    editingAgent?.enableRAG || false
);

// Estados para gerenciamento de artefatos
const [enableArtifacts, setEnableArtifacts] = React.useState<boolean>(
    editingAgent?.enableArtifacts || false
);
const [artifactStorageType, setArtifactStorageType] = React.useState<'memory' | 'filesystem' | 'cloud'>(
    editingAgent?.artifactStorageType || 'memory'
);
const [artifacts, setArtifacts] = React.useState<ArtifactDefinition[]>(
    editingAgent?.artifacts || []
);
const [cloudStorageBucket, setCloudStorageBucket] = React.useState<string>(
    editingAgent?.cloudStorageBucket || ''
);
const [localStoragePath, setLocalStoragePath] = React.useState<string>(
    editingAgent?.localStoragePath || ''
);

// Estados para RAG e memória
const [ragMemoryConfig, setRagMemoryConfig] = React.useState<RagMemoryConfig>({
  enabled: editingAgent?.ragMemoryConfig?.enabled || false,
  serviceType: editingAgent?.ragMemoryConfig?.serviceType || 'in-memory',
  projectId: editingAgent?.ragMemoryConfig?.projectId || '',
  location: editingAgent?.ragMemoryConfig?.location || '',
  ragCorpusName: editingAgent?.ragMemoryConfig?.ragCorpusName || '',
  similarityTopK: editingAgent?.ragMemoryConfig?.similarityTopK || 5,
  vectorDistanceThreshold: editingAgent?.ragMemoryConfig?.vectorDistanceThreshold || 0.7,
  embeddingModel: editingAgent?.ragMemoryConfig?.embeddingModel || '',
  knowledgeSources: editingAgent?.ragMemoryConfig?.knowledgeSources || [],
  includeConversationContext: editingAgent?.ragMemoryConfig?.includeConversationContext || true,
  persistentMemory: editingAgent?.ragMemoryConfig?.persistentMemory || false,
});

// Estado para configuração A2A
const [a2aConfig, setA2AConfig] = React.useState<A2AConfigType>({
  communicationChannels: editingAgent?.a2aConfig?.communicationChannels || [],
  defaultResponseFormat: editingAgent?.a2aConfig?.defaultResponseFormat || 'json',
  maxMessageSize: editingAgent?.a2aConfig?.maxMessageSize || 1024 * 1024, // 1MB default
  loggingEnabled: editingAgent?.a2aConfig?.loggingEnabled || false,
});

// Workflow Fields
  const [workflowDescription, setWorkflowDescription] = React.useState(editingAgent?.agentType === 'workflow' ? editingAgent.workflowDescription : (editingAgent?.workflowDescription || defaultWorkflowConfigValues.workflowDescription || ""));
  const [detailedWorkflowType, setDetailedWorkflowType] = React.useState<'sequential' | 'parallel' | 'loop' | undefined>(editingAgent?.agentType === 'workflow' ? editingAgent.detailedWorkflowType : defaultWorkflowConfigValues.detailedWorkflowType);
  const [loopMaxIterations, setLoopMaxIterations] = React.useState<number | undefined>(editingAgent?.agentType === 'workflow' ? editingAgent.loopMaxIterations : defaultWorkflowConfigValues.loopMaxIterations);
  const [loopTerminationConditionType, setLoopTerminationConditionType] = React.useState<'none' | 'subagent_signal' | undefined>(editingAgent?.agentType === 'workflow' ? editingAgent.loopTerminationConditionType : (defaultWorkflowConfigValues.loopTerminationConditionType || 'none'));
  const [loopExitToolName, setLoopExitToolName] = React.useState<string | undefined>(editingAgent?.agentType === 'workflow' ? editingAgent.loopExitToolName : defaultWorkflowConfigValues.loopExitToolName);
  const [loopExitStateKey, setLoopExitStateKey] = React.useState<string | undefined>(editingAgent?.agentType === 'workflow' ? editingAgent.loopExitStateKey : defaultWorkflowConfigValues.loopExitStateKey);
  const [loopExitStateValue, setLoopExitStateValue] = React.useState<string | undefined>(editingAgent?.agentType === 'workflow' ? editingAgent.loopExitStateValue : defaultWorkflowConfigValues.loopExitStateValue);
  
  // Custom/A2A/Task Fields (some might overlap or use LLM fields)
  const [customLogicDescription, setCustomLogicDescription] = React.useState(editingAgent?.agentType === 'custom' ? editingAgent.customLogicDescription : (editingAgent?.customLogicDescription || defaultCustomConfigValues.customLogicDescription || ""));


  const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, ToolConfigData>>(editingAgent?.toolConfigsApplied || {});
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false);
  const [configuringTool, setConfiguringTool] = React.useState<AvailableTool | null>(null);

  // States para o modal de configuração de ferramentas (serão preenchidos dinamicamente)
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


  const getToolIconComponent = (iconName?: keyof typeof iconComponents | 'default') => {
    const Icon = iconName ? iconComponents[iconName] : iconComponents['Default'];
    return Icon || Cpu;
  };
  
  const resetFormFields = (selectedType: AgentConfig["agentType"]) => {
    const typeOption = agentTypeOptions.find(opt => opt.id === selectedType);
    setAgentName(editingAgent && editingAgent.agentType === selectedType ? editingAgent.agentName : "");
    setAgentDescription(editingAgent && editingAgent.agentType === selectedType ? editingAgent.agentDescription : (typeOption?.description || ""));
    setAgentVersion("1.0.0");
    setCurrentAgentTools(editingAgent && editingAgent.agentType === selectedType ? editingAgent.agentTools : []);
    setToolConfigurations(editingAgent && editingAgent.agentType === selectedType ? editingAgent.toolConfigsApplied || {} : {});

    // Reset specific fields based on type
    if (selectedType === 'llm') {
        resetLLMFields(editingAgent?.agentType === 'llm' ? editingAgent : defaultLLMConfigValues);
        resetWorkflowFields();
        resetCustomLogicFields();
    } else if (selectedType === 'task') {
        resetLLMFields(editingAgent?.agentType === 'task' ? (editingAgent as LLMAgentConfig) : defaultTaskAgentConfigValues);
        setAgentDescription(editingAgent?.agentType === 'task' ? editingAgent.agentDescription : "Agente focado em realizar uma tarefa específica e bem definida.");
        resetWorkflowFields();
        resetCustomLogicFields();
    } else if (selectedType === 'sequential' || selectedType === 'parallel' || selectedType === 'loop' || selectedType === 'workflow') {
        resetWorkflowFields(editingAgent?.agentType === selectedType ? (editingAgent as WorkflowAgentConfig) : defaultWorkflowConfigValues);
        // Workflow agents can optionally use LLM instructions for meta-description
        resetLLMFields(editingAgent?.agentType === selectedType ? (editingAgent as Partial<LLMAgentConfig>) : {});
        setAgentDescription(editingAgent?.agentType === selectedType ? editingAgent.agentDescription : (typeOption?.description || ""));
        resetCustomLogicFields();
    } else if (selectedType === 'custom') {
        resetCustomLogicFields(editingAgent?.agentType === 'custom' ? editingAgent : defaultCustomConfigValues);
        resetLLMFields(editingAgent?.agentType === 'custom' ? (editingAgent as Partial<LLMAgentConfig>) : {});
        setAgentDescription(editingAgent?.agentType === 'custom' ? editingAgent.agentDescription : (typeOption?.description || ""));
        resetWorkflowFields();
    } else if (selectedType === 'a2a') {
        resetCustomLogicFields(editingAgent?.agentType === 'a2a' ? (editingAgent as CustomAgentConfig) : defaultA2AAgentConfigValues); // A2A might be a specialized Custom
        resetLLMFields(editingAgent?.agentType === 'a2a' ? (editingAgent as Partial<LLMAgentConfig>) : {});
        setAgentDescription(editingAgent?.agentType === 'a2a' ? editingAgent.agentDescription : (typeOption?.description || ""));
        resetWorkflowFields();
    } else {
        resetLLMFields({});
        resetWorkflowFields();
        resetCustomLogicFields();
    }
  };


  React.useEffect(() => {
    if (editingAgent) {
      setAgentType(editingAgent.agentType);
      resetFormFields(editingAgent.agentType); // Isso vai popular todos os campos com base no editingAgent
    } else {
      // Para novo agente, reseta para o tipo atualmente selecionado (ou o primeiro da lista)
      resetFormFields(agentType || agentTypeOptions[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingAgent, agentType]); // Adicionado agentType para resetar se mudar o tipo em um novo agente

  const resetLLMFields = (config: Partial<LLMAgentConfig> = {}) => {
    setAgentGoal(config.agentGoal || defaultLLMConfigValues.agentGoal);
    setAgentTasks(config.agentTasks || defaultLLMConfigValues.agentTasks);
    setAgentPersonality(config.agentPersonality || defaultLLMConfigValues.agentPersonality);
    setAgentRestrictions(config.agentRestrictions || defaultLLMConfigValues.agentRestrictions);
    setAgentModel(config.agentModel || defaultLLMConfigValues.agentModel);
    setAgentTemperature([config.agentTemperature === undefined ? defaultLLMConfigValues.agentTemperature : config.agentTemperature]);
  };

  const resetWorkflowFields = (config: Partial<WorkflowAgentConfig> = {}) => {
    setWorkflowDescription(config.workflowDescription || "");
    setDetailedWorkflowType(config.detailedWorkflowType || undefined);
    setLoopMaxIterations(config.loopMaxIterations || undefined);
    setLoopTerminationConditionType(config.loopTerminationConditionType || 'none');
    setLoopExitToolName(config.loopExitToolName || undefined);
    setLoopExitStateKey(config.loopExitStateKey || undefined);
    setLoopExitStateValue(config.loopExitStateValue || undefined);
  };

  const resetCustomLogicFields = (config: Partial<CustomAgentConfig> = {}) => {
    setCustomLogicDescription(config.customLogicDescription || "");
  };

  const handleAgentTypeChange = (newAgentType: AgentConfig["agentType"]) => {
    setAgentType(newAgentType);
    if (!editingAgent) { // Só reseta campos se NÃO estiver editando (ou seja, criando novo ou mudou o tipo antes de preencher)
      resetFormFields(newAgentType);
    }
    // Se estiver editando, o useEffect [editingAgent] cuidará de popular os campos.
    // Mudar o tipo durante a edição não deve resetar tudo, mas adaptar a UI.
    // A adaptação da UI é feita por renderização condicional.
  };

  const constructSystemPrompt = () => {
    let prompt = `Você é um agente de IA. Seu nome é "${agentName || 'Agente'}".\n`;
    if (agentDescription) { // A descrição geral é incluída aqui
      prompt += `Sua descrição geral é: "${agentDescription}".\n`;
    }
  
    const agentTypeDetail = agentTypeOptions.find(opt => opt.id === agentType);
    if(agentTypeDetail){
      prompt += `Seu tipo principal é ${agentTypeDetail.label.split(' (')[0].trim()}. ${agentTypeDetail.description}\n`;
    }
  
    if (agentType === 'workflow' || agentType === 'sequential' || agentType === 'parallel' || agentType === 'loop') {
        if (detailedWorkflowType) {
            prompt += `Subtipo de fluxo de trabalho: ${detailedWorkflowType}.\n`;
        }
        if (workflowDescription) {
             prompt += `Descrição do fluxo: ${workflowDescription}.\n`;
        }
        if(detailedWorkflowType === 'loop' && loopMaxIterations) {
            prompt += `O loop repetirá no máximo ${loopMaxIterations} vezes.\n`;
        }
        if(detailedWorkflowType === 'loop' && loopTerminationConditionType === 'subagent_signal') {
            prompt += `O loop também pode terminar se um subagente sinalizar (ex: via ferramenta '${loopExitToolName || 'exit_loop'}' ou estado '${loopExitStateKey || 'status_documento'}' atingir '${loopExitStateValue || 'FINALIZADO'}').\n`;
        }
    } else if (agentType === 'custom' || agentType === 'a2a') { // A2A tratado como custom
        if (customLogicDescription) {
            prompt += `Descrição da lógica customizada/interação: ${customLogicDescription}.\n`;
        }
    }
    
    const isLLMRelevant = agentType === 'llm' || agentType === 'task' || agentType === 'a2a' ||
                         ( (agentType === 'workflow' || agentType === 'sequential' || agentType === 'parallel' || agentType === 'loop' || agentType === 'custom') && 
                           (agentGoal || agentTasks || agentPersonality || agentRestrictions || agentModel) );

    if (isLLMRelevant) {
        prompt += `\nA seguir, as instruções de comportamento para qualquer capacidade de LLM que você possua:\n\n`;
        if (agentGoal) prompt += `OBJETIVO PRINCIPAL:\n${agentGoal}\n\n`;
        if (agentTasks) prompt += `TAREFAS PRINCIPAIS A SEREM REALIZADAS:\n${agentTasks}\n\n`;
        if (agentPersonality) prompt += `PERSONALIDADE/TOM DE COMUNICAÇÃO:\n${agentPersonality}\n\n`;
        if (agentRestrictions) {
          prompt += `RESTRIÇÕES E DIRETRIZES IMPORTANTES A SEGUIR RIGOROSAMENTE:\n${agentRestrictions}\n\n`;
        }
    }
  
    const selectedToolObjects = currentAgentTools
      .map(toolId => availableTools.find(t => t.id === toolId))
      .filter(Boolean) as AvailableTool[];
  
    if (selectedToolObjects.length > 0) {
        prompt += `FERRAMENTAS DISPONÍVEIS PARA USO (Você deve decidir quando e como usá-las):\n`;
        selectedToolObjects.forEach(tool => {
            const currentToolConfig = toolConfigurations[tool.id];
            let statusMessage = "";
            if (tool.needsConfiguration) {
                const isConfigured = 
                    (tool.id === 'webSearch' && currentToolConfig?.googleApiKey && currentToolConfig?.googleCseId) ||
                    (tool.id === 'customApiIntegration' && currentToolConfig?.openapiSpecUrl) ||
                    (tool.id === 'databaseAccess' && (currentToolConfig?.dbConnectionString || (currentToolConfig?.dbHost && currentToolConfig?.dbName))) ||
                    (tool.id === 'knowledgeBase' && currentToolConfig?.knowledgeBaseId) ||
                    (tool.id === 'calendarAccess' && currentToolConfig?.calendarApiEndpoint) ||
                    (!['webSearch', 'customApiIntegration', 'databaseAccess', 'knowledgeBase', 'calendarAccess'].includes(tool.id) && currentToolConfig && Object.keys(currentToolConfig).length > 0); // Genérico para outras ferramentas
                statusMessage = isConfigured ? "(Status: Configurada e pronta para uso)" : "(Status: Requer configuração. Verifique antes de usar ou informe a necessidade de configuração)";
            }
            const toolNameForPrompt = tool.genkitToolName || tool.label.replace(/\s+/g, '');
            prompt += `- Nome da Ferramenta para uso: '${toolNameForPrompt}'. Descrição: ${tool.description} ${statusMessage}\n`;
        });
        prompt += "\n";
    } else {
        prompt += `Nenhuma ferramenta externa está configurada para este agente.\n\n`;
    }
  
    if (isLLMRelevant) {
        prompt += "INSTRUÇÕES ADICIONAIS DE INTERAÇÃO:\n";
        prompt += "- Responda de forma concisa e direta ao ponto, a menos que o tom da personalidade solicite o contrário.\n";
        prompt += "- Se você precisar usar uma ferramenta, anuncie claramente qual ferramenta (usando o 'Nome da Ferramenta para uso' fornecido acima) e por que você a usaria ANTES de simular sua execução ou pedir ao usuário para aguardar. Após a simulação (ou se a execução real for implementada), apresente os resultados obtidos pela ferramenta.\n";
        prompt += "- Seja transparente sobre suas capacidades e limitações. Se não puder realizar uma tarefa, explique o motivo.\n";
        prompt += "- Se uma ferramenta necessária não estiver configurada, informe ao usuário educadamente.\n";
    }
    return prompt.trim();
  };

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
            let iconNameKey: keyof typeof iconComponents | 'default' = 'Default';
            if (React.isValidElement(tool.icon) && typeof tool.icon.type === 'function') {
                const foundIconName = Object.keys(iconComponents).find(
                    name => iconComponents[name] === tool.icon.type
                ) as keyof typeof iconComponents | undefined;
                if (foundIconName) {
                    iconNameKey = foundIconName;
                }
            }
            return { id: tool.id, label: tool.label, iconName: iconNameKey, needsConfiguration: tool.needsConfiguration, genkitToolName: tool.genkitToolName };
        })
        .filter(Boolean) as SavedAgentConfiguration['toolsDetails'];

    const appliedToolConfigs: Record<string, ToolConfigData> = {};
    currentAgentTools.forEach(toolId => {
      if (toolConfigurations[toolId]) {
        appliedToolConfigs[toolId] = toolConfigurations[toolId];
      }
    });

    let agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'templateId' | 'toolsDetails' | 'toolConfigsApplied' | 'systemPromptGenerated'> & {agentType: AgentConfig["agentType"]} = {
        agentName,
        agentDescription,
        agentVersion,
        agentTools: currentAgentTools,
        agentType,
        // Campos para compatibilidade com Google ADK
        isRootAgent,
        subAgents: isRootAgent ? subAgents : [],
        globalInstruction: isRootAgent ? globalInstruction : "",
        
        // Campos para gerenciamento de estado e memória
        enableStatePersistence,
        statePersistenceType,
        initialStateValues,
        enableStateSharing,
        stateSharingStrategy,
        enableRAG,
        
        // Campos para gerenciamento de artefatos
        enableArtifacts,
        artifactStorageType,
        artifacts,
        cloudStorageBucket: artifactStorageType === 'cloud' ? cloudStorageBucket : undefined,
        localStoragePath: artifactStorageType === 'filesystem' ? localStoragePath : undefined,
        
        // Campos para RAG e memória avançada
        ragMemoryConfig: ragMemoryConfig.enabled ? {
            ...ragMemoryConfig,
            // Remover campos desnecessários com base no tipo de serviço
            projectId: ragMemoryConfig.serviceType === 'vertex-ai-rag' ? ragMemoryConfig.projectId : undefined,
            location: ragMemoryConfig.serviceType === 'vertex-ai-rag' ? ragMemoryConfig.location : undefined,
            ragCorpusName: ragMemoryConfig.serviceType === 'vertex-ai-rag' ? ragMemoryConfig.ragCorpusName : undefined,
        } : undefined,
    };

    if (agentType === 'llm' || agentType === 'task') {
        agentConfigData = {
          ...agentConfigData,
          agentType: agentType, // Mantém llm ou task
          agentGoal,
          agentTasks,
          agentPersonality,
          agentRestrictions,
          agentModel,
          agentTemperature: agentTemperature[0],
        };
    } else if (agentType === 'sequential' || agentType === 'parallel' || agentType === 'loop' || agentType === 'workflow') {
        agentConfigData = {
          ...agentConfigData,
          agentType: agentType,
          detailedWorkflowType,
          workflowDescription,
          loopMaxIterations: detailedWorkflowType === 'loop' ? loopMaxIterations : undefined,
          loopTerminationConditionType: detailedWorkflowType === 'loop' ? loopTerminationConditionType : undefined,
          loopExitToolName: detailedWorkflowType === 'loop' ? loopExitToolName : undefined,
          loopExitStateKey: detailedWorkflowType === 'loop' ? loopExitStateKey : undefined,
          loopExitStateValue: detailedWorkflowType === 'loop' ? loopExitStateValue : undefined,
          // Opcional LLM fields for workflow meta-description/capabilities
          agentGoal: agentGoal || undefined, agentTasks: agentTasks || undefined, agentPersonality: agentPersonality || undefined,
          agentRestrictions: agentRestrictions || undefined, agentModel: agentModel || undefined, agentTemperature: agentTemperature[0] ?? undefined,
        };
    } else { // custom, a2a
        agentConfigData = {
          ...agentConfigData,
          agentType: agentType,
          customLogicDescription,
          // Opcional LLM fields
          agentGoal: agentGoal || undefined, agentTasks: agentTasks || undefined, agentPersonality: agentPersonality || undefined,
          agentRestrictions: agentRestrictions || undefined, agentModel: agentModel || undefined, agentTemperature: agentTemperature[0] ?? undefined,
        };
      }

    const completeAgentConfig: SavedAgentConfiguration = {
      id: editingAgent?.id || `agent-${Date.now()}`,
      templateId: "custom", // Como não usamos mais templates, podemos usar um valor fixo ou remover
      ...(agentConfigData as AgentConfig), 
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
    setConfiguringTool(tool);
    resetModalInputs(); 
    const currentConfig = toolConfigurations[tool.id] || {};
    if (tool.id === "webSearch") {
        setModalGoogleApiKey(currentConfig.googleApiKey || "");
        setModalGoogleCseId(currentConfig.googleCseId || "");
    } else if (tool.id === "customApiIntegration") {
        setModalOpenapiSpecUrl(currentConfig.openapiSpecUrl || "");
        setModalOpenapiApiKey(currentConfig.openapiApiKey || "");
    } else if (tool.id === "databaseAccess") {
        setModalDbType(currentConfig.dbType || "");
        setModalDbConnectionString(currentConfig.dbConnectionString || "");
        setModalDbUser(currentConfig.dbUser || "");
        setModalDbPassword(currentConfig.dbPassword || ""); 
        setModalDbName(currentConfig.dbName || "");
        setModalDbHost(currentConfig.dbHost || "");
        setModalDbPort(currentConfig.dbPort || "");
        setModalDbDescription(currentConfig.dbDescription || "");
    } else if (tool.id === "knowledgeBase") {
        setModalKnowledgeBaseId(currentConfig.knowledgeBaseId || "");
    } else if (tool.id === "calendarAccess") {
        setModalCalendarApiEndpoint(currentConfig.calendarApiEndpoint || "");
    }
    setIsToolConfigModalOpen(true);
  };

  const handleSaveToolConfiguration = () => {
    if (!configuringTool) return;
    let newConfigData: Partial<ToolConfigData> = { ...toolConfigurations[configuringTool.id] }; 
    if (configuringTool.id === "webSearch") {
      if (!modalGoogleApiKey || !modalGoogleCseId) {
        toast({ title: "Campos Obrigatórios", description: "Chave API e CSE ID são obrigatórios para Busca na Web.", variant: "destructive" }); return;
      }
      newConfigData = { googleApiKey: modalGoogleApiKey, googleCseId: modalGoogleCseId };
    } else if (configuringTool.id === "customApiIntegration") {
      if (!modalOpenapiSpecUrl) {
        toast({ title: "Campo Obrigatório", description: "URL do Esquema OpenAPI é obrigatória.", variant: "destructive" }); return;
      }
      newConfigData = { openapiSpecUrl: modalOpenapiSpecUrl, openapiApiKey: modalOpenapiApiKey };
    } else if (configuringTool.id === "databaseAccess") {
        if (!modalDbType || (!modalDbConnectionString && (!modalDbHost || !modalDbName))) {
             toast({ title: "Campos Obrigatórios", description: "Tipo de Banco e (String de Conexão ou Host/Nome do Banco) são obrigatórios.", variant: "destructive" }); return;
        }
        newConfigData = {
            dbType: modalDbType, dbConnectionString: modalDbConnectionString,
            dbUser: modalDbUser, dbPassword: modalDbPassword, dbName: modalDbName,
            dbHost: modalDbHost, dbPort: modalDbPort, dbDescription: modalDbDescription,
        };
    } else if (configuringTool.id === "knowledgeBase") {
        if (!modalKnowledgeBaseId) { toast({ title: "Campo Obrigatório", description: "ID da Base de Conhecimento é obrigatório.", variant: "destructive" }); return; }
        newConfigData = { knowledgeBaseId: modalKnowledgeBaseId };
    } else if (configuringTool.id === "calendarAccess") {
        if (!modalCalendarApiEndpoint) { toast({ title: "Campo Obrigatório", description: "Endpoint da API de Calendário é obrigatório.", variant: "destructive" }); return; }
        newConfigData = { calendarApiEndpoint: modalCalendarApiEndpoint };
    }
    setToolConfigurations(prev => ({ ...prev, [configuringTool.id!]: newConfigData as ToolConfigData, }));
    setIsToolConfigModalOpen(false); setConfiguringTool(null);
    toast({ title: `Configuração salva para ${configuringTool.label}`});
  };
  
  const selectedAgentTypeOption = agentTypeOptions.find(opt => opt.id === agentType);
  const selectedAgentTypeDescription = selectedAgentTypeOption?.description || "Configure seu agente.";
  const selectedAgentTypeLabel = selectedAgentTypeOption?.label.split(' (')[0].trim() || "Agente";
  
  const isLLMConfigRelevant = ['llm', 'task', 'a2a'].includes(agentType) || 
                             ( ['sequential', 'parallel', 'loop', 'workflow', 'custom'].includes(agentType) && 
                               (agentGoal || agentTasks || agentPersonality || agentRestrictions || agentModel)
                             );
  const showLLMSections = ['llm', 'task', 'a2a'].includes(agentType);
  const showWorkflowDescription = ['workflow', 'sequential', 'parallel', 'loop'].includes(agentType);
  const showCustomLogicDescription = ['custom', 'a2a'].includes(agentType);


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

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
            <Tabs defaultValue="configPrincipal" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-6 h-auto">
                    <TabsTrigger value="configPrincipal" className="py-2">Configuração Principal</TabsTrigger>
                    <TabsTrigger value="ferramentas" className="py-2">Ferramentas</TabsTrigger>
                    <TabsTrigger value="memoriaConhecimento" className="py-2">Memória e Conhecimento</TabsTrigger>
                    <TabsTrigger value="artefatos" className="py-2">Artefatos</TabsTrigger>
                    <TabsTrigger value="a2a" className="py-2">Comunicação A2A</TabsTrigger>
                </TabsList>
                
                <TabsContent value="configPrincipal" className="space-y-6">
                    <TooltipProvider>
                        {/* Removido Seletor de Modelo de Agente Inicial */}
                        {/* <Separator className="my-6"/> */}

                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                            <Label htmlFor="agentType" className="text-left flex items-center">
                                <Cpu size={16} className="mr-1.5 text-primary/80"/>Tipo de Agente
                                {selectedAgentTypeOption?.description && (
                                    <Tooltip>
                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                        <TooltipContent className="max-w-xs"><p>{selectedAgentTypeOption.description}</p></TooltipContent>
                                    </Tooltip>
                                )}
                            </Label>
                            <Select value={agentType} onValueChange={(value) => handleAgentTypeChange(value as AgentConfig["agentType"])}>
                                <SelectTrigger id="agentType" className="h-10"><SelectValue placeholder="Selecione o tipo de agente" /></SelectTrigger>
                                <SelectContent>
                                    {agentTypeOptions.map(option => (
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
                                <div></div> {/* Empty cell for alignment */}
                                <Alert variant="default" className="bg-card border-border/60">
                                    {selectedAgentTypeOption.icon ? React.cloneElement(selectedAgentTypeOption.icon as React.ReactElement, { className: "h-4 w-4 text-primary/80" }) : <Cpu className="h-4 w-4 text-primary/80" />}
                                    <AlertTitle>{selectedAgentTypeOption.label.split(' (')[0].trim()}</AlertTitle>
                                    <AlertDescription>{selectedAgentTypeOption.description}</AlertDescription>
                                </Alert>
                            </div>
                        )}


                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3 mt-6">
                            <Label htmlFor="agentName" className="text-left">Nome do Agente</Label>
                            <Input id="agentName" placeholder="ex: Suporte Nível 1" value={agentName} onChange={(e) => setAgentName(e.target.value)} className="h-10"/>

                            <Label htmlFor="agentDescription" className="text-left flex items-start pt-2.5">
                                Descrição Geral
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                    <TooltipContent className="max-w-xs"><p>Esta descrição geral do agente será incluída no prompt do sistema e pode ser usada por outros agentes LLM para decidir se devem delegar uma tarefa a ele.</p></TooltipContent>
                                </Tooltip>
                            </Label>
                            <Textarea id="agentDescription" placeholder="Descreva a função principal e o objetivo geral deste agente..." value={agentDescription} onChange={(e) => setAgentDescription(e.target.value)} rows={3}/>
                        </div>
                        
                        {showWorkflowDescription && (
                            <div className="grid grid-cols-[200px_1fr] items-start gap-x-4 gap-y-3 mt-3">
                                <Label htmlFor="workflowDescription" className="text-left pt-2.5">Descrição Geral do Fluxo</Label>
                                <Textarea id="workflowDescription" placeholder="Descreva o objetivo geral e o funcionamento esperado deste fluxo..." value={workflowDescription} onChange={(e) => setWorkflowDescription(e.target.value)} rows={3}/>
                            </div>
                        )}
                        {showCustomLogicDescription && (
                             <div className="grid grid-cols-[200px_1fr] items-start gap-x-4 gap-y-3 mt-3">
                                <Label htmlFor="customLogicDescription" className="text-left pt-2.5">
                                    {agentType === 'a2a' ? "Descrição da Interação A2A" : "Descrição da Lógica Personalizada"}
                                </Label>
                                <Textarea id="customLogicDescription" placeholder={
                                    agentType === 'a2a' 
                                    ? "Descreva como este agente deve interagir com outros agentes, quais informações ele troca, etc..."
                                    : "Descreva a funcionalidade principal e a lógica que seu fluxo Genkit customizado implementará..."
                                    } value={customLogicDescription} onChange={(e) => setCustomLogicDescription(e.target.value)} rows={agentType === 'a2a' ? 4 : 6}/>
                            </div>
                        )}

                        {(showLLMSections || isLLMConfigRelevant) && (
                            <>
                                <Separator className="my-6"/>
                                <div>
                                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-primary/80" /> Comportamento e Instruções {!showLLMSections && '(Opcional para este tipo)'}
                                    </h3>
                                     <div className="space-y-3">
                                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                                            <Label htmlFor="agentGoal" className="text-left flex items-center gap-1.5"><Target size={16}/>Objetivo</Label>
                                            <Input id="agentGoal" placeholder="ex: Ajudar usuários a encontrarem informações sobre produtos." value={agentGoal} onChange={(e) => setAgentGoal(e.target.value)} className="h-10"/>
                                        </div>
                                        <div className="grid grid-cols-[200px_1fr] items-start gap-x-4">
                                            <Label htmlFor="agentTasks" className="text-left flex items-center gap-1.5 pt-2.5"><ListChecks size={16}/>Tarefas</Label>
                                            <Textarea id="agentTasks" placeholder="ex: 1. Responder perguntas sobre especificações. 2. Comparar produtos." value={agentTasks} onChange={(e) => setAgentTasks(e.target.value)} rows={3} />
                                        </div>
                                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                                            <Label htmlFor="agentPersonality" className="text-left flex items-center gap-1.5"><Smile size={16}/>Personalidade/Tom</Label>
                                            <Select value={agentPersonality} onValueChange={setAgentPersonality}>
                                            <SelectTrigger id="agentPersonality" className="h-10"><SelectValue placeholder="Selecione um tom/personalidade" /></SelectTrigger>
                                            <SelectContent>
                                                {agentToneOptions.map(option => <SelectItem key={option.id} value={option.label}>{option.label}</SelectItem>)}
                                            </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-[200px_1fr] items-start gap-x-4">
                                            <Label htmlFor="agentRestrictions" className="text-left flex items-center gap-1.5 pt-2.5"><Ban size={16}/>Restrições</Label>
                                            <Textarea id="agentRestrictions" placeholder="ex: Nunca fornecer informações de contato direto." value={agentRestrictions} onChange={(e) => setAgentRestrictions(e.target.value)} rows={3}/>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-6"/>
                                <div>
                                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                        <Brain className="w-5 h-5 text-primary/80" /> Configurações do Modelo {!showLLMSections && !agentModel && '(Opcional para este tipo)'}
                                        {!showLLMSections && agentModel && '(Opcional para este tipo)'}
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                                            <Label htmlFor="agentModel" className="text-left flex items-center">Modelo de IA
                                                <Tooltip>
                                                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                                    <TooltipContent className="max-w-xs"><p>Modelos Google são integrados via Genkit. Outros (OpenRouter, etc.) requerem fluxo Genkit dedicado e podem não funcionar no chat padrão sem essa customização.</p></TooltipContent>
                                                </Tooltip>
                                            </Label>
                                            <Select value={agentModel} onValueChange={setAgentModel}>
                                                <SelectTrigger id="agentModel" className="h-10"><SelectValue placeholder="Selecione um modelo (opcional se não for agente LLM)" /></SelectTrigger>
                                                <SelectContent>
                                                <SelectItem value="googleai/gemini-1.5-pro-latest">Gemini 1.5 Pro (Google)</SelectItem>
                                                <SelectItem value="googleai/gemini-1.5-flash-latest">Gemini 1.5 Flash (Google)</SelectItem>
                                                <SelectItem value="googleai/gemini-pro">Gemini 1.0 Pro (Google)</SelectItem>
                                                <SelectItem value="googleai/gemini-2.0-flash">Gemini 2.0 Flash (Google - Padrão Genkit)</SelectItem>
                                                <SelectItem value="openrouter/custom">OpenRouter (requer fluxo Genkit dedicado)</SelectItem>
                                                <SelectItem value="requestly/custom">Requestly Mock (requer fluxo Genkit dedicado)</SelectItem>
                                                <SelectItem value="custom-http/genkit">Outro Endpoint HTTP (requer fluxo Genkit dedicado)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                                            <Label htmlFor="agentTemperature" className="text-left flex items-center">Temperatura: {agentTemperature[0].toFixed(1)}
                                                <Tooltip>
                                                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                                    <TooltipContent className="max-w-xs"><p>Controla a criatividade. Baixo = focado, Alto = criativo.</p></TooltipContent>
                                                </Tooltip>
                                            </Label>
                                            <Slider id="agentTemperature" min={0} max={1} step={0.1} value={agentTemperature} onValueChange={setAgentTemperature} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        
                        <Separator className="my-6"/>
                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                            <Label htmlFor="agentVersion" className="text-left">Versão do Agente</Label>
                            <Input id="agentVersion" placeholder="ex: 1.0.0" value={agentVersion} onChange={(e) => setAgentVersion(e.target.value)} className="h-10"/>
                        </div>
                        
                        {/* Configuração de Multi-Agente - Visível para todos os tipos de agentes */}
                        <Separator className="my-6" />
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary/80" />
                                <h3 className="text-lg font-medium">Configuração Multi-Agente</h3>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="isRootAgent"
                                    checked={isRootAgent}
                                    onCheckedChange={setIsRootAgent}
                                />
                                <Label htmlFor="isRootAgent" className="flex items-center gap-1">
                                    Este é um Agente Raiz (controla outros agentes)
                                </Label>
                            </div>
                            
                            {isRootAgent && (
                                <>
                                    <Alert variant="default" className="bg-muted/30 border-border/50">
                                        <AlertCircle className="h-4 w-4 text-primary/80" />
                                        <AlertTitle className="text-sm">Agente Raiz ADK</AlertTitle>
                                        <AlertDescription className="text-xs">
                                            Como Agente Raiz, este agente pode coordenar múltiplos sub-agentes, seguindo a arquitetura do Google Agent Development Kit.
                                        </AlertDescription>
                                    </Alert>
                                    
                                    <div className="space-y-4 mt-2">
                                        <div className="grid grid-cols-[200px_1fr] items-start gap-x-4">
                                            <Label htmlFor="globalInstruction" className="text-left pt-2">Instrução Global</Label>
                                            <Textarea
                                                id="globalInstruction"
                                                placeholder="Instrução que será aplicada a todos os sub-agentes..."
                                                value={globalInstruction}
                                                onChange={(e) => setGlobalInstruction(e.target.value)}
                                                className="min-h-20 resize-y"
                                            />
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Sub-Agentes</Label>
                                            <Card className="border-border/50">
                                                <CardContent className="p-4">
                                                    <SubAgentSelector
                                                        selectedAgents={subAgents}
                                                        onChange={setSubAgents}
                                                        availableAgents={savedAgents || []}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {/* Campos de Definição de Fluxo - Visíveis apenas para agentes de fluxo de trabalho */}
                        {['sequential', 'parallel', 'loop', 'workflow'].includes(agentType) && (
                            <>
                                <Separator className="my-6" />
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Workflow className="h-5 w-5 text-primary/80" />
                                        <h3 className="text-lg font-medium">Definição do Fluxo de Trabalho</h3>
                                    </div>
                                    
                                    {agentTypeOptions.find(opt => opt.id === agentType) && (
                                        <Alert variant="default" className="mb-4 bg-card border-border/60">
                                            {agentTypeOptions.find(opt => opt.id === agentType)!.icon ? 
                                                React.cloneElement(agentTypeOptions.find(opt => opt.id === agentType)!.icon as React.ReactElement, 
                                                { className: "h-4 w-4 text-primary/80" }) : 
                                                <Cpu className="h-4 w-4 text-primary/80" />}
                                            <AlertTitle>{agentTypeOptions.find(opt => opt.id === agentType)!.label.split(' (')[0].trim()}</AlertTitle>
                                            <AlertDescription>{agentTypeOptions.find(opt => opt.id === agentType)!.description}</AlertDescription>
                                        </Alert>
                                    )}
                                    
                                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3 mb-4">
                                        <Label htmlFor="detailedWorkflowType" className="text-left">Tipo de Fluxo Detalhado</Label>
                                        <Select value={detailedWorkflowType} onValueChange={(value) => setDetailedWorkflowType(value as 'sequential' | 'parallel' | 'loop' | undefined)}>
                                            <SelectTrigger id="detailedWorkflowType" className="h-10"><SelectValue placeholder="Selecione o tipo de fluxo" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="sequential">Sequencial (Executar em ordem)</SelectItem>
                                                <SelectItem value="parallel">Paralelo (Executar simultaneamente)</SelectItem>
                                                <SelectItem value="loop">Loop (Repetir até condição)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    
                                    <div className="grid grid-cols-[200px_1fr] items-start gap-x-4 gap-y-3">
                                        <Label htmlFor="workflowDescription" className="text-left pt-2">Descrição do Fluxo</Label>
                                        <Textarea 
                                            id="workflowDescription" 
                                            placeholder="Descreva como as ferramentas serão executadas neste fluxo..." 
                                            value={workflowDescription} 
                                            onChange={(e) => setWorkflowDescription(e.target.value)}
                                            className="min-h-24 resize-y"
                                        />
                                    </div>
                                    
                                    {detailedWorkflowType === 'loop' && (
                                        <>
                                            <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3 mt-6">
                                                <Label htmlFor="loopMaxIterations" className="text-left">Máximo de Iterações</Label>
                                                <Input 
                                                    id="loopMaxIterations" 
                                                    type="number" 
                                                    placeholder="ex: 10" 
                                                    value={loopMaxIterations?.toString() || ""} 
                                                    onChange={(e) => setLoopMaxIterations(e.target.value ? parseInt(e.target.value) : undefined)}
                                                    className="h-10"
                                                />
                                            </div>
                                            
                                            <div className="grid grid-cols-[200px_1fr] items-start gap-x-4 gap-y-3">
                                                <Label className="text-left pt-2">Condição de Término</Label>
                                                <RadioGroup 
                                                    value={loopTerminationConditionType || 'tool'} 
                                                    onValueChange={(value) => setLoopTerminationConditionType(value as 'tool' | 'state')}
                                                    className="space-y-3"
                                                >
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="tool" id="tool-condition" />
                                                        <Label htmlFor="tool-condition" className="font-normal">Baseado em Ferramenta</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="state" id="state-condition" />
                                                        <Label htmlFor="state-condition" className="font-normal">Baseado em Estado</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>
                                            
                                            {loopTerminationConditionType === 'tool' && (
                                                <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                                                    <Label htmlFor="loopExitToolName" className="text-left">Nome da Ferramenta de Saída</Label>
                                                    <Input 
                                                        id="loopExitToolName" 
                                                        placeholder="ex: exitLoop" 
                                                        value={loopExitToolName || ""} 
                                                        onChange={(e) => setLoopExitToolName(e.target.value)}
                                                        className="h-10"
                                                    />
                                                </div>
                                            )}
                                            
                                            {loopTerminationConditionType === 'state' && (
                                                <>
                                                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                                                        <Label htmlFor="loopExitStateKey" className="text-left">Chave do Estado</Label>
                                                        <Input 
                                                            id="loopExitStateKey" 
                                                            placeholder="ex: loopComplete" 
                                                            value={loopExitStateKey || ""} 
                                                            onChange={(e) => setLoopExitStateKey(e.target.value)}
                                                            className="h-10"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                                                        <Label htmlFor="loopExitStateValue" className="text-left">Valor do Estado para Saída</Label>
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
                    </TooltipProvider>
                </TabsContent>

                <TabsContent value="ferramentas" className="space-y-6">
                     <TooltipProvider>
                        <div>
                            <h3 className="text-lg font-medium mb-1 flex items-center gap-2"><Network className="w-5 h-5 text-primary/80" /> Ferramentas do Agente (Capacidades via Genkit)</h3>
                            <p className="text-sm text-muted-foreground mb-4">Capacite seu agente com funcionalidades para interagir com o mundo exterior. A execução real de cada ferramenta é gerenciada por um fluxo Genkit no backend.</p>
                            <Card className="bg-muted/30 border-border/50">
                                <CardContent className="p-4 space-y-3">
                                <div className="space-y-3 pt-2">
                                    {availableTools.map((tool) => {
                                        const isToolSelected = currentAgentTools.includes(tool.id);
                                        const toolConfig = toolConfigurations[tool.id];
                                        const isConfigured = tool.needsConfiguration && toolConfig &&
                                                            ( (tool.id === 'webSearch' && toolConfig.googleApiKey && toolConfig.googleCseId) ||
                                                                (tool.id === 'customApiIntegration' && toolConfig.openapiSpecUrl) ||
                                                                (tool.id === 'databaseAccess' && (toolConfig.dbConnectionString || (toolConfig.dbHost && toolConfig.dbName))) ||
                                                                (tool.id === 'knowledgeBase' && toolConfig.knowledgeBaseId) ||
                                                                (tool.id === 'calendarAccess' && toolConfig.calendarApiEndpoint) ||
                                                                (tool.needsConfiguration && !['webSearch', 'customApiIntegration', 'databaseAccess', 'knowledgeBase', 'calendarAccess'].includes(tool.id) && Object.keys(toolConfig || {}).length > 0)
                                                            );
                                        return (
                                        <div key={tool.id} className="flex items-start p-3 border rounded-md bg-background hover:bg-muted/50 transition-colors border-border/50">
                                            <Checkbox id={`tool-${tool.id}`} checked={isToolSelected} onCheckedChange={(checked) => handleToolSelectionChange(tool.id, !!checked)} className="mt-1 mr-3 shrink-0"/>
                                            <div className="flex-grow">
                                                <Label htmlFor={`tool-${tool.id}`} className="font-medium flex items-center cursor-pointer group">
                                                    {React.isValidElement(tool.icon) ? React.cloneElement(tool.icon, { size: 18, className: "mr-2 text-primary/90"}) : <Cpu size={18} className="mr-2 text-primary/90"/>}
                                                    {tool.label}
                                                    {tool.needsConfiguration && <ConfigureIcon size={14} className={cn("ml-2 text-muted-foreground group-hover:text-primary transition-colors", isConfigured && "text-green-500")} title={isConfigured ? "Configurada" : "Requer Configuração"}/>}
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-0.5 pl-7">{tool.description}</p>
                                            </div>
                                            {tool.needsConfiguration && isToolSelected && (
                                            <Button variant="outline" size="sm" className={cn("ml-auto shrink-0 h-8 px-3", isConfigured && "border-green-500/50 hover:border-green-500 text-green-600 hover:text-green-500 hover:bg-green-500/10")} onClick={() => openToolConfigModal(tool)}>
                                                <ConfigureIcon size={14} className={cn("mr-1.5", isConfigured && "text-green-500")} />
                                                {isConfigured ? "Reconfigurar" : "Configurar"}
                                            </Button>
                                            )}
                                        </div>
                                    );
                                    })}
                                </div>
                                {currentAgentTools.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-border/50">
                                    <h4 className="text-sm font-medium mb-2">Ferramentas Selecionadas:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {currentAgentTools.map(toolId => {
                                            const tool = availableTools.find(t => t.id === toolId);
                                            if (!tool) return null;
                                            const toolConfig = toolConfigurations[tool.id];
                                            const isToolConfigured = tool.needsConfiguration && toolConfig &&
                                                                ( (tool.id === 'webSearch' && toolConfig.googleApiKey && toolConfig.googleCseId) ||
                                                                    (tool.id === 'customApiIntegration' && toolConfig.openapiSpecUrl) ||
                                                                    (tool.id === 'databaseAccess' && (toolConfig.dbConnectionString || (toolConfig.dbHost && toolConfig.dbName))) ||
                                                                    (tool.id === 'knowledgeBase' && toolConfig.knowledgeBaseId) ||
                                                                    (tool.id === 'calendarAccess' && toolConfig.calendarApiEndpoint) ||
                                                                    (tool.needsConfiguration && !['webSearch', 'customApiIntegration', 'databaseAccess', 'knowledgeBase', 'calendarAccess'].includes(tool.id) && Object.keys(toolConfig || {}).length > 0)
                                                                );
                                            return (
                                                <Badge key={toolId} variant={isToolConfigured && tool.needsConfiguration ? "default" : "secondary"} className={cn(isToolConfigured && tool.needsConfiguration && "bg-green-600/20 border-green-500/50 text-green-700 hover:bg-green-600/30", "whitespace-nowrap")}>
                                                    {React.isValidElement(tool.icon) ? React.cloneElement(tool.icon, { size: 12, className: "mr-1.5 inline-block"}) : <Cpu size={12} className="mr-1.5 inline-block"/>}
                                                    {tool.label}
                                                    {tool.needsConfiguration && (<ConfigureIcon size={12} className={`ml-1.5 ${isConfigured ? 'text-green-500' : 'text-blue-500'}`} title={isConfigured ? "Configurada" : "Requer configuração"}/> )}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                    </div>
                                )}
                                </CardContent>
                            </Card>
                        </div>
                     </TooltipProvider>
                </TabsContent>

                {['sequential', 'parallel', 'loop', 'workflow'].includes(agentType) && (
                    <TabsContent value="definicaoFluxo" className="space-y-6">
                        <TooltipProvider>
                            {agentTypeOptions.find(opt => opt.id === agentType) && (
                                <Alert variant="default" className="mb-4 bg-card border-border/60">
                                    {agentTypeOptions.find(opt => opt.id === agentType)!.icon ? React.cloneElement(agentTypeOptions.find(opt => opt.id === agentType)!.icon as React.ReactElement, { className: "h-4 w-4 text-primary/80" }) : <Cpu className="h-4 w-4 text-primary/80" />}
                                    <AlertTitle>{agentTypeOptions.find(opt => opt.id === agentType)!.label.split(' (')[0].trim()}</AlertTitle>
                                    <AlertDescription>{agentTypeOptions.find(opt => opt.id === agentType)!.description}</AlertDescription>
                                </Alert>
                            )}
                            <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3 mb-4">
                                <Label htmlFor="detailedWorkflowType" className="text-left">Tipo de Fluxo Detalhado</Label>
                                <Select value={detailedWorkflowType} onValueChange={(value) => setDetailedWorkflowType(value as 'sequential' | 'parallel' | 'loop' | undefined)}>
                                <SelectTrigger id="detailedWorkflowType" className="h-10"><SelectValue placeholder="Selecione o tipo de fluxo" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sequential">Sequencial (Executar em ordem)</SelectItem>
                                    <SelectItem value="parallel">Paralelo (Executar simultaneamente)</SelectItem>
                                    <SelectItem value="loop">Loop (Repetir até condição)</SelectItem>
                                </SelectContent>
                                </Select>
                            </div>

                            {detailedWorkflowType === 'sequential' && (
                                <Card className="bg-muted/30 border-border/50">
                                <CardHeader><CardTitle className="text-base">Configurar Etapas Sequenciais</CardTitle><CardDescription className="text-xs">Defina a ordem dos subagentes. A saída de uma etapa pode ser usada pela próxima.</CardDescription></CardHeader>
                                <CardContent className="space-y-3">
                                    <Button variant="outline" size="sm" className="w-full h-9" onClick={() => toast({ title: "Em breve!", description: "Adicionar subagente sequencial."})}><PlusCircle size={16} className="mr-2" /> Adicionar Subagente/Etapa</Button>
                                    <div className="p-3 border rounded-md bg-background/70 space-y-2 border-border/50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2"><GripVertical size={16} className="text-muted-foreground cursor-grab" title="Reordenar (arrastar)"/><span className="text-sm">Ex: Agente de Análise de Sentimento (Tipo: LLM, ID: agent_sentiment)</span></div>
                                            <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: "Em breve!", description: "Configurar Etapa: Aqui você definiria as instruções específicas para este subagente, incluindo como ele pode usar chaves de saída de etapas anteriores (ex: {resultado_etapa_anterior}) e qual chave de saída (output_key) ele próprio fornecerá."})}><Settings size={14} /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => toast({ title: "Em breve!", description: "Remover etapa."})}><Trash2 size={14} /></Button>
                                            </div>
                                        </div>
                                        <div className="pl-6 space-y-1">
                                            <Label htmlFor="outputKeySequential" className="text-xs text-muted-foreground">Chave de Saída (opcional):</Label>
                                            <Input id="outputKeySequential" readOnly disabled className="h-7 text-xs bg-muted/50 border-border/40" placeholder="ex: sentimento_analisado" />
                                            <p className="text-xs text-muted-foreground/80">Use esta chave para referenciar a saída desta etapa (ex: salva no estado da sessão) em etapas futuras.</p>
                                        </div>
                                    </div>
                                </CardContent>
                                </Card>
                            )}
                            {detailedWorkflowType === 'parallel' && (
                                <Card className="bg-muted/30 border-border/50">
                                    <CardHeader><CardTitle className="text-base">Configurar Tarefas Paralelas</CardTitle><CardDescription className="text-xs">Adicione os subagentes que devem ser executados simultaneamente.</CardDescription></CardHeader>
                                    <CardContent className="space-y-3">
                                        <Alert variant="default" className="mt-3 mb-4 bg-card border-border/70">
                                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                            <AlertTitle className="text-sm font-medium">Importante: Execução Independente das Tarefas Paralelas</AlertTitle>
                                            <AlertDescription className="text-xs">
                                                Os subagentes configurados aqui serão executados em paralelo (simultaneamente) e operam de forma independente. 
                                                Não há compartilhamento automático de histórico de conversa ou estado entre eles durante a execução. 
                                                Para coletar e processar esses resultados, geralmente é necessário:
                                                <br />1. Que cada subagente paralelo use uma 'Chave de Saída' (`output_key`) única para salvar seu resultado individual (ex: no estado da sessão).
                                                <br />2. Adicionar um Agente Sequencial subsequente que, por sua vez, pode conter um `CustomAgent` ou `LlmAgent` para realizar a lógica de combinação, análise ou tomada de decisão com base nos múltiplos resultados paralelos.
                                            </AlertDescription>
                                        </Alert>
                                        <Button variant="outline" size="sm" className="w-full h-9" onClick={() => toast({ title: "Em breve!", description: "Adicionar subagente/tarefa paralela."})}>
                                            <PlusCircle size={16} className="mr-2" /> Adicionar Subagente/Tarefa Paralela
                                        </Button>
                                        <div className="p-3 border rounded-md bg-background/70 space-y-2 border-border/50">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Ex: Agente de Geração de Imagem (Tipo: Custom, ID: agent_image_gen)</span>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: "Em breve!", description: "Configurar Tarefa Paralela: Aqui você definiria as instruções para este subagente, incluindo a output_key que ele usará para armazenar seu resultado individual. Lembre-se que ele rodará em paralelo e, por padrão, de forma isolada de outras tarefas paralelas."})}>
                                                        <Settings size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => toast({ title: "Em breve!", description: "Remover tarefa."})}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="pl-0 space-y-1 mt-1.5">
                                                <Label htmlFor="outputKeyParallel" className="text-xs text-muted-foreground">Chave de Saída (para resultado individual):</Label>
                                                <Input id="outputKeyParallel" readOnly disabled className="h-7 text-xs bg-muted/50 border-border/40" placeholder="ex: resultado_imagem_gerada" />
                                                <p className="text-xs text-muted-foreground/80">Use esta chave para que um agente sequencial posterior possa acessar o resultado desta tarefa paralela (ex: salvo no estado da sessão).</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {detailedWorkflowType === 'loop' && (
                                <Card className="bg-muted/30 border-border/50">
                                    <CardHeader><CardTitle className="text-base">Configurar Loop de Execução</CardTitle><CardDescription className="text-xs">Defina o(s) subagente(s) a serem repetidos e a condição de término.</CardDescription></CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                                            <Label htmlFor="loopMaxIterations" className="text-left">Nº Máximo de Iterações (Opc.)</Label>
                                            <Input id="loopMaxIterations" type="number" min="1" placeholder="Ex: 5" value={loopMaxIterations || ""} onChange={(e) => setLoopMaxIterations(e.target.value ? parseInt(e.target.value) : undefined)} className="h-9" />
                                        </div>
                                        
                                        <div className="grid grid-cols-[200px_1fr] items-start gap-x-4">
                                            <Label className="text-left pt-1 flex items-center gap-1.5">Condição de Término Adicional
                                                <Tooltip>
                                                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                                    <TooltipContent className="max-w-xs"><p>Define como o loop pode terminar além do número máximo de iterações. "Sinalização por Subagente" permite que uma etapa interna ao loop cause a sua interrupção.</p></TooltipContent>
                                                </Tooltip>
                                            </Label>
                                            <RadioGroup value={loopTerminationConditionType || 'none'} onValueChange={(value) => setLoopTerminationConditionType(value as 'none' | 'subagent_signal' | undefined)} className="pt-1">
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="none" id="loop-cond-none" /><Label htmlFor="loop-cond-none" className="font-normal">Nenhuma</Label></div>
                                                <div className="flex items-center space-x-2"><RadioGroupItem value="subagent_signal" id="loop-cond-signal" /><Label htmlFor="loop-cond-signal" className="font-normal">Sinalização por Subagente</Label></div>
                                            </RadioGroup>
                                        </div>

                                        {loopTerminationConditionType === 'subagent_signal' && (
                                            <Alert variant="default" className="mt-3 bg-card border-border/70">
                                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                                <AlertTitle className="text-sm font-medium">Sinalização por Subagente</AlertTitle>
                                                <AlertDescription className="text-xs space-y-2">
                                                    <p>Um subagente dentro do loop pode sinalizar o término (ex: usando uma ferramenta como 'exit_loop' ou retornando um valor/estado particular). Configure o subagente apropriado com essa lógica.</p>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="loopExitTool" className="text-xs">Ferramenta de Saída (Exemplo):</Label>
                                                        <Input id="loopExitTool" value={loopExitToolName || ""} onChange={(e) => setLoopExitToolName(e.target.value)} placeholder="exit_loop" className="h-7 text-xs mt-0.5 bg-muted/50 border-border/40" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="loopExitStateKey" className="text-xs">Chave de Estado para Saída (Exemplo):</Label>
                                                        <Input id="loopExitStateKey" value={loopExitStateKey || ""} onChange={(e) => setLoopExitStateKey(e.target.value)} placeholder="status_documento" className="h-7 text-xs mt-0.5 bg-muted/50 border-border/40" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="loopExitStateValue" className="text-xs">Valor de Estado para Sair (Exemplo):</Label>
                                                        <Input id="loopExitStateValue" value={loopExitStateValue || ""} onChange={(e) => setLoopExitStateValue(e.target.value)} placeholder="FINALIZADO" className="h-7 text-xs mt-0.5 bg-muted/50 border-border/40" />
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                        <Separator className="my-3"/>
                                        <h4 className="text-sm font-medium pt-1">Subagente(s) na Sequência do Loop:</h4>
                                        <Button variant="outline" size="sm" className="w-full h-9" onClick={() => toast({ title: "Em breve!", description: "Adicionar subagente ao loop."})}>
                                            <PlusCircle size={16} className="mr-2" /> Adicionar Subagente ao Loop
                                        </Button>
                                        <div className="p-3 border rounded-md bg-background/70 space-y-2 border-border/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2"><GripVertical size={16} className="text-muted-foreground cursor-grab" title="Reordenar (arrastar)"/><span className="text-sm">Ex: Agente de Coleta de Dados (Tipo: LLM, ID: agent_data_collector)</span></div>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: "Em breve!", description: "Configurar Etapa do Loop: Aqui você definiria as instruções para este subagente, como ele usa output_keys de etapas anteriores na mesma iteração, qual output_key ele produz, e se ele tem um papel em sinalizar o término do loop (ex: usando uma ferramenta como 'exit_loop' ou verificando uma condição)." })}>
                                                        <Settings size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => toast({ title: "Em breve!", description: "Remover subagente."})}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="pl-6 space-y-1">
                                                <Label htmlFor="outputKeyLoopStep" className="text-xs text-muted-foreground">Chave de Saída (opcional):</Label>
                                                <Input id="outputKeyLoopStep" readOnly disabled className="h-7 text-xs bg-muted/50 border-border/40" placeholder="ex: dados_coletados_iteracao" />
                                                <p className="text-xs text-muted-foreground/80">Use esta chave para referenciar a saída desta etapa (ex: salva no estado da sessão) dentro da iteração ou após o loop.</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </TooltipProvider>
                    </TabsContent>
                )}

                <TabsContent value="memoriaConhecimento" className="space-y-6">
                    <TooltipProvider>
                        <MemoryKnowledgeTab
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
                        <A2AConfigComponent
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
            <Dialog open={isToolConfigModalOpen} onOpenChange={(open) => {
                if (!open) setConfiguringTool(null);
                setIsToolConfigModalOpen(open);
            }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                <DialogTitle>Configurar: {configuringTool.label}</DialogTitle>
                <DialogDescription>{configuringTool.description} Forneça os detalhes de configuração abaixo.</DialogDescription>
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
