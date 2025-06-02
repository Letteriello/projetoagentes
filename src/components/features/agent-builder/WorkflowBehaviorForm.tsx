// WorkflowBehaviorForm: Componente para o formulário de comportamento específico de agentes Workflow.
// Inclui campos para tipo de workflow, descrição e máximo de iterações.

import * as React from "react";
import { useFormContext, Controller, useWatch, useFieldArray } from "react-hook-form"; // MODIFIED
import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label"; // Label from form will be used
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SavedAgentConfiguration, WorkflowDetailedType, TerminationConditionType } from "@/types/agent-configs";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator"; // Separator might not be needed
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Added
import { Loader2 } from "lucide-react"; // Added
import { useToast } from "@/hooks/use-toast"; // Added
import { getAiConfigurationSuggestionsAction } from '@/app/agent-builder/actions'; // Added
import { AiConfigurationAssistantOutputSchema } from '@/ai/flows/aiConfigurationAssistantFlow'; // Added
import AISuggestionIcon from './AISuggestionIcon'; // Added
import { z } from 'zod'; // Added

// MODIFIED: No props needed now
interface WorkflowBehaviorFormProps {}

const WorkflowBehaviorForm: React.FC<WorkflowBehaviorFormProps> = () => {
  const { control, formState: { errors }, watch, setValue, getValues } = useFormContext<SavedAgentConfiguration>(); // Added getValues
  const { toast } = useToast(); // Added

  const detailedWorkflowType = watch("config.detailedWorkflowType");
  const loopTerminationConditionType = watch("config.loopTerminationConditionType");

  // State for AI Suggestions
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<z.infer<typeof AiConfigurationAssistantOutputSchema> | undefined>(undefined);
  const [showWorkflowTypeSuggestionPopover, setShowWorkflowTypeSuggestionPopover] = React.useState(false);
  const [showInconsistencyAlertsPopover, setShowInconsistencyAlertsPopover] = React.useState(false);
  const [currentLoadingContext, setCurrentLoadingContext] = React.useState<"workflowType" | "inconsistencyAlerts" | null>(null);
  const agentTools = watch("tools");
  const agentToolsDetails = watch("toolsDetails");
  const previousDetailedWorkflowType = React.useRef<WorkflowDetailedType | undefined>(detailedWorkflowType);

  const fetchWorkflowSuggestions = async (
    popoverSetter: React.Dispatch<React.SetStateAction<boolean>>,
    context: "workflowType" | "inconsistencyAlerts"
  ) => {
    setCurrentLoadingContext(context);
    setIsLoadingSuggestions(true);
    popoverSetter(false); // Close before fetch
    const currentConfig = getValues();
    try {
      const result = await getAiConfigurationSuggestionsAction(currentConfig, context);
      if (result.success && result.suggestions) {
        setSuggestions(result.suggestions);
        popoverSetter(true); // Open the relevant popover/modal
        toast({ title: "Análise da IA Concluída" });
      } else {
        toast({ title: "Falha na Análise da IA", description: result.error, variant: "destructive" });
        // Clear specific suggestion field on error
        let fieldToClear: keyof AiConfigurationAssistantOutputSchema | undefined = undefined;
        if (context === "workflowType") fieldToClear = "suggestedWorkflowType";
        else if (context === "inconsistencyAlerts") fieldToClear = "inconsistencyAlerts";
        if (fieldToClear) {
          setSuggestions(prev => ({ ...prev, [fieldToClear!]: undefined }));
        } else {
          setSuggestions(undefined);
        }
      }
    } catch (e: any) {
      toast({ title: "Erro na Análise da IA", description: e.message, variant: "destructive" });
      setSuggestions(undefined);
    } finally {
      setIsLoadingSuggestions(false);
      setCurrentLoadingContext(null);
    }
  };

  const { fields, append, remove, update, move } = useFieldArray({ // Added move
    control,
    name: "config.sequentialSteps",
  });

  React.useEffect(() => {
    if (detailedWorkflowType === "sequential") {
      const currentSequentialSteps = watch("config.sequentialSteps") || [];
      const toolIdsInSteps = currentSequentialSteps.map(step => step.toolId);

      // Add new tools from agentTools not in sequentialSteps
      agentTools?.forEach(toolId => {
        if (!toolIdsInSteps.includes(toolId)) {
          append({ toolId: toolId, outputKey: "" });
        }
      });

      // Remove tools from sequentialSteps not in agentTools
      currentSequentialSteps.forEach((step, index) => {
        if (!agentTools?.includes(step.toolId)) {
          remove(index);
        }
      });

      // Potentially re-order or update existing ones if agentTools order changes
      // For now, this focuses on adding/removing. Reordering is complex with useFieldArray if not handled carefully.
      // A more robust sync would involve creating a new array and replacing all fields if order is paramount.
      // However, the prompt mentions "maintaining their current order from ToolsTab for now"
      // and "useFieldArray will help manage adding/removing/updating these fields if the underlying tools list changes."
      // This useEffect primarily handles sync when tools are added/removed from the agent globally.
    }
  }, [detailedWorkflowType, agentTools, agentToolsDetails, watch, append, remove]); // Removed setValue from deps as it's stable

  React.useEffect(() => {
    // Only run when detailedWorkflowType actually changes
    if (previousDetailedWorkflowType.current !== detailedWorkflowType) {
      // Reset fields for other workflow types
      if (detailedWorkflowType !== "sequential") {
        setValue("config.sequentialSteps", undefined);
      } else {
        // If switching TO sequential, re-trigger the sync logic for sequentialSteps
        // This logic is already in the useEffect above, but we might need to ensure it runs
        // by potentially clearing and letting the other effect repopulate.
        // For now, the existing effect should handle it if agentTools are already populated.
      }

      if (detailedWorkflowType !== "parallel") {
        setValue("config.parallelSubagentIds", undefined);
      }

      if (detailedWorkflowType !== "loop") {
        setValue("config.loopMaxIterations", undefined);
        setValue("config.loopTerminationConditionType", undefined);
        setValue("config.loopExitToolName", undefined);
        setValue("config.loopExitStateKey", undefined);
        setValue("config.loopExitStateValue", undefined);
      } else {
        // If switching TO loop, set a default for loopTerminationConditionType if it's not already set
        if (!watch("config.loopTerminationConditionType")) {
          setValue("config.loopTerminationConditionType", "none");
        }
      }
      previousDetailedWorkflowType.current = detailedWorkflowType;
    }
  }, [detailedWorkflowType, setValue, watch]);

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
                <div className="flex items-center justify-between">
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
                  <Popover open={showWorkflowTypeSuggestionPopover} onOpenChange={setShowWorkflowTypeSuggestionPopover}>
                    <PopoverTrigger asChild>
                      <AISuggestionIcon
                        onClick={() => fetchWorkflowSuggestions(setShowWorkflowTypeSuggestionPopover, "workflowType")}
                        isLoading={isLoadingSuggestions && currentLoadingContext === "workflowType"}
                        tooltipText="Sugerir tipo de workflow"
                        size={16}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      {isLoadingSuggestions && currentLoadingContext === "workflowType" ? (
                        <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                      ) : suggestions?.suggestedWorkflowType ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-1">Sugestão da IA:</p>
                          <p className="font-semibold mb-3">{suggestions.suggestedWorkflowType.charAt(0).toUpperCase() + suggestions.suggestedWorkflowType.slice(1)}</p>
                          <Button onClick={() => {
                            setValue("config.detailedWorkflowType", suggestions.suggestedWorkflowType as WorkflowDetailedType, { shouldValidate: true, shouldDirty: true });
                            setShowWorkflowTypeSuggestionPopover(false);
                            toast({title: "Tipo de workflow aplicado!"})
                          }} size="sm">Aplicar Sugestão</Button>
                        </>
                      ) : <p className="text-sm py-2">Nenhuma sugestão disponível ou falha ao carregar.</p>}
                    </PopoverContent>
                  </Popover>
                </div>
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
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Sequential Workflow Configuration</CardTitle>
                <CardDescription>
                  Define the order and output handling for tools in a sequential workflow.
                  Each tool will execute one after another. Use the "Move Up" and "Move Down" buttons to reorder the steps.
                  You can specify an "Output Key" for each tool if you need to reference its output in subsequent tools or steps (e.g., using {'{{stepName.outputKey}}'} in prompts).
                </CardDescription>
              </div>
              <Popover open={showInconsistencyAlertsPopover} onOpenChange={setShowInconsistencyAlertsPopover}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => fetchWorkflowSuggestions(setShowInconsistencyAlertsPopover, "inconsistencyAlerts")} disabled={isLoadingSuggestions && currentLoadingContext === "inconsistencyAlerts"}>
                    {(isLoadingSuggestions && currentLoadingContext === "inconsistencyAlerts") ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Analisar Etapas
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 max-h-80 overflow-y-auto">
                  <h4 className="font-medium text-sm mb-2">Alertas de Inconsistência das Etapas</h4>
                  {(isLoadingSuggestions && currentLoadingContext === "inconsistencyAlerts") ? (
                     <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : suggestions?.inconsistencyAlerts && suggestions.inconsistencyAlerts.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {suggestions.inconsistencyAlerts.map((alert, index) => <li key={index} className="text-xs">{alert}</li>)}
                    </ul>
                  ) : <p className="text-xs py-2">Nenhum alerta de inconsistência encontrado ou falha ao carregar.</p>}
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && detailedWorkflowType === "sequential" && (
              <Alert variant="info">
                <AlertTitle>No Tools Added</AlertTitle>
                <AlertDescription>
                  This agent currently has no tools selected. Add tools in the "Tools" tab to configure them here for sequential execution.
                </AlertDescription>
              </Alert>
            )}
            {fields.map((item, index) => {
              const toolDetail = agentToolsDetails?.find(td => td.id === item.toolId);
              const toolName = toolDetail?.name || item.toolId;
              return (
                <div key={item.id} className="p-4 border rounded-md space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold">Step {index + 1}: {toolName}</h4>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => move(index, index - 1)}
                        disabled={index === 0}
                      >
                        Move Up
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => move(index, index + 1)}
                        disabled={index === fields.length - 1}
                      >
                        Move Down
                      </Button>
                      {/* Optional: Add a remove button if individual step removal is desired
                      <Button variant="ghost" size="sm" onClick={() => remove(index)}>Remove Step</Button>
                      */}
                    </div>
                  </div>
                  <FormField
                    control={control}
                    name={`config.sequentialSteps.${index}.outputKey`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor={`config.sequentialSteps.${index}.outputKey`}>Output Key (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            id={`config.sequentialSteps.${index}.outputKey`}
                            placeholder="e.g., 'summaryOutput' or 'extractedData'"
                            {...field}
                            value={field.value || ""} // Ensure controlled component
                          />
                        </FormControl>
                        <FormDescription>
                          If you need this step's output later, give it a unique key. Example: <code>search_results</code>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
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
              name="config.loopTerminationConditionType"
              render={({ field }) => (
                <FormItem>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild><FormLabel htmlFor="config.loopTerminationConditionType" className="cursor-help">Loop Termination Condition</FormLabel></TooltipTrigger>
                      <TooltipContent className="w-80">
                        <p>Determines how the loop will end:</p>
                        <ul className="list-disc space-y-1 pl-4 mt-1">
                          <li><strong>Max Iterations:</strong> Loop ends after a specific number of cycles.</li>
                          <li><strong>Tool Success:</strong> Loop ends when a designated tool executes successfully.</li>
                          <li><strong>State Change:</strong> Loop ends when a specific key in the agent's state matches a defined value.</li>
                          <li><strong>None:</strong> Loop runs indefinitely or until manually stopped (use with caution).</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Select onValueChange={field.onChange} value={field.value as TerminationConditionType}>
                    <FormControl><SelectTrigger id="config.loopTerminationConditionType"><SelectValue placeholder="Select termination condition" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="max_iterations">Max Iterations</SelectItem>
                      <SelectItem value="tool_success">Tool Success</SelectItem>
                      <SelectItem value="state_change">State Change</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Specify the condition that will terminate the loop.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {loopTerminationConditionType === "max_iterations" && (
              <FormField
                control={control}
                name="config.loopMaxIterations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="config.loopMaxIterations">Maximum Loop Iterations</FormLabel>
                    <FormControl>
                      <Input
                        id="config.loopMaxIterations"
                        type="number"
                        placeholder="Enter maximum iterations (e.g., 10)"
                        {...field}
                        value={field.value === undefined ? "" : String(field.value)}
                        onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Set the maximum number of times the loop will execute.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {loopTerminationConditionType === "tool_success" && (
              <FormField
                control={control}
                name="config.loopExitToolName"
                render={({ field }) => (
                  <FormItem>
                    <TooltipProvider> <Tooltip> <TooltipTrigger asChild><FormLabel htmlFor="config.loopExitToolName" className="cursor-help">Loop Exit Tool</FormLabel></TooltipTrigger> <TooltipContent><p>This tool, upon its successful execution, will terminate the loop. Select from the available tools for this agent.</p></TooltipContent> </Tooltip> </TooltipProvider>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger id="config.loopExitToolName"><SelectValue placeholder="Select the tool that signals loop termination" /></SelectTrigger></FormControl>
                      <SelectContent> {/* TODO: Populate with actual agent tools */} <SelectItem value="placeholder-tool">Placeholder: Tool Name (e.g., data_validator)</SelectItem> </SelectContent>
                    </Select>
                    <FormDescription>The loop will end if this tool executes successfully.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {loopTerminationConditionType === "state_change" && (
              <>
                <FormField
                  control={control}
                  name="config.loopExitStateKey"
                  render={({ field }) => (
                    <FormItem>
                      <TooltipProvider> <Tooltip> <TooltipTrigger asChild><FormLabel htmlFor="config.loopExitStateKey" className="cursor-help">Loop Exit State Key</FormLabel></TooltipTrigger> <TooltipContent><p>The specific key within the agent's state (e.g., from agent scratchpad or memory) that will be monitored. Example: <code>agent_data.status</code></p></TooltipContent> </Tooltip> </TooltipProvider>
                      <FormControl><Input id="config.loopExitStateKey" type="text" placeholder="Enter state key to check (e.g., agent_scratchpad.job_status)" {...field} /></FormControl>
                      <FormDescription>The key in the agent's state to check for the termination value.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="config.loopExitStateValue"
                  render={({ field }) => (
                    <FormItem>
                      <TooltipProvider> <Tooltip> <TooltipTrigger asChild><FormLabel htmlFor="config.loopExitStateValue" className="cursor-help">Loop Exit State Value</FormLabel></TooltipTrigger> <TooltipContent><p>The loop will terminate if the value of the 'Loop Exit State Key' matches this value. Example: <code>COMPLETED</code></p></TooltipContent> </Tooltip> </TooltipProvider>
                      <FormControl><Input id="config.loopExitStateValue" type="text" placeholder="Enter the value that signals termination (e.g., FINISHED)" {...field} /></FormControl>
                      <FormDescription>The value the state key must have to terminate the loop.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {detailedWorkflowType === "parallel" && (
         <Card>
          <CardHeader>
            <CardTitle>Parallel Workflow</CardTitle>
            <CardDescription>Configure subagents that will run in parallel. Ensure these subagents can operate independently.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="info">
              <AlertTitle>Important Considerations for Parallel Execution</AlertTitle>
              <AlertDescription>
                Subagents in a parallel workflow must be independent and should not rely on shared state or sequential execution order from other parallel branches. Each subagent will operate in isolation.
              </AlertDescription>
            </Alert>
            <FormField
              control={control}
              name="config.parallelSubagentIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="config.parallelSubagentIds">Subagents for Parallel Execution</FormLabel>
                  <FormControl>
                    <Textarea
                      id="config.parallelSubagentIds"
                      placeholder="Enter comma-separated subagent IDs (e.g., agent_id_1, agent_id_2, agent_id_3)"
                      {...field}
                      value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                      onChange={e => {
                        const value = e.target.value;
                        field.onChange(value ? value.split(",").map(id => id.trim()) : []);
                      }}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the IDs of subagents that will be executed in parallel.
                    This will be improved with a multi-select component in the future.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default WorkflowBehaviorForm;
