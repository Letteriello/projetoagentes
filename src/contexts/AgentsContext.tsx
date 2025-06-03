// src/contexts/AgentsContext.tsx
"use client";

import { SavedAgentConfiguration } from '@/types/agent-configs-fixed';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAgentStorage } from '@/hooks/use-agent-storage'; // Import the new hook

interface AgentsContextType {
  savedAgents: SavedAgentConfiguration[];
  addAgent: (agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<SavedAgentConfiguration | null>;
  updateAgent: (agentId: string, agentConfigUpdate: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<SavedAgentConfiguration | null>;
  deleteAgent: (agentId: string) => Promise<boolean>;
  fetchAgents: () => Promise<void>;
  isLoadingAgents: boolean;
}

const AgentsContext = React.createContext<AgentsContextType | undefined>(undefined);

export function AgentsProvider({ children }: { children: React.ReactNode }) {
  const [savedAgents, setSavedAgents] = React.useState<SavedAgentConfiguration[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = React.useState<boolean>(true);
  const { toast } = useToast();
  const { loadAgents, saveAgent: saveAgentToStorage, updateAgent: updateAgentInStorage, deleteAgent: deleteAgentFromStorage } = useAgentStorage(); // Use the hook

  const fetchAgents = React.useCallback(async () => {
    setIsLoadingAgents(true);
    try {
      // Replace API call with localStorage load
      const agentsFromStorage = loadAgents();
      // Ensure sorting is maintained if needed (loadAgents already handles date conversion)
      const processedAgents = agentsFromStorage.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setSavedAgents(processedAgents);
    } catch (error) {
      console.error("Erro ao buscar agentes do localStorage:", error);
      toast({
        title: "Erro ao Carregar Agentes",
        description: `Não foi possível buscar os agentes salvos localmente. ${error instanceof Error ? error.message : ''}`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingAgents(false);
    }
  }, [loadAgents, toast]); // Add loadAgents to dependency array

  React.useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const addAgent = async (agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<SavedAgentConfiguration | null> => {
    setIsLoadingAgents(true); // Keep for consistency, though operation is fast
    try {
      // Replace API call with localStorage save
      const newAgent = saveAgentToStorage(agentConfigData); // saveAgentToStorage is addAgentInternal from the hook
      if (newAgent) {
        // Update state, ensuring it's sorted
        setSavedAgents(prev => [newAgent, ...prev].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
        toast({ title: "Agente Adicionado", description: `"${newAgent.agentName}" foi salvo com sucesso localmente.` });
        return newAgent;
      }
      throw new Error("Falha ao salvar o agente localmente.");
    } catch (error) {
      console.error("Erro ao adicionar agente no localStorage:", error);
      toast({
        title: "Erro ao Adicionar Agente",
        description: `Não foi possível salvar o agente localmente. ${error instanceof Error ? error.message : ''}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const updateAgent = async (agentId: string, agentConfigUpdate: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    setIsLoadingAgents(true); // Keep for consistency
    try {
      // Replace API call with localStorage update
      const updatedAgent = updateAgentInStorage({ ...agentConfigUpdate, id: agentId });
      if (updatedAgent) {
        setSavedAgents(prev =>
          prev.map(agent => (agent.id === agentId ? updatedAgent : agent))
              .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        );
        toast({ title: "Agente Atualizado", description: "As alterações foram salvas localmente." });
        return updatedAgent;
      }
      throw new Error("Falha ao atualizar o agente localmente. Agente não encontrado.");
    } catch (error) {
      console.error("Erro ao atualizar agente no localStorage:", error);
      toast({
        title: "Erro ao Atualizar Agente",
        description: `Não foi possível salvar as alterações localmente. ${error instanceof Error ? error.message : ''}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const deleteAgent = async (agentId: string): Promise<boolean> => {
    setIsLoadingAgents(true); // Keep for consistency
    try {
      // Replace API call with localStorage delete
      const success = deleteAgentFromStorage(agentId);
      if (success) {
        setSavedAgents(prev => prev.filter(agent => agent.id !== agentId));
        toast({ title: "Agente Deletado", description: "O agente foi removido com sucesso localmente." });
        return true;
      }
      // If deleteAgentFromStorage returns false, it means agent was not found.
      toast({
        title: "Erro ao Deletar Agente",
        description: "Não foi possível remover o agente localmente. Agente não encontrado.",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error("Erro ao deletar agente no localStorage:", error);
      toast({
        title: "Erro ao Deletar Agente",
        description: `Não foi possível remover o agente localmente. ${error instanceof Error ? error.message : ''}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoadingAgents(false);
    }
  };

  return (
    <AgentsContext.Provider value={{ savedAgents, addAgent, updateAgent, deleteAgent, fetchAgents, isLoadingAgents }}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents() {
  const context = React.useContext(AgentsContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentsProvider');
  }
  return context;
}
