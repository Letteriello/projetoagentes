// src/hooks/use-agent-storage.ts
import { SavedAgentConfiguration } from '@/types/agent-configs-fixed';
import {
  addAgent as addAgentToDB,
  getAllAgents as getAllAgentsFromDB,
  updateAgent as updateAgentInDB,
  deleteAgent as deleteAgentFromDB,
  getAgentById as getAgentByIdFromDB,
  saveAgentOrder as saveAgentOrderInDB,
  loadAgentOrder as loadAgentOrderFromDB,
} from '@/services/indexed-db-agent-service';

export function useAgentStorage() {
  // Renamed from originalLoadAgents to simply loadAgentsFromStorage
  const loadAgentsFromStorage = async (userId?: string): Promise<SavedAgentConfiguration[]> => {
    try {
      // The new service returns Date objects directly.
      return await getAllAgentsFromDB(userId);
    } catch (error) {
      console.error('Error loading agents from IndexedDB service:', error);
      return [];
    }
  };

  // Renamed from the internal addAgent to createAgentInStorage
  const createAgentInStorage = async (
    agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    userId?: string
  ): Promise<SavedAgentConfiguration> => {
    const newAgent: SavedAgentConfiguration = {
      ...agentConfigData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(userId && { userId }),
    };
    try {
      // The service's addAgentToDB handles internal date conversions.
      return await addAgentToDB(newAgent);
    } catch (error) {
      console.error('Error adding agent via IndexedDB service:', error);
      throw error;
    }
  };

  const updateAgentInStorage = async (
    updatedAgentData: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> & { id: string }
  ): Promise<SavedAgentConfiguration | null> => {
    try {
      // Note: getAgentByIdFromDB is not strictly necessary here if updateAgentInDB can handle non-existent agents gracefully,
      // but it's good practice for validation and to return the full existing agent if needed.
      // The service's updateAgentInDB will set the `updatedAt` field.
      const agentToUpdate = await getAgentByIdFromDB(updatedAgentData.id);
      if (!agentToUpdate) {
        console.error(`Agent with ID ${updatedAgentData.id} not found for update.`);
        return null;
      }

      // Construct the agent object for update.
      // The service's updateAgentInDB will set/update `updatedAt`.
      const partiallyUpdatedAgent = { ...agentToUpdate, ...updatedAgentData };

      return await updateAgentInDB(partiallyUpdatedAgent);
    } catch (error) {
      console.error('Error updating agent via IndexedDB service:', error);
      throw error;
    }
  };

  const deleteAgentFromStorage = async (id: string): Promise<boolean> => {
    try {
      await deleteAgentFromDB(id);
      return true;
    } catch (error) {
      console.error('Error deleting agent via IndexedDB service:', error);
      return false;
    }
  };

  // Agent Order functions now use the new service
  const saveAgentOrder = async (order: string[]): Promise<void> => {
    try {
      await saveAgentOrderInDB(order); // Assumes global order, or key can be passed
    } catch (error) {
      console.error('Error saving agent order via IndexedDB service:', error);
      // Optionally, re-throw or handle
    }
  };

  // loadAgentOrder is now async as it calls the async service function
  const loadAgentOrder = async (): Promise<string[]> => {
    try {
      return await loadAgentOrderFromDB(); // Assumes global order, or key can be passed
    } catch (error) {
      console.error('Error loading agent order via IndexedDB service:', error);
      return [];
    }
  };

  // loadAgentsWithOrder now correctly awaits the async loadAgentOrder
  const loadAgentsWithOrder = async (userId?: string): Promise<SavedAgentConfiguration[]> => {
    const agents = await loadAgentsFromStorage(userId); // Use the renamed base loader
    const order = await loadAgentOrder(); // Await the async function

    if (order.length > 0 && agents.length > 0) {
      const orderedAgents: SavedAgentConfiguration[] = [];
      const agentMap = new Map(agents.map(agent => [agent.id, agent]));

      for (const id of order) {
        if (agentMap.has(id)) {
          orderedAgents.push(agentMap.get(id)!);
          agentMap.delete(id);
        }
      }
      orderedAgents.push(...agentMap.values());
      return orderedAgents;
    }
    return agents;
  };

  // addAgentAndUpdateOrder now uses the renamed createAgentInStorage and async load/save for order
  const addAgentAndUpdateOrder = async (
    agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    userId?: string
  ): Promise<SavedAgentConfiguration> => {
    const newAgent = await createAgentInStorage(agentConfigData, userId);
    if (newAgent) {
      try {
        const currentOrder = await loadAgentOrder();
        if (!currentOrder.includes(newAgent.id)) {
          const newOrder = [...currentOrder, newAgent.id];
          await saveAgentOrder(newOrder);
        }
      } catch (error) {
        console.error('Failed to update agent order after adding agent:', error);
      }
    }
    return newAgent;
  };

  // deleteAgentAndUpdateOrder now uses renamed deleteAgentFromStorage and async load/save for order
  const deleteAgentAndUpdateOrder = async (id: string): Promise<boolean> => {
    const success = await deleteAgentFromStorage(id);
    if (success) {
      try {
        const currentOrder = await loadAgentOrder();
        const newOrder = currentOrder.filter(agentId => agentId !== id);
        if (newOrder.length !== currentOrder.length) {
          await saveAgentOrder(newOrder);
        }
      } catch (error) {
        console.error('Failed to update agent order after deleting agent:', error);
      }
    }
    return success;
  };

  return {
    loadAgents: loadAgentsWithOrder,
    saveAgent: addAgentAndUpdateOrder, // "saveAgent" in the returned object is an "add" operation
    updateAgent: updateAgentInStorage, // Renamed for clarity internally
    deleteAgent: deleteAgentAndUpdateOrder,
    // Exporting these for potential direct use, though typically managed by above functions
    saveAgentOrder,
    loadAgentOrder,
  };
}
