// WorkflowBehaviorForm: Componente para o formulário de comportamento específico de agentes Workflow.
// Inclui campos para tipo de workflow, descrição e máximo de iterações.

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form"; // MODIFIED
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SavedAgentConfiguration, WorkflowDetailedType } from "@/types/agent-configs"; // MODIFIED
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"; // MODIFIED

// MODIFIED: No props needed now
interface WorkflowBehaviorFormProps {}

const WorkflowBehaviorForm: React.FC<WorkflowBehaviorFormProps> = () => {
  const { control, formState: { errors } } = useFormContext<SavedAgentConfiguration>(); // MODIFIED

  return (
    <>
      <FormField
        control={control}
        name="config.detailedWorkflowType"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild><FormLabel htmlFor="config.detailedWorkflowType" className="cursor-help">Tipo de Workflow</FormLabel></TooltipTrigger>
                <TooltipContent className="w-80"><ul className="list-disc space-y-1 pl-4">
                <li><strong>Sequencial:</strong> Passos executados em ordem linear.</li>
                <li><strong>Grafo de Tarefas:</strong> Para fluxos complexos onde os passos podem ter múltiplas dependências e não seguem uma ordem estritamente linear. (Exige definição de dependências entre tarefas).</li>
                <li><strong>Máquina de Estados:</strong> O fluxo transita entre diferentes estados com base em condições ou resultados de tarefas. (Exige definição de estados e transições).</li>
              </ul></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Select onValueChange={field.onChange} value={field.value as WorkflowDetailedType}>
              <FormControl><SelectTrigger id="config.detailedWorkflowType"><SelectValue placeholder="Selecione o tipo de workflow" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="sequential">Sequencial</SelectItem>
                <SelectItem value="graph">Grafo de Tarefas</SelectItem>
                <SelectItem value="stateMachine">Máquina de Estados</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>Define a estrutura de execução do workflow.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="config.workflowDescription"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor="config.workflowDescription">Descrição do Workflow</FormLabel>
            <FormControl><Textarea id="config.workflowDescription" placeholder="Descreva o objetivo e os passos..." {...field} rows={3}/></FormControl>
            <FormDescription>Uma visão geral do que o workflow realiza.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="config.loopMaxIterations"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor="config.loopMaxIterations">Máximo de Iterações (para workflows com loops)</FormLabel>
            <FormControl>
              <Input
                id="config.loopMaxIterations"
                type="number"
                placeholder="Opcional. Ex: 10"
                {...field}
                value={field.value === undefined ? "" : String(field.value)}
                onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
              />
            </FormControl>
            <FormDescription>Se o workflow contiver loops, defina um limite.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
export default WorkflowBehaviorForm;
