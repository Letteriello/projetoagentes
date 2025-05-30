import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AgentSelector } from "@/components/agent-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Menu,
  // RefreshCcw, // Unused
  Cpu,
  // Sparkles, // Unused
  Plus,
  LogIn,
  LogOut,
} from "lucide-react"; // Added LogIn, LogOut
import type { SavedAgentConfiguration } from "@/app/agent-builder/page";
import { useAuth } from "../../../../contexts/AuthContext"; // Added
import { auth } from "../../../../lib/firebaseClient"; // Added
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth"; // Added
import { toast } from "@/hooks/use-toast"; // Added

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
  const { currentUser, loading: authLoading } = useAuth(); // Added

  const handleGemSelect = (id: string) => {
    setSelectedGemId(id);
  };

  const handleLogin = async () => {
    // Added
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: "Login Successful",
        description: "You are now logged in.",
      });
    } catch (error) {
      console.error("Error during Google login:", error);
      toast({
        title: "Login Failed",
        description: "Could not sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    // Added
    try {
      await signOut(auth);
      toast({
        title: "Logout Successful",
        description: "You have been logged out.",
      });
    } catch (error) {
      console.error("Error during logout:", error);
      toast({
        title: "Logout Failed",
        description: "Could not sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          title={isSidebarOpen ? "Fechar Menu" : "Abrir Menu"}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold truncate max-w-xs md:max-w-md lg:max-w-lg">
          {activeChatTarget || "Chat"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Auth Status and Buttons */}
        {authLoading ? (
          <span className="text-sm text-muted-foreground">Loading user...</span>
        ) : currentUser ? (
          <div className="flex items-center gap-2">
            <span className="text-sm hidden md:inline">
              {currentUser.displayName || currentUser.email}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            onClick={handleLogin}
            title="Login with Google"
          >
            <LogIn className="mr-2 h-5 w-5" /> Login with Google
          </Button>
        )}

        {usingADKAgent ? (
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            <Select
              value={selectedADKAgentId || ""}
              onValueChange={(value) =>
                setSelectedADKAgentId(value === "" ? null : value)
              }
            >
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
                    {!selectedADKAgentId && (
                      <SelectItem value="">Selecione um Agente ADK</SelectItem>
                    )}
                    {adkAgents.map((agent) => (
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
            agents={initialGems.map((gem) => ({
              id: gem.id,
              name: gem.name,
              description: gem.prompt,
            }))}
            selectedAgentId={selectedGemId ?? undefined}
            onSelectAgent={(id) => handleGemSelect(id ?? "")}
            agentType="Gems"
          />
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={handleNewConversation}
          title="Nova Conversa"
        >
          <Plus className="h-5 w-5" />
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}


