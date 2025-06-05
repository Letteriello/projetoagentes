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
  apiKey: string; // The full, decrypted API key
  fragment: string; // A non-sensitive part of the key for display (e.g., first 4 and last 4 chars)
  serviceType: string; // e.g., "googleSearch", "openapi", "database", "Generic"
  createdAt: Date; // Stored as ISO string in DB
  updatedAt?: Date; // Optional: to track updates
}

import { openDatabase } from '@/lib/indexed-db-manager';

// Pseudo-encryption key (keep this consistent, but in a real app, manage it more securely)
const PSEUDO_ENCRYPTION_KEY = "mysecretkey";

// Encryption function (XOR with Base64 encoding)
const encryptData = (data: string): string => {
  if (!data) return '';
  const xorEncrypted = data.split('').map((char, i) => {
    return String.fromCharCode(char.charCodeAt(0) ^ PSEUDO_ENCRYPTION_KEY.charCodeAt(i % PSEUDO_ENCRYPTION_KEY.length));
  }).join('');
  return btoa(xorEncrypted); // Base64 encode to make it easily storable
};

// Decryption function (Base64 decoding with XOR)
const decryptData = (encryptedData: string): string => {
  if (!encryptedData) return '';
  const fromBase64 = atob(encryptedData); // Base64 decode
  return fromBase64.split('').map((char, i) => {
    return String.fromCharCode(char.charCodeAt(0) ^ PSEUDO_ENCRYPTION_KEY.charCodeAt(i % PSEUDO_ENCRYPTION_KEY.length));
  }).join('');
};


// Type for DB storage
type StorableApiKeyEntry = {
  id: string;
  serviceName: string;
  encryptedApiKey: string; // Encrypted API key
  fragment: string;
  serviceType: string;
  createdAt: string; // ISO string
  updatedAt?: string; // ISO string
};

// In-memory store for full API keys - This will be phased out for storing actual keys as per task.
// It might still be used temporarily if a key is re-entered but not yet saved,
// but the source of truth for saved keys is IndexedDB (encrypted).
const volatileKeyStore: Map<string, string> = new Map(); // To be removed or repurposed. For now, let's clear its direct usage for API keys.

// Store name defined locally, must match the one in indexed-db-manager.ts
export const API_KEY_STORE_NAME = 'apiKeys';


// Helper functions for Date conversion
const toStorableApiKeyEntry = (entry: Omit<ApiKeyEntry, 'apiKey' | 'updatedAt'> & { encryptedApiKey: string; updatedAt?: Date }): StorableApiKeyEntry => {
  return {
    id: entry.id,
    serviceName: entry.serviceName,
    encryptedApiKey: entry.encryptedApiKey,
    fragment: entry.fragment,
    serviceType: entry.serviceType,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt?.toISOString(),
  };
};

const fromStorableApiKeyEntry = (storable: StorableApiKeyEntry): Omit<ApiKeyEntry, 'apiKey'> & { encryptedApiKey: string } => {
  return {
    id: storable.id,
    serviceName: storable.serviceName,
    encryptedApiKey: storable.encryptedApiKey,
    fragment: storable.fragment,
    serviceType: storable.serviceType,
    createdAt: new Date(storable.createdAt),
    updatedAt: storable.updatedAt ? new Date(storable.updatedAt) : undefined,
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
  const fragment = createFragment(apiKey); // Create fragment from original key
  const encryptedApiKey = encryptData(apiKey); // Encrypt the original key
  const createdAt = new Date();
  const updatedAt = createdAt;

  const storableEntry: StorableApiKeyEntry = {
    id,
    serviceName,
    encryptedApiKey,
    fragment,
    serviceType,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };

  // volatileKeyStore.set(id, apiKey); // No longer storing raw key in volatile store
  volatileKeyStore.delete(id); // Ensure any old raw key is removed if volatileKeyStore is repurposed

  const db = await openDatabase();
  const tx = db.transaction(API_KEY_STORE_NAME, 'readwrite');
  const store = tx.objectStore(API_KEY_STORE_NAME);
  await store.put(storableEntry); // Use put for save or update
  await tx.done;

  return { // Return the decrypted key as per ApiKeyEntry interface
    id,
    serviceName,
    apiKey, // The original, decrypted key
    fragment,
    serviceType,
    createdAt,
    updatedAt,
  };
};

export const getApiKey = async (id: string): Promise<ApiKeyEntry | undefined> => {
  const db = await openDatabase();
  const tx = db.transaction(API_KEY_STORE_NAME, 'readonly');
  const store = tx.objectStore(API_KEY_STORE_NAME);
  const storable = await store.get(id) as StorableApiKeyEntry | undefined;
  await tx.done;

  if (storable) {
    const decryptedApiKey = decryptData(storable.encryptedApiKey);
    if (!decryptedApiKey && storable.encryptedApiKey) { // Check if decryption failed for a non-empty encrypted key
        console.error(`Failed to decrypt API key for ID: ${id}. The encryption key might have changed or data is corrupt.`);
        // Decide how to handle this: throw error, or return indicating failure
        // For now, returning undefined as if not found, or an entry that indicates error
        return {
            ...fromStorableApiKeyEntry(storable),
            apiKey: '', // Indicate missing/corrupt key
            serviceName: `${storable.serviceName} (Error: Key Corrupted)`,
         };
    }
    return {
      id: storable.id,
      serviceName: storable.serviceName,
      apiKey: decryptedApiKey,
      fragment: storable.fragment,
      serviceType: storable.serviceType,
      createdAt: new Date(storable.createdAt),
      updatedAt: storable.updatedAt ? new Date(storable.updatedAt) : undefined,
    };
  }
  // volatileKeyStore.get(id) is no longer the source of truth for saved keys.
  return undefined;
};

export const listApiKeys = async (): Promise<ApiKeyEntry[]> => {
  const db = await openDatabase();
  const tx = db.transaction(API_KEY_STORE_NAME, 'readonly');
  const store = tx.objectStore(API_KEY_STORE_NAME);
  const allStorableEntries = await store.getAll() as StorableApiKeyEntry[];
  await tx.done;

  return allStorableEntries.map(storable => {
    const decryptedApiKey = decryptData(storable.encryptedApiKey);
    // Handle potential decryption failure similarly to getApiKey if necessary
    if (!decryptedApiKey && storable.encryptedApiKey) {
        console.warn(`Failed to decrypt API key for ${storable.serviceName} (ID: ${storable.id}) during list operation.`);
        return {
            id: storable.id,
            serviceName: `${storable.serviceName} (Error: Key Corrupted)`,
            apiKey: '', // Indicate missing/corrupt key
            fragment: storable.fragment,
            serviceType: storable.serviceType,
            createdAt: new Date(storable.createdAt),
            updatedAt: storable.updatedAt ? new Date(storable.updatedAt) : undefined,
        };
    }
    return {
      id: storable.id,
      serviceName: storable.serviceName,
      apiKey: decryptedApiKey,
      fragment: storable.fragment,
      serviceType: storable.serviceType,
      createdAt: new Date(storable.createdAt),
      updatedAt: storable.updatedAt ? new Date(storable.updatedAt) : undefined,
    };
  });
};

export const deleteApiKey = async (id: string): Promise<boolean> => {
  const db = await openDatabase();
  const tx = db.transaction(API_KEY_STORE_NAME, 'readwrite');
  const store = tx.objectStore(API_KEY_STORE_NAME);

  const existingKey = await store.getKey(id);
  if (!existingKey) {
    // No need to explicitly abort, just don't perform operations
    await tx.done;
    return false;
  }

  await store.delete(id);
  await tx.done; // Ensure transaction completes

  volatileKeyStore.delete(id); // Also remove from volatile store if it was ever there
  return true;
};

// Rehydrate key is tricky now. The "source of truth" is encrypted in IDB.
// This function was originally for re-populating volatileKeyStore.
// If a key is "missing" (i.e., getApiKey returns it with apiKey: ''), it means it needs re-entry.
// After re-entry, it should be saved again via saveApiKey, which will encrypt it.
// So, rehydrateKey in its old form is somewhat obsolete.
// For now, let's adapt it or acknowledge its changing role.
// A more fitting name might be 'updateKeyAfterReEntry' or it's simply handled by calling saveApiKey again.
// Let's simplify: if the UI needs to temporarily hold a re-entered key before formal save,
// it can do so in its own state. The service itself doesn't need rehydrateKey as much.
// For this task, we'll remove its direct usage for re-populating volatileKeyStore with a full key
// that's meant to be the source of truth.
export const rehydrateKey = async (id: string, apiKeyInput: string): Promise<boolean> => {
  console.warn("rehydrateKey is being called. Consider using saveApiKey to update/re-encrypt keys.");
  // This function could potentially be used to quickly check if a provided key matches
  // the stored encrypted key's fragment, but it should not store the raw key long-term
  // in volatile memory without re-saving it encrypted.
  // For now, let's just verify it can be re-saved.
  const entry = await getApiKey(id);
  if (entry) {
    // To truly "rehydrate" and make it active, we should re-save it.
    // This ensures it goes through the encryption process again.
    // This is equivalent to an update operation.
    await saveApiKey(entry.serviceName, apiKeyInput, entry.serviceType);
    return true;
  }
  return false;
}

console.warn(
  "API Key Service initialized. REMINDER: This is for demo purposes. " +
  "Do not use this method for storing sensitive credentials in a production environment."
);
