// src/services/api-key-service.ts

/**
 * WARNING: This is a simplified API key management system for demonstration purposes.
 * Storing full API keys in browser memory (even temporarily) and fragments in IndexedDB
 * is not secure for production environments. In a production application, API keys should be
 * stored securely in a backend system with appropriate encryption and access controls.
 */

export interface ApiKeyEntry {
  id: string; // Unique identifier for the key
  serviceName: string; // e.g., "Google Search", "OpenAI GPT-4"
  apiKey: string; // The full API key (kept in memory, not stored in DB)
  fragment: string; // A non-sensitive part of the key for display (e.g., first 4 and last 4 chars)
  serviceType: string; // e.g., "googleSearch", "openapi", "database", "Generic"
  createdAt: Date; // Stored as ISO string in DB
}

import { openDatabase } from '@/lib/indexed-db-manager';

// Type for DB storage (apiKey is not stored)
type StorableApiKeyEntry = Omit<ApiKeyEntry, 'apiKey' | 'createdAt'> & { createdAt: string };

// In-memory store for full API keys. This is volatile and lost on page refresh.
const volatileKeyStore: Map<string, string> = new Map();

// Store name defined locally, must match the one in indexed-db-manager.ts
export const API_KEY_STORE_NAME = 'apiKeys';


// Helper functions for Date conversion
// No changes to helper functions themselves
const toStorableApiKeyEntry = (entry: Omit<ApiKeyEntry, 'apiKey'>): StorableApiKeyEntry => {
  return {
    ...entry,
    createdAt: entry.createdAt.toISOString(),
  };
};

const fromStorableApiKeyEntry = (storable: StorableApiKeyEntry): Omit<ApiKeyEntry, 'apiKey'> => {
  return {
    ...storable,
    createdAt: new Date(storable.createdAt),
  };
};

// Function to generate a fragment for display
const createFragment = (key: string): string => {
  if (key.length <= 8) {
    return '****';
  }
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

export const saveApiKey = async (serviceName: string, apiKey: string, serviceType: string): Promise<ApiKeyEntry> => {
  if (!serviceName || !apiKey || !serviceType) {
    throw new Error("Service name, API key, and service type are required.");
  }

  const id = `key_${new Date().getTime()}_${Math.random().toString(36).substring(2, 7)}`;
  const fragment = createFragment(apiKey);
  const createdAt = new Date();

  const newKeyEntryFragment: Omit<ApiKeyEntry, 'apiKey'> = {
    id,
    serviceName,
    fragment,
    serviceType,
    createdAt,
  };

  volatileKeyStore.set(id, apiKey);

  const db = await openDatabase();
  const tx = db.transaction(API_KEY_STORE_NAME, 'readwrite');
  const store = tx.objectStore(API_KEY_STORE_NAME);
  await store.add(toStorableApiKeyEntry(newKeyEntryFragment));
  await tx.done;

  return { ...newKeyEntryFragment, apiKey };
};

export const getApiKey = async (id: string): Promise<ApiKeyEntry | undefined> => {
  const db = await openDatabase();
  const tx = db.transaction(API_KEY_STORE_NAME, 'readonly');
  const store = tx.objectStore(API_KEY_STORE_NAME);
  const storableFragment = await store.get(id) as StorableApiKeyEntry | undefined;
  await tx.done;

  if (storableFragment) {
    const keyFragmentEntry = fromStorableApiKeyEntry(storableFragment);
    const fullApiKey = volatileKeyStore.get(id);
    if (fullApiKey) {
      return { ...keyFragmentEntry, apiKey: fullApiKey };
    } else {
      console.warn(`API key for ${keyFragmentEntry.serviceName} (ID: ${id}) is not in memory. Please re-enter it.`);
      return { ...keyFragmentEntry, apiKey: '' }; // Indicates key needs re-arming
    }
  }
  return undefined;
};

export const listApiKeys = async (): Promise<ApiKeyEntry[]> => {
  const db = await openDatabase();
  const tx = db.transaction(API_KEY_STORE_NAME, 'readonly');
  const store = tx.objectStore(API_KEY_STORE_NAME);
  const storableFragments = await store.getAll() as StorableApiKeyEntry[];
  await tx.done;

  return storableFragments.map(storable => {
    const fragmentEntry = fromStorableApiKeyEntry(storable);
    const apiKey = volatileKeyStore.get(fragmentEntry.id) || '';
    return { ...fragmentEntry, apiKey };
  });
};

export const deleteApiKey = async (id: string): Promise<boolean> => {
  const db = await openDatabase();
  const tx = db.transaction(API_KEY_STORE_NAME, 'readwrite');
  const store = tx.objectStore(API_KEY_STORE_NAME);

  // Check if key exists before deleting to mimic previous length check logic
  const existingKey = await store.getKey(id);
  if (!existingKey) {
    await tx.done; // Abort transaction by not doing anything further
    return false;
  }

  await store.delete(id);
  await tx.done;

  volatileKeyStore.delete(id);
  return true;
};

export const rehydrateKey = async (id: string, apiKey: string): Promise<boolean> => {
    const db = await openDatabase();
    const tx = db.transaction(API_KEY_STORE_NAME, 'readonly');
    const store = tx.objectStore(API_KEY_STORE_NAME);
    const keyFragmentEntry = await store.get(id) as StorableApiKeyEntry | undefined;
    await tx.done;

    if (keyFragmentEntry) {
        volatileKeyStore.set(id, apiKey);
        return true;
    }
    return false;
}

console.warn(
  "API Key Service initialized. REMINDER: This is for demo purposes. " +
  "Do not use this method for storing sensitive credentials in a production environment."
);
