// src/services/api-key-service.ts

/**
 * WARNING: This is a simplified API key management system for demonstration purposes.
 * Storing full API keys in browser memory (even temporarily) and fragments in IndexedDB
 * is not secure for production environments. In a production application, API keys should be
 * stored securely in a backend system with appropriate encryption and access controls.
 */

import { ApiKeyEntry } from '@/types/tool-core'; // Updated import
import { openDatabase } from '@/lib/indexed-db-manager';

// Store name defined locally, must match the one in indexed-db-manager.ts
export const API_KEY_STORE_NAME = 'apiKeys';

// Pseudo-encryption key
const PSEUDO_ENCRYPTION_KEY = "mysecretkey";

// Encryption function
const encryptData = (data: string): string => {
  if (!data) return '';
  const xorEncrypted = data.split('').map((char, i) => {
    return String.fromCharCode(char.charCodeAt(0) ^ PSEUDO_ENCRYPTION_KEY.charCodeAt(i % PSEUDO_ENCRYPTION_KEY.length));
  }).join('');
  return btoa(xorEncrypted);
};

// Decryption function
const decryptData = (encryptedData: string): string => {
  if (!encryptedData) return '';
  const fromBase64 = atob(encryptedData);
  return fromBase64.split('').map((char, i) => {
    return String.fromCharCode(char.charCodeAt(0) ^ PSEUDO_ENCRYPTION_KEY.charCodeAt(i % PSEUDO_ENCRYPTION_KEY.length));
  }).join('');
};

// Type for DB storage, aligned with Core ApiKeyEntry (string dates, specific field names)
type StorableApiKeyEntry = {
  id: string;
  name: string; // Was serviceName
  encryptedApiKey: string;
  fragment: string;
  service: string; // Was serviceType
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
  // Optional fields from Core ApiKeyEntry if also stored
  serviceName?: string;
  serviceType?: string;
};

// Helper to generate fragment
const createFragment = (key: string): string => {
  if (key.length <= 8) return '****';
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

export const saveApiKey = async (name: string, key: string, service: string, options?: { serviceName?: string, serviceType?: string }): Promise<ApiKeyEntry> => {
  if (!name || !key || !service) {
    throw new Error("Service identifier (name), API key (key), and service type (service) are required.");
  }

  const id = `key_${new Date().getTime()}_${Math.random().toString(36).substring(2, 7)}`;
  const fragment = createFragment(key);
  const encryptedApiKey = encryptData(key);
  const now = new Date().toISOString();

  const storableEntry: StorableApiKeyEntry = {
    id,
    name: name, // Main identifier for the key, e.g., "OpenAI API Key"
    encryptedApiKey,
    fragment,
    service: service, // Technical service identifier, e.g., "openai", "google-search"
    createdAt: now,
    updatedAt: now,
    serviceName: options?.serviceName || name, // User-friendly service name if different from main name
    serviceType: options?.serviceType || service, // More specific type if different from main service id
  };

  const db = await openDatabase();
  const tx = db.transaction(API_KEY_STORE_NAME, 'readwrite');
  const store = tx.objectStore(API_KEY_STORE_NAME);
  await store.put(storableEntry);
  await tx.done;

  return {
    id,
    name: storableEntry.name,
    key, // Return the original, decrypted key for immediate use if needed
    fragment,
    service: storableEntry.service,
    createdAt: storableEntry.createdAt,
    updatedAt: storableEntry.updatedAt,
    serviceName: storableEntry.serviceName,
    serviceType: storableEntry.serviceType,
  };
};

export const getApiKey = async (id: string): Promise<ApiKeyEntry | undefined> => {
  const db = await openDatabase();
  const storable = await db.get(API_KEY_STORE_NAME, id) as StorableApiKeyEntry | undefined;

  if (storable) {
    const decryptedApiKey = decryptData(storable.encryptedApiKey);
    if (!decryptedApiKey && storable.encryptedApiKey) {
      console.error(`Failed to decrypt API key for ID: ${id}. Key may be corrupted.`);
      return {
        id: storable.id,
        name: `${storable.name} (Error: Key Corrupted)`,
        key: '', // Indicate missing/corrupt key
        fragment: storable.fragment,
        service: storable.service,
        createdAt: storable.createdAt,
        updatedAt: storable.updatedAt,
        serviceName: storable.serviceName,
        serviceType: storable.serviceType,
      };
    }
    return {
      id: storable.id,
      name: storable.name,
      key: decryptedApiKey,
      fragment: storable.fragment,
      service: storable.service,
      createdAt: storable.createdAt,
      updatedAt: storable.updatedAt,
      serviceName: storable.serviceName,
      serviceType: storable.serviceType,
    };
  }
  return undefined;
};

export const listApiKeys = async (): Promise<ApiKeyEntry[]> => {
  const db = await openDatabase();
  const allStorableEntries = await db.getAll(API_KEY_STORE_NAME) as StorableApiKeyEntry[];

  return allStorableEntries.map(storable => {
    const decryptedApiKey = decryptData(storable.encryptedApiKey);
    if (!decryptedApiKey && storable.encryptedApiKey) {
      console.warn(`Failed to decrypt API key for ${storable.name} (ID: ${storable.id}) during list operation.`);
      return {
        id: storable.id,
        name: `${storable.name} (Error: Key Corrupted)`,
        key: '',
        fragment: storable.fragment,
        service: storable.service,
        createdAt: storable.createdAt,
        updatedAt: storable.updatedAt,
        serviceName: storable.serviceName,
        serviceType: storable.serviceType,
      };
    }
    return {
      id: storable.id,
      name: storable.name,
      key: decryptedApiKey,
      fragment: storable.fragment,
      service: storable.service,
      createdAt: storable.createdAt,
      updatedAt: storable.updatedAt,
      serviceName: storable.serviceName,
      serviceType: storable.serviceType,
    };
  });
};

export const deleteApiKey = async (id: string): Promise<boolean> => {
  const db = await openDatabase();
  const tx = db.transaction(API_KEY_STORE_NAME, 'readwrite');
  const store = tx.objectStore(API_KEY_STORE_NAME);
  const existingKey = await store.getKey(id);
  if (!existingKey) {
    await tx.done;
    return false;
  }
  await store.delete(id);
  await tx.done;
  return true;
};

// RehydrateKey is effectively an update. If a key needs to be re-entered,
// the UI should call saveApiKey with the new key value, which will re-encrypt and update.
// This function can be removed or re-purposed if there's a specific non-update rehydration scenario.
// For now, commenting out as its previous logic is covered by saveApiKey (as an update).
/*
export const rehydrateKey = async (id: string, apiKeyInput: string): Promise<boolean> => {
  console.warn("rehydrateKey is being called. Consider using saveApiKey to update/re-encrypt keys.");
  const entry = await getApiKey(id); // This will use the core ApiKeyEntry
  if (entry) {
    // To "rehydrate", we re-save it. saveApiKey will use the new field names.
    await saveApiKey(entry.name, apiKeyInput, entry.service, { serviceName: entry.serviceName, serviceType: entry.serviceType });
    return true;
  }
  return false;
}
*/

console.warn(
  "API Key Service initialized. REMINDER: This is for demo purposes. " +
  "Do not use this method for storing sensitive credentials in a production environment."
);
