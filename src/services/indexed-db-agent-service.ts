import { SavedAgentConfiguration } from '@/types/agent-configs-fixed';
import { openDatabase } from '@/lib/indexed-db-manager';

// Store names are defined locally but must match those in indexed-db-manager.ts
export const AGENT_STORE_NAME = 'agents';
export const AGENT_ORDER_STORE_NAME = 'agentOrder';


// Helper functions for date conversion
// No changes to helper functions themselves
const toStorableAgent = (agent: SavedAgentConfiguration): any => {
  return {
    ...agent,
    createdAt: agent.createdAt instanceof Date ? agent.createdAt.toISOString() : agent.createdAt,
    updatedAt: agent.updatedAt instanceof Date ? agent.updatedAt.toISOString() : agent.updatedAt,
  };
};

const fromStorableAgent = (storable: any): SavedAgentConfiguration => {
  if (!storable) return storable;
  return {
    ...storable,
    createdAt: new Date(storable.createdAt),
    updatedAt: new Date(storable.updatedAt),
  } as SavedAgentConfiguration;
};

export async function addAgent(agent: SavedAgentConfiguration): Promise<SavedAgentConfiguration> {
  const db = await openDatabase();
  const tx = db.transaction(AGENT_STORE_NAME, 'readwrite');
  const store = tx.objectStore(AGENT_STORE_NAME);
  const storableAgent = toStorableAgent(agent);
  await store.add(storableAgent);
  await tx.done;
  return fromStorableAgent(storableAgent); // Return with Date objects
}

export async function getAgentById(id: string): Promise<SavedAgentConfiguration | undefined> {
  const db = await openDatabase();
  const tx = db.transaction(AGENT_STORE_NAME, 'readonly');
  const store = tx.objectStore(AGENT_STORE_NAME);
  const storableAgent = await store.get(id);
  await tx.done;
  return fromStorableAgent(storableAgent);
}

export async function getAllAgents(userId?: string): Promise<SavedAgentConfiguration[]> {
  const db = await openDatabase();
  const tx = db.transaction(AGENT_STORE_NAME, 'readonly');
  const store = tx.objectStore(AGENT_STORE_NAME);
  let request;

  if (userId) {
    const index = store.index('userId');
    request = index.getAll(userId);
  } else {
    request = store.getAll();
  }

  const storableAgents = await request;
  await tx.done;
  return storableAgents.map(fromStorableAgent);
}

export async function updateAgent(agent: SavedAgentConfiguration): Promise<SavedAgentConfiguration> {
  const db = await openDatabase();
  const tx = db.transaction(AGENT_STORE_NAME, 'readwrite');
  const store = tx.objectStore(AGENT_STORE_NAME);
  const agentToStore = toStorableAgent({
    ...agent,
    updatedAt: new Date(), // Update the updatedAt timestamp
  });
  await store.put(agentToStore);
  await tx.done;
  return fromStorableAgent(agentToStore);
}

export async function deleteAgent(id: string): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(AGENT_STORE_NAME, 'readwrite');
  const store = tx.objectStore(AGENT_STORE_NAME);
  await store.delete(id);
  await tx.done;
}

export async function saveAgentOrder(order: string[], agentOrderKey: string = 'currentOrder'): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(AGENT_ORDER_STORE_NAME, 'readwrite');
  const store = tx.objectStore(AGENT_ORDER_STORE_NAME);
  await store.put(order, agentOrderKey);
  await tx.done;
}

export async function loadAgentOrder(agentOrderKey: string = 'currentOrder'): Promise<string[]> {
  const db = await openDatabase();
  const tx = db.transaction(AGENT_ORDER_STORE_NAME, 'readonly');
  const store = tx.objectStore(AGENT_ORDER_STORE_NAME);
  const order = await store.get(agentOrderKey);
  await tx.done;
  return order || [];
}
