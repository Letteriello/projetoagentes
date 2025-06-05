// src/services/api-key-service.ts
import {
  ApiKeyMetadata,
  RegisterApiKeyPayload,
  UpdateApiKeyMetadataPayload,
} from '@/types/apiKeyVaultTypes';

const API_BASE_URL = '/api/apikeys'; // Base URL for the API key metadata endpoints

/**
 * Registers a new API key with the backend for secure storage.
 * The actual API key is sent to the backend and should not be stored client-side.
 * @param payload - The data required to register the new API key.
 * @returns A promise that resolves to the metadata of the created API key.
 */
export const saveApiKey = async (payload: RegisterApiKeyPayload): Promise<ApiKeyMetadata> => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to save API key and parse error response' }));
    throw new Error(errorData.error || `Failed to save API key: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Retrieves the metadata for a specific API key from the backend.
 * Does NOT retrieve the actual API key.
 * @param id - The unique identifier of the API key metadata.
 * @returns A promise that resolves to the API key metadata, or undefined if not found.
 */
export const getApiKeyMeta = async (id: string): Promise<ApiKeyMetadata | undefined> => {
  const response = await fetch(`${API_BASE_URL}/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      return undefined;
    }
    const errorData = await response.json().catch(() => ({ error: 'Failed to get API key metadata and parse error response' }));
    throw new Error(errorData.error || `Failed to get API key metadata: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Lists all API key metadata entries from the backend.
 * Does NOT retrieve any actual API keys.
 * @returns A promise that resolves to an array of API key metadata.
 */
export const listApiKeyMetas = async (): Promise<ApiKeyMetadata[]> => {
  const response = await fetch(API_BASE_URL);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to list API key metadata and parse error response' }));
    throw new Error(errorData.error || `Failed to list API key metadata: ${response.statusText}`);
  }
  return response.json();
};

/**
 * Deletes API key metadata (and instructs backend to delete the actual key) via the backend.
 * @param id - The unique identifier of the API key metadata to delete.
 * @returns A promise that resolves when the deletion is successful.
 */
export const deleteApiKey = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete API key and parse error response' }));
    throw new Error(errorData.error || `Failed to delete API key: ${response.statusText}`);
  }
  // No content expected on successful delete typically (204 No Content)
};

/**
 * Updates existing API key metadata in the backend.
 * @param id - The unique identifier of the API key metadata to update.
 * @param payload - The data to update.
 * @returns A promise that resolves to the updated API key metadata.
 */
export const updateApiKeyMeta = async (id: string, payload: UpdateApiKeyMetadataPayload): Promise<ApiKeyMetadata> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to update API key metadata and parse error response' }));
    throw new Error(errorData.error || `Failed to update API key metadata: ${response.statusText}`);
  }
  return response.json();
};

console.log(
  "API Key Service initialized. This service now acts as a client-side interface " +
  "to a secure backend API for managing API key metadata. Actual API keys should be " +
  "handled exclusively by the backend."
);
