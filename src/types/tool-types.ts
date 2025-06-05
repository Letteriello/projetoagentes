// src/types/tool-types.ts
export interface MCPServerConfig {
  id: string;
  name: string;
  description?: string;
  url: string;
  apiKey?: string;
}

export interface ApiKeyEntry {
  id: string;
  name: string;
  key: string;
  service: string;
  createdAt: string;
  updatedAt?: string;
  serviceName?: string;
  apiKey?: string;
  fragment?: string;
  serviceType?: string;
}

export interface AvailableTool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  needsApiKey?: boolean;
  needsMcpServer?: boolean;
  config?: Record<string, any>;
}

export interface ToolConfigData {
  selectedApiKeyId?: string;
  selectedMcpServerId?: string;
  config?: Record<string, any>;
}