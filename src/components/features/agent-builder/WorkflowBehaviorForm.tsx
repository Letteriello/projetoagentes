// WorkflowBehaviorForm: Componente para o formulário de comportamento específico de agentes Workflow.
// Inclui campos para tipo de workflow, descrição e máximo de iterações.

import * as React from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form"; // MODIFIED
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label"; // Label from form will be used
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SavedAgentConfiguration, WorkflowDetailedType } from "@/types/agent-configs"; // MODIFIED
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"; // MODIFIED
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// MODIFIED: No props needed now
interface WorkflowBehaviorFormProps {}

const WorkflowBehaviorForm: React.FC<WorkflowBehaviorFormProps> = () => {
  const { control, formState: { errors }, watch } = useFormContext<SavedAgentConfiguration>(); // MODIFIED

  const detailedWorkflowType = watch("config.detailedWorkflowType");

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
                <li><strong>Loop:</strong> Executa uma série de ferramentas repetidamente até que uma condição de saída seja atendida ou um número máximo de iterações seja alcançado.</li>
                <li><strong>Paralelo:</strong> Permite a execução simultânea de múltiplas ferramentas ou tarefas, útil para operações independentes que podem ser processadas ao mesmo tempo.</li>
                {/* TODO: Add descriptions for graph and stateMachine once implemented */}
              </ul></TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Select onValueChange={field.onChange} value={field.value as WorkflowDetailedType}>
              <FormControl><SelectTrigger id="config.detailedWorkflowType"><SelectValue placeholder="Selecione o tipo de workflow" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="sequential">Sequencial</SelectItem>
                <SelectItem value="loop">Loop</SelectItem>
                <SelectItem value="parallel">Paralelo</SelectItem>
                {/* <SelectItem value="graph">Grafo de Tarefas</SelectItem> */}
                {/* <SelectItem value="stateMachine">Máquina de Estados</SelectItem> */}
              </SelectContent>
            </Select>
            <FormDescription>Define a estrutura de execução do workflow.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {detailedWorkflowType === "sequential" && (
        <div className="p-4 border rounded-md bg-muted text-sm text-muted-foreground">
          Drag-and-drop reordering of tools will be implemented here.
        </div>
      )}

      {detailedWorkflowType === "loop" && (
        <div className="space-y-4 p-4 border rounded-md">
          <FormField
            control={control}
            name="config.loopExitToolName"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild><FormLabel htmlFor="config.loopExitToolName" className="cursor-help">Ferramenta de Saída do Loop</FormLabel></TooltipTrigger>
                    <TooltipContent><p>Esta ferramenta, ao ser executada com sucesso, terminará o loop.</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger id="config.loopExitToolName"><SelectValue placeholder="Selecione a ferramenta de saída" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {/* TODO: Populate with actual agent tools */}
                    <SelectItem value="placeholder-tool">Placeholder Tool</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="config.loopExitStateKey"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild><FormLabel htmlFor="config.loopExitStateKey" className="cursor-help">Chave de Estado de Saída do Loop</FormLabel></TooltipTrigger>
                    <TooltipContent><p>A chave no estado do agente que será verificada para o valor de saída do loop.</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <FormControl><Input id="config.loopExitStateKey" type="text" placeholder="Ex: agent_scratchpad.some_key" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="config.loopExitStateValue"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild><FormLabel htmlFor="config.loopExitStateValue" className="cursor-help">Valor de Estado de Saída do Loop</FormLabel></TooltipTrigger>
                    <TooltipContent><p>Se a chave de estado de saída do loop no estado do agente corresponder a este valor, o loop terminará.</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <FormControl><Input id="config.loopExitStateValue" type="text" placeholder="Ex: loop_completed" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      {detailedWorkflowType === "parallel" && (
        <Alert variant="info">
          <AlertTitle>Workflows Paralelos</AlertTitle>
          <AlertDescription>
            As tarefas em um workflow paralelo devem ser independentes para garantir a execução correta.
          </AlertDescription>
        </Alert>
      )}

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
