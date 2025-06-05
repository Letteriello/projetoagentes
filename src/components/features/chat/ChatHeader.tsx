"use client";

import { useState } from "react";
import Image from "next/image"; // Import next/image
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; // Added Switch import
import { Label } from "@/components/ui/label";   // Added Label import
import { Input } from "@/components/ui/input"; // Added Input import
import { AgentSelector } from "@/components/features/agent-selector/agent-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Menu,
  Cpu,
  Plus,
  LogIn,
  LogOut,
  DownloadCloud, // Added DownloadCloud
  Settings, // Added Settings icon for ChatRunConfig
  Maximize, // Added Maximize for Focus Mode
  Minimize, // Added Minimize for Focus Mode
} from "lucide-react"; // Added LogIn, LogOut
import type { SavedAgentConfiguration } from '@/types/agent-core'; // Updated path
import { llmModels } from '../../../data/llm-models'; // Import llmModels
import { Badge } from "@/components/ui/badge"; // Import Badge
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Added Popover
import { Slider } from "@/components/ui/slider"; // Added Slider
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ActiveChatTarget } from "@/hooks/use-chat-store"; // Import ActiveChatTarget
import { ChatRunConfig } from "@/types/chat-core"; // Updated path
import { capitalizeFirstLetter } from "@/lib/utils"; // Import capitalizeFirstLetter

interface Gem {
  id: string;
  name: string;
  prompt?: string;
}

interface ADKAgent {
  id: string;
  displayName: string;
}

export interface ChatHeaderProps { // Added export keyword
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
  onExportChatLog?: () => void;
  handleLogin: () => void;
  handleLogout: () => void;
  isVerboseMode: boolean; // Added isVerboseMode prop
  onToggleVerboseMode: () => void; // Added onToggleVerboseMode prop
  isFocusModeActive: boolean; // Added isFocusModeActive prop
  onToggleFocusMode: () => void; // Added onToggleFocusMode prop
  userChatConfig: ChatRunConfig;
  onUserChatConfigChange: (newConfig: Partial<ChatRunConfig>) => void;
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
  onExportChatLog,
  handleLogin,
  handleLogout,
  isVerboseMode, // Added isVerboseMode
  onToggleVerboseMode, // Added onToggleVerboseMode
  isFocusModeActive, // Added isFocusModeActive
  onToggleFocusMode, // Added onToggleFocusMode
  userChatConfig,
  onUserChatConfigChange,
}: ChatHeaderProps) {
  const { currentUser, loading: authLoading } = useAuth();
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);

  const simulatedVoiceOptions = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];

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
    // If an agent from SavedAgentConfiguration is active
    if (activeChatTargetDetails?.type === 'agent' && activeChatTargetDetails.details?.config) {
      return activeChatTargetDetails.name; // This is the agent's name
    }
    return "Assistente IA"; // Default fallback
  };

  const agentDisplayName = getSelectedModelName();

  let llmModelName: string | undefined = undefined;
  let agentFramework: string | undefined = undefined;

  if (activeChatTargetDetails?.type === 'agent' && activeChatTargetDetails.details?.config) {
    const agentConfig = activeChatTargetDetails.details.config;
    if (agentConfig.type === 'llm' && agentConfig.agentModel) { // Check type for agentModel access
      const modelDetails = llmModels.find(m => m.id === agentConfig.agentModel);
      llmModelName = modelDetails?.name;
    }
    if (agentConfig.framework) {
      agentFramework = agentConfig.framework;
    }
  } else if (activeChatTargetDetails?.type === 'gem') {
    // For Gems, if they are configured to use a specific LLM model ID stored somewhere (e.g. in gem.llmModelId)
    // This part is speculative as Gem type doesn't explicitly have llmModelId
    // For now, we assume Gems don't show a sub-LLM model name unless their structure changes.
    // If a Gem IS an LLM model itself (e.g. selectedGemId is an LLM model ID)
    // then llmModelName could be derived from llmModels using selectedGemId.
    // However, getSelectedModelName() already returns the Gem's name.
  }


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
          <span className="text-sm font-medium">{agentDisplayName}</span>
          {llmModelName && (
            <Badge variant="outline" className="ml-2 text-xs">
              {llmModelName}
            </Badge>
          )}
          {agentFramework && (
            <Badge variant="info" className="ml-2 text-xs">
              {capitalizeFirstLetter(agentFramework)}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-1">▼</span>
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

        {/* Focus Mode Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFocusMode}
          className="text-muted-foreground hover:text-foreground"
          title={isFocusModeActive ? "Sair do Modo Foco" : "Entrar no Modo Foco"}
        >
          {isFocusModeActive ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </Button>
        
        {/* Add Export Button */}
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

        {/* Verbose Mode Toggle */}
        <div className="flex items-center gap-1.5 pr-2 border-r mr-2">
          <Switch
            id="verbose-mode"
            checked={isVerboseMode}
            onCheckedChange={onToggleVerboseMode}
            aria-label="Modo Verbose"
          />
          <Label htmlFor="verbose-mode" className="text-sm text-muted-foreground cursor-pointer">
            Verbose
          </Label>
        </div>

        {/* Alternador de tema */}
        <ThemeToggle className="text-muted-foreground hover:text-foreground" />

        {/* Chat Settings Popover */}
        <Popover open={isChatSettingsOpen} onOpenChange={setIsChatSettingsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              title="Configurações de Chat"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Configurações de Chat</h4>
                <p className="text-sm text-muted-foreground">
                  Ajuste o comportamento do chat.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="streaming-enabled">Habilitar Streaming</Label>
                  <Switch
                    id="streaming-enabled"
                    checked={userChatConfig.streamingEnabled}
                    onCheckedChange={(checked) => onUserChatConfigChange({ streamingEnabled: checked, stream_response: checked })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="voice-select">Voz Simulada</Label>
                  <Select
                    value={userChatConfig.simulatedVoiceConfig?.voice || 'alloy'}
                    onValueChange={(value) => {
                      const newSimulatedVoiceConfig = {
                        voice: value,
                        speed: userChatConfig.simulatedVoiceConfig?.speed || 1.0
                      };
                      onUserChatConfigChange({
                        simulatedVoiceConfig: newSimulatedVoiceConfig,
                        speech_config: newSimulatedVoiceConfig
                      });
                    }}
                  >
                    <SelectTrigger id="voice-select">
                      <SelectValue placeholder="Selecione uma voz" />
                    </SelectTrigger>
                    <SelectContent>
                      {simulatedVoiceOptions.map(voice => (
                        <SelectItem key={voice} value={voice}>
                          {voice.charAt(0).toUpperCase() + voice.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="voice-speed">Velocidade da Voz ({userChatConfig.simulatedVoiceConfig?.speed || 1.0}x)</Label>
                  <Slider
                    id="voice-speed"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={[userChatConfig.simulatedVoiceConfig?.speed || 1.0]}
                    onValueChange={(value) => {
                      const newSimulatedVoiceConfig = {
                        voice: userChatConfig.simulatedVoiceConfig?.voice || 'alloy',
                        speed: value[0]
                      };
                      onUserChatConfigChange({
                        simulatedVoiceConfig: newSimulatedVoiceConfig,
                        speech_config: newSimulatedVoiceConfig
                      });
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="max-llm-calls">Max LLM Calls (0 for unlimited)</Label>
                  <Input
                    id="max-llm-calls"
                    type="number"
                    min="0"
                    placeholder="e.g., 10"
                    value={userChatConfig.max_llm_calls === undefined ? '' : String(userChatConfig.max_llm_calls)}
                    onChange={(e) => {
                      const value = e.target.value;
                      onUserChatConfigChange({
                        max_llm_calls: value === '' ? undefined : parseInt(value, 10)
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

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
                <Image src={currentUser.photoURL} alt="Avatar" width={32} height={32} className="h-full w-full object-cover" />
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
