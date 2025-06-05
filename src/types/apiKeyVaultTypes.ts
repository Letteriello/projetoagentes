/**
 * Types for API Key Vault Metadata
 */

export interface ApiKeyMetadata {
  id: string; // Unique identifier for the API key metadata
  serviceName: string; // User-friendly name for the service, e.g., "Google Search API", "OpenAI GPT-4"
  serviceType: string; // A category or type for the service, e.g., "google-search", "openai-gpt", "custom-llm", "database"
  displayFragment: string; // A non-sensitive part of the key for display (e.g., "Starts with XXXX, ends with YYYY" or a user-defined alias like "My Personal OpenAI Key")
  associatedAgents?: string[]; // Optional: Array of agent IDs that are permitted to use this key
  createdAt: string; // ISO date string: When the key metadata was created
  updatedAt: string; // ISO date string: When the key metadata was last updated
  // Add any other relevant non-sensitive metadata fields.
  // IMPORTANT: The actual API key should NEVER be part of this interface after its initial secure submission.
}

/**
 * Data structure for registering a new API key with the backend.
 * This is the only time the actual API key is transmitted (over HTTPS).
 */
export interface RegisterApiKeyPayload {
  serviceName: string;
  serviceType: string;
  apiKey: string; // The actual API key. This is sensitive and should be handled with extreme care.
  displayFragment?: string; // Optional: User can suggest a display fragment/alias, or the backend can generate one.
  associatedAgents?: string[]; // Optional: Initial list of associated agents.
}

/**
 * Data structure for updating existing API key metadata.
 * Does not include the API key itself, as we generally shouldn't be re-transmitting it.
 * If a key needs to be changed, it should ideally be deleted and a new one registered.
 */
export interface UpdateApiKeyMetadataPayload {
  serviceName?: string; // Allow updating the user-friendly name
  serviceType?: string; // Allow updating the service type
  displayFragment?: string; // Allow updating the display fragment/alias
  associatedAgents?: string[]; // Allow updating the list of associated agents
}
