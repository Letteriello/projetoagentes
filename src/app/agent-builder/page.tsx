// src/app/agent-builder/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Suspense } from 'react';
import { MdOutlineSpeed } from 'react-icons/md';
import { IoMdRefresh } from 'react-icons/io';
import { TbBuildingStore, TbBarbell } from 'react-icons/tb';
import { RiArrowGoBackFill } from 'react-icons/ri';
import {
  Cpu,
  Plus,
  Layers,
  Info,
  MessageSquareText,
  Edit3,
  Ghost,
  Users,
  Wrench,
  Route,
  Book,
  Search,
  List,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { saveAgentTemplate, getAgentTemplate } from "@/lib/agentServices";
import { useAgents } from "@/contexts/AgentsContext";
import { useAgentStorage } from "@/hooks/use-agent-storage";
import { cn } from "@/lib/utils";
import { AgentCard } from "@/components/features/agent-builder/agent-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import dos tipos
import type { 
  AgentConfig,
  AvailableTool,
  ToolConfigData,
} from '@/types/agent-configs-fixed';
import type { MCPServerConfig, ApiKeyEntry } from '@/types/tool-types';
import type { AgentFormData } from '@/types/agent-types-unified';
import { toAgentFormData, toSavedAgentConfiguration } from '@/lib/agent-type-utils';

// Tipo para agentes adaptados
type AdaptedAgentFormData = AgentFormData;
type AdaptedSavedAgentConfiguration = any;// Componentes dinâmicos
const AgentBuilderDialog = React.lazy(() => import("@/components/features/agent-builder/agent-builder-dialog"));
const ToolConfigModal = React.lazy(() => import("@/components/features/agent-builder/tool-config-modal"));
const HelpModal = React.lazy(() => import("@/components/ui/help-modal"));
const FeedbackModal = React.lazy(() => import("@/components/features/agent-builder/feedback-modal"));
const ConfirmationModal = React.lazy(() => import("@/components/ui/confirmation-modal"));
const TemplateNameModal = React.lazy(() => import("@/components/features/agent-builder/template-name-modal"));
const AgentMetricsView = React.lazy(() => import("@/components/features/agent-metrics/agent-metrics-view"));
const AgentLogsView = React.lazy(() => import("@/components/features/agent-logs/agent-logs-view"));

// Mock data para compilação
const tutorials = [
  {
    id: 'createAgent',
    title: 'Como criar um agente',
    steps: [
      {
        title: 'Passo 1: Clique em Novo Agente',
        content: 'Comece clicando no botão <b>Novo Agente</b> no topo da página.'
      },
      {
        title: 'Passo 2: Configure seu agente',
        content: 'Preencha os campos obrigatórios, como nome e descrição.'
      }
    ]
  }
];

// Mock para ferramentas disponíveis
const builderAvailableTools: AvailableTool[] = [
  {
    id: 'web-search',
    name: 'Pesquisa Web',
    description: 'Permite ao agente buscar informações na internet',
    category: 'knowledge',
    icon: 'search',
    needsApiKey: true
  },
  {
    id: 'code-interpreter',
    name: 'Interpretador de Código',
    description: 'Permite ao agente executar código Python',
    category: 'coding',
    icon: 'code',
    needsMcpServer: true
  }
];

// Mock para servidores MCP
const mockMcpServers: MCPServerConfig[] = [
  {
    id: 'mcp-1',
    name: 'MCP Local',
    description: 'Servidor MCP local para desenvolvimento',
    url: 'http://localhost:3000/api/mcp'
  }
];

// Mock para API Keys
const availableApiKeys: ApiKeyEntry[] = [
  {
    id: 'api-key-1',
    name: 'OpenAI API Key',
    key: '****',
    service: 'openai',
    createdAt: new Date().toISOString()
  }
];// Interface para props do AgentRow
interface AgentRowProps {
  agent: AdaptedSavedAgentConfiguration;
  index: number;
  style: React.CSSProperties;
  onEdit: (agent: AdaptedSavedAgentConfiguration) => void;
  onDelete: (agent: AdaptedSavedAgentConfiguration) => void;
  onDuplicate: (agent: AdaptedSavedAgentConfiguration) => void;
  onSaveTemplate: (agent: AdaptedSavedAgentConfiguration) => void;
}

// Componente principal
export default function AgentBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  // Obter agentes da API/contexto
  const { 
    agents, 
    saveAgent, 
    deleteAgent, 
    duplicateAgent,
    isLoading, 
    error: agentsError 
  } = useAgents();

  // Estados para a UI
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  // Estados para modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeleteAgentOpen, setIsConfirmDeleteAgentOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Estados para dados
  const [editingAgent, setEditingAgent] = useState<AdaptedAgentFormData | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<AdaptedSavedAgentConfiguration | null>(null);
  const [agentToSaveAsTemplate, setAgentToSaveAsTemplate] = useState<AdaptedSavedAgentConfiguration | null>(null);
  const [configuringTool, setConfiguringTool] = useState<AvailableTool | null>(null);
  const [currentSelectedApiKeyId, setCurrentSelectedApiKeyId] = useState<string | undefined>(undefined);
  const [templateName, setTemplateName] = useState("");
  const [selectedAgentForMonitoring, setSelectedAgentForMonitoring] = useState<AdaptedSavedAgentConfiguration | null>(null);
  
  // Estados para tutorial
  const [activeTutorial, setActiveTutorial] = useState<any>(null);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);  // Efeitos
  // Verificar parâmetros de URL para ações específicas
  useEffect(() => {
    // Segurança para evitar erros com searchParams nulo
    if (!searchParams) return;
    
    const action = searchParams.get('action');
    const agentId = searchParams.get('agentId');
    
    if (action === 'create') {
      handleCreateNewAgent();
    } else if (action === 'edit' && agentId) {
      const agent = agents.find(a => a.id === agentId);
      if (agent) handleEditAgent(agent);
    } else if (action === 'duplicate' && agentId) {
      const agent = agents.find(a => a.id === agentId);
      if (agent) handleDuplicateAgent(agent);
    }
  }, [searchParams, agents]);

  // Efeito para abrir tutorial se for solicitado
  useEffect(() => {
    if (searchParams?.get('tutorial')) {
      const tutorialId = searchParams.get('tutorial');
      handleOpenTutorial(tutorialId || 'createAgent');
    }
  }, [searchParams]);

  // Handlers para eventos de UI
  // Criar novo agente
  const handleCreateNewAgent = () => {
    const defaultAgentData: AdaptedAgentFormData = {
      agentName: "Novo Agente",
      description: "",
      type: "llm",
      tools: [],
      toolConfigsApplied: {},
    };
    
    setEditingAgent(defaultAgentData);
    setIsCreateModalOpen(true);
  };

  // Editar agente existente
  const handleEditAgent = (agent: AdaptedSavedAgentConfiguration) => {
    // Converter para formato de formulário
    const formData = toAgentFormData(agent);
    setEditingAgent(formData);
    setIsEditModalOpen(true);
  };

  // Handler para salvar o agente após edição/criação
  const handleSaveAgent = async (formData: AdaptedAgentFormData) => {
    try {
      // Converter formulário para formato de agente salvo
      const agentToSave = toSavedAgentConfiguration(formData);
      
      // Salvar agente (criar ou atualizar)
      const savedAgent = await saveAgent(agentToSave);
      
      toast({
        title: formData.id ? "Agente Atualizado" : "Agente Criado",
        description: `${formData.agentName} foi ${formData.id ? 'atualizado' : 'criado'} com sucesso!`,
        variant: "default",
      });
      
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setEditingAgent(null);
      
      return savedAgent;
    } catch (error) {
      console.error("Erro ao salvar agente:", error);
      
      toast({
        title: "Erro ao Salvar",
        description: "Ocorreu um erro ao tentar salvar o agente.",
        variant: "destructive",
      });
      
      return null;
    }
  };  // Duplicar agente
  const handleDuplicateAgent = async (agent: AdaptedSavedAgentConfiguration) => {
    try {
      const duplicatedAgent = await duplicateAgent(agent.id);
      
      toast({
        title: "Agente Duplicado",
        description: `Uma cópia de ${agent.agentName} foi criada com sucesso!`,
        variant: "default",
      });
      
      return duplicatedAgent;
    } catch (error) {
      console.error("Erro ao duplicar agente:", error);
      
      toast({
        title: "Erro ao Duplicar",
        description: "Ocorreu um erro ao tentar duplicar o agente.",
        variant: "destructive",
      });
      
      return null;
    }
  };

  // Iniciar processo de exclusão (mostrar confirmação)
  const handleDeleteAgent = (agent: AdaptedSavedAgentConfiguration) => {
    setAgentToDelete(agent);
    setIsConfirmDeleteAgentOpen(true);
  };

  // Confirmar exclusão
  const handleDeleteConfirm = async () => {
    if (!agentToDelete) return;
    
    try {
      await deleteAgent(agentToDelete.id);
      
      toast({
        title: "Agente Excluído",
        description: `${agentToDelete.agentName} foi excluído com sucesso.`,
        variant: "default",
      });
      
      setAgentToDelete(null);
      setIsConfirmDeleteAgentOpen(false);
    } catch (error) {
      console.error("Erro ao excluir agente:", error);
      
      toast({
        title: "Erro ao Excluir",
        description: "Ocorreu um erro ao tentar excluir o agente.",
        variant: "destructive",
      });
    }
  };

  // Iniciar processo de salvar como template
  const handleSaveAsTemplate = (agent: AdaptedSavedAgentConfiguration) => {
    setAgentToSaveAsTemplate(agent);
    setTemplateName(`${agent.agentName} Template`);
    setIsSaveTemplateModalOpen(true);
  };  // Salvar template
  const handleSaveTemplate = async () => {
    if (!agentToSaveAsTemplate || !templateName) return;
    
    try {
      const template = {
        ...agentToSaveAsTemplate,
        id: uuidv4(), // Novo ID para o template
        agentName: templateName,
        isTemplate: true
      };
      
      await saveAgentTemplate(template);
      
      toast({
        title: "Template Salvo",
        description: `O template "${templateName}" foi criado com sucesso.`,
        variant: "default",
      });
      
      setIsSaveTemplateModalOpen(false);
      setAgentToSaveAsTemplate(null);
      setTemplateName("");
    } catch (error) {
      console.error("Erro ao salvar template:", error);
      
      toast({
        title: "Erro ao Salvar Template",
        description: "Ocorreu um erro ao tentar salvar o template.",
        variant: "destructive",
      });
    }
  };

  // Handlers para ferramentas
  const handleConfigureTool = (tool: AvailableTool) => {
    setConfiguringTool(tool);
    const currentToolConfig = editingAgent?.toolConfigsApplied?.[tool.id];
    setCurrentSelectedApiKeyId(currentToolConfig?.selectedApiKeyId);
    setIsToolConfigModalOpen(true);
  };

  const handleSaveToolConfig = (toolId: string, configData: ToolConfigData) => {
    setEditingAgent((prevAgent) => {
      if (!prevAgent) return null;
      
      const updatedToolConfigsApplied = {
        ...(prevAgent.toolConfigsApplied || {}),
        [toolId]: configData
      };
      
      return {
        ...prevAgent,
        toolConfigsApplied: updatedToolConfigsApplied,
      };
    });
    
    setIsToolConfigModalOpen(false);
    setConfiguringTool(null);
    
    toast({ 
      title: "Configuração da Ferramenta Salva", 
      description: `Configuração para ${toolId} atualizada.`
    });
  };  // Handlers para tutorial
  const handleOpenTutorial = (tutorialId: string | null) => {
    const tutorial = tutorials.find(t => t.id === tutorialId);
    if (tutorial) {
      setActiveTutorial(tutorial);
      setCurrentTutorialStep(0);
      setIsTutorialModalOpen(true);
    }
  };

  const handleTutorialNext = () => {
    if (activeTutorial && currentTutorialStep < activeTutorial.steps.length - 1) {
      setCurrentTutorialStep(prev => prev + 1);
    } else {
      // Fechar tutorial se estiver no último passo
      closeTutorialModal();
    }
  };

  const handleTutorialPrev = () => {
    if (currentTutorialStep > 0) {
      setCurrentTutorialStep(prev => prev - 1);
    }
  };

  const closeTutorialModal = () => {
    setIsTutorialModalOpen(false);
    setActiveTutorial(null);
    setCurrentTutorialStep(0);
  };

  // Handler para selecionar agente para monitoramento
  const handleSelectAgentForMonitoring = (agent: AdaptedSavedAgentConfiguration) => {
    setSelectedAgentForMonitoring(prev => 
      prev?.id === agent.id ? null : agent
    );
  };

  // Filtragem de agentes com base na pesquisa
  const filteredAgents = agents.filter(agent => 
    agent.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.description && agent.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Cálculo de estatísticas
  const totalAgents = agents.length;
  const agentsWithTools = agents.filter(agent => 
    agent.config.tools && agent.config.tools.length > 0
  ).length;  // Renderização conditional com base no estado de carregamento
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando agentes...</div>;
  }

  // Mostrar mensagem de erro caso exista
  if (agentsError) {
    const errorMessage = typeof agentsError === 'string' ? agentsError : 'Erro desconhecido ao carregar agentes';
    return <div className="flex items-center justify-center h-screen text-red-500">Erro ao carregar agentes: {errorMessage}</div>;
  }

  // Componente de renderização para cada linha/card de agente
  const RenderAgentRow = ({ agent, index, style }: AgentRowProps) => {
    return (
      <div style={style} className="px-1 py-2">
        <AgentCard
          agent={agent}
          onEdit={() => handleEditAgent(agent)}
          onDelete={() => handleDeleteAgent(agent)}
          onDuplicate={() => handleDuplicateAgent(agent)}
          onSaveTemplate={() => handleSaveAsTemplate(agent)}
          onSelectForMonitoring={() => handleSelectAgentForMonitoring(agent)}
          isSelectedForMonitoring={selectedAgentForMonitoring?.id === agent.id}
        />
      </div>
    );
  };  // Renderização do componente principal
  return (
    <>
      <div className="container py-4 space-y-4 max-w-7xl">
        {/* Header com título e ações */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-2 md:items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Construtor de Agentes IA
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
              Crie, configure e gerencie seus agentes de inteligência artificial.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => handleOpenTutorial('createAgent')} variant="outline">
              <Book className="mr-2" /> Tutorial
            </Button>
            <Button onClick={() => setIsFeedbackModalOpen(true)} variant="outline">
              <MessageSquareText className="mr-2" /> Feedback
            </Button>
            <Button onClick={handleCreateNewAgent} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2" /> Novo Agente
            </Button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Agentes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAgents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agentes com Ferramentas</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agentsWithTools}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controles de exibição e busca */}
        <div className="flex justify-between items-center mb-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={viewMode === 'list' ? "default" : "outline"} 
                  size="icon" 
                  onClick={() => setViewMode('list')}
                  className="mr-2"
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Visualizar em Lista</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={viewMode === 'grid' ? "default" : "outline"} 
                  size="icon" 
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Visualizar em Grade</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="relative w-full max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <Input
              type="search"
              placeholder="Pesquisar agentes..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>        {/* Exibição condicional: Monitoramento de Agente ou Lista de Agentes */}
        {selectedAgentForMonitoring ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Monitorando: {selectedAgentForMonitoring.agentName}</h2>
              <Button variant="outline" onClick={() => setSelectedAgentForMonitoring(null)} className="mb-4">
                <RiArrowGoBackFill className="mr-2" /> Voltar para lista
              </Button>
              {selectedAgentForMonitoring && (
                <Suspense fallback={<div>Carregando métricas...</div>}>
                  <AgentMetricsView name="Métricas" agentId={selectedAgentForMonitoring.id} />
                </Suspense>
              )}
            </div>
            <Suspense fallback={<div>Carregando logs...</div>}>
              <AgentLogsView name="Logs" agentId={selectedAgentForMonitoring.id} />
            </Suspense>
          </div>
        ) : (
          filteredAgents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Ghost className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-2xl font-bold">Nenhum agente encontrado</h3>
              <p className="text-gray-500 mt-2 max-w-md">
                {agents.length === 0 
                  ? "Você ainda não tem nenhum agente. Clique em 'Novo Agente' para criar seu primeiro agente IA."
                  : "Nenhum agente corresponde à sua pesquisa. Tente outro termo ou limpe a pesquisa."}
              </p>
              {agents.length === 0 && (
                <Button onClick={handleCreateNewAgent} className="mt-4">
                  <Plus className="mr-2" /> Criar Agente
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((agent, index) => (
                <RenderAgentRow
                  key={agent.id}
                  agent={agent}
                  index={index}
                  style={{}}
                  onEdit={handleEditAgent}
                  onDelete={handleDeleteAgent}
                  onDuplicate={handleDuplicateAgent}
                  onSaveTemplate={handleSaveAsTemplate}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAgents.map((agent, index) => (
                <RenderAgentRow
                  key={agent.id}
                  agent={agent}
                  index={index}
                  style={{}}
                  onEdit={handleEditAgent}
                  onDelete={handleDeleteAgent}
                  onDuplicate={handleDuplicateAgent}
                  onSaveTemplate={handleSaveAsTemplate}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Modais - Carregamento lazy com Suspense */}
      <Suspense fallback={<div>Carregando...</div>}>
        {/* Modal de Criação/Edição */}
        {isCreateModalOpen && editingAgent && (
          <AgentBuilderDialog
            name="Criar Agente"
            isOpen={isCreateModalOpen}
            onOpenChange={setIsCreateModalOpen}
            initialData={editingAgent}
            onSave={handleSaveAgent}
            availableTools={builderAvailableTools}
            onConfigureTool={handleConfigureTool}
          />
        )}
        
        {isEditModalOpen && editingAgent && (
          <AgentBuilderDialog
            name="Editar Agente"
            isOpen={isEditModalOpen}
            onOpenChange={setIsEditModalOpen}
            initialData={editingAgent}
            onSave={handleSaveAgent}
            availableTools={builderAvailableTools}
            onConfigureTool={handleConfigureTool}
          />
        )}
        
        {/* Modais adicionais */}
        {isSaveTemplateModalOpen && agentToSaveAsTemplate && (
          <TemplateNameModal
            name="Salvar como Template"
            isOpen={isSaveTemplateModalOpen}
            onOpenChange={setIsSaveTemplateModalOpen}
            templateName={templateName}
            onTemplateNameChange={setTemplateName}
            onSave={handleSaveTemplate}
          />
        )}

        {agentToDelete && (
          <ConfirmationModal
            name="Confirmação"
            isOpen={isConfirmDeleteAgentOpen}
            onOpenChange={(isOpen) => {
              setIsConfirmDeleteAgentOpen(isOpen);
              if (!isOpen) setAgentToDelete(null);
            }}
            title="Confirmar Exclusão"
            description={`Tem certeza que deseja excluir o agente "${agentToDelete.agentName}"? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            cancelText="Cancelar"
            onAction={handleDeleteConfirm}
          />
        )}
        
        {isToolConfigModalOpen && configuringTool && editingAgent && (
          <ToolConfigModal
            name="Configuração de Ferramentas"
            isOpen={isToolConfigModalOpen}
            onOpenChange={setIsToolConfigModalOpen}
            configuringTool={configuringTool}
            onSave={handleSaveToolConfig}
            availableApiKeys={availableApiKeys || []}
            mcpServers={mockMcpServers}
            selectedApiKeyId={currentSelectedApiKeyId}
          />
        )}
        
        {isTutorialModalOpen && (
          <HelpModal
            name="Ajuda"
            onClose={closeTutorialModal}
            title={activeTutorial?.steps?.[currentTutorialStep]?.title || 'Tutorial'}
            isTutorial={true}
            currentStep={currentTutorialStep}
            totalSteps={activeTutorial?.steps?.length || 0}
            onNextStep={handleTutorialNext}
            onPrevStep={handleTutorialPrev}
            size="lg"
          >
            <div dangerouslySetInnerHTML={{ __html: (activeTutorial?.steps?.[currentTutorialStep]?.content as string) || '' }} />
          </HelpModal>
        )}

        {isFeedbackModalOpen && (
          <FeedbackModal
            name="Feedback"
            isOpen={isFeedbackModalOpen}
            onOpenChange={setIsFeedbackModalOpen}
          />
        )}
      </Suspense>
    </>
  );
}