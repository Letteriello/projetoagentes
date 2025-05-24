
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"; // Card-related imports
import { Cpu, PlusCircle, Layers, Edit, MessageSquare, Trash2, Search, Calculator, FileText, CalendarDays, Network, Database, Code2, Briefcase, Stethoscope, Plane, Workflow, Brain, FileJson, Settings2 as ConfigureIcon, GripVertical } from "lucide-react";
import Image from "next/image"; // Keep if used elsewhere, or remove
import { useToast } from "@/hooks/use-toast";
import { useAgents } from '@/contexts/AgentsContext';
import { Badge } from "@/components/ui/badge"; // Keep if used elsewhere, or remove

// Import dos novos componentes
import { AgentCard } from '@/components/agent-builder/agent-card';
import { AgentBuilderDialog } from '@/components/agent-builder/agent-builder-dialog';


// Estas definições de tipo e constantes serão mantidas aqui e passadas como props
// para o AgentBuilderDialog e AgentCard.
export interface AvailableTool {
  id: string;
  label: string;
  icon: React.ReactNode; // ReactNode para o ícone
  description: string;
  needsConfiguration?: boolean;
  genkitToolName?: string;
}

export const availableTools: AvailableTool[] = [
  { id: "webSearch", label: "Busca na Web (Google)", icon: <Search size={16} className="mr-2"/>, description: "Permite ao agente pesquisar na internet (via Genkit). Requer configuração.", needsConfiguration: true, genkitToolName: "performWebSearch" },
  { id: "calculator", label: "Calculadora", icon: <Calculator size={16} className="mr-2"/>, description: "Permite realizar cálculos matemáticos (via função Genkit)." },
  { id: "knowledgeBase", label: "Consulta à Base de Conhecimento (RAG)", icon: <FileText size={16} className="mr-2"/>, description: "Permite buscar em bases de conhecimento ou documentos (ex: RAG via Genkit).", needsConfiguration: true },
  { id: "calendarAccess", label: "Acesso à Agenda/Calendário", icon: <CalendarDays size={16} className="mr-2"/>, description: "Permite verificar ou criar eventos na agenda (requer fluxo Genkit e auth).", needsConfiguration: true },
  { id: "customApiIntegration", label: "Integração com API Externa (OpenAPI)", icon: <Network size={16} className="mr-2"/>, description: "Permite interagir com serviços web externos (via OpenAPI, requer fluxo Genkit).", needsConfiguration: true, genkitToolName: "invokeOpenAPI" },
  { id: "databaseAccess", label: "Acesso a Banco de Dados (SQL)", icon: <Database size={16} className="mr-2"/>, description: "Permite consultar e interagir com bancos de dados SQL (requer fluxo Genkit).", needsConfiguration: true, genkitToolName: "queryDatabase" },
  { id: "codeExecutor", label: "Execução de Código (Python Sandbox)", icon: <Code2 size={16} className="mr-2"/>, description: "Permite executar trechos de código Python em um ambiente seguro (requer fluxo Genkit)." },
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
  { id: "llm", label: "Agente LLM (Ex: LlmAgent, para Decisão e Linguagem)", icon: <Brain size={16} />, description: "Usa Modelos de Linguagem (LLMs) para raciocinar, planejar, gerar respostas e usar ferramentas. A description do agente é usada por outros agentes LLM para decidir se devem delegar tarefas a ele." },
  { id: "workflow", label: "Agente de Fluxo de Trabalho (Ex: SequentialAgent, ParallelAgent)", icon: <Workflow size={16} />, description: "Estes agentes especializados controlam o fluxo de execução de seus subagentes com base em lógica predefinida e determinística, sem consultar um LLM para a orquestração em si." },
  { id: "custom", label: "Agente Personalizado (Ex: CustomAgent, via Genkit Flow)", icon: <FileJson size={16} />, description: "Implemente lógica operacional única e fluxos de controle específicos, estendendo BaseAgent. Tipicamente orquestram outros agentes e gerenciam estado. Requer desenvolvimento de fluxo Genkit customizado (equivalente a implementar _run_async_impl)." },
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
  detailedWorkflowType?: "sequential" | "parallel" | "loop";
  workflowDescription: string;
  loopMaxIterations?: number;
  loopTerminationConditionType?: "none" | "subagent_signal";
  loopExitToolName?: string;
  loopExitStateKey?: string;
  loopExitStateValue?: string;
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
  toolsDetails: Array<{ 
    id: string; 
    label: string; 
    iconName?: keyof typeof iconComponents | 'default'; 
    needsConfiguration?: boolean; 
    genkitToolName?: string; 
  }>;
  toolConfigsApplied?: Record<string, ToolConfigData>;
}

export const iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  Search, Calculator, FileText, CalendarDays, Network, Database, Code2, Default: Cpu, Briefcase, Stethoscope, Plane, Workflow, Brain: Cpu, FileJson, GripVertical, ConfigureIcon
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
      agentGoal: "",
      agentTasks: "",
      agentPersonality: agentToneOptions[0].label,
      agentRestrictions: "",
      agentModel: "googleai/gemini-2.0-flash",
      agentTemperature: 0.7,
    },
  },
  {
    id: "support", name: "Modelo: Agente de Suporte ao Cliente (LLM)",
    config: { agentType: "llm", agentName: "Agente de Suporte ao Cliente", agentDescription: "Agente prestativo para responder perguntas comuns e ajudar com problemas.", agentGoal: "Fornecer suporte rápido e eficiente, esclarecendo dúvidas.", agentTasks: "1. Responder FAQs.\n2. Solucionar problemas básicos.\n3. Direcionar para documentação.\n4. Escalonar para humanos se necessário.", agentPersonality: "Empático e Compreensivo", agentRestrictions: "Nunca fornecer informações financeiras pessoais. Manter tom profissional.", agentModel: "googleai/gemini-1.5-flash-latest", agentTemperature: 0.5, agentVersion: "1.0.0", agentTools: ["knowledgeBase", "webSearch"] },
  },
  {
    id: "recommendation", name: "Modelo: Agente de Recomendações (LLM)",
    config: { agentType: "llm", agentName: "Agente de Recomendações de Produtos", agentDescription: "Ajuda usuários a descobrir produtos/serviços.", agentGoal: "Aumentar engajamento sugerindo itens relevantes.", agentTasks: "1. Perguntar preferências.\n2. Sugerir produtos do catálogo.\n3. Comparar produtos.\n4. Fornecer links/informações.", agentPersonality: "Amigável e Prestativo", agentRestrictions: "Apenas recomendar produtos do catálogo. Não inventar características.", agentModel: "googleai/gemini-1.5-pro-latest", agentTemperature: 0.7, agentVersion: "1.0.0", agentTools: ["knowledgeBase"] },
  },
  {
    id: "writer", name: "Modelo: Assistente de Escrita Criativa (LLM)",
    config: { agentType: "llm", agentName: "Assistente de Escrita Criativa", agentDescription: "Ajuda a gerar ideias e rascunhos de conteúdo original.", agentGoal: "Auxiliar na criação de posts, e-mails, descrições.", agentTasks: "1. Brainstorming de tópicos.\n2. Gerar parágrafos.\n3. Sugerir títulos.\n4. Resumir textos.", agentPersonality: "Criativo e Inspirador", agentRestrictions: "Evitar plágio. Citar fontes externas.", agentModel: "googleai/gemini-1.5-pro-latest", agentTemperature: 0.8, agentVersion: "1.0.0", agentTools: ["webSearch"] },
  },
  {
    id: "grammar_checker", name: "Modelo: Revisor de Gramática e Estilo (LLM)",
    config: { agentType: "llm", agentName: "Revisor de Gramática e Estilo", agentDescription: "Revisa textos, corrige erros e melhora clareza.", agentGoal: "Aprimorar textos, tornando-os corretos e claros.", agentTasks: "1. Corrigir gramática/ortografia.\n2. Sugerir melhorias frasais.\n3. Verificar pontuação.\n4. Feedback sobre tom/estilo.", agentPersonality: "Analítico e Detalhista", agentRestrictions: "Focar na revisão. Não alterar significado. Explicar correções.", agentModel: "googleai/gemini-1.5-flash-latest", agentTemperature: 0.3, agentVersion: "1.0.0", agentTools: [] },
  },
  {
    id: "translator_pt_en", name: "Modelo: Tradutor Simples (Português-Inglês) (LLM)",
    config: { agentType: "llm", agentName: "Tradutor Português-Inglês", agentDescription: "Traduz textos entre português e inglês.", agentGoal: "Fornecer traduções precisas e naturais.", agentTasks: "1. Traduzir PT-EN.\n2. Traduzir EN-PT.\n3. Manter contexto e significado.", agentPersonality: "Conciso e Objetivo", agentRestrictions: "Limitar-se à tradução. Não interpretar. Indicar expressões idiomáticas.", agentModel: "googleai/gemini-1.5-flash-latest", agentTemperature: 0.4, agentVersion: "1.0.0", agentTools: [] },
  },
  {
    id: "legal_analyst_basic", name: "Modelo: Analista Jurídico Básico (LLM)",
    config: { agentType: "llm", agentName: "Analista Jurídico Básico", agentDescription: "Auxilia na compreensão de conceitos legais e pesquisa básica.", agentGoal: "Ajudar a entender conceitos legais, resumir termos, encontrar leis.", agentTasks: "1. Explicar termos legais.\n2. Resumir cláusulas (se fornecidas).\n3. Buscar leis/jurisprudência (com busca web).\n4. NÃO FORNECER ACONSELHAMENTO LEGAL.", agentPersonality: "Profissional e Direto", agentRestrictions: "NÃO FORNECER ACONSELHAMENTO LEGAL. Recomendar advogado. Usar linguagem clara.", agentModel: "googleai/gemini-1.5-flash-latest", agentTemperature: 0.3, agentVersion: "1.0.0", agentTools: ["webSearch", "knowledgeBase"] },
  },
  {
    id: "medical_triage_info", name: "Modelo: Assistente de Triagem Médica Informativo (LLM)",
    config: { agentType: "llm", agentName: "Assistente de Triagem Médica (Informativo)", agentDescription: "Fornece informações gerais sobre sintomas, SEM DIAGNÓSTICO.", agentGoal: "Informar sobre sintomas, direcionar para cuidados, NÃO SUBSTITUI CONSULTA.", agentTasks: "1. Coletar sintomas.\n2. Informar sobre possíveis causas (com busca web).\n3. Sugerir nível de cuidado.\n4. Informar sobre especialistas.", agentPersonality: "Empático e Compreensivo", agentRestrictions: "NÃO FAZER DIAGNÓSTICOS. NÃO SUBSTITUIR CONSULTA MÉDICA. Enfatizar consulta a profissional. Não prescrever.", agentModel: "googleai/gemini-1.5-flash-latest", agentTemperature: 0.5, agentVersion: "1.0.0", agentTools: ["webSearch", "knowledgeBase"] },
  },
  {
    id: "travel_planner_basic", name: "Modelo: Planejador de Viagens Inicial (LLM)",
    config: { agentType: "llm", agentName: "Planejador de Viagens Inicial", agentDescription: "Ajuda a pesquisar destinos, voos, acomodações e sugerir itinerários.", agentGoal: "Ajudar usuários a pesquisar e planejar viagens.", agentTasks: "1. Perguntar preferências (destino, orçamento, datas, interesses).\n2. Pesquisar destinos/atrações (com busca web).\n3. Sugerir voos/hotéis (exemplos).\n4. Esboçar itinerário básico.", agentPersonality: "Amigável e Prestativo", agentRestrictions: "Informar que preços/disponibilidade são exemplos. Não fazer reservas. Focar em sugestões.", agentModel: "googleai/gemini-1.5-flash-latest", agentTemperature: 0.7, agentVersion: "1.0.0", agentTools: ["webSearch", "customApiIntegration"] },
  },
];


export default function AgentBuilderPage() {
  const { toast } = useToast();
  const { savedAgents, setSavedAgents } = useAgents();

  const [isBuilderModalOpen, setIsBuilderModalOpen] = React.useState(false);
  const [editingAgentId, setEditingAgentId] = React.useState<string | null>(null);
  const [currentEditingAgent, setCurrentEditingAgent] = React.useState<SavedAgentConfiguration | null>(null);


  const handleOpenCreateAgentModal = () => {
    setCurrentEditingAgent(null); // Garante que estamos criando um novo
    setEditingAgentId(null);
    setIsBuilderModalOpen(true);
  };

  const handleEditAgent = (agentToEdit: SavedAgentConfiguration) => {
    setCurrentEditingAgent(agentToEdit);
    setEditingAgentId(agentToEdit.id);
    setIsBuilderModalOpen(true);
  };

  const handleSaveAgent = (agentConfig: SavedAgentConfiguration) => {
    if (editingAgentId) {
      setSavedAgents(prevAgents =>
        prevAgents.map(agent =>
          agent.id === editingAgentId ? agentConfig : agent
        )
      );
      toast({ title: "Agente Atualizado!", description: `O agente "${agentConfig.agentName}" foi atualizado.` });
    } else {
      setSavedAgents(prevAgents => [...prevAgents, agentConfig]);
      toast({
        title: "Configuração Salva!",
        description: `O agente "${agentConfig.agentName}" foi adicionado à sua lista.`,
      });
    }
    setEditingAgentId(null);
    setCurrentEditingAgent(null);
    //setIsBuilderModalOpen(false); // O Dialog no AgentBuilderDialog já faz isso via onOpenChange
  };
  
  const handleDeleteAgent = (agentIdToDelete: string) => {
    // Adicionar modal de confirmação aqui seria ideal
    setSavedAgents(prev => prev.filter(agent => agent.id !== agentIdToDelete));
    toast({title: "Agente Excluído", description: "O agente foi removido da lista."});
  }


  return (
    <div className="space-y-8 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Meus Agentes</h1>
        </div>
        <Button onClick={handleOpenCreateAgentModal}>
          Novo Agente
        </Button>
      </header>

      <p className="text-muted-foreground">
        Gerencie seus agentes de IA existentes ou crie novos para automatizar tarefas e otimizar seus fluxos de trabalho.
      </p>

      {savedAgents.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={handleEditAgent}
                onTest={() => toast({ title: "Em breve!", description: "Funcionalidade de teste no chat." })}
                onDelete={handleDeleteAgent} // Adicionar confirmação aqui
                availableTools={availableTools}
                agentTypeOptions={agentTypeOptions}
                iconComponents={iconComponents}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">Nenhum agente criado ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comece clicando no botão acima para configurar seu primeiro agente de IA.
          </p>
          <Button onClick={handleOpenCreateAgentModal} className="mt-6">
            <PlusCircle className="mr-2 h-4 w-4" /> Criar seu primeiro agente
          </Button>
        </div>
      )}

      {/* O AgentBuilderDialog é renderizado aqui, controlado por isBuilderModalOpen */}
      <AgentBuilderDialog
        isOpen={isBuilderModalOpen}
        onOpenChange={(isOpen) => {
          setIsBuilderModalOpen(isOpen);
          if (!isOpen) {
            setEditingAgentId(null);
            setCurrentEditingAgent(null);
          }
        }}
        editingAgent={currentEditingAgent}
        onSave={handleSaveAgent}
        agentTemplates={agentTemplates}
        availableTools={availableTools}
        agentTypeOptions={agentTypeOptions}
        agentToneOptions={agentToneOptions}
        iconComponents={iconComponents}
      />
    </div>
  );
}

    
