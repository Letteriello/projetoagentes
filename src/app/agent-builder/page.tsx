// src/app/agent-builder/page.tsx
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
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
  List,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import EmptyState from '@/components/shared/EmptyState'; // Import EmptyState
import { useToast } from "@/hooks/use-toast";
import { saveAgentTemplate, getAgentTemplate } from "@/lib/agentServices";
import { useAgents } from "@/contexts/AgentsContext";
import { useAgentStorage } from "@/hooks/use-agent-storage";
import { cn } from "@/lib/utils";
import { FixedSizeList } from 'react-window'; // Import FixedSizeList
import { AgentCard } from "@/components/features/agent-builder/agent-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { 
  SavedAgentConfiguration,
  AgentConfig,
  AvailableTool,
  AgentType,
  ToolConfigData,
  KnowledgeSource,
  KnowledgeSourceType
} from '@/types/agent-configs-fixed';

// Importando os tipos necessários e funções de conversão
import type { AgentFormData } from '@/types/agent-types-unified';
import type { SavedAgentConfiguration as NewSavedAgentConfiguration } from '@/types/agent-configs-new';
import { toAgentFormData, toSavedAgentConfiguration } from '@/lib/agent-type-utils';

// Criando um tipo adaptador para resolver incompatibilidades
type AdaptedAgentFormData = any;
type AdaptedSavedAgentConfiguration = SavedAgentConfiguration;

// Usando o tipo AgentFormData do arquivo unificado

// Importando corretamente do arquivo agentBuilderConfig
import { 
  builderAvailableTools as defaultAvailableTools,
  iconComponents 
} from "@/data/agentBuilderConfig";

// Definindo tipos locais para os componentes dinâmicos
type DynamicComponent = {
  default: React.ComponentType<any>;
};

// Criando wrappers para os componentes dinâmicos para garantir a tipagem correta
const withDefaultExport = <T extends object>(
  component: T
): T & { default: React.ComponentType<any> } => {
  return {
    ...component,
    default: (component as any).default || (() => null)
  } as any;
};

// Definindo agentTypeOptions localmente
const agentTypeOptions = [
  { id: 'llm', label: 'LLM Agent', description: 'Agente baseado em modelo de linguagem' },
  { id: 'workflow', label: 'Workflow Agent', description: 'Agente baseado em fluxo de trabalho' },
  { id: 'custom', label: 'Custom Agent', description: 'Agente personalizado' },
  { id: 'a2a', label: 'A2A Agent', description: 'Agente de aplicativo para aplicativo' }
];

// Definindo agentToneOptions localmente já que não está mais disponível no agentBuilderConfig
export const agentToneOptions = [
  { id: 'professional', label: 'Profissional' },
  { id: 'friendly', label: 'Amigável' },
  { id: 'casual', label: 'Casual' },
  { id: 'formal', label: 'Formal' },
  { id: 'technical', label: 'Técnico' },
];

// Importações de componentes com formas alternativas para garantir compatibilidade
// com as várias formas que os componentes podem estar exportados

// AgentBuilderDialog
const AgentBuilderDialog = React.lazy(() => 
  import('@/components/features/agent-builder/agent-builder-dialog').then(module => ({
    default: module.default || module.AgentBuilderDialog
  }))
);

// SaveAsTemplateDialog
const SaveAsTemplateDialog = React.lazy(() => 
  import('@/components/features/agent-builder/save-as-template-dialog').then(module => ({
    default: module.default || module.SaveAsTemplateDialog
  }))
);

// AgentCreatorForm - corrigido para o nome de arquivo que realmente existe
const AgentCreatorForm = React.lazy(() => 
  import('@/components/features/agent-builder/agent-creator-form').then(module => ({
    default: module.AgentCreatorForm || module.default
  }))
);

// AgentCreatorChatUI
const AgentCreatorChatUI = React.lazy(() =>
  import('@/components/features/agent-builder/agent-creator-chat-ui').then(module => ({
    default: module.AgentCreatorChatUI || module.default
  }))
);

// FeedbackModal
const FeedbackModal = React.lazy(() => 
  import('@/components/features/agent-builder/feedback-modal').then(module => ({
    default: module.default || module.FeedbackModal
  }))
);

// HelpModal
const HelpModal = React.lazy(() => 
  import('@/components/ui/help-modal').then(module => ({
    default: module.HelpModal || module.default
  }))
);

// AgentTemplatesGallery
const AgentTemplatesGallery = React.lazy(() => 
  import('@/components/features/agent-builder/agent-templates-gallery').then(module => ({
    default: module.AgentTemplatesGallery || module.default
  }))
);

// ConfirmationModal
const ConfirmationModal = React.lazy(() => 
  import('@/components/ui/confirmation-modal').then(module => ({
    default: module.ConfirmationModal || module.default
  }))
);

// AgentLogView
const AgentLogView = React.lazy(() => 
  import('@/components/features/agent-builder/agent-log-view').then(module => ({
    default: module.AgentLogView || module.default
  }))
);

// AgentMetricsView
const AgentMetricsView = React.lazy(() => 
  import('@/components/features/agent-builder/agent-metrics-view').then(module => ({
    default: module.AgentMetricsView || module.default
  }))
);

const AGENT_CARD_LIST_ITEM_SIZE = 210; // Approximate height of an agent card + padding

interface AgentBuilderPageProps {
  searchParams: {
    agentId?: string;  // Permitir opções de filtragem nas URLs através de parâmetros
    tab?: string;
    create?: string; // 'true' para abrir o modal de criação
    edit?: string;   // ID do agente para editar
    monitor?: string; // ID do agente para monitorar
  };
}

export default function AgentBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const {
    savedAgents: agents, 
    addAgent, 
    updateAgent, 
    deleteAgent, 
    isLoadingAgents: isLoading,
    fetchAgents: refreshAgents 
  } = useAgents();
  
  // Usamos uma variável para o erro, já que a propriedade pode não existir no contexto
  const agentsError = null;
  
  // Utilizando hooks de armazenamento de agentes
  const {
    saveAgent: saveAgentConfig,
    loadAgents: loadAgentConfigs,
    deleteAgent: deleteAgentConfig,
  } = useAgentStorage();

  const [isBuilderModalOpen, setIsBuilderModalOpen] = React.useState(false);
  const [editingAgent, setEditingAgent] = React.useState<any>(null);
  const [isConfirmDeleteAgentOpen, setIsConfirmDeleteAgentOpen] = React.useState(false);
  const [agentToDelete, setAgentToDelete] = React.useState<SavedAgentConfiguration | null>(null);
  const [isSaveAsTemplateModalOpen, setIsSaveAsTemplateModalOpen] = React.useState(false);
  const [agentToSaveAsTemplate, setAgentToSaveAsTemplate] = React.useState<SavedAgentConfiguration | null>(null);
  const [buildMode, setBuildMode] = React.useState<'form' | 'chat'>('form'); // Controla o modo de edição
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  // Tutorial State
  const [isTutorialModalOpen, setIsTutorialModalOpen] = React.useState(false);
  const [activeTutorial, setActiveTutorial] = React.useState(tutorials.createAgent); // Default tutorial
  const [currentTutorialStep, setCurrentTutorialStep] = React.useState(0);

  // Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false);

  // Estado para o monitoramento de agentes
  const [selectedAgentForMonitoring, setSelectedAgentForMonitoring] = React.useState<SavedAgentConfiguration | null>(null);

  const handleCreateNewAgent = React.useCallback(() => {
    // Function to handle creating a new agent - opens the builder modal with empty form
  const handleCreateNewAgent = React.useCallback(() => {
    const defaultAgent = {
      agentName: "",
      agentDescription: "",
      agentVersion: "1.0",
      config: {
        type: "llm",
        models: ["gpt-3.5-turbo"],
        systemPrompt: "",
      },
      tools: [],
      toolsDetails: [],
      agentType: "support",
      agentTone: "friendly",
      agentIcon: "🤖",
      agentAvatarUrl: "",
      // Other default values for a new agent
    };
    setEditingAgent(defaultAgent as any);
    setBuildMode('form');
    setIsBuilderModalOpen(true);
  }, []);

  React.useEffect(() => {
    // Parâmetro 'create' para criar um novo agente
    if (searchParams.get('create') === 'true') {
      handleCreateNewAgent();
    }

    // Parâmetro 'edit' com ID para editar um agente
    const editId = searchParams.get('edit');
    if (editId) {
      const agentToEdit = agents.find(a => a.id === editId);
      if (agentToEdit) {
        handleEditAgent(agentToEdit);
      }
    }

    // Parâmetro 'monitor' com ID para monitorar um agente
    const monitorId = searchParams.get('monitor');
    if (monitorId) {
      const agentToMonitor = agents.find(a => a.id === monitorId);
      if (agentToMonitor) {
        setSelectedAgentForMonitoring(agentToMonitor);
      }
    }
  }, [searchParams, agents, handleCreateNewAgent]);

  // Este useEffect já estava sendo implementado acima, então removemos a duplicação

  // Adapta um SavedAgentConfiguration para o formulário
  const handleEditAgent = (agent: SavedAgentConfiguration) => {
    try {
      // Converter para AgentFormData antes de passar para edição
      const agentFormData = toAgentFormData(agent);
      // Usamos casting para evitar incompatibilidade de tipos entre módulos
      setEditingAgent(agentFormData as unknown as AdaptedAgentFormData);
      setBuildMode('form');
      setIsBuilderModalOpen(true);
    } catch (error) {
      console.error('Erro ao editar agente:', error);
      toast({
        title: 'Erro ao editar agente',
        description: 'Ocorreu um erro ao preparar o agente para edição',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAgent = (agent: SavedAgentConfiguration) => {
    setAgentToDelete(agent);
    setIsConfirmDeleteAgentOpen(true);
  };

  const onConfirmDeleteAgent = async () => {
    if (agentToDelete) {
      try {
        await deleteAgent(agentToDelete.id);
        toast({
          title: "Agente Excluído",
          description: `O agente "${agentToDelete.agentName}" foi excluído com sucesso.`,
          variant: "success",
        });
        setAgentToDelete(null);
        setIsConfirmDeleteAgentOpen(false);
        if (selectedAgentForMonitoring?.id === agentToDelete.id) {
          setSelectedAgentForMonitoring(null);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Erro ao excluir o agente "${agentToDelete.agentName}":`, error);
        toast({
          title: "Erro ao Excluir Agente",
          description: errorMessage || "Ocorreu um erro desconhecido.",
          variant: "destructive"
        });
      }
    }
  };

  const [isSaving, setIsSaving] = React.useState(false);
  
  const handleFormSubmit = (data: AdaptedAgentFormData) => {
    try {
      // Check if this is an edit (if agent has an ID) or a new addition
      if (editingAgent?.id) {
        // Preserve the ID during edit
        const updatedAgent = { ...data, id: editingAgent.id };
        const finalConfig = toSavedAgentConfiguration(updatedAgent) as SavedAgentConfiguration;
        
        updateAgent(finalConfig);
        toast({
          title: "Agente Atualizado",
          description: `O agente "${data.agentName}" foi atualizado com sucesso.`,
          variant: "default",
        });
      } else {
        // Create a new agent with a UUID
        const newAgentWithId = { ...data, id: uuidv4() };
        const finalConfig = toSavedAgentConfiguration(newAgentWithId) as SavedAgentConfiguration;
        
        addAgent(finalConfig);
        toast({
          title: "Agente Criado",
          description: `O agente "${data.agentName}" foi criado com sucesso.`,
          variant: "default",
        });
      }

      // Close the modal and reset form
      setIsBuilderModalOpen(false);
      setEditingAgent(null);
    } catch (error) {
      console.error("Erro ao processar o formulário:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o agente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAsTemplate = (agent: SavedAgentConfiguration) => {
    try {
      setAgentToSaveAsTemplate(agent);
      setIsSaveAsTemplateModalOpen(true);
    } catch (error) {
      console.error("Erro ao preparar template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível preparar o agente para salvar como template.",
        variant: "destructive",
      });
    }
  };

  // Função auxiliar para lidar com erros de forma consistente
  const handleError = (error: unknown, defaultMessage: string) => {
    console.error(defaultMessage, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    toast({
      title: 'Erro',
      description: defaultMessage + (errorMessage ? `: ${errorMessage}` : ''),
      variant: 'destructive',
    });
  };

  const onConfirmSaveAsTemplate = async (templateName: string) => {
    if (agentToSaveAsTemplate) {
      try {
        await saveAgentTemplate(agentToSaveAsTemplate, templateName);
        toast({
          title: "Template Salvo",
          description: `O agente "${agentToSaveAsTemplate.agentName}" foi salvo como template "${templateName}"`,
          variant: "default"
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error("Error saving agent as template:", error);
        toast({
          title: "Erro ao Salvar Template",
          description: errorMessage || "Ocorreu um erro desconhecido ao salvar o template.",
          variant: "destructive"
        });
      }
      setIsSaveAsTemplateModalOpen(false);
      setAgentToSaveAsTemplate(null);
    }
  };

  const handleSelectAgentForMonitoring = (agent: SavedAgentConfiguration) => {
    setSelectedAgentForMonitoring(agent);
    // Navega para a URL com o parâmetro monitor para mostrar logs/métricas
    router.push(`/agent-builder?monitor=${agent.id}`, { scroll: false });
  };

  const handleOpenTutorial = (tutorialId: keyof typeof tutorials) => {
    setActiveTutorial(tutorials[tutorialId]);
    setCurrentTutorialStep(0);
    setIsTutorialModalOpen(true);
  };

  const closeTutorialModal = () => setIsTutorialModalOpen(false);
  const handleTutorialNext = () => setCurrentTutorialStep(prev => Math.min(prev + 1, activeTutorial.steps.length - 1));
  const handleTutorialPrev = () => setCurrentTutorialStep(prev => Math.max(prev - 1, 0));

  const totalAgents = agents.length;
  const agentsWithTools = agents.filter(agent => agent.tools && agent.tools.length > 0).length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando agentes...</div>;
  }

  // Mostrar mensagem de erro caso exista
  if (agentsError) {
    const errorMessage = typeof agentsError === 'string' ? agentsError : 'Erro desconhecido ao carregar agentes';
    return <div className="flex items-center justify-center h-screen text-red-500">Erro ao carregar agentes: {errorMessage}</div>;
  }

  const AgentRow = ({ index, style }: AgentRowProps) => {
    const agent = agents[index];
    if (!agent) return null;
    return (
      <div style={style} className="px-1 py-2">
        <AgentCard
          agent={agent}
          onEdit={() => handleEditAgent(agent)}
          onDelete={() => handleDeleteAgent(agent)} // Passa o agente para a função
          onSaveAsTemplate={() => handleSaveAsTemplate(agent)}
          onSelectForMonitoring={() => handleSelectAgentForMonitoring(agent)}
          isSelectedForMonitoring={selectedAgentForMonitoring?.id === agent.id}
        />
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Construtor de Agentes IA
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
              Crie, configure e gerencie seus agentes de inteligência artificial.
            </p>
          </div>
          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            <Button onClick={() => handleOpenTutorial('createAgent')} variant="outline">
              <Info className="mr-2" /> Tutorial
            </Button>
            <Button onClick={() => setIsFeedbackModalOpen(true)} variant="outline">
              <MessageSquareText className="mr-2" /> Feedback
            </Button>
            <Button onClick={handleCreateNewAgent} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2" /> Novo Agente
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Agentes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAgents}</div>
              <p className="text-xs text-muted-foreground">
                {/* +20.1% from last month (example) */}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agentes com Ferramentas</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agentsWithTools}</div>
              <p className="text-xs text-muted-foreground">
                {/* +180.1% from last month (example) */}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end items-center mb-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={viewMode === 'list' ? "secondary" : "outline"} 
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
                  variant={viewMode === 'grid' ? "secondary" : "outline"} 
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
        </div>
      </header>

      {selectedAgentForMonitoring ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Monitorando: {selectedAgentForMonitoring.agentName}</h2>
            <Button onClick={() => setSelectedAgentForMonitoring(null)} variant="outline" className="mb-4">
              Voltar para Lista de Agentes
            </Button>
            {selectedAgentForMonitoring && (
              <Suspense fallback={<div>Carregando métricas...</div>}>
                <AgentMetricsView agentId={selectedAgentForMonitoring.id} />
              </Suspense>
            )}
          </div>
          <Suspense fallback={<div>Carregando logs...</div>}>
            <AgentLogView agentId={selectedAgentForMonitoring.id} />
          </Suspense>
        </div>
      ) : (
        agents.length === 0 ? (
          <EmptyState
            icon={<Ghost className="mx-auto h-12 w-12 text-gray-400" />}
            title="Nenhum agente encontrado"
            description="Comece criando um novo agente para vê-lo aqui."
            actionButton={{
              text: "Criar Primeiro Agente",
              onClick: handleCreateNewAgent,
              icon: <Plus className="mr-2 h-4 w-4" />, // lucide-react icons usually take size via className
              className: "bg-blue-600 hover:bg-blue-700", // Or use variant="default" if style matches
            }}
            className="py-12" // Keep original padding
          />
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={() => handleEditAgent(agent)}
                  onDelete={() => handleDeleteAgent(agent)} // Passa o agente para a função
                  onSaveAsTemplate={() => handleSaveAsTemplate(agent)}
                  onSelectForMonitoring={() => handleSelectAgentForMonitoring(agent)}
                  isSelectedForMonitoring={selectedAgentForMonitoring?.id === agent.id}
                />
              ))}
            </div>
          ) : (
            // List View using react-window
            <div className="border rounded-md overflow-hidden">
              <FixedSizeList
                height={Math.min(600, agents.length * 180)} // Altura de cada item de lista (180px)
                itemCount={agents.length}
                itemSize={180} // Tamanho fixo para cada agente na lista
                width="100%"
              >
                {AgentRow}
              </FixedSizeList>
            </div>
          )
        )
      )}

      <Suspense fallback={<div>Carregando...</div>}>
        {isBuilderModalOpen && (
          buildMode === 'form' ? (
            <AgentBuilderDialog
              isOpen={isBuilderModalOpen}
              onClose={() => {
                setIsBuilderModalOpen(false);
                setEditingAgent(null);
                router.push('/agent-builder'); // Clear URL parameters
              }}
              onSave={handleFormSubmit}
              agent={editingAgent as any}
              availableTools={builderAvailableTools}
              agentToneOptions={agentToneOptions.map(option => option.id)}
              agentTypeOptions={agentTypeOptions.map(option => option.id)}
              iconComponents={iconComponents}
            />
          ) : (
            <AgentCreatorChatUI
              isOpen={isBuilderModalOpen} // This might need to be a different state if chat UI is a separate modal
              onClose={() => {
                setIsBuilderModalOpen(false);
                setEditingAgent(null);
                router.push('/agent-builder'); // Clear URL parameters
              }}
              onSave={handleFormSubmit}
              agent={editingAgent as any}
            />  
          )
        )}

        {isSaveAsTemplateModalOpen && (
          <SaveAsTemplateDialog
            isOpen={isSaveAsTemplateModalOpen}
            onSave={(templateName) => onConfirmSaveAsTemplate(templateName)}
            agentName={agentToSaveAsTemplate?.agentName || ''}
            onClose={() => setIsSaveAsTemplateModalOpen(false)}
          />
        )}

        {isTutorialModalOpen && (
          <HelpModal
            isOpen={isTutorialModalOpen}
            onClose={closeTutorialModal}
            title={activeTutorial.steps[currentTutorialStep].title}
            isTutorial={true}
            currentStep={currentTutorialStep}
            totalSteps={activeTutorial.steps.length}
            onNextStep={handleTutorialNext}
            onPrevStep={handleTutorialPrev}
            size="lg"
          >
            <div dangerouslySetInnerHTML={{ __html: activeTutorial.steps[currentTutorialStep].content as string }} />
          </HelpModal>
        )}
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onOpenChange={setIsFeedbackModalOpen}
        />

        {agentToDelete && (
          <ConfirmationModal
            isOpen={isConfirmDeleteAgentOpen}
            onOpenChange={(isOpen) => {
              setIsConfirmDeleteAgentOpen(isOpen);
              if (!isOpen) {
                setAgentToDelete(null);
              }
            }}
            title="Confirmar Exclusão de Agente"
            description={`Tem certeza que deseja excluir o agente "${agentToDelete?.agentName}"? Esta ação não pode ser desfeita.`}
            onConfirm={onConfirmDeleteAgent}
            confirmButtonVariant="destructive"
            confirmText="Excluir Agente"
          />
        )}
      </Suspense>
    </div>
  );
}

// AgentRow para listagem virtual
interface AgentRowProps {
  index: number;
  style: React.CSSProperties;
}

// Constante para o tamanho dos itens da lista
const AGENT_CARD_LIST_ITEM_SIZE = 200; // Altura em pixels para cada card na visualização em lista
