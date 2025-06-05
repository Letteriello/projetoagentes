"use client";

import type { SavedAgentConfiguration, AgentSummary, AgentType, AgentFramework } from '@/types/unified-agent-types'; // Updated import
import * as React from 'react';
import { firestore } from '@/lib/firebaseClient';
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
import { useToast } from '@/hooks/use-toast'; // Assuming a toast hook is available

// Placeholder for userId - replace with actual user management later
const PLACEHOLDER_USER_ID = "defaultUser";

interface AgentsContextType {
  savedAgents: AgentSummary[]; // Changed to AgentSummary[]
  addAgent: (agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<AgentSummary | null>; // Return AgentSummary
  updateAgent: (agentId: string, agentConfigUpdate: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt'>>) => Promise<void>; // Payload can be full, state update is summary
  deleteAgent: (agentId: string) => Promise<void>;
  isLoadingAgents: boolean;
}

const AgentsContext = React.createContext<AgentsContextType | undefined>(undefined);

export function FirestoreAgentsProvider({ children }: { children: React.ReactNode }) {
  const [savedAgents, setSavedAgents] = React.useState<AgentSummary[]>([]); // Changed to AgentSummary[]
  const [isLoadingAgents, setIsLoadingAgents] = React.useState<boolean>(true);
  const { toast } = useToast();

  // TODO: Implement loadFullAgentConfig(agentId: string) to fetch full agent details when needed for editing or detailed view.
  // This function would likely use getDoc from Firestore to fetch a single agent's complete SavedAgentConfiguration.
  // Example:
  // const loadFullAgentConfig = async (agentId: string): Promise<SavedAgentConfiguration | null> => {
  //   try {
  //     const agentDocRef = doc(firestore, 'agents', agentId);
  //     const docSnap = await getDoc(agentDocRef);
  //     if (docSnap.exists()) {
  //       return { id: docSnap.id, ...docSnap.data() } as SavedAgentConfiguration;
  //     }
  //     return null;
  //   } catch (error) {
  //     console.error("Error loading full agent config:", error);
  //     return null;
  //   }
  // };

  React.useEffect(() => {
    const fetchAgents = async () => {
      setIsLoadingAgents(true);
      try {
        const agentsCollectionRef = collection(firestore, 'agents');
        // TODO: Replace PLACEHOLDER_USER_ID with actual authenticated user ID when auth is implemented
        const q = query(agentsCollectionRef, where("userId", "==", PLACEHOLDER_USER_ID), orderBy("updatedAt", "desc"));
        
        const querySnapshot = await getDocs(q);
        const agents: AgentSummary[] = []; // Changed to AgentSummary[]
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as SavedAgentConfiguration; // Assume data is full config from Firestore

          // Map to AgentSummary
          const summary: AgentSummary = {
            id: docSnap.id,
            userId: data.userId,
            agentName: data.agentName,
            agentDescription: data.agentDescription,
            // Ensure agentType and framework are derived correctly, might need nullish coalescing or checks
            agentType: data.config?.type || (data.agentType as AgentType) || 'custom', // Fallback needed if config is not guaranteed
            icon: data.icon,
            framework: data.config?.framework || (data.framework as AgentFramework), // Fallback for framework
            isRootAgent: data.config?.isRootAgent, // isRootAgent might be on config in unified types
            templateId: data.templateId,
            toolsSummary: {
              count: data.tools?.length || 0,
              // A simple check for configuredNeeded. A more detailed check might involve inspecting toolDetails if available.
              configuredNeeded: (data.tools?.length || 0) > 0 &&
                                (Object.keys(data.toolConfigsApplied || {}).length < (data.tools?.length || 0)),
            },
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()), // Ensure Date object
            agentVersion: data.agentVersion,
            isTemplate: data.isTemplate,
            isFavorite: data.isFavorite,
            tags: data.tags,
            category: data.category,
          };
          agents.push(summary);
        });
        // Sort by updatedAt descending after mapping
        setSavedAgents(agents.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      } catch (error) {
        console.error("Error fetching agents from Firestore:", error);
        toast({
          title: "Erro ao Carregar Agentes",
          description: "Não foi possível buscar os agentes salvos. Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingAgents(false);
      }
    };

    fetchAgents();
  }, [toast]);

  const addAgent = async (agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<AgentSummary | null> => {
    setIsLoadingAgents(true);
    try {
      // Data sent to Firestore is the full configuration
      const fullAgentData: SavedAgentConfiguration = {
        ...(agentConfigData as SavedAgentConfiguration), // Cast to include all potential fields of SavedAgentConfiguration
        userId: PLACEHOLDER_USER_ID,
        // Firestore will convert serverTimestamp, but for local state, we'll use current Date.
        // Actual values from Firestore (like createdAt, updatedAt) are preferred if available post-creation,
        // but for immediate state update, new Date() is a close approximation.
        // The Firestore listener (useEffect) will eventually fetch the exact server-generated timestamps.
        createdAt: serverTimestamp() as any, // Temporary type assertion for serverTimestamp
        updatedAt: serverTimestamp() as any, // Temporary type assertion for serverTimestamp
        // Ensure required fields for SavedAgentConfiguration that might be missing in Omit<> are present
        id: '', // ID will be generated by Firestore, this is a placeholder
        // agentType: agentConfigData.config?.type || 'custom', // Ensure agentType is set if not directly in agentConfigData
        // framework: agentConfigData.config?.framework,
      };

      const docRef = await addDoc(collection(firestore, 'agents'), fullAgentData);
      
      // Create AgentSummary for the local state
      const newAgentSummary: AgentSummary = {
        id: docRef.id,
        userId: PLACEHOLDER_USER_ID,
        agentName: agentConfigData.agentName,
        agentDescription: agentConfigData.agentDescription,
        agentType: agentConfigData.config?.type || (agentConfigData.agentType as AgentType) || 'custom',
        icon: agentConfigData.icon,
        framework: agentConfigData.config?.framework || (agentConfigData.framework as AgentFramework),
        isRootAgent: agentConfigData.config?.isRootAgent,
        templateId: agentConfigData.templateId,
        toolsSummary: {
          count: agentConfigData.tools?.length || 0,
          configuredNeeded: (agentConfigData.tools?.length || 0) > 0 &&
                            (Object.keys(agentConfigData.toolConfigsApplied || {}).length < (agentConfigData.tools?.length || 0)),
        },
        updatedAt: new Date(), // Use current date for local sort, Firestore listener will get actual
        agentVersion: agentConfigData.agentVersion,
        isTemplate: agentConfigData.isTemplate,
        isFavorite: agentConfigData.isFavorite,
        tags: agentConfigData.tags,
        category: agentConfigData.category,
      };

      setSavedAgents(prev => [newAgentSummary, ...prev].sort((a,b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      toast({ title: "Agente Adicionado", description: `"${newAgentSummary.agentName}" foi salvo com sucesso.` });
      return newAgentSummary; // Return the summary
    } catch (error) {
      console.error("Error adding agent to Firestore:", error);
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

  const updateAgent = async (agentId: string, agentConfigUpdate: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt'>>) => {
    setIsLoadingAgents(true);
    const agentRef = doc(firestore, 'agents', agentId);
    try {
      // Firestore receives a partial of SavedAgentConfiguration
      const updatePayloadFirestore = {
        ...agentConfigUpdate,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(agentRef, updatePayloadFirestore);
      
      // Update local AgentSummary state
      setSavedAgents(prevSummaries =>
        prevSummaries.map(summary =>
          summary.id === agentId
            ? {
                ...summary,
                // Selectively update summary fields from agentConfigUpdate
                agentName: agentConfigUpdate.agentName ?? summary.agentName,
                agentDescription: agentConfigUpdate.agentDescription ?? summary.agentDescription,
                agentType: agentConfigUpdate.config?.type || (agentConfigUpdate.agentType as AgentType) ?? summary.agentType,
                icon: agentConfigUpdate.icon ?? summary.icon,
                framework: agentConfigUpdate.config?.framework || (agentConfigUpdate.framework as AgentFramework) ?? summary.framework,
                isRootAgent: agentConfigUpdate.config?.isRootAgent ?? summary.isRootAgent,
                templateId: agentConfigUpdate.templateId ?? summary.templateId,
                toolsSummary: { // Re-calculate toolsSummary
                  count: agentConfigUpdate.tools?.length ?? summary.toolsSummary?.count ?? 0,
                  configuredNeeded: (agentConfigUpdate.tools?.length ?? summary.toolsSummary?.count ?? 0) > 0 &&
                                    (Object.keys(agentConfigUpdate.toolConfigsApplied || {}).length < (agentConfigUpdate.tools?.length ?? summary.toolsSummary?.count ?? 0)),
                },
                updatedAt: new Date(), // Use current date for local sort
                agentVersion: agentConfigUpdate.agentVersion ?? summary.agentVersion,
                isTemplate: agentConfigUpdate.isTemplate ?? summary.isTemplate,
                isFavorite: agentConfigUpdate.isFavorite ?? summary.isFavorite,
                tags: agentConfigUpdate.tags ?? summary.tags,
                category: agentConfigUpdate.category ?? summary.category,
              }
            : summary
        ).sort((a,b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      );
      toast({ title: "Agente Atualizado", description: "As alterações foram salvas." });
    } catch (error) {
      console.error("Error updating agent in Firestore:", error);
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
    const agentRef = doc(firestore, 'agents', agentId);
    try {
      await deleteDoc(agentRef);
      setSavedAgents(prev => prev.filter(agent => agent.id !== agentId));
      toast({ title: "Agente Excluído", description: "O agente foi removido com sucesso." });
    } catch (error) {
      console.error("Error deleting agent from Firestore:", error);
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
    // Removed setSavedAgents from provider value as it's managed internally
    <AgentsContext.Provider value={{ savedAgents, addAgent, updateAgent, deleteAgent, isLoadingAgents }}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents() {
  const context = React.useContext(AgentsContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within an FirestoreAgentsProvider');
  }
  return context;
}
