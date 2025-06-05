"use client"; // Test comment
import { llmModels as appLlmModels } from '../../../data/llm-models';
import type { LLMModel } from '@/types/llm-types';
import ChatTargetSelector from "./ChatTargetSelector";
import ChatControls from "./ChatControls";

// useState is no longer needed as all local state was removed.
// import { useState } from "react";
import { Button } from "@/components/ui/button"; // Keep for Menu button
import { Menu } from "lucide-react"; // Only Menu is kept from lucide-react here
// All other specific UI components (Image, Select, Switch, Label, ThemeToggle, Popover, Slider, Badge) have been moved.
// All other specific Lucide Icons (Cpu, Plus, etc.) have been moved.
// AgentSelector was not used.
// toast has been moved.
import type { SavedAgentConfiguration } from '@/types/agent-configs-fixed'; // Keep if activeChatTargetDetails uses it
// llmModels (original) import is removed. appLlmModels is used for passing prop.
import { useAuth } from "@/contexts/AuthContext"; // Kept: currentUser/authLoading passed to ChatControls
import { ActiveChatTarget } from "@/hooks/use-chat-store";
import { ChatRunConfig } from "@/types/chat";
// LLMModel type is imported via the first diff.
// ChatTargetSelector and ChatControls are imported via the first diff.

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
  llmModels: LLMModel[]; // Added llmModels prop
  handleNewConversation: () => void;
  isSidebarOpen?: boolean;
  isADKInitializing?: boolean;
  onExportChatLog?: () => void;
  handleLogin: () => void;
  handleLogout: () => void;
  isVerboseMode: boolean; // Added isVerboseMode prop
  onToggleVerboseMode: () => void; // Added onToggleVerboseMode prop
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
  userChatConfig,
  onUserChatConfigChange,
}: ChatHeaderProps) {
  const { currentUser, loading: authLoading } = useAuth();
  // Removed local states: isModelDropdownOpen, isChatSettingsOpen
  // Removed local helper functions: simulatedVoiceOptions, handleGemSelect, getSelectedModelName, agentDisplayName, llmModelName

  // Logic for displayName remains here as it's part of the header's direct responsibility
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

      {/* Placeholder for ChatTargetSelector */}
      <ChatTargetSelector
        activeChatTargetDetails={activeChatTargetDetails}
        usingADKAgent={usingADKAgent}
        setUsingADKAgent={setUsingADKAgent}
        selectedADKAgentId={selectedADKAgentId}
        setSelectedADKAgentId={setSelectedADKAgentId}
        adkAgents={adkAgents}
        selectedGemId={selectedGemId}
        setSelectedGemId={setSelectedGemId}
        initialGems={initialGems}
        isADKInitializing={isADKInitializing}
        llmModels={appLlmModels} // Pass llmModels here
      />
      
      {/* Placeholder for ChatControls */}
      <ChatControls
        handleNewConversation={handleNewConversation}
        onExportChatLog={onExportChatLog}
        currentUser={currentUser}
        authLoading={authLoading}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        isVerboseMode={isVerboseMode}
        onToggleVerboseMode={onToggleVerboseMode}
        userChatConfig={userChatConfig}
        onUserChatConfigChange={onUserChatConfigChange}
      />
    </header>
  );
}
