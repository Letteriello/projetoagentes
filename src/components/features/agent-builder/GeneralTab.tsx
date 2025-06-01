// GeneralTab: Componente para a aba 'Geral' do diálogo de criação de agentes.
// Este componente encapsula os campos de configuração básicos de um agente,
// como nome, descrição, tipo e framework.

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs"; // Needed for the root element
import type { AgentFramework, AvailableTool } from "@/types/agent-configs"; // For setAgentFramework prop
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Loader2, Wand2 } from "lucide-react"; // Assuming Wand2 as SparklesIcon, and Loader2
import { suggestAgentNameAndDescriptionAction } from "@/app/agent-builder/actions";
import { useToast } from "@/hooks/use-toast";

// Props para o componente GeneralTab.
// Inclui estados e setters para os campos da aba Geral,
// bem como opções para os seletores de tipo e framework do agente.
interface GeneralTabProps {
  agentName: string;
  setAgentName: (name: string) => void;
  agentVersion: string;
  setAgentVersion: (version: string) => void;
  agentDescription: string;
  setAgentDescription: (desc: string) => void;
  selectedAgentType: "llm" | "workflow" | "custom" | "a2a";
  setSelectedAgentType: (type: "llm" | "workflow" | "custom" | "a2a") => void;
  agentFramework: string;
  setAgentFramework: (framework: string) => void; // Corrected to accept string, will be cast to AgentFramework by parent if necessary
  agentTypeOptions: Array<{ id: "llm" | "workflow" | "custom" | "a2a"; label: string; icon?: React.ReactNode; description: string; }>;
  agentFrameworkOptions: Array<{ id: string; label: string; }>;
  // Props for AI suggestions
  agentGoal: string; // Assuming this is now passed directly
  availableTools: AvailableTool[];
  selectedTools: string[];
  SparklesIcon?: React.FC<React.SVGProps<SVGSVGElement>>; // Made optional, fallback to Wand2
}

const GeneralTab: React.FC<GeneralTabProps> = ({
  agentName,
  setAgentName,
  agentVersion,
  setAgentVersion,
  agentDescription,
  setAgentDescription,
  selectedAgentType,
  setSelectedAgentType,
  agentFramework,
  setAgentFramework,
  agentTypeOptions,
  agentFrameworkOptions,
  // Props for AI suggestions
  agentGoal,
  availableTools,
  selectedTools,
  SparklesIcon = Wand2, // Default to Wand2 if not provided
}) => {
  const [isSuggesting, setIsSuggesting] = React.useState(false);
  const { toast } = useToast();

  const handleSuggestWithAI = async () => {
    setIsSuggesting(true);
    try {
      const selectedToolsData = selectedTools
        .map(toolId => {
          const tool = availableTools.find(t => t.id === toolId);
          return tool ? { name: tool.name, description: tool.description } : null;
        })
        .filter(Boolean) as Array<{ name: string; description: string }>; // Type assertion after filtering

      const result = await suggestAgentNameAndDescriptionAction({
        agentType: selectedAgentType,
        agentGoal: agentGoal, // Ensure agentGoal is provided, can be empty string
        selectedTools: selectedToolsData,
      });

      if (result.success && result.suggestedName && result.suggestedDescription) {
        setAgentName(result.suggestedName);
        setAgentDescription(result.suggestedDescription);
        toast({
          title: "Sugestões de IA Aplicadas!",
          description: "Nome e descrição do agente foram atualizados com as sugestões da IA.",
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
        <div className="space-y-2">
          <Label htmlFor="agentName">Nome do Agente</Label>
          <Input id="agentName" placeholder="Ex: Agente de Pesquisa Avançada" value={agentName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgentName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="agentVersion">Versão</Label>
          <Input id="agentVersion" placeholder="Ex: 1.0.1" value={agentVersion} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgentVersion(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="agentDescription">Descrição do Agente</Label>
        <Textarea id="agentDescription" placeholder="Descreva o propósito principal, capacidades e limitações do agente." value={agentDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAgentDescription(e.target.value)} rows={3} />
      </div>
      <div className="my-4"> {/* Added margin for spacing */}
        <Button
          onClick={handleSuggestWithAI}
          disabled={isSuggesting || !selectedAgentType}
          variant="outline"
          size="sm"
        >
          {isSuggesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <SparklesIcon className="mr-2 h-4 w-4" />
          )}
          Sugerir Nome & Descrição com IA
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="selectedAgentType">Tipo de Agente</Label>
          <Select value={selectedAgentType} onValueChange={(value: "llm" | "workflow" | "custom" | "a2a") => setSelectedAgentType(value)}>
            <SelectTrigger id="selectedAgentType">
              <SelectValue placeholder="Selecione o tipo de agente" />
            </SelectTrigger>
            <SelectContent>
              {/* Mapeia as opções de tipo de agente (LLM, Workflow, etc.) para seleção. */}
              {agentTypeOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>
                  {option.icon && React.cloneElement(option.icon as React.ReactElement, { className: "inline-block mr-2 h-4 w-4" })}
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
           {/* Exibe a descrição correspondente ao tipo de agente selecionado. */}
           <p className="text-xs text-muted-foreground">{agentTypeOptions.find(opt => opt.id === selectedAgentType)?.description || "Selecione um tipo para ver a descrição detalhada."}</p>
        </div>
        <div className="space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="agentFramework" className="cursor-help">Framework do Agente</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Define o sistema subjacente que executa o agente. Genkit é o padrão. CrewAI e Langchain são frameworks populares para construir aplicações de IA com agentes, oferecendo diferentes conjuntos de ferramentas e abstrações.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Select value={agentFramework} onValueChange={(value) => setAgentFramework(value as AgentFramework)}>
            <SelectTrigger id="agentFramework">
              <SelectValue placeholder="Selecione o framework" />
            </SelectTrigger>
            <SelectContent>
              {agentFrameworkOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Define a biblioteca ou sistema base para a execução do agente.</p>
        </div>
      </div>
    </TabsContent>
  );
};

export default GeneralTab;
