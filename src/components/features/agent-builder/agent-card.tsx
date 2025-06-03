"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Cpu,
  Workflow,
  FileJson,
  Briefcase,
  Stethoscope,
  Plane,
  Settings2 as ConfigureIcon,
  Search,
  Calculator,
  FileText,
  CalendarDays,
  Network,
  Database,
  Code2,
  GripVertical,
  ClipboardCopy,
  AlertCircle,
  Plus,
  Layers,
  Info,
  Copy as CopyIcon,
  Trash2 as DeleteIcon,
  Edit as EditIcon,
  MessageSquare as ChatIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Save as SaveIcon,
  Crown,
  LucideIcon, // Added LucideIcon
  HelpCircle, // Added HelpCircle for default icon
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { safeToReactNode } from "@/lib/utils"; // Import safeToReactNode
// Update type imports to use centralized definitions
import type {
  SavedAgentConfiguration,
  AgentConfig, // General union type
  LLMAgentConfig,
  WorkflowAgentConfig,
  CustomAgentConfig, // For casting agent.config
  // ToolConfigData is not directly used in props but good for context if needed later
  AvailableTool, // Added AvailableTool here
} from '@/types/agent-configs-fixed';

const getToolIconComponent = (
  Icon?: LucideIcon,
): React.FC<React.SVGProps<SVGSVGElement>> => {
  if (Icon) {
    return Icon;
  }
  // Return a default icon if no icon is provided
  return HelpCircle; // Or Cpu if HelpCircle is not preferred
};

interface AgentCardProps {
  agent: SavedAgentConfiguration;
  onEdit: (agent: SavedAgentConfiguration) => void;
  onTest: (agent: SavedAgentConfiguration) => void;
  onDelete: (agentId: string) => void;
  onViewMonitoring: (agent: SavedAgentConfiguration) => void; // New prop for monitoring
  onSaveAsTemplate: (agent: SavedAgentConfiguration) => void; // New prop
  availableTools: AvailableTool[]; // Necessário para obter o label correto e o ícone da ferramenta
  agentTypeOptions: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    description?: string;
  }[];
}

export function AgentCard({
  agent,
  onEdit,
  onTest,
  onDelete,
  onViewMonitoring, // Destructure new prop
  onSaveAsTemplate, // Destructure new prop
  availableTools,
  agentTypeOptions,
}: AgentCardProps) {
  /**
   * Determines if the agent has any tools that require configuration but are not yet configured.
   * A tool is considered unconfigured if it has `hasConfig: true` and its corresponding entry
   * in `agent.toolConfigsApplied` is missing or is an empty object.
   */
  const hasUnconfiguredTools = agent.toolsDetails?.some(
    (toolDetail) => {
      if (!toolDetail.hasConfig) {
        return false; // Does not require configuration
      }
      const config = agent.toolConfigsApplied?.[toolDetail.id];
      return !config || Object.keys(config).length === 0;
    }
  ) ?? false;

  const agentTypeDetails = agentTypeOptions.find(
    (opt) => opt.id === agent.config.type, // Access via agent.config.type
  );
  const agentTypeLabel =
    agentTypeDetails?.label.split("(")[0].trim() || agent.config.type; // Access via agent.config.type

  let AgentIconComponent: React.ReactNode;

  if (agent.templateId === "legal_analyst_basic") {
    AgentIconComponent = (
      <Briefcase
        width={20}
        height={20}
        className="text-primary mr-4 self-start mt-1 w-10 h-10"
      />
    );
  } else if (agent.templateId === "medical_triage_info") {
    AgentIconComponent = (
      <Stethoscope
        width={20}
        height={20}
        className="text-primary mr-4 self-start mt-1 w-10 h-10"
      />
    );
  } else if (agent.templateId === "travel_planner_basic") {
    AgentIconComponent = (
      <Plane
        width={20}
        height={20}
        className="text-primary mr-4 self-start mt-1 w-10 h-10"
      />
    );
  } else if (agentTypeDetails?.icon) {
    if (React.isValidElement(agentTypeDetails.icon)) {
      AgentIconComponent = React.cloneElement(
        agentTypeDetails.icon, // No need to cast after isValidElement check
        {
          width: 20,
          height: 20,
          className: "text-primary mr-4 self-start mt-1 w-10 h-10",
        },
      );
    } else {
      // Fallback if agentTypeDetails.icon is a ReactNode but not a ReactElement (e.g. string, number)
      // Or render it directly if it's a simple node, though sizing/className might be an issue.
      // For now, using a default icon for non-element nodes is safer.
      AgentIconComponent = (
        <HelpCircle
          width={20}
          height={20}
          className="text-primary mr-4 self-start mt-1 w-10 h-10"
        />
      );
    }
  } else {
    AgentIconComponent = (
      <Cpu
        width={20}
        height={20}
        className="text-primary mr-4 self-start mt-1 w-10 h-10"
      />
    );
  }

  return (
    <Card className="flex flex-col bg-card shadow-md hover:shadow-lg transition-shadow duration-300 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start">
          {AgentIconComponent}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              {/* Wrapper for title and new icons */}
              <div className="flex items-center">
                <CardTitle className="text-lg font-semibold text-foreground">
                  {safeToReactNode(agent.agentName, "Agente Sem Nome")}
                </CardTitle>
                {/**
                 * Renders a Crown icon with a tooltip if the agent is designated as a root agent.
                 * This visually indicates the agent's special status in a hierarchy.
                 */}
                {agent.config.isRootAgent && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Crown className="w-4 h-4 ml-2 text-yellow-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Agente Raiz</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {/**
                 * Renders an AlertCircle icon with a tooltip if the agent has one or more tools
                 * that require configuration but have not yet been configured by the user.
                 * This serves as a visual warning to prompt the user to complete necessary setups.
                 */}
                {hasUnconfiguredTools && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="w-4 h-4 ml-1 text-amber-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Este agente possui ferramentas que requerem configuração adicional.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <Badge variant="secondary" className="text-xs h-6">
                {safeToReactNode(agentTypeLabel)}
              </Badge>
            </div>
            <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-3 min-h-[3.75rem]">
              {safeToReactNode(agent.description, "Sem descrição.")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow pt-0">
        {agent.config.type === "llm" && (agent.config as LLMAgentConfig).agentGoal && (
          <div>
            <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">
              Objetivo:
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
              {safeToReactNode((agent.config as LLMAgentConfig).agentGoal)}
            </p>
          </div>
        )}
        {(agent.config.type === "llm" ||
          agent.config.type === "workflow" || // Workflow can also have a model
          agent.config.type === "custom") && (agent.config as LLMAgentConfig | WorkflowAgentConfig | CustomAgentConfig).agentModel && ( // More specific cast
          <div>
            <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">
              Modelo de IA:
            </h4>
            <p className="text-xs text-muted-foreground">
              {safeToReactNode((agent.config as LLMAgentConfig | WorkflowAgentConfig | CustomAgentConfig).agentModel)}
            </p>
          </div>
        )}
        {agent.config.type === "workflow" &&
          (agent.config as WorkflowAgentConfig).workflowDescription && (
            <div>
              <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">
                Descrição do Fluxo:
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
                {safeToReactNode((agent.config as WorkflowAgentConfig).workflowDescription)}
                {(agent.config as WorkflowAgentConfig).detailedWorkflowType && (
                  <span className="block text-xs text-primary/70">
                    Tipo: {safeToReactNode((agent.config as WorkflowAgentConfig).detailedWorkflowType)}
                  </span>
                )}
              </p>
            </div>
          )}
        {agent.config.type === "custom" &&
          (agent.config as CustomAgentConfig).customLogicDescription && (
            <div>
              <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">
                Lógica Personalizada:
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
                {safeToReactNode((agent.config as CustomAgentConfig).customLogicDescription)}
              </p>
            </div>
          )}
        {agent.toolsDetails && agent.toolsDetails.length > 0 && ( // Check if toolsDetails exists
          <div className="pt-2">
            <h4 className="text-sm font-semibold mb-1 text-foreground/80">
              Ferramentas:
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {agent.toolsDetails.map((toolDetail) => {
                const fullTool = availableTools.find(
                  (t) => t.id === toolDetail.id,
                );
                // Wrapper de segurança para garantir que nunca renderizamos undefined
                const renderSafeIcon = (): React.ReactNode => {
                  try {
                    // Obter o componente do ícone com função aprimorada
                    const IconComponent = getToolIconComponent(fullTool?.icon);
                    // Verificação extra de segurança
                    return <IconComponent width={12} height={12} />;
                  } catch (error) {
                    console.error(
                      `Erro ao renderizar ícone para ferramenta ${toolDetail.id}:`,
                      error,
                    );
                    // Fallback final para garantir que sempre temos um elemento React válido
                    return <HelpCircle width={12} height={12} />; // Use HelpCircle or Cpu as fallback
                  }
                };
                const toolIcon = renderSafeIcon();

                const isConfigured =
                  fullTool?.needsConfiguration &&
                  agent.toolConfigsApplied?.[toolDetail.id] &&
                  ((fullTool.id === "webSearch" &&
                    agent.toolConfigsApplied[fullTool.id]?.googleApiKey &&
                    agent.toolConfigsApplied[fullTool.id]?.googleCseId) ||
                    (fullTool.id === "customApiIntegration" &&
                      agent.toolConfigsApplied[fullTool.id]?.openapiSpecUrl) ||
                    (fullTool.id === "databaseAccess" &&
                      (agent.toolConfigsApplied[fullTool.id]
                        ?.dbConnectionString ||
                        (agent.toolConfigsApplied[fullTool.id]?.dbHost &&
                          agent.toolConfigsApplied[fullTool.id]?.dbName))) ||
                    (fullTool.id === "knowledgeBase" &&
                      agent.toolConfigsApplied[fullTool.id]?.knowledgeBaseId) ||
                    (fullTool.id === "calendarAccess" &&
                      agent.toolConfigsApplied[fullTool.id]
                        ?.calendarApiEndpoint) ||
                    (fullTool.needsConfiguration &&
                      ![
                        "webSearch",
                        "customApiIntegration",
                        "databaseAccess",
                        "knowledgeBase",
                        "calendarAccess",
                      ].includes(fullTool.id) &&
                      Object.keys(agent.toolConfigsApplied[fullTool.id] || {})
                        .length > 0));
                return (
                  <Badge
                    key={toolDetail.id}
                    variant={
                      isConfigured && fullTool?.needsConfiguration
                        ? "default"
                        : "secondary"
                    }
                    className="text-xs h-6 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-default"
                    title={
                      toolDetail.label +
                      (fullTool?.needsConfiguration
                        ? isConfigured
                          ? " (Configurada)"
                          : " (Requer Configuração)"
                        : "")
                    }
                  >
                    {toolIcon}
                    <span className="truncate group-hover:whitespace-normal group-hover:max-w-none">
                      {safeToReactNode(toolDetail.label)}
                    </span>
                    {fullTool?.needsConfiguration && (
                      <ConfigureIcon
                        width={10}
                        height={10}
                        className={`ml-1 ${isConfigured ? "text-emerald-500" : "text-sky-500"}`}
                      >
                        <title>
                          {isConfigured ? "Configurada" : "Requer configuração"}
                        </title>
                      </ConfigureIcon>
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2 mt-auto pt-4 border-t">
        <Button variant="outline" size="sm" onClick={() => onEdit(agent)}>
          <EditIcon size={16} className="mr-1.5" /> Editar
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSaveAsTemplate(agent)}>
          <SaveIcon size={16} className="mr-1.5" /> Salvar como Template
        </Button>
        <Button variant="outline" size="sm" onClick={() => onViewMonitoring(agent)}>
          <EyeIcon size={16} className="mr-1.5" /> Monitorar
        </Button>
        <Button variant="outline" size="sm" onClick={() => onTest(agent)} className="hidden sm:inline-flex"> {/* Testar button might be hidden on smaller card footers if too many buttons */}
          <ChatIcon size={16} className="mr-1.5" /> Testar
        </Button>
        {/* Simplified Test button for very small screens, or adjust layout above */}
        {/* <Button variant="outline" size="icon" onClick={() => onTest(agent)} className="sm:hidden">
          <ChatIcon size={16} />
          <span className="sr-only">Testar</span>
        </Button> */}
        <Button
          variant="destructive"
          size="sm"
          className="ml-auto"
          onClick={() => onDelete(agent.id)}
        >
          <DeleteIcon size={16} className="mr-1.5" /> Excluir
        </Button>
      </CardFooter>
    </Card>
  );
}
