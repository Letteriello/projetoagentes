// GeneralTab: Componente para a aba 'Geral' do diálogo de criação de agentes.
// Este componente encapsula os campos de configuração básicos de um agente,
// como nome, descrição, tipo e framework.

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form"; // MODIFIED: Added RHF imports
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs";
import type { AgentFramework, AvailableTool, AgentType, SavedAgentConfiguration } from "@/types/agent-configs"; // MODIFIED: Added AgentType and SavedAgentConfiguration
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react";
import { suggestAgentNameAndDescriptionAction } from "@/app/agent-builder/actions";
import { useToast } from "@/hooks/use-toast";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"; // MODIFIED: Added Form components

// MODIFIED: Simplified props
interface GeneralTabProps {
  agentTypeOptions: Array<{ id: AgentType; label: string; icon?: React.ReactNode; description: string; }>;
  agentFrameworkOptions: Array<{ id: string; label: string; }>;
  availableTools: AvailableTool[]; // Still needed for AI suggestions
  // Props for AI suggestions - these will be read from form context now if possible
  // agentGoal: string; // Will get from form context via watch('config.agentGoal')
  // selectedTools: string[]; // Will get from form context via watch('tools')
  SparklesIcon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

const GeneralTab: React.FC<GeneralTabProps> = ({
  agentTypeOptions,
  agentFrameworkOptions,
  availableTools, // Keep this prop
  SparklesIcon = Wand2,
}) => {
  // MODIFIED: Get RHF methods from context
  const { control, formState: { errors }, setValue, watch } = useFormContext<SavedAgentConfiguration>();

  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const { toast } = useToast();

  // Watch necessary fields for AI suggestions and for displaying agent type description
  const watchedAgentType = watch("config.type");
  const watchedAgentGoal = watch("config.agentGoal"); // Specific to LLM
  const watchedSelectedTools = watch("tools");

  const handleSuggestWithAI = async () => {
    setIsSuggesting(true);
    try {
      const currentAgentType = watchedAgentType;
      const currentAgentGoal = currentAgentType === 'llm' ? watchedAgentGoal : ""; // Goal only relevant for LLM
      const currentSelectedTools = watchedSelectedTools || [];

      const selectedToolsData = currentSelectedTools
        .map(toolId => {
          const tool = availableTools.find(t => t.id === toolId);
          return tool ? { name: tool.name, description: tool.description } : null;
        })
        .filter(Boolean) as Array<{ name: string; description: string }>;

      const result = await suggestAgentNameAndDescriptionAction({
        agentType: currentAgentType,
        agentGoal: currentAgentGoal || "",
        selectedTools: selectedToolsData,
      });

      if (result.success && result.suggestedName && result.suggestedDescription) {
        // MODIFIED: Use setValue to update form state
        setValue("agentName", result.suggestedName, { shouldValidate: true, shouldDirty: true });
        setValue("agentDescription", result.suggestedDescription, { shouldValidate: true, shouldDirty: true });
        toast({
          title: "Sugestões de IA Aplicadas!",
          description: "Nome e descrição do agente foram atualizados.",
          variant: "default",
        });
      } else {
        toast({
          title: "Falha ao Obter Sugestões",
          description: result.error || "Não foi possível obter sugestões da IA.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error suggesting with AI:", error);
      toast({
        title: "Erro Inesperado",
        description: error.message || "Ocorreu um erro ao tentar obter sugestões da IA.",
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <TabsContent value="general" className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent Name */}
        <FormField
          control={control}
          name="agentName"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="agentName">Nome do Agente</FormLabel>
              <FormControl>
                <Input id="agentName" placeholder="Ex: Agente de Pesquisa Avançada" {...field} />
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
            <FormItem className="space-y-2">
              <FormLabel htmlFor="agentVersion">Versão</FormLabel>
              <FormControl>
                <Input id="agentVersion" placeholder="Ex: 1.0.1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {/* Agent Description */}
      <FormField
        control={control}
        name="agentDescription"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor="agentDescription">Descrição do Agente</FormLabel>
            <FormControl>
              <Textarea id="agentDescription" placeholder="Descreva o propósito principal, capacidades e limitações do agente." {...field} rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="my-4">
        <Button
          onClick={handleSuggestWithAI}
          disabled={isSuggesting || !watchedAgentType}
          variant="outline"
          size="sm"
          type="button" // Ensure it's not submitting the form
        >
          {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SparklesIcon className="mr-2 h-4 w-4" />}
          Sugerir Nome & Descrição com IA
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent Type */}
        <FormField
          control={control}
          name="config.type"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel htmlFor="selectedAgentType">Tipo de Agente</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger id="selectedAgentType">
                    <SelectValue placeholder="Selecione o tipo de agente" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {agentTypeOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.icon && React.cloneElement(option.icon as React.ReactElement, { className: "inline-block mr-2 h-4 w-4" })}
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {agentTypeOptions.find(opt => opt.id === field.value)?.description || "Selecione um tipo para ver a descrição detalhada."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Agent Framework */}
        <FormField
          control={control}
          name="config.framework"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <FormLabel htmlFor="agentFramework" className="cursor-help">Framework do Agente</FormLabel>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Define o sistema subjacente que executa o agente. Genkit é o padrão...</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger id="agentFramework">
                    <SelectValue placeholder="Selecione o framework" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {agentFrameworkOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>Define a biblioteca ou sistema base para a execução do agente.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </TabsContent>
  );
};

export default GeneralTab;
