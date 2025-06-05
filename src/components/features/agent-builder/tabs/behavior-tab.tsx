import React, { useMemo } from 'react'; // Import useMemo
import { useFormContext, Controller } from 'react-hook-form'; // Import Controller
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  // FormControl is used within the render prop of FormFieldWithLabel
} from '@/components/ui/form';
import FormFieldWithLabel from '@/components/ui/extended/FormFieldWithLabel'; // Import new component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
// Tooltip components are now used by FormFieldWithLabel
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Textarea might be used by workflow description
import type { SavedAgentConfiguration, LLMAgentConfig } from '@/types/agent-types'; // Changed import
// Remove aiModels and AIModel, will be replaced by llmModels
// import { aiModels, AIModel } from '@/data/ai-models';
import { llmModels } from '@/data/llm-models'; // Import the new llmModels
import type { LLMModelDetails } from '@/types/agent-configs-new'; // Import LLMModelDetails for type safety
import { WorkflowDetailedType } from '@/types/agent-configs-new'; // Kept for workflow type selection
import { InfoIcon } from '@/components/ui/InfoIcon'; // Keep for other uses if any
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2, Info } from 'lucide-react'; // Removed ClipboardCopy, History
// import { toast } from '@/hooks/use-toast'; // Removed toast, as its usages were removed
import { debounce } from '../../../../lib/utils'; // Import debounce
// import { MAX_SYSTEM_PROMPT_LENGTH } from '@/lib/zod-schemas'; // Removed, was for system prompt preview
// import { CodeBlock } from '@/components/features/chat/CodeBlock'; // Removed, was for system prompt preview

interface BehaviorTabProps {
  agentToneOptions: string[];
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
  onGetAiSuggestions?: () => void;
  isSuggesting?: boolean;
  // New props for manual system prompt editing
  isSystemPromptManuallyEdited: boolean;
  setIsSystemPromptManuallyEdited: React.Dispatch<React.SetStateAction<boolean>>;
  children?: React.ReactNode; // Added to allow PromptBuilder to be passed as a child
}

type FormContextType = SavedAgentConfiguration;

// Enum values for WorkflowDetailedType - ensure this matches your type definition
const workflowDetailedTypeOptions: { label: string; value: WorkflowDetailedType }[] = [
  { label: "Sequential", value: "sequential" },
  // Removed Label component from here as it's not used directly, FormLabel is used.
  // import { Label } from '@/components/ui/label';
  { label: "Parallel", value: "parallel" },
  { label: "Loop", value: "loop" },
  { label: "Graph", value: "graph" },
  { label: "State Machine", value: "stateMachine" },
];

export default function BehaviorTab({
  agentToneOptions,
  showHelpModal,
  onGetAiSuggestions,
  isSuggesting,
  isSystemPromptManuallyEdited,
  setIsSystemPromptManuallyEdited,
  children, // Destructure children
}: BehaviorTabProps) {
  const methods = useFormContext<FormContextType>();
  const { control, watch } = methods; // Removed getValues, setValue if not directly used here
  const agentType = watch('config.type');
  // systemPromptGenerated, manualSystemPromptOverride, systemPromptHistory are now managed by PromptBuilder or not needed here
  // handleCopySystemPrompt is also part of PromptBuilder's concerns if it's about the preview there.

  return (
    <div className="space-y-6">
      {/* Render children (PromptBuilder will be passed here) */}
      {children}

      {/* LLM Specific Fields NOT covered by PromptBuilder (e.g., Model selection, Temp, TopK, TopP, CFC) */}
      {/* These fields were previously mixed with prompt fields. Now they are separated. */}
      {agentType === 'llm' && (
        <>
          {/* AI Model, Temp, TopK, TopP, CFC, etc. fields from the original BehaviorTab */}
          {/* These are NOT part of PromptBuilder, so they remain here. */}
          <FormField
            control={control}
            name="config.agentModel"
            render={({ field }) => (
              <FormItem>
                 <div className="flex items-center space-x-2">
                  <FormLabel>Agent Model</FormLabel>
                  <InfoIcon
                    tooltipText={agentBuilderHelpContent.behaviorTab.agentModel.tooltip}
                    onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'agentModel' })}
                  />
                </div>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an AI model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[400px] overflow-y-auto">
                    {Object.entries(
                      llmModels.reduce((acc, model) => {
                        const providerKey = model.provider || 'Unknown Provider';
                        if (!acc[providerKey]) {
                          acc[providerKey] = [];
                        }
                        acc[providerKey].push(model);
                        return acc;
                      }, {} as Record<string, LLMModelDetails[]>)
                    ).map(([provider, models]) => (
                      <SelectGroup key={provider}>
                        <SelectLabel>{provider}</SelectLabel>
                        {models.map((model) => (
                          <TooltipProvider key={model.id} delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <SelectItem value={model.id}>
                                  {model.name}
                                </SelectItem>
                              </TooltipTrigger>
                              <TooltipContent side="right" align="start" className="w-80 z-50">
                                <div className="font-bold text-lg mb-2">{model.name}</div>
                                <div className="text-sm space-y-1">
                                  <p><span className="font-semibold">Provider:</span> {model.provider}</p>
                                  {model.estimatedCost && (
                                    <p><span className="font-semibold">Est. Cost:</span>
                                      {model.estimatedCost.input ? ` $${model.estimatedCost.input.toFixed(5)}/in` : ''}
                                      {model.estimatedCost.output ? ` $${model.estimatedCost.output.toFixed(5)}/out` : ''}
                                      {` per ${model.estimatedCost.unit?.includes('TOKEN') ? '1K tokens' : (model.estimatedCost.unit?.includes('CHAR') ? '1K chars' : model.estimatedCost.unit )}`}
                                    </p>
                                  )}
                                  <p><span className="font-semibold">Max Output Tokens:</span> {model.maxOutputTokens || 'N/A'}</p>
                                  <p><span className="font-semibold">Capabilities:</span>
                                    {model.capabilities?.streaming ? " Streaming" : ""}
                                    {model.capabilities?.tools ? ", Tools" : ""}
                                    {(model.capabilities as any)?.vision ? ", Vision" : ""}
                                    {(model.capabilities?.tools || (model.capabilities as any)?.vision) && model.capabilities?.streaming === undefined ? "" : ""}
                                  </p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="config.topK"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Top K</FormLabel>
                  <InfoIcon tooltipText="Controla a aleatoriedade..." />
                </div>
                <FormControl>
                  <Input
                    type="number" {...field} placeholder="Ex: 40"
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                    step="1"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="config.maxOutputTokens"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Token Limit / Max Output Tokens</FormLabel>
                  <InfoIcon tooltipText="Define o número máximo de tokens..." />
                </div>
                <FormControl>
                  <Input
                    type="number" {...field} placeholder="Ex: 2048"
                    value={field.value ?? ''}
                    onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="config.topP"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Top P</FormLabel>
                  <InfoIcon tooltipText="Controla a diversidade..." />
                </div>
                <FormControl>
                  <div className="flex flex-col space-y-2 pt-2">
                    <Controller
                      name="config.topP" control={control}
                      render={({ field: controllerField }) => {
                        const val = typeof controllerField.value === 'number' ? controllerField.value : undefined;
                        const debouncedSliderChange = useMemo(() => debounce((sliderValue: number[]) => {
                          controllerField.onChange(sliderValue[0] === 1 ? undefined : sliderValue[0]);
                        }, 300), [controllerField.onChange]);
                        return (
                          <>
                            <Slider min={0.01} max={1} step={0.01} value={val !== undefined ? [val] : [1]} onValueChange={debouncedSliderChange} />
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Value: {val !== undefined ? val.toFixed(2) : "Default (1.0)"}</span>
                              <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => controllerField.onChange(val === undefined ? 0.9 : undefined)}>
                                {val === undefined ? "Set (e.g. 0.9)" : "Use Default"}
                              </Button>
                            </div>
                          </>
                        );
                      }}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="config.agentTemperature"
            render={({ field }) => {
              const debouncedOnChange = useMemo(() => debounce(field.onChange, 300), [field.onChange]);
              return (
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormLabel>Agent Temperature (Creativity)</FormLabel>
                    <InfoIcon tooltipText={agentBuilderHelpContent.behaviorTab.agentTemperature.tooltip} onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'agentTemperature' })} />
                  </div>
                  <FormControl>
                    <div className="flex flex-col space-y-2 pt-2">
                      <Slider min={0} max={1} step={0.01} value={[typeof field.value === 'number' ? field.value : 0.7]} onValueChange={(value) => debouncedOnChange(value[0])} />
                      <div className="text-center text-sm text-muted-foreground">
                        Value: {(typeof field.value === 'number' ? field.value : 0.7).toFixed(2)} (0: Precise, 1: Creative)
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {onGetAiSuggestions && (
            <div className="mt-6 pt-6 border-t">
               <h3 className="text-lg font-medium mb-2">Assistente de Configuração IA</h3>
               <p className="text-sm text-muted-foreground mb-4">
                Obtenha sugestões da IA para personalidade, restrições, modelo, temperatura e ferramentas com base no objetivo e tarefas definidos para o agente (via PromptBuilder).
               </p>
              <Button type="button" onClick={onGetAiSuggestions} disabled={isSuggesting} className="w-full sm:w-auto">
                {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Sugerir Configurações (IA)
              </Button>
            </div>
          )}

          <FormField
            control={control}
            name="config.enableCompositionalFunctionCalling"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4 bg-background">
                <div className="space-y-0.5">
                  <FormLabel>Habilitar Compositional Function Calling (CFC)</FormLabel>
                  <FormDescription>Sinaliza que o LLM pode orquestrar múltiplas chamadas de ferramentas.</FormDescription>
                </div>
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
          {/* System Prompt Preview and manual editing UI has been moved to PromptBuilder.tsx */}
          {/* Copy system prompt button also moved to PromptBuilder or handled within its context. */}
        </>
      )}

      {/* Workflow Specific Fields */}
      {agentType === 'workflow' && (
        <>
          <FormField
            control={control}
            name="config.workflowType"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Workflow Type</FormLabel>
                  <InfoIcon
                    tooltipText={agentBuilderHelpContent.behaviorTab.workflowType.tooltip}
                    onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'workflowType' })}
                  />
                </div>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select workflow type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {workflowDetailedTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="config.workflowDescription"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Workflow Description</FormLabel>
                  <InfoIcon
                    tooltipText={agentBuilderHelpContent.behaviorTab.workflowDescription.tooltip}
                    onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'workflowDescription' })}
                  />
                </div>
                <FormControl>
                  <Textarea {...field} placeholder="Describe the workflow..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* TODO: Add fields for subAgents, workflowConfig */}
        </>
      )}

      {/* Message for other agent types */}
      {agentType !== 'llm' && agentType !== 'workflow' && (
        <div className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">
          Behavior settings beyond common Goal and Tasks are specific to LLM or Workflow agent types.
          For 'Custom' agents, define behavior within the custom logic.
          For 'A2A Specialist' agents, core behavior is defined by their specialized role and skills.
        </div>
      )}
    </div>
  );
}
