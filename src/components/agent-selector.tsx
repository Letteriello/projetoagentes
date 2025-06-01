import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// import { GoogleADK, sendMessageToAgent } from "@/lib/google-adk"; // Removed deprecated import
import { Cpu, Info, Plus, Settings } from "lucide-react"; // Plus and Settings are no longer used directly, but kept for now
import { useToast } from "@/hooks/use-toast"; // Added useToast import
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AgentData {
  id: string;
  displayName: string;
  description?: string;
  model: string;
  tools?: any[];
  capabilities?: string[];
}

import type { SavedAgentConfiguration } from "@/types/agent-configs";
import type { Gem } from "@/data/agentBuilderConfig"; // Added Gem import

// TODO: Move AgentSelectItem to a shared types file
interface AgentSelectItem {
  id: string;
  displayName: string;
}

interface AgentSelectorProps {
  onAgentSelected: (agentId: string) => void;
  selectedAgentId?: string;
  savedAgents: SavedAgentConfiguration[]; 
  gems?: Gem[];
  adkAgents?: AgentSelectItem[];
  showLabel?: boolean;
  triggerClassName?: string;
  selectedGemId?: string;
  onSelectGem?: (id: string) => void;
  selectedADKAgentId?: string; 
onSelectADKAgent?: (id: string) => void;
}

export function AgentSelector({
  onAgentSelected,
  selectedAgentId,
  savedAgents,
  showLabel = false,
  triggerClassName = "",
}: AgentSelectorProps) {
  const [agents, setAgents] = useState<AgentData[]>([]);
  // const [isConfiguring, setIsConfiguring] = useState(false); // Related to removed API key config
  // const [apiKey, setApiKey] = useState(""); // Related to removed API key config
  // const googleADK = new GoogleADK(); // Removed deprecated ADK instantiation
  const { toast } = useToast(); // Added toast declaration

  // Carrega os agentes disponíveis
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = () => {
    // Em um cenário real, isso buscaria da API do Google ADK
    // Por enquanto, carregamos do localStorage
    if (typeof window !== "undefined") {
      try {
        const adkAgentsFromStorage = JSON.parse(
          localStorage.getItem("ADK_AGENTS") || "[]", // Assuming it's an array now or an empty array
        );
        // Ensure AgentData structure is somewhat compatible or map it
        // For now, direct cast if structure is simple
        const agentsList: AgentData[] = adkAgentsFromStorage.map((agent: any) => ({
          id: agent.id || agent.agentId || agent.name, // Try to find a suitable ID
          displayName: agent.displayName || agent.name || "Unnamed Agent",
          description: agent.description,
          model: agent.model || (agent.config?.agentModel), // Example of trying to get model
          tools: agent.tools || (agent.config?.agentTools),
          capabilities: agent.capabilities,
        }));
        setAgents(agentsList);
      } catch (error) {
        console.error("Erro ao carregar agentes ADK do localStorage:", error);
        setAgents([]);
      }
    }
  };

  // const handleApiKeySave = () => { // Removed as ADK object is removed
  //   if (apiKey.trim()) {
  //     // googleADK.setApiKey(apiKey.trim());
  //     // setIsConfiguring(false);
  //     // Recarrega os agentes após configurar a API
  //     loadAgents();
  //   }
  // };

  const handleAgentSelect = (agentId: string) => {
    onAgentSelected(agentId);
  };

  // Agentes de exemplo pré-configurados - This functionality is removed as createCustomAgent is deprecated
  // const createDefaultAgents = async () => {
  //   try {
  //     const defaultAgentsData = [
  //       {
  //         name: "Assistente de Pesquisa",
  //         description: "Um agente especializado em buscar e resumir informações",
  //         tools: ["web_search"],
  //         systemPrompt: "Você é um assistente de pesquisa focado em encontrar informações precisas e resumir conteúdo de forma clara e concisa.",
  //       },
  //       {
  //         name: "Analista de Dados",
  //         description: "Um agente para análise e visualização de dados",
  //         tools: ["calculator", "web_search"],
  //         systemPrompt: "Você é um analista de dados especializado. Ajude a interpretar dados, realizar cálculos e oferecer insights baseados em informações numéricas.",
  //       },
  //     ];
  //     // The import and call to module.createCustomAgent is removed.
  //     // This functionality needs to be re-implemented using the new agent creation mechanisms if desired.
  //     console.warn("createDefaultAgents functionality has been removed as it relied on deprecated google-adk functions.");
  //     // toast({ title: "Funcionalidade Removida", description: "A criação de agentes ADK padrão foi removida.", variant: "default" }); // Toast call
  //     // loadAgents(); // Might not be needed if no agents are created
  //   } catch (error) {
  //     console.error("Erro ao tentar criar agentes padrão (funcionalidade removida):", error);
  //   }
  // };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Agentes (Legado ADK)</h3> {/* Renamed to indicate legacy */}

        {/* Removed Settings and Plus buttons as their functionality is deprecated */}
        {/* <div className="flex items-center gap-2"> ... </div> */}
      </div>

      {/* Seletor de Agentes */}
      {agents.length > 0 ? (
        <Select value={selectedAgentId} onValueChange={handleAgentSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um agente (Legado ADK)" />
          </SelectTrigger>
          <SelectContent>
            {agents.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span>{agent.displayName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="text-xs text-muted-foreground p-2 rounded-md bg-accent/10 border border-border">
          {/* Updated message as API key check and agent creation are removed */}
          <p>Nenhum agente ADK legado encontrado no localStorage.</p>
          {/* <Button size="sm" variant="outline" onClick={createDefaultAgents}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Criar agentes exemplo (Removido)
              </Button> */}
        </div>
      )}

      {/* Detalhes do Agente Selecionado */}
      {selectedAgentId && agents.length > 0 && (
        <div className="mt-2">
          {agents
            .filter((a) => a.id === selectedAgentId)
            .map((agent) => (
              <Card key={agent.id} className="bg-accent/5 border-accent/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    {agent.displayName}
                  </CardTitle>
                  {agent.description && (
                    <CardDescription className="text-xs">
                      {agent.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {agent.capabilities?.map((cap) => (
                      <Badge
                        key={cap}
                        variant="outline"
                        className="text-[10px] bg-primary/10"
                      >
                        {cap}
                      </Badge>
                    ))}
                  </div>

                  {Array.isArray(agent.tools) && agent.tools.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">Ferramentas:</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.tools.map((tool: any) => ( // Added type any for tool
                          <Badge
                            key={tool.name || tool} // Handle if tool is string or object
                            className="text-[10px] bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                          >
                            {tool.name || tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Modal de Configuração da API - Removed as it's no longer used */}
      {/* <Popover open={isConfiguring} onOpenChange={setIsConfiguring}> ... </Popover> */}
    </div>
  );
}
