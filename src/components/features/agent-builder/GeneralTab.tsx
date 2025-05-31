// GeneralTab: Componente para a aba 'Geral' do diálogo de criação de agentes.
// Este componente encapsula os campos de configuração básicos de um agente,
// como nome, descrição, tipo e framework.

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs"; // Needed for the root element
import type { AgentFramework } from "@/types/agent-configs"; // For setAgentFramework prop

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
}) => {
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
          <Label htmlFor="agentFramework">Framework do Agente</Label>
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
