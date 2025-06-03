import * as React from 'react'; // Ensure React is imported
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfoIcon } from '@/components/ui/InfoIcon';
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import { SavedAgentConfiguration } from '@/types/agent-configs-fixed';
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
  agentFrameworkOptions: Array<{ value: string; label: string }>; // Assuming this structure
  // SparklesIcon?: React.ElementType; // Keep if used for other things
  // availableTools?: any[]; // Keep if used for other things
}

// It's good practice to type the context, especially when dealing with nested paths.
type FormContextType = SavedAgentConfiguration;

export default function GeneralTab({
  showHelpModal,
  agentTypeOptions,
  agentFrameworkOptions
}: GeneralTabProps) {
  const { register, control, watch, getValues, setValue } = useFormContext<FormContextType>(); // Added getValues, setValue
  const { toast } = useToast(); // Added

  const agentType = watch('config.type');

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
        <div className="space-y-2">
          <div className="flex items-center justify-between"> {/* Use flex to align label and button */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="agentName">Agent Name</Label>
              <InfoIcon
                tooltipText={agentBuilderHelpContent.generalTab.agentName.tooltip!}
                onClick={() => showHelpModal({ tab: 'generalTab', field: 'agentName' })}
              />
            </div>
            <Popover open={showNameSuggestionPopover} onOpenChange={setShowNameSuggestionPopover}>
              <PopoverTrigger asChild>
                {/* Replace Button with AISuggestionIcon */}
                <AISuggestionIcon
                  onClick={() => fetchSuggestionsForGeneralTab(setShowNameSuggestionPopover, "agentName")}
                  isLoading={isLoadingSuggestions}
                  tooltipText="Sugerir nome do agente"
                  size={16} // Corresponds to h-4 w-4
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
          <Input
            id="agentName"
            {...register('agentName')}
            placeholder="Enter agent name"
          />
        </div>

        {/* Agent Version */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="agentVersion">Agent Version</Label>
            <InfoIcon /* TODO: Add help content for agentVersion */
              tooltipText="Version of the agent (e.g., 1.0.0)"
              onClick={() => showHelpModal({ tab: 'generalTab', field: 'agentVersion' })}
            />
          </div>
          <Input
            id="agentVersion"
            {...register('agentVersion')}
            placeholder="e.g., 1.0.0"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between"> {/* Use flex to align label and button */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="agentDescription">Description</Label>
            <InfoIcon
              tooltipText={agentBuilderHelpContent.generalTab.description.tooltip!}
              onClick={() => showHelpModal({ tab: 'generalTab', field: 'description' })}
            />
          </div>
          <Popover open={showDescriptionSuggestionPopover} onOpenChange={setShowDescriptionSuggestionPopover}>
            <PopoverTrigger asChild>
              {/* Replace Button with AISuggestionIcon */}
              <AISuggestionIcon
                onClick={() => fetchSuggestionsForGeneralTab(setShowDescriptionSuggestionPopover, "agentDescription")}
                isLoading={isLoadingSuggestions}
                tooltipText="Sugerir descrição do agente"
                size={16} // Corresponds to h-4 w-4
              />
            </PopoverTrigger>
            <PopoverContent className="w-[400px]"> {/* Wider for description */}
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
        <Textarea 
          id="agentDescription"
          {...register('agentDescription')}
          placeholder="Describe your agent's purpose"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent Type */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="config.type">Agent Type</Label>
            <InfoIcon /* TODO: Add help content for agentType */
              tooltipText="Defines the agent's core capability (e.g., LLM, Workflow)."
              onClick={() => showHelpModal({ tab: 'generalTab', field: 'agentType' })}
            />
          </div>
          <Controller
            name="config.type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="config.type">
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent>
                  {agentTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Agent Framework */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="config.framework">Agent Framework</Label>
            <InfoIcon /* TODO: Add help content for agentFramework */
              tooltipText="The underlying framework used by the agent (e.g., Genkit, CrewAI)."
              onClick={() => showHelpModal({ tab: 'generalTab', field: 'agentFramework' })}
            />
          </div>
          <Controller
            name="config.framework"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="config.framework">
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  {agentFrameworkOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Genkit Flow Name (Conditional) */}
      {agentType === 'custom' && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="config.genkitFlowName">Genkit Flow Name (for Custom Agent)</Label>
            <InfoIcon /* TODO: Add help content for genkitFlowName */
              tooltipText="The name of the Genkit flow to execute for this custom agent."
              onClick={() => showHelpModal({ tab: 'generalTab', field: 'genkitFlowName' })}
            />
          </div>
          <Input
            id="config.genkitFlowName"
            {...register('config.genkitFlowName')}
            placeholder="Enter Genkit flow name"
          />
        </div>
      )}
    </div>
  );
}
