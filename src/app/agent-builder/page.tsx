
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Cpu, PlusCircle, Save, Info, Workflow, Settings, Brain, Target, ListChecks, Smile, Ban, Search, Calculator, FileText, CalendarDays, Network, Layers, Trash2, Edit, MessageSquare, Share2, FileJson, Database, Code2, BookText, Languages, Settings2 as ConfigureIcon, ClipboardCopy } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useAgents } from '@/contexts/AgentsContext';
import { Badge } from "@/components/ui/badge";

export interface AvailableTool {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  needsConfiguration?: boolean;
}

export const availableTools: AvailableTool[] = [
  { id: "webSearch", label: "Busca na Web (Google)", icon: <Search size={16} className="mr-2"/>, description: "Permite ao agente pesquisar informações na internet via Genkit (requer Chave API Google e CSE ID).", needsConfiguration: true },
  { id: "calculator", label: "Calculadora", icon: <Calculator size={16} className="mr-2"/>, description: "Permite ao agente realizar cálculos matemáticos (via função Genkit)." },
  { id: "knowledgeBase", label: "Consulta à Base de Conhecimento (RAG)", icon: <FileText size={16} className="mr-2"/>, description: "Permite ao agente buscar informações em bases de conhecimento ou documentos (ex: RAG via Genkit, pode requerer configuração).", needsConfiguration: true },
  { id: "calendarAccess", label: "Acesso à Agenda/Calendário", icon: <CalendarDays size={16} className="mr-2"/>, description: "Permite ao agente verificar ou criar eventos na agenda (requer fluxo Genkit e autenticação).", needsConfiguration: true },
  { id: "customApiIntegration", label: "Integração com API Externa (OpenAPI)", icon: <Network size={16} className="mr-2"/>, description: "Permite ao agente interagir com serviços web externos (ex: via OpenAPI, requer fluxo Genkit e possivelmente chaves API).", needsConfiguration: true },
  { id: "databaseAccess", label: "Acesso a Banco de Dados (SQL)", icon: <Database size={16} className="mr-2"/>, description: "Permite ao agente consultar e interagir com bancos de dados SQL (requer fluxo Genkit e configuração de conexão).", needsConfiguration: true },
  { id: "codeExecutor", label: "Execução de Código (Python Sandbox)", icon: <Code2 size={16} className="mr-2"/>, description: "Permite ao agente executar trechos de código Python em um ambiente seguro (requer fluxo Genkit)." },
];

export const agentToneOptions = [
    { id: "friendly", label: "Amigável e Prestativo" },
    { id: "professional", label: "Profissional e Direto" },
    { id: "formal", label: "Formal e Educado" },
    { id: "casual", label: "Casual e Descontraído" },
    { id: "funny", label: "Engraçado e Divertido" },
    { id: "analytical", label: "Analítico e Detalhista" },
    { id: "concise", label: "Conciso e Objetivo" },
    { id: "empathetic", label: "Empático e Compreensivo" },
    { id: "creative", label: "Criativo e Inspirador" },
];

export const agentTypeOptions = [
  { id: "llm", label: "Agente LLM (Foco em Linguagem e Decisão)", icon: <Brain size={16} /> },
  { id: "workflow", label: "Agente de Fluxo de Trabalho (Workflow)", icon: <Workflow size={16} /> },
  { id: "custom", label: "Agente Personalizado (Lógica Customizada via Genkit)", icon: <FileJson size={16} /> },
];

export interface AgentConfigBase {
  agentName: string;
  agentDescription: string;
  agentVersion: string;
  agentTools: string[];
}

export interface LLMAgentConfig extends AgentConfigBase {
  agentType: "llm";
  agentGoal: string;
  agentTasks: string;
  agentPersonality: string;
  agentRestrictions: string;
  agentModel: string;
  agentTemperature: number;
}

export interface WorkflowAgentConfig extends AgentConfigBase {
  agentType: "workflow";
  workflowDescription: string;
  // Campos opcionais de LLM, podem ser herdados ou não, dependendo da lógica do workflow
  agentGoal?: string;
  agentTasks?: string;
  agentPersonality?: string;
  agentRestrictions?: string;
  agentModel?: string; // Pode ser usado por etapas do workflow
  agentTemperature?: number; // Pode ser usado por etapas do workflow
}

export interface CustomAgentConfig extends AgentConfigBase {
  agentType: "custom";
  customLogicDescription: string;
  // Campos opcionais de LLM
  agentGoal?: string;
  agentTasks?: string;
  agentPersonality?: string;
  agentRestrictions?: string;
  agentModel?: string;
  agentTemperature?: number;
}

export type AgentConfig = LLMAgentConfig | WorkflowAgentConfig | CustomAgentConfig;

export interface AgentTemplate {
  id: string;
  name: string;
  config: AgentConfig;
}

export interface ToolConfigData {
  googleApiKey?: string;
  googleCseId?: string;
  openapiSpecUrl?: string;
  openapiApiKey?: string;
}

export interface SavedAgentConfiguration extends AgentConfig {
  id: string;
  templateId: string;
  systemPromptGenerated?: string; // Apenas para LLMAgentConfig
  toolsDetails: Array<{ id: string; label: string; needsConfiguration?: boolean }>;
  toolConfigsApplied?: Record<string, ToolConfigData>;
}

const defaultLLMConfig: Omit<LLMAgentConfig, keyof AgentConfigBase | 'agentType'> = {
  agentGoal: "",
  agentTasks: "",
  agentPersonality: agentToneOptions[0].label,
  agentRestrictions: "",
  agentModel: "googleai/gemini-2.0-flash",
  agentTemperature: 0.7,
};

const agentTemplates: AgentTemplate[] = [
  {
    id: "custom_llm",
    name: "LLM Personalizado (Começar do Zero)",
    config: {
      agentType: "llm",
      agentName: "",
      agentDescription: "Agente LLM configurado manualmente a partir do zero.",
      agentVersion: "1.0.0",
      agentTools: [],
      ...defaultLLMConfig,
    },
  },
  {
    id: "support",
    name: "Modelo: Agente de Suporte ao Cliente (LLM)",
    config: {
      agentType: "llm",
      agentName: "Agente de Suporte ao Cliente",
      agentDescription: "Um agente prestativo para responder a perguntas comuns de clientes e ajudar com problemas.",
      agentGoal: "Fornecer suporte rápido e eficiente aos clientes, esclarecendo dúvidas e direcionando para soluções.",
      agentTasks: "1. Responder perguntas frequentes sobre produtos/serviços (especificações, preços, disponibilidade).\n2. Ajudar a solucionar problemas básicos de utilização.\n3. Direcionar para documentação relevante ou FAQs.\n4. Escalar problemas complexos para um atendente humano quando necessário e a ferramenta de escalonamento estiver disponível.",
      agentPersonality: "Empático e Compreensivo",
      agentRestrictions: "Nunca fornecer informações financeiras pessoais de clientes. Não prometer prazos de resolução exatos sem confirmação. Manter um tom profissional e paciente.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.5,
      agentVersion: "1.0.0",
      agentTools: ["knowledgeBase", "webSearch"],
    },
  },
  {
    id: "recommendation",
    name: "Modelo: Agente de Recomendações (LLM)",
    config: {
      agentType: "llm",
      agentName: "Agente de Recomendações de Produtos",
      agentDescription: "Um agente para ajudar usuários a descobrir e escolher produtos ou serviços com base em suas preferências.",
      agentGoal: "Aumentar o engajamento e as vendas sugerindo itens relevantes com base nas necessidades e preferências do usuário.",
      agentTasks: "1. Perguntar sobre as preferências, necessidades e orçamento do usuário.\n2. Sugerir produtos/serviços do catálogo com base nas respostas.\n3. Comparar até 3 produtos lado a lado, destacando prós e contras.\n4. Fornecer links diretos ou informações para as páginas dos produtos/serviços recomendados.",
      agentPersonality: "Amigável e Prestativo",
      agentRestrictions: "Apenas recomendar produtos/serviços do catálogo atual. Não inventar características ou preços. Ser transparente sobre limitações se não encontrar uma combinação perfeita.",
      agentModel: "googleai/gemini-1.5-pro-latest",
      agentTemperature: 0.7,
      agentVersion: "1.0.0",
      agentTools: ["knowledgeBase"],
    },
  },
  {
    id: "writer",
    name: "Modelo: Assistente de Escrita Criativa (LLM)",
    config: {
      agentType: "llm",
      agentName: "Assistente de Escrita Criativa",
      agentDescription: "Um agente para ajudar a gerar ideias, esboços e rascunhos de conteúdo original e envolvente.",
      agentGoal: "Auxiliar na criação de conteúdo escrito, como posts de blog, e-mails, descrições de produtos ou roteiros curtos.",
      agentTasks: "1. Brainstorming de tópicos com base em palavras-chave ou temas fornecidos.\n2. Gerar parágrafos introdutórios, de desenvolvimento ou conclusivos.\n3. Sugerir diferentes títulos e subtítulos para um texto.\n4. Resumir textos longos em pontos principais ou em um formato específico (ex: bullet points).",
      agentPersonality: "Criativo e Inspirador",
      agentRestrictions: "Evitar plágio. Se usar informações externas (com a ferramenta de busca), sugerir a necessidade de citação. Focar na originalidade e na clareza da escrita.",
      agentModel: "googleai/gemini-1.5-pro-latest",
      agentTemperature: 0.8,
      agentVersion: "1.0.0",
      agentTools: ["webSearch"],
    },
  },
  {
    id: "grammar_checker",
    name: "Modelo: Revisor de Gramática e Estilo (LLM)",
    config: {
      agentType: "llm",
      agentName: "Revisor de Gramática e Estilo",
      agentDescription: "Um agente para revisar textos, corrigir erros gramaticais, melhorar o estilo e a clareza.",
      agentGoal: "Ajudar o usuário a aprimorar seus textos, tornando-os gramaticalmente corretos, claros, concisos e estilisticamente adequados.",
      agentTasks: "1. Identificar e corrigir erros de gramática e ortografia.\n2. Sugerir melhorias na estrutura das frases e na escolha de palavras.\n3. Verificar a pontuação.\n4. Oferecer feedback sobre o tom e estilo do texto, se solicitado.",
      agentPersonality: "Analítico e Detalhista",
      agentRestrictions: "Focar apenas na revisão do texto fornecido. Não adicionar novo conteúdo ou alterar o significado original. Explicar as correções se forem complexas.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.3,
      agentVersion: "1.0.0",
      agentTools: [],
    },
  },
  {
    id: "translator_pt_en",
    name: "Modelo: Tradutor Simples (Português-Inglês) (LLM)",
    config: {
      agentType: "llm",
      agentName: "Tradutor Português-Inglês",
      agentDescription: "Um agente para traduzir textos do português para o inglês e vice-versa.",
      agentGoal: "Fornecer traduções precisas e naturais entre português e inglês.",
      agentTasks: "1. Receber texto em português e traduzir para o inglês.\n2. Receber texto em inglês e traduzir para o português.\n3. Manter o contexto e o significado o mais fiel possível.",
      agentPersonality: "Conciso e Objetivo",
      agentRestrictions: "Limitar-se à tradução. Não interpretar ou adicionar informações. Indicar se uma expressão é idiomática e de difícil tradução literal.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.4,
      agentVersion: "1.0.0",
      agentTools: [],
    },
  },
];


export default function AgentBuilderPage() {
  const { toast } = useToast();
  const { savedAgents, setSavedAgents } = useAgents();

  const [selectedAgentTemplateId, setSelectedAgentTemplateId] = React.useState<string>(agentTemplates[0].id);
  const [agentType, setAgentType] = React.useState<AgentConfig["agentType"]>(agentTemplates[0].config.agentType);

  const [agentName, setAgentName] = React.useState(agentTemplates[0].config.agentName);
  const [agentDescription, setAgentDescription] = React.useState(agentTemplates[0].config.agentDescription);
  const [agentVersion, setAgentVersion] = React.useState(agentTemplates[0].config.agentVersion);
  const [currentAgentTools, setCurrentAgentTools] = React.useState<string[]>(agentTemplates[0].config.agentTools);

  // LLM Specific State
  const [agentGoal, setAgentGoal] = React.useState( (agentTemplates[0].config as LLMAgentConfig).agentGoal || "" );
  const [agentTasks, setAgentTasks] = React.useState( (agentTemplates[0].config as LLMAgentConfig).agentTasks || "" );
  const [agentPersonality, setAgentPersonality] = React.useState( (agentTemplates[0].config as LLMAgentConfig).agentPersonality || agentToneOptions[0].label );
  const [agentRestrictions, setAgentRestrictions] = React.useState( (agentTemplates[0].config as LLMAgentConfig).agentRestrictions || "" );
  const [agentModel, setAgentModel] = React.useState( (agentTemplates[0].config as LLMAgentConfig).agentModel || "googleai/gemini-2.0-flash" );
  const [agentTemperature, setAgentTemperature] = React.useState( [(agentTemplates[0].config as LLMAgentConfig).agentTemperature || 0.7] );

  // Workflow Specific State
  const [workflowDescription, setWorkflowDescription] = React.useState("");

  // Custom Specific State
  const [customLogicDescription, setCustomLogicDescription] = React.useState("");

  // State for tool configurations
  const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, ToolConfigData>>({});
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false);
  const [configuringTool, setConfiguringTool] = React.useState<AvailableTool | null>(null);
  
  // Temporary state for modal inputs
  const [modalGoogleApiKey, setModalGoogleApiKey] = React.useState("");
  const [modalGoogleCseId, setModalGoogleCseId] = React.useState("");
  const [modalOpenapiSpecUrl, setModalOpenapiSpecUrl] = React.useState("");
  const [modalOpenapiApiKey, setModalOpenapiApiKey] = React.useState("");

  // State for Agent Builder Modal
  const [isBuilderModalOpen, setIsBuilderModalOpen] = React.useState(false);


  const resetLLMFields = (config: Partial<LLMAgentConfig>) => {
    setAgentGoal(config.agentGoal || defaultLLMConfig.agentGoal);
    setAgentTasks(config.agentTasks || defaultLLMConfig.agentTasks);
    setAgentPersonality(config.agentPersonality || defaultLLMConfig.agentPersonality);
    setAgentRestrictions(config.agentRestrictions || defaultLLMConfig.agentRestrictions);
    setAgentModel(config.agentModel || defaultLLMConfig.agentModel);
    setAgentTemperature([config.agentTemperature === undefined ? defaultLLMConfig.agentTemperature : config.agentTemperature]);
  };

  const resetWorkflowFields = () => {
    setWorkflowDescription("");
  }
  const resetCustomLogicFields = () => {
    setCustomLogicDescription("");
  }

  const handleTemplateChange = (templateId: string) => {
    const template = agentTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedAgentTemplateId(templateId);
      setAgentType(template.config.agentType);
      setAgentName(template.config.agentName);
      setAgentDescription(template.config.agentDescription);
      setAgentVersion(template.config.agentVersion);
      setCurrentAgentTools(template.config.agentTools); 

      if (template.config.agentType === 'llm') {
        const llmConfig = template.config as LLMAgentConfig;
        resetLLMFields(llmConfig);
        resetWorkflowFields();
        resetCustomLogicFields();
      } else if (template.config.agentType === 'workflow') {
        const workflowConfig = template.config as WorkflowAgentConfig;
        resetLLMFields(workflowConfig as Partial<LLMAgentConfig>); 
        setWorkflowDescription(workflowConfig.workflowDescription || "");
        resetCustomLogicFields();
      } else if (template.config.agentType === 'custom') {
        const customConfig = template.config as CustomAgentConfig;
        resetLLMFields(customConfig as Partial<LLMAgentConfig>); 
        resetWorkflowFields();
        setCustomLogicDescription(customConfig.customLogicDescription || "");
      }
    }
  };

  const handleAgentTypeChange = (newAgentType: AgentConfig["agentType"]) => {
    setAgentType(newAgentType);
    // Se mudar para LLM e o template atual não for LLM, reseta para o LLM padrão.
    if (newAgentType === 'llm') {
        resetWorkflowFields();
        resetCustomLogicFields();
        const currentTemplate = agentTemplates.find(t => t.id === selectedAgentTemplateId);
        if (!currentTemplate || currentTemplate.config.agentType !== 'llm') {
           // Se o template selecionado não é LLM, ou se estamos começando do zero, usamos o defaultLLMConfig.
           // Se o template for um Workflow ou Custom que *tem* campos LLM, eles já foram setados pelo handleTemplateChange.
           // Aqui, a intenção é mais garantir que se o usuário muda *diretamente* para LLM, ele tenha um bom ponto de partida.
           resetLLMFields(defaultLLMConfig);
        }
    } else if (newAgentType === 'workflow') {
        resetCustomLogicFields();
        // Se quiser que os campos LLM sejam limpos ao mudar para workflow, adicione aqui.
        // resetLLMFields({}); // Isso limparia. Por ora, eles podem persistir se vierem de um template.
    } else if (newAgentType === 'custom') {
        resetWorkflowFields();
        // Similar a workflow, os campos LLM podem persistir ou serem limpos.
        // resetLLMFields({});
    }
  };

  const constructSystemPrompt = () => {
    if (agentType !== 'llm') return "";

    let prompt = `Objetivo Principal: ${agentGoal || "Não definido."}\n\n`;
    prompt += `Tarefas Principais:\n${agentTasks || "Nenhuma tarefa específica definida."}\n\n`;
    prompt += `Personalidade/Tom: ${agentPersonality || "Neutro."}\n\n`;
    if (agentRestrictions) {
      prompt += `Restrições Importantes:\n${agentRestrictions}\n\n`;
    }

    const selectedToolObjects = currentAgentTools 
      .map(toolId => availableTools.find(t => t.id === toolId))
      .filter(Boolean) as AvailableTool[];

    if (selectedToolObjects.length > 0) {
        prompt += `Ferramentas Disponíveis para uso (o agente deve decidir quando usá-las com base na conversa e nos objetivos):\n`;
        selectedToolObjects.forEach(tool => {
            const isConfigured = tool.needsConfiguration && toolConfigurations[tool.id] && 
                                 ( (tool.id === 'webSearch' && toolConfigurations[tool.id]?.googleApiKey && toolConfigurations[tool.id]?.googleCseId) ||
                                   (tool.id === 'customApiIntegration' && toolConfigurations[tool.id]?.openapiSpecUrl) ||
                                   // Adicionar aqui outras checagens específicas para ferramentas configuráveis, se houver.
                                   (tool.needsConfiguration && !['webSearch', 'customApiIntegration'].includes(tool.id) && toolConfigurations[tool.id] ) // Assume que outras ferramentas só precisam de `toolConfigurations[tool.id]` para serem consideradas configuradas.
                                 );
            prompt += `- ${tool.label}${tool.needsConfiguration ? (isConfigured ? " (configurada e pronta para uso)" : " (requer configuração, instrua o usuário a configurá-la se necessário)") : ""}\n`;
        });
        prompt += "\n";
    } else {
        prompt += `Nenhuma ferramenta externa está configurada para este agente.\n\n`;
    }

    prompt += "Instruções Gerais de Interação:\n";
    prompt += "- Responda de forma concisa e direta ao ponto, a menos que o tom da personalidade solicite o contrário.\n";
    prompt += "- Se precisar usar uma ferramenta, indique claramente qual ferramenta seria usada e porquê ANTES de simular a sua execução ou pedir para o usuário aguardar.\n";
    prompt += "- Seja transparente sobre suas capacidades e limitações. Se não puder realizar uma tarefa, explique o motivo.\n";

    return prompt.trim() || "Você é um assistente prestativo."; // Fallback
  };

  const handleCreateNewAgent = () => { // Esta função agora será chamada ao ABRIR o modal para um novo agente
    const customTemplate = agentTemplates.find(t => t.id === "custom_llm") || agentTemplates[0];
    handleTemplateChange(customTemplate.id); // Isso já reseta os campos para o template "Começar do Zero"
    setToolConfigurations({}); 

    // Não precisa mais do toast aqui, pois o modal vai abrir.
  };

  const openCreateAgentModal = () => {
    handleCreateNewAgent(); // Garante que o formulário no modal está limpo/resetado
    setIsBuilderModalOpen(true);
  };

  const handleSaveConfiguration = () => {
    if (!agentName) {
      toast({ title: "Campo Obrigatório", description: "Nome do Agente é obrigatório.", variant: "destructive" });
      return;
    }
    if (agentType === 'llm' && !agentModel) {
       toast({ title: "Campo Obrigatório para Agente LLM", description: "Modelo de IA é obrigatório para Agentes LLM.", variant: "destructive" });
      return;
    }

    const systemPrompt = agentType === 'llm' ? constructSystemPrompt() : undefined;
    const selectedToolsDetails = currentAgentTools 
        .map(toolId => {
            const tool = availableTools.find(t => t.id === toolId);
            return tool ? { id: tool.id, label: tool.label, needsConfiguration: tool.needsConfiguration } : null;
        })
        .filter(Boolean) as SavedAgentConfiguration['toolsDetails'];

    const appliedToolConfigs: Record<string, ToolConfigData> = {};
    currentAgentTools.forEach(toolId => { 
      if (toolConfigurations[toolId]) {
        appliedToolConfigs[toolId] = toolConfigurations[toolId];
      }
    });

    let newAgentConfiguration: SavedAgentConfiguration;

    const baseSavedConfig = {
        id: `agent-${Date.now()}`,
        templateId: selectedAgentTemplateId,
        agentName,
        agentDescription,
        agentVersion,
        agentTools: currentAgentTools, 
        toolsDetails: selectedToolsDetails,
        toolConfigsApplied: appliedToolConfigs,
    };

    if (agentType === 'llm') {
      newAgentConfiguration = {
        ...baseSavedConfig,
        agentType: 'llm',
        agentGoal,
        agentTasks,
        agentPersonality,
        agentRestrictions,
        agentModel,
        agentTemperature: agentTemperature[0],
        systemPromptGenerated: systemPrompt,
      };
    } else if (agentType === 'workflow') {
      newAgentConfiguration = {
        ...baseSavedConfig,
        agentType: 'workflow',
        workflowDescription,
        // Limpa campos específicos de LLM se o tipo for workflow
        agentGoal: undefined, 
        agentTasks: undefined,
        agentPersonality: undefined,
        agentRestrictions: undefined,
        agentModel: undefined,
        agentTemperature: undefined,
        systemPromptGenerated: undefined,
      };
    } else { // Custom Agent
      newAgentConfiguration = {
        ...baseSavedConfig,
        agentType: 'custom',
        customLogicDescription,
        // Limpa campos específicos de LLM se o tipo for custom
        agentGoal: undefined,
        agentTasks: undefined,
        agentPersonality: undefined,
        agentRestrictions: undefined,
        agentModel: undefined,
        agentTemperature: undefined,
        systemPromptGenerated: undefined,
      };
    }

    setSavedAgents(prevAgents => [...prevAgents, newAgentConfiguration]);
    setIsBuilderModalOpen(false); // Fecha o modal após salvar

    toast({
      title: "Configuração Salva!",
      description: `O agente "${agentName}" (${agentTypeOptions.find(opt => opt.id === agentType)?.label}) foi adicionado à sua lista.`,
    });
  };

  const handleToolSelectionChange = (toolId: string, checked: boolean) => {
    setCurrentAgentTools(prevTools => { 
      if (checked) {
        return [...prevTools, toolId];
      } else {
        const newToolConfigs = { ...toolConfigurations };
        delete newToolConfigs[toolId]; // Remove a configuração da ferramenta se ela for desmarcada
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
  }

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
      newConfigData.googleApiKey = modalGoogleApiKey;
      newConfigData.googleCseId = modalGoogleCseId;
    } else if (configuringTool.id === "customApiIntegration") {
      if (!modalOpenapiSpecUrl) {
        toast({ title: "Campo Obrigatório", description: "URL do Esquema OpenAPI é obrigatória.", variant: "destructive" });
        return;
      }
      newConfigData.openapiSpecUrl = modalOpenapiSpecUrl;
      newConfigData.openapiApiKey = modalOpenapiApiKey; // Permite salvar mesmo que vazio
    }
    
    setToolConfigurations(prev => ({
      ...prev,
      [configuringTool.id]: newConfigData as ToolConfigData,
    }));
    setIsToolConfigModalOpen(false);
    setConfiguringTool(null);
    toast({ title: `Configuração salva para ${configuringTool.label}`});
  };


  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Meus Agentes</h1>
        </div>
        <Button onClick={openCreateAgentModal}>
          <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo Agente
        </Button>
      </header>

      <p className="text-muted-foreground">
        Gerencie seus agentes de IA existentes ou crie novos para automatizar tarefas e otimizar seus fluxos de trabalho.
      </p>

      {/* Display Saved Agents */}
      {savedAgents.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedAgents.map((agent) => {
              const agentTypeDetails = agentTypeOptions.find(opt => opt.id === agent.agentType);
              const agentTypeLabel = agentTypeDetails?.label.split('(')[0].trim() || agent.agentType;
              
              const AgentIconComponent = agentTypeDetails?.icon ? 
                React.cloneElement(agentTypeDetails.icon as React.ReactElement, { size: 20, className: "text-primary mr-4 self-start mt-1 w-10 h-10" }) : 
                <Cpu size={20} className="text-primary mr-4 self-start mt-1 w-10 h-10" />;
              
              return (
                <Card key={agent.id} className="flex flex-col bg-card shadow-md hover:shadow-lg transition-shadow duration-300 hover:scale-[1.02]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start">
                        {AgentIconComponent}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <CardTitle className="text-lg font-semibold text-foreground">
                            {agent.agentName || "Agente Sem Nome"}
                          </CardTitle>
                          <Badge variant="secondary" className="text-xs h-6">
                              {agentTypeLabel}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-2 h-[2.5em]">
                          {agent.agentDescription || "Sem descrição."}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-grow pt-0">
                    {agent.agentType === 'llm' && (agent as LLMAgentConfig).agentGoal && (
                        <div>
                            <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">Objetivo:</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 h-[2.25em]">
                                {(agent as LLMAgentConfig).agentGoal}
                            </p>
                        </div>
                    )}
                      {agent.agentType === 'llm' && (agent as LLMAgentConfig).agentModel && (
                        <div>
                            <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">Modelo de IA:</h4>
                            <p className="text-xs text-muted-foreground">{(agent as LLMAgentConfig).agentModel}</p>
                        </div>
                    )}
                    {agent.agentType === 'workflow' && (agent as WorkflowAgentConfig).workflowDescription && (
                        <div>
                            <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">Descrição do Fluxo:</h4>
                            <p className="text-xs text-muted-foreground line-clamp-3 h-[3.375em]">
                                {(agent as WorkflowAgentConfig).workflowDescription}
                            </p>
                        </div>
                    )}
                    {agent.agentType === 'custom' && (agent as CustomAgentConfig).customLogicDescription && (
                        <div>
                            <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">Lógica Personalizada:</h4>
                            <p className="text-xs text-muted-foreground line-clamp-3 h-[3.375em]">
                                {(agent as CustomAgentConfig).customLogicDescription}
                            </p>
                        </div>
                    )}
                      {agent.toolsDetails.length > 0 && (
                        <div className="pt-2">
                            <h4 className="text-sm font-semibold mb-1 text-foreground/80">Ferramentas:</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {agent.toolsDetails.map(toolDetail => {
                                    const fullTool = availableTools.find(t => t.id === toolDetail.id);
                                    const toolIcon = fullTool ? React.cloneElement(fullTool.icon as React.ReactElement, { size: 12 }) : null;
                                    const isConfigured = fullTool?.needsConfiguration && agent.toolConfigsApplied?.[toolDetail.id] &&
                                                        ( (fullTool.id === 'webSearch' && agent.toolConfigsApplied[fullTool.id]?.googleApiKey && agent.toolConfigsApplied[fullTool.id]?.googleCseId) ||
                                                          (fullTool.id === 'customApiIntegration' && agent.toolConfigsApplied[fullTool.id]?.openapiSpecUrl) ||
                                                           (fullTool.needsConfiguration && !['webSearch', 'customApiIntegration'].includes(fullTool.id) && agent.toolConfigsApplied[fullTool.id])
                                                        );
                                    return (
                                        <Badge
                                            key={toolDetail.id}
                                            variant={isConfigured && fullTool?.needsConfiguration ? "default" : "secondary"}
                                            className="text-xs h-6 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-default mr-1 mb-1"
                                            title={toolDetail.label + (fullTool?.needsConfiguration ? (isConfigured ? " (Configurada)" : " (Requer Configuração)") : "")}
                                        >
                                            {toolIcon}
                                            <span className="truncate max-w-[100px]">{toolDetail.label}</span>
                                            {fullTool?.needsConfiguration && (
                                                <ConfigureIcon 
                                                    size={10} 
                                                    className={`ml-1 ${isConfigured ? 'text-green-400' : 'text-blue-400'}`}
                                                    title={isConfigured ? "Configurada" : "Requer configuração"}
                                                />
                                            )}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                  </CardContent>
                  <CardFooter className="gap-2 mt-auto pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "Em breve!", description: "Funcionalidade de edição de agente."})}>
                      <Edit size={16} className="mr-1.5" /> Editar
                    </Button>
                      <Button variant="outline" size="sm" onClick={() => toast({ title: "Em breve!", description: "Funcionalidade de teste no chat."})}>
                      <MessageSquare size={16} className="mr-1.5" /> Testar
                    </Button>
                    <Button variant="destructive" size="sm" className="ml-auto" onClick={() => toast({ title: "Em breve!", description: "Funcionalidade de exclusão de agente."})}>
                      <Trash2 size={16} className="mr-1.5" /> Excluir
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">Nenhum agente criado ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comece clicando no botão abaixo para configurar seu primeiro agente de IA.
          </p>
          <Button onClick={openCreateAgentModal} className="mt-6">
            <PlusCircle className="mr-2 h-4 w-4" /> Criar seu primeiro agente
          </Button>
        </div>
      )}

      {/* Agent Builder Modal */}
      <Dialog open={isBuilderModalOpen} onOpenChange={setIsBuilderModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-2xl">Configurar Agente</DialogTitle>
            <DialogDescription>
              Defina as propriedades e configurações para seu novo agente. Comece com um modelo ou configure do zero.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {/* Form content starts here, no extra Card needed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentTemplate" className="flex items-center gap-1.5"><Layers size={16}/>Modelo de Agente Inicial (Template)</Label>
                <Select value={selectedAgentTemplateId} onValueChange={handleTemplateChange}>
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
                <p className="text-xs text-muted-foreground">Modelos pré-configuram o tipo de agente e seus campos, incluindo instruções detalhadas.</p>
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
                <p className="text-xs text-muted-foreground">Define a arquitetura e o comportamento fundamental do agente.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agentName">Nome do Agente</Label>
              <Input
                id="agentName"
                placeholder="ex: Agente de Suporte Avançado"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentDescription">Descrição Geral do Agente</Label>
              <Textarea
                id="agentDescription"
                placeholder="Descreva a função principal e o objetivo geral deste agente, independente do tipo..."
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
              />
            </div>

            <Separator />

            {agentType === 'llm' && (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-primary/80" /> Comportamento e Instruções (Agente LLM)</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Forneça instruções claras para guiar o comportamento do seu agente LLM. As respostas abaixo ajudarão a construir o "Prompt do Sistema" ideal.
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="agentGoal" className="flex items-center gap-1.5"><Target size={16}/>Qual é o objetivo principal deste agente LLM?</Label>
                      <Input
                        id="agentGoal"
                        placeholder="ex: Ajudar usuários a encontrarem informações sobre nossos produtos."
                        value={agentGoal}
                        onChange={(e) => setAgentGoal(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agentTasks" className="flex items-center gap-1.5"><ListChecks size={16}/>Quais são as principais tarefas que este agente LLM deve realizar?</Label>
                      <Textarea
                        id="agentTasks"
                        placeholder="ex: 1. Responder perguntas sobre especificações. 2. Comparar produtos."
                        value={agentTasks}
                        onChange={(e) => setAgentTasks(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agentPersonality" className="flex items-center gap-1.5"><Smile size={16}/>Qual deve ser a personalidade/tom do agente LLM?</Label>
                      <Select value={agentPersonality} onValueChange={setAgentPersonality}>
                        <SelectTrigger id="agentPersonality">
                          <SelectValue placeholder="Selecione um tom/personalidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {agentToneOptions.map(option => (
                            <SelectItem key={option.id} value={option.label}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agentRestrictions" className="flex items-center gap-1.5"><Ban size={16}/>Há alguma restrição ou informação importante para o agente LLM?</Label>
                      <Textarea
                        id="agentRestrictions"
                        placeholder="ex: Nunca fornecer informações de contato direto."
                        value={agentRestrictions}
                        onChange={(e) => setAgentRestrictions(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><Brain className="w-5 h-5 text-primary/80" /> Configurações do Modelo (Agente LLM)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agentModel">Modelo de IA (via Genkit)</Label>
                      <p className="text-xs text-muted-foreground">
                        Escolha o modelo Gemini do Google para o agente LLM. A integração com outros modelos (ex: OpenRouter) pode requerer configuração como Ferramenta Genkit.
                      </p>
                      <Select value={agentModel} onValueChange={setAgentModel}>
                        <SelectTrigger id="agentModel">
                          <SelectValue placeholder="Selecione um modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="googleai/gemini-1.5-pro-latest">Gemini 1.5 Pro (Google)</SelectItem>
                          <SelectItem value="googleai/gemini-1.5-flash-latest">Gemini 1.5 Flash (Google)</SelectItem>
                          <SelectItem value="googleai/gemini-pro">Gemini 1.0 Pro (Google)</SelectItem>
                          <SelectItem value="googleai/gemini-2.0-flash">Gemini 2.0 Flash (Google - Padrão Genkit)</SelectItem>
                          <SelectItem value="openrouter/custom">OpenRouter (requer configuração como Ferramenta Genkit)</SelectItem>
                          <SelectItem value="requestly/custom">Requestly Mock (requer configuração como Ferramenta Genkit)</SelectItem>
                          <SelectItem value="custom-http/genkit">Outro Endpoint HTTP (via Ferramenta Genkit)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agentTemperature">Temperatura: {agentTemperature[0].toFixed(1)}</Label>
                      <Slider
                        id="agentTemperature"
                        min={0}
                        max={1}
                        step={0.1}
                        value={agentTemperature}
                        onValueChange={setAgentTemperature}
                      />
                      <p className="text-xs text-muted-foreground">
                        Controla a criatividade da resposta. Baixo = focado, Alto = criativo.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {agentType === 'workflow' && (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Workflow className="w-5 h-5 text-primary/80" /> Configuração do Fluxo de Trabalho</h3>
                  <Alert className="mb-4">
                    <Workflow className="h-4 w-4" />
                    <AlertTitle>Agente de Fluxo de Trabalho</AlertTitle>
                    <AlertDescription>
                      Agentes de fluxo de trabalho controlam a execução de outros agentes ou tarefas em padrões predefinidos. Descreva o fluxo abaixo.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="workflowDescription">Descrição do Fluxo de Trabalho</Label>
                    <Textarea
                      id="workflowDescription"
                      placeholder="Descreva as etapas, a ordem e a lógica do seu fluxo de trabalho..."
                      value={workflowDescription}
                      onChange={(e) => setWorkflowDescription(e.target.value)}
                      rows={6}
                    />
                  </div>
                </div>
              </>
            )}

            {agentType === 'custom' && (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><FileJson className="w-5 h-5 text-primary/80" /> Configuração do Agente Personalizado</h3>
                  <Alert className="mb-4">
                    <FileJson className="h-4 w-4" />
                    <AlertTitle>Agente Personalizado (Lógica via Genkit Flow)</AlertTitle>
                    <AlertDescription>
                      Implemente lógicas operacionais únicas com fluxos Genkit customizados. Requer desenvolvimento de código.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="customLogicDescription">Descrição da Lógica Personalizada (Genkit Flow)</Label>
                    <Textarea
                      id="customLogicDescription"
                      placeholder="Descreva a funcionalidade principal e a lógica que seu fluxo Genkit personalizado implementará..."
                      value={customLogicDescription}
                      onChange={(e) => setCustomLogicDescription(e.target.value)}
                      rows={6}
                    />
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="agentVersion">Versão do Agente</Label>
                    <Input
                    id="agentVersion"
                    placeholder="ex: 1.0.0"
                    value={agentVersion}
                    onChange={(e) => setAgentVersion(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-medium flex items-center gap-2"><Network className="w-5 h-5 text-primary/80" /> Ferramentas do Agente (Capacidades via Genkit)</Label>
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Capacite seu agente com funcionalidades para interagir com o mundo exterior.
                  </p>
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
                          <Label htmlFor={`tool-${tool.id}`} className="font-medium flex items-center cursor-pointer">
                            {React.cloneElement(tool.icon as React.ReactElement, { size: 16, className: "mr-2"})} 
                            {tool.label}
                            {tool.needsConfiguration && <ConfigureIcon size={14} className="ml-2 text-muted-foreground group-hover:text-primary transition-colors" />}
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
                            {toolConfigurations[tool.id] && 
                              ( (tool.id === 'webSearch' && toolConfigurations[tool.id]?.googleApiKey && toolConfigurations[tool.id]?.googleCseId) ||
                                (tool.id === 'customApiIntegration' && toolConfigurations[tool.id]?.openapiSpecUrl) ||
                                (tool.needsConfiguration && !['webSearch', 'customApiIntegration'].includes(tool.id) && toolConfigurations[tool.id])
                              ) ? "Reconfigurar" : "Configurar"}
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
                            const toolIcon = tool ? React.cloneElement(tool.icon as React.ReactElement, { size: 14, className: "mr-1.5 inline-block" }) : null;
                            const isConfigured = tool?.needsConfiguration && toolConfigurations[tool.id] && 
                                                ( (tool.id === 'webSearch' && toolConfigurations[tool.id]?.googleApiKey && toolConfigurations[tool.id]?.googleCseId) ||
                                                  (tool.id === 'customApiIntegration' && toolConfigurations[tool.id]?.openapiSpecUrl) ||
                                                  (tool.needsConfiguration && !['webSearch', 'customApiIntegration'].includes(tool.id) && toolConfigurations[tool.id])
                                                );
                            return tool ? (
                              <li key={toolId} className="flex items-center">
                                  {toolIcon}
                                  {tool.label}
                                  {tool.needsConfiguration && (
                                      <ConfigureIcon 
                                          size={12} 
                                          className={`ml-1.5 ${isConfigured ? 'text-green-500' : 'text-blue-500'}`}
                                          title={isConfigured ? "Configurada" : "Requer configuração"}
                                      />
                                  )}
                              </li>
                            ) : null;
                        })}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            {/* Form content ends here */}
          </div>

          <DialogFooter className="p-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsBuilderModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveConfiguration}>
              <Save className="mr-2 h-4 w-4" /> Salvar Configuração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tool Configuration Modal */}
      {isToolConfigModalOpen && configuringTool && (
        <Dialog open={isToolConfigModalOpen} onOpenChange={(open) => {
          if (!open) setConfiguringTool(null); 
          setIsToolConfigModalOpen(open);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Configurar: {configuringTool.label}</DialogTitle>
              <DialogDescription>
                Forneça os detalhes de configuração para a ferramenta {configuringTool.label}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {configuringTool.id === "webSearch" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="modalGoogleApiKey">Chave de API do Google Custom Search</Label>
                    <Input 
                      id="modalGoogleApiKey" 
                      value={modalGoogleApiKey} 
                      onChange={(e) => setModalGoogleApiKey(e.target.value)}
                      placeholder="Cole sua chave API aqui (ex: AIza...)" 
                      type="password"
                    />
                    <p className="text-xs text-muted-foreground">Necessária para autenticar suas solicitações à API de busca.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modalGoogleCseId">ID do Mecanismo de Busca (CSE ID)</Label>
                    <Input 
                      id="modalGoogleCseId" 
                      value={modalGoogleCseId}
                      onChange={(e) => setModalGoogleCseId(e.target.value)}
                      placeholder="Cole seu CSE ID aqui (ex: 0123...)" 
                    />
                    <p className="text-xs text-muted-foreground">Identifica qual mecanismo de busca personalizado você deseja usar.</p>
                  </div>
                </>
              )}
              {configuringTool.id === "customApiIntegration" && (
                 <>
                  <div className="space-y-2">
                    <Label htmlFor="modalOpenapiSpecUrl">URL do Esquema OpenAPI (JSON ou YAML)</Label>
                    <Input 
                      id="modalOpenapiSpecUrl" 
                      value={modalOpenapiSpecUrl} 
                      onChange={(e) => setModalOpenapiSpecUrl(e.target.value)}
                      placeholder="ex: https://petstore.swagger.io/v2/swagger.json" 
                    />
                    <p className="text-xs text-muted-foreground">O link direto para o arquivo de especificação da API.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modalOpenapiApiKey">Chave de API da API Externa (Opcional)</Label>
                    <Input 
                      id="modalOpenapiApiKey" 
                      value={modalOpenapiApiKey}
                      onChange={(e) => setModalOpenapiApiKey(e.target.value)}
                      placeholder="Se a API requer uma chave de autenticação"
                      type="password"
                    />
                     <p className="text-xs text-muted-foreground">Usada pelo agente para interagir com a API externa.</p>
                  </div>
                </>
              )}
              {/* Adicionar aqui configurações para outras ferramentas se necessário */}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => { setIsToolConfigModalOpen(false); setConfiguringTool(null);}}>Cancelar</Button>
              </DialogClose>
              <Button onClick={handleSaveToolConfiguration}>Salvar Configuração</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
