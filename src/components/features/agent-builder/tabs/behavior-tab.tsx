import React, { useMemo } from 'react'; // Import useMemo
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { SavedAgentConfiguration } from '@/types/agent-types'; // Changed import
import { aiModels, AIModel } from '@/data/ai-models'; // Import AI Models
import { WorkflowDetailedType } from '@/types/agent-configs-new'; // Kept for now, verify if needed
import { InfoIcon } from '@/components/ui/InfoIcon';
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2, ClipboardCopy } from 'lucide-react'; // Added ClipboardCopy
import { toast } from '@/hooks/use-toast'; // Added toast
import { debounce } from '../../../../lib/utils'; // Import debounce

interface BehaviorTabProps {
  agentToneOptions: string[];
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
  onGetAiSuggestions?: () => void;
  isSuggesting?: boolean;
}

type FormContextType = SavedAgentConfiguration;

// Enum values for WorkflowDetailedType - ensure this matches your type definition
const workflowDetailedTypeOptions: { label: string; value: WorkflowDetailedType }[] = [
  { label: "Sequential", value: "sequential" },
  { label: "Parallel", value: "parallel" },
  { label: "Loop", value: "loop" },
  { label: "Graph", value: "graph" },
  { label: "State Machine", value: "stateMachine" },
];

export default function BehaviorTab({ agentToneOptions, showHelpModal, onGetAiSuggestions, isSuggesting }: BehaviorTabProps) {
  const methods = useFormContext<FormContextType>();
  const { control, watch, getValues } = methods; // Destructure getValues here
  const agentType = watch('config.type');

  const handleCopySystemPrompt = () => {
    const systemPrompt = getValues().config?.systemPromptGenerated;
    if (systemPrompt) {
      navigator.clipboard.writeText(systemPrompt)
        .then(() => {
          toast({ title: "Sucesso!", description: "Prompt do sistema copiado para a área de transferência." });
        })
        .catch(err => {
          console.error("Failed to copy system prompt: ", err);
          toast({ title: "Erro", description: "Falha ao copiar o prompt do sistema.", variant: "destructive" });
        });
    } else {
      toast({ title: "Atenção", description: "Nenhum prompt do sistema gerado para copiar.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Common Fields: agentGoal and agentTasks */}
      <FormField
        control={control}
        name="config.agentGoal"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center space-x-2">
              <FormLabel>Agent Goal</FormLabel>
              <InfoIcon
                tooltipText={agentBuilderHelpContent.behaviorTab.agentGoal.tooltip}
                onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'agentGoal' })}
              />
            </div>
            <FormControl>
              <Textarea {...field} placeholder="Define the primary goal for this agent..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="config.agentTasks" // This will be a string from textarea, Zod schema expects string[]
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center space-x-2">
              <FormLabel>Agent Tasks (one per line)</FormLabel>
               <InfoIcon
                tooltipText={agentBuilderHelpContent.behaviorTab.agentTasks.tooltip}
                onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'agentTasks' })}
              />
            </div>
            <FormControl>
              <Textarea
                {...field}
                placeholder="List the specific tasks the agent needs to perform, one per line."
                rows={4}
                // Convert array to string for display, and string to array on change if needed by schema
                // For now, Zod schema for agentTasks: z.array(z.string()) will likely fail for a direct string.
                // This would require a .transform in Zod or a custom component.
                // Or, change Zod schema for agentTasks to z.string() for this simple case.
                // For this iteration, we pass the raw string value.
                value={Array.isArray(field.value) ? field.value.join('\n') : field.value || ''}
                onChange={(e) => {
                  // field.onChange(e.target.value.split('\n').filter(task => task.trim() !== '')); // Example to send array
                  field.onChange(e.target.value); // Send string for now
                }}
              />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-muted-foreground">
              Note: Validation for tasks currently expects a direct string. Array conversion is illustrative.
            </p>
          </FormItem>
        )}
      />

      {/* LLM Specific Fields */}
      {agentType === 'llm' && (
        <>
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
                  <SelectContent className="max-h-[400px] overflow-y-auto"> {/* Added max-height and scroll */}
                    {Object.entries(
                      aiModels.reduce((acc, model) => {
                        if (!acc[model.provider]) {
                          acc[model.provider] = [];
                        }
                        acc[model.provider].push(model);
                        return acc;
                      }, {} as Record<string, AIModel[]>)
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
                              <TooltipContent side="right" align="start" className="w-80 z-50"> {/* Added z-index */}
                                <div className="font-bold text-lg mb-2">{model.name}</div>
                                <div className="text-sm space-y-1">
                                  <p><span className="font-semibold">Provider:</span> {model.provider}</p>
                                  <p><span className="font-semibold">Price:</span> {model.price}</p>
                                  <p><span className="font-semibold">Use Cases:</span> {model.useCases}</p>
                                  {model.strengths && <p><span className="font-semibold">Strengths:</span> {model.strengths}</p>}
                                  {model.limitations && <p><span className="font-semibold">Limitations:</span> {model.limitations}</p>}
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
            name="config.agentPersonality"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Agent Personality/Tone</FormLabel>
                  <InfoIcon
                    tooltipText={agentBuilderHelpContent.behaviorTab.agentPersonality.tooltip}
                    onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'agentPersonality' })}
                  />
                </div>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select personality" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {agentToneOptions.map(tone => (
                      <SelectItem key={tone} value={tone.toLowerCase()}>
                        {tone}
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
            name="config.agentTemperature"
            render={({ field }) => {
              const debouncedOnChange = useMemo(() => {
                return debounce(field.onChange, 300);
              }, [field.onChange]);

              return (
                <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Agent Temperature (Creativity)</FormLabel>
                  <InfoIcon
                    tooltipText={agentBuilderHelpContent.behaviorTab.agentTemperature.tooltip}
                    onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'agentTemperature' })}
                  />
                </div>
                <FormControl>
                  <div className="flex flex-col space-y-2 pt-2"> {/* Added pt-2 for spacing */}
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[typeof field.value === 'number' ? field.value : 0.7]} // Ensure value is number
                      onValueChange={(value) => debouncedOnChange(value[0])}
                    />
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
          {/* TODO: Add fields for agentRestrictions, modelSafetySettings, maxHistoryTokens, maxTokensPerResponse */}

          {/* AI Suggestions Button */}
          {onGetAiSuggestions && agentType === 'llm' && (
            <div className="mt-6 pt-6 border-t">
               <h3 className="text-lg font-medium mb-2">Assistente de Configuração IA</h3>
               <p className="text-sm text-muted-foreground mb-4">
                Obtenha sugestões da IA para personalidade, restrições, modelo, temperatura e ferramentas com base no objetivo e tarefas definidos para o agente.
               </p>
              <Button type="button" onClick={onGetAiSuggestions} disabled={isSuggesting} className="w-full sm:w-auto">
                {isSuggesting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Sugerir Configurações de Comportamento (IA)
              </Button>
               <p className="text-xs text-muted-foreground mt-2">
                Certifique-se de que o "Agent Goal" e "Agent Tasks" estejam preenchidos para melhores sugestões.
              </p>
            </div>
          )}

          {/* Copy System Prompt Button */}
          {agentType === 'llm' && (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopySystemPrompt}
              >
                <ClipboardCopy className="mr-2 h-4 w-4" />
                Copiar Prompt do Sistema
              </Button>
            </div>
          )}
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
