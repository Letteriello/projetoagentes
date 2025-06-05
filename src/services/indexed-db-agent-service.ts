// src/services/indexed-db-agent-service.ts
import { SavedAgentConfiguration } from '@/types/agent-core'; // Updated path
import { openDatabase } from '@/lib/indexed-db-manager';
import { retryWithBackoff, isRetryableIDBError, RetryConfig } from '@/lib/utils';

// Interface para o agente armazenável no IndexedDB
// StorableAgent uses string dates, matching SavedAgentConfiguration from agent-core
interface StorableAgent extends Omit<SavedAgentConfiguration, 'createdAt' | 'updatedAt'> {
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export const AGENT_STORE_NAME = 'agents';
export const AGENT_ORDER_STORE_NAME = 'agentOrder';

const idbRetryConfig: RetryConfig = {
  maxRetries: 2,
  initialDelayMs: 100,
  shouldRetry: isRetryableIDBError,
  logRetries: true,
};

// SavedAgentConfiguration from agent-core uses string for dates.
// StorableAgent also uses string for dates.
const toStorableAgent = (agent: SavedAgentConfiguration): StorableAgent => {
  // Ensure dates are in ISO string format.
  // SavedAgentConfiguration from agent-core already defines them as string.
  return {
    ...agent,
    createdAt: agent.createdAt, // Should already be string
    updatedAt: agent.updatedAt, // Should already be string
  };
};

const fromStorableAgent = (storable: StorableAgent | null | undefined): SavedAgentConfiguration | null => {
  if (!storable) return null;
  // StorableAgent already has dates as strings, which matches SavedAgentConfiguration from agent-core.
  return {
    ...storable,
    // No date conversion needed if SavedAgentConfiguration expects strings.
  };
};

export async function addAgent(agent: SavedAgentConfiguration): Promise<SavedAgentConfiguration> {
  return retryWithBackoff(async () => {
    const db = await openDatabase();
    const tx = db.transaction(AGENT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(AGENT_STORE_NAME);
    // Agent already has string dates from SavedAgentConfiguration type
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
  try {
    const db = await openDatabase();
    const tx = db.transaction(AGENT_STORE_NAME, 'readonly');
    const store = tx.objectStore(AGENT_STORE_NAME);
    const storableAgent = await store.get(id) as StorableAgent | undefined;
    
    if (!storableAgent) return null;
    
    return fromStorableAgent(storableAgent);
  } catch (error) {
    console.error('Erro ao buscar agente por ID:', error);
    return null;
  }
}

export async function getAllAgents(userId?: string): Promise<SavedAgentConfiguration[]> {
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

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const storableAgents = request.result;
        if (!Array.isArray(storableAgents)) {
          resolve([]);
          return;
        }
        const result = storableAgents
          .filter((agent): agent is StorableAgent =>
            agent && typeof agent === 'object' && 'id' in agent &&
            'createdAt' in agent && 'updatedAt' in agent // Basic check
          )
          .map(agent => fromStorableAgent(agent))
          .filter((agent): agent is SavedAgentConfiguration => agent !== null);
        resolve(result);
      };
      request.onerror = () => {
        console.error('Error fetching agents from IDBRequest:', request.error);
        reject(request.error);
      };
    });
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
    
    const updatedAgentData: SavedAgentConfiguration = {
      ...agent,
      updatedAt: new Date().toISOString() // Core type uses string
    };
    const agentToStore = toStorableAgent(updatedAgentData);

    try {
      await store.put(agentToStore);
      await tx.done;
      return fromStorableAgent(agentToStore) as SavedAgentConfiguration;
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
