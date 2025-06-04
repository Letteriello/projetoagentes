// src/lib/indexed-db-manager.ts

// Store Name Constants - These should align with what services expect.
// Services can either import these or continue to define their own with the same values.
// For this exercise, we assume services will use these string values directly or import them later.
export const AGENT_STORE_NAME = 'agents';
export const AGENT_ORDER_STORE_NAME = 'agentOrder';
export const CONVERSATIONS_STORE_NAME = 'conversations';
export const MESSAGES_STORE_NAME = 'messages';
export const API_KEY_STORE_NAME = 'apiKeys';

export const DB_NAME = 'AgentBuilderDB';
export const DB_VERSION = 1; // Master DB version

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      // const newVersion = event.newVersion || DB_VERSION; // newVersion is available on the event

      console.log(`Upgrading IndexedDB from version ${oldVersion} to ${DB_VERSION}`);

      // Initial schema creation for version 1
      if (oldVersion < 1) {
        // Agent Store
        if (!db.objectStoreNames.contains(AGENT_STORE_NAME)) {
          const agentStore = db.createObjectStore(AGENT_STORE_NAME, { keyPath: 'id' });
          agentStore.createIndex('userId', 'userId', { unique: false });
          console.log(`Created object store: ${AGENT_STORE_NAME}`);
        }

        // Agent Order Store
        if (!db.objectStoreNames.contains(AGENT_ORDER_STORE_NAME)) {
          db.createObjectStore(AGENT_ORDER_STORE_NAME);
          console.log(`Created object store: ${AGENT_ORDER_STORE_NAME}`);
        }

        // Conversations Store
        if (!db.objectStoreNames.contains(CONVERSATIONS_STORE_NAME)) {
          const convoStore = db.createObjectStore(CONVERSATIONS_STORE_NAME, { keyPath: 'id' });
          convoStore.createIndex('userId', 'userId', { unique: false });
          convoStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          console.log(`Created object store: ${CONVERSATIONS_STORE_NAME}`);
        }

        // Messages Store
        if (!db.objectStoreNames.contains(MESSAGES_STORE_NAME)) {
          const msgStore = db.createObjectStore(MESSAGES_STORE_NAME, { keyPath: 'id' });
          msgStore.createIndex('conversationId', 'conversationId', { unique: false });
          msgStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log(`Created object store: ${MESSAGES_STORE_NAME}`);
        }

        // API Key Store
        if (!db.objectStoreNames.contains(API_KEY_STORE_NAME)) {
          const apiKeyStore = db.createObjectStore(API_KEY_STORE_NAME, { keyPath: 'id' });
          apiKeyStore.createIndex('serviceName', 'serviceName', { unique: false });
          apiKeyStore.createIndex('serviceType', 'serviceType', { unique: false });
          console.log(`Created object store: ${API_KEY_STORE_NAME}`);
        }
      }

      // Example for future migrations:
      // if (oldVersion < 2) {
      //   // This code would run if DB_VERSION is 2 and the client's DB is currently version 1
      //   console.log('Upgrading to version 2 specific changes...');
      //   // Example: Add a new index to an existing store
      //   // Must be done within the versionchange transaction
      //   const transaction = (event.target as IDBOpenDBRequest).transaction;
      //   if (transaction && db.objectStoreNames.contains(AGENT_STORE_NAME)) {
      //       const agentStore = transaction.objectStore(AGENT_STORE_NAME);
      //       if (!agentStore.indexNames.contains('newIndexV2')) {
      //           agentStore.createIndex('newIndexV2', 'newIndexV2', { unique: false });
      //           console.log('Created newIndexV2 on agents store');
      //       }
      //   }
      //   // Example: Create a new store for version 2
      //   if (!db.objectStoreNames.contains('newStoreForV2')) {
      //       db.createObjectStore('newStoreForV2', { keyPath: 'id' });
      //       console.log('Created newStoreForV2');
      //   }
      // }
      // if (oldVersion < 3) {
      //    console.log('Upgrading to version 3 specific changes...');
      // }
    };

    request.onsuccess = (event) => {
      console.log(`IndexedDB ${DB_NAME} version ${DB_VERSION} opened successfully.`);
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.error(`IndexedDB error opening ${DB_NAME}:`, error);
      dbPromise = null; // Reset promise on error
      reject(error);
    };
  });

  return dbPromise;
}

// Optional: A function to pre-warm the database on application startup
export async function initializeDB(): Promise<void> {
  try {
    await openDatabase();
    console.log("Database initialized successfully via indexed-db-manager.");
  } catch (error) {
    console.error("Failed to initialize database via indexed-db-manager:", error);
  }
}
