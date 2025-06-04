// src/app/agent-builder/page.tsx
"use client";

import * as React from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Cpu,
  Plus,
  Layers,
  Info,
  MessageSquareText,
  Edit3,
  Ghost, // Added Ghost icon
  Users, // For Total Agents
  Wrench, // For Agents with Tools (alternative: PuzzlePiece)
  Route, // For Root Agents (alternative: Network, GitFork)
  List, // Icon for List view
  LayoutGrid, // Icon for Grid view
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveAgentTemplate, getAgentTemplate } from "@/lib/agentServices";
import { useAgents } from "@/contexts/AgentsContext";
import { useAgentStorage } from "@/hooks/use-agent-storage"; // Import useAgentStorage
import { cn } from "@/lib/utils";
import { FixedSizeList } from 'react-window'; // Import FixedSizeList
import { AgentCard } from "@/components/features/agent-builder/agent-card";
import AgentBuilderDialog from "@/components/features/agent-builder/agent-builder-dialog";
import SaveAsTemplateDialog from "@/components/features/agent-builder/save-as-template-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  SavedAgentConfiguration,
  AvailableTool
} from '@/types/agent-types';

import {
  availableTools as defaultAvailableTools,
  agentToneOptions,
  agentTypeOptions,
  iconComponents
} from "@/data/agentBuilderConfig";
import { AgentCreatorChatUI } from "@/components/features/agent-builder/agent-creator-chat-ui";
import { AgentLogView } from "@/components/features/agent-builder/AgentLogView";
import { AgentMetricsView } from "@/components/features/agent-builder/AgentMetricsView";
import { v4 as uuidv4 } from 'uuid';
import { HelpModal } from '@/components/ui/help-modal';
import { FeedbackModal } from '@/components/features/agent-builder/FeedbackModal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal'; 

// Define tutorials (example structure)
const tutorials = {
  createAgent: {
    id: 'createAgent',
    title: 'Como Criar um Novo Agente',
    steps: [
      { title: 'Passo 1: Abrir o Construtor', content: 'Clique no botão <strong>+ Novo Agente</strong> para abrir o formulário de criação.' },
      { title: 'Passo 2: Preencher Detalhes', content: 'Insira o nome, descrição, tipo e tom do agente. Selecione um ícone.' },
      { title: 'Passo 3: Configurar Ferramentas', content: 'Adicione e configure as ferramentas que seu agente usará.' },
      { title: 'Passo 4: Definir Instruções', content: 'Forneça as instruções base para o comportamento do agente.' },
      { title: 'Passo 5: Salvar o Agente', content: 'Clique em <strong>Salvar Agente</strong> para finalizar.' },
    ],
  },
  // Add more tutorials as needed
};

const AGENT_CARD_LIST_ITEM_SIZE = 210; // Approximate height of an agent card + padding

export default function AgentBuilderPage() {
  const { agents, addAgent, updateAgent, deleteAgent, isLoading, error } = useAgents();
  const { saveAgentConfig, loadAgentConfigs, deleteAgentConfig } = useAgentStorage();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isBuilderModalOpen, setIsBuilderModalOpen] = React.useState(false);
  const [editingAgent, setEditingAgent] = React.useState<SavedAgentConfiguration | null>(null);
  const [isSaveAsTemplateModalOpen, setIsSaveAsTemplateModalOpen] = React.useState(false);
  const [agentToSaveAsTemplate, setAgentToSaveAsTemplate] = React.useState<SavedAgentConfiguration | null>(null);
  const [buildMode, setBuildMode] = React.useState<'form' | 'chat'>('form');
  const [selectedAgentForMonitoring, setSelectedAgentForMonitoring] = React.useState<SavedAgentConfiguration | null>(null);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  // Tutorial State
  const [isTutorialModalOpen, setIsTutorialModalOpen] = React.useState(false);
  const [activeTutorial, setActiveTutorial] = React.useState(tutorials.createAgent); // Default tutorial
  const [currentTutorialStep, setCurrentTutorialStep] = React.useState(0);

  // Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false);

  // Confirmation Modal State for Deleting Agent
  const [isConfirmDeleteAgentOpen, setIsConfirmDeleteAgentOpen] = React.useState(false);
  const [agentToDelete, setAgentToDelete] = React.useState<SavedAgentConfiguration | null>(null);

  React.useEffect(() => {
    const agentIdToEdit = searchParams.get('edit');
    const agentToMonitorId = searchParams.get('monitor');
    const openBuilder = searchParams.get('create') === 'true';

    if (openBuilder) {
      handleCreateNewAgent();
    }

    if (agentIdToEdit) {
      const agentFound = agents.find(agent => agent.id === agentIdToEdit);
      if (agentFound) {
        setEditingAgent(agentFound);
        setIsBuilderModalOpen(true);
      }
    }
    if (agentToMonitorId) {
      const agentFound = agents.find(agent => agent.id === agentToMonitorId);
      if (agentFound) {
        setSelectedAgentForMonitoring(agentFound);
      }
    }
  }, [searchParams, agents]);

  const handleCreateNewAgent = () => {
    setEditingAgent(null);
    setBuildMode('form'); // Default to form mode for new agents
    setIsBuilderModalOpen(true);
  };

  const handleEditAgent = (agent: SavedAgentConfiguration) => {
    setEditingAgent(agent);
    setBuildMode('form'); // Default to form mode for editing
    setIsBuilderModalOpen(true);
  };

  const handleDeleteAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      setAgentToDelete(agent);
      setIsConfirmDeleteAgentOpen(true);
    }
  };

  const onConfirmDeleteAgent = async () => {
    if (agentToDelete) {
      try {
        await deleteAgent(agentToDelete.id);
        await deleteAgentConfig(agentToDelete.id); // Also delete from local storage
        toast({
          title: "Agente Excluído",
          description: `O agente "${agentToDelete.agentName}" foi excluído com sucesso.`,
          variant: "destructive",
        });
      } catch (error) {
        console.error("Erro ao excluir agente:", error);
        toast({
          title: "Erro ao Excluir",
          description: "Não foi possível excluir o agente. Tente novamente.",
          variant: "destructive",
        });
      }
      setAgentToDelete(null);
      setIsConfirmDeleteAgentOpen(false);
    }
  };

  const handleSaveAgent = async (agentConfig: SavedAgentConfiguration) => {
    try {
      if (editingAgent) {
        await updateAgent(agentConfig.id, agentConfig);
        toast({
          title: "Agente Atualizado",
          description: `O agente "${agentConfig.agentName}" foi atualizado com sucesso.`,
        });
      } else {
        const newAgentWithId = { ...agentConfig, id: uuidv4() };
        await addAgent(newAgentWithId);
        toast({
          title: "Agente Criado",
          description: `O agente "${newAgentWithId.agentName}" foi criado com sucesso.`,
        });
      }
      await saveAgentConfig(agentConfig); // Save to local storage
      setIsBuilderModalOpen(false);
      setEditingAgent(null);
    } catch (error) {
      console.error("Erro ao salvar agente:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar o agente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAsTemplate = (agent: SavedAgentConfiguration) => {
    setAgentToSaveAsTemplate(agent);
    setIsSaveAsTemplateModalOpen(true);
  };

  const onConfirmSaveAsTemplate = async (templateName: string) => {
    if (agentToSaveAsTemplate) {
      try {
        await saveAgentTemplate(agentToSaveAsTemplate, templateName);
        toast({
          title: "Template Salvo",
          description: `O agente "${agentToSaveAsTemplate.agentName}" foi salvo como template "${templateName}".`,
        });
      } catch (error) {
        console.error("Erro ao salvar template:", error);
        toast({
          title: "Erro ao Salvar Template",
          description: "Não foi possível salvar o template. Tente novamente.",
          variant: "destructive",
        });
      }
      setIsSaveAsTemplateModalOpen(false);
      setAgentToSaveAsTemplate(null);
    }
  };

  const handleSelectAgentForMonitoring = (agent: SavedAgentConfiguration) => {
    setSelectedAgentForMonitoring(agent);
    // Potentially navigate or change view to show logs/metrics
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
  const rootAgents = agents.filter(agent => agent.isRootAgent).length; // Assuming isRootAgent property exists

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando agentes...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">Erro ao carregar agentes: {error}</div>;
  }

  const AgentRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const agent = agents[index];
    if (!agent) return null;
    return (
      <div style={style} className="px-1 py-2">
        <AgentCard
          agent={agent}
          onEdit={handleEditAgent}
          onDelete={handleDeleteAgent} // Pass handleDeleteAgent directly
          onSaveAsTemplate={handleSaveAsTemplate}
          onSelectForMonitoring={handleSelectAgentForMonitoring}
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agentes Raiz</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rootAgents}</div>
              <p className="text-xs text-muted-foreground">
                {/* +19% from last month (example) */}
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
            <AgentMetricsView agent={selectedAgentForMonitoring} />
          </div>
          <AgentLogView agentId={selectedAgentForMonitoring.id} />
        </div>
      ) : (
        agents.length === 0 ? (
          <div className="text-center py-12">
            <Ghost className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">Nenhum agente encontrado</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">Comece criando um novo agente para vê-lo aqui.</p>
            <div className="mt-6">
              <Button onClick={handleCreateNewAgent} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2" /> Criar Primeiro Agente
              </Button>
            </div>
          </div>
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={handleEditAgent}
                  onDelete={handleDeleteAgent} // Pass handleDeleteAgent directly
                  onSaveAsTemplate={handleSaveAsTemplate}
                  onSelectForMonitoring={handleSelectAgentForMonitoring}
                  isSelectedForMonitoring={selectedAgentForMonitoring?.id === agent.id}
                />
              ))}
            </div>
          ) : (
            // List View using react-window
            <div className="border rounded-md overflow-hidden">
              <FixedSizeList
                height={Math.min(600, agents.length * AGENT_CARD_LIST_ITEM_SIZE)} // Adjust height dynamically or set a max
                itemCount={agents.length}
                itemSize={AGENT_CARD_LIST_ITEM_SIZE}
                width="100%"
              >
                {AgentRow}
              </FixedSizeList>
            </div>
          )
        )
      )}

      {isBuilderModalOpen && (
        buildMode === 'form' ? (
          <AgentBuilderDialog
            isOpen={isBuilderModalOpen}
            onClose={() => {
              setIsBuilderModalOpen(false);
              setEditingAgent(null);
            }}
            onSave={handleSaveAgent}
            agent={editingAgent}
            availableTools={defaultAvailableTools} // Pass default tools or fetch dynamically
            agentToneOptions={agentToneOptions}
            agentTypeOptions={agentTypeOptions}
            iconComponents={iconComponents}
          />
        ) : (
          <AgentCreatorChatUI
            isOpen={isBuilderModalOpen} // This might need to be a different state if chat UI is a separate modal
            onClose={() => {
              setIsBuilderModalOpen(false);
              setEditingAgent(null); // Clear editing agent when closing chat UI too
            }}
            onSave={handleSaveAgent} // Or a different save handler for chat-created agents
            initialAgentConfig={editingAgent} // Pass existing config if editing, or null/default for new
            // onEditInFormMode={handleEditAgentWithMode} // Function to switch to form mode
          />
        )
      )}

      {isSaveAsTemplateModalOpen && agentToSaveAsTemplate && (
        <SaveAsTemplateDialog
          isOpen={isSaveAsTemplateModalOpen}
          onClose={() => setIsSaveAsTemplateModalOpen(false)}
          onSave={onConfirmSaveAsTemplate}
          agentName={agentToSaveAsTemplate.agentName}
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
    </div>
  );
}

// AgentRow and AGENT_CARD_LIST_ITEM_SIZE will be appended here by the next operation.
// Placeholder comment to ensure this line is unique for the next replace/append.
// Note: The handleEditAgentWithMode function mentioned in comments for AgentCreatorChatUI
// was not present in the original code, so it's not added here. If needed, it would be:
// const handleEditAgentWithMode = (agentToEdit: SavedAgentConfiguration, mode: "form" | "chat") => {
//   setEditingAgent(agentToEdit);
//   setBuildMode(mode);
//   if (mode === "form") setIsBuilderModalOpen(true);
//   else setSelectedAgentForMonitoring(null); // Or other logic for chat build mode
// };
