import { create } from 'zustand';
import { SavedAgentConfiguration } from '@/types/agent-configs-fixed';
import { useAgentStorage } from '@/hooks/use-agent-storage'; // Assuming this hook can be used outside React components
import { toast } from '@/hooks/use-toast'; // Assuming toast can be called outside components

// It's generally better if hooks like useAgentStorage and useToast are called within React components.
// For Zustand, actions that need these hooks might need to be structured differently,
// or the hooks themselves refactored to provide functions that can be called from anywhere.

// Let's assume for now that we can get instances of these or adapt.
// A common pattern is to initialize storage utilities outside the store or pass them in.

// Get the functions from useAgentStorage.
// This is a simplification. In a real scenario, you might initialize storage
// separately or pass it to store actions if the hook cannot be used directly.
// For this exercise, we'll proceed with the assumption that direct calls are possible,
// or adapt if the tool environment points out issues.
const { loadAgents, saveAgent: saveAgentToStorage, updateAgent: updateAgentInStorage, deleteAgent: deleteAgentFromStorage } = useAgentStorage.getState ? useAgentStorage.getState() : useAgentStorage();


interface AgentStoreState {
  savedAgents: SavedAgentConfiguration[];
  agentsMap: Map<string, SavedAgentConfiguration>;
  isLoadingAgents: boolean;
  errorAgents: string | null; // To store any error messages
  fetchAgents: () => Promise<void>;
  addAgent: (agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<SavedAgentConfiguration | null>;
  updateAgent: (agentId: string, agentConfigUpdate: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<SavedAgentConfiguration | null>;
  deleteAgent: (agentId: string) => Promise<boolean>;
}

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  savedAgents: [],
  agentsMap: new Map(),
  isLoadingAgents: true,
  errorAgents: null,

  fetchAgents: async () => {
    set({ isLoadingAgents: true, errorAgents: null });
    try {
      const agentsFromStorage = await loadAgents(); // From useAgentStorage
      const processedAgents = Array.isArray(agentsFromStorage)
        ? agentsFromStorage.filter(Boolean).sort((a, b) => {
            // Ensure updatedAt exists and is a valid date string or timestamp
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
          })
        : [];
      const newAgentsMap = new Map<string, SavedAgentConfiguration>();
      for (const agent of processedAgents) {
        newAgentsMap.set(agent.id, agent);
      }
      set({ savedAgents: processedAgents, agentsMap: newAgentsMap, isLoadingAgents: false });
    } catch (error) {
      console.error("Error fetching agents from storage:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load agents.';
      set({ savedAgents: [], agentsMap: new Map(), isLoadingAgents: false, errorAgents: errorMessage });
      toast({
        title: "Erro ao Carregar Agentes",
        description: `Não foi possível buscar os agentes. ${errorMessage}`,
        variant: "destructive",
      });
    }
  },

  addAgent: async (agentConfigData) => {
    set({ isLoadingAgents: true }); // Optimistically set loading
    try {
      const newAgent = await saveAgentToStorage(agentConfigData); // From useAgentStorage
      if (newAgent) {
        set(state => {
          const updatedAgents = [newAgent, ...state.savedAgents].sort((a, b) =>
            (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0)
          );
          const newAgentsMap = new Map(state.agentsMap).set(newAgent.id, newAgent);
          return { savedAgents: updatedAgents, agentsMap: newAgentsMap, isLoadingAgents: false };
        });
        toast({ title: "Agente Adicionado", description: `"${newAgent.agentName}" foi salvo.` });
        return newAgent;
      }
      throw new Error("Failed to save agent to storage.");
    } catch (error) {
      console.error("Error adding agent to storage:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add agent.';
      set({ isLoadingAgents: false, errorAgents: errorMessage });
      toast({
        title: "Erro ao Adicionar Agente",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  },

  updateAgent: async (agentId, agentConfigUpdate) => {
    set({ isLoadingAgents: true });
    try {
      const updatedAgent = await updateAgentInStorage({ ...agentConfigUpdate, id: agentId }); // From useAgentStorage
      if (updatedAgent) {
        set(state => {
          const updatedAgents = state.savedAgents.map(agent => (agent.id === agentId ? updatedAgent : agent))
            .sort((a, b) => (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0));
          const newAgentsMap = new Map(state.agentsMap).set(updatedAgent.id, updatedAgent);
          return { savedAgents: updatedAgents, agentsMap: newAgentsMap, isLoadingAgents: false };
        });
        toast({ title: "Agente Atualizado", description: "As alterações foram salvas." });
        return updatedAgent;
      }
      throw new Error("Failed to update agent in storage. Agent not found.");
    } catch (error) {
      console.error("Error updating agent in storage:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update agent.';
      set({ isLoadingAgents: false, errorAgents: errorMessage });
      toast({
        title: "Erro ao Atualizar Agente",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  },

  deleteAgent: async (agentId) => {
    set({ isLoadingAgents: true });
    try {
      const success = await deleteAgentFromStorage(agentId); // From useAgentStorage
      if (success) {
        set(state => {
          const updatedAgents = state.savedAgents.filter(agent => agent.id !== agentId);
          const newAgentsMap = new Map(state.agentsMap);
          newAgentsMap.delete(agentId);
          return { savedAgents: updatedAgents, agentsMap: newAgentsMap, isLoadingAgents: false };
        });
        toast({ title: "Agente Deletado", description: "O agente foi removido." });
        return true;
      }
      throw new Error("Agent not found in storage or failed to delete.");
    } catch (error) {
      console.error("Error deleting agent from storage:", error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete agent.';
      set({ isLoadingAgents: false, errorAgents: errorMessage });
      toast({
        title: "Erro ao Deletar Agente",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  },
}));

// Initial fetch of agents when the store is created/initialized.
// This might run on module load, which is fine for client-side stores.
// useAgentStore.getState().fetchAgents(); // Optional: auto-fetch on store init
// It's generally better to call fetchAgents from a React component (e.g., in a useEffect)
// to ensure it's run in the appropriate client-side context, especially if it relies on hooks.
// For now, I will remove this auto-fetch and expect a component to trigger it.
