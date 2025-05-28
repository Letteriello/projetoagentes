import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgentSelector } from "@/components/agent-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, RefreshCcw, Cpu, Sparkles, Plus } from "lucide-react";
import type { SavedAgentConfiguration } from "@/app/agent-builder/page"; 

interface Gem {
  id: string;
  name: string;
  prompt?: string; 
}

interface ADKAgent {
  id: string;
  displayName: string;
}

interface ChatHeaderProps {
  onMenuToggle?: () => void;
  activeChatTarget: string;
  usingADKAgent: boolean;
  setUsingADKAgent: (value: boolean) => void;
  selectedADKAgentId: string | null;
  setSelectedADKAgentId: (id: string | null) => void;
  adkAgents: ADKAgent[];
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;
  savedAgents: SavedAgentConfiguration[];
  selectedGemId: string | null;
  setSelectedGemId: (id: string | null) => void;
  initialGems: Gem[]; 
  handleNewConversation: () => void;
  isSidebarOpen?: boolean; 
  isADKInitializing?: boolean;
}

export default function ChatHeader({
  onMenuToggle,
  activeChatTarget,
  usingADKAgent,
  setUsingADKAgent,
  selectedADKAgentId,
  setSelectedADKAgentId,
  adkAgents,
  selectedAgentId,
  setSelectedAgentId,
  savedAgents,
  selectedGemId,
  setSelectedGemId,
  initialGems,
  handleNewConversation,
  isSidebarOpen,
  isADKInitializing,
}: ChatHeaderProps) {
  const handleGemSelect = (id: string) => {
    setSelectedGemId(id);
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onMenuToggle} title={isSidebarOpen ? "Fechar Menu" : "Abrir Menu"}>
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold truncate max-w-xs md:max-w-md lg:max-w-lg">
          {activeChatTarget || "Chat"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {usingADKAgent ? (
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <Select value={selectedADKAgentId || ""} onValueChange={(value) => setSelectedADKAgentId(value === "" ? null : value)}>
              <SelectTrigger className="w-auto min-w-[150px] max-w-[200px] truncate">
                <SelectValue placeholder="Selecione Agente ADK" />
              </SelectTrigger>
              <SelectContent>
                {isADKInitializing ? (
                  <SelectItem value="loading" disabled>
                    Carregando agentes ADK...
                  </SelectItem>
                ) : adkAgents.length === 0 ? (
                  <SelectItem value="no-adk-agents" disabled>
                    Nenhum agente ADK configurado
                  </SelectItem>
                ) : (
                  <>
                    {!selectedADKAgentId && <SelectItem value="">Selecione um Agente ADK</SelectItem>}
                    {adkAgents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.displayName}
                      </SelectItem>
                    ))}
                  </>
                )}
                <SelectItem value="">Desativar Agente ADK</SelectItem> 
              </SelectContent>
            </Select>
          </div>
        ) : (
          <AgentSelector
            agents={initialGems.map(gem => ({ id: gem.id, name: gem.name, description: gem.prompt }))}
            selectedAgentId={selectedGemId ?? undefined}
            onSelectAgent={(id) => handleGemSelect(id ?? '')}
            agentType="Gems"
          />
        )}

        <Button variant="outline" size="icon" onClick={handleNewConversation} title="Nova Conversa">
          <Plus className="h-5 w-5" />
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}
