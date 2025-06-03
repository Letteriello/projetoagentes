// src/services/api-key-service.ts

/**
 * WARNING: This is a simplified API key management system for demonstration purposes.
 * Storing full API keys in browser memory (even temporarily) and fragments in localStorage
 * is not secure for production environments. In a production application, API keys should be
 * stored securely in a backend system with appropriate encryption and access controls.
 */

export interface ApiKeyEntry {
  id: string; // Unique identifier for the key
  serviceName: string; // e.g., "Google Search", "OpenAI GPT-4"
  apiKey: string; // The full API key (kept in memory)
  fragment: string; // A non-sensitive part of the key for display (e.g., first 4 and last 4 chars)
  serviceType: string; // e.g., "googleSearch", "openapi", "database", "Generic"
  createdAt: Date;
}

// In-memory store for full API keys. This is volatile and lost on page refresh.
const volatileKeyStore: Map<string, string> = new Map();

const LOCAL_STORAGE_KEY = 'apiKeyVault';

// Function to generate a fragment for display
const createFragment = (key: string): string => {
  if (key.length <= 8) {
    return '****'; // Too short to create a meaningful fragment
  }
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

// Simulate persistence with localStorage for fragments
const getStoredKeys = (): Omit<ApiKeyEntry, 'apiKey'>[] => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading API keys from localStorage:", error);
    return [];
  }
};

const persistFragments = (keys: Omit<ApiKeyEntry, 'apiKey'>[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(keys));
  } catch (error) {
    console.error("Error saving API key fragments to localStorage:", error);
  }
};

export const saveApiKey = (serviceName: string, apiKey: string, serviceType: string): ApiKeyEntry => {
  if (!serviceName || !apiKey || !serviceType) {
    throw new Error("Service name, API key, and service type are required.");
  }

  const storedKeys = getStoredKeys(); // This returns Omit<ApiKeyEntry, 'apiKey'>[]
  const id = `key_${new Date().getTime()}_${Math.random().toString(36).substring(2, 7)}`;
  const fragment = createFragment(apiKey);
  const createdAt = new Date();

  // Ensure storedKeys are correctly typed if Omit now also omits serviceType implicitly before it's added
  // The new fragment entry that goes into localStorage
  const newKeyEntryFragment: Omit<ApiKeyEntry, 'apiKey'> = {
    id,
    serviceName,
    fragment,
    serviceType, // Add serviceType here
    createdAt,
  };

  // Store the full key in the volatile store
  volatileKeyStore.set(id, apiKey);

  // Store the fragment in localStorage
  persistFragments([...storedKeys, newKeyEntryFragment]);

  return { ...newKeyEntryFragment, apiKey }; // Return the full entry including the live key
};

export const getApiKey = (id: string): ApiKeyEntry | undefined => {
  const storedKeys = getStoredKeys();
  const keyFragmentEntry = storedKeys.find(k => k.id === id);

  if (keyFragmentEntry) {
    const fullApiKey = volatileKeyStore.get(id);
    if (fullApiKey) {
      return { ...keyFragmentEntry, apiKey: fullApiKey };
    } else {
      // Key is in localStorage but not in volatile memory (e.g., after refresh)
      // For this demo, we can't recover it. A real solution would fetch from a secure backend.
      console.warn(`API key for ${keyFragmentEntry.serviceName} (ID: ${id}) is not in memory. Please re-enter it.`);
      // To maintain consistency with the interface, we could return the fragment entry
      // or handle this more gracefully in the UI by prompting re-entry.
      // For now, let's return it without the apiKey to indicate it needs re-arming.
      return { ...keyFragmentEntry, apiKey: '' }; // Or throw an error / return undefined
    }
  }
  return undefined;
};

export const listApiKeys = (): ApiKeyEntry[] => {
  const storedKeyFragments = getStoredKeys();
  // Attempt to hydrate with full keys from volatile store if available
  return storedKeyFragments.map(fragment => {
    const apiKey = volatileKeyStore.get(fragment.id) || ''; // Default to empty if not in volatile store
    return { ...fragment, apiKey };
  });
};

export const deleteApiKey = (id: string): boolean => {
  let storedKeys = getStoredKeys();
  const initialLength = storedKeys.length;
  storedKeys = storedKeys.filter(k => k.id !== id);

  if (storedKeys.length < initialLength) {
    persistFragments(storedKeys);
    volatileKeyStore.delete(id); // Also remove from volatile store
    return true;
  }
  return false;
};

// Helper to re-hydrate volatile store, e.g. if a key is entered again
// This is more of a conceptual placeholder for this demo.
// In a real app, re-entering a key would likely call saveApiKey again.
export const rehydrateKey = (id: string, apiKey: string): boolean => {
    const storedKeys = getStoredKeys();
    const keyFragmentEntry = storedKeys.find(k => k.id === id);
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
