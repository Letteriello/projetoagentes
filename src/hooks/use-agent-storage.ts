// src/hooks/use-agent-storage.ts
import { SavedAgentConfiguration } from '@/types/agent-configs-fixed';
import {
  addAgentDB,
  deleteAgentDB,
  getAllAgentsDB,
  updateAgentDB,
  getAgentByIdDB // Import if you need a direct get by ID here, otherwise getAllAgentsDB is fine
} from '@/lib/agentIndexedDB'; // Ensure this path is correct

export function useAgentStorage() {
  const loadAgents = async (): Promise<SavedAgentConfiguration[]> => {
    try {
      // Data is already mapped to Date objects by getAllAgentsDB
      return await getAllAgentsDB();
    } catch (error) {
      console.error('Error loading agents from IndexedDB:', error);
      return [];
    }
  };

  // addAgentInternal is renamed to addAgent to reflect its new role
  const addAgent = async (
    agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    userId?: string
  ): Promise<SavedAgentConfiguration> => {
    const newAgent: SavedAgentConfiguration = {
      ...agentConfigData,
      id: crypto.randomUUID(),
      createdAt: new Date(), // Store as Date object initially
      updatedAt: new Date(), // Store as Date object initially
      ...(userId && { userId }),
    };
    try {
      // addAgentDB will handle converting Dates to ISO strings for storage
      await addAgentDB(newAgent);
      return newAgent; // Return with Date objects
    } catch (error) {
      console.error('Error adding agent to IndexedDB:', error);
      // Depending on error handling strategy, you might want to throw or return null
      throw error; // Or handle more gracefully
    }
  };

  const updateAgent = async (
    updatedAgentData: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> & { id: string }
  ): Promise<SavedAgentConfiguration | null> => {
    try {
      const existingAgent = await getAgentByIdDB(updatedAgentData.id);
      if (!existingAgent) {
        console.error(`Agent with ID ${updatedAgentData.id} not found for update.`);
        return null;
      }

      const updatedAgent: SavedAgentConfiguration = {
        ...existingAgent,
        ...updatedAgentData,
        updatedAt: new Date(), // Update timestamp, store as Date
      };
      // updateAgentDB will handle converting Dates to ISO strings
      await updateAgentDB(updatedAgent);
      return updatedAgent; // Return with Date objects
    } catch (error) {
      console.error('Error updating agent in IndexedDB:', error);
      throw error; // Or handle more gracefully
    }
  };

  const deleteAgent = async (id: string): Promise<boolean> => {
    try {
      await deleteAgentDB(id);
      return true;
    } catch (error) {
      console.error('Error deleting agent from IndexedDB:', error);
      return false;
    }
  };

  // The saveAgent function was previously an alias for addAgentInternal or an upsert.
  // If an explicit "save" that acts as an upsert is still needed, it can be implemented like this:
  // async function saveAgent(agent: SavedAgentConfiguration): Promise<SavedAgentConfiguration> {
  //   try {
  //     // updateAgentDB (via put) will create if not exist, or update if exist, based on key.
  //     // So we can directly use it. Ensure agent.updatedAt is set.
  //     agent.updatedAt = new Date(agent.updatedAt); // Ensure it's a Date object if coming from an unknown source
  //     agent.createdAt = new Date(agent.createdAt); // Ensure it's a Date object
  //     return await updateAgentDB(agent);
  //   } catch (error) {
  //     console.error('Error saving (upserting) agent to IndexedDB:', error);
  //     throw error;
  //   }
  // }
  // If saveAgent was meant to be strictly "add new", then addAgent is the correct replacement.
  // The original code's saveAgent was a bit ambiguous, overwriting if ID matched.
  // The new structure with addAgent (creates new) and updateAgent (updates existing) is clearer.

  return { loadAgents, saveAgent: addAgent, updateAgent, deleteAgent };
}
