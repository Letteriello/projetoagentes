// src/components/features/agent-builder/agent-card.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
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
  LucideIcon,
  HelpCircle,
  Star, // Added Star
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { safeToReactNode } from "@/lib/utils";
import type {
  SavedAgentConfiguration,
  AgentConfig,
  LLMAgentConfig,
  WorkflowAgentConfig,
  // CustomAgentConfig,  // Marked as unused in provided code, will keep for now
  AvailableTool,
} from '@/types/agent-configs-fixed';
import { cn } from "@/lib/utils";


const getToolIconComponent = (
  Icon?: LucideIcon,
): React.FC<React.SVGProps<SVGSVGElement>> => {
  if (Icon) {
    return Icon;
  }
  return HelpCircle;
};

// Define CustomAgentConfig locally if not used elsewhere to avoid import errors if it's truly unused globally
interface CustomAgentConfig extends AgentConfig {
  customLogicDescription?: string;
  // Add other fields specific to CustomAgentConfig if any
}


interface AgentCardProps {
  agent: SavedAgentConfiguration;
  onEdit: (agent: SavedAgentConfiguration) => void;
  onTest: (agent: SavedAgentConfiguration) => void;
  onDelete: (agentId: string) => void;
  onViewMonitoring: (agent: SavedAgentConfiguration) => void;
  onSaveAsTemplate: (agent: SavedAgentConfiguration) => void;
  availableTools: AvailableTool[];
  agentTypeOptions: {
    id: string;
    label: string;
    icon?: React.ReactNode;
    description?: string;
  }[];
  isFavorite?: boolean; // Added
  onToggleFavorite: (agentId: string, newFavoriteStatus: boolean) => void; // Added
}

const starVariants = {
  initial: { scale: 1 },
  toggled: { scale: [1, 1.4, 1], rotate: [0, 15, -15, 0], transition: { duration: 0.4 } },
};

export function AgentCard({
  agent,
  onEdit,
  onTest,
  onDelete,
  onViewMonitoring,
  onSaveAsTemplate,
  availableTools,
  agentTypeOptions,
  isFavorite, // Added
  onToggleFavorite, // Added
}: AgentCardProps) {
  const hasUnconfiguredTools = agent.toolsDetails?.some(
    (toolDetail) => {
      if (!toolDetail.hasConfig) {
        return false;
      }
      const config = agent.toolConfigsApplied?.[toolDetail.id];
      return !config || Object.keys(config).length === 0;
    }
  ) ?? false;

  const agentTypeDetails = agentTypeOptions.find(
    (opt) => opt.id === agent.config.type,
  );
  const agentTypeLabel =
    agentTypeDetails?.label.split("(")[0].trim() || agent.config.type;

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
        agentTypeDetails.icon,
        {
          width: 20,
          height: 20,
          className: "text-primary mr-4 self-start mt-1 w-10 h-10",
        },
      );
    } else {
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col" // Outer div for motion, Card is inside
    >
      <Card className="flex flex-col bg-card shadow-md hover:shadow-lg transition-shadow duration-300 hover:animate-subtle-scale h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start">
            {AgentIconComponent}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center">
                <CardTitle className="text-lg font-semibold text-foreground">
                  {safeToReactNode(agent.agentName, "Agente Sem Nome")}
                </CardTitle>
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
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild className="group">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-amber-500 h-7 w-7"
                        onClick={() => onToggleFavorite(agent.id, !isFavorite)}
                      >
                        <motion.span
                          key={isFavorite ? "favorite" : "not-favorite"} // Changed key to be more descriptive
                          variants={starVariants}
                          animate="toggled"
                          className="flex items-center justify-center"
                        >
                          <Star className={cn("h-5 w-5 group-hover:animate-jiggle", isFavorite ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
                        </motion.span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Badge variant="secondary" className="text-xs h-6">
                  {safeToReactNode(agentTypeLabel)}
                </Badge>
              </div>
            </div>
            <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-3 min-h-[3.75rem]">
              {safeToReactNode(agent.agentDescription, "Sem descrição.")}
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
          agent.config.type === "workflow" ||
          agent.config.type === "custom") && (agent.config as LLMAgentConfig | WorkflowAgentConfig | CustomAgentConfig).agentModel && (
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
          (agent.config as WorkflowAgentConfig).workflowDescription && ( // Assuming workflowDescription exists
            <div>
              <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">
                Descrição do Fluxo:
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
                {safeToReactNode((agent.config as WorkflowAgentConfig).workflowDescription)}
                {(agent.config as WorkflowAgentConfig).workflowType && ( // Changed from detailedWorkflowType to workflowType
                  <span className="block text-xs text-primary/70">
                    Tipo: {safeToReactNode((agent.config as WorkflowAgentConfig).workflowType)}
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
        {agent.toolsDetails && agent.toolsDetails.length > 0 && (
          <div className="pt-2">
            <h4 className="text-sm font-semibold mb-1 text-foreground/80">
              Ferramentas:
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {agent.toolsDetails.map((toolDetail) => {
                const fullTool = availableTools.find(
                  (t) => t.id === toolDetail.id,
                );
                const IconComponent = getToolIconComponent(fullTool?.icon);
                const toolIcon = <IconComponent width={12} height={12} />;

                const isConfigured =
                  fullTool?.needsConfiguration &&
                  agent.toolConfigsApplied?.[toolDetail.id] &&
                  Object.keys(agent.toolConfigsApplied[toolDetail.id] || {}).length > 0;

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
                      />
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2 mt-auto pt-4 border-t">
        <Button variant="outline" size="sm" onClick={() => onEdit(agent)} className="group">
          <EditIcon size={16} className="mr-1.5 group-hover:animate-jiggle" /> Editar
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSaveAsTemplate(agent)} className="group">
          <SaveIcon size={16} className="mr-1.5 group-hover:animate-jiggle" /> Salvar como Template
        </Button>
        <Button variant="outline" size="sm" onClick={() => onViewMonitoring(agent)} className="group">
          <EyeIcon size={16} className="mr-1.5 group-hover:animate-jiggle" /> Monitorar
        </Button>
        <Button variant="outline" size="sm" onClick={() => onTest(agent)} className="hidden sm:inline-flex group">
          <ChatIcon size={16} className="mr-1.5 group-hover:animate-jiggle" /> Testar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="ml-auto group"
          onClick={() => onDelete(agent.id)}
        >
          <DeleteIcon size={16} className="mr-1.5 group-hover:animate-jiggle" /> Excluir
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
  );
}
