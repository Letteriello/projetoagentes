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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card components
import { Separator } from "@/components/ui/separator"; // Added Separator

// MODIFIED: No props needed now
interface WorkflowBehaviorFormProps {}

const WorkflowBehaviorForm: React.FC<WorkflowBehaviorFormProps> = () => {
  const { control, formState: { errors }, watch } = useFormContext<SavedAgentConfiguration>(); // MODIFIED

  const detailedWorkflowType = watch("config.detailedWorkflowType");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Workflow Configuration</CardTitle>
          <CardDescription>Define the structure, type, and general behavior of the workflow agent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={control}
            name="config.detailedWorkflowType"
            render={({ field }) => (
              <FormItem>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild><FormLabel htmlFor="config.detailedWorkflowType" className="cursor-help">Workflow Type</FormLabel></TooltipTrigger>
                    <TooltipContent className="w-80"><ul className="list-disc space-y-1 pl-4">
                    <li><strong>Sequential:</strong> Steps executed in linear order.</li>
                    <li><strong>Loop:</strong> Executes a series of tools repeatedly until an exit condition is met or a maximum number of iterations is reached.</li>
                    <li><strong>Parallel:</strong> Allows simultaneous execution of multiple tools or tasks, useful for independent operations.</li>
                  </ul></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Select onValueChange={field.onChange} value={field.value as WorkflowDetailedType}>
                  <FormControl><SelectTrigger id="config.detailedWorkflowType"><SelectValue placeholder="Select workflow type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="sequential">Sequential</SelectItem>
                    <SelectItem value="loop">Loop</SelectItem>
                    <SelectItem value="parallel">Parallel</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Defines the workflow execution structure.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="config.workflowDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="config.workflowDescription">Workflow Description</FormLabel>
                <FormControl><Textarea id="config.workflowDescription" placeholder="Describe the objective and steps..." {...field} rows={3}/></FormControl>
                <FormDescription>An overview of what the workflow accomplishes.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {detailedWorkflowType === "sequential" && (
        <Card>
          <CardHeader>
            <CardTitle>Sequential Workflow</CardTitle>
            <CardDescription>Tools in a sequential workflow are executed in order. Reordering will be available here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 border rounded-md bg-muted text-sm text-muted-foreground">
              Drag-and-drop reordering of tools will be implemented here.
            </div>
          </CardContent>
        </Card>
      )}

      {detailedWorkflowType === "loop" && (
        <Card>
          <CardHeader>
            <CardTitle>Loop Configuration</CardTitle>
            <CardDescription>Settings for loop-based workflows, including termination conditions and iteration limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={control}
              name="config.loopExitToolName"
              render={({ field }) => (
                <FormItem>
                  <TooltipProvider> <Tooltip> <TooltipTrigger asChild><FormLabel htmlFor="config.loopExitToolName" className="cursor-help">Loop Exit Tool</FormLabel></TooltipTrigger> <TooltipContent><p>This tool, upon successful execution, will terminate the loop.</p></TooltipContent> </Tooltip> </TooltipProvider>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger id="config.loopExitToolName"><SelectValue placeholder="Select exit tool" /></SelectTrigger></FormControl>
                    <SelectContent> {/* TODO: Populate with actual agent tools */} <SelectItem value="placeholder-tool">Placeholder Tool</SelectItem> </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="config.loopExitStateKey"
              render={({ field }) => (
                <FormItem>
                  <TooltipProvider> <Tooltip> <TooltipTrigger asChild><FormLabel htmlFor="config.loopExitStateKey" className="cursor-help">Loop Exit State Key</FormLabel></TooltipTrigger> <TooltipContent><p>The key in the agent's state that will be checked for the loop exit value.</p></TooltipContent> </Tooltip> </TooltipProvider>
                  <FormControl><Input id="config.loopExitStateKey" type="text" placeholder="Ex: agent_scratchpad.some_key" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="config.loopExitStateValue"
              render={({ field }) => (
                <FormItem>
                  <TooltipProvider> <Tooltip> <TooltipTrigger asChild><FormLabel htmlFor="config.loopExitStateValue" className="cursor-help">Loop Exit State Value</FormLabel></TooltipTrigger> <TooltipContent><p>If the loop exit state key in the agent's state matches this value, the loop will terminate.</p></TooltipContent> </Tooltip> </TooltipProvider>
                  <FormControl><Input id="config.loopExitStateValue" type="text" placeholder="Ex: loop_completed" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={control}
              name="config.loopMaxIterations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="config.loopMaxIterations">Max Iterations</FormLabel>
                  <FormControl>
                    <Input
                      id="config.loopMaxIterations"
                      type="number"
                      placeholder="Optional. Ex: 10"
                      {...field}
                      value={field.value === undefined ? "" : String(field.value)}
                      onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Set a limit for loops within the workflow.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      )}

      {detailedWorkflowType === "parallel" && (
         <Card>
          <CardHeader>
            <CardTitle>Parallel Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="info">
              <AlertTitle>Parallel Workflow Information</AlertTitle>
              <AlertDescription>
                Tasks in a parallel workflow should be independent to ensure correct execution. Configuration for parallel tasks will be available here.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default WorkflowBehaviorForm;
