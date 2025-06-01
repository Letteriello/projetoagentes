"use client";

import type { SavedAgentConfiguration } from '@/types/agent-configs'; // Adjust path if necessary
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
  savedAgents: SavedAgentConfiguration[];
  // setSavedAgents: React.Dispatch<React.SetStateAction<SavedAgentConfiguration[]>>; // Removed as state is managed internally by Firestore ops
  addAgent: (agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<SavedAgentConfiguration | null>;
  updateAgent: (agentId: string, agentConfigUpdate: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  isLoadingAgents: boolean;
}

const AgentsContext = React.createContext<AgentsContextType | undefined>(undefined);

export function FirestoreAgentsProvider({ children }: { children: React.ReactNode }) {
  const [savedAgents, setSavedAgents] = React.useState<SavedAgentConfiguration[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = React.useState<boolean>(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchAgents = async () => {
      setIsLoadingAgents(true);
      try {
        const agentsCollectionRef = collection(firestore, 'agents');
        // TODO: Replace PLACEHOLDER_USER_ID with actual authenticated user ID when auth is implemented
        const q = query(agentsCollectionRef, where("userId", "==", PLACEHOLDER_USER_ID), orderBy("updatedAt", "desc"));
        
        const querySnapshot = await getDocs(q);
        const agents: SavedAgentConfiguration[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Comprehensive mapping based on SavedAgentConfiguration structure
          const agentData: SavedAgentConfiguration = {
            id: docSnap.id,
            userId: data.userId,
            agentName: data.agentName,
            agentDescription: data.agentDescription,
            agentVersion: data.agentVersion,
            agentType: data.agentType,
            // LLM-specific fields (ensure they exist or provide defaults)
            agentGoal: data.agentGoal || "",
            agentTasks: data.agentTasks || "",
            agentPersonality: data.agentPersonality || "",
            agentRestrictions: data.agentRestrictions || "",
            agentModel: data.agentModel || "googleai/gemini-1.5-flash-latest", // Default model
            agentTemperature: data.agentTemperature === undefined ? 0.7 : data.agentTemperature, // Default temperature
            // Workflow-specific fields
            workflowDescription: data.workflowDescription,
            detailedWorkflowType: data.detailedWorkflowType,
            loopMaxIterations: data.loopMaxIterations,
            loopTerminationConditionType: data.loopTerminationConditionType,
            loopExitToolName: data.loopExitToolName,
            loopExitStateKey: data.loopExitStateKey,
            loopExitStateValue: data.loopExitStateValue,
            // Custom/A2A-specific fields
            customLogicDescription: data.customLogicDescription,
            a2aConfig: data.a2aConfig, // This is an object itself
            // Common fields
            agentTools: data.agentTools || [],
            toolConfigsApplied: data.toolConfigsApplied || {},
            systemPromptGenerated: data.systemPromptGenerated || "",
            isRootAgent: data.isRootAgent || false,
            subAgents: data.subAgents || [],
            globalInstruction: data.globalInstruction || "",
            enableStatePersistence: data.enableStatePersistence || false,
            statePersistenceType: data.statePersistenceType || 'memory',
            initialStateValues: data.initialStateValues || [],
            enableStateSharing: data.enableStateSharing || false,
            stateSharingStrategy: data.stateSharingStrategy || 'explicit',
            enableRAG: data.enableRAG || false,
            ragMemoryConfig: data.ragMemoryConfig, 
            enableArtifacts: data.enableArtifacts || false,
            artifactStorageType: data.artifactStorageType || 'memory',
            artifacts: data.artifacts || [],
            cloudStorageBucket: data.cloudStorageBucket,
            localStoragePath: data.localStoragePath,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          };
          agents.push(agentData);
        });
        setSavedAgents(agents);
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

  const addAgent = async (agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<SavedAgentConfiguration | null> => {
    setIsLoadingAgents(true);
    try {
      const fullAgentData = {
        ...agentConfigData, // Spread all properties from the form/input
        userId: PLACEHOLDER_USER_ID,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(firestore, 'agents'), fullAgentData);
      
      const newAgentForState: SavedAgentConfiguration = {
        ...(agentConfigData as SavedAgentConfiguration), // Cast to ensure all type properties are met
        id: docRef.id,
        userId: PLACEHOLDER_USER_ID,
        createdAt: new Date(), 
        updatedAt: new Date(), 
      };

      setSavedAgents(prev => [newAgentForState, ...prev].sort((a,b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
      toast({ title: "Agente Adicionado", description: `"${newAgentForState.agentName}" foi salvo com sucesso.` });
      return newAgentForState;
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
      const { id, userId, createdAt, updatedAt, ...updatePayload } = agentConfigUpdate; // Exclude immutable fields
      
      await updateDoc(agentRef, {
        ...updatePayload, 
        updatedAt: serverTimestamp(),
      });
      
      setSavedAgents(prev =>
        prev.map(agent =>
          agent.id === agentId ? { ...agent, ...updatePayload, updatedAt: new Date() } : agent
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
