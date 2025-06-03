import * as React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
// Label will be replaced by FormLabel
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfoIcon } from '@/components/ui/InfoIcon';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import { SavedAgentConfiguration } from '@/types/agent-configs-new'; // Updated to use agent-configs-new
import { getAiConfigurationSuggestionsAction } from '@/app/agent-builder/actions';
import { AiConfigurationAssistantOutputSchema } from '@/ai/flows/aiConfigurationAssistantFlow';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Loader2 } from "lucide-react"; // SparklesIcon (Wand2) removed, AISuggestionIcon will provide it
import { useToast } from "@/hooks/use-toast";
import { z } from 'zod';
import AISuggestionIcon from '@/components/features/agent-builder/AISuggestionIcon'; // Added

interface GeneralTabProps {
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
  agentTypeOptions: Array<{ value: string; label: string }>; // Assuming this structure
  agentFrameworkOptions: Array<{ value: string; label: string }>;
}

// Ensure FormContextType matches the one used in useForm in the parent dialog
type FormContextType = SavedAgentConfiguration;

export default function GeneralTab({
  showHelpModal,
  agentTypeOptions,
  agentFrameworkOptions
}: GeneralTabProps) {
  const { control, watch, getValues, setValue, formState: { errors } } = useFormContext<FormContextType>();
  const { toast } = useToast();

  const agentType = watch('config.type');
  // Check for errors (example)
  // React.useEffect(() => {
  // console.log("General Tab Errors:", errors);
  // }, [errors]);

  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [allSuggestions, setAllSuggestions] = React.useState<z.infer<typeof AiConfigurationAssistantOutputSchema> | undefined>(undefined);
  const [showNameSuggestionPopover, setShowNameSuggestionPopover] = React.useState(false);
  const [showDescriptionSuggestionPopover, setShowDescriptionSuggestionPopover] = React.useState(false);

  const fetchSuggestionsForGeneralTab = async (
    popoverSetter: React.Dispatch<React.SetStateAction<boolean>>,
    context: "agentName" | "agentDescription"
  ) => {
    setIsLoadingSuggestions(true);
    popoverSetter(false); // Close popover before fetch
    const currentConfig = getValues(); // Get the whole form data
    try {
      // Pass the context to the action
      const result = await getAiConfigurationSuggestionsAction(currentConfig, context);
      if (result.success && result.suggestions) {
        setAllSuggestions(result.suggestions);
        popoverSetter(true); // Open the relevant popover
        toast({ title: "Sugestão Carregada" });
      } else {
        toast({ title: "Falha ao Carregar Sugestão", description: result.error, variant: "destructive" });
        // Clear specific suggestion on error
        setAllSuggestions(current => ({ ...current, [context === 'agentName' ? 'suggestedAgentName' : 'suggestedAgentDescription']: undefined }));
      }
    } catch (e: any) {
      toast({ title: "Erro ao Buscar Sugestão", description: e.message, variant: "destructive" });
      setAllSuggestions(current => ({ ...current, [context === 'agentName' ? 'suggestedAgentName' : 'suggestedAgentDescription']: undefined }));
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  return (
    <div className="space-y-6"> {/* Increased spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Grid layout */}
        {/* Agent Name */}
        <FormField
          control={control}
          name="agentName"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FormLabel>Agent Name</FormLabel>
                  <InfoIcon
                    tooltipText={agentBuilderHelpContent.generalTab.agentName.tooltip!}
                    onClick={() => showHelpModal({ tab: 'generalTab', field: 'agentName' })}
                  />
                </div>
                <Popover open={showNameSuggestionPopover} onOpenChange={setShowNameSuggestionPopover}>
                  <PopoverTrigger asChild>
                    <AISuggestionIcon
                      onClick={() => fetchSuggestionsForGeneralTab(setShowNameSuggestionPopover, "agentName")}
                      isLoading={isLoadingSuggestions}
                      tooltipText="Sugerir nome do agente"
                      size={16}
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    {isLoadingSuggestions && <Loader2 className="h-4 w-4 animate-spin mx-auto" />}
                    {!isLoadingSuggestions && allSuggestions?.suggestedAgentName ? (
                      <>
                        <p className="text-sm text-muted-foreground mb-2">Nome Sugerido:</p>
                        <p className="mb-4 font-semibold">{allSuggestions.suggestedAgentName}</p>
                        <Button onClick={() => {
                          setValue("agentName", allSuggestions.suggestedAgentName!, { shouldValidate: true, shouldDirty: true });
                          setShowNameSuggestionPopover(false);
                          toast({ title: "Nome do Agente atualizado." });
                        }} size="sm">Aplicar</Button>
                      </>
                    ) : (!isLoadingSuggestions && <p>Nenhuma sugestão para o nome.</p>)}
                  </PopoverContent>
                </Popover>
              </div>
              <FormControl>
                <Input {...field} placeholder="Enter agent name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Agent Version */}
        <FormField
          control={control}
          name="agentVersion"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <FormLabel>Agent Version</FormLabel>
                <InfoIcon
                  tooltipText="Version of the agent (e.g., 1.0.0)"
                  onClick={() => showHelpModal({ tab: 'generalTab', field: 'agentVersion' })}
                />
              </div>
              <FormControl>
                <Input {...field} placeholder="e.g., 1.0.0" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Description */}
      <FormField
        control={control}
        name="agentDescription"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FormLabel>Description</FormLabel>
                <InfoIcon
                  tooltipText={agentBuilderHelpContent.generalTab.description.tooltip!}
                  onClick={() => showHelpModal({ tab: 'generalTab', field: 'description' })}
                />
              </div>
              <Popover open={showDescriptionSuggestionPopover} onOpenChange={setShowDescriptionSuggestionPopover}>
                <PopoverTrigger asChild>
                  <AISuggestionIcon
                    onClick={() => fetchSuggestionsForGeneralTab(setShowDescriptionSuggestionPopover, "agentDescription")}
                    isLoading={isLoadingSuggestions}
                    tooltipText="Sugerir descrição do agente"
                    size={16}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-[400px]">
                  {isLoadingSuggestions && <Loader2 className="h-4 w-4 animate-spin mx-auto" />}
                  {!isLoadingSuggestions && allSuggestions?.suggestedAgentDescription ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">Descrição Sugerida:</p>
                      <p className="mb-4 text-sm">{allSuggestions.suggestedAgentDescription}</p>
                      <Button onClick={() => {
                        setValue("agentDescription", allSuggestions.suggestedAgentDescription!, { shouldValidate: true, shouldDirty: true });
                        setShowDescriptionSuggestionPopover(false);
                        toast({ title: "Descrição do Agente atualizada." });
                      }} size="sm">Aplicar</Button>
                    </>
                  ) : (!isLoadingSuggestions && <p>Nenhuma sugestão para a descrição.</p>)}
                </PopoverContent>
              </Popover>
            </div>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Describe your agent's purpose"
                rows={3}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent Type */}
        <FormField
          control={control}
          name="config.type"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <FormLabel>Agent Type</FormLabel>
                <InfoIcon
                  tooltipText="Defines the agent's core capability (e.g., LLM, Workflow)."
                  onClick={() => showHelpModal({ tab: 'generalTab', field: 'agentType' })}
                />
              </div>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {agentTypeOptions.map(option => (
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

        {/* Agent Framework */}
        <FormField
          control={control}
          name="config.framework"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <FormLabel>Agent Framework</FormLabel>
                <InfoIcon
                  tooltipText="The underlying framework used by the agent (e.g., Genkit, CrewAI)."
                  onClick={() => showHelpModal({ tab: 'generalTab', field: 'agentFramework' })}
                />
              </div>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select framework" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {agentFrameworkOptions.map(option => (
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
      </div>

      {/* Genkit Flow Name (Conditional) - RHF integration for this field if it exists in the Zod schema */}
      {/* Assuming 'config.genkitFlowName' is part of CustomAgentConfig in Zod schema */}
      {agentType === 'custom' && (
        <FormField
          control={control}
          name="config.customLogicDescription" // Example: Or config.genkitFlowName if that's the actual schema path
          // Ensure the `name` prop matches a field in your Zod schema for custom agents
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center space-x-2">
                <FormLabel>Genkit Flow Name / Custom Logic Description</FormLabel>
                <InfoIcon
                  tooltipText="The name of the Genkit flow or description of custom logic."
                  onClick={() => showHelpModal({ tab: 'generalTab', field: 'genkitFlowName' })}
                />
              </div>
              <FormControl>
                <Input {...field} placeholder="Enter Genkit flow name or describe custom logic" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
