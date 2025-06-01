"use client";

import * as React from "react";
import { Users, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SubAgentSelector } from "@/components/features/agent-builder/sub-agent-selector";

interface MultiAgentTabProps {
  isRootAgent: boolean;
  setIsRootAgent: (value: boolean) => void;
  subAgents: string[];
  setSubAgents: (value: string[]) => void;
  globalInstruction: string;
  setGlobalInstruction: (value: string) => void;
  savedAgents: Pick<SavedAgentConfiguration, 'id' | 'agentName'>[];
}
export function MultiAgentTab({
  isRootAgent,
  setIsRootAgent,
  subAgents,
  setSubAgents,
  globalInstruction,
  setGlobalInstruction,
  savedAgents,
}: MultiAgentTabProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-3">
        Configuração de Sistema Multi-Agente (Google ADK)
      </h3>

      <Alert variant="default" className="mb-4 bg-card border-border/70">
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <AlertTitle className="text-sm font-medium">
          Compatibilidade com Google ADK
        </AlertTitle>
        <AlertDescription className="text-xs">
          Esta seção permite configurar parâmetros específicos para sistemas
          multi-agentes compatíveis com o Google Agent Development Kit (ADK).
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isRootAgent"
            checked={isRootAgent}
            onCheckedChange={(checked) => setIsRootAgent(checked as boolean)}
          />
          <Label htmlFor="isRootAgent" className="font-medium">
            Este é um agente raiz (pode delegar tarefas para sub-agentes)
          </Label>
        </div>{" "}
        {isRootAgent && (
          <>
            <div className="grid grid-cols-[200px_1fr] items-start gap-x-4 gap-y-3 mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="text-left pt-2 flex items-center">
                    <Label htmlFor="subAgents">Sub-Agentes</Label>
                    <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="max-w-xs">
                      Sub-agents are other agents that this root agent can
                      delegate tasks to, enabling more complex workflows and
                      specialized task handling.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <SubAgentSelector
                selectedAgents={subAgents}
                availableAgents={savedAgents || []}
                onChange={setSubAgents}
              />
            </div>

            <div className="grid grid-cols-[200px_1fr] items-start gap-x-4 gap-y-3 mt-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="text-left pt-2 flex items-center">
                    <Label htmlFor="globalInstruction">Instrução Global</Label>
                    <Info className="h-3 w-3 ml-1 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="max-w-xs">
                      The Global Instruction is a directive provided to all
                      sub-agents within this multi-agent system. It helps guide
                      their behavior and ensures they align with the overall
                      objectives defined by the root agent.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Textarea
                id="globalInstruction"
                placeholder="Instruções que se aplicam a todos os agentes do sistema..."
                value={globalInstruction}
                onChange={(e) => setGlobalInstruction(e.target.value)}
                rows={5}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
