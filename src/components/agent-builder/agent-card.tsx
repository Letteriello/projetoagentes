
"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, MessageSquare, Trash2, Cpu, Workflow, FileJson, Briefcase, Stethoscope, Plane, Settings2 as ConfigureIcon } from "lucide-react";
import type { SavedAgentConfiguration, AvailableTool, ToolConfigData, AgentConfig } from '@/app/agent-builder/page'; // Importando tipos da página principal

// Definindo iconComponents aqui, pois será usado exclusivamente por este card
const iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  Search: require('lucide-react').Search, // Exemplo de como importar dinamicamente se necessário
  Calculator: require('lucide-react').Calculator,
  FileText: require('lucide-react').FileText,
  CalendarDays: require('lucide-react').CalendarDays,
  Network: require('lucide-react').Network,
  Database: require('lucide-react').Database,
  Code2: require('lucide-react').Code2,
  Default: Cpu,
  Briefcase,
  Stethoscope,
  Plane,
  Workflow,
  Brain: Cpu, // Reutilizando Cpu para Brain se não houver BrainIcon específico
  FileJson,
  GripVertical: require('lucide-react').GripVertical, // Para consistência se usado em outros lugares
};

const getToolIconComponent = (iconName?: keyof typeof iconComponents | 'default') => {
  const Icon = iconName ? iconComponents[iconName] : iconComponents['Default'];
  return Icon || Cpu;
};


interface AgentCardProps {
  agent: SavedAgentConfiguration;
  onEdit: (agent: SavedAgentConfiguration) => void;
  onTest: (agent: SavedAgentConfiguration) => void;
  onDelete: (agentId: string) => void;
  availableTools: AvailableTool[]; // Necessário para obter o label correto e o ícone da ferramenta
  agentTypeOptions: { id: string; label: string; icon?: React.ReactNode; description?: string; }[];
}

export function AgentCard({ agent, onEdit, onTest, onDelete, availableTools, agentTypeOptions }: AgentCardProps) {
  const agentTypeDetails = agentTypeOptions.find(opt => opt.id === agent.agentType);
  const agentTypeLabel = agentTypeDetails?.label.split('(')[0].trim() || agent.agentType;

  let AgentIconComponent: React.ReactNode;
  let specificIconType: keyof typeof iconComponents | undefined = undefined;

  if (agent.templateId === 'legal_analyst_basic') specificIconType = 'Briefcase';
  else if (agent.templateId === 'medical_triage_info') specificIconType = 'Stethoscope';
  else if (agent.templateId === 'travel_planner_basic') specificIconType = 'Plane';
  
  if (specificIconType) {
      const SpecificIcon = iconComponents[specificIconType];
      AgentIconComponent = SpecificIcon ? <SpecificIcon width={20} height={20} className="text-primary mr-4 self-start mt-1 w-10 h-10" /> : <Cpu width={20} height={20} className="text-primary mr-4 self-start mt-1 w-10 h-10" />;
  } else if (agentTypeDetails?.icon) {
    AgentIconComponent = React.cloneElement(agentTypeDetails.icon as React.ReactElement, { width: 20, height: 20, className: "text-primary mr-4 self-start mt-1 w-10 h-10" });
  } else {
    AgentIconComponent = <Cpu width={20} height={20} className="text-primary mr-4 self-start mt-1 w-10 h-10" />;
  }

  return (
    <Card className="flex flex-col bg-card shadow-md hover:shadow-lg transition-shadow duration-300 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start">
          {AgentIconComponent}
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <CardTitle className="text-lg font-semibold text-foreground">
                {agent.agentName || "Agente Sem Nome"}
              </CardTitle>
              <Badge variant="secondary" className="text-xs h-6">
                {agentTypeLabel}
              </Badge>
            </div>
            <CardDescription className="text-sm text-muted-foreground mb-3 line-clamp-3 min-h-[3.75rem]">
              {agent.agentDescription || "Sem descrição."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow pt-0">
        {agent.agentType === 'llm' && (agent as any).agentGoal && (
            <div>
                <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">Objetivo:</h4>
                <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
                    {(agent as any).agentGoal}
                </p>
            </div>
        )}
        {(agent.agentType === 'llm' || (agent.agentType === 'workflow' && (agent as any).agentModel) || (agent.agentType === 'custom' && (agent as any).agentModel)) && (
            <div>
                <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">Modelo de IA:</h4>
                <p className="text-xs text-muted-foreground">
                    { (agent as any).agentModel }
                </p>
            </div>
        )}
        {agent.agentType === 'workflow' && (agent as any).workflowDescription && (
            <div>
                <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">Descrição do Fluxo:</h4>
                <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
                    {(agent as any).workflowDescription}
                    { (agent as any).detailedWorkflowType && <span className="block text-xs text-primary/70">Tipo: {(agent as any).detailedWorkflowType}</span>}
                </p>
            </div>
        )}
        {agent.agentType === 'custom' && (agent as any).customLogicDescription && (
            <div>
                <h4 className="text-sm font-semibold mb-0.5 text-foreground/80">Lógica Personalizada:</h4>
                <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
                    {(agent as any).customLogicDescription}
                </p>
            </div>
        )}
        {agent.toolsDetails.length > 0 && (
            <div className="pt-2">
                <h4 className="text-sm font-semibold mb-1 text-foreground/80">Ferramentas:</h4>
                <div className="flex flex-wrap gap-1.5">
                    {agent.toolsDetails.map(toolDetail => {
                        const fullTool = availableTools.find(t => t.id === toolDetail.id);
                        const IconComponent = getToolIconComponent(toolDetail.iconName);
                        const toolIcon = <IconComponent width={12} height={12} />;

                        const isConfigured = fullTool?.needsConfiguration && agent.toolConfigsApplied?.[toolDetail.id] &&
                                            ( (fullTool.id === 'webSearch' && agent.toolConfigsApplied[fullTool.id]?.googleApiKey && agent.toolConfigsApplied[fullTool.id]?.googleCseId) ||
                                                (fullTool.id === 'customApiIntegration' && agent.toolConfigsApplied[fullTool.id]?.openapiSpecUrl) ||
                                                (fullTool.id === 'databaseAccess' && (agent.toolConfigsApplied[fullTool.id]?.dbConnectionString || (agent.toolConfigsApplied[fullTool.id]?.dbHost && agent.toolConfigsApplied[fullTool.id]?.dbName))) ||
                                                (fullTool.id === 'knowledgeBase' && agent.toolConfigsApplied[fullTool.id]?.knowledgeBaseId) ||
                                                (fullTool.id === 'calendarAccess' && agent.toolConfigsApplied[fullTool.id]?.calendarApiEndpoint) ||
                                                (fullTool.needsConfiguration && !['webSearch', 'customApiIntegration', 'databaseAccess', 'knowledgeBase', 'calendarAccess'].includes(fullTool.id) && Object.keys(agent.toolConfigsApplied[fullTool.id] || {}).length > 0)
                                            );
                        return (
                            <Badge
                                key={toolDetail.id}
                                variant={isConfigured && fullTool?.needsConfiguration ? "default" : "secondary"}
                                className="text-xs h-6 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-default"
                                title={toolDetail.label + (fullTool?.needsConfiguration ? (isConfigured ? " (Configurada)" : " (Requer Configuração)") : "")}
                            >
                                {toolIcon}
                                <span className="truncate group-hover:whitespace-normal group-hover:max-w-none">{toolDetail.label}</span>
                                {fullTool?.needsConfiguration && (
                                    <ConfigureIcon
                                        width={10}
                                        height={10}
                                        className={`ml-1 ${isConfigured ? 'text-emerald-500' : 'text-sky-500'}`}
                                    >
                                        <title>{isConfigured ? "Configurada" : "Requer configuração"}</title>
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
          <Edit size={16} className="mr-1.5" /> Editar
        </Button>
        <Button variant="outline" size="sm" onClick={() => onTest(agent)}>
          <MessageSquare size={16} className="mr-1.5" /> Testar
        </Button>
        <Button variant="destructive" size="sm" className="ml-auto" onClick={() => onDelete(agent.id)}>
          <Trash2 size={16} className="mr-1.5" /> Excluir
        </Button>
      </CardFooter>
    </Card>
  );
}

    