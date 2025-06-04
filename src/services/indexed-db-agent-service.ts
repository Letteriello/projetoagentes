import { SavedAgentConfiguration } from '@/types/agent-configs-fixed';
import { openDatabase } from '@/lib/indexed-db-manager';

// Interface para o agente armazenável no IndexedDB
interface StorableAgent extends Omit<SavedAgentConfiguration, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

// Store names are defined locally but must match those in indexed-db-manager.ts
export const AGENT_STORE_NAME = 'agents';
export const AGENT_ORDER_STORE_NAME = 'agentOrder';


// Helper functions for date conversion
// No changes to helper functions themselves
// Função auxiliar para converter para Date se for string
const toDate = (date: Date | string): Date => {
  return date instanceof Date ? date : new Date(date);
};

const toStorableAgent = (agent: SavedAgentConfiguration): StorableAgent => {
  const createdAt = toDate(agent.createdAt);
  const updatedAt = toDate(agent.updatedAt);
  
  // Usa o spread operator para copiar todas as propriedades existentes
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
  const db = await openDatabase();
  const tx = db.transaction(AGENT_STORE_NAME, 'readwrite');
  const store = tx.objectStore(AGENT_STORE_NAME);
  const storableAgent = toStorableAgent(agent);
  await store.add(storableAgent);
  return fromStorableAgent(storableAgent) as SavedAgentConfiguration; // Já verificamos que não é null
}

export async function getAgentById(id: string): Promise<SavedAgentConfiguration | null> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(AGENT_STORE_NAME, 'readonly');
    const store = tx.objectStore(AGENT_STORE_NAME);
    const storableAgent = await store.get(id);
    
    if (!storableAgent) return null;
    
    // Garante que o agente retornado seja do tipo StorableAgent
    const typedAgent = storableAgent as StorableAgent;
    return fromStorableAgent(typedAgent);
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

    const storableAgents = await request;
    if (!Array.isArray(storableAgents)) return [];
  
    // Filtra e converte os agentes, garantindo que tenham o formato correto
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
  try {
    const db = await openDatabase();
    const tx = db.transaction(AGENT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(AGENT_STORE_NAME);
    
    // Cria uma cópia do agente com a data de atualização atual
    const updatedAgent = {
      ...agent,
      updatedAt: new Date()
    };
    
    const agentToStore = toStorableAgent(updatedAgent);
    await store.put(agentToStore);
    
    // Como estamos atualizando um agente que já existe, podemos garantir que o retorno não será nulo
    return updatedAgent;
  } catch (error) {
    console.error('Erro ao atualizar agente:', error);
    throw error; // Propaga o erro para ser tratado pelo chamador
  }
}

export async function deleteAgent(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(AGENT_STORE_NAME, 'readwrite');
  const store = tx.objectStore(AGENT_STORE_NAME);
  await store.delete(id);
}

export async function saveAgentOrder(order: string[], agentOrderKey: string = 'currentOrder'): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(AGENT_ORDER_STORE_NAME, 'readwrite');
  const store = tx.objectStore(AGENT_ORDER_STORE_NAME);
  await store.put(order, agentOrderKey);
}

export async function loadAgentOrder(agentOrderKey: string = 'currentOrder'): Promise<string[]> {
  const db = await openDatabase();
  const tx = db.transaction(AGENT_ORDER_STORE_NAME, 'readonly');
  const store = tx.objectStore(AGENT_ORDER_STORE_NAME);
  const order = await store.get(agentOrderKey);
  return Array.isArray(order) ? order : [];
}
