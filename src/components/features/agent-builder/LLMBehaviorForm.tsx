// LLMBehaviorForm: Componente para o formulário de comportamento específico de agentes LLM.
// Inclui campos para objetivo, tarefas, personalidade, restrições, modelo e temperatura.

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form"; // MODIFIED
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Wand2 } from "lucide-react"; // SparklesIcon removed
import { getAiConfigurationSuggestionsAction } from '@/app/agent-builder/actions';
import { AiConfigurationAssistantOutputSchema } from '@/ai/flows/aiConfigurationAssistantFlow'; // For typing suggestions
import AISuggestionIcon from './AISuggestionIcon'; // Added
import { useToast } from "@/hooks/use-toast";
import { SavedAgentConfiguration } from '@/types/agent-configs-fixed'; // MODIFIED
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"; // MODIFIED
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card components
// import { Separator } from "@/components/ui/separator"; // Separator might not be needed if using Cards for all sections
import { useFieldArray } from "react-hook-form"; // ADDED for safety settings
import { Trash2 } from "lucide-react"; // ADDED for remove button icon

// MODIFIED: Simplified props
interface LLMBehaviorFormProps {
  agentToneOptions: Array<{ id: string; label: string; }>;
  // SparklesIcon prop is no longer needed as AISuggestionIcon handles its own icon (Wand2)
}

const LLMBehaviorForm: React.FC<LLMBehaviorFormProps> = ({
  agentToneOptions,
}) => {
  const { 
    control, 
    setValue, 
    watch, 
    getValues, 
    formState: { errors } 
  } = useFormContext<SavedAgentConfiguration>();
  
  const { toast } = useToast();

  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState<boolean>(false);
  const [allSuggestions, setAllSuggestions] = React.useState<z.infer<typeof AiConfigurationAssistantOutputSchema> | undefined>(undefined);

  // Estados para visibilidade dos popovers
  const [showGoalSuggestionPopover, setShowGoalSuggestionPopover] = React.useState<boolean>(false);
  const [showTasksSuggestionPopover, setShowTasksSuggestionPopover] = React.useState<boolean>(false);
  const [showPersonalitySuggestionPopover, setShowPersonalitySuggestionPopover] = React.useState<boolean>(false);
  const [showRestrictionsSuggestionPopover, setShowRestrictionsSuggestionPopover] = React.useState<boolean>(false);

  const watchedSystemPromptGenerated = watch("config.systemPromptGenerated"); // Keep relevant watches
  const watchedAgentTemperature = watch("config.agentTemperature"); // Keep relevant watches

  // ADDED: useFieldArray for safetySettings
  const { fields: safetySettingFields, append: appendSafetySetting, remove: removeSafetySetting } = useFieldArray({
    control,
    name: "config.safetySettings",
  });

  // ADDED: Options for safety settings dropdowns
  const safetyCategoryOptions = [
    { label: "Harassment", value: "HARM_CATEGORY_HARASSMENT" },
    { label: "Hate Speech", value: "HARM_CATEGORY_HATE_SPEECH" },
    { label: "Sexually Explicit", value: "HARM_CATEGORY_SEXUALLY_EXPLICIT" },
    { label: "Dangerous Content", value: "HARM_CATEGORY_DANGEROUS_CONTENT" },
    // TODO: Confirm these with actual Genkit documentation
  ];

  const safetyThresholdOptions = [
    { label: "Block None", value: "BLOCK_NONE" },
    { label: "Block Low and Above", value: "BLOCK_LOW_AND_ABOVE" },
    { label: "Block Medium and Above", value: "BLOCK_MEDIUM_AND_ABOVE" },
    { label: "Block Only High", value: "BLOCK_ONLY_HIGH" },
    // TODO: Confirm these with actual Genkit documentation
  ];

  const fetchSuggestionsForContext = async (
    popoverSetter: React.Dispatch<React.SetStateAction<boolean>>,
    context: "goal" | "tasks" | "personality" | "restrictions"
  ) => {
    setIsLoadingSuggestions(true);
    popoverSetter(false); // Close popover before fetch
    const currentConfig = getValues();
    try {
      const result = await getAiConfigurationSuggestionsAction(currentConfig, context); // Pass context
      if (result.success && result.suggestions) {
        setAllSuggestions(result.suggestions); // Store potentially partial suggestions
        popoverSetter(true); // Open the relevant popover
        toast({ title: "Sugestão Carregada" });
      } else {
        toast({ title: "Falha ao Carregar Sugestão", description: result.error, variant: "destructive" });
        // Clear specific suggestion field on error
        let fieldToClear: keyof AiConfigurationAssistantOutputSchema | undefined = undefined;
        if (context === "goal") fieldToClear = "suggestedGoal";
        else if (context === "tasks") fieldToClear = "suggestedTasks";
        else if (context === "personality") fieldToClear = "suggestedPersonality";
        else if (context === "restrictions") fieldToClear = "suggestedRestrictions";
        if (fieldToClear) {
          setAllSuggestions(prev => ({ ...prev, [fieldToClear!]: undefined }));
        }
      }
    } catch (e: any) {
      toast({ title: "Erro ao Buscar Sugestão", description: e.message, variant: "destructive" });
      setAllSuggestions(prev => ({ // Clear all on general error or decide based on context
        ...prev,
        suggestedGoal: context === "goal" ? undefined : prev?.suggestedGoal,
        suggestedTasks: context === "tasks" ? undefined : prev?.suggestedTasks,
        suggestedPersonality: context === "personality" ? undefined : prev?.suggestedPersonality,
        suggestedRestrictions: context === "restrictions" ? undefined : prev?.suggestedRestrictions,
      }));
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Core Definition</CardTitle>
          <CardDescription>Define the primary objective and key tasks for the LLM agent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={control}
            name="config.agentGoal"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="config.agentGoal">Agent Goal (LLM)</FormLabel>
                  <Popover open={showGoalSuggestionPopover} onOpenChange={setShowGoalSuggestionPopover}>
                    <PopoverTrigger asChild>
                      <AISuggestionIcon
                        onClick={() => fetchSuggestionsForContext(setShowGoalSuggestionPopover, "goal")}
                        isLoading={isLoadingSuggestions}
                        tooltipText="Sugerir objetivo do agente"
                        size={16}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      {isLoadingSuggestions && <Loader2 className="h-4 w-4 animate-spin mx-auto my-4" />}
                      {!isLoadingSuggestions && allSuggestions?.suggestedGoal ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">Sugestão de Objetivo:</p>
                          <p className="mb-4">{allSuggestions.suggestedGoal}</p>
                          <Button onClick={() => {
                            setValue("config.agentGoal", allSuggestions.suggestedGoal!, { shouldValidate: true, shouldDirty: true });
                            setShowGoalSuggestionPopover(false);
                            toast({ title: "Objetivo atualizado." });
                          }} size="sm">Aplicar</Button>
                        </>
                      ) : <p>Nenhuma sugestão para o objetivo.</p>}
                    </PopoverContent>
                  </Popover>
                </div>
                <FormControl><Textarea id="config.agentGoal" placeholder="Describe the main objective..." {...field} rows={3}/></FormControl>
                <FormDescription>What is the central purpose of this LLM agent?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="config.agentTasks"
            render={({ field }) => {
              const tasksToString = (value: string[] | undefined) => value?.join("\n") || "";
              const stringToTasks = (value: string) => value.split("\n").filter(task => task.trim() !== "");
              return (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel htmlFor="config.agentTasks">Main Tasks (LLM)</FormLabel>
                    <Popover open={showTasksSuggestionPopover} onOpenChange={setShowTasksSuggestionPopover}>
                      <PopoverTrigger asChild>
                        <AISuggestionIcon
                          onClick={() => fetchSuggestionsForContext(setShowTasksSuggestionPopover, "tasks")}
                          isLoading={isLoadingSuggestions}
                          tooltipText="Sugerir tarefas principais"
                          size={16}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-96">
                        {isLoadingSuggestions && <Loader2 className="h-4 w-4 animate-spin mx-auto my-4" />}
                        {!isLoadingSuggestions && allSuggestions?.suggestedTasks && allSuggestions.suggestedTasks.length > 0 ? (
                          <>
                            <p className="text-sm text-muted-foreground mb-2">Sugestões de Tarefas:</p>
                            <ul className="list-disc pl-5 mb-4 space-y-1">
                              {allSuggestions.suggestedTasks.map((task, index) => <li key={index}>{task}</li>)}
                            </ul>
                            <Button onClick={() => {
                              setValue("config.agentTasks", allSuggestions.suggestedTasks!, { shouldValidate: true, shouldDirty: true });
                              setShowTasksSuggestionPopover(false);
                              toast({ title: "Tarefas atualizadas." });
                            }} size="sm">Aplicar Todas</Button>
                          </>
                        ) : <p>Nenhuma sugestão para tarefas.</p>}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormControl>
                    <Textarea
                      id="config.agentTasks"
                      placeholder="List the main tasks... One task per line."
                      value={tasksToString(field.value)}
                      onChange={(e) => field.onChange(stringToTasks(e.target.value))}
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>Detail the steps or sub-goals. One task per line.</FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Behavioral Profile</CardTitle>
          <CardDescription>Configure the agent's personality, tone, and operational restrictions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={control}
            name="config.agentPersonality"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="config.agentPersonality">Personality/Tone (LLM)</FormLabel>
                  <Popover open={showPersonalitySuggestionPopover} onOpenChange={setShowPersonalitySuggestionPopover}>
                    <PopoverTrigger asChild>
                      <AISuggestionIcon
                        onClick={() => fetchSuggestionsForContext(setShowPersonalitySuggestionPopover, "personality")}
                        isLoading={isLoadingSuggestions}
                        tooltipText="Sugerir personalidade/tom"
                        size={16}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      {isLoadingSuggestions && <Loader2 className="h-4 w-4 animate-spin mx-auto my-4" />}
                      {!isLoadingSuggestions && allSuggestions?.suggestedPersonality ? (
                        <>
                          <p className="text-sm text-muted-foreground mb-2">Personalidade Sugerida:</p>
                          <p className="mb-4">{allSuggestions.suggestedPersonality}</p>
                          <Button onClick={() => {
                            setValue("config.agentPersonality", allSuggestions.suggestedPersonality!, { shouldValidate: true, shouldDirty: true });
                            setShowPersonalitySuggestionPopover(false);
                            toast({ title: "Personalidade atualizada." });
                          }} size="sm">Aplicar</Button>
                        </>
                      ) : <p>Nenhuma sugestão para personalidade.</p>}
                    </PopoverContent>
                  </Popover>
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger id="config.agentPersonality"><SelectValue placeholder="Select personality" /></SelectTrigger></FormControl>
                  <SelectContent>{agentToneOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
                <FormDescription>Defines the communication style.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="config.agentRestrictions"
            render={({ field }) => {
              const restrictionsToString = (value: string[] | undefined) => value?.join("\n") || "";
              const stringToRestrictions = (value: string) => value.split("\n").filter(r => r.trim() !== "");
              return (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel htmlFor="config.agentRestrictions">Restrictions (LLM)</FormLabel>
                    <Popover open={showRestrictionsSuggestionPopover} onOpenChange={setShowRestrictionsSuggestionPopover}>
                      <PopoverTrigger asChild>
                        <AISuggestionIcon
                          onClick={() => fetchSuggestionsForContext(setShowRestrictionsSuggestionPopover, "restrictions")}
                          isLoading={isLoadingSuggestions}
                          tooltipText="Sugerir restrições"
                          size={16}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-96">
                        {isLoadingSuggestions && <Loader2 className="h-4 w-4 animate-spin mx-auto my-4" />}
                        {!isLoadingSuggestions && allSuggestions?.suggestedRestrictions && allSuggestions.suggestedRestrictions.length > 0 ? (
                          <>
                            <p className="text-sm text-muted-foreground mb-2">Restrições Sugeridas:</p>
                            <div className="space-y-2">
                              {allSuggestions.suggestedRestrictions.map((restriction, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <span>{restriction}</span>
                                  <Button variant="outline" size="xs" onClick={() => {
                                    const currentRestrictions = getValues("config.agentRestrictions") || [];
                                    if (!currentRestrictions.includes(restriction)) {
                                      setValue("config.agentRestrictions", [...currentRestrictions, restriction], { shouldValidate: true, shouldDirty: true });
                                      toast({ title: "Restrição Adicionada" });
                                    } else {
                                      toast({ title: "Restrição já existe", variant: "default" });
                                    }
                                  }}>Adicionar</Button>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : <p>Nenhuma sugestão para restrições.</p>}
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormControl>
                    <Textarea
                      id="config.agentRestrictions"
                      placeholder="List any restrictions... One restriction per line."
                      value={restrictionsToString(field.value)}
                      onChange={(e) => field.onChange(stringToRestrictions(e.target.value))}
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>Define boundaries and rules. One restriction per line.</FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model Configuration</CardTitle>
          <CardDescription>Specify the language model and its operational parameters.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="config.agentModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="config.agentModel">Language Model (LLM)</FormLabel>
                <FormControl><Input id="config.agentModel" placeholder="Ex: gemini-1.5-pro-latest" {...field} /></FormControl>
                <FormDescription>Specify the LLM identifier.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="config.agentTemperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="config.agentTemperature">Temperature (LLM) - <Badge variant="outline">{Number(field.value)?.toFixed(1) || "0.0"}</Badge></FormLabel>
                <FormControl>
                  <Slider
                    id="config.agentTemperature"
                    min={0} max={1} step={0.1}
                    value={[Number(field.value) || 0]}
                    onValueChange={(value) => field.onChange(value[0])}
                  />
                </FormControl>
                <FormDescription>Controls creativity/randomness.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Prompt Preview</CardTitle>
          <CardDescription>This is a preview of how the system prompt might be constructed based on your settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
            name="config.systemPromptGenerated"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="config.systemPromptGenerated" className="sr-only">Generated System Prompt (LLM Preview)</FormLabel>
                <FormControl><Textarea id="config.systemPromptGenerated" readOnly {...field} rows={5} className="bg-muted/40" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* --- Model Safety Settings Card --- */}
      <Card>
        <CardHeader>
          <CardTitle>Model Safety Settings</CardTitle>
          <CardDescription>
            Configure content filters and safety thresholds for the LLM. These settings help control harmful content generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {safetySettingFields.map((item, index) => (
            <div key={item.id} className="flex items-end space-x-2 p-3 border rounded-md bg-muted/20">
              <FormField
                control={control}
                name={`config.safetySettings.${index}.category`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel htmlFor={`config.safetySettings.${index}.category`}>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {safetyCategoryOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`config.safetySettings.${index}.threshold`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel htmlFor={`config.safetySettings.${index}.threshold`}>Threshold</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select threshold" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {safetyThresholdOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeSafetySetting(index)}
                className="text-destructive hover:bg-destructive/10"
                aria-label="Remove safety setting"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => appendSafetySetting({ category: "", threshold: "" })}
          >
            Add Safety Setting
          </Button>
          <FormDescription className="pt-2">
            Consult the Genkit (or specific model provider) documentation for details on available categories and thresholds.
            Incorrect or unsupported values may be ignored by the model or cause errors.
          </FormDescription>
        </CardContent>
      </Card>
    </div>
  );
};
export default LLMBehaviorForm;
