// Definição de tipos para ferramentas e MCP servers
export interface MCPServerConfig {
  id: string;
  name: string;
  description?: string;
  url?: string;
  apiKey?: string;
  active?: boolean;
  category?: string;
  capabilities?: string[];
  version?: string;
}

export interface ApiKeyEntry {
  id: string;
  name: string;
  key: string;
  service: string;
  createdAt: string;
  lastUsed?: string;
  expiresAt?: string;
  active?: boolean;
}