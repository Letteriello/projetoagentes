"use client";

import type { SavedAgentConfiguration } from '@/app/agent-builder/page';
import * as React from 'react';
<<<<<<< Updated upstream
import { firestore } from '@/lib/firebaseClient'; // Import Firestore client
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
=======
// Versão client-safe para operações do Firestore
import { 
  fetchAgents as fetchAgentsFromClient, 
  addAgent as addAgentToClient, 
  updateAgent as updateAgentInClient, 
  deleteAgent as deleteAgentFromClient, 
  serverTimestamp 
} from '@/lib/firestore-client';
>>>>>>> Stashed changes
import { useToast } from '@/hooks/use-toast'; 

// Placeholder para userId - substituir com gerenciamento de usuário real mais tarde
const PLACEHOLDER_USER_ID = "defaultUser";

interface AgentsContextType {
  savedAgents: SavedAgentConfiguration[];
  setSavedAgents: React.Dispatch<React.SetStateAction<SavedAgentConfiguration[]>>;
  addAgent: (agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<SavedAgentConfiguration | null>;
  updateAgent: (agentId: string, agentConfigUpdate: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  isLoadingAgents: boolean;
}

const AgentsContext = React.createContext<AgentsContextType | undefined>(undefined);

export function AgentsProvider({ children }: { children: React.ReactNode }) {
  const [savedAgents, setSavedAgents] = React.useState<SavedAgentConfiguration[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = React.useState<boolean>(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const loadAgents = async () => {
      setIsLoadingAgents(true);
      try {
        // Usar nossa versão client-safe para buscar agentes
        const agents = await fetchAgentsFromClient();
        setSavedAgents(agents);
      } catch (error) {
        console.error("Erro ao buscar agentes:", error);
        toast({
          title: "Erro ao Carregar Agentes",
          description: "Não foi possível buscar os agentes salvos. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAgents(false);
      }
    };

    loadAgents();
  }, [toast]);

  // Ajustamos os campos omitidos para compatibilidade com o tipo esperado
  const addAgent = async (agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<SavedAgentConfiguration | null> => {
    setIsLoadingAgents(true);
    try {
      // Usar versão client-safe para adicionar agente
      const newAgent = await addAgentToClient(agentConfigData);
      
      if (newAgent) {
        // Simplesmente adicionamos o novo agente no início da lista
        // sem tentar ordenar por updatedAt que não existe no tipo SavedAgentConfiguration
        setSavedAgents(prev => [newAgent, ...prev]);
        toast({ 
          title: "Agente Adicionado", 
          description: `"${newAgent.agentName}" foi salvo com sucesso.` 
        });
      }
      
      return newAgent;
    } catch (error) {
      console.error("Erro ao adicionar agente:", error);
      toast({
        title: "Erro ao Adicionar Agente",
        description: "Não foi possível salvar o agente. Tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const updateAgent = async (agentId: string, agentConfigUpdate: Partial<Omit<SavedAgentConfiguration, 'id'>>) => {
    setIsLoadingAgents(true);
    try {
      // Usar versão client-safe para atualizar agente
      const success = await updateAgentInClient(agentId, agentConfigUpdate);
      
      if (success) {
        // Apenas atualizamos o estado local se a API foi bem-sucedida
        setSavedAgents(prev =>
          prev.map(agent =>
            agent.id === agentId 
              ? { 
                  ...agent, 
                  ...agentConfigUpdate
                  // Nota: updatedAt não existe no tipo SavedAgentConfiguration
                  // será atualizado apenas no Firestore, não no modelo do cliente
                } 
              : agent
          )
        );
        toast({ title: "Agente Atualizado", description: "As alterações foram salvas." });
      } else {
        throw new Error("Falha ao atualizar o agente");
      }
    } catch (error) {
      console.error("Erro ao atualizar agente:", error);
      toast({
        title: "Erro ao Atualizar Agente",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const deleteAgent = async (agentId: string) => {
    setIsLoadingAgents(true);
    try {
      // Usar versão client-safe para excluir agente
      const success = await deleteAgentFromClient(agentId);
      
      if (success) {
        setSavedAgents(prev => prev.filter(agent => agent.id !== agentId));
        toast({ title: "Agente Excluído", description: "O agente foi removido com sucesso." });
      } else {
        throw new Error("Falha ao excluir o agente");
      }
    } catch (error) {
      console.error("Erro ao excluir agente:", error);
      toast({
        title: "Erro ao Excluir Agente",
        description: "Não foi possível remover o agente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAgents(false);
    }
  };
  
  return (
    <AgentsContext.Provider value={{ savedAgents, setSavedAgents, addAgent, updateAgent, deleteAgent, isLoadingAgents }}>
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
