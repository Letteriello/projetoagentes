// src/hooks/use-api-key-vault.ts
import { useState, useEffect, useCallback } from 'react';
import {
  ApiKeyEntry,
  saveApiKey as saveApiKeyService,
  getApiKey as getApiKeyService,
  listApiKeys as listApiKeysService,
  deleteApiKey as deleteApiKeyService,
  rehydrateKey as rehydrateKeyService,
} from '../services/api-key-service';

export interface UseApiKeyVaultReturn {
  apiKeys: ApiKeyEntry[];
  isLoading: boolean;
  error: Error | null;
  addApiKey: (serviceName: string, apiKey: string, serviceType: string) => Promise<void>; // Add serviceType
  removeApiKey: (id: string) => Promise<void>;
  fetchApiKey: (id: string) => Promise<ApiKeyEntry | undefined>;
  refreshKeys: () => void;
  getKeyById: (id: string) => ApiKeyEntry | undefined;
  // For temporarily showing the full key
  visibleApiKey: string | null;
  toggleKeyVisibility: (id: string) => Promise<void>; // Fetches full key if not in memory
  clearVisibleKey: () => void;
  reArmKey: (id: string, fullKey: string) => Promise<boolean>;
}

const useApiKeyVault = (): UseApiKeyVaultReturn => {
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [visibleApiKey, setVisibleApiKey] = useState<string | null>(null);
  const [visibleKeyId, setVisibleKeyId] = useState<string | null>(null);

  const refreshKeys = useCallback(() => {
    setIsLoading(true);
    try {
      const keys = listApiKeysService();
      setApiKeys(keys);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to list API keys'));
      setApiKeys([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshKeys();
  }, [refreshKeys]);

  const addApiKey = async (serviceName: string, apiKey: string, serviceType: string) => { // Add serviceType parameter
    setIsLoading(true);
    try {
      saveApiKeyService(serviceName, apiKey, serviceType); // Pass serviceType here
      refreshKeys(); // Re-fetch all keys to update the list
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to save API key'));
      // Optional: re-throw or handle more specifically
    } finally {
      setIsLoading(false);
    }
  };

  const removeApiKey = async (id: string) => {
    setIsLoading(true);
    try {
      const success = deleteApiKeyService(id);
      if (success) {
        refreshKeys(); // Re-fetch to update list
        if (visibleKeyId === id) { // Clear visible key if it was the one deleted
          setVisibleApiKey(null);
          setVisibleKeyId(null);
        }
      } else {
        throw new Error('Failed to delete API key or key not found.');
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to delete API key'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApiKey = async (id: string): Promise<ApiKeyEntry | undefined> => {
    setIsLoading(true);
    try {
      const key = getApiKeyService(id);
      setError(null);
      return key;
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch API key'));
      return undefined;
    } finally {
      setIsLoading(false);
    }
  };

  const getKeyById = (id: string): ApiKeyEntry | undefined => {
    return apiKeys.find(key => key.id === id);
  };

  const toggleKeyVisibility = async (id: string) => {
    if (visibleKeyId === id) {
      // If the same key is clicked again, hide it
      setVisibleApiKey(null);
      setVisibleKeyId(null);
    } else {
      // Clear previous visible key
      setVisibleApiKey(null);
      setVisibleKeyId(null);

      const keyEntry = apiKeys.find(k => k.id === id);
      if (keyEntry) {
        if (keyEntry.apiKey) { // Full key might already be in memory from listApiKeys
          setVisibleApiKey(keyEntry.apiKey);
          setVisibleKeyId(id);
        } else {
          // Attempt to get the full key from the service (might require re-entry if not in volatile store)
          const fullKeyEntry = await fetchApiKey(id);
          if (fullKeyEntry?.apiKey) {
            setVisibleApiKey(fullKeyEntry.apiKey);
            setVisibleKeyId(id);
          } else {
            // Key is not in volatile memory. UI should ideally prompt for re-entry.
            // For now, we'll just indicate it's not available.
            setVisibleApiKey('Full key not in memory. Please re-arm.');
            setVisibleKeyId(id);
             // Optionally, you could automatically "re-arm" if the user provides it
            // Or the UI could have a specific "re-arm" button next to such keys.
          }
        }
      }
    }
  };

  const clearVisibleKey = () => {
    setVisibleApiKey(null);
    setVisibleKeyId(null);
  };

  const reArmKey = async (id: string, fullKey: string): Promise<boolean> => {
    try {
      const success = rehydrateKeyService(id, fullKey);
      if (success) {
        refreshKeys(); // Refresh to get the updated key status
        // If this key was the one pending visibility, show it now
        if (visibleKeyId === id) {
          setVisibleApiKey(fullKey);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error("Error re-arming key:", e);
      setError(e instanceof Error ? e : new Error('Failed to re-arm key'));
      return false;
    }
  };


  return {
    apiKeys,
    isLoading,
    error,
    addApiKey,
    removeApiKey,
    fetchApiKey,
    refreshKeys,
    getKeyById,
    visibleApiKey,
    toggleKeyVisibility,
    clearVisibleKey,
    reArmKey,
  };
};

export default useApiKeyVault;
```
