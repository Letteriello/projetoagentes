"use client";

import * as React from "react";
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
import { useAgents } from "@/contexts/AgentsContext";
import type { SavedAgentConfiguration } from "@/types/agent-configs"; // Adjusted path
import { cn } from "@/lib/utils";
import { AgentCard } from "@/components/features/agent-builder/agent-card";
import AgentBuilderDialog from "@/components/features/agent-builder/agent-builder-dialog";
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
  // AvailableTool, // This specific type might be needed if AgentCard or AgentBuilderDialog expect it directly via props from this page.
                 // However, the constant availableTools (which is a list of AvailableTool) is what's passed.
                 // The type for the prop in AgentCard/AgentBuilderDialog should ideally also point to the new file.
                 // For now, assuming page.tsx doesn't need to destructure or type local vars with AvailableTool itself.
  // No longer importing AvailableTool type directly here, relying on type inference or types in consumed components.
  availableTools, // This is the data
  agentToneOptions, // This is the data
  agentTypeOptions, // This is the data
  // SavedAgentConfiguration is now imported from agent-configs.ts
  iconComponents, // This is the data for icons
  agentTemplates // Used by AgentBuilderDialog
} from "@/data/agentBuilderConfig";
import { AgentCreatorChatUI } from "@/components/features/agent-builder/agent-creator-chat-ui"; // Nova UI
import { MessageSquareText, Edit3 } from "lucide-react"; // Ícones para alternar

export default function AgentBuilderPage() {
  const { toast } = useToast();
  // IMPORTANT: The useAgents hook now returns addAgent, updateAgent, deleteAgent that call the API.
  // The setSavedAgents directly might not be the primary way to update if API calls refresh the list.
  // However, for optimistic updates or direct client-side list manipulation (like after delete), it's still useful.
  const { savedAgents, addAgent: addAgentViaContext, updateAgent: updateAgentViaContext, deleteAgent: deleteAgentViaContext, isLoadingAgents } = useAgents();

  const [isBuilderModalOpen, setIsBuilderModalOpen] = React.useState(false);
  const [editingAgent, setEditingAgent] =
    React.useState<SavedAgentConfiguration | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [buildMode, setBuildMode] = React.useState<"form" | "chat">("form"); // Novo estado

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenCreateAgentModal = () => {
    setEditingAgent(null);
    setIsBuilderModalOpen(true);
  };

  const handleEditAgent = (agentToEdit: SavedAgentConfiguration) => {
    setEditingAgent(agentToEdit);
    setIsBuilderModalOpen(true);
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
        setIsBuilderModalOpen(false); // Close modal
    }
    // The context should ideally refresh the savedAgents list after add/update
  };

  const handleDeleteAgent = async (agentIdToDelete: string) => {
    const success = await deleteAgentViaContext(agentIdToDelete);
    if (success) {
      toast({
        title: "Agente Excluído",
        description: "O agente foi removido da lista.",
      });
    }
    // Context should refresh the list
  };

  return (
    <div className="space-y-8 p-4">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Cpu className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Construtor de Agentes</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
        </div>
      </header>

      {buildMode === 'chat' ? (
        <AgentCreatorChatUI initialAgentConfig={editingAgent} />
      ) : (
        <>
          <div className="flex items-center justify-end pt-4"> {/* Adjusted pt instead of justify-between and h2 */}
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
                    onEdit={() => handleEditAgentWithMode(agent, "form")} // Use new handler
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
        </>
      )}

      {buildMode === 'form' && (
            <AgentBuilderDialog
              isOpen={isBuilderModalOpen}
              onOpenChange={(isOpen: boolean) => {
                setIsBuilderModalOpen(isOpen);
                if (!isOpen) {
                  setEditingAgent(null);
                }
              }}
              editingAgent={editingAgent}
              onSave={handleSaveAgent}
              availableTools={availableTools}
              agentTypeOptions={agentTypeOptions}
              agentToneOptions={agentToneOptions}
              iconComponents={iconComponents}
              agentTemplates={agentTemplates}
            />
      )}
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
// Em src/app/agent-builder/page.tsx
// ...
export default function AgentBuilderPage() {
  const { toast } = useToast();
  const { savedAgents, addAgent: addAgentViaContext, updateAgent: updateAgentViaContext, deleteAgent: deleteAgentViaContext, isLoadingAgents } = useAgents();

  const [isBuilderModalOpen, setIsBuilderModalOpen] = React.useState(false);
  const [editingAgent, setEditingAgent] = React.useState<SavedAgentConfiguration | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);
  const [buildMode, setBuildMode] = React.useState<"form" | "chat">("form");

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenCreateAgentModal = () => {
    setEditingAgent(null);
    // setBuildMode("form"); // Explicitly set to form mode if this button is form-specific
    setIsBuilderModalOpen(true);
  };

  // Combined handler for editing
  const handleEditAgentWithMode = (agentToEdit: SavedAgentConfiguration, mode: "form" | "chat") => {
    setEditingAgent(agentToEdit);
    setBuildMode(mode);
    if (mode === "form") {
        setIsBuilderModalOpen(true);
    } else {
        setIsBuilderModalOpen(false); // Ensure form dialog is closed if switching to chat to edit
    }
  };

  const handleSaveAgent = async (agentConfig: SavedAgentConfiguration) => {
    let result: SavedAgentConfiguration | null = null;
    const isUpdating = !!(agentConfig.id && editingAgent && agentConfig.id === editingAgent.id);

    if (isUpdating) {
      const { id, userId, createdAt, updatedAt, ...updatePayload } = agentConfig;
      result = await updateAgentViaContext(agentConfig.id!, updatePayload as Partial<SavedAgentConfiguration>);
      if (result) {
        toast({ title: "Agente Atualizado!", description: `O agente "${result.agentName}" foi atualizado.` });
      }
    } else {
      const { id, createdAt, updatedAt, userId, ...newAgentData } = agentConfig;
      // Ensure a new ID is generated if not present (though currentAgentConfig.id || uuidv4() in chat UI should handle it)
      const dataForCreation = { ...newAgentData, id: id || uuidv4() } as Omit<SavedAgentConfiguration, 'createdAt' | 'updatedAt' | 'userId'>;
      result = await addAgentViaContext(dataForCreation);
      if (result) {
        toast({ title: "Agente Criado!", description: `O agente "${result.agentName}" foi adicionado.` });
      }
    }
    if (result) {
        setEditingAgent(null);
        setIsBuilderModalOpen(false); // Close form dialog if it was open
        // Optionally, if saving from chat mode, you might want to update the `editingAgent` state
        // if a new agent was created, so the chat now edits this newly created agent.
        // if (buildMode === 'chat' && !isUpdating && result) {
        //   setEditingAgent(result);
        // }
    }
  };

  const handleDeleteAgent = async (agentIdToDelete: string) => {
    const success = await deleteAgentViaContext(agentIdToDelete);
    if (success) {
      toast({ title: "Agente Excluído", description: "O agente foi removido." });
      if(editingAgent && editingAgent.id === agentIdToDelete){
        setEditingAgent(null); // Clear editing state if the deleted agent was being edited
      }
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Cpu className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Construtor de Agentes</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={buildMode === 'chat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
                setBuildMode('chat');
                // If not editing an agent, or want to start fresh in chat, set editingAgent to null
                // If an agent is being edited via form, and user switches to chat,
                // editingAgent will be passed to AgentCreatorChatUI.
                // setEditingAgent(null); // Uncomment to always start new in chat mode
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
                // If editingAgent is set, it will be passed to AgentBuilderDialog
                // If not, AgentBuilderDialog will start fresh if opened by "Novo Agente (Formulário)"
                 if (editingAgent) setIsBuilderModalOpen(true); else setIsBuilderModalOpen(false);
            }}
            title="Editor Avançado (Formulário)"
            className="shadow-sm"
          >
            <Edit3 className="mr-2 h-4 w-4" /> Editor Avançado
          </Button>
        </div>
      </header>

      {buildMode === 'chat' ? (
        <AgentCreatorChatUI initialAgentConfig={editingAgent} />
      ) : (
        <>
          <div className="flex items-center justify-end mt-4">
             <Button onClick={handleOpenCreateAgentModal} className={cn("button-live-glow", isMounted && "opacity-100")}>
               <Plus className="mr-2 h-4 w-4" /> Novo Agente (Formulário)
             </Button>
          </div>
          {isLoadingAgents && <p className="text-center py-4">Carregando agentes...</p>}
          {!isLoadingAgents && savedAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {savedAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={() => handleEditAgentWithMode(agent, "form")} // Default to form edit
                  onTest={() => toast({ title: "Em breve!", description: "Funcionalidade de teste no chat." })}
                  onDelete={() => handleDeleteAgent(agent.id)}
                  availableTools={availableTools}
                  agentTypeOptions={agentTypeOptions}
                />
              ))}
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
        </>
      )}

      {buildMode === 'form' && (
        <AgentBuilderDialog
          isOpen={isBuilderModalOpen}
          onOpenChange={(isOpen) => {
            setIsBuilderModalOpen(isOpen);
            if (!isOpen) {
              setEditingAgent(null);
            }
          }}
          editingAgent={editingAgent}
          onSave={handleSaveAgent}
          availableTools={availableTools}
          agentTypeOptions={agentTypeOptions}
          agentToneOptions={agentToneOptions}
          iconComponents={iconComponents}
          agentTemplates={agentTemplates}
        />
      )}
    </div>
  );
}
