
"use client";

import type { SavedAgentConfiguration } from '@/app/agent-builder/page';
import * as React from 'react';
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
import { useToast } from '@/hooks/use-toast'; 

// Placeholder for userId - replace with actual user management later
const PLACEHOLDER_USER_ID = "defaultUser";

interface AgentsContextType {
  savedAgents: SavedAgentConfiguration[];
  setSavedAgents: React.Dispatch<React.SetStateAction<SavedAgentConfiguration[]>>; // Kept for direct manipulation if ever needed, though Firestore ops are preferred
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
    const fetchAgents = async () => {
      setIsLoadingAgents(true);
      try {
        const agentsCollectionRef = collection(firestore, 'agents');
        // TODO: Replace PLACEHOLDER_USER_ID with actual authenticated user ID when auth is implemented
        const q = query(agentsCollectionRef, where("userId", "==", PLACEHOLDER_USER_ID), orderBy("updatedAt", "desc"));
        
        const querySnapshot = await getDocs(q);
        const agents: SavedAgentConfiguration[] = [];
        querySnapshot.forEach((docSnap) => { // Renamed doc to docSnap to avoid conflict with firebase/firestore doc function
          const data = docSnap.data();
          // Ensure all fields are correctly mapped, especially Timestamps to Dates
          // This mapping needs to be comprehensive and match the SavedAgentConfiguration structure.
          const agentData: SavedAgentConfiguration = {
            id: docSnap.id,
            userId: data.userId,
            agentName: data.agentName,
            agentDescription: data.agentDescription,
            agentVersion: data.agentVersion,
            // Assuming agentConfiguration holds the specific type details (LLM, Workflow, etc.)
            // and common fields are at the top level of the Firestore document.
            agentType: data.agentType, 
            agentGoal: data.agentGoal,
            agentTasks: data.agentTasks,
            agentPersonality: data.agentPersonality,
            agentRestrictions: data.agentRestrictions,
            agentModel: data.agentModel,
            agentTemperature: data.agentTemperature,
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
            a2aConfig: data.a2aConfig,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
            // Ensure all other specific fields for different agent types are mapped here
            // For example, for LLMAgentConfig, WorkflowAgentConfig, CustomAgentConfig, A2AAgentConfig
            // This might require a more dynamic mapping or ensuring Firestore structure matches these types.
            // The current SavedAgentConfiguration is a union type, so direct spreading might not be safe
            // without ensuring the Firestore data strictly matches one of the union members.
            // For simplicity, we assume top-level fields cover most common properties.
            // Detailed specific properties might be nested under an 'agentConfiguration' field or similar
            // if they are not flat in Firestore. If they are flat, they need to be explicitly listed.
            ...(data.agentConfiguration || {}), // Spread if specific config is nested
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
        ...agentConfigData, // Spread all properties from the form
        userId: PLACEHOLDER_USER_ID,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(firestore, 'agents'), fullAgentData);
      
      const newAgentForState: SavedAgentConfiguration = {
        ...agentConfigData, // Use the input data which should conform to one of the union types
        id: docRef.id,
        userId: PLACEHOLDER_USER_ID,
        createdAt: new Date(), 
        updatedAt: new Date(), 
      };

      setSavedAgents(prev => [newAgentForState, ...prev].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()));
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
      // Construct the update payload carefully, excluding fields that shouldn't be directly updated (like id, userId, createdAt)
      const { id, userId, createdAt, updatedAt, ...updatePayload } = agentConfigUpdate;
      
      await updateDoc(agentRef, {
        ...updatePayload, // This will spread all fields from agentConfigUpdate
        updatedAt: serverTimestamp(),
      });
      
      setSavedAgents(prev =>
        prev.map(agent =>
          agent.id === agentId ? { ...agent, ...updatePayload, updatedAt: new Date() } : agent
        ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
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
