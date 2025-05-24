
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Cpu, PlusCircle, Save, Info, Workflow, Settings, Brain, Target, ListChecks, Smile, Ban, Search, Calculator, FileText, CalendarDays, Network, Layers, Trash2, Edit, MessageSquare, Share2, FileJson, Database, Code2, BookText, Languages, Settings2 as ConfigureIcon, ClipboardCopy, Briefcase, Stethoscope, Plane, GripVertical, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // Added missing import
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

import type { 
  SavedAgentConfiguration, 
  AgentConfig, 
  LLMAgentConfig, 
  WorkflowAgentConfig, 
  CustomAgentConfig,
  AvailableTool, 
  AgentTemplate, 
  ToolConfigData,
  AgentConfigBase
} from '@/app/agent-builder/page'; // Importando tipos da página principal

interface AgentBuilderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingAgent: SavedAgentConfiguration | null; // Agente a ser editado, ou null para criar novo
  onSave: (agentConfig: SavedAgentConfiguration) => void; // Callback para salvar o agente
  agentTemplates: AgentTemplate[];
  availableTools: AvailableTool[];
  agentTypeOptions: { id: string; label: string; icon?: React.ReactNode; description?: string; }[];
  agentToneOptions: { id: string; label: string; }[];
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>; // Para ícones de ferramentas
}

const defaultLLMConfigValues: Omit<LLMAgentConfig, keyof AgentConfigBase | 'agentType'> = {
    agentGoal: "",
    agentTasks: "",
    agentPersonality: "", // Será definido pelo primeiro agentToneOption
    agentRestrictions: "",
    agentModel: "googleai/gemini-2.0-flash",
    agentTemperature: 0.7,
};


export function AgentBuilderDialog({
  isOpen,
  onOpenChange,
  editingAgent,
  onSave,
  agentTemplates,
  availableTools,
  agentTypeOptions,
  agentToneOptions,
  iconComponents,
}: AgentBuilderDialogProps) {
  const { toast } = useToast();

  // Inicializa defaultLLMConfigValues.agentPersonality com o primeiro tom disponível
  if (agentToneOptions.length > 0 && !defaultLLMConfigValues.agentPersonality) {
    defaultLLMConfigValues.agentPersonality = agentToneOptions[0].label;
  }


  // Estados do formulário (replicados de AgentBuilderPage)
  const [selectedAgentTemplateId, setSelectedAgentTemplateId] = React.useState<string>(agentTemplates[0].id);
  const [agentType, setAgentType] = React.useState<AgentConfig["agentType"]>(agentTemplates[0].config.agentType);
  
  const [agentName, setAgentName] = React.useState(editingAgent?.agentName || agentTemplates[0].config.agentName);
  const [agentDescription, setAgentDescription] = React.useState(editingAgent?.agentDescription || agentTemplates[0].config.agentDescription);
  const [agentVersion, setAgentVersion] = React.useState(editingAgent?.agentVersion || agentTemplates[0].config.agentVersion);
  const [currentAgentTools, setCurrentAgentTools] = React.useState<string[]>(editingAgent?.agentTools || agentTemplates[0].config.agentTools);

  const initialLLMConfig = editingAgent && editingAgent.agentType === 'llm' ? editingAgent : 
                           (editingAgent && (editingAgent.agentType === 'workflow' || editingAgent.agentType === 'custom') ? editingAgent : agentTemplates[0].config.agentType === 'llm' ? agentTemplates[0].config : defaultLLMConfigValues) as Partial<LLMAgentConfig>;

  const [agentGoal, setAgentGoal] = React.useState(initialLLMConfig.agentGoal || defaultLLMConfigValues.agentGoal);
  const [agentTasks, setAgentTasks] = React.useState(initialLLMConfig.agentTasks || defaultLLMConfigValues.agentTasks);
  const [agentPersonality, setAgentPersonality] = React.useState(initialLLMConfig.agentPersonality || defaultLLMConfigValues.agentPersonality);
  const [agentRestrictions, setAgentRestrictions] = React.useState(initialLLMConfig.agentRestrictions || defaultLLMConfigValues.agentRestrictions);
  const [agentModel, setAgentModel] = React.useState(initialLLMConfig.agentModel || defaultLLMConfigValues.agentModel);
  const [agentTemperature, setAgentTemperature] = React.useState([(initialLLMConfig.agentTemperature === undefined ? defaultLLMConfigValues.agentTemperature : initialLLMConfig.agentTemperature)]);


  const initialWorkflowConfig = editingAgent && editingAgent.agentType === 'workflow' ? editingAgent :
                                agentTemplates[0].config.agentType === 'workflow' ? agentTemplates[0].config as WorkflowAgentConfig : {} as Partial<WorkflowAgentConfig>;

  const [detailedWorkflowType, setDetailedWorkflowType] = React.useState<'sequential' | 'parallel' | 'loop' | undefined>(initialWorkflowConfig.detailedWorkflowType);
  const [workflowDescription, setWorkflowDescription] = React.useState(initialWorkflowConfig.workflowDescription || "");
  
  const [loopMaxIterations, setLoopMaxIterations] = React.useState<number | undefined>(initialWorkflowConfig.loopMaxIterations);
  const [loopTerminationConditionType, setLoopTerminationConditionType] = React.useState<'none' | 'subagent_signal' | undefined>(initialWorkflowConfig.loopTerminationConditionType || 'none');
  const [loopExitToolName, setLoopExitToolName] = React.useState<string | undefined>(initialWorkflowConfig.loopExitToolName);
  const [loopExitStateKey, setLoopExitStateKey] = React.useState<string | undefined>(initialWorkflowConfig.loopExitStateKey);
  const [loopExitStateValue, setLoopExitStateValue] = React.useState<string | undefined>(initialWorkflowConfig.loopExitStateValue);

  const initialCustomConfig = editingAgent && editingAgent.agentType === 'custom' ? editingAgent :
                              agentTemplates[0].config.agentType === 'custom' ? agentTemplates[0].config as CustomAgentConfig : {} as Partial<CustomAgentConfig>;
  const [customLogicDescription, setCustomLogicDescription] = React.useState(initialCustomConfig.customLogicDescription || "");

  // Estados para o modal de configuração de ferramentas (interno a este diálogo)
  const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, ToolConfigData>>(editingAgent?.toolConfigsApplied || {});
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

  const getToolIconComponent = (iconName?: keyof typeof iconComponents | 'default') => {
    const Icon = iconName ? iconComponents[iconName] : iconComponents['Default'];
    return Icon || Cpu;
  };
  
  React.useEffect(() => {
    if (editingAgent) {
      setSelectedAgentTemplateId(editingAgent.templateId || agentTemplates[0].id);
      setAgentType(editingAgent.agentType);
      setAgentName(editingAgent.agentName);
      setAgentDescription(editingAgent.agentDescription);
      setAgentVersion(editingAgent.agentVersion);
      setCurrentAgentTools(editingAgent.agentTools);
      setToolConfigurations(editingAgent.toolConfigsApplied || {});

      if (editingAgent.agentType === 'llm') {
        const config = editingAgent as LLMAgentConfig;
        resetLLMFields(config);
        resetWorkflowFields();
        resetCustomLogicFields();
      } else if (editingAgent.agentType === 'workflow') {
        const config = editingAgent as WorkflowAgentConfig;
        resetWorkflowFields(config);
        resetLLMFields({
            agentGoal: config.agentGoal || defaultLLMConfigValues.agentGoal,
            agentTasks: config.agentTasks || defaultLLMConfigValues.agentTasks,
            agentPersonality: config.agentPersonality || defaultLLMConfigValues.agentPersonality,
            agentRestrictions: config.agentRestrictions || defaultLLMConfigValues.agentRestrictions,
            agentModel: config.agentModel || defaultLLMConfigValues.agentModel,
            agentTemperature: config.agentTemperature === undefined ? defaultLLMConfigValues.agentTemperature : config.agentTemperature,
        });
        resetCustomLogicFields();
      } else if (editingAgent.agentType === 'custom') {
        const config = editingAgent as CustomAgentConfig;
        resetCustomLogicFields(config);
        resetLLMFields({
            agentGoal: config.agentGoal || defaultLLMConfigValues.agentGoal,
            agentTasks: config.agentTasks || defaultLLMConfigValues.agentTasks,
            agentPersonality: config.agentPersonality || defaultLLMConfigValues.agentPersonality,
            agentRestrictions: config.agentRestrictions || defaultLLMConfigValues.agentRestrictions,
            agentModel: config.agentModel || defaultLLMConfigValues.agentModel,
            agentTemperature: config.agentTemperature === undefined ? defaultLLMConfigValues.agentTemperature : config.agentTemperature,
        });
        resetWorkflowFields();
      }
    } else {
      // Reset to default template if not editing
      handleTemplateChange(agentTemplates[0].id, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingAgent, agentTemplates]); // Depend on editingAgent and templates to re-initialize

  const resetLLMFields = (config: Partial<LLMAgentConfig>) => {
    setAgentGoal(config.agentGoal || defaultLLMConfigValues.agentGoal);
    setAgentTasks(config.agentTasks || defaultLLMConfigValues.agentTasks);
    setAgentPersonality(config.agentPersonality || defaultLLMConfigValues.agentPersonality);
    setAgentRestrictions(config.agentRestrictions || defaultLLMConfigValues.agentRestrictions);
    setAgentModel(config.agentModel || defaultLLMConfigValues.agentModel);
    setAgentTemperature([config.agentTemperature === undefined ? defaultLLMConfigValues.agentTemperature : config.agentTemperature]);
  };

  const resetWorkflowFields = (config?: Partial<WorkflowAgentConfig>) => {
    setWorkflowDescription(config?.workflowDescription || "");
    setDetailedWorkflowType(config?.detailedWorkflowType || undefined);
    setLoopMaxIterations(config?.loopMaxIterations || undefined);
    setLoopTerminationConditionType(config?.loopTerminationConditionType || 'none');
    setLoopExitToolName(config?.loopExitToolName || undefined);
    setLoopExitStateKey(config?.loopExitStateKey || undefined);
    setLoopExitStateValue(config?.loopExitStateValue || undefined);
  };

  const resetCustomLogicFields = (config?: Partial<CustomAgentConfig>) => {
    setCustomLogicDescription(config?.customLogicDescription || "");
  };

  const handleTemplateChange = (templateId: string, isInitialLoad = false) => {
    const template = agentTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedAgentTemplateId(templateId);
      const config = template.config;
      setAgentType(config.agentType);
      setAgentName(isInitialLoad && editingAgent ? editingAgent.agentName : config.agentName);
      setAgentDescription(isInitialLoad && editingAgent ? editingAgent.agentDescription : config.agentDescription);
      setAgentVersion(isInitialLoad && editingAgent ? editingAgent.agentVersion : config.agentVersion);
      setCurrentAgentTools(isInitialLoad && editingAgent ? editingAgent.agentTools : config.agentTools);
      
      if (!isInitialLoad || !editingAgent) { // Only reset tool configs if not initial load of an editing agent
        setToolConfigurations({});
      }


      if (config.agentType === 'llm') {
        resetLLMFields(config);
        resetWorkflowFields();
        resetCustomLogicFields();
      } else if (config.agentType === 'workflow') {
        resetLLMFields(config as Partial<LLMAgentConfig>); 
        resetWorkflowFields(config);
        resetCustomLogicFields();
      } else if (config.agentType === 'custom') {
        resetLLMFields(config as Partial<LLMAgentConfig>); 
        resetWorkflowFields();
        resetCustomLogicFields(config);
      }
    }
  };
  
  const handleAgentTypeChange = (newAgentType: AgentConfig["agentType"]) => {
    setAgentType(newAgentType);
    if (newAgentType === 'llm') {
        resetWorkflowFields();
        resetCustomLogicFields();
        const currentTemplate = agentTemplates.find(t => t.id === selectedAgentTemplateId);
        if (currentTemplate && currentTemplate.config.agentType !== 'llm' && (!editingAgent || editingAgent.agentType !== 'llm')) {
           resetLLMFields(defaultLLMConfigValues);
        }
    } else if (newAgentType === 'workflow') {
        resetCustomLogicFields();
        if (agentType !== 'workflow' && (!editingAgent || editingAgent.agentType !== 'workflow')) { 
            resetWorkflowFields({ detailedWorkflowType: undefined, workflowDescription: "" });
        }
    } else if (newAgentType === 'custom') {
        resetWorkflowFields();
        if(agentType !== 'custom' && (!editingAgent || editingAgent.agentType !== 'custom')) {
            resetCustomLogicFields();
        }
    }
  };

  const constructSystemPrompt = () => {
    const currentConfig = { agentGoal, agentTasks, agentPersonality, agentRestrictions, agentType, agentName, agentDescription, workflowDescription, detailedWorkflowType, loopMaxIterations, loopTerminationConditionType, loopExitToolName, loopExitStateKey, loopExitStateValue, customLogicDescription }; 
    
    if (currentConfig.agentType !== 'llm' && !currentConfig.agentGoal && !currentConfig.agentTasks && !currentConfig.agentPersonality && !currentConfig.agentModel) {
        if (currentConfig.agentType === 'workflow' && !currentConfig.workflowDescription) return undefined;
        if (currentConfig.agentType === 'custom' && !currentConfig.customLogicDescription) return undefined;
        if (currentConfig.agentType !== 'workflow' && currentConfig.agentType !== 'custom') return undefined;
    }
    
    let prompt = `Você é um agente de IA. Seu nome é "${currentConfig.agentName || 'Agente'}".\n`;
    if (currentConfig.agentDescription) {
      prompt += `Sua descrição geral é: "${currentConfig.agentDescription}".\n`;
    }

    const agentTypeDetail = agentTypeOptions.find(opt => opt.id === currentConfig.agentType);
    if(agentTypeDetail){
      prompt += `Seu tipo principal é ${agentTypeDetail.label.split(' (')[0].trim()}. ${agentTypeDetail.description}\n`;
    }


    if (currentConfig.agentType === 'workflow') {
        if (currentConfig.detailedWorkflowType) {
            prompt += `Subtipo de fluxo de trabalho: ${currentConfig.detailedWorkflowType}.\n`;
        }
        if (currentConfig.workflowDescription) {
             prompt += `Descrição do fluxo: ${currentConfig.workflowDescription}.\n`;
        }
        if(currentConfig.detailedWorkflowType === 'loop' && currentConfig.loopMaxIterations) {
            prompt += `O loop repetirá no máximo ${currentConfig.loopMaxIterations} vezes.\n`;
        }
        if(currentConfig.detailedWorkflowType === 'loop' && currentConfig.loopTerminationConditionType === 'subagent_signal') {
            prompt += `O loop também pode terminar se um subagente sinalizar (ex: via ferramenta '${currentConfig.loopExitToolName || 'exit_loop'}' ou estado '${currentConfig.loopExitStateKey || 'status'}' atingir '${currentConfig.loopExitStateValue || 'FINALIZADO'}').\n`;
        }
    } else if (currentConfig.agentType === 'custom') {
        if (currentConfig.customLogicDescription) {
            prompt += `Descrição da lógica customizada: ${currentConfig.customLogicDescription}.\n`;
        }
    }
    
    if (currentConfig.agentGoal || currentConfig.agentTasks || currentConfig.agentPersonality || currentConfig.agentRestrictions) {
        prompt += `\nA seguir, as instruções de comportamento para qualquer capacidade de LLM que você possua (mesmo que seu tipo principal não seja LLM, você pode usar um LLM para tarefas específicas ou descrição):\n\n`;
        if (currentConfig.agentGoal) prompt += `OBJETIVO PRINCIPAL (se usando LLM):\n${currentConfig.agentGoal}\n\n`;
        if (currentConfig.agentTasks) prompt += `TAREFAS PRINCIPAIS A SEREM REALIZADAS (se usando LLM):\n${currentConfig.agentTasks}\n\n`;
        if (currentConfig.agentPersonality) prompt += `PERSONALIDADE/TOM DE COMUNICAÇÃO (se usando LLM):\n${currentConfig.agentPersonality}\n\n`;
        if (currentConfig.agentRestrictions) {
          prompt += `RESTRIÇÕES E DIRETRIZES IMPORTANTES A SEGUIR RIGOROSAMENTE (se usando LLM):\n${currentConfig.agentRestrictions}\n\n`;
        }
    }


    const selectedToolObjects = currentAgentTools
      .map(toolId => availableTools.find(t => t.id === toolId))
      .filter(Boolean) as AvailableTool[];

    if (selectedToolObjects.length > 0) {
        prompt += `FERRAMENTAS DISPONÍVEIS PARA USO PELO LLM (Você deve decidir quando e como usá-las):\n`;
        selectedToolObjects.forEach(tool => {
            const currentToolConfig = toolConfigurations[tool.id];
            const isConfigured = tool.needsConfiguration && currentToolConfig &&
                ( (tool.id === 'webSearch' && currentToolConfig.googleApiKey && currentToolConfig.googleCseId) ||
                  (tool.id === 'customApiIntegration' && currentToolConfig.openapiSpecUrl) ||
                  (tool.id === 'databaseAccess' && (currentToolConfig.dbConnectionString || (currentToolConfig.dbHost && currentToolConfig.dbName))) ||
                  (tool.id === 'knowledgeBase' && currentToolConfig.knowledgeBaseId) ||
                  (tool.id === 'calendarAccess' && currentToolConfig.calendarApiEndpoint) ||
                  (tool.needsConfiguration && !['webSearch', 'customApiIntegration', 'databaseAccess', 'knowledgeBase', 'calendarAccess'].includes(tool.id) && Object.keys(currentToolConfig).length > 0 ) 
                );

            const toolNameForPrompt = tool.genkitToolName || tool.label.replace(/\s+/g, '');
            prompt += `- Nome da Ferramenta para uso: '${toolNameForPrompt}'. Descrição: ${tool.description}${tool.needsConfiguration ? (isConfigured ? " (Status: Configurada e pronta para uso)" : " (Status: Requer configuração. Verifique antes de usar ou informe a necessidade de configuração)") : ""}\n`;
        });
        prompt += "\n";
    } else {
        prompt += `Nenhuma ferramenta externa está configurada para este agente para uso por um LLM.\n\n`;
    }

    prompt += "INSTRUÇÕES ADICIONAIS DE INTERAÇÃO (se usando LLM):\n";
    prompt += "- Responda de forma concisa e direta ao ponto, a menos que o tom da personalidade solicite o contrário.\n";
    prompt += "- Se você precisar usar uma ferramenta, anuncie claramente qual ferramenta (usando o 'Nome da Ferramenta para uso' fornecido acima) e por que você a usaria ANTES de simular sua execução ou pedir ao usuário para aguardar. Após a simulação (ou se a execução real for implementada), apresente os resultados obtidos pela ferramenta.\n";
    prompt += "- Seja transparente sobre suas capacidades e limitações. Se não puder realizar uma tarefa, explique o motivo.\n";
    prompt += "- Se uma ferramenta necessária não estiver configurada, informe ao usuário educadamente.\n";

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
            const iconProp = tool.icon;
            if (React.isValidElement(iconProp) && typeof iconProp.type === 'function') { 
                 const IconComponent = iconProp.type as React.FC<React.SVGProps<SVGSVGElement>>;
                 const foundIconName = Object.keys(iconComponents).find(
                    name => iconComponents[name] === IconComponent
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
    };

    if (agentType === 'llm') {
        agentConfigData = {
          ...agentConfigData,
          agentType: 'llm', 
          agentGoal,
          agentTasks,
          agentPersonality,
          agentRestrictions,
          agentModel,
          agentTemperature: agentTemperature[0],
        };
      } else if (agentType === 'workflow') {
        agentConfigData = {
          ...agentConfigData,
          agentType: 'workflow', 
          detailedWorkflowType,
          workflowDescription,
          loopMaxIterations: detailedWorkflowType === 'loop' ? loopMaxIterations : undefined,
          loopTerminationConditionType: detailedWorkflowType === 'loop' ? loopTerminationConditionType : undefined,
          loopExitToolName: detailedWorkflowType === 'loop' ? loopExitToolName : undefined,
          loopExitStateKey: detailedWorkflowType === 'loop' ? loopExitStateKey : undefined,
          loopExitStateValue: detailedWorkflowType === 'loop' ? loopExitStateValue : undefined,
          agentGoal: agentGoal || undefined, 
          agentTasks: agentTasks || undefined,
          agentPersonality: agentPersonality || undefined,
          agentRestrictions: agentRestrictions || undefined,
          agentModel: agentModel || undefined,
          agentTemperature: agentTemperature[0] ?? undefined,
        };
      } else { // custom
        agentConfigData = {
          ...agentConfigData,
          agentType: 'custom', 
          customLogicDescription,
          agentGoal: agentGoal || undefined, 
          agentTasks: agentTasks || undefined,
          agentPersonality: agentPersonality || undefined,
          agentRestrictions: agentRestrictions || undefined,
          agentModel: agentModel || undefined,
          agentTemperature: agentTemperature[0] ?? undefined,
        };
      }

    const completeAgentConfig: SavedAgentConfiguration = {
      id: editingAgent?.id || `agent-${Date.now()}`,
      templateId: selectedAgentTemplateId,
      ...(agentConfigData as AgentConfig), // Type assertion
      systemPromptGenerated: systemPrompt,
      toolsDetails: selectedToolsDetails,
      toolConfigsApplied: appliedToolConfigs,
    };
    onSave(completeAgentConfig);
    onOpenChange(false); // Close dialog after save
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
    setModalGoogleApiKey("");
    setModalGoogleCseId("");
    setModalOpenapiSpecUrl("");
    setModalOpenapiApiKey("");
    setModalDbType("");
    setModalDbConnectionString("");
    setModalDbUser("");
    setModalDbPassword("");
    setModalDbName("");
    setModalDbHost("");
    setModalDbPort("");
    setModalDbDescription("");
    setModalKnowledgeBaseId("");
    setModalCalendarApiEndpoint("");
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
        toast({ title: "Campos Obrigatórios", description: "Chave API e CSE ID são obrigatórios para Busca na Web.", variant: "destructive" });
        return;
      }
      newConfigData = { googleApiKey: modalGoogleApiKey, googleCseId: modalGoogleCseId };
    } else if (configuringTool.id === "customApiIntegration") {
      if (!modalOpenapiSpecUrl) {
        toast({ title: "Campo Obrigatório", description: "URL do Esquema OpenAPI é obrigatória.", variant: "destructive" });
        return;
      }
      newConfigData = { openapiSpecUrl: modalOpenapiSpecUrl, openapiApiKey: modalOpenapiApiKey };
    } else if (configuringTool.id === "databaseAccess") {
        if (!modalDbType || (!modalDbConnectionString && (!modalDbHost || !modalDbName))) {
             toast({ title: "Campos Obrigatórios", description: "Tipo de Banco e (String de Conexão ou Host/Nome do Banco) são obrigatórios.", variant: "destructive" });
            return;
        }
        newConfigData = {
            dbType: modalDbType,
            dbConnectionString: modalDbConnectionString,
            dbUser: modalDbUser,
            dbPassword: modalDbPassword,
            dbName: modalDbName,
            dbHost: modalDbHost,
            dbPort: modalDbPort,
            dbDescription: modalDbDescription,
        };
    } else if (configuringTool.id === "knowledgeBase") {
        if (!modalKnowledgeBaseId) {
            toast({ title: "Campo Obrigatório", description: "ID da Base de Conhecimento é obrigatório.", variant: "destructive" });
            return;
        }
        newConfigData = { knowledgeBaseId: modalKnowledgeBaseId };
    } else if (configuringTool.id === "calendarAccess") {
        if (!modalCalendarApiEndpoint) {
            toast({ title: "Campo Obrigatório", description: "Endpoint da API de Calendário é obrigatório.", variant: "destructive" });
            return;
        }
        newConfigData = { calendarApiEndpoint: modalCalendarApiEndpoint };
    }

    setToolConfigurations(prev => ({
      ...prev,
      [configuringTool.id!]: newConfigData as ToolConfigData,
    }));
    setIsToolConfigModalOpen(false);
    setConfiguringTool(null);
    toast({ title: `Configuração salva para ${configuringTool.label}`});
  };

  // JSX do formulário (grande parte do conteúdo de DialogContent do AgentBuilderPage)
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">
            {editingAgent ? `Editar Agente: ${agentName || 'Agente'}` : "Configurar Novo Agente"}
          </DialogTitle>
          <DialogDescription>
            {editingAgent ? "Modifique as propriedades e configurações do seu agente." : "Defina as propriedades e configurações para seu novo agente. Comece com um modelo ou configure do zero."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {/* Seção de Template e Tipo de Agente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentTemplate" className="flex items-center gap-1.5"><Layers size={16}/>Modelo de Agente Inicial (Template)</Label>
                <Select value={selectedAgentTemplateId} onValueChange={(value) => handleTemplateChange(value)} disabled={!!editingAgent}>
                  <SelectTrigger id="agentTemplate">
                    <SelectValue placeholder="Selecione um modelo para começar" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Modelos pré-configuram o tipo de agente e seus campos, incluindo instruções detalhadas. Não pode ser alterado durante a edição.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentType" className="flex items-center gap-1.5"><Share2 size={16}/>Tipo de Agente</Label>
                <Select value={agentType} onValueChange={(value) => handleAgentTypeChange(value as AgentConfig["agentType"])}>
                  <SelectTrigger id="agentType">
                    <SelectValue placeholder="Selecione o tipo de agente" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentTypeOptions.map(option => (
                      <SelectItem key={option.id} value={option.id}>
                         <div className="flex items-center">
                           {React.cloneElement(option.icon as React.ReactElement, { className: "mr-2 h-4 w-4 text-muted-foreground"})}
                           {option.label}
                         </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 <p className="text-xs text-muted-foreground">
                  {agentTypeOptions.find(opt => opt.id === agentType)?.description || "Define a arquitetura e o comportamento fundamental do agente."}
                </p>
              </div>
            </div>

            {/* Seção de Nome e Descrição */}
            <div className="space-y-2">
              <Label htmlFor="agentName">Nome do Agente</Label>
              <Input id="agentName" placeholder="ex: Agente de Suporte Avançado" value={agentName} onChange={(e) => setAgentName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentDescription">Descrição Geral do Agente</Label>
              <Textarea id="agentDescription" placeholder="Descreva a função principal e o objetivo geral deste agente..." value={agentDescription} onChange={(e) => setAgentDescription(e.target.value)} />
            </div>

            <Separator />
            
            {/* Seção de Comportamento e Instruções (LLM) */}
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-primary/80" /> Comportamento e Instruções {agentType !== 'llm' && !(agentGoal || agentTasks || agentPersonality || agentRestrictions || agentModel) && '(Opcional para este tipo)'}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {agentType === 'llm'
                  ? "Forneça instruções claras para guiar o comportamento de decisão do agente. As respostas abaixo ajudarão a construir o \"Prompt do Sistema\" ideal."
                  : "Se este agente utilizar um Modelo de Linguagem para alguma de suas funções ou para descrever seu comportamento geral, configure aqui."
                }
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agentGoal" className="flex items-center gap-1.5"><Target size={16}/>Qual é o objetivo principal deste agente?</Label>
                  <Input id="agentGoal" placeholder="ex: Ajudar usuários a encontrarem informações sobre nossos produtos." value={agentGoal} onChange={(e) => setAgentGoal(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentTasks" className="flex items-center gap-1.5"><ListChecks size={16}/>Quais são as principais tarefas que este agente deve realizar?</Label>
                  <Textarea id="agentTasks" placeholder="ex: 1. Responder perguntas sobre especificações. 2. Comparar produtos." value={agentTasks} onChange={(e) => setAgentTasks(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentPersonality" className="flex items-center gap-1.5"><Smile size={16}/>Qual deve ser a personalidade/tom do agente?</Label>
                  <Select value={agentPersonality} onValueChange={setAgentPersonality}>
                    <SelectTrigger id="agentPersonality"><SelectValue placeholder="Selecione um tom/personalidade" /></SelectTrigger>
                    <SelectContent>
                      {agentToneOptions.map(option => <SelectItem key={option.id} value={option.label}>{option.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentRestrictions" className="flex items-center gap-1.5"><Ban size={16}/>Há alguma restrição ou informação importante para o agente?</Label>
                  <Textarea id="agentRestrictions" placeholder="ex: Nunca fornecer informações de contato direto." value={agentRestrictions} onChange={(e) => setAgentRestrictions(e.target.value)} rows={3}/>
                </div>
              </div>
            </div>
            
            <Separator />

            {/* Seção de Configurações do Modelo (LLM) */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><Brain className="w-5 h-5 text-primary/80" /> Configurações do Modelo {agentType !== 'llm' && !agentModel && '(Opcional para este tipo)'}</h3>
              <p className="text-sm text-muted-foreground mb-4">Se este agente utilizar um Modelo de Linguagem Grande (LLM) para alguma de suas funções, configure-o aqui.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentModel">Modelo de IA (via Genkit)</Label>
                  <p className="text-xs text-muted-foreground">Escolha o modelo Gemini. Outros (ex: OpenRouter) requerem fluxo Genkit dedicado.</p>
                  <Select value={agentModel} onValueChange={setAgentModel}>
                    <SelectTrigger id="agentModel"><SelectValue placeholder="Selecione um modelo (opcional)" /></SelectTrigger>
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
                <div className="space-y-2">
                  <Label htmlFor="agentTemperature">Temperatura: {agentTemperature[0].toFixed(1)}</Label>
                  <Slider id="agentTemperature" min={0} max={1} step={0.1} value={agentTemperature} onValueChange={setAgentTemperature} />
                  <p className="text-xs text-muted-foreground">Controla a criatividade. Baixo = focado, Alto = criativo.</p>
                </div>
              </div>
            </div>

            {/* Seção de Configuração de Workflow */}
            {agentType === 'workflow' && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Workflow className="w-5 h-5 text-primary/80" /> Configuração do Fluxo de Trabalho</h3>
                   <Alert className="mb-4">
                    <Workflow className="h-4 w-4" />
                    <AlertTitle>{agentTypeOptions.find(opt => opt.id === 'workflow')?.label.split('(')[0].trim() || "Agente de Fluxo de Trabalho"}</AlertTitle>
                    <AlertDescription>Estes agentes especializados controlam o fluxo de execução de seus subagentes com base em lógica predefinida e determinística. Eles não consultam um LLM para a orquestração em si, tornando-os ideais para processos estruturados que exigem execução previsível.</AlertDescription>
                  </Alert>
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="workflowDescription">Descrição Geral do Fluxo de Trabalho</Label>
                    <Textarea id="workflowDescription" placeholder="Descreva o objetivo geral e o funcionamento esperado deste fluxo..." value={workflowDescription} onChange={(e) => setWorkflowDescription(e.target.value)} rows={3}/>
                  </div>
                  <div className="space-y-2 mb-6">
                    <Label htmlFor="detailedWorkflowType">Tipo de Fluxo Detalhado</Label>
                    <Select value={detailedWorkflowType} onValueChange={(value) => setDetailedWorkflowType(value as 'sequential' | 'parallel' | 'loop' | undefined)}>
                      <SelectTrigger id="detailedWorkflowType"><SelectValue placeholder="Selecione o tipo de fluxo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequential">Sequencial (Executar em ordem)</SelectItem>
                        <SelectItem value="parallel">Paralelo (Executar simultaneamente)</SelectItem>
                        <SelectItem value="loop">Loop (Repetir até condição)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {detailedWorkflowType === 'sequential' && (
                    <Card className="bg-muted/30">
                      <CardHeader><CardTitle className="text-base">Configurar Etapas Sequenciais</CardTitle><CardDescription className="text-xs">Defina a ordem dos subagentes. A saída de uma etapa pode ser usada pela próxima.</CardDescription></CardHeader>
                      <CardContent className="space-y-3">
                        <Button variant="outline" size="sm" className="w-full" onClick={() => toast({ title: "Em breve!", description: "Adicionar subagente sequencial."})}><PlusCircle size={16} className="mr-2" /> Adicionar Subagente/Etapa</Button>
                        <div className="p-3 border rounded-md bg-background/70 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><GripVertical size={16} className="text-muted-foreground cursor-grab" title="Reordenar (arrastar)"/><span className="text-sm">Ex: Agente de Análise de Sentimento (Tipo: LLM, ID: agent_sentiment)</span></div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: "Em breve!", description: "Configurar Etapa: Aqui você definiria as instruções específicas para este subagente, incluindo como ele pode usar chaves de saída de etapas anteriores (ex: {resultado_etapa_anterior}) e qual chave de saída (output_key) ele próprio fornecerá."})}><Settings size={14} /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => toast({ title: "Em breve!", description: "Remover etapa."})}><Trash2 size={14} /></Button>
                            </div>
                          </div>
                           <div className="pl-6 space-y-1"><Label htmlFor="outputKeySequential" className="text-xs text-muted-foreground">Chave de Saída (opcional):</Label><Input id="outputKeySequential" readOnly disabled className="h-7 text-xs bg-muted/50" placeholder="ex: sentimento_analisado" /><p className="text-xs text-muted-foreground/80">Use esta chave para referenciar a saída desta etapa (ex: salva no estado da sessão) em etapas futuras.</p></div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {detailedWorkflowType === 'parallel' && ( 
                    <Card className="bg-muted/30"> 
                        <CardHeader>
                            <CardTitle className="text-base">Configurar Tarefas Paralelas</CardTitle>
                            <CardDescription className="text-xs">Adicione os subagentes que devem ser executados simultaneamente.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Alert variant="default" className="mt-3 mb-4 bg-background/50 border-border/70">
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                <AlertTitle className="text-sm font-medium">Importante: Execução Independente</AlertTitle>
                                <AlertDescription className="text-xs">
                                    Os subagentes configurados aqui serão executados em paralelo e operam de forma independente. 
                                    Não há compartilhamento automático de histórico ou estado entre eles durante a execução. 
                                    Para combinar os resultados, cada subagente deve usar uma 'Chave de Saída' única para salvar seu resultado (ex: no estado da sessão).
                                    Geralmente, um Agente Sequencial é usado como a próxima etapa para ler essas 'Chaves de Saída' e processar/mesclar os resultados.
                                </AlertDescription>
                            </Alert>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => toast({ title: "Em breve!", description: "Adicionar subagente/tarefa paralela."})}>
                                <PlusCircle size={16} className="mr-2" /> Adicionar Subagente/Tarefa Paralela
                            </Button>
                            <div className="p-3 border rounded-md bg-background/70 space-y-2">
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
                                    <Input id="outputKeyParallel" readOnly disabled className="h-7 text-xs bg-muted/50" placeholder="ex: resultado_imagem_gerada" />
                                    <p className="text-xs text-muted-foreground/80">Use esta chave para que um agente sequencial posterior possa acessar o resultado desta tarefa paralela (ex: salvo no estado da sessão).</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card> 
                  )}
                  {detailedWorkflowType === 'loop' && ( 
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle className="text-base">Configurar Loop de Execução</CardTitle>
                            <CardDescription className="text-xs">Defina o(s) subagente(s) a serem repetidos e a condição de término.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="loopMaxIterations">Número Máximo de Iterações (Opcional)</Label>
                                <Input id="loopMaxIterations" type="number" min="1" placeholder="Ex: 5" value={loopMaxIterations || ""} onChange={(e) => setLoopMaxIterations(e.target.value ? parseInt(e.target.value) : undefined)} className="h-9" />
                                <p className="text-xs text-muted-foreground">Deixe em branco para loops baseados apenas em outras condições.</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5">Condição de Término Adicional (Opcional):</Label>
                                <RadioGroup value={loopTerminationConditionType || 'none'} onValueChange={(value) => setLoopTerminationConditionType(value as 'none' | 'subagent_signal' | undefined)}>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="none" id="loop-cond-none" /><Label htmlFor="loop-cond-none" className="font-normal">Nenhuma (apenas máximo de iterações)</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="subagent_signal" id="loop-cond-signal" /><Label htmlFor="loop-cond-signal" className="font-normal">Sinalização por Subagente</Label></div>
                                </RadioGroup>
                            </div>
                            {loopTerminationConditionType === 'subagent_signal' && (
                                <Alert variant="default" className="mt-3 bg-background/50 border-border/70">
                                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                    <AlertTitle className="text-sm font-medium">Sinalização por Subagente</AlertTitle>
                                    <AlertDescription className="text-xs">
                                        Um subagente dentro do loop pode sinalizar o término (ex: usando uma ferramenta específica como 'exit_loop' ou retornando um valor/estado particular). 
                                        Configure o subagente apropriado com essa lógica e, opcionalmente, indique abaixo qual ferramenta ou valor de estado é esperado para o término.
                                    </AlertDescription>
                                    <div className="mt-3 space-y-2 pl-1">
                                        <div><Label htmlFor="loopExitTool" className="text-xs text-muted-foreground">Ferramenta de Saída do Loop (Exemplo):</Label><Input id="loopExitTool" value={loopExitToolName || ""} onChange={(e) => setLoopExitToolName(e.target.value)} placeholder="exit_loop" className="h-7 text-xs mt-0.5 bg-muted/30" /></div>
                                        <div><Label htmlFor="loopExitStateKey" className="text-xs text-muted-foreground">Chave de Estado para Saída (Exemplo):</Label><Input id="loopExitStateKey" value={loopExitStateKey || ""} onChange={(e) => setLoopExitStateKey(e.target.value)} placeholder="status_documento" className="h-7 text-xs mt-0.5 bg-muted/30" /></div>
                                        <div><Label htmlFor="loopExitStateValue" className="text-xs text-muted-foreground">Valor de Estado para Sair (Exemplo):</Label><Input id="loopExitStateValue" value={loopExitStateValue || ""} onChange={(e) => setLoopExitStateValue(e.target.value)} placeholder="FINALIZADO" className="h-7 text-xs mt-0.5 bg-muted/30" /></div>
                                    </div>
                                </Alert>
                            )}
                            <Separator className="my-3"/>
                            <h4 className="text-sm font-medium pt-1">Subagente(s) na Sequência do Loop:</h4>
                            <Button variant="outline" size="sm" className="w-full" onClick={() => toast({ title: "Em breve!", description: "Adicionar subagente ao loop."})}>
                                <PlusCircle size={16} className="mr-2" /> Adicionar Subagente ao Loop
                            </Button>
                            <div className="p-3 border rounded-md bg-background/70 space-y-2">
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
                                    <Input id="outputKeyLoopStep" readOnly disabled className="h-7 text-xs bg-muted/50" placeholder="ex: dados_coletados_iteracao" />
                                    <p className="text-xs text-muted-foreground/80">Use esta chave para referenciar a saída desta etapa (ex: salva no estado da sessão) dentro da iteração ou após o loop.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card> 
                  )}
                </div>
              </>
            )}

            {/* Seção de Configuração de Agente Customizado */}
            {agentType === 'custom' && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><FileJson className="w-5 h-5 text-primary/80" /> Configuração do Agente Personalizado</h3>
                  <Alert className="mb-4">
                    <FileJson className="h-4 w-4" />
                    <AlertTitle>{agentTypeOptions.find(opt => opt.id === 'custom')?.label.split('(')[0].trim() || "Agente Personalizado"}</AlertTitle>
                    <AlertDescription>Implemente lógica operacional única e fluxos de controle específicos que vão além dos tipos de agente padrão, estendendo conceitualmente a BaseAgent. Agentes personalizados tipicamente orquestram outros agentes (como LlmAgent ou LoopAgent) e podem gerenciar o estado da sessão. Requer desenvolvimento de um fluxo Genkit customizado no backend (equivalente a implementar _run_async_impl).</AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="customLogicDescription">Descrição da Lógica Personalizada (Genkit Flow)</Label>
                    <Textarea id="customLogicDescription" placeholder="Descreva a funcionalidade principal e a lógica que seu fluxo Genkit customizado implementará..." value={customLogicDescription} onChange={(e) => setCustomLogicDescription(e.target.value)} rows={6}/>
                  </div>
                </div>
              </>
            )}
            
            <Separator />

            {/* Seção de Versão do Agente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="agentVersion">Versão do Agente</Label>
                    <Input id="agentVersion" placeholder="ex: 1.0.0" value={agentVersion} onChange={(e) => setAgentVersion(e.target.value)} />
                </div>
            </div>

            {/* Seção de Ferramentas do Agente */}
            <div className="space-y-4">
              <Label className="text-lg font-medium flex items-center gap-2"><Network className="w-5 h-5 text-primary/80" /> Ferramentas do Agente (Capacidades via Genkit)</Label>
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Capacite seu agente com funcionalidades para interagir com o mundo exterior. A execução real de cada ferramenta é gerenciada por um fluxo Genkit no backend.</p>
                  <div className="space-y-3 pt-2">
                    {availableTools.map((tool) => (
                        <div key={tool.id} className="flex items-start p-3 border rounded-md bg-background hover:bg-muted/50 transition-colors">
                            <Checkbox 
                                id={`tool-${tool.id}`} 
                                checked={currentAgentTools.includes(tool.id)} 
                                onCheckedChange={(checked) => handleToolSelectionChange(tool.id, !!checked)} 
                                className="mt-1" 
                            />
                            <div className="ml-3 flex-grow">
                                <Label htmlFor={`tool-${tool.id}`} className="font-medium flex items-center cursor-pointer group">
                                    {React.cloneElement(tool.icon as React.ReactElement, { size: 16, className: "mr-2"})}
                                    {tool.label}
                                    {tool.needsConfiguration && <ConfigureIcon size={14} className="ml-2 text-muted-foreground group-hover:text-primary transition-colors" title="Requer Configuração"/>}
                                </Label>
                                <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                            </div>
                            {tool.needsConfiguration && currentAgentTools.includes(tool.id) && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="ml-auto shrink-0" 
                                onClick={() => openToolConfigModal(tool)}
                            >
                                <ConfigureIcon size={14} className="mr-1.5" />
                                {toolConfigurations[tool.id] && Object.keys(toolConfigurations[tool.id]!).some(key => !!(toolConfigurations[tool.id] as any)[key]) ? "Reconfigurar" : "Configurar"}
                            </Button>
                            )}
                        </div>
                    ))}
                  </div>
                  {currentAgentTools.length > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <h4 className="text-sm font-medium mb-2">Ferramentas Selecionadas:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {currentAgentTools.map(toolId => {
                            const tool = availableTools.find(t => t.id === toolId);
                            if (!tool) return null;
                            const isConfigured = tool.needsConfiguration && toolConfigurations[tool.id] && Object.keys(toolConfigurations[tool.id]!).some(key => !!(toolConfigurations[tool.id] as any)[key]);
                            return ( 
                                <li key={toolId} className="flex items-center">
                                    {React.cloneElement(tool.icon as React.ReactElement, { size: 14, className: "mr-1.5 inline-block"})} 
                                    {tool.label} 
                                    {tool.needsConfiguration && (
                                        <ConfigureIcon 
                                            size={12} 
                                            className={`ml-1.5 ${isConfigured ? 'text-green-500' : 'text-blue-500'}`} 
                                            title={isConfigured ? "Configurada" : "Requer configuração"}
                                        /> 
                                    )}
                                </li> 
                            );
                        })}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleInternalSave}>
            <Save className="mr-2 h-4 w-4" /> {editingAgent ? "Salvar Alterações" : "Salvar Configuração"}
          </Button>
        </DialogFooter>

        {/* Modal de Configuração de Ferramenta (interno a este Dialog) */}
        {isToolConfigModalOpen && configuringTool && (
            <Dialog open={isToolConfigModalOpen} onOpenChange={(open) => {
                if (!open) setConfiguringTool(null);
                setIsToolConfigModalOpen(open);
            }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                <DialogTitle>Configurar: {configuringTool.label}</DialogTitle>
                <DialogDescription>Forneça os detalhes de configuração para a ferramenta {configuringTool.label}.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                {configuringTool.id === "webSearch" && ( 
                    <> 
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
                    </> 
                )}
                {configuringTool.id === "customApiIntegration" && ( 
                    <> 
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
                    </> 
                )}
                {configuringTool.id === "databaseAccess" && ( 
                    <> 
                        <div className="space-y-2">
                            <Label htmlFor="modalDbType">Tipo de Banco de Dados</Label>
                            <Select value={modalDbType} onValueChange={setModalDbType}>
                                <SelectTrigger id="modalDbType"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
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
                                <div className="space-y-2"><Label htmlFor="modalDbHost">Host</Label><Input id="modalDbHost" value={modalDbHost} onChange={(e) => setModalDbHost(e.target.value)} placeholder="ex: localhost" /></div>
                                <div className="space-y-2"><Label htmlFor="modalDbPort">Porta</Label><Input id="modalDbPort" type="number" value={modalDbPort} onChange={(e) => setModalDbPort(e.target.value)} placeholder="ex: 5432" /></div>
                            </div>
                            <div className="space-y-2"><Label htmlFor="modalDbName">Nome do Banco</Label><Input id="modalDbName" value={modalDbName} onChange={(e) => setModalDbName(e.target.value)} placeholder="ex: meu_banco" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="modalDbUser">Usuário</Label><Input id="modalDbUser" value={modalDbUser} onChange={(e) => setModalDbUser(e.target.value)} /></div>
                                <div className="space-y-2"><Label htmlFor="modalDbPassword">Senha</Label><Input id="modalDbPassword" type="password" value={modalDbPassword} onChange={(e) => setModalDbPassword(e.target.value)} /></div>
                            </div> 
                        </>)} 
                        {(modalDbType === 'other' || modalDbType === 'sqlite') && (
                            <div className="space-y-2">
                                <Label htmlFor="modalDbConnectionString">String de Conexão (ou Caminho)</Label>
                                <Input id="modalDbConnectionString" value={modalDbConnectionString} onChange={(e) => setModalDbConnectionString(e.target.value)} placeholder={modalDbType === 'sqlite' ? "ex: /path/to/db.sqlite" : "driver://user:pass@host/db"} />
                                <p className="text-xs text-muted-foreground">{modalDbType === 'sqlite' ? 'Caminho para o arquivo SQLite.' : 'String de conexão completa.'}</p>
                            </div>
                        )} 
                        <div className="space-y-2">
                            <Label htmlFor="modalDbDescription">Descrição do Banco/Tabelas (Opcional)</Label>
                            <Textarea id="modalDbDescription" value={modalDbDescription} onChange={(e) => setModalDbDescription(e.target.value)} placeholder="Ex: Tabela 'usuarios' com colunas id, nome, email." rows={3}/>
                            <p className="text-xs text-muted-foreground">Ajuda o agente a entender o contexto dos dados.</p>
                        </div> 
                    </> 
                )}
                {configuringTool.id === "knowledgeBase" && ( 
                    <div className="space-y-2">
                        <Label htmlFor="modalKnowledgeBaseId">ID/Nome da Base de Conhecimento</Label>
                        <Input id="modalKnowledgeBaseId" value={modalKnowledgeBaseId} onChange={(e) => setModalKnowledgeBaseId(e.target.value)} placeholder="ex: documentos_produto_xyz"/>
                        <p className="text-xs text-muted-foreground">Identificador para a base de conhecimento (RAG).</p>
                    </div> 
                )}
                {configuringTool.id === "calendarAccess" && ( 
                    <div className="space-y-2">
                        <Label htmlFor="modalCalendarApiEndpoint">Endpoint da API ou ID do Fluxo Genkit</Label>
                        <Input id="modalCalendarApiEndpoint" value={modalCalendarApiEndpoint} onChange={(e) => setModalCalendarApiEndpoint(e.target.value)} placeholder="ex: https://api.example.com/calendar"/>
                        <p className="text-xs text-muted-foreground">URL ou identificador do fluxo Genkit para agenda.</p>
                    </div> 
                )}
                </div>
                <DialogFooter>
                <DialogClose asChild><Button variant="outline" onClick={() => { setIsToolConfigModalOpen(false); setConfiguringTool(null);}}>Cancelar</Button></DialogClose>
                <Button onClick={handleSaveToolConfiguration}>Salvar Configuração</Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}


      