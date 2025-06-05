import { SavedAgentConfiguration } from '@/types/agent-configs-fixed';
import { openDatabase } from '@/lib/indexed-db-manager';
import { retryWithBackoff, isRetryableIDBError, RetryConfig } from '@/lib/utils';

// Interface para o agente armazenável no IndexedDB
interface StorableAgent extends Omit<SavedAgentConfiguration, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

// Store names are defined locally but must match those in indexed-db-manager.ts
export const AGENT_STORE_NAME = 'agents';
export const AGENT_ORDER_STORE_NAME = 'agentOrder';

// Default retry configuration for IndexedDB operations
const idbRetryConfig: RetryConfig = {
  maxRetries: 2, // Fewer retries for local DB operations
  initialDelayMs: 100,
  shouldRetry: isRetryableIDBError,
  logRetries: true,
};

// Função auxiliar para converter para Date se for string
const toDate = (date: Date | string): Date => {
  return date instanceof Date ? date : new Date(date);
};

const toStorableAgent = (agent: SavedAgentConfiguration): StorableAgent => {
  const createdAt = toDate(agent.createdAt);
  const updatedAt = toDate(agent.updatedAt);
  
  const { createdAt: _, updatedAt: __, ...rest } = agent;
  
  return {
    ...rest,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
};

const fromStorableAgent = (storable: StorableAgent | null | undefined): SavedAgentConfiguration | null => {
  if (!storable) return null;
  return {
    ...storable,
    createdAt: new Date(storable.createdAt),
    updatedAt: new Date(storable.updatedAt),
  };
};

export async function addAgent(agent: SavedAgentConfiguration): Promise<SavedAgentConfiguration> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const tx = db.transaction(AGENT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(AGENT_STORE_NAME);
    const storableAgent = toStorableAgent(agent);
    try {
      await store.add(storableAgent);
      await tx.done;
      return fromStorableAgent(storableAgent) as SavedAgentConfiguration;
    } catch (error) {
      console.error('Error in addAgent (attempt):', error);
      throw error;
    }
  }, idbRetryConfig);
}

export async function getAgentById(id: string): Promise<SavedAgentConfiguration | null> {
  // Read operations typically don't need retries unless specific transient read errors are common
  try {
    const db = await openDatabase();
    const tx = db.transaction(AGENT_STORE_NAME, 'readonly');
    const store = tx.objectStore(AGENT_STORE_NAME);
    const storableAgent = await store.get(id);
    
    if (!storableAgent) return null;
    
    const typedAgent = storableAgent as StorableAgent;
    return fromStorableAgent(typedAgent);
  } catch (error) {
    console.error('Erro ao buscar agente por ID:', error);
    return null;
  }
}

export async function getAllAgents(userId?: string): Promise<SavedAgentConfiguration[]> {
  // Read operations typically don't need retries
  try {
    const db = await openDatabase();
    const tx = db.transaction(AGENT_STORE_NAME, 'readonly');
    const store = tx.objectStore(AGENT_STORE_NAME);
    let request: IDBRequest<any[]>;

    if (userId) {
      const index = store.index('userId');
      request = index.getAll(userId);
    } else {
      request = store.getAll();
    }

    const storableAgents = await request;

    if (!Array.isArray(storableAgents)) return [];
  
    return storableAgents
      .filter((agent): agent is StorableAgent => {
        return agent && 
               typeof agent === 'object' && 
               'id' in agent && 
               'createdAt' in agent && 
               'updatedAt' in agent;
      })
      .map(agent => fromStorableAgent(agent))
      .filter((agent): agent is SavedAgentConfiguration => agent !== null);
  } catch (error) {
    console.error('Erro ao buscar agentes do IndexedDB:', error);
    return [];
  }
}

export async function updateAgent(agent: SavedAgentConfiguration): Promise<SavedAgentConfiguration> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const tx = db.transaction(AGENT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(AGENT_STORE_NAME);
    
    const updatedAgentData = {
      ...agent,
      updatedAt: new Date()
    };
    const agentToStore = toStorableAgent(updatedAgentData);

    try {
      await store.put(agentToStore);
      await tx.done;
      return updatedAgentData;
    } catch (error) {
      console.error('Erro ao atualizar agente (attempt):', error);
      throw error;
    }
  }, idbRetryConfig);
}

export async function deleteAgent(id: string): Promise<void> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const tx = db.transaction(AGENT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(AGENT_STORE_NAME);
    try {
      await store.delete(id);
      await tx.done;
    } catch (error) {
      console.error('Error in deleteAgent (attempt):', error);
      throw error;
    }
  }, idbRetryConfig);
}

export async function saveAgentOrder(order: string[], agentOrderKey: string = 'currentOrder'): Promise<void> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const tx = db.transaction(AGENT_ORDER_STORE_NAME, 'readwrite');
    const store = tx.objectStore(AGENT_ORDER_STORE_NAME);
    try {
      await store.put(order, agentOrderKey);
      await tx.done;
    } catch (error) {
      console.error('Error in saveAgentOrder (attempt):', error);
      throw error;
    }
  }, idbRetryConfig);
}

export async function loadAgentOrder(agentOrderKey: string = 'currentOrder'): Promise<string[]> {
  // Read operation
  try {
    const db = await openDatabase();
    const tx = db.transaction(AGENT_ORDER_STORE_NAME, 'readonly');
    const store = tx.objectStore(AGENT_ORDER_STORE_NAME);
    const order = await store.get(agentOrderKey);
    return Array.isArray(order) ? order : [];
  } catch (error) {
    console.error('Error loading agent order:', error);
    return [];
  }
}
