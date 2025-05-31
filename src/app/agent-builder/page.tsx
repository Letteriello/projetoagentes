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
