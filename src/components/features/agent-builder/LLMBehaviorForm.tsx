// LLMBehaviorForm: Componente para o formulário de comportamento específico de agentes LLM.
// Inclui campos para objetivo, tarefas, personalidade, restrições, modelo e temperatura.

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

// Props para o componente LLMBehaviorForm.
interface LLMBehaviorFormProps {
  agentGoal: string;
  setAgentGoal: (goal: string) => void;
  agentTasks: string[];
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
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="agentGoal">Objetivo do Agente (LLM)</Label>
          <Textarea id="agentGoal" placeholder="Descreva o objetivo principal que o agente LLM deve alcançar. Ex: 'Responder perguntas sobre o produto X com base na documentação fornecida.'" value={agentGoal} onChange={(e) => setAgentGoal(e.target.value)} rows={3}/>
          <p className="text-xs text-muted-foreground">Qual o propósito central deste agente LLM?</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="agentPersonality">Personalidade/Tom (LLM)</Label>
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
        <Label htmlFor="agentTasks">Tarefas Principais (LLM)</Label>
        <Textarea
          id="agentTasks"
          placeholder="Liste as tarefas principais que o agente deve executar para alcançar seu objetivo. Uma tarefa por linha. Ex: 'Coletar informações sobre X.', 'Analisar Y.', 'Resumir Z.'"
          value={agentTasks.join("\n")}
          onChange={(e) => setAgentTasks(e.target.value.split("\n"))}
          rows={4}
        />
         <p className="text-xs text-muted-foreground">Detalhe os passos ou sub-objetivos que o agente deve completar.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="agentRestrictions">Restrições (LLM)</Label>
        <Textarea
          id="agentRestrictions"
          placeholder="Liste quaisquer restrições, limitações ou comportamentos que o agente deve evitar. Uma restrição por linha. Ex: 'Não fornecer aconselhamento financeiro.', 'Manter respostas concisas.'"
          value={agentRestrictions.join("\n")}
          onChange={(e) => setAgentRestrictions(e.target.value.split("\n"))}
          rows={3}
        />
         <p className="text-xs text-muted-foreground">Define limites e regras para o comportamento do agente.</p>
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
