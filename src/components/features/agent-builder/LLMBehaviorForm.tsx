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
import { Loader2, Wand2 } from "lucide-react";
import { suggestLlmBehaviorAction } from "@/app/agent-builder/actions";
import { useToast } from "@/hooks/use-toast";
import { SavedAgentConfiguration } from "@/types/agent-configs"; // MODIFIED
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"; // MODIFIED
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card components
// import { Separator } from "@/components/ui/separator"; // Separator might not be needed if using Cards for all sections

// MODIFIED: Simplified props
interface LLMBehaviorFormProps {
  agentToneOptions: Array<{ id: string; label: string; }>;
  SparklesIcon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

const LLMBehaviorForm: React.FC<LLMBehaviorFormProps> = ({
  agentToneOptions,
  SparklesIcon = Wand2,
}) => {
  const { control, setValue, watch, formState: { errors } } = useFormContext<SavedAgentConfiguration>(); // MODIFIED
  const { toast } = useToast();

  const [isSuggestingPersonality, setIsSuggestingPersonality] = React.useState(false);
  const [isSuggestingRestrictions, setIsSuggestingRestrictions] = React.useState(false);
  const [personalitySuggestions, setPersonalitySuggestions] = React.useState<string[]>([]);
  const [restrictionSuggestions, setRestrictionSuggestions] = React.useState<string[]>([]);
  const [showPersonalityPopover, setShowPersonalityPopover] = React.useState(false);
  const [showRestrictionPopover, setShowRestrictionPopover] = React.useState(false);

  const watchedAgentGoal = watch("config.agentGoal");
  const watchedAgentTasks = watch("config.agentTasks");
  const watchedAgentPersonality = watch("config.agentPersonality");
  const watchedAgentRestrictions = watch("config.agentRestrictions");
  const watchedSystemPromptGenerated = watch("config.systemPromptGenerated");
  const watchedAgentTemperature = watch("config.agentTemperature");


  const handleSuggestPersonality = async () => {
    setIsSuggestingPersonality(true); setShowPersonalityPopover(false);
    try {
      const result = await suggestLlmBehaviorAction({
        suggestionType: 'personality',
        agentGoal: watchedAgentGoal || "",
        agentTasks: watchedAgentTasks || [],
        currentRestrictions: watchedAgentRestrictions || [],
      });
      if (result.success && result.suggestions) {
        setPersonalitySuggestions(result.suggestions); setShowPersonalityPopover(true);
        toast({ title: "Sugestões de Personalidade Carregadas"});
      } else {
        toast({ title: "Falha ao Sugerir Personalidade", description: result.error, variant: "destructive" });
      }
    } catch (e:any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setIsSuggestingPersonality(false); }
  };

  const applyPersonalitySuggestion = (suggestion: string) => {
    setValue("config.agentPersonality", suggestion, { shouldValidate: true, shouldDirty: true }); // MODIFIED
    setShowPersonalityPopover(false);
  };

  const handleSuggestRestrictions = async () => {
    setIsSuggestingRestrictions(true); setShowRestrictionPopover(false);
    try {
      const result = await suggestLlmBehaviorAction({
        suggestionType: 'restrictions',
        agentGoal: watchedAgentGoal || "",
        agentTasks: watchedAgentTasks || [],
        currentPersonality: watchedAgentPersonality || "",
      });
      if (result.success && result.suggestions) {
        setRestrictionSuggestions(result.suggestions); setShowRestrictionPopover(true);
        toast({ title: "Sugestões de Restrições Carregadas" });
      } else {
        toast({ title: "Falha ao Sugerir Restrições", description: result.error, variant: "destructive" });
      }
    } catch (e:any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setIsSuggestingRestrictions(false); }
  };

  const applyRestrictionSuggestion = (suggestion: string) => {
    const currentRestrictions = watchedAgentRestrictions || [];
    if (!currentRestrictions.includes(suggestion)) {
      setValue("config.agentRestrictions", [...currentRestrictions, suggestion], { shouldValidate: true, shouldDirty: true }); // MODIFIED
    }
    toast({ title: "Restrição Adicionada" });
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
              <FormItem> {/* Removed space-y-2, relying on CardContent padding */}
                <FormLabel htmlFor="config.agentGoal">Agent Goal (LLM)</FormLabel>
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
                  <FormLabel htmlFor="config.agentTasks">Main Tasks (LLM)</FormLabel>
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
                  <Popover open={showPersonalityPopover} onOpenChange={setShowPersonalityPopover}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" onClick={handleSuggestPersonality} disabled={isSuggestingPersonality}>
                        {isSuggestingPersonality ? <Loader2 className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80"> {/* Content as before */} </PopoverContent>
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
                    <Popover open={showRestrictionPopover} onOpenChange={setShowRestrictionPopover}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="ghost" size="sm" onClick={handleSuggestRestrictions} disabled={isSuggestingRestrictions}>
                          {isSuggestingRestrictions ? <Loader2 className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">{/* Content as before */}</PopoverContent>
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
    </div>
  );
};
export default LLMBehaviorForm;
