"use client";

import * as React from "react";
// ReactNode might be needed if agentTypeOptions icons are directly used here,
// but they are passed to AgentCard and AgentBuilderDialog which would get it from agentBuilderConfig.ts
// For safety, keeping ReactNode if it was in original top-level imports.
import { ReactNode } from "react";
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
  // Icons below are now part of iconComponents in agentBuilderConfig.ts,
  // so they are not directly needed here UNLESS AgentBuilderPage itself uses them.
  // Search, Calculator, FileText, CalendarDays, Network, Database, Code2,
  // Workflow, Brain, FileJson, Settings2 as ConfigureIcon,
  // GripVertical, ClipboardCopy, AlertCircle, Trash2 as DeleteIcon,
  // Edit as EditIcon, MessageSquare as ChatIcon, Copy as CopyIcon,
  // Eye as EyeIcon, EyeOff as EyeOffIcon, Save as SaveIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import { cn } from "@/lib/utils";
import { AgentCard } from "@/components/features/agent-builder/agent-card";
import AgentBuilderDialog from "@/components/features/agent-builder/agent-builder-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AvailableTool } from "@/types/tool-types";

// Interface já importada de @/types/tool-types

export const availableTools: AvailableTool[] = [
  {
    id: "webSearch",
    label: "Busca na Web (Google)",
    name: "webSearch",
    type: "genkit_native",
    icon: Search,
    description:
      "Permite ao agente pesquisar na internet (via Genkit). Esta ferramenta tentará usar as variáveis de ambiente GOOGLE_API_KEY e GOOGLE_CSE_ID para funcionar. A configuração na UI serve para documentar e guiar o prompt do sistema.",
    hasConfig: true,
    genkitToolName: "performWebSearch",
  },
  {
    id: "calculator",
    label: "Calculadora",
    name: "calculator",
    type: "genkit_native",
    icon: Calculator,
    description: "Permite realizar cálculos matemáticos (via função Genkit).",
    genkitToolName: "calculator",
  }, // Fixed escaped quote
  {
    id: "knowledgeBase",
    label: "Consulta à Base de Conhecimento (RAG)",
    name: "knowledgeBase",
    type: "genkit_native",
    icon: FileText,
    description:
      "Permite buscar em bases de conhecimento ou documentos (ex: RAG via Genkit). Requer configuração do ID da base e, possivelmente, chaves de API.",
    hasConfig: true,
    genkitToolName: "queryKnowledgeBase",
  }, // Fixed escaped quote
  {
    id: "calendarAccess",
    label: "Acesso à Agenda/Calendário",
    name: "calendarAccess",
    type: "genkit_native",
    icon: CalendarDays,
    description:
      "Permite verificar ou criar eventos na agenda (requer fluxo Genkit e auth). Requer configuração do endpoint da API ou ID do fluxo.",
    hasConfig: true,
    genkitToolName: "accessCalendar",
  }, // Fixed escaped quote
  {
    id: "customApiIntegration",
    label: "Integração com API Externa (OpenAPI)",
    name: "customApiIntegration",
    type: "genkit_native",
    icon: Network,
    description:
      "Permite interagir com serviços web externos (via OpenAPI, requer fluxo Genkit). Requer URL do esquema OpenAPI e, opcionalmente, chave API.",
    hasConfig: true,
    genkitToolName: "invokeOpenAPI",
  }, // Fixed escaped quote
  {
    id: "databaseAccess",
    label: "Acesso a Banco de Dados (SQL)",
    name: "databaseAccess",
    type: "genkit_native",
    icon: Database,
    description:
      "Permite consultar e interagir com bancos de dados SQL (requer fluxo Genkit). Requer configuração detalhada da conexão.",
    hasConfig: true,
    genkitToolName: "queryDatabase",
  }, // Fixed escaped quote
  {
    id: "codeExecutor",
    label: "Execução de Código (Python Sandbox)",
    name: "codeExecutor",
    type: "genkit_native",
    icon: Code2,
    description:
      "Permite executar trechos de código Python em um ambiente seguro (requer fluxo Genkit). Pode requerer configuração do endpoint do sandbox.",
    hasConfig: true,
    genkitToolName: "executeCode",
  }, // Última ferramenta da lista
]; // Fechamento do array de ferramentas

// Interface já importada de @/types/tool-types

// A lista de ferramentas já foi definida acima.
// Se precisar adicionar mais ferramentas, adicione-as ao array existente acima.

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
  {
    id: "custom" as const,
    label: "Agente Personalizado (Ex: CustomAgent, via Genkit Flow)",
    icon: FileJson as ReactNode,
    description:
      "Implemente lógica operacional única e fluxos de controle específicos, estendendo BaseAgent. Tipicamente orquestram outros agentes e gerenciam estado. Requer desenvolvimento de fluxo Genkit customizado (equivalente a implementar _run_async_impl).",
  },
  {
    id: "a2a" as const,
    label: "Agente-para-Agente (A2A)",
    icon: Network as ReactNode,
    description:
      "Permite comunicação e cooperação entre múltiplos agentes para solucionar tarefas complexas através de interações coordenadas.",
  },
];

export type AgentFramework =
  | "genkit"
  | "crewai"
  | "langchain"
  | "custom"
  | "none"; // Added AgentFramework type

export interface AgentConfigBase {
  agentName: string;
  agentDescription: string;
  agentVersion: string;
  agentIcon?: string; // Ícone do agente (nome do componente do ícone)
  agentTools: string[];
  isRootAgent?: boolean; // Indica se este é um agente raiz em um sistema multi-agente
  subAgents?: string[]; // Lista de IDs de agentes que podem ser delegados
  globalInstruction?: string; // Instrução global que se aplica a todos os agentes na árvore
  agentFramework?: AgentFramework; // Added agentFramework
}

// Imports from the new data file
import {
  AvailableTool, // This specific type might be needed if AgentCard or AgentBuilderDialog expect it directly via props from this page.
                 // However, the constant availableTools (which is a list of AvailableTool) is what's passed.
                 // The type for the prop in AgentCard/AgentBuilderDialog should ideally also point to the new file.
                 // For now, assuming page.tsx doesn't need to destructure or type local vars with AvailableTool itself.
  availableTools,
  agentToneOptions,
  agentTypeOptions,
  SavedAgentConfiguration, // Used for useState<SavedAgentConfiguration | null>(null);
  iconComponents,
  agentTemplates // Used by AgentBuilderDialog
} from "@/data/agentBuilderConfig";

export default function AgentBuilderPage() {
  const { toast } = useToast();
  const { savedAgents, setSavedAgents } = useAgents();

  const [isBuilderModalOpen, setIsBuilderModalOpen] = React.useState(false);
  const [editingAgent, setEditingAgent] =
    React.useState<SavedAgentConfiguration | null>(null);
  const [isMounted, setIsMounted] = React.useState(false);

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

  const handleSaveAgent = (agentConfig: SavedAgentConfiguration) => {
    if (editingAgent) {
      setSavedAgents((prevAgents: SavedAgentConfiguration[]) =>
        prevAgents.map((agent: SavedAgentConfiguration) =>
          agent.id === editingAgent.id ? agentConfig : agent,
        ),
      );
      toast({
        title: "Agente Atualizado!",
        description: `O agente "${agentConfig.agentName}" foi atualizado.`,
      });
    } else {
      // Ensure new agents also get a unique ID if not provided by dialog/template
      const newAgentWithId = { ...agentConfig, id: agentConfig.id || React.useId() };
      setSavedAgents((prevAgents) => [...prevAgents, newAgentWithId]);
      toast({
        title: "Agente Criado!",
        description: `O agente "${newAgentWithId.agentName}" foi adicionado à sua lista.`,
      });
    }
    setEditingAgent(null);
  };

  const handleDeleteAgent = (agentIdToDelete: string) => {
    setSavedAgents((prev: SavedAgentConfiguration[]) =>
      prev.filter(
        (agent: SavedAgentConfiguration) => agent.id !== agentIdToDelete,
      ),
    );
    toast({
      title: "Agente Excluído",
      description: "O agente foi removido da lista.",
    });
  };

  return (
    <div className="space-y-8 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Agentes</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Info className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-popover text-popover-foreground">
                <p>
                  Gerencie seus agentes de IA existentes ou crie novos para
                  automatizar tarefas e otimizar seus fluxos de trabalho.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          onClick={handleOpenCreateAgentModal}
          className={cn(isMounted && "button-live-glow")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Agente
        </Button>
      </header>

      {savedAgents.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={() => handleEditAgent(agent)}
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
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">
            Nenhum agente criado ainda
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Comece clicando no botão acima para configurar seu primeiro agente
            de IA.
          </p>
          <Button
            onClick={handleOpenCreateAgentModal}
            className={cn("mt-6", isMounted && "button-live-glow")}
          >
            <Plus className="mr-2 h-4 w-4" /> Criar Novo Agente
          </Button>
        </div>
      )}

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
        agentTemplates={agentTemplates} // Pass agentTemplates here
      />
    </div>
  );
}
