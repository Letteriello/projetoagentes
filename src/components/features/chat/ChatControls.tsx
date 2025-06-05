import React from 'react';
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  Plus,
  DownloadCloud,
  Settings,
  LogIn,
  LogOut,
  // Menu, // Menu is likely for sidebar, not general controls here
} from "lucide-react";
import Image from "next/image"; // If user profile image is part of controls
import type { User } from "firebase/auth"; // Or your user type
import type { ChatRunConfig } from "@/types/chat";

interface ChatControlsProps {
  // Props will be identified after inspecting ChatHeader.tsx
  // Example props:
  handleNewConversation: () => void;
  onExportChatLog?: () => void;
  currentUser: User | null | undefined; // Or your specific user type
  authLoading: boolean;
  handleLogin: () => void;
  handleLogout: () => void;
  isVerboseMode: boolean;
  onToggleVerboseMode: () => void;
  userChatConfig: ChatRunConfig;
  onUserChatConfigChange: (newConfig: Partial<ChatRunConfig>) => void;
  // setIsChatSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>; // If popover state managed outside
  // isChatSettingsOpen: boolean;
}

const ChatControls: React.FC<ChatControlsProps> = (props) => {
  const {
    handleNewConversation,
    onExportChatLog,
    currentUser,
    authLoading,
    handleLogin,
    handleLogout,
    isVerboseMode,
    onToggleVerboseMode,
    userChatConfig,
    onUserChatConfigChange,
  } = props;

  // Local state for popover if not controlled from parent
  const [isChatSettingsOpen, setIsChatSettingsOpen] = React.useState(false);
  const simulatedVoiceOptions = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];


  // UI and logic for "Nova Conversa", "Tema", "Configurações", Auth will go here
  return (
    <div className="flex items-center gap-2">
      {/* Placeholder for controls */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNewConversation}
        className="text-muted-foreground hover:text-foreground"
        title="Nova conversa"
      >
        <Plus className="h-5 w-5" />
      </Button>

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

      <div className="flex items-center gap-1.5 pr-2 border-r mr-2">
        <Switch
          id="verbose-mode-controls" // Ensure unique ID if ChatHeader also has one
          checked={isVerboseMode}
          onCheckedChange={onToggleVerboseMode}
          aria-label="Modo Verbose"
        />
        <Label htmlFor="verbose-mode-controls" className="text-sm text-muted-foreground cursor-pointer">
          Verbose
        </Label>
      </div>

      <ThemeToggle className="text-muted-foreground hover:text-foreground" />

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
                <Label htmlFor="streaming-enabled-controls">Habilitar Streaming</Label>
                <Switch
                  id="streaming-enabled-controls"
                  checked={userChatConfig.streamingEnabled}
                  onCheckedChange={(checked) => onUserChatConfigChange({ streamingEnabled: checked })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="voice-select-controls">Voz Simulada</Label>
                <Select
                  value={userChatConfig.simulatedVoiceConfig?.voice || 'alloy'}
                  onValueChange={(value) => onUserChatConfigChange({ simulatedVoiceConfig: { voice: value, speed: userChatConfig.simulatedVoiceConfig?.speed || 1.0 } })}
                >
                  <SelectTrigger id="voice-select-controls">
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
                <Label htmlFor="voice-speed-controls">Velocidade da Voz ({userChatConfig.simulatedVoiceConfig?.speed || 1.0}x)</Label>
                <Slider
                  id="voice-speed-controls"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[userChatConfig.simulatedVoiceConfig?.speed || 1.0]}
                  onValueChange={(value) => onUserChatConfigChange({ simulatedVoiceConfig: { voice: userChatConfig.simulatedVoiceConfig?.voice || 'alloy', speed: value[0] } })}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {authLoading ? (
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      ) : currentUser ? (
        <div className="relative group">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full overflow-hidden p-0 h-8 w-8 border border-muted"
            onClick={handleLogout} // Consider if this should be a dropdown action
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
  );
};

export default ChatControls;
