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

  const AGENT_ORDER_STORAGE_KEY = 'agentOrder_v1';

  const saveAgentOrder = async (order: string[]): Promise<void> => {
    try {
      localStorage.setItem(AGENT_ORDER_STORAGE_KEY, JSON.stringify(order));
    } catch (error) {
      console.error('Error saving agent order to localStorage:', error);
      // Optionally, re-throw or handle as per application's error strategy
    }
  };

  const loadAgentOrder = (): string[] => {
    try {
      const storedOrder = localStorage.getItem(AGENT_ORDER_STORAGE_KEY);
      if (storedOrder) {
        return JSON.parse(storedOrder);
      }
    } catch (error) {
      console.error('Error loading agent order from localStorage:', error);
    }
    return [];
  };

  // Modify loadAgents to use the order
  const originalLoadAgents = async (): Promise<SavedAgentConfiguration[]> => {
    try {
      return await getAllAgentsDB();
    } catch (error) {
      console.error('Error loading agents from IndexedDB:', error);
      return [];
    }
  };

  const loadAgentsWithOrder = async (): Promise<SavedAgentConfiguration[]> => {
    const agents = await originalLoadAgents();
    const order = loadAgentOrder();

    if (order.length > 0 && agents.length > 0) {
      const orderedAgents: SavedAgentConfiguration[] = [];
      const agentMap = new Map(agents.map(agent => [agent.id, agent]));

      // Add agents based on saved order
      for (const id of order) {
        if (agentMap.has(id)) {
          orderedAgents.push(agentMap.get(id)!);
          agentMap.delete(id); // Remove from map to track remaining agents
        }
      }
      // Add any remaining agents (newly added, not in order yet) to the end
      orderedAgents.push(...agentMap.values());
      return orderedAgents;
    }
    return agents; // Return agents as is if no order or no agents
  };


  // Modify addAgent to update order
  const addAgentAndUpdateOrder = async (
    agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    userId?: string
  ): Promise<SavedAgentConfiguration> => {
    const newAgent = await addAgent(agentConfigData, userId); // Uses the original addAgent logic renamed earlier
    if (newAgent) {
      try {
        const currentOrder = loadAgentOrder();
        // Avoid adding duplicate if it somehow got there
        if (!currentOrder.includes(newAgent.id)) {
          const newOrder = [...currentOrder, newAgent.id];
          await saveAgentOrder(newOrder);
        }
      } catch (error) {
        console.error('Failed to update agent order after adding agent:', error);
        // The agent was added, but order might be inconsistent.
        // Depending on requirements, you might want to surface this error.
      }
    }
    return newAgent;
  };

  // Modify deleteAgent to update order
  const deleteAgentAndUpdateOrder = async (id: string): Promise<boolean> => {
    const success = await deleteAgent(id); // Uses the original deleteAgent logic
    if (success) {
      try {
        const currentOrder = loadAgentOrder();
        const newOrder = currentOrder.filter(agentId => agentId !== id);
        if (newOrder.length !== currentOrder.length) {
          await saveAgentOrder(newOrder);
        }
      } catch (error) {
        console.error('Failed to update agent order after deleting agent:', error);
        // The agent was deleted, but order might be inconsistent.
      }
    }
    return success;
  };

  return {
    loadAgents: loadAgentsWithOrder, // Use the new ordered version
    saveAgent: addAgentAndUpdateOrder, // Use the version that updates order
    updateAgent, // updateAgent doesn't change order, so original is fine
    deleteAgent: deleteAgentAndUpdateOrder, // Use the version that updates order
    saveAgentOrder, // Export for direct use if needed
    // loadAgentOrder is not exported as loadAgents handles it, but can be if needed
  };
}
