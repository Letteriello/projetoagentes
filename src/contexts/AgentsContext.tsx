// src/contexts/AgentsContext.tsx
"use client";

import { SavedAgentConfiguration } from '@/types/agent-configs'; // Usar os tipos unificados
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';

interface AgentsContextType {
  savedAgents: SavedAgentConfiguration[];
  addAgent: (agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<SavedAgentConfiguration | null>;
  updateAgent: (agentId: string, agentConfigUpdate: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<SavedAgentConfiguration | null>;
  deleteAgent: (agentId: string) => Promise<boolean>;
  fetchAgents: () => Promise<void>; // Adicionar fetchAgents para ser chamado explicitamente se necessário
  isLoadingAgents: boolean;
}

const AgentsContext = React.createContext<AgentsContextType | undefined>(undefined);

export function AgentsProvider({ children }: { children: React.ReactNode }) {
  const [savedAgents, setSavedAgents] = React.useState<SavedAgentConfiguration[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = React.useState<boolean>(true);
  const { toast } = useToast();

  const fetchAgents = React.useCallback(async () => {
    setIsLoadingAgents(true);
    try {
      const response = await fetch('/api/agents');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Falha ao buscar agentes', details: response.statusText }));
        throw new Error(errorData.details || errorData.error || 'Network response was not ok');
      }
      const agents = await response.json() as SavedAgentConfiguration[];
      // Convert string dates to Date objects if necessary for sorting or display
      const processedAgents = agents.map(agent => ({
        ...agent,
        createdAt: agent.createdAt ? new Date(agent.createdAt) : new Date(),
        updatedAt: agent.updatedAt ? new Date(agent.updatedAt) : new Date(),
      })).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setSavedAgents(processedAgents);

    } catch (error) {
      console.error("Erro ao buscar agentes via API:", error);
      toast({
        title: "Erro ao Carregar Agentes",
        description: `Não foi possível buscar os agentes salvos. ${error instanceof Error ? error.message : ''}`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingAgents(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const addAgent = async (agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<SavedAgentConfiguration | null> => {
    setIsLoadingAgents(true);
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentConfigData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Falha ao adicionar agente', details: response.statusText }));
        throw new Error(errorData.details || errorData.error || 'Network response was not ok');
      }
      const newAgent = await response.json() as SavedAgentConfiguration;
      const processedNewAgent = {
        ...newAgent,
        createdAt: newAgent.createdAt ? new Date(newAgent.createdAt) : new Date(),
        updatedAt: newAgent.updatedAt ? new Date(newAgent.updatedAt) : new Date(),
      };
      setSavedAgents(prev => [processedNewAgent, ...prev].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      toast({ title: "Agente Adicionado", description: `"${newAgent.agentName}" foi salvo com sucesso.` });
      return processedNewAgent;
    } catch (error) {
      console.error("Erro ao adicionar agente via API:", error);
      toast({
        title: "Erro ao Adicionar Agente",
        description: `Não foi possível salvar o agente. ${error instanceof Error ? error.message : ''}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const updateAgent = async (agentId: string, agentConfigUpdate: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    setIsLoadingAgents(true);
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentConfigUpdate),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Falha ao atualizar agente ${agentId}`, details: response.statusText }));
        throw new Error(errorData.details || errorData.error || 'Network response was not ok');
      }
      const updatedAgent = await response.json() as SavedAgentConfiguration;
       const processedUpdatedAgent = {
        ...updatedAgent,
        createdAt: updatedAgent.createdAt ? new Date(updatedAgent.createdAt) : new Date(),
        updatedAt: updatedAgent.updatedAt ? new Date(updatedAgent.updatedAt) : new Date(),
      };
      setSavedAgents(prev =>
        prev.map(agent => (agent.id === agentId ? processedUpdatedAgent : agent))
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      );
      toast({ title: "Agente Atualizado", description: "As alterações foram salvas." });
      return processedUpdatedAgent;
    } catch (error) {
      console.error("Erro ao atualizar agente via API:", error);
      toast({
        title: "Erro ao Atualizar Agente",
        description: `Não foi possível salvar as alterações. ${error instanceof Error ? error.message : ''}`,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const deleteAgent = async (agentId: string): Promise<boolean> => {
    setIsLoadingAgents(true);
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Falha ao deletar agente ${agentId}`, details: response.statusText }));
        throw new Error(errorData.details || errorData.error || 'Network response was not ok');
      }
      setSavedAgents(prev => prev.filter(agent => agent.id !== agentId));
      toast({ title: "Agente Deletado", description: "O agente foi removido com sucesso." });
      return true;
    } catch (error) {
      console.error("Erro ao deletar agente via API:", error);
      toast({
        title: "Erro ao Deletar Agente",
        description: `Não foi possível remover o agente. ${error instanceof Error ? error.message : ''}`,
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
