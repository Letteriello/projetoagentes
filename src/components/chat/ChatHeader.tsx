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
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  savedAgents: SavedAgentConfiguration[];
  selectedGemId: string;
  setSelectedGemId: (id: string) => void;
  initialGems: Gem[]; 
  handleNewConversation: () => void;
  isSidebarOpen?: boolean; 
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
}: ChatHeaderProps) {
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
                {!selectedADKAgentId && <SelectItem value="">Selecione um Agente ADK</SelectItem>}
                {adkAgents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.displayName}
                  </SelectItem>
                ))}
                <SelectItem value="">Desativar Agente ADK</SelectItem> 
              </SelectContent>
            </Select>
          </div>
        ) : (
          <AgentSelector
            selectedAgentId={selectedAgentId}
            onAgentSelect={(agentId) => {
              setSelectedAgentId(agentId);
              if (agentId === 'google-adk') {
                setUsingADKAgent(true);
              } else {
                setUsingADKAgent(false);
                setSelectedADKAgentId(null);
              }
            }}
            savedAgents={savedAgents}
            showLabel={false}
            triggerClassName="w-auto min-w-[150px] max-w-[200px] truncate"
          />
        )}

        {!usingADKAgent && selectedAgentId === 'none' && (
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <Select value={selectedGemId} onValueChange={setSelectedGemId}>
              <SelectTrigger className="w-auto min-w-[150px] max-w-[200px] truncate">
                <SelectValue placeholder="Selecione um Gem" />
              </SelectTrigger>
              <SelectContent>
                {initialGems.map((gem) => (
                  <SelectItem key={gem.id} value={gem.id}>
                    {gem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button variant="outline" size="icon" onClick={handleNewConversation} title="Nova Conversa">
          <Plus className="h-5 w-5" />
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}
