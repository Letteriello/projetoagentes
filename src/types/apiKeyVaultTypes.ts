/**
 * Types for API Key Vault
 */

export interface ApiKeyVaultEntry {
  id: string;
  serviceName: string;
  dateAdded: string; // ISO date string
  associatedAgents?: string[]; // Array of agent IDs
  serviceType: string; // e.g., "Google Search", "OpenAI", "Generic", "Custom API", "Database"
  lastUsed?: string; // ISO date string
}
