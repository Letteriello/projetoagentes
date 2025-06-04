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
  GripVertical, // Import GripVertical
  MoreVertical, // For dropdown menu in list view
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import Dropdown components
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
  CustomAgentConfig, // Assuming this will now come from agent-configs-new
  AvailableTool,
} from '@/types/agent-configs-new'; // UPDATED IMPORT PATH
import { cn, capitalize } from "@/lib/utils"; // Added capitalize


const getToolIconComponent = (
  Icon?: LucideIcon,
): React.FC<React.SVGProps<SVGSVGElement>> => {
  if (Icon) {
    return Icon;
  }
  return HelpCircle;
};

// Removed local CustomAgentConfig definition, assuming it's imported or not strictly needed if not used.
// If CustomAgentConfig from agent-configs-new is different and causes issues, it would need adjustment.

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
  // Drag and Drop props
  agentId: string; // Already present in `agent.id` but useful for explicit dnd handling if needed
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  viewMode?: 'grid' | 'list'; // Added viewMode prop
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
  // Drag and Drop props
  agentId, // Can be used if agent.id is not preferred for some reason, though agent.id is fine
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  viewMode = 'grid', // Default to grid
}: AgentCardProps) {
  const isListView = viewMode === 'list';

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
  const iconSize = isListView ? 24 : 32; // Smaller icon for list view (w-6 h-6 vs w-10 h-10 which is 40px)
  const iconMargin = isListView ? "mr-2" : "mr-4";
  const iconClasses = `text-primary ${iconMargin} self-start mt-1`;


  if (agent.templateId === "legal_analyst_basic") {
    AgentIconComponent = <Briefcase width={iconSize} height={iconSize} className={cn(iconClasses, isListView ? "w-6 h-6" : "w-10 h-10")} />;
  } else if (agent.templateId === "medical_triage_info") {
    AgentIconComponent = <Stethoscope width={iconSize} height={iconSize} className={cn(iconClasses, isListView ? "w-6 h-6" : "w-10 h-10")} />;
  } else if (agent.templateId === "travel_planner_basic") {
    AgentIconComponent = <Plane width={iconSize} height={iconSize} className={cn(iconClasses, isListView ? "w-6 h-6" : "w-10 h-10")} />;
  } else if (agentTypeDetails?.icon && React.isValidElement(agentTypeDetails.icon)) {
    AgentIconComponent = React.cloneElement(agentTypeDetails.icon as React.ReactElement, {
      width: iconSize,
      height: iconSize,
      className: cn(iconClasses, isListView ? "w-6 h-6" : "w-10 h-10"),
    });
  } else {
    AgentIconComponent = <Cpu width={iconSize} height={iconSize} className={cn(iconClasses, isListView ? "w-6 h-6" : "w-10 h-10")} />;
  }


  return (
    <motion.div
      initial={{ opacity: 0, y: isListView ? 0 : 10 }} // No y-animation for list view for smoother appearance
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(isListView ? "w-full" : "flex flex-col")} // Ensure list items take full width
      // Apply drag and drop props here
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      // Consider adding a data attribute for the agent ID if needed for more complex scenarios
      // data-agent-id={agent.id}
    >
      <Card className={cn(
        "bg-card shadow-md hover:shadow-lg transition-shadow duration-300 hover:animate-subtle-scale",
        isListView ? "flex flex-row items-center p-3 space-x-3 h-auto" : "flex flex-col h-full"
      )}>
        {/* CardHeader equivalent for List View (Drag Handle + Icon) */}
        <div className={cn(
          "relative", // For potential absolute positioning of handle if needed differently
          isListView ? "flex items-center flex-shrink-0" : "pb-3" // In grid, CardHeader has its own padding
        )}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "p-1 cursor-grab self-center text-muted-foreground hover:text-foreground",
                  isListView ? "mr-2" : "mr-2" // Consistent margin for handle for now
                )}>
                  <GripVertical size={isListView ? 18 : 20} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Arrastar para Reordenar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {!isListView && AgentIconComponent /* Grid view shows icon in header */}
          {isListView && <div className={cn(isListView ? "" : "hidden")}>{AgentIconComponent}</div> /* List view icon area */}
        </div>

        {/* Main content wrapper (Title, Description, Badges, Content for Grid, minimal info for List) */}
        <div className={cn(isListView ? "flex-grow flex items-center justify-between" : "flex-1 flex flex-col")}>
          {/* This div wraps Header content for grid, and primary text content for list */}
          <div className={cn(isListView ? "flex-grow" : "")}>
            {!isListView && ( /* Traditional CardHeader for Grid view */
              <CardHeader className="pb-3 pt-0 pl-0"> {/* Remove padding if AgentIconComponent is outside */}
                <div className="flex items-start">
                  {/* AgentIconComponent rendered by the outer structure for Grid already */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center">
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {safeToReactNode(agent.agentName, "Agente Sem Nome")}
                        </CardTitle>
                        {agent.config.isRootAgent && (
                          <TooltipProvider><Tooltip><TooltipTrigger asChild><Crown className="w-4 h-4 ml-2 text-yellow-500" /></TooltipTrigger><TooltipContent><p>Agente Raiz</p></TooltipContent></Tooltip></TooltipProvider>
                        )}
                        {hasUnconfiguredTools && (
                          <TooltipProvider><Tooltip><TooltipTrigger asChild><AlertCircle className="w-4 h-4 ml-1 text-amber-500" /></TooltipTrigger><TooltipContent><p>Este agente possui ferramentas que requerem configuração adicional.</p></TooltipContent></Tooltip></TooltipProvider>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <TooltipProvider><Tooltip><TooltipTrigger asChild className="group"><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-amber-500 h-7 w-7" onClick={() => onToggleFavorite(agent.id, !isFavorite)}><motion.span key={isFavorite ? "favorite" : "not-favorite"} variants={starVariants} animate="toggled" className="flex items-center justify-center"><Star className={cn("h-5 w-5 group-hover:animate-jiggle", isFavorite ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} /></motion.span></Button></TooltipTrigger><TooltipContent><p>{isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}</p></TooltipContent></Tooltip></TooltipProvider>
                        <Badge variant="secondary" className="text-xs h-6">{safeToReactNode(agentTypeLabel)}</Badge>
                      </div>
                    </div>
                    <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-3 min-h-[3.75rem]">
                      {safeToReactNode(agent.agentDescription, "Sem descrição.")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            )}

            {isListView && ( /* Compact Title/Description for List view */
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                   <div className="flex items-center">
                    <CardTitle className="text-base font-semibold text-foreground truncate">
                      {safeToReactNode(agent.agentName, "Agente Sem Nome")}
                    </CardTitle>
                     {agent.config.isRootAgent && (
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><Crown className="w-3 h-3 ml-1.5 text-yellow-500 flex-shrink-0" /></TooltipTrigger><TooltipContent><p>Agente Raiz</p></TooltipContent></Tooltip></TooltipProvider>
                      )}
                      {hasUnconfiguredTools && (
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><AlertCircle className="w-3 h-3 ml-1 text-amber-500 flex-shrink-0" /></TooltipTrigger><TooltipContent><p>Requer Configuração</p></TooltipContent></Tooltip></TooltipProvider>
                      )}
                   </div>
                    <Badge variant="secondary" className="text-xs h-5 px-1.5 ml-2 flex-shrink-0">{safeToReactNode(agentTypeLabel)}</Badge>
                    {/* Display workflowType badge for workflow agents in list view */}
                    {isListView && agent.config.type === 'workflow' && (agent.config as WorkflowAgentConfig).workflowType && (
                      <Badge variant="outline" className="text-xs h-5 px-1.5 ml-1 flex-shrink-0">
                        {capitalize((agent.config as WorkflowAgentConfig).workflowType || '')}
                      </Badge>
                    )}
                </div>
                <CardDescription className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {safeToReactNode(agent.agentDescription, "Sem descrição.")}
                </CardDescription>
                 {/* Optionally show minimal tool info for list view */}
                {agent.toolsDetails && agent.toolsDetails.length > 0 && (
                  <div className="mt-1 flex items-center gap-1">
                    <ConfigureIcon width={10} height={10} className="text-sky-500" />
                    <span className="text-xs text-muted-foreground">{agent.toolsDetails.length} ferramenta(s)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isListView && ( /* CardContent for Grid view only */
            <CardContent className="space-y-3 flex-grow pt-0">
              {agent.config.type === "llm" && (agent.config as LLMAgentConfig).agentGoal && (
                <div>
                  <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">Objetivo:</h4>
                  <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">{safeToReactNode((agent.config as LLMAgentConfig).agentGoal)}</p>
                </div>
              )}
              {(agent.config.type === "llm" || agent.config.type === "workflow" || agent.config.type === "custom") && (agent.config as LLMAgentConfig | WorkflowAgentConfig | CustomAgentConfig).agentModel && (
                <div>
                  <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">Modelo de IA:</h4>
                  <p className="text-xs text-muted-foreground">{safeToReactNode((agent.config as LLMAgentConfig | WorkflowAgentConfig | CustomAgentConfig).agentModel)}</p>
                </div>
              )}
              {agent.config.type === "workflow" && (agent.config as WorkflowAgentConfig).workflowDescription && (
                <div>
                  <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">Descrição do Fluxo:</h4>
                  <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
                    {safeToReactNode((agent.config as WorkflowAgentConfig).workflowDescription)}
                    {(agent.config as WorkflowAgentConfig).workflowType && (<span className="block text-xs text-primary/70">Tipo: {safeToReactNode((agent.config as WorkflowAgentConfig).workflowType)}</span>)}
                  </p>
                </div>
              )}
              {agent.config.type === "custom" && (agent.config as CustomAgentConfig).customLogicDescription && (
                <div>
                  <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">Lógica Personalizada:</h4>
                  <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">{safeToReactNode((agent.config as CustomAgentConfig).customLogicDescription)}</p>
                </div>
              )}
              {agent.toolsDetails && agent.toolsDetails.length > 0 && (
                <div className="pt-2">
                  <h4 className="text-sm font-semibold mb-1 text-foreground/80">Ferramentas:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.toolsDetails.map((toolDetail) => {
                      const fullTool = availableTools.find((t) => t.id === toolDetail.id);
                      const IconComponent = getToolIconComponent(fullTool?.icon);
                      const toolIcon = <IconComponent width={12} height={12} />;
                      const isConfigured = fullTool?.needsConfiguration && agent.toolConfigsApplied?.[toolDetail.id] && Object.keys(agent.toolConfigsApplied[toolDetail.id] || {}).length > 0;
                      return (
                        <Badge key={toolDetail.id} variant={isConfigured && fullTool?.needsConfiguration ? "default" : "secondary"} className="text-xs h-6 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-default" title={toolDetail.label + (fullTool?.needsConfiguration ? (isConfigured ? " (Configurada)" : " (Requer Configuração)") : "")}>
                          {toolIcon}
                          <span className="truncate group-hover:whitespace-normal group-hover:max-w-none">{safeToReactNode(toolDetail.label)}</span>
                          {fullTool?.needsConfiguration && (<ConfigureIcon width={10} height={10} className={`ml-1 ${isConfigured ? "text-emerald-500" : "text-sky-500"}`} />)}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </div> {/* End of main content wrapper */}

        {/* CardFooter: Adjusted for List View */}
        <CardFooter className={cn(
          "mt-auto pt-4 border-t",
          isListView ? "p-0 pl-3 flex flex-col items-end space-y-1.5 border-none flex-shrink-0" : "gap-2" // Compact footer for list
        )}>
          {isListView ? (
            <>
              <div className="flex items-center space-x-1.5">
                 <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild className="group">
                        <Button variant="ghost" size="icon_sm" className="text-muted-foreground hover:text-amber-500 h-6 w-6" onClick={() => onToggleFavorite(agent.id, !isFavorite)}>
                           <motion.span key={isFavorite ? "favorite" : "not-favorite"} variants={starVariants} animate="toggled" className="flex items-center justify-center">
                            <Star className={cn("h-4 w-4 group-hover:animate-jiggle", isFavorite ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
                          </motion.span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left"><p>{isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                <Button variant="outline" size="icon_sm" onClick={() => onEdit(agent)} className="group h-6 w-6">
                  <EditIcon size={12} className="group-hover:animate-jiggle" />
                  <span className="sr-only">Editar</span>
                </Button>
                <Button variant="destructive" size="icon_sm" onClick={() => onDelete(agent.id)} className="group h-6 w-6">
                  <DeleteIcon size={12} className="group-hover:animate-jiggle" />
                  <span className="sr-only">Excluir</span>
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon_sm" className="h-6 w-6">
                    <MoreVertical size={14} />
                    <span className="sr-only">Mais Opções</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="left" align="end" className="bg-popover text-popover-foreground">
                  <DropdownMenuItem onClick={() => onSaveAsTemplate(agent)}><SaveIcon size={14} className="mr-2" /> Salvar como Template</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewMonitoring(agent)}><EyeIcon size={14} className="mr-2" /> Monitorar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onTest(agent)}><ChatIcon size={14} className="mr-2" /> Testar</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <> {/* Grid View Buttons */}
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
              <Button variant="destructive" size="sm" className="ml-auto group" onClick={() => onDelete(agent.id)}>
                <DeleteIcon size={16} className="mr-1.5 group-hover:animate-jiggle" /> Excluir
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
