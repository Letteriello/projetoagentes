
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Cpu, PlusCircle, Save, Info, Workflow, Settings, Brain, Target, ListChecks, Smile, Ban, Search, Calculator, FileText, CalendarDays, Network, Layers, Trash2, Edit, MessageSquare, Share2, FileJson, Database, Code2, BookText, Languages, Settings2 as ConfigureIcon, ClipboardCopy, Briefcase, Stethoscope, Plane } from "lucide-react";
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
  genkitToolName?: string;
}

export const availableTools: AvailableTool[] = [
  { id: "webSearch", label: "Busca na Web (Google)", icon: <Search size={16} className="mr-2"/>, description: "Permite ao agente pesquisar informações na internet (via Genkit). Exige configuração da chave API Google e CSE ID.", needsConfiguration: true, genkitToolName: "performWebSearch" },
  { id: "calculator", label: "Calculadora", icon: <Calculator size={16} className="mr-2"/>, description: "Permite ao agente realizar cálculos matemáticos (via função Genkit)." },
  { id: "knowledgeBase", label: "Consulta à Base de Conhecimento (RAG)", icon: <FileText size={16} className="mr-2"/>, description: "Permite ao agente buscar informações em bases de conhecimento ou documentos (ex: RAG via Genkit, pode requerer configuração para especificar a fonte de dados).", needsConfiguration: true },
  { id: "calendarAccess", label: "Acesso à Agenda/Calendário", icon: <CalendarDays size={16} className="mr-2"/>, description: "Permite ao agente verificar ou criar eventos na agenda (requer fluxo Genkit e autenticação).", needsConfiguration: true },
  { id: "customApiIntegration", label: "Integração com API Externa (OpenAPI)", icon: <Network size={16} className="mr-2"/>, description: "Permite ao agente interagir com serviços web externos (ex: via OpenAPI, requer fluxo Genkit, URL do esquema e possivelmente chaves API).", needsConfiguration: true },
  { id: "databaseAccess", label: "Acesso a Banco de Dados (SQL)", icon: <Database size={16} className="mr-2"/>, description: "Permite ao agente consultar e interagir com bancos de dados SQL (requer fluxo Genkit e configuração de conexão detalhada).", needsConfiguration: true },
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
  { id: "llm", label: "Agente LLM (Decisão e Linguagem)", icon: <Brain size={16} />, description: "Usa Modelos de Linguagem (LLMs) para raciocinar, planejar, gerar respostas e usar ferramentas. Ideal para tarefas flexíveis e centradas na linguagem." },
  { id: "workflow", label: "Agente de Fluxo de Trabalho (Workflow)", icon: <Workflow size={16} />, description: "Controla a execução de outros agentes ou tarefas em padrões predefinidos (sequencial, paralelo, loop) de forma determinística. Não usa LLM para controle de fluxo." },
  { id: "custom", label: "Agente Personalizado (Lógica via Genkit)", icon: <FileJson size={16} />, description: "Implementa lógicas operacionais únicas e fluxos de controle específicos com fluxos Genkit customizados. Requer desenvolvimento de código." },
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
  // Campos de LLM podem ser opcionais se um workflow puder ter um LLM para alguma etapa,
  // mas o controle principal do fluxo não é por LLM.
  agentGoal?: string;
  agentTasks?: string;
  agentPersonality?: string;
  agentRestrictions?: string;
  agentModel?: string;
  agentTemperature?: number;
}

export interface CustomAgentConfig extends AgentConfigBase {
  agentType: "custom";
  customLogicDescription: string;
   // Campos de LLM podem ser opcionais se o agente customizado usar um LLM internamente.
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
  dbType?: string;
  dbConnectionString?: string;
  dbUser?: string;
  dbPassword?: string;
  dbName?: string;
  dbHost?: string;
  dbPort?: string;
  dbDescription?: string;
  knowledgeBaseId?: string;
  calendarApiEndpoint?: string;
}


export interface SavedAgentConfiguration extends AgentConfig {
  id: string;
  templateId: string;
  systemPromptGenerated?: string;
  toolsDetails: Array<{ id: string; label: string; iconName?: keyof typeof iconComponents | 'default'; needsConfiguration?: boolean; genkitToolName?: string; }>;
  toolConfigsApplied?: Record<string, ToolConfigData>;
}

const iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  Search, Calculator, FileText, CalendarDays, Network, Database, Code2, Default: Cpu, Briefcase, Stethoscope, Plane
};

const getToolIconComponent = (iconName?: keyof typeof iconComponents | 'default') => {
  const Icon = iconName ? iconComponents[iconName] : iconComponents['Default'];
  return Icon || Cpu;
};


const defaultLLMConfig: Omit<LLMAgentConfig, keyof AgentConfigBase | 'agentType'> = {
  agentGoal: "",
  agentTasks: "",
  agentPersonality: agentToneOptions[0].label,
  agentRestrictions: "",
  agentModel: "googleai/gemini-2.0-flash",
  agentTemperature: 0.7,
};

export const agentTemplates: AgentTemplate[] = [
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
  {
    id: "legal_analyst_basic",
    name: "Modelo: Analista Jurídico Básico (LLM)",
    config: {
      agentType: "llm",
      agentName: "Analista Jurídico Básico",
      agentDescription: "Agente para auxiliar na compreensão de conceitos legais e pesquisa de informações jurídicas básicas.",
      agentGoal: "Ajudar a entender conceitos legais básicos, resumir termos jurídicos e encontrar informações sobre leis (com a ferramenta de busca).",
      agentTasks: "1. Explicar termos legais em linguagem simples.\n2. Resumir cláusulas contratuais (se fornecidas pelo usuário).\n3. Buscar leis ou jurisprudências sobre um tópico (usando a ferramenta de busca).\n4. Não fornecer aconselhamento jurídico.",
      agentPersonality: "Profissional e Direto",
      agentRestrictions: "NÃO FORNECER ACONSELHAMENTO LEGAL. Sempre recomendar a consulta a um advogado qualificado. Usar linguagem clara e evitar jargões excessivos. Limitar-se a informações e explicações gerais.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.3,
      agentVersion: "1.0.0",
      agentTools: ["webSearch", "knowledgeBase"],
    },
  },
  {
    id: "medical_triage_info",
    name: "Modelo: Assistente de Triagem Médica Informativo (LLM)",
    config: {
      agentType: "llm",
      agentName: "Assistente de Triagem Médica (Informativo)",
      agentDescription: "Agente para fornecer informações gerais sobre sintomas e direcionamento, SEM FORNECER DIAGNÓSTICO.",
      agentGoal: "Fornecer informações gerais sobre sintomas comuns e possíveis condições, e direcionar para cuidados médicos apropriados, enfatizando que não substitui uma consulta médica.",
      agentTasks: "1. Coletar informações sobre sintomas descritos pelo usuário.\n2. Oferecer informações gerais sobre possíveis causas relacionadas aos sintomas (com base em conhecimento geral e busca na web).\n3. Sugerir se é apropriado procurar um médico, atendimento de urgência ou autocuidado (com base na gravidade percebida dos sintomas descritos).\n4. Fornecer informações sobre tipos de especialistas médicos relevantes.",
      agentPersonality: "Empático e Compreensivo",
      agentRestrictions: "NÃO FORNECER DIAGNÓSTICOS. NÃO SUBSTITUIR A CONSULTA MÉDICA. Sempre enfatizar a importância de consultar um profissional de saúde para diagnósticos e tratamento. Não prescrever medicamentos ou tratamentos. As informações são apenas para fins educativos e informativos.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.5,
      agentVersion: "1.0.0",
      agentTools: ["webSearch", "knowledgeBase"],
    },
  },
  {
    id: "travel_planner_basic",
    name: "Modelo: Planejador de Viagens Inicial (LLM)",
    config: {
      agentType: "llm",
      agentName: "Planejador de Viagens Inicial",
      agentDescription: "Agente para ajudar a pesquisar destinos, voos, acomodações e sugerir itinerários básicos.",
      agentGoal: "Ajudar usuários a pesquisar destinos, voos e acomodações, e fornecer sugestões de itinerários.",
      agentTasks: "1. Perguntar sobre preferências de viagem (destino, orçamento, datas, tipo de viagem, interesses).\n2. Pesquisar destinos e atrações com base nos critérios (usando busca na web).\n3. Sugerir opções de voos e hotéis (simulado ou via ferramenta de busca), indicando que são exemplos.\n4. Esboçar um itinerário básico com atividades e pontos de interesse.",
      agentPersonality: "Amigável e Prestativo",
      agentRestrictions: "Informar que preços, disponibilidade e horários são exemplos e precisam ser verificados em sites de reserva reais. Não fazer reservas ou coletar informações de pagamento. Focar em sugestões e planejamento.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.7,
      agentVersion: "1.0.0",
      agentTools: ["webSearch", "customApiIntegration"],
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

  const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, ToolConfigData>>({});
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

  const [isBuilderModalOpen, setIsBuilderModalOpen] = React.useState(false);
  const [editingAgentId, setEditingAgentId] = React.useState<string | null>(null);


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
      setToolConfigurations({}); // Reset tool configs when template changes

      if (template.config.agentType === 'llm') {
        const llmConfig = template.config as LLMAgentConfig;
        resetLLMFields(llmConfig);
        resetWorkflowFields();
        resetCustomLogicFields();
      } else if (template.config.agentType === 'workflow') {
        const workflowConfig = template.config as WorkflowAgentConfig;
        resetLLMFields(workflowConfig as Partial<LLMAgentConfig>); // Keep LLM fields if present in template
        setWorkflowDescription(workflowConfig.workflowDescription || "");
        resetCustomLogicFields();
      } else if (template.config.agentType === 'custom') {
        const customConfig = template.config as CustomAgentConfig;
        resetLLMFields(customConfig as Partial<LLMAgentConfig>); // Keep LLM fields if present in template
        resetWorkflowFields();
        setCustomLogicDescription(customConfig.customLogicDescription || "");
      }
    }
  };

  const handleAgentTypeChange = (newAgentType: AgentConfig["agentType"]) => {
    setAgentType(newAgentType);
    // Ao mudar o tipo de agente, não limpamos mais os campos de LLM,
    // pois um workflow ou custom agent ainda pode usar um LLM para algumas tarefas.
    // Apenas limpamos os campos específicos do tipo anterior.
    if (newAgentType === 'llm') {
        resetWorkflowFields();
        resetCustomLogicFields();
        // Se o template atual não era LLM, preenche com defaults de LLM
        const currentTemplate = agentTemplates.find(t => t.id === selectedAgentTemplateId);
        if (currentTemplate && currentTemplate.config.agentType !== 'llm') {
           resetLLMFields(defaultLLMConfig);
        }
    } else if (newAgentType === 'workflow') {
        resetCustomLogicFields();
    } else if (newAgentType === 'custom') {
        resetWorkflowFields();
    }
  };

  const constructSystemPrompt = () => {
    if (agentType !== 'llm' && !agentGoal && !agentTasks && !agentPersonality) { // Não gera prompt de sistema se não for LLM E campos relevantes estiverem vazios
        return undefined; // Ou uma string vazia, dependendo de como o backend trata
    }

    let prompt = `Você é um agente de IA. `;
    if (agentType === 'llm') {
        prompt += `Seu tipo principal é LLM (Modelo de Linguagem Grande). `;
    } else if (agentType === 'workflow') {
        prompt += `Seu tipo principal é Agente de Fluxo de Trabalho. `;
    } else if (agentType === 'custom') {
        prompt += `Seu tipo principal é Agente Personalizado. `;
    }
    prompt += `A seguir, suas características e responsabilidades:\n\n`;

    if (agentGoal) prompt += `OBJETIVO PRINCIPAL:\n${agentGoal}\n\n`;
    if (agentTasks) prompt += `TAREFAS PRINCIPAIS A SEREM REALIZADAS:\n${agentTasks}\n\n`;
    if (agentPersonality) prompt += `PERSONALIDADE/TOM DE COMUNICAÇÃO:\n${agentPersonality}\n\n`;
    if (agentRestrictions) {
      prompt += `RESTRIÇÕES E DIRETRIZES IMPORTANTES A SEGUIR RIGOROSAMENTE:\n${agentRestrictions}\n\n`;
    }

    const selectedToolObjects = currentAgentTools
      .map(toolId => availableTools.find(t => t.id === toolId))
      .filter(Boolean) as AvailableTool[];

    if (selectedToolObjects.length > 0) {
        prompt += `FERRAMENTAS DISPONÍVEIS (Você deve decidir quando e como usá-las. Se uma ferramenta estiver marcada como 'requer configuração' e não estiver explicitamente configurada, informe ao usuário que não pode usá-la ou peça para configurá-la):\n`;
        selectedToolObjects.forEach(tool => {
            const currentToolConfig = toolConfigurations[tool.id];
            const isConfigured = tool.needsConfiguration && currentToolConfig &&
                ( (tool.id === 'webSearch' && currentToolConfig.googleApiKey && currentToolConfig.googleCseId) ||
                  (tool.id === 'customApiIntegration' && currentToolConfig.openapiSpecUrl) ||
                  (tool.id === 'databaseAccess' && (currentToolConfig.dbConnectionString || (currentToolConfig.dbHost && currentToolConfig.dbName))) ||
                  (tool.id === 'knowledgeBase' && currentToolConfig.knowledgeBaseId) ||
                  (tool.id === 'calendarAccess' && currentToolConfig.calendarApiEndpoint) ||
                  (tool.needsConfiguration && !['webSearch', 'customApiIntegration', 'databaseAccess', 'knowledgeBase', 'calendarAccess'].includes(tool.id) && Object.keys(currentToolConfig).length > 0 ) // Verifica se há alguma chave preenchida
                );

            const toolNameForPrompt = tool.genkitToolName || tool.label.replace(/\s+/g, '');
            prompt += `- Nome da Ferramenta para uso: '${toolNameForPrompt}'. Descrição: ${tool.description}${tool.needsConfiguration ? (isConfigured ? " (Status: Configurada e pronta para uso)" : " (Status: Requer configuração. Verifique antes de usar ou informe a necessidade de configuração)") : ""}\n`;
        });
        prompt += "\n";
    } else {
        prompt += `Nenhuma ferramenta externa está configurada para este agente.\n\n`;
    }

    prompt += "INSTRUÇÕES ADICIONAIS DE INTERAÇÃO:\n";
    prompt += "- Responda de forma concisa e direta ao ponto, a menos que o tom da personalidade solicite o contrário.\n";
    prompt += "- Se você precisar usar uma ferramenta, anuncie claramente qual ferramenta (usando o 'Nome da Ferramenta para uso' fornecido acima) e por que você a usaria ANTES de simular sua execução ou pedir ao usuário para aguardar. Após a simulação (ou se a execução real for implementada), apresente os resultados obtidos pela ferramenta.\n";
    prompt += "- Seja transparente sobre suas capacidades e limitações. Se não puder realizar uma tarefa, explique o motivo.\n";
    prompt += "- Se uma ferramenta necessária não estiver configurada, informe ao usuário educadamente.\n";


    return prompt.trim();
  };

  const handleCreateNewAgent = () => {
    const customTemplate = agentTemplates.find(t => t.id === "custom_llm") || agentTemplates[0];
    handleTemplateChange(customTemplate.id);
    setToolConfigurations({});
    setEditingAgentId(null);
  };

  const openCreateAgentModal = () => {
    handleCreateNewAgent();
    setIsBuilderModalOpen(true);
  };

  const handleEditAgent = (agentToEdit: SavedAgentConfiguration) => {
    setEditingAgentId(agentToEdit.id);
    setSelectedAgentTemplateId(agentToEdit.templateId || 'custom_llm');
    setAgentType(agentToEdit.agentType);
    setAgentName(agentToEdit.agentName);
    setAgentDescription(agentToEdit.agentDescription);
    setAgentVersion(agentToEdit.agentVersion);
    setCurrentAgentTools(agentToEdit.agentTools);
    setToolConfigurations(agentToEdit.toolConfigsApplied || {});

    if (agentToEdit.agentType === 'llm') {
      const llmConfig = agentToEdit as LLMAgentConfig;
      resetLLMFields(llmConfig);
      resetWorkflowFields();
      resetCustomLogicFields();
    } else if (agentToEdit.agentType === 'workflow') {
      const workflowConfig = agentToEdit as WorkflowAgentConfig;
      setWorkflowDescription(workflowConfig.workflowDescription || "");
      resetLLMFields({ // Preenche campos de LLM se existirem, senão usa defaults
        agentGoal: workflowConfig.agentGoal || defaultLLMConfig.agentGoal,
        agentTasks: workflowConfig.agentTasks || defaultLLMConfig.agentTasks,
        agentPersonality: workflowConfig.agentPersonality || defaultLLMConfig.agentPersonality,
        agentRestrictions: workflowConfig.agentRestrictions || defaultLLMConfig.agentRestrictions,
        agentModel: workflowConfig.agentModel || defaultLLMConfig.agentModel,
        agentTemperature: workflowConfig.agentTemperature === undefined ? defaultLLMConfig.agentTemperature : workflowConfig.agentTemperature,
      });
      resetCustomLogicFields();
    } else if (agentToEdit.agentType === 'custom') {
      const customConfig = agentToEdit as CustomAgentConfig;
      setCustomLogicDescription(customConfig.customLogicDescription || "");
      resetLLMFields({ // Preenche campos de LLM se existirem, senão usa defaults
        agentGoal: customConfig.agentGoal || defaultLLMConfig.agentGoal,
        agentTasks: customConfig.agentTasks || defaultLLMConfig.agentTasks,
        agentPersonality: customConfig.agentPersonality || defaultLLMConfig.agentPersonality,
        agentRestrictions: customConfig.agentRestrictions || defaultLLMConfig.agentRestrictions,
        agentModel: customConfig.agentModel || defaultLLMConfig.agentModel,
        agentTemperature: customConfig.agentTemperature === undefined ? defaultLLMConfig.agentTemperature : customConfig.agentTemperature,
      });
      resetWorkflowFields();
    }
    setIsBuilderModalOpen(true);
  };


  const handleSaveConfiguration = () => {
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
            if (iconProp && typeof iconProp === 'object' && 'type' in iconProp && typeof iconProp.type === 'function') {
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

    let agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'templateId' | 'toolsDetails' | 'toolConfigsApplied' | 'systemPromptGenerated'> = {
        agentName,
        agentDescription,
        agentVersion,
        agentTools: currentAgentTools,
        agentType,
    };

    if (agentType === 'llm') {
      agentConfigData = {
        ...agentConfigData,
        agentGoal,
        agentTasks,
        agentPersonality,
        agentRestrictions,
        agentModel,
        agentTemperature: agentTemperature[0],
      } as LLMAgentConfig;
    } else if (agentType === 'workflow') {
      agentConfigData = {
        ...agentConfigData,
        workflowDescription,
        agentGoal: agentGoal || undefined, 
        agentTasks: agentTasks || undefined,
        agentPersonality: agentPersonality || undefined,
        agentRestrictions: agentRestrictions || undefined,
        agentModel: agentModel || undefined,
        agentTemperature: agentTemperature[0] ?? undefined,
      } as WorkflowAgentConfig;
    } else { // custom
      agentConfigData = {
        ...agentConfigData,
        customLogicDescription,
        agentGoal: agentGoal || undefined, 
        agentTasks: agentTasks || undefined,
        agentPersonality: agentPersonality || undefined,
        agentRestrictions: agentRestrictions || undefined,
        agentModel: agentModel || undefined,
        agentTemperature: agentTemperature[0] ?? undefined,
      } as CustomAgentConfig;
    }

    if (editingAgentId) {
        setSavedAgents(prevAgents =>
            prevAgents.map(agent =>
                agent.id === editingAgentId ?
                {
                    ...(agentConfigData as AgentConfig), 
                    id: editingAgentId, 
                    templateId: selectedAgentTemplateId,
                    systemPromptGenerated: systemPrompt,
                    toolsDetails: selectedToolsDetails,
                    toolConfigsApplied: appliedToolConfigs,
                } : agent
            )
        );
        toast({ title: "Agente Atualizado!", description: `O agente "${agentName}" foi atualizado.` });
    } else {
        const newAgentConfiguration: SavedAgentConfiguration = {
            id: `agent-${Date.now()}`,
            templateId: selectedAgentTemplateId,
            ...(agentConfigData as AgentConfig), 
            systemPromptGenerated: systemPrompt,
            toolsDetails: selectedToolsDetails,
            toolConfigsApplied: appliedToolConfigs,
        };
        setSavedAgents(prevAgents => [...prevAgents, newAgentConfiguration]);
        toast({
          title: "Configuração Salva!",
          description: `O agente "${agentName}" (${agentTypeOptions.find(opt => opt.id === agentType)?.label}) foi adicionado à sua lista.`,
        });
    }

    setEditingAgentId(null);
    setIsBuilderModalOpen(false);
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
      [configuringTool.id]: newConfigData as ToolConfigData,
    }));
    setIsToolConfigModalOpen(false);
    setConfiguringTool(null);
    toast({ title: `Configuração salva para ${configuringTool.label}`});
  };


  return (
    <div className="space-y-8 p-4">
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

      {savedAgents.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedAgents.map((agent) => {
              const agentTypeDetails = agentTypeOptions.find(opt => opt.id === agent.agentType);
              const agentTypeLabel = agentTypeDetails?.label.split('(')[0].trim() || agent.agentType;

              let AgentIconComponent: React.ReactNode;
              switch (agent.templateId) {
                case 'legal_analyst_basic':
                  AgentIconComponent = <Briefcase size={20} className="text-primary mr-4 self-start mt-1 w-10 h-10" />;
                  break;
                case 'medical_triage_info':
                  AgentIconComponent = <Stethoscope size={20} className="text-primary mr-4 self-start mt-1 w-10 h-10" />;
                  break;
                case 'travel_planner_basic':
                  AgentIconComponent = <Plane size={20} className="text-primary mr-4 self-start mt-1 w-10 h-10" />;
                  break;
                default:
                  const IconFromType = agentTypeDetails?.icon ?
                    React.cloneElement(agentTypeDetails.icon as React.ReactElement, { size: 20, className: "text-primary mr-4 self-start mt-1 w-10 h-10" }) :
                    <Cpu size={20} className="text-primary mr-4 self-start mt-1 w-10 h-10" />;
                  AgentIconComponent = IconFromType;
              }

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
                                    const IconComponent = getToolIconComponent(toolDetail.iconName);
                                    const toolIcon = <IconComponent size={12} />;

                                    const isConfigured = fullTool?.needsConfiguration && agent.toolConfigsApplied?.[toolDetail.id] &&
                                                        ( (fullTool.id === 'webSearch' && agent.toolConfigsApplied[fullTool.id]?.googleApiKey && agent.toolConfigsApplied[fullTool.id]?.googleCseId) ||
                                                          (fullTool.id === 'customApiIntegration' && agent.toolConfigsApplied[fullTool.id]?.openapiSpecUrl) ||
                                                          (fullTool.id === 'databaseAccess' && (agent.toolConfigsApplied[fullTool.id]?.dbConnectionString || (agent.toolConfigsApplied[fullTool.id]?.dbHost && agent.toolConfigsApplied[fullTool.id]?.dbName))) ||
                                                          (fullTool.id === 'knowledgeBase' && agent.toolConfigsApplied[fullTool.id]?.knowledgeBaseId) ||
                                                          (fullTool.id === 'calendarAccess' && agent.toolConfigsApplied[fullTool.id]?.calendarApiEndpoint) ||
                                                           (fullTool.needsConfiguration && !['webSearch', 'customApiIntegration', 'databaseAccess', 'knowledgeBase', 'calendarAccess'].includes(fullTool.id) && Object.keys(agent.toolConfigsApplied[fullTool.id] || {}).length > 0)
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
                    <Button variant="outline" size="sm" onClick={() => handleEditAgent(agent)}>
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

      <Dialog open={isBuilderModalOpen} onOpenChange={(isOpen) => {
          setIsBuilderModalOpen(isOpen);
          if (!isOpen) setEditingAgentId(null);
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="text-2xl">
                {editingAgentId ? `Editar Agente: ${agentName || 'Agente'}` : "Configurar Novo Agente"}
            </DialogTitle>
            <DialogDescription>
              {editingAgentId ? "Modifique as propriedades e configurações do seu agente." : "Defina as propriedades e configurações para seu novo agente. Comece com um modelo ou configure do zero."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentTemplate" className="flex items-center gap-1.5"><Layers size={16}/>Modelo de Agente Inicial (Template)</Label>
                <Select value={selectedAgentTemplateId} onValueChange={handleTemplateChange} disabled={!!editingAgentId}>
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

            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-primary/80" /> Comportamento e Instruções {agentType !== 'llm' && '(Opcional para este tipo)'}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Forneça instruções claras para guiar o comportamento de decisão do agente. As respostas abaixo ajudarão a construir o "Prompt do Sistema" ideal.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agentGoal" className="flex items-center gap-1.5"><Target size={16}/>Qual é o objetivo principal deste agente?</Label>
                  <Input
                    id="agentGoal"
                    placeholder="ex: Ajudar usuários a encontrarem informações sobre nossos produtos."
                    value={agentGoal}
                    onChange={(e) => setAgentGoal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentTasks" className="flex items-center gap-1.5"><ListChecks size={16}/>Quais são as principais tarefas que este agente deve realizar?</Label>
                  <Textarea
                    id="agentTasks"
                    placeholder="ex: 1. Responder perguntas sobre especificações. 2. Comparar produtos."
                    value={agentTasks}
                    onChange={(e) => setAgentTasks(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentPersonality" className="flex items-center gap-1.5"><Smile size={16}/>Qual deve ser a personalidade/tom do agente?</Label>
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
                  <Label htmlFor="agentRestrictions" className="flex items-center gap-1.5"><Ban size={16}/>Há alguma restrição ou informação importante para o agente?</Label>
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
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><Brain className="w-5 h-5 text-primary/80" /> Configurações do Modelo {agentType !== 'llm' && '(Opcional para este tipo)'}</h3>
               <p className="text-sm text-muted-foreground mb-4">
                  Se este agente utilizar um Modelo de Linguagem Grande (LLM) para alguma de suas funções, configure-o aqui.
                </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentModel">Modelo de IA (via Genkit)</Label>
                  <p className="text-xs text-muted-foreground">
                    Escolha o modelo Gemini para o agente. Outros (ex: OpenRouter) requerem fluxo Genkit dedicado e podem não funcionar no chat padrão sem ele.
                  </p>
                  <Select value={agentModel} onValueChange={setAgentModel}>
                    <SelectTrigger id="agentModel">
                      <SelectValue placeholder="Selecione um modelo (opcional)" />
                    </SelectTrigger>
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

            {agentType === 'workflow' && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Workflow className="w-5 h-5 text-primary/80" /> Configuração do Fluxo de Trabalho</h3>
                  <Alert className="mb-4">
                    <Workflow className="h-4 w-4" />
                    <AlertTitle>Agente de Fluxo de Trabalho</AlertTitle>
                    <AlertDescription>
                      Agentes de fluxo de trabalho (Ex: SequentialAgent, ParallelAgent do ADK) controlam a execução de outros agentes ou tarefas em padrões predefinidos e determinísticos.
                      Descreva o fluxo abaixo. A implementação detalhada das etapas e orquestração ocorreria via código Genkit. Uma UI dedicada para construção visual de fluxos é planejada para o futuro.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="workflowDescription">Descrição do Fluxo de Trabalho e Etapas</Label>
                    <Textarea
                      id="workflowDescription"
                      placeholder="Descreva as etapas, a ordem (sequencial, paralelo, loop) e a lógica do seu fluxo de trabalho..."
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
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><FileJson className="w-5 h-5 text-primary/80" /> Configuração do Agente Personalizado</h3>
                  <Alert className="mb-4">
                    <FileJson className="h-4 w-4" />
                    <AlertTitle>Agente Personalizado (BaseAgent Estendido)</AlertTitle>
                    <AlertDescription>
                      Implemente lógicas operacionais únicas e fluxos de controle específicos com fluxos Genkit customizados (equivalente a estender a BaseAgent do ADK). Requer desenvolvimento de código no backend.
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
                    Capacite seu agente com funcionalidades para interagir com o mundo exterior. A execução real de cada ferramenta é gerenciada por um fluxo Genkit no backend.
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
                            {toolConfigurations[tool.id] &&
                              ( (tool.id === 'webSearch' && toolConfigurations[tool.id]?.googleApiKey && toolConfigurations[tool.id]?.googleCseId) ||
                                (tool.id === 'customApiIntegration' && toolConfigurations[tool.id]?.openapiSpecUrl) ||
                                (tool.id === 'databaseAccess' && (toolConfigurations[tool.id]?.dbConnectionString || (toolConfigurations[tool.id]?.dbHost && toolConfigurations[tool.id]?.dbName))) ||
                                (tool.id === 'knowledgeBase' && toolConfigurations[tool.id]?.knowledgeBaseId) ||
                                (tool.id === 'calendarAccess' && toolConfigurations[tool.id]?.calendarApiEndpoint) ||
                                (tool.needsConfiguration && !['webSearch', 'customApiIntegration', 'databaseAccess', 'knowledgeBase', 'calendarAccess'].includes(tool.id) && Object.keys(toolConfigurations[tool.id] || {}).length > 0 )
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
                            if (!tool) return null;

                            let iconNameKey: keyof typeof iconComponents | 'default' = 'Default';
                            const iconProp = tool.icon;
                            if (iconProp && typeof iconProp === 'object' && 'type' in iconProp && typeof iconProp.type === 'function') {
                                const IconComponent = iconProp.type as React.FC<React.SVGProps<SVGSVGElement>>;
                                const foundIconName = Object.keys(iconComponents).find(
                                    name => iconComponents[name] === IconComponent
                                ) as keyof typeof iconComponents | undefined;
                                if (foundIconName) {
                                    iconNameKey = foundIconName;
                                }
                            }
                            const IconToRender = getToolIconComponent(iconNameKey);
                            const toolIcon = <IconToRender size={14} className="mr-1.5 inline-block" />;

                            const currentToolConfig = toolConfigurations[tool.id];
                            const isConfigured = tool.needsConfiguration && currentToolConfig &&
                                                ( (tool.id === 'webSearch' && currentToolConfig.googleApiKey && currentToolConfig.googleCseId) ||
                                                  (tool.id === 'customApiIntegration' && currentToolConfig.openapiSpecUrl) ||
                                                  (tool.id === 'databaseAccess' && (currentToolConfig.dbConnectionString || (currentToolConfig.dbHost && currentToolConfig.dbName))) ||
                                                  (tool.id === 'knowledgeBase' && currentToolConfig.knowledgeBaseId) ||
                                                  (tool.id === 'calendarAccess' && currentToolConfig.calendarApiEndpoint) ||
                                                  (tool.needsConfiguration && !['webSearch', 'customApiIntegration', 'databaseAccess', 'knowledgeBase', 'calendarAccess'].includes(tool.id) && Object.keys(currentToolConfig).length > 0 )
                                                );
                            return (
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
            <Button variant="outline" onClick={() => { setIsBuilderModalOpen(false); setEditingAgentId(null); }}>Cancelar</Button>
            <Button onClick={handleSaveConfiguration}>
              <Save className="mr-2 h-4 w-4" /> {editingAgentId ? "Salvar Alterações" : "Salvar Configuração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isToolConfigModalOpen && configuringTool && (
        <Dialog open={isToolConfigModalOpen} onOpenChange={(open) => {
          if (!open) setConfiguringTool(null);
          setIsToolConfigModalOpen(open);
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Configurar: {configuringTool.label}</DialogTitle>
              <DialogDescription>
                Forneça os detalhes de configuração para a ferramenta {configuringTool.label}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
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
              {configuringTool.id === "databaseAccess" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="modalDbType">Tipo de Banco de Dados</Label>
                    <Select value={modalDbType} onValueChange={setModalDbType}>
                        <SelectTrigger id="modalDbType">
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="postgresql">PostgreSQL</SelectItem>
                            <SelectItem value="mysql">MySQL</SelectItem>
                            <SelectItem value="sqlserver">SQL Server</SelectItem>
                            <SelectItem value="sqlite">SQLite</SelectItem>
                            <SelectItem value="other">Outro (especificar string de conexão)</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  {modalDbType !== 'other' && modalDbType !== 'sqlite' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="modalDbHost">Host</Label>
                                <Input id="modalDbHost" value={modalDbHost} onChange={(e) => setModalDbHost(e.target.value)} placeholder="ex: localhost ou endereço do servidor" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="modalDbPort">Porta</Label>
                                <Input id="modalDbPort" type="number" value={modalDbPort} onChange={(e) => setModalDbPort(e.target.value)} placeholder="ex: 5432" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="modalDbName">Nome do Banco de Dados</Label>
                            <Input id="modalDbName" value={modalDbName} onChange={(e) => setModalDbName(e.target.value)} placeholder="ex: meu_banco_de_dados" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="modalDbUser">Usuário</Label>
                                <Input id="modalDbUser" value={modalDbUser} onChange={(e) => setModalDbUser(e.target.value)} placeholder="ex: admin_usuario" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="modalDbPassword">Senha</Label>
                                <Input id="modalDbPassword" type="password" value={modalDbPassword} onChange={(e) => setModalDbPassword(e.target.value)} />
                            </div>
                        </div>
                    </>
                  )}
                  {(modalDbType === 'other' || modalDbType === 'sqlite') && (
                    <div className="space-y-2">
                        <Label htmlFor="modalDbConnectionString">String de Conexão (ou Caminho para SQLite)</Label>
                        <Input
                        id="modalDbConnectionString"
                        value={modalDbConnectionString}
                        onChange={(e) => setModalDbConnectionString(e.target.value)}
                        placeholder={modalDbType === 'sqlite' ? "ex: /caminho/para/meu_banco.db" : "ex: postgresql://user:pass@host:port/db"}
                        />
                         <p className="text-xs text-muted-foreground">
                            {modalDbType === 'sqlite' ? 'Caminho absoluto ou relativo para o arquivo do banco de dados SQLite.' : 'Formato completo da string de conexão.'}
                        </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="modalDbDescription">Descrição do Banco/Tabelas (Opcional)</Label>
                    <Textarea
                        id="modalDbDescription"
                        value={modalDbDescription}
                        onChange={(e) => setModalDbDescription(e.target.value)}
                        placeholder="Ex: Contém tabelas de clientes e pedidos. Tabela 'clientes' tem colunas: id, nome, email."
                        rows={3}
                    />
                    <p className="text-xs text-muted-foreground">Ajuda o agente a entender o contexto dos dados disponíveis.</p>
                  </div>
                </>
              )}
               {configuringTool.id === "knowledgeBase" && (
                <div className="space-y-2">
                    <Label htmlFor="modalKnowledgeBaseId">ID/Nome da Base de Conhecimento</Label>
                    <Input
                      id="modalKnowledgeBaseId"
                      value={modalKnowledgeBaseId}
                      onChange={(e) => setModalKnowledgeBaseId(e.target.value)}
                      placeholder="ex: documentos_produto_xyz ou faq_servico_abc"
                    />
                    <p className="text-xs text-muted-foreground">Identificador único para a base de conhecimento que o agente deve consultar (ex: Vertex AI Search Datastore ID, nome de coleção Pinecone, etc.).</p>
                </div>
              )}
              {configuringTool.id === "calendarAccess" && (
                <div className="space-y-2">
                    <Label htmlFor="modalCalendarApiEndpoint">Endpoint da API de Calendário ou ID do Fluxo Genkit</Label>
                    <Input
                      id="modalCalendarApiEndpoint"
                      value={modalCalendarApiEndpoint}
                      onChange={(e) => setModalCalendarApiEndpoint(e.target.value)}
                      placeholder="ex: https://api.example.com/calendar ou nome_do_fluxo_genkit_calendario"
                    />
                    <p className="text-xs text-muted-foreground">URL do endpoint da API ou o identificador do fluxo Genkit responsável pelo acesso à agenda. Pode requerer autenticação OAuth configurada separadamente no backend.</p>
                </div>
              )}
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


    