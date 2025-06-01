// LLMBehaviorForm: Componente para o formulário de comportamento específico de agentes LLM.
// Inclui campos para objetivo, tarefas, personalidade, restrições, modelo e temperatura.

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, Wand2 } from "lucide-react"; // Or Sparkles if you prefer/have it
import { suggestLlmBehaviorAction } from "@/app/agent-builder/actions";
import { useToast } from "@/hooks/use-toast";

// Props para o componente LLMBehaviorForm.
interface LLMBehaviorFormProps {
  agentGoal: string; // Used for context in suggestions
  setAgentGoal: (goal: string) => void;
  agentTasks: string[]; // Used for context in suggestions
  setAgentTasks: (tasks: string[]) => void;
  agentPersonality: string;
  setAgentPersonality: (personality: string) => void;
  agentRestrictions: string[];
  setAgentRestrictions: (restrictions: string[]) => void;
  agentModel: string;
  setAgentModel: (model: string) => void;
  agentTemperature: number;
  setAgentTemperature: (temperature: number) => void;
  systemPromptGenerated: string; // readonly, for display
  agentToneOptions: Array<{ id: string; label: string; }>;
  SparklesIcon?: React.FC<React.SVGProps<SVGSVGElement>>; // Prop for the suggestion icon
}

const LLMBehaviorForm: React.FC<LLMBehaviorFormProps> = ({
  agentGoal,
  setAgentGoal,
  agentTasks,
  setAgentTasks,
  agentPersonality,
  setAgentPersonality,
  agentRestrictions,
  setAgentRestrictions,
  agentModel,
  setAgentModel,
  agentTemperature,
  setAgentTemperature,
  systemPromptGenerated,
  agentToneOptions,
  SparklesIcon = Wand2, // Default to Wand2 if not provided
}) => {
  const [isSuggestingPersonality, setIsSuggestingPersonality] = React.useState(false);
  const [isSuggestingRestrictions, setIsSuggestingRestrictions] = React.useState(false);
  const [personalitySuggestions, setPersonalitySuggestions] = React.useState<string[]>([]);
  const [restrictionSuggestions, setRestrictionSuggestions] = React.useState<string[]>([]);
  const [showPersonalityPopover, setShowPersonalityPopover] = React.useState(false);
  const [showRestrictionPopover, setShowRestrictionPopover] = React.useState(false);
  const { toast } = useToast();

  const handleSuggestPersonality = async () => {
    setIsSuggestingPersonality(true);
    setShowPersonalityPopover(false); // Close if already open
    try {
      const result = await suggestLlmBehaviorAction({
        suggestionType: 'personality',
        agentGoal,
        agentTasks,
        currentRestrictions: agentRestrictions,
      });
      if (result.success && result.suggestions) {
        setPersonalitySuggestions(result.suggestions);
        setShowPersonalityPopover(true);
        toast({ title: "Sugestões de Personalidade Carregadas", description: "Clique em uma sugestão para aplicá-la." });
      } else {
        toast({ title: "Falha ao Sugerir Personalidade", description: result.error || "Não foi possível obter sugestões.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    } finally {
      setIsSuggestingPersonality(false);
    }
  };

  const handleSuggestRestrictions = async () => {
    setIsSuggestingRestrictions(true);
    setShowRestrictionPopover(false); // Close if already open
    try {
      const result = await suggestLlmBehaviorAction({
        suggestionType: 'restrictions',
        agentGoal,
        agentTasks,
        currentPersonality: agentPersonality,
      });
      if (result.success && result.suggestions) {
        setRestrictionSuggestions(result.suggestions);
        setShowRestrictionPopover(true);
        toast({ title: "Sugestões de Restrições Carregadas", description: "Clique em uma sugestão para adicioná-la." });
      } else {
        toast({ title: "Falha ao Sugerir Restrições", description: result.error || "Não foi possível obter sugestões.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Ocorreu um erro.", variant: "destructive" });
    } finally {
      setIsSuggestingRestrictions(false);
    }
  };

  const applyPersonalitySuggestion = (suggestion: string) => {
    setAgentPersonality(suggestion);
    setShowPersonalityPopover(false);
  };

  const applyRestrictionSuggestion = (suggestion: string) => {
    // Add if not already present
    if (!agentRestrictions.includes(suggestion)) {
      setAgentRestrictions([...agentRestrictions, suggestion]);
    }
    // setShowRestrictionPopover(false); // Keep open to add more
    toast({ title: "Restrição Adicionada", description: `"${suggestion}" foi adicionada.`});
  };


  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="agentGoal">Objetivo do Agente (LLM)</Label>
          <Textarea id="agentGoal" placeholder="Descreva o objetivo principal que o agente LLM deve alcançar. Ex: 'Responder perguntas sobre o produto X com base na documentação fornecida.'" value={agentGoal} onChange={(e) => setAgentGoal(e.target.value)} rows={3}/>
          <p className="text-xs text-muted-foreground">Qual o propósito central deste agente LLM?</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="agentPersonality">Personalidade/Tom (LLM)</Label>
            <Popover open={showPersonalityPopover} onOpenChange={setShowPersonalityPopover}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleSuggestPersonality} disabled={isSuggestingPersonality}>
                  {isSuggestingPersonality ? <Loader2 className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
                  <span className="sr-only">Sugerir Personalidade</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Sugestões de Personalidade</h4>
                  <p className="text-sm text-muted-foreground">Clique para aplicar.</p>
                  {personalitySuggestions.map((s, i) => (
                    <Button key={i} variant="outline" size="sm" className="w-full justify-start text-left" onClick={() => applyPersonalitySuggestion(s)}>{s}</Button>
                  ))}
                  {personalitySuggestions.length === 0 && !isSuggestingPersonality && <p className="text-sm text-muted-foreground">Nenhuma sugestão disponível.</p>}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Select value={agentPersonality} onValueChange={setAgentPersonality}>
            <SelectTrigger id="agentPersonality">
              <SelectValue placeholder="Selecione a personalidade" />
            </SelectTrigger>
            <SelectContent>
              {/* Mapeia as opções de tom/personalidade disponíveis. */}
              {agentToneOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
           <p className="text-xs text-muted-foreground">Define o estilo de comunicação do agente (ex: formal, amigável, conciso).</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="agentTasks" className="cursor-help">Tarefas Principais (LLM)</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Liste cada tarefa principal em uma nova linha. Estas tarefas ajudam o LLM a entender os passos para alcançar seu objetivo.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {/* Placeholder for a potential "Suggest Tasks" button if needed in future */}
        </div>
        <Textarea
          id="agentTasks"
          placeholder="Liste as tarefas principais que o agente deve executar para alcançar seu objetivo. Uma tarefa por linha. Ex: 'Coletar informações sobre X.', 'Analisar Y.', 'Resumir Z.'"
          value={agentTasks.join("\n")}
          onChange={(e) => setAgentTasks(e.target.value.split("\n"))}
          rows={4}
        />
         <p className="text-xs text-muted-foreground">Detalhe os passos ou sub-objetivos que o agente deve completar. Uma tarefa por linha.</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="agentRestrictions" className="cursor-help">Restrições (LLM)</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Liste cada restrição em uma nova linha. Estas são regras ou limites que o LLM deve seguir estritamente.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Popover open={showRestrictionPopover} onOpenChange={setShowRestrictionPopover}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleSuggestRestrictions} disabled={isSuggestingRestrictions}>
                {isSuggestingRestrictions ? <Loader2 className="h-4 w-4 animate-spin" /> : <SparklesIcon className="h-4 w-4" />}
                <span className="sr-only">Sugerir Restrições</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Sugestões de Restrições</h4>
                <p className="text-sm text-muted-foreground">Clique para adicionar.</p>
                {restrictionSuggestions.map((s, i) => (
                  <Button key={i} variant="outline" size="sm" className="w-full justify-start text-left" onClick={() => applyRestrictionSuggestion(s)}>{s}</Button>
                ))}
                {restrictionSuggestions.length === 0 && !isSuggestingRestrictions && <p className="text-sm text-muted-foreground">Nenhuma sugestão disponível.</p>}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Textarea
          id="agentRestrictions"
          placeholder="Liste quaisquer restrições, limitações ou comportamentos que o agente deve evitar. Uma restrição por linha. Ex: 'Não fornecer aconselhamento financeiro.', 'Manter respostas concisas.'"
          value={agentRestrictions.join("\n")}
          onChange={(e) => setAgentRestrictions(e.target.value.split("\n"))}
          rows={3}
        />
         <p className="text-xs text-muted-foreground">Define limites e regras para o comportamento do agente. Uma restrição por linha.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="agentModel">Modelo de Linguagem (LLM)</Label>
          <Input id="agentModel" placeholder="Ex: gemini-1.5-pro-latest, gpt-4" value={agentModel} onChange={(e) => setAgentModel(e.target.value)} />
           <p className="text-xs text-muted-foreground">Especifique o identificador do modelo LLM a ser usado (ex: 'gemini-1.5-flash', 'gpt-3.5-turbo').</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="agentTemperature">Temperatura (LLM) - <Badge variant="outline" className="text-xs">{agentTemperature.toFixed(1)}</Badge></Label>
          <Slider
            id="agentTemperature"
            min={0} max={1} step={0.1}
            value={[agentTemperature]}
            onValueChange={(value) => setAgentTemperature(value[0])}
          />
          <p className="text-xs text-muted-foreground">Controla a criatividade/aleatoriedade das respostas (0=mais determinístico, 1=mais criativo).</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="systemPromptGenerated">Prompt do Sistema Gerado (LLM Preview)</Label>
        <Textarea
          id="systemPromptGenerated"
          readOnly
          value={systemPromptGenerated || "O prompt do sistema será gerado/mostrado aqui com base nas configurações acima (funcionalidade de preview pendente)."}
          rows={5}
          className="bg-muted/40"
        />
         <p className="text-xs text-muted-foreground">Este é um preview de como o prompt do sistema pode ser construído. (Funcionalidade de geração/atualização automática pendente).</p>
      </div>
    </>
  );
};

export default LLMBehaviorForm;
