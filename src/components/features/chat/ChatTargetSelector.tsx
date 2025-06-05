import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cpu } from "lucide-react";
import type { ActiveChatTarget } from "@/hooks/use-chat-store";
import type { LLMModel } from '@/types/llm-types'; // Assuming LLMModel type path

// Define Gem and ADKAgent types locally or import if they are shared
interface Gem {
  id: string;
  name: string;
  prompt?: string;
}

interface ADKAgent {
  id: string;
  displayName: string;
}

interface ChatTargetSelectorProps {
  activeChatTargetDetails?: ActiveChatTarget | null;
  usingADKAgent: boolean;
  setUsingADKAgent: (value: boolean) => void;
  selectedADKAgentId: string | null;
  setSelectedADKAgentId: (id: string | null) => void;
  adkAgents: ADKAgent[];
  selectedGemId: string | null;
  setSelectedGemId: (id: string | null) => void;
  initialGems: Gem[];
  isADKInitializing?: boolean;
  llmModels: LLMModel[]; // Pass llmModels as a prop
}

const ChatTargetSelector: React.FC<ChatTargetSelectorProps> = ({
  activeChatTargetDetails,
  usingADKAgent,
  setUsingADKAgent,
  selectedADKAgentId,
  setSelectedADKAgentId,
  adkAgents,
  selectedGemId,
  setSelectedGemId,
  initialGems,
  isADKInitializing,
  llmModels,
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const handleGemSelect = (id: string) => {
    setSelectedGemId(id);
    setUsingADKAgent(false); // When a Gem is selected, ADK agent is not used
    setIsModelDropdownOpen(false);
  };

  const getSelectedModelName = () => {
    if (usingADKAgent && selectedADKAgentId) {
      const selectedAgent = adkAgents.find(agent => agent.id === selectedADKAgentId);
      return selectedAgent?.displayName || "ADK Agent";
    } else if (selectedGemId && !usingADKAgent) { // Ensure not using ADK agent
      const selectedGem = initialGems.find(gem => gem.id === selectedGemId);
      return selectedGem?.name || "Gem";
    }
    // If an agent from SavedAgentConfiguration is active (handled by activeChatTargetDetails)
    if (activeChatTargetDetails?.type === 'agent' && activeChatTargetDetails.details?.config) {
      return activeChatTargetDetails.name;
    }
    // Fallback if a Gem is selected but `usingADKAgent` might not have been updated yet by an external action
    if (selectedGemId) {
        const selectedGem = initialGems.find(gem => gem.id === selectedGemId);
        if (selectedGem) return selectedGem.name;
    }
    return "Assistente IA"; // Default fallback
  };

  const agentDisplayName = getSelectedModelName();

  let llmModelName: string | undefined = undefined;
  if (activeChatTargetDetails?.type === 'agent' && activeChatTargetDetails.details?.config?.type === 'llm') {
    const agentConfig = activeChatTargetDetails.details.config;
    if (agentConfig.agentModel) {
      const modelDetails = llmModels.find(m => m.id === agentConfig.agentModel);
      llmModelName = modelDetails?.name;
    }
  }
  // Note: The logic for displaying llmModelName for Gems or ADK Agents if they have an underlying LLM
  // would need to be added here if that information is available and desired.

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="flex items-center gap-2 h-9 rounded-full border border-muted bg-background/50 px-3 py-1"
        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
        title="Selecionar Modelo ou Agente"
      >
        {usingADKAgent ? (
          <Cpu className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <span className="h-4 w-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shrink-0" />
        )}
        <span className="text-sm font-medium truncate max-w-[100px] sm:max-w-[150px]">{agentDisplayName}</span>
        {llmModelName && (
          <Badge variant="outline" className="ml-1 text-xs shrink-0">
            {llmModelName}
          </Badge>
        )}
        <span className="text-xs text-muted-foreground ml-1 shrink-0">▼</span>
      </Button>

      {isModelDropdownOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-64 max-h-[70vh] overflow-y-auto bg-background border rounded-lg shadow-lg z-50 py-1">
          <div className="p-2 border-b">
            <h3 className="text-sm font-medium px-2">Modelos (Gems)</h3>
            <div className="mt-1 space-y-1">
              {initialGems.map((gem) => (
                <Button
                  key={gem.id}
                  variant={selectedGemId === gem.id && !usingADKAgent ? "secondary" : "ghost"}
                  className="w-full justify-start text-sm h-8"
                  onClick={() => handleGemSelect(gem.id)}
                  title={gem.name}
                >
                  <span className="h-3 w-3 mr-2 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 shrink-0" />
                  <span className="truncate">{gem.name}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="p-2">
            <h3 className="text-sm font-medium px-2">Agentes ADK</h3>
            <div className="mt-1 space-y-1">
              {isADKInitializing ? (
                <div className="flex items-center justify-center p-2">
                  <span className="animate-spin h-4 w-4 border-b-2 border-primary rounded-full mr-2" />
                  <span className="text-sm text-muted-foreground">Carregando...</span>
                </div>
              ) : adkAgents.length === 0 ? (
                <div className="text-sm text-muted-foreground p-2 text-center">
                  Nenhum agente ADK disponível
                </div>
              ) : (
                adkAgents.map((agent) => (
                  <Button
                    key={agent.id}
                    variant={selectedADKAgentId === agent.id && usingADKAgent ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm h-8"
                    onClick={() => {
                      setSelectedADKAgentId(agent.id);
                      setUsingADKAgent(true);
                      setIsModelDropdownOpen(false);
                    }}
                    title={agent.displayName}
                  >
                    <Cpu className="h-3 w-3 mr-2 text-primary shrink-0" />
                    <span className="truncate">{agent.displayName}</span>
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatTargetSelector;
