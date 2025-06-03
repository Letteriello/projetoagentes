"use client";

import * as React from "react";
import { useSearchParams, useRouter } from 'next/navigation'; // Added useRouter
import { Button } from "@/components/ui/button";
// Card components are used, keep them.
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
  // Icons below are now part of iconComponents in agentBuilderConfig.tsx,
  // so they are not directly needed here UNLESS AgentBuilderPage itself uses them.
  // Search, Calculator, FileText, CalendarDays, Network, Database, Code2, // Removed these direct icon imports
  // Workflow, Brain, FileJson, Settings2 as ConfigureIcon,
  // GripVertical, ClipboardCopy, AlertCircle, Trash2 as DeleteIcon,
  // Edit as EditIcon, MessageSquare as ChatIcon, Copy as CopyIcon,
  // Eye as EyeIcon, EyeOff as EyeOffIcon, Save as SaveIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveAgentTemplate, getAgentTemplate } from "@/lib/agentServices";
import { useAgents } from "@/contexts/AgentsContext";
import type { SavedAgentConfiguration } from '@/types/agent-configs-fixed'; // Adjusted path
import { cn } from "@/lib/utils";
import { AgentCard } from "@/components/features/agent-builder/agent-card";
import AgentBuilderDialog from "@/components/features/agent-builder/agent-builder-dialog";
import SaveAsTemplateDialog from "@/components/features/agent-builder/save-as-template-dialog"; // Import new dialog
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// import { AvailableTool } from "@/types/tool-types"; // Removed, will use from agentBuilderConfig

// Comment related to AvailableTool import removed as the import itself is removed.

// export const availableTools: AvailableTool[] = [ // Removed local definition
//   {
//     id: "webSearch",
//     label: "Busca na Web (Google)",
//     name: "webSearch",
//     type: "genkit_native",
//     icon: Search, // This would cause an error as Search is removed
//     description:
//       "Permite ao agente pesquisar na internet (via Genkit). Esta ferramenta tentará usar as variáveis de ambiente GOOGLE_API_KEY e GOOGLE_CSE_ID para funcionar. A configuração na UI serve para documentar e guiar o prompt do sistema.",
//     hasConfig: true,
//     genkitToolName: "performWebSearch",
//   },
//   {
//     id: "calculator",
//     label: "Calculadora",
//     name: "calculator",
//     type: "genkit_native",
//     icon: Calculator, // This would cause an error
//     description: "Permite realizar cálculos matemáticos (via função Genkit).",
//     genkitToolName: "calculator",
//   },
//   {
//     id: "knowledgeBase",
//     label: "Consulta à Base de Conhecimento (RAG)",
//     name: "knowledgeBase",
//     type: "genkit_native",
//     icon: FileText, // This would cause an error
//     description:
//       "Permite buscar em bases de conhecimento ou documentos (ex: RAG via Genkit). Requer configuração do ID da base e, possivelmente, chaves de API.",
//     hasConfig: true,
//     genkitToolName: "queryKnowledgeBase",
//   },
//   {
//     id: "calendarAccess",
//     label: "Acesso à Agenda/Calendário",
//     name: "calendarAccess",
//     type: "genkit_native",
//     icon: CalendarDays, // This would cause an error
//     description:
//       "Permite verificar ou criar eventos na agenda (requer fluxo Genkit e auth). Requer configuração do endpoint da API ou ID do fluxo.",
//     hasConfig: true,
//     genkitToolName: "accessCalendar",
//   },
//   {
//     id: "customApiIntegration",
//     label: "Integração com API Externa (OpenAPI)",
//     name: "customApiIntegration",
//     type: "genkit_native",
//     icon: Network, // This would cause an error
//     description:
//       "Permite interagir com serviços web externos (via OpenAPI, requer fluxo Genkit). Requer URL do esquema OpenAPI e, opcionalmente, chave API.",
//     hasConfig: true,
//     genkitToolName: "invokeOpenAPI",
//   },
//   {
//     id: "databaseAccess",
//     label: "Acesso a Banco de Dados (SQL)",
//     name: "databaseAccess",
//     type: "genkit_native",
//     icon: Database, // This would cause an error
//     description:
//       "Permite consultar e interagir com bancos de dados SQL (requer fluxo Genkit). Requer configuração detalhada da conexão.",
//     hasConfig: true,
//     genkitToolName: "queryDatabase",
//   },
//   {
//     id: "codeExecutor",
//     label: "Execução de Código (Python Sandbox)",
//     name: "codeExecutor",
//     type: "genkit_native",
//     icon: Code2, // This would cause an error
//     description:
//       "Permite executar trechos de código Python em um ambiente seguro (requer fluxo Genkit). Pode requerer configuração do endpoint do sandbox.",
//     hasConfig: true,
//     genkitToolName: "executeCode",
//   },
// ];

// Comment related to AvailableTool import removed as the import itself is removed.

// A lista de ferramentas já foi definida acima. // This comment is now misleading
// Se precisar adicionar mais ferramentas, adicione-as ao array existente acima.

// export const agentToneOptions = [ // Removed local definition
//   { id: "friendly", label: "Amigável e Prestativo" },
//   { id: "professional", label: "Profissional e Direto" },
//   { id: "formal", label: "Formal e Educado" },
//   { id: "casual", label: "Casual e Descontraído" },
//   { id: "funny", label: "Engraçado e Divertido" },
//   { id: "analytical", label: "Analítico e Detalhista" },
//   { id: "concise", label: "Conciso e Objetivo" },
//   { id: "empathetic", label: "Empático e Compreensivo" },
//   { id: "creative", label: "Criativo e Inspirador" },
// ];

// export const agentTypeOptions = [ // Removed local definition
//   {
//     id: "custom" as const,
//     label: "Agente Personalizado (Ex: CustomAgent, via Genkit Flow)",
//     icon: FileJson as ReactNode, // This would cause an error
//     description:
//       "Implemente lógica operacional única e fluxos de controle específicos, estendendo BaseAgent. Tipicamente orquestram outros agentes e gerenciam estado. Requer desenvolvimento de fluxo Genkit customizado (equivalente a implementar _run_async_impl).",
//   },
//   {
//     id: "a2a" as const,
//     label: "Agente-para-Agente (A2A)",
//     icon: Network as ReactNode, // This would cause an error
//     description:
//       "Permite comunicação e cooperação entre múltiplos agentes para solucionar tarefas complexas através de interações coordenadas.",
//   },
// ];

// export type AgentFramework = // Removed local definition
//   | "genkit"
//   | "crewai"
//   | "langchain"
//   | "custom"
//   | "none";

// export interface AgentConfigBase { // Removed local definition
//   agentName: string;
//   agentDescription: string;
//   agentVersion: string;
//   agentIcon?: string;
//   agentTools: string[];
//   isRootAgent?: boolean;
//   subAgents?: string[];
//   globalInstruction?: string;
//   agentFramework?: AgentFramework;
// }

// Imports from the new data file
import {
  // Tipos exportados
  AvailableTool,
  ToolConfigData,
  AgentTemplate,
  SavedAgentConfiguration,
  // Dados exportados
  availableTools,
  agentToneOptions,
  agentTypeOptions,
  iconComponents,
  agentTemplates,
  // Tipos adicionais
  AgentFramework,
  AgentType,
  WorkflowDetailedType,
  TerminationConditionType,
  StatePersistenceType,
  ArtifactStorageType,
  StateScope,
  ToolConfigField,
  CommunicationChannel,
  A2AConfig,
  ArtifactDefinition,
  ArtifactsConfig,
  InitialStateValue,
  StateValidationRule,
  StatePersistenceConfig,
  KnowledgeSource,
  RagMemoryConfig,
  AgentConfigBase,
  LLMAgentConfig,
  WorkflowAgentConfig,
  CustomAgentConfig,
  A2AAgentSpecialistConfig,
  AgentConfig
} from "@/data/agentBuilderConfig";
import { AgentCreatorChatUI } from "@/components/features/agent-builder/agent-creator-chat-ui"; // Nova UI
import { MessageSquareText, Edit3 } from "lucide-react"; // Ícones para alternar
// Import the new monitoring components
import { AgentLogView } from "@/components/features/agent-builder/AgentLogView";
import { AgentMetricsView } from "@/components/features/agent-builder/AgentMetricsView";
import { v4 as uuidv4 } from 'uuid'; // Import uuidv4
import { HelpModal } from '@/components/ui/HelpModal';
import { guidedTutorials, GuidedTutorial, TutorialStep } from '@/data/agent-builder-help-content';
import { FeedbackButton } from "@/components/features/agent-builder/feedback-button"; // Added
import { FeedbackModal } from "@/components/features/agent-builder/feedback-modal"; // Added

export default function AgentBuilderPage() {
  const { toast } = useToast();
  // IMPORTANT: The useAgents hook now returns addAgent, updateAgent, deleteAgent that call the API.
  // The setSavedAgents directly might not be the primary way to update if API calls refresh the list.
  // However, for optimistic updates or direct client-side list manipulation (like after delete), it's still useful.
  const { savedAgents, addAgent: addAgentViaContext, updateAgent: updateAgentViaContext, deleteAgent: deleteAgentViaContext, isLoadingAgents } = useAgents();

  const [isBuilderModalOpen, setIsBuilderModalOpen] = React.useState(false);
  const [editingAgent, setEditingAgent] =
    React.useState<SavedAgentConfiguration | null>(null);
  const [selectedAgentForMonitoring, setSelectedAgentForMonitoring] = React.useState<SavedAgentConfiguration | null>(null);
  const [currentViewTab, setCurrentViewTab] = React.useState<'details' | 'monitoring'>('details');
  const [isMounted, setIsMounted] = React.useState(false);
  const [buildMode, setBuildMode] = React.useState<"form" | "chat">("form"); // Novo estado

  // State for the new Save As Template dialog
  const [isSaveAsTemplateDialogOpen, setIsSaveAsTemplateDialogOpen] = React.useState(false);
  const [currentAgentForTemplating, setCurrentAgentForTemplating] = React.useState<SavedAgentConfiguration | null>(null);

  const [activeTutorial, setActiveTutorial] = React.useState<GuidedTutorial | null>(null);
  const [currentTutorialStep, setCurrentTutorialStep] = React.useState(0);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = React.useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false); // Added

  const searchParams = useSearchParams();
  const router = useRouter(); // For clearing URL param

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
            // Prepare a new agent configuration from the template
            const {
              id, // Original template ID - do not reuse for the new agent
              userId, // Original template owner - do not reuse
              createdAt, // Original template creation date
              updatedAt, // Original template update date
              isTemplate, // New agent is not a template itself (yet)
              // templateId: originalTemplateId, // This was the ID of the template it was based on, if any. Not needed for the new agent's templateId field.
              ...restOfTemplateData
            } = template;

            const newAgentFromTemplate: SavedAgentConfiguration = {
              ...restOfTemplateData,
              id: uuidv4(), // Generate a new unique ID for this new agent draft
              agentName: `Cópia de ${template.agentName}`, // Suggest a new name
              // agentDescription: template.agentDescription, // Already in restOfTemplateData
              // config: template.config, // Already in restOfTemplateData
              // tools: template.tools, // Already in restOfTemplateData
              // toolConfigsApplied: template.toolConfigsApplied, // Already in restOfTemplateData
              templateId: templateId, // Link to the template it was created from
              isTemplate: false, // This new config is an agent, not a template
              createdAt: new Date().toISOString(), // Set new creation time
              updatedAt: new Date().toISOString(), // Set new update time
              // userId: currentUserId, // Set current user ID if available
            };

            setEditingAgent(newAgentFromTemplate);
            setIsBuilderModalOpen(true);
            // Clear the templateId from URL to prevent re-triggering
            // Using window.history.replaceState for simplicity with next/navigation's current router
            // A more Next.js idiomatic way might involve router.replace with careful handling of state
            window.history.replaceState(null, '', '/agent-builder');

          } else {
            toast({
              title: "Template não encontrado",
              description: "Não foi possível carregar o template selecionado.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Erro ao carregar template:", error);
          toast({
            title: "Erro ao Carregar Template",
            description: "Ocorreu um problema ao tentar carregar o template.",
            variant: "destructive",
          });
        }
      };

      loadTemplate();
    }
  }, [searchParams, router, toast]); // Add router and toast to dependencies

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenCreateAgentModal = () => {
    setEditingAgent(null);
    setIsBuilderModalOpen(true);
  };

  const handleEditAgent = (agentToEdit: SavedAgentConfiguration) => {
    setEditingAgent(agentToEdit);
    setSelectedAgentForMonitoring(null); // Clear monitoring view when opening edit modal
    setCurrentViewTab('details'); // Default to details tab
    setIsBuilderModalOpen(true);
  };

  const handleViewAgentMonitoring = (agentToView: SavedAgentConfiguration) => {
    setSelectedAgentForMonitoring(agentToView);
    setEditingAgent(null); // Clear editing modal state
    setIsBuilderModalOpen(false);
    setCurrentViewTab('monitoring'); // Switch to monitoring tab
     // Potentially switch buildMode to 'form' if monitoring is part of that view.
    // For now, let's assume monitoring view can exist independently or alongside form elements.
    // If buildMode should be 'form' to see this, uncomment:
    // setBuildMode('form');
  };

  const handleEditAgentWithMode = (agentToEdit: SavedAgentConfiguration, mode: "form" | "chat") => {
    setEditingAgent(agentToEdit);
    setSelectedAgentForMonitoring(null);
    setBuildMode(mode);
    if (mode === 'form') {
      setCurrentViewTab('details');
      setIsBuilderModalOpen(true);
    }
  };

  // Updated to use context functions that call the API
  const handleSaveAgent = async (agentConfig: SavedAgentConfiguration) => {
    let result: SavedAgentConfiguration | null = null;
    if (editingAgent) { // For existing agents, agentConfig.id should be editingAgent.id
      const updatePayload: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = { ...agentConfig };
      delete (updatePayload as any).id; // Ensure ID is not in the payload for update, API uses path param
      delete (updatePayload as any).userId;
      delete (updatePayload as any).createdAt;
      delete (updatePayload as any).updatedAt;

      result = await updateAgentViaContext(editingAgent.id, updatePayload);
      if (result) {
        toast({
          title: "Agente Atualizado!",
          description: `O agente "${result.agentName}" foi atualizado.`,
        });
      }
    } else {
      // For new agents, agentConfig.id might be undefined or a placeholder from client
      const { id, createdAt, updatedAt, userId, ...newAgentData } = agentConfig;
      result = await addAgentViaContext(newAgentData as Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>);
      if (result) {
        toast({
          title: "Agente Criado!",
          description: `O agente "${result.agentName}" foi adicionado à sua lista.`,
        });
      }
    }
    if (result) { // If save was successful (either add or update)
        setEditingAgent(null); // Clear editing state
        // setSelectedAgentForMonitoring(null); // Also clear monitoring selection if tied to edit
        setIsBuilderModalOpen(false); // Close modal
    }
    // The context should ideally refresh the savedAgents list after add/update
  };

  const handleDeleteAgent = async (agentIdToDelete: string) => {
    if (selectedAgentForMonitoring?.id === agentIdToDelete) {
      setSelectedAgentForMonitoring(null); // Clear monitoring view if the deleted agent was being monitored
    }
    if (currentAgentForTemplating?.id === agentIdToDelete) {
      setCurrentAgentForTemplating(null); // Clear if it was about to be templated
      setIsSaveAsTemplateDialogOpen(false);
    }
    const success = await deleteAgentViaContext(agentIdToDelete);
    if (success) {
      toast({
        title: "Agente Excluído",
        description: "O agente foi removido da lista.",
      });
    }
    // Context should refresh the list
  };

  const handleSaveAsTemplate = async (agent: SavedAgentConfiguration) => {
    // This function now just opens the dialog
    setCurrentAgentForTemplating(agent);
    setIsSaveAsTemplateDialogOpen(true);
  };

  const executeSaveAsTemplate = async (templateDetails: { useCases: string[]; templateDetailsPreview: string }) => {
    if (!currentAgentForTemplating) {
      toast({ title: "Erro", description: "Nenhum agente selecionado para salvar como template.", variant: "destructive" });
      return;
    }

    const {
      id, createdAt, updatedAt, isFavorite, // Exclude these from the new template
      ...agentDataToCopy // Keep most of the agent's configuration
    } = currentAgentForTemplating;

    const templateName = `Template de ${currentAgentForTemplating.agentName}`; // Or prompt user for a name

    const newTemplateData: Partial<SavedAgentConfiguration> = {
      ...agentDataToCopy,
      agentName: templateName,
      agentDescription: `Template baseado em ${currentAgentForTemplating.agentName}: ${currentAgentForTemplating.agentDescription}`,
      useCases: templateDetails.useCases, // Add new field
      templateDetailsPreview: templateDetails.templateDetailsPreview, // Add new field
      isTemplate: true, // Mark as template
      // userId, createdAt, updatedAt will be handled by the backend service
      // templateId should be null or not set for a new template.
    };

    try {
      const savedTemplateId = await saveAgentTemplate(newTemplateData as SavedAgentConfiguration, undefined /* currentUserId if available */);
      if (savedTemplateId) {
        toast({
          title: "Template Salvo!",
          description: `O agente "${currentAgentForTemplating.agentName}" foi salvo como um novo template com nome "${templateName}".`,
        });
      } else {
        throw new Error("Falha ao obter o ID do template salvo.");
      }
    } catch (error) {
      console.error("Erro ao salvar como template:", error);
      toast({
        title: "Erro ao Salvar Template",
        description: "Não foi possível salvar o agente como template. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCurrentAgentForTemplating(null);
      setIsSaveAsTemplateDialogOpen(false);
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
            onClick={() => {
                setBuildMode('chat');
                setIsBuilderModalOpen(false);
            }}
            title="Construir com Chat IA"
            className="shadow-sm"
          >
            <MessageSquareText className="mr-2 h-4 w-4" /> Conversar com IA
          </Button>
          <Button
            variant={buildMode === 'form' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
                setBuildMode('form');
                // Logic for opening modal if editingAgent exists, or just switching mode
                setIsBuilderModalOpen(!!editingAgent);
            }}
            title="Editor Avançado (Formulário)"
            className="shadow-sm"
          >
            <Edit3 className="mr-2 h-4 w-4" /> Editor Avançado
          </Button>
          <FeedbackButton onClick={() => setIsFeedbackModalOpen(true)} /> {/* Added */}
        </div>
      </header>

      {buildMode === 'chat' ? (
        <AgentCreatorChatUI initialAgentConfig={editingAgent} />
      ) : (
        <>
          <div className="flex items-center justify-end pt-4 gap-2"> {/* Adjusted pt and added gap */}
            {/* Tutorial Button already added in the header for all modes, or could be here specifically for form mode */}
            <Button onClick={handleOpenCreateAgentModal} className={cn("button-live-glow", isMounted && "opacity-100")}>
              <Plus className="mr-2 h-4 w-4" /> Novo Agente (Formulário)
            </Button>
          </div>
          {isLoadingAgents && <p className="text-center py-4">Carregando agentes...</p>}
          {!isLoadingAgents && savedAgents.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {savedAgents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onEdit={() => handleEditAgent(agent)}
                    onSaveAsTemplate={handleSaveAsTemplate} // Add this line
                    // Add a new prop/handler to AgentCard for monitoring
                    onViewMonitoring={() => handleViewAgentMonitoring(agent)}
                    onTest={() =>
                      toast({
                        title: "Em breve!",
                        description: "Funcionalidade de teste no chat.",
                      })
                    }
                    onDelete={() => handleDeleteAgent(agent.id)}
                    availableTools={availableTools}
                    agentTypeOptions={agentTypeOptions}
                  />
                ))}
              </div>
            </div>
          ) : (
            !isLoadingAgents && (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-card">
                <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium text-foreground">
                  Nenhum agente criado ainda
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use o botão "Novo Agente (Formulário)" acima ou alterne para "Conversar com IA" para criar seu primeiro agente.
                </p>
              </div>
            )
          )}

          {/* Section for displaying selected agent's monitoring or details */}
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
                      // Optionally, if AgentBuilderDialog should open for this agent's details:
                      // setEditingAgent(selectedAgentForMonitoring);
                      // setIsBuilderModalOpen(true);
                      // For now, details tab can be a placeholder or show read-only info.
                      // To re-open the modal for editing from here:
                      handleEditAgent(selectedAgentForMonitoring);
                      // And ensure selectedAgentForMonitoring is cleared if modal takes full control
                      // setSelectedAgentForMonitoring(null); // if opening modal means exiting this view
                    }}
                  >
                    Configuração
                  </Button>
                  <Button
                    variant={currentViewTab === 'monitoring' ? 'default' : 'outline'}
                    onClick={() => setCurrentViewTab('monitoring')}
                  >
                    Monitoramento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {currentViewTab === 'details' && (
                  <div>
                    <p>Exibindo detalhes de configuração para: <strong>{selectedAgentForMonitoring.agentName}</strong>.</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Para editar, feche esta visualização e clique no botão de edição do card do agente,
                      ou clique em 'Configuração' acima para reabrir o editor.
                    </p>
                    {/* Or, directly embed/render a read-only view of agent config here */}
                  </div>
                )}
                {currentViewTab === 'monitoring' && (
                  <div className="space-y-6"> {/* Add spacing between metrics and logs */}
                    {/* AgentMetricsView */}
                    <AgentMetricsView agentId={selectedAgentForMonitoring.id} />

                    {/* AgentLogView */}
                    <AgentLogView agentId={selectedAgentForMonitoring.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {buildMode === 'form' && editingAgent && !selectedAgentForMonitoring && (
        <AgentBuilderDialog
          isOpen={isBuilderModalOpen && !!editingAgent && !isSaveAsTemplateDialogOpen} // Ensure save as template dialog is not also open
          onOpenChange={(isOpenValue: boolean) => {
            setIsBuilderModalOpen(isOpenValue);
            if (!isOpenValue) {
              setEditingAgent(null);
            }
          }}
          editingAgent={editingAgent}
          onSave={handleSaveAgent}
          availableTools={availableTools}
          agentTypeOptions={agentTypeOptions}
          agentToneOptions={agentToneOptions}
          iconComponents={iconComponents}
          availableAgentsForSubSelector={savedAgents.map(a => ({id: a.id, agentName: a.agentName}))} // Pass available agents for sub-selector
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
          size="lg" // Or another appropriate size for tutorials
        >
          {/* Render tutorial step content. Similar to help modal, handle HTML strings carefully */}
          <div dangerouslySetInnerHTML={{ __html: activeTutorial.steps[currentTutorialStep].content as string }} />
          {/* Add visual if present: activeTutorial.steps[currentTutorialStep].visual */}
        </HelpModal>
      )}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onOpenChange={setIsFeedbackModalOpen}
      /> {/* Added */}

    </div>
  );
}

// Helper function to get available tools, assuming it's defined elsewhere or passed
// For now, this is just a placeholder
// const getAvailableTools = (): any[] => {
//   return []; // Replace with actual logic
// }
// const getAgentTypeOptions = (): any[] => {
//   return []; // Replace with actual logic
// }
// const getAgentToneOptions = (): any[] => {
//  return []; // Replace with actual logic
// }
// const getIconComponents = (): Record<string, React.FC<React.SVGProps<SVGSVGElement>>> => {
//  return {}; // Replace with actual logic
// }
// const getAgentTemplates = (): any[] => {
//  return []; // Replace with actual logic
// }

