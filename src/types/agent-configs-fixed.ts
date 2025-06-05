// Tipos básicos para agentes
export type AgentType = 'llm' | 'scriptable' | 'reactive' | 'other';

export interface KnowledgeSource {
  id: string;
  name: string;
  type: KnowledgeSourceType;
  url?: string;
  content?: string;
  active?: boolean;
}

export type KnowledgeSourceType = 'url' | 'file' | 'text' | 'other';

export interface ToolConfigData {
  [toolId: string]: {
    selectedApiKeyId?: string;
    selectedMcpServerId?: string;
    config?: Record<string, any>;
  };
}

export interface AvailableTool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  needsApiKey?: boolean;
  needsMcpServer?: boolean;
  isActive?: boolean;
  config?: Record<string, any>;
}

export interface AgentConfig {
  type: AgentType;
  model?: string;
  temperature?: number;
  goal?: string;
  tasks?: string[];
  tools?: string[];
  knowledgeSources?: KnowledgeSource[];
  [key: string]: any; // Para campos adicionais específicos do tipo de agente
}

export interface SavedAgentConfiguration {
  id: string;
  userId?: string;
  agentName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  config: AgentConfig;
  toolConfigsApplied?: ToolConfigData;
  icon?: string;
  color?: string;
  isTemplate?: boolean;
  tags?: string[];
  category?: string;
  version?: string;
}