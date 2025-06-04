import React, { useMemo } from 'react'; // Import useMemo
import { useFormContext, Controller } from 'react-hook-form'; // Import Controller
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormControl, // Ensure FormControl is imported
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { SavedAgentConfiguration, LLMAgentConfig } from '@/types/agent-types'; // Changed import
// Remove aiModels and AIModel, will be replaced by llmModels
// import { aiModels, AIModel } from '@/data/ai-models';
import { llmModels } from '@/data/llm-models'; // Import the new llmModels
import type { LLMModelDetails } from '@/types/agent-configs-new'; // Import LLMModelDetails for type safety
import { WorkflowDetailedType } from '@/types/agent-configs-new'; // Kept for now, verify if needed
import { InfoIcon } from '@/components/ui/InfoIcon'; // Keep for other uses if any
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2, ClipboardCopy, Info, History } from 'lucide-react'; // Added Info, History, ClipboardCopy
import { toast } from '@/hooks/use-toast'; // Added toast
import { debounce } from '../../../../lib/utils'; // Import debounce
import { MAX_SYSTEM_PROMPT_LENGTH } from '@/lib/zod-schemas'; // Import MAX_SYSTEM_PROMPT_LENGTH
import { CodeBlock } from '@/components/features/chat/CodeBlock'; // Import CodeBlock

interface BehaviorTabProps {
  agentToneOptions: string[];
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
  onGetAiSuggestions?: () => void;
  isSuggesting?: boolean;
  // New props for manual system prompt editing
  isSystemPromptManuallyEdited: boolean;
  setIsSystemPromptManuallyEdited: React.Dispatch<React.SetStateAction<boolean>>;
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
}: BehaviorTabProps) {
  const methods = useFormContext<FormContextType>();
  const { control, watch, getValues, setValue } = methods; // Destructure getValues and setValue
  const agentType = watch('config.type');
  const systemPromptGenerated = watch('config.systemPromptGenerated');
  const manualSystemPromptOverride = watch('config.manualSystemPromptOverride');
  const systemPromptHistory = watch('config.systemPromptHistory'); // Watch history

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
              <FormLabel className="flex items-center">
                Agent Goal
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info size={14} className="ml-1.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="max-w-xs">
                        Defina a meta primária que o agente deve alcançar. Isso será usado para formar a declaração de objetivo principal no prompt do sistema. Ex: "Ajudar usuários a encontrar informações sobre produtos."
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              {/* Modal onClick InfoIcon can be added back if needed, or integrated into the new Info icon's onClick */}
            </div>
            <FormControl>
              <Textarea {...field} placeholder="Define the primary goal for this agent..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Agent Tasks - Assuming it's part of LLMAgentConfig and thus rendered when agentType === 'llm' */}
      {/* If it's truly common, it stays outside. If LLM specific, it should be inside the agentType === 'llm' block */}
      <FormField
        control={control}
        name="config.agentTasks"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center space-x-2">
              <FormLabel className="flex items-center">
                Agent Tasks (one per line)
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info size={14} className="ml-1.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="max-w-xs">
                        Liste as tarefas específicas que o agente deve executar para atingir seu objetivo. Cada tarefa será detalhada no prompt do sistema. Ex: "Coletar requisitos do usuário", "Buscar documentação relevante".
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
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
                              <TooltipContent side="right" align="start" className="w-80 z-50"> {/* Added z-index */}
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
                                    {/* Filter out initial comma if no streaming */}
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
            )}
          />

          {/* Top K Field */}
          <FormField
            control={control}
            name="config.topK" // Path for LLMAgentConfig
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Top K</FormLabel>
                  <InfoIcon
                    tooltipText="Controla a aleatoriedade. Reduz o conjunto de tokens considerados para amostragem para os K mais prováveis. Ajuda a prevenir tokens de baixa probabilidade. Deixe vazio para usar o padrão do modelo."
                  />
                </div>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    placeholder="Ex: 40 (padrão do modelo se vazio)"
                    value={field.value ?? ''} // Handle undefined/null case for input display
                    onChange={e => {
                      const value = e.target.value;
                      field.onChange(value === '' ? undefined : parseInt(value, 10));
                    }}
                    step="1" // Integers
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Max Output Tokens Field */}
          <FormField
            control={control}
            name="config.maxOutputTokens" // Path for LLMAgentConfig
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Token Limit / Max Output Tokens</FormLabel>
                  <InfoIcon
                    tooltipText="Define o número máximo de tokens que o modelo pode gerar em uma única resposta. Se não definido, usará o padrão do modelo selecionado ou um padrão global da aplicação."
                    // onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'maxOutputTokens' })} // Add to help content if needed
                  />
                </div>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    placeholder="Ex: 2048 (padrão do modelo se vazio)"
                    value={field.value ?? ''} // Handle undefined/null case for input display
                    onChange={e => {
                      const value = e.target.value;
                      // Allow clearing the input (sets to undefined), or parse to int
                      field.onChange(value === '' ? undefined : parseInt(value, 10));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

            )}
          />

          {/* Top P Field */}
          <FormField
            control={control}
            name="config.topP" // Path for LLMAgentConfig
            render={({ field }) => ( // field provided by render is for the specific RHF field registration
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Top P</FormLabel>
                  <InfoIcon
                    tooltipText="Controla a diversidade via amostragem de núcleo. Ex: 0.1 significa que apenas tokens compreendendo os 10% de massa de probabilidade superior são considerados. Ajuda a prevenir tokens de baixa probabilidade. Deixe vazio/1 para usar o padrão do modelo ou desabilitar."
                  />
                </div>
                <FormControl>
                  <div className="flex flex-col space-y-2 pt-2">
                    <Controller
                      name="config.topP" // Controller also needs the name
                      control={control}
                      // defaultValue={undefined} // Let it be undefined initially to signify "model default"
                      render={({ field: controllerField }) => { // field from Controller's render prop
                        const val = typeof controllerField.value === 'number' ? controllerField.value : undefined;
                        const debouncedSliderChange = useMemo(() => {
                            return debounce((sliderValue: number[]) => {
                              // If slider is at max (1), treat as 'undefined' to use model default
                              controllerField.onChange(sliderValue[0] === 1 ? undefined : sliderValue[0]);
                            }, 300);
                        }, [controllerField.onChange]);

                        return (
                          <>
                            <Slider
                              min={0.01}
                              max={1} // Slider max is 1. When value is 1, it implies "use default" or "disabled"
                              step={0.01}
                              value={val !== undefined ? [val] : [1]} // Display 1 if undefined
                              onValueChange={debouncedSliderChange}
                            />
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Value: {val !== undefined ? val.toFixed(2) : "Default (1.0)"}</span>
                              <Button variant="link" size="sm" className="p-0 h-auto"
                                onClick={() => controllerField.onChange(val === undefined ? 0.9 : undefined)}>
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
            name="config.agentPersonality"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel className="flex items-center">
                    Agent Personality/Tone
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Info size={14} className="ml-1.5 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="max-w-xs">
                            Escolha a personalidade que o agente deve adotar. Isso influenciará o tom e o estilo de suas respostas no prompt. Ex: "Um assistente amigável e prestativo".
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
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
          {/* Agent Restrictions Field - To be added if not present, or modified if it is */}
          {/* Assuming agentRestrictions is an array of strings, typically handled by a TagInput or similar */}
          {/* For now, let's represent it with a Textarea similar to agentTasks for simplicity if TagInput isn't used */}
          <FormField
            control={control}
            name="config.agentRestrictions"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel className="flex items-center">
                    Agent Restrictions (one per line)
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <Info size={14} className="ml-1.5 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="max-w-xs">
                            Defina quaisquer restrições ou regras que o agente deve seguir estritamente. Estas serão listadas como diretivas no prompt. Ex: "Não fornecer aconselhamento financeiro", "Manter as respostas concisas".
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                </div>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="List the specific restrictions for the agent, one per line."
                    rows={3}
                    value={Array.isArray(field.value) ? field.value.join('\n') : field.value || ''}
                    onChange={(e) => {
                      // field.onChange(e.target.value.split('\n').filter(restriction => restriction.trim() !== '')); // Example for array
                      field.onChange(e.target.value); // Send string for now
                    }}
                  />
                </FormControl>
                <FormMessage />
                 <p className="text-xs text-muted-foreground">
                    Note: Restrictions are expected as a direct string input here.
                </p>
              </FormItem>
            )}
          />
          {/* End of Agent Restrictions Field */}

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

          {/* Compositional Function Calling Checkbox */}
          {agentType === 'llm' && (
            <FormField
              control={control}
              name="config.enableCompositionalFunctionCalling"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4 bg-background">
                  <div className="space-y-0.5">
                    <FormLabel>Habilitar Compositional Function Calling (CFC)</FormLabel>
                    <FormDescription>
                      Sinaliza que o LLM pode orquestrar múltiplas chamadas de ferramentas em um único turno.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
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

          {/* System Prompt Preview and Edit Section */}
          {agentType === 'llm' && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FormLabel>Preview do Prompt do Sistema</FormLabel>
                  <InfoIcon
                    tooltipText="Este é o prompt do sistema que será usado pelo agente. Você pode editá-lo manualmente."
                    // Optional: Add modal content if more detailed help is needed
                    // onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'systemPromptPreview' })}
                  />
                </div>
                {!isSystemPromptManuallyEdited ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setValue('config.manualSystemPromptOverride', getValues('config.systemPromptGenerated') || '', { shouldValidate: true, shouldDirty: true });
                      setIsSystemPromptManuallyEdited(true);
                    }}
                  >
                    Editar Prompt
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setValue('config.manualSystemPromptOverride', '', { shouldValidate: false, shouldDirty: true }); // Clear the override
                      setIsSystemPromptManuallyEdited(false); // Triggers regeneration in parent
                      // Optionally, explicitly trigger re-validation or re-generation if needed,
                      // though the change in isSystemPromptManuallyEdited should handle it via useEffect in parent.
                    }}
                  >
                    Resetar para Gerado Automaticamente
                  </Button>
                )}
              </div>
              <FormField
                control={control}
                // The 'name' for FormField is primarily for RHF to connect to the schema for validation errors.
                // Since we display errors for both fields separately using Controller below,
                // we can use a common or even one of the two names here.
                // Let's use manualSystemPromptOverride as it's the one being actively edited.
                name={"config.manualSystemPromptOverride"}
                render={({ field }) => ( // field might not be directly used here if value/onChange are handled by Textarea/CodeBlock
                  <FormItem>
                    {/* No FormLabel needed here as it's part of the outer structure */}
                    <FormControl>
                      {isSystemPromptManuallyEdited ? (
                        <Textarea
                          value={manualSystemPromptOverride || ''}
                          onChange={(e) => {
                            setValue('config.manualSystemPromptOverride', e.target.value, { shouldValidate: true, shouldDirty: true });
                          }}
                          placeholder="Edite o prompt do sistema manualmente..."
                          rows={10}
                          className="font-mono text-xs bg-muted/20 border-primary" // Highlight when editing
                        />
                      ) : (
                        <div className="rounded-md border bg-background p-1 min-h-[160px]"> {/* Adjusted min-height */}
                          <CodeBlock
                            language="markdown"
                            value={systemPromptGenerated || 'O prompt do sistema gerado aparecerá aqui...'}
                            className="text-xs max-h-[210px] overflow-y-auto" // Max height to match Textarea approx.
                            showLineNumbers={false}
                            wrapLines={true}
                          />
                        </div>
                      )}
                    </FormControl>
                    {/* Validation messages using Controller */}
                    <Controller
                      name="config.manualSystemPromptOverride"
                      control={control}
                      render={({ fieldState }) => (isSystemPromptManuallyEdited && fieldState.error) ? <FormMessage>{fieldState.error.message}</FormMessage> : null}
                    />
                    <Controller
                      name="config.systemPromptGenerated"
                      control={control}
                      render={({ fieldState }) => (!isSystemPromptManuallyEdited && fieldState.error) ? <FormMessage>{fieldState.error.message}</FormMessage> : null}
                    />
                  </FormItem>
                )}
              />
              {/* Character Counter */}
              <p className="text-xs text-muted-foreground mt-1">
                {(isSystemPromptManuallyEdited ? manualSystemPromptOverride : systemPromptGenerated)?.length || 0} / {MAX_SYSTEM_PROMPT_LENGTH} caracteres
              </p>
              {isSystemPromptManuallyEdited && (
                 <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                  Você está editando manualmente o prompt do sistema. As alterações automáticas baseadas em outros campos não serão aplicadas até você resetar.
                </p>
              )}

              {/* Prompt History Select */}
              {systemPromptHistory && systemPromptHistory.length > 0 && (
                <div className="mt-4">
                  <FormLabel className="flex items-center mb-1 text-sm">
                    <History size={14} className="mr-1.5" />
                    Restaurar Prompt Anterior:
                  </FormLabel>
                  <Select
                    onValueChange={(promptValue) => {
                      if (promptValue) {
                        setValue('config.manualSystemPromptOverride', promptValue, { shouldValidate: true, shouldDirty: true });
                        // Ensure setIsSystemPromptManuallyEdited is callable
                        if (typeof setIsSystemPromptManuallyEdited === 'function') {
                          setIsSystemPromptManuallyEdited(true);
                        }
                        toast({ title: "Prompt Histórico Restaurado", description: "O prompt selecionado foi carregado no editor." });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Selecione uma versão para restaurar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {systemPromptHistory.map((entry, index) => (
                        <SelectItem key={index} value={entry.prompt} className="text-xs">
                          {new Date(entry.timestamp).toLocaleString()} - {entry.prompt.substring(0, 50)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
