// WorkflowBehaviorForm: Componente para o formulário de comportamento específico de agentes Workflow.
// Inclui campos para tipo de workflow, descrição e máximo de iterações.

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Props para o componente WorkflowBehaviorForm.
interface WorkflowBehaviorFormProps {
  detailedWorkflowType: string; // Ideally "sequential" | "graph" | "stateMachine" but string for flexibility
  setDetailedWorkflowType: (type: "sequential" | "graph" | "stateMachine") => void;
  workflowDescription: string;
  setWorkflowDescription: (description: string) => void;
  loopMaxIterations: number | undefined;
  setLoopMaxIterations: (iterations: number | undefined) => void;
}

const WorkflowBehaviorForm: React.FC<WorkflowBehaviorFormProps> = ({
  detailedWorkflowType,
  setDetailedWorkflowType,
  workflowDescription,
  setWorkflowDescription,
  loopMaxIterations,
  setLoopMaxIterations,
}) => {
  return (
    <>
      <div className="space-y-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Label htmlFor="detailedWorkflowType" className="cursor-help">Tipo de Workflow</Label>
            </TooltipTrigger>
            <TooltipContent className="w-80"> {/* Increased width for better readability */}
              <ul className="list-disc space-y-1 pl-4">
                <li><strong>Sequencial:</strong> Passos executados em ordem linear.</li>
                <li><strong>Grafo de Tarefas:</strong> Para fluxos complexos onde os passos podem ter múltiplas dependências e não seguem uma ordem estritamente linear. (Exige definição de dependências entre tarefas).</li>
                <li><strong>Máquina de Estados:</strong> O fluxo transita entre diferentes estados com base em condições ou resultados de tarefas. (Exige definição de estados e transições).</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Select
          value={detailedWorkflowType}
          onValueChange={(value: "sequential" | "graph" | "stateMachine") => setDetailedWorkflowType(value)}
        >
          <SelectTrigger id="detailedWorkflowType">
            <SelectValue placeholder="Selecione o tipo de workflow" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sequential">Sequencial (Passos executados em ordem)</SelectItem>
            <SelectItem value="graph">Grafo de Tarefas (Passos com dependências complexas)</SelectItem>
            <SelectItem value="stateMachine">Máquina de Estados (Transições baseadas em estados)</SelectItem>
          </SelectContent>
        </Select>
         <p className="text-xs text-muted-foreground">Define a estrutura de execução do workflow.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="workflowDescription">Descrição do Workflow</Label>
        <Textarea id="workflowDescription" placeholder="Descreva o objetivo e os passos gerais do workflow. Ex: 'Processar pedido: validar, verificar estoque, enviar email.'" value={workflowDescription} onChange={(e) => setWorkflowDescription(e.target.value)} rows={3}/>
         <p className="text-xs text-muted-foreground">Uma visão geral do que o workflow realiza.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="loopMaxIterations">Máximo de Iterações (para workflows com loops)</Label>
        <Input id="loopMaxIterations" type="number" value={loopMaxIterations === undefined ? "" : String(loopMaxIterations)} onChange={(e) => setLoopMaxIterations(e.target.value === "" ? undefined : Number(e.target.value))} placeholder="Opcional. Ex: 10"/>
         <p className="text-xs text-muted-foreground">Se o workflow contiver loops, defina um limite máximo de iterações para evitar loops infinitos.</p>
      </div>
      {/* TODO: Adicionar mais campos específicos para workflow aqui, como definição de passos/tarefas do workflow, condições de transição, etc. */}
    </>
  );
};

export default WorkflowBehaviorForm;
