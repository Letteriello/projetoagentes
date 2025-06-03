import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SavedAgentConfiguration } from '@/types/agent-configs-fixed';

const DB_NAME = 'adkDB';
const DB_VERSION = 1;
const AGENTS_STORE_NAME = 'agentsStore';

interface AdkDB extends DBSchema {
  [AGENTS_STORE_NAME]: {
    key: string;
    value: SavedAgentConfiguration;
    indexes: { userId: string }; // Example index, if needed later
  };
}

let dbPromise: Promise<IDBPDatabase<AdkDB>> | null = null;

const getDb = (): Promise<IDBPDatabase<AdkDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<AdkDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`);
        if (!db.objectStoreNames.contains(AGENTS_STORE_NAME)) {
          const store = db.createObjectStore(AGENTS_STORE_NAME, {
            keyPath: 'id',
          });
          // Example of creating an index if needed in the future
          // store.createIndex('userId', 'userId', { unique: false });
          console.log(`Object store ${AGENTS_STORE_NAME} created.`);
        }
      },
    });
  }
  return dbPromise;
};

export const getAgentByIdDB = async (id: string): Promise<SavedAgentConfiguration | undefined> => {
  const db = await getDb();
  const agent = await db.get(AGENTS_STORE_NAME, id);
  if (agent) {
    // Ensure dates are Date objects
    return {
      ...agent,
      createdAt: agent.createdAt ? new Date(agent.createdAt) : new Date(),
      updatedAt: agent.updatedAt ? new Date(agent.updatedAt) : new Date(),
    };
  }
  return undefined;
};

export const getAllAgentsDB = async (): Promise<SavedAgentConfiguration[]> => {
  const db = await getDb();
  const agents = await db.getAll(AGENTS_STORE_NAME);
  return agents.map(agent => ({
    ...agent,
    createdAt: agent.createdAt ? new Date(agent.createdAt) : new Date(),
    updatedAt: agent.updatedAt ? new Date(agent.updatedAt) : new Date(),
  }));
};

export const addAgentDB = async (agent: SavedAgentConfiguration): Promise<SavedAgentConfiguration> => {
  const db = await getDb();
  // Convert Date objects to ISO strings or timestamps for storage if not already
  const storableAgent = {
    ...agent,
    createdAt: new Date(agent.createdAt).toISOString(),
    updatedAt: new Date(agent.updatedAt).toISOString(),
  };
  await db.put(AGENTS_STORE_NAME, storableAgent);
  return agent; // Return the original agent with Date objects
};

export const updateAgentDB = async (agent: SavedAgentConfiguration): Promise<SavedAgentConfiguration> => {
  const db = await getDb();
  const storableAgent = {
    ...agent,
    createdAt: new Date(agent.createdAt).toISOString(), // Ensure consistent date handling
    updatedAt: new Date(agent.updatedAt).toISOString(),
  };
  await db.put(AGENTS_STORE_NAME, storableAgent); // 'put' works for both add and update
  return agent;
};

export const deleteAgentDB = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.delete(AGENTS_STORE_NAME, id);
};

// Optional: Function to clear all agents (for testing or specific use cases)
export const clearAllAgentsDB = async (): Promise<void> => {
  const db = await getDb();
  await db.clear(AGENTS_STORE_NAME);
  console.log('All agents cleared from IndexedDB.');
};
