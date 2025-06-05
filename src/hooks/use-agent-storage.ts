// src/hooks/use-agent-storage.ts
import { SavedAgentConfiguration } from '@/types/unified-agent-types';
import {
  saveAgentConfiguration,
  getUserAgentConfigurations,
  deleteAgentConfiguration,
  getAgentConfiguration,
  saveAgentOrder as saveAgentOrderInService, // Renamed to avoid conflict
  loadAgentOrder as loadAgentOrderFromService, // Renamed to avoid conflict
} from '@/services/agent-service';

export function useAgentStorage(userId?: string) { // Added userId as a hook parameter
  // Renamed from originalLoadAgents to simply loadAgentsFromStorage
  const loadAgentsFromStorage = async (): Promise<SavedAgentConfiguration[]> => {
    if (!userId) {
      console.error('Error loading agents: userId is required.');
      return [];
    }
    try {
      // The new service returns Date objects directly.
      return await getUserAgentConfigurations(userId);
    } catch (error) {
      console.error('Error loading agents from agent service:', error);
      return [];
    }
  };

  // Renamed from the internal addAgent to createAgentInStorage
  const createAgentInStorage = async (
    agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ): Promise<SavedAgentConfiguration> => {
    if (!userId) {
      console.error('Error creating agent: userId is required.');
      throw new Error('User ID is required to create an agent.');
    }
    const newAgent: SavedAgentConfiguration = {
      ...agentConfigData,
      id: crypto.randomUUID(), // Service expects an ID for updates, for new ones, it can be omitted or handled by service
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: userId, // Ensure userId is part of the agent config
    };
    try {
      await saveAgentConfiguration(newAgent, userId);
      return newAgent; // saveAgentConfiguration is void, so return the constructed agent
    } catch (error) {
      console.error('Error adding agent via agent service:', error);
      throw error;
    }
  };

  const updateAgentInStorage = async (
    updatedAgentData: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> & { id: string }
  ): Promise<SavedAgentConfiguration | null> => {
    if (!userId) {
      console.error('Error updating agent: userId is required for context, though not directly on agent data for update.');
      // Depending on rules, userId might be needed for permission checks even if not changing owner
      // For now, proceed if agentId is present.
    }
    try {
      const agentToUpdate = await getAgentConfiguration(updatedAgentData.id);
      if (!agentToUpdate) {
        console.error(`Agent with ID ${updatedAgentData.id} not found for update.`);
        return null;
      }

      // Construct the agent object for update.
      const partiallyUpdatedAgent = {
        ...agentToUpdate,
        ...updatedAgentData,
        updatedAt: new Date(), // Explicitly set updatedAt
      };

      await saveAgentConfiguration(partiallyUpdatedAgent, agentToUpdate.userId || userId); // Pass userId for context, service uses existing ownerId
      return partiallyUpdatedAgent;
    } catch (error) {
      console.error('Error updating agent via agent service:', error);
      throw error;
    }
  };

  const deleteAgentFromStorage = async (id: string): Promise<boolean> => {
    try {
      await deleteAgentConfiguration(id);
      return true;
    } catch (error) {
      console.error('Error deleting agent via agent service:', error);
      return false;
    }
  };

  // Agent Order functions now use the new service and require userId
  const saveAgentOrder = async (order: string[]): Promise<void> => {
    if (!userId) {
      console.error('Error saving agent order: userId is required.');
      return;
    }
    try {
      await saveAgentOrderInService(userId, order);
    } catch (error) {
      console.error('Error saving agent order via agent service:', error);
      // Optionally, re-throw or handle
    }
  };

  // loadAgentOrder is now async as it calls the async service function and requires userId
  const loadAgentOrder = async (): Promise<string[]> => {
    if (!userId) {
      console.error('Error loading agent order: userId is required.');
      return [];
    }
    try {
      return await loadAgentOrderFromService(userId);
    } catch (error) {
      console.error('Error loading agent order via agent service:', error);
      return [];
    }
  };

  // loadAgentsWithOrder now correctly awaits the async loadAgentOrder
  const loadAgentsWithOrder = async (): Promise<SavedAgentConfiguration[]> => {
    const agents = await loadAgentsFromStorage(); // Use the renamed base loader (userId is now from hook scope)
    const order = await loadAgentOrder(); // Await the async function (userId is now from hook scope)

    if (order.length > 0 && agents.length > 0) {
      const orderedAgents: SavedAgentConfiguration[] = [];
      const agentMap = new Map(agents.map(agent => [agent.id, agent]));

      for (const id of order) {
        if (agentMap.has(id)) {
          orderedAgents.push(agentMap.get(id)!);
          agentMap.delete(id);
        }
      }
      orderedAgents.push(...agentMap.values()); // Add any agents not in the order list
      return orderedAgents;
    }
    return agents;
  };

  // addAgentAndUpdateOrder now uses the renamed createAgentInStorage and async load/save for order
  const addAgentAndUpdateOrder = async (
    agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ): Promise<SavedAgentConfiguration> => {
    // userId for createAgentInStorage is now from hook scope
    const newAgent = await createAgentInStorage(agentConfigData);
    if (newAgent && newAgent.id) { // Ensure newAgent and its ID are valid
      try {
        const currentOrder = await loadAgentOrder(); // userId from hook scope
        if (!currentOrder.includes(newAgent.id)) {
          const newOrder = [...currentOrder, newAgent.id];
          await saveAgentOrder(newOrder); // userId from hook scope
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
        const currentOrder = await loadAgentOrder(); // userId from hook scope
        const newOrder = currentOrder.filter(agentId => agentId !== id);
        if (newOrder.length !== currentOrder.length) {
          await saveAgentOrder(newOrder); // userId from hook scope
        }
      } catch (error) {
        console.error('Failed to update agent order after deleting agent:', error);
      }
    }
    return success;
  };

  return {
    loadAgents: loadAgentsWithOrder,
    saveAgent: addAgentAndUpdateOrder,
    updateAgent: updateAgentInStorage,
    deleteAgent: deleteAgentAndUpdateOrder,
    // saveAgentOrder and loadAgentOrder are now methods that use the hook's userId
    saveAgentOrder,
    loadAgentOrder,
  };
}
