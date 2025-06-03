"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentSelector } from "@/components/features/agent-selector/agent-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Menu,
  Cpu,
  Plus,
  LogIn,
  LogOut,
  DownloadCloud, // Added DownloadCloud
} from "lucide-react"; // Added LogIn, LogOut
import type { SavedAgentConfiguration } from '@/types/agent-configs-fixed';
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ActiveChatTarget } from "@/hooks/use-chat-store"; // Import ActiveChatTarget

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
  activeChatTargetDetails?: ActiveChatTarget | null; // Changed from activeChatTarget: string
  usingADKAgent: boolean;
  setUsingADKAgent: (value: boolean) => void;
  selectedADKAgentId: string | null;
  setSelectedADKAgentId: (id: string | null) => void;
  adkAgents: ADKAgent[];
  selectedGemId: string | null;
  setSelectedGemId: (id: string | null) => void;
  initialGems: Gem[];
  handleNewConversation: () => void;
  isSidebarOpen?: boolean;
  isADKInitializing?: boolean;
  onExportChatLog?: () => void; // Add this
  handleLogin: () => void;
  handleLogout: () => void;
}

export default function ChatHeader({
  onMenuToggle,
  activeChatTargetDetails, // Changed from activeChatTarget
  usingADKAgent,
  setUsingADKAgent,
  selectedADKAgentId,
  setSelectedADKAgentId,
  adkAgents,
  selectedGemId,
  setSelectedGemId,
  initialGems,
  handleNewConversation,
  isSidebarOpen,
  isADKInitializing,
  onExportChatLog, // Add this
  handleLogin,
  handleLogout,
}: ChatHeaderProps) {
  const { currentUser, loading: authLoading } = useAuth();
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  const handleGemSelect = (id: string) => {
    setSelectedGemId(id);
    setIsModelDropdownOpen(false);
  };

  // handleLogin and handleLogout are now passed as props

  // Determina qual nome de modelo mostrar
  const getSelectedModelName = () => {
    if (usingADKAgent && selectedADKAgentId) {
      const selectedAgent = adkAgents.find(agent => agent.id === selectedADKAgentId);
      return selectedAgent?.displayName || "Agente ADK";
    } else if (selectedGemId) {
      const selectedGem = initialGems.find(gem => gem.id === selectedGemId);
      return selectedGem?.name || "Gem";
    }
    return "Assistente IA";
  };

  // Determine display name based on activeChatTargetDetails
  let displayName = "Nova Conversa";
  if (activeChatTargetDetails) {
    const prefix =
      activeChatTargetDetails.type === "gem"
        ? "Gem: "
        : activeChatTargetDetails.type === "agent"
        ? "Agent: "
        : activeChatTargetDetails.type === "adk-agent"
        ? "ADK Agent: "
        : "";
    displayName = prefix + activeChatTargetDetails.name;
  }


  return (
    <header className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur-sm mx-auto w-full">
      {/* Lado esquerdo - Menu e título */}
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          title={isSidebarOpen ? "Fechar Menu" : "Abrir Menu"}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-medium truncate max-w-[120px] sm:max-w-xs md:max-w-md">
          {displayName}
        </h1>
      </div>

      {/* Centro - Seletor de modelo */}
      <div className="relative">
        <Button 
          variant="outline" 
          className="flex items-center gap-2 h-9 rounded-full border border-muted bg-background/50 px-3 py-1"
          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
        >
          {usingADKAgent ? (
            <Cpu className="h-4 w-4 text-primary" />
          ) : (
            <span className="h-4 w-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
          )}
          <span className="text-sm font-medium">{getSelectedModelName()}</span>
          <span className="text-xs text-muted-foreground">▼</span>
        </Button>
        
        {isModelDropdownOpen && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-60 bg-background border rounded-lg shadow-lg z-50 py-1">
            <div className="p-2 border-b">
              <h3 className="text-sm font-medium">Modelos</h3>
              <div className="mt-1 space-y-1">
                {initialGems.map((gem) => (
                  <Button 
                    key={gem.id} 
                    variant={selectedGemId === gem.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm h-8"
                    onClick={() => {
                      handleGemSelect(gem.id);
                      setUsingADKAgent(false);
                    }}
                  >
                    <span className="h-3 w-3 mr-2 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                    {gem.name}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="p-2">
              <h3 className="text-sm font-medium">Agentes ADK</h3>
              <div className="mt-1 space-y-1">
                {isADKInitializing ? (
                  <div className="flex items-center justify-center p-2">
                    <span className="animate-spin h-4 w-4 border-b-2 border-primary rounded-full mr-2" />
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  </div>
                ) : adkAgents.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">
                    Nenhum agente ADK disponível
                  </div>
                ) : (
                  adkAgents.map((agent) => (
                    <Button 
                      key={agent.id} 
                      variant={selectedADKAgentId === agent.id ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm h-8"
                      onClick={() => {
                        setSelectedADKAgentId(agent.id);
                        setUsingADKAgent(true);
                        setIsModelDropdownOpen(false);
                      }}
                    >
                      <Cpu className="h-3 w-3 mr-2 text-primary" />
                      {agent.displayName}
                    </Button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Lado direito - Ações e perfil */}
      <div className="flex items-center gap-2">
        {/* Nova conversa */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewConversation}
          className="text-muted-foreground hover:text-foreground"
          title="Nova conversa"
        >
          <Plus className="h-5 w-5" />
        </Button>
        
        {/* Add Export Button Before ThemeToggle or New Conversation for grouping user actions */}
        {currentUser && onExportChatLog && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onExportChatLog}
            className="text-muted-foreground hover:text-foreground"
            title="Exportar Histórico da Conversa"
          >
            <DownloadCloud className="h-5 w-5" />
          </Button>
        )}

        {/* Alternador de tema */}
        <ThemeToggle className="text-muted-foreground hover:text-foreground" />
        
        {/* Autenticação */}
        {authLoading ? (
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        ) : currentUser ? (
          <div className="relative group">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full overflow-hidden p-0 h-8 w-8 border border-muted" 
              onClick={handleLogout}
              title={currentUser.displayName || currentUser.email || "Perfil do usuário"}
            >
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                  {(currentUser.displayName?.[0] || currentUser.email?.[0] || "U").toUpperCase()}
                </div>
              )}
            </Button>
            <div className="absolute right-0 top-full mt-1 w-auto min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 bg-background border rounded-lg shadow-lg z-50 py-1 text-sm">
              <div className="px-3 py-2 border-b truncate max-w-[200px]">
                {currentUser.displayName || currentUser.email}
              </div>
              <Button 
                variant="ghost" 
                className="w-full justify-start h-9 px-3"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogin}
            className="h-8 rounded-full"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Entrar
          </Button>
        )}


      </div>
    </header>
  );
}
