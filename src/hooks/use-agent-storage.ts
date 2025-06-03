// src/hooks/use-agent-storage.ts
import { SavedAgentConfiguration } from '@/types/agent-configs-fixed';

const LOCAL_STORAGE_KEY = 'savedAgents';

export function useAgentStorage() {
  const loadAgents = (): SavedAgentConfiguration[] => {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (data) {
        const parsedData = JSON.parse(data) as SavedAgentConfiguration[];
        // Ensure createdAt and updatedAt are Date objects
        return parsedData.map(agent => ({
          ...agent,
          createdAt: agent.createdAt ? new Date(agent.createdAt) : new Date(),
          updatedAt: agent.updatedAt ? new Date(agent.updatedAt) : new Date(),
        }));
      }
    } catch (error) {
      console.error('Error loading agents from localStorage:', error);
      // Optionally, clear corrupted data
      // localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    return [];
  };

  const saveAgent = (agent: SavedAgentConfiguration): SavedAgentConfiguration => {
    const agents = loadAgents();
    // Ensure no duplicate IDs, though new agents should have unique IDs generated before calling this
    if (agents.find(a => a.id === agent.id)) {
      // This case should ideally be handled by an update logic or prevented by ID generation
      console.warn(`Agent with ID ${agent.id} already exists. Consider using updateAgent.`);
      // For now, let's overwrite, but this might not be desired.
      // A better approach for a "true" save would be to ensure ID is new or throw error.
      const index = agents.findIndex(a => a.id === agent.id);
      agents[index] = agent;
    } else {
      agents.push(agent);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(agents));
    return agent;
  };

  // Supporting function to save all agents (used by save, update, delete)
  const storeAgents = (agents: SavedAgentConfiguration[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(agents));
  }

  const addAgentInternal = (agentConfigData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>, userId?: string): SavedAgentConfiguration => {
    const agents = loadAgents();
    const newAgent: SavedAgentConfiguration = {
      ...agentConfigData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(userId && { userId }), // Conditionally add userId
    };
    agents.push(newAgent);
    storeAgents(agents);
    return {
        ...newAgent,
        createdAt: new Date(newAgent.createdAt),
        updatedAt: new Date(newAgent.updatedAt),
    };
  };

  const updateAgent = (updatedAgentData: Partial<Omit<SavedAgentConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> & { id: string }): SavedAgentConfiguration | null => {
    let agents = loadAgents();
    const agentIndex = agents.findIndex(agent => agent.id === updatedAgentData.id);

    if (agentIndex === -1) {
      console.error(`Agent with ID ${updatedAgentData.id} not found for update.`);
      return null;
    }

    const originalAgent = agents[agentIndex];
    const updatedAgent: SavedAgentConfiguration = {
      ...originalAgent,
      ...updatedAgentData,
      updatedAt: new Date().toISOString(), // Always update the timestamp
    };

    agents[agentIndex] = updatedAgent;
    storeAgents(agents);
    return {
        ...updatedAgent,
        createdAt: new Date(updatedAgent.createdAt),
        updatedAt: new Date(updatedAgent.updatedAt),
    };
  };

  const deleteAgent = (id: string): boolean => {
    let agents = loadAgents();
    const initialLength = agents.length;
    agents = agents.filter(agent => agent.id !== id);
    if (agents.length < initialLength) {
      storeAgents(agents);
      return true;
    }
    return false; // Agent not found or not deleted
  };

  return { loadAgents, saveAgent: addAgentInternal, updateAgent, deleteAgent };
}
