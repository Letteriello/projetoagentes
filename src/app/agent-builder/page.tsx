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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveAgentTemplate, getAgentTemplate } from "@/lib/agentServices";
import { useAgents } from "@/contexts/AgentsContext";
import { cn } from "@/lib/utils";
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
import { HelpModal } from '@/components/ui/HelpModal';
import { guidedTutorials, GuidedTutorial, TutorialStep } from '@/data/agent-builder-help-content';
import { FeedbackButton } from "@/components/features/agent-builder/feedback-button";
import { FeedbackModal } from "@/components/features/agent-builder/feedback-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmationModal } from "@/components/ui/confirmation-modal"; // Import ConfirmationModal

export default function AgentBuilderPage() {
  const { toast } = useToast();
  const { savedAgents, addAgent: addAgentViaContext, updateAgent: updateAgentViaContext, deleteAgent: deleteAgentViaContext, isLoadingAgents } = useAgents();

  // Calculate statistics
  const totalAgents = savedAgents.length;
  const agentsWithTools = savedAgents.filter(agent => agent.tools && agent.tools.length > 0).length;
  const rootAgents = savedAgents.filter(agent => agent.config && agent.config.isRootAgent).length;

  const [isBuilderModalOpen, setIsBuilderModalOpen] = React.useState(false);
  const [editingAgent, setEditingAgent] =
    React.useState<SavedAgentConfiguration | null>(null);
  const [selectedAgentForMonitoring, setSelectedAgentForMonitoring] = React.useState<SavedAgentConfiguration | null>(null);
  const [currentViewTab, setCurrentViewTab] = React.useState<'details' | 'monitoring'>('details');
  const [isMounted, setIsMounted] = React.useState(false);
  const [buildMode, setBuildMode] = React.useState<"form" | "chat">("form");

  const [isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen] = React.useState(false);
  const [currentAgentForTemplating, setCurrentAgentForTemplating] = React.useState<SavedAgentConfiguration | null>(null);

  const [activeTutorial, setActiveTutorial] = React.useState<GuidedTutorial | null>(null);
  const [currentTutorialStep, setCurrentTutorialStep] = React.useState(0);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = React.useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false);

  // State for delete confirmation modal
  const [isConfirmDeleteAgentOpen, setIsConfirmDeleteAgentOpen] = React.useState(false);
  const [agentToDelete, setAgentToDelete] = React.useState<SavedAgentConfiguration | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const startTutorial = (tutorialId: string) => {
    const tutorial = guidedTutorials.find(t => t.id === tutorialId);
    if (tutorial) {
      setActiveTutorial(tutorial);
      setCurrentTutorialStep(0);
      setIsTutorialModalOpen(true);
    }
  };

  const handleTutorialNext = () => {
    if (activeTutorial && currentTutorialStep < activeTutorial.steps.length - 1) {
      setCurrentTutorialStep(prev => prev + 1);
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

  React.useEffect(() => {
    const templateId = searchParams.get("templateId");
    if (templateId) {
      const loadTemplate = async () => {
        try {
          const template = await getAgentTemplate(templateId);
          if (template) {
            const { id, userId, createdAt, updatedAt, isTemplate, ...restOfTemplateData } = template;
            const newAgentFromTemplate: SavedAgentConfiguration = {
              ...restOfTemplateData,
              id: uuidv4(),
              agentName: `Cópia de ${template.agentName}`,
              templateId: templateId,
              isTemplate: false,
              isFavorite: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            setEditingAgent(newAgentFromTemplate);
            setIsBuilderModalOpen(true);
            // Remove the templateId from URL after loading
            router.replace('/agent-builder', undefined);
          } else {
            toast({ title: "Template não encontrado", variant: "destructive" });
             router.replace('/agent-builder', undefined);
          }
        } catch (error) {
          console.error("Erro ao carregar template:", error);
          toast({ title: "Erro ao Carregar Template", variant: "destructive" });
           router.replace('/agent-builder', undefined);
        }
      };
      loadTemplate();
    }
  }, [searchParams, router, toast]);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenCreateAgentModal = () => {
    setEditingAgent(null);
    setBuildMode("form"); // Ensure form mode when creating new
    setIsBuilderModalOpen(true);
  };

  const handleEditAgent = (agentToEdit: SavedAgentConfiguration) => {
    setEditingAgent(agentToEdit);
    setSelectedAgentForMonitoring(null);
    setCurrentViewTab('details');
    setBuildMode("form"); // Ensure form mode
    setIsBuilderModalOpen(true);
  };

  const handleViewAgentMonitoring = (agentToView: SavedAgentConfiguration) => {
    setSelectedAgentForMonitoring(agentToView);
    setEditingAgent(null);
    setIsBuilderModalOpen(false);
    setBuildMode("form"); // Ensure form mode for monitoring view consistency
    setCurrentViewTab('monitoring');
  };

  const handleSaveAgent = async (agentConfig: SavedAgentConfiguration) => {
    let result: SavedAgentConfiguration | null = null;
    // Preserve existing isFavorite status if editing, default to false if new or not set
    const existingAgent = savedAgents.find(a => a.id === agentConfig.id);
    const dataToSave = {
      ...agentConfig,
      isFavorite: agentConfig.isFavorite ?? existingAgent?.isFavorite ?? false
    };

    if (editingAgent || savedAgents.some(a => a.id === agentConfig.id)) {
      const agentIdToUpdate = editingAgent?.id || agentConfig.id;
      // Ensure not to spread fields that shouldn't be updated directly or are managed by backend/context
      const { id, userId, createdAt, updatedAt, ...updatePayload } = dataToSave;
      result = await updateAgentViaContext(agentIdToUpdate, updatePayload);
      if (result) {
        toast({ title: "Agente Atualizado!", description: `O agente "${result.agentName}" foi atualizado.` });
      }
    } else {
      const { id, createdAt, updatedAt, userId, ...newAgentData } = dataToSave;
      result = await addAgentViaContext(newAgentData as Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>);
      if (result) {
        toast({ title: "Agente Criado!", description: `O agente "${result.agentName}" foi adicionado.` });
      }
    }
    if (result) {
        setEditingAgent(null);
        setIsBuilderModalOpen(false);
    } else {
        toast({ title: "Erro ao Salvar", description: "Não foi possível salvar o agente.", variant: "destructive" });
    }
  };

  const handleDeleteAgent = (agentIdToDelete: string) => {
    const agentObject = savedAgents.find(agent => agent.id === agentIdToDelete);
    if (agentObject) {
      setAgentToDelete(agentObject);
      setIsConfirmDeleteAgentOpen(true);
    } else {
      toast({ title: "Erro", description: "Agente não encontrado para exclusão.", variant: "destructive" });
    }
  };

  const onConfirmDeleteAgent = async () => {
    if (agentToDelete) {
      if (selectedAgentForMonitoring?.id === agentToDelete.id) {
        setSelectedAgentForMonitoring(null);
      }
      if (currentAgentForTemplating?.id === agentToDelete.id) {
        setCurrentAgentForTemplating(null);
        setIsSaveAsTemplateDialogOpen(false);
      }
      const success = await deleteAgentViaContext(agentToDelete.id);
      if (success) {
        toast({ title: "Agente Excluído", description: `O agente "${agentToDelete.agentName}" foi excluído.` });
      } else {
        toast({ title: "Erro ao Excluir", description: `Não foi possível excluir o agente "${agentToDelete.agentName}".`, variant: "destructive" });
      }
      setIsConfirmDeleteAgentOpen(false);
      setAgentToDelete(null);
    }
  };

  const handleSaveAsTemplate = async (agent: SavedAgentConfiguration) => {
    setCurrentAgentForTemplating(agent);
    setIsSaveAsTemplateDialogOpen(true);
  };

  const executeSaveAsTemplate = async (templateDetails: { useCases: string[]; templateDetailsPreview: string }) => {
    if (!currentAgentForTemplating) return;
    const { id, createdAt, updatedAt, isFavorite, ...agentDataToCopy } = currentAgentForTemplating;
    const templateName = `Template de ${currentAgentForTemplating.agentName}`;
    const newTemplateData: Partial<SavedAgentConfiguration> = {
      ...agentDataToCopy,
      agentName: templateName,
      agentDescription: `Template baseado em ${currentAgentForTemplating.agentName}`,
      useCases: templateDetails.useCases,
      templateDetailsPreview: templateDetails.templateDetailsPreview,
      isTemplate: true,
      isFavorite: false, // Templates are not favorited by default
    };
    try {
      const savedTemplateId = await saveAgentTemplate(newTemplateData as SavedAgentConfiguration);
      if (savedTemplateId) {
        toast({ title: "Template Salvo!", description: `Template "${templateName}" criado.` });
      } else { throw new Error("Falha ao salvar template."); }
    } catch (error) {
      console.error("Erro ao salvar template:", error);
      toast({ title: "Erro ao Salvar Template", description: (error as Error).message, variant: "destructive" });
    } finally {
      setCurrentAgentForTemplating(null);
      setIsSaveAsTemplateDialogOpen(false);
    }
  };

  const handleToggleFavorite = async (agentId: string, newFavoriteStatus: boolean) => {
    const agentToUpdate = savedAgents.find(agent => agent.id === agentId);
    if (!agentToUpdate) {
      toast({ title: "Erro", description: "Agente não encontrado.", variant: "destructive" });
      return;
    }
    // Create payload with only isFavorite to avoid unintended updates
    const result = await updateAgentViaContext(agentId, { isFavorite: newFavoriteStatus });
    if (result) {
      toast({
        title: newFavoriteStatus ? "Agente Favoritado!" : "Agente Desfavoritado",
        description: `O agente "${result.agentName}" foi ${newFavoriteStatus ? 'adicionado aos' : 'removido dos'} favoritos.`,
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status de favorito do agente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 p-4">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Cpu className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Construtor de Agentes</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => { startTutorial(guidedTutorials[0].id); }} className="shadow-sm">
            <Layers className="mr-2 h-4 w-4" /> Ver Tutoriais
          </Button>
          <Button
            variant={buildMode === 'chat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setBuildMode('chat'); setIsBuilderModalOpen(false); setEditingAgent(null); setSelectedAgentForMonitoring(null); }}
            title="Construir com Chat IA"
            className="shadow-sm"
          >
            <MessageSquareText className="mr-2 h-4 w-4" /> Conversar com IA
          </Button>
          <Button
            variant={buildMode === 'form' ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setBuildMode('form'); /* setIsBuilderModalOpen(!!editingAgent); // Keep existing modal logic for form */ }}
            title="Editor Avançado (Formulário)"
            className="shadow-sm"
          >
            <Edit3 className="mr-2 h-4 w-4" /> Editor Avançado
          </Button>
          <FeedbackButton onClick={() => setIsFeedbackModalOpen(true)} />
        </div>
      </header>

      {/* Dashboard Section */}
      {!isLoadingAgents && savedAgents && savedAgents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Agentes</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAgents}</div>
              {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agentes com Ferramentas</CardTitle>
              <Wrench className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agentsWithTools}</div>
              {/* <p className="text-xs text-muted-foreground">+180.1% from last month</p> */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agentes Raiz</CardTitle>
              <Route className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rootAgents}</div>
              {/* <p className="text-xs text-muted-foreground">+19% from last month</p> */}
            </CardContent>
          </Card>
        </div>
      )}
      {/* End Dashboard Section */}


      {buildMode === 'chat' ? (
        <AgentCreatorChatUI
            initialAgentConfig={editingAgent}
            onSwitchToFormEdit={(agentToEdit) => handleEditAgentWithMode(agentToEdit, "form")}
        />
      ) : (
        <>
          <div className="flex items-center justify-end pt-4 gap-2">
            <Button onClick={handleOpenCreateAgentModal} className={cn("button-live-glow", isMounted && "opacity-100")}>
              <Plus className="mr-2 h-4 w-4" /> Novo Agente (Formulário)
            </Button>
          </div>
          {isLoadingAgents && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 3 }).map((_, index) => ( // Skeleton for Dashboard cards if needed, or for agent cards
                <Card key={`skeleton-card-${index}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-5 w-5" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-1/4 mb-1" />
                    {/* <Skeleton className="h-3 w-1/2" /> */}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {isLoadingAgents && ( // Keep skeleton for agent list separate
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={`skeleton-agent-${index}`} className="p-4 rounded-lg border border-border bg-card space-y-4 h-[210px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-3">
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <Skeleton className="h-5 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          )}
          {!isLoadingAgents && savedAgents && savedAgents.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {savedAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onEdit={() => handleEditAgent(agent)} // Already ensures form mode
                    onSaveAsTemplate={handleSaveAsTemplate}
                    onViewMonitoring={() => handleViewAgentMonitoring(agent)} // Already ensures form mode
                    onTest={() => toast({ title: "Em breve!", description: "Funcionalidade de teste no chat." })}
                    onDelete={() => handleDeleteAgent(agent.id)}
                    availableTools={defaultAvailableTools}
                    agentTypeOptions={agentTypeOptions}
                    isFavorite={agent.isFavorite}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </div>
          ) : (
            !isLoadingAgents && (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-lg bg-card shadow-sm">
                <Ghost className="mx-auto h-20 w-20 text-muted-foreground/70" />
                <h2 className="mt-6 text-xl font-semibold text-foreground">
                  Crie seu Primeiro Agente Inteligente
                </h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  Agentes são assistentes de IA personalizados que você pode construir para realizar tarefas específicas, automatizar processos ou interagir de formas únicas. Comece agora mesmo!
                </p>
                <Button onClick={handleOpenCreateAgentModal} className="mt-6">
                  <Plus className="mr-2 h-4 w-4" /> Novo Agente (Formulário)
                </Button>
                <p className="mt-4 text-xs text-muted-foreground">
                  Ou alterne para "Conversar com IA" para uma criação guiada.
                </p>
              </div>
            )
          )}

          {selectedAgentForMonitoring && buildMode === 'form' && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Visualizando Agente: {selectedAgentForMonitoring.agentName}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAgentForMonitoring(null)}>Fechar</Button>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant={currentViewTab === 'details' ? 'default' : 'outline'}
                    onClick={() => {
                      setCurrentViewTab('details');
                      // Transition to editing this agent
                       handleEditAgent(selectedAgentForMonitoring);
                       setSelectedAgentForMonitoring(null); // Close monitoring view
                    }}
                  >
                    Configuração
                  </Button>
                  <Button
                    variant={currentViewTab === 'monitoring' ? 'default' : 'outline'}
                    onClick={() => setCurrentViewTab('monitoring')} // Already in monitoring view
                  >
                    Monitoramento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                 {/* Content for monitoring tab is below, no direct config editing here */}
                {currentViewTab === 'monitoring' ? (
                  <div className="space-y-6">
                    <AgentMetricsView agentId={selectedAgentForMonitoring.id} />
                    <AgentLogView agentId={selectedAgentForMonitoring.id} />
                  </div>
                ) : (
                   <div>
                    <p>Para editar a configuração, clique no botão "Configuração" acima ou feche esta visualização e use o botão de edição no card do agente.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* This specific condition for AgentBuilderDialog ensures it only opens in 'form' mode for a new agent or when editing an existing one */}
      {buildMode === 'form' && isBuilderModalOpen && (
        <AgentBuilderDialog
          isOpen={isBuilderModalOpen} // isBuilderModalOpen is the source of truth
          onOpenChange={(isOpenValue: boolean) => {
            setIsBuilderModalOpen(isOpenValue);
            if (!isOpenValue) {
              setEditingAgent(null); // Clear editing agent when dialog closes
            }
          }}
          editingAgent={editingAgent} // This can be null for new agent
          onSave={handleSaveAgent}
          availableTools={defaultAvailableTools}
          agentTypeOptions={agentTypeOptions}
          agentToneOptions={agentToneOptions}
          iconComponents={iconComponents}
          availableAgentsForSubSelector={savedAgents.map(a => ({id: a.id, agentName: a.agentName}))}
        />
      )}

      {isSaveAsTemplateDialogOpen && currentAgentForTemplating && (
        <SaveAsTemplateDialog
          isOpen={isSaveAsTemplateDialogOpen}
          onOpenChange={(isOpenValue) => {
            setIsSaveAsTemplateDialogOpen(isOpenValue);
            if (!isOpenValue) {
              setCurrentAgentForTemplating(null);
            }
          }}
          agentToTemplate={currentAgentForTemplating}
          onSaveTemplate={executeSaveAsTemplate}
        />
      )}

      {activeTutorial && isTutorialModalOpen && (
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
