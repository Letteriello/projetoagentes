// Tipos atualizados para agentes (nova versão)
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

export interface LLMAgentConfig {
  type: 'llm';
  agentModel: string;
  agentTemperature: number;
  framework: string;
  agentGoal: string;
  agentTasks: string[];
  tools?: string[];
  knowledgeSources?: KnowledgeSource[];
}

export interface ScriptableAgentConfig {
  type: 'scriptable';
  scriptPath: string;
  scriptLanguage: string;
  tools?: string[];
}

export type AgentConfig = LLMAgentConfig | ScriptableAgentConfig;

export interface ToolConfigData {
  selectedApiKeyId?: string;
  selectedMcpServerId?: string;
  config?: Record<string, any>;
}

export interface SavedAgentConfiguration {
  id: string;
  userId?: string;
  agentName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  config: AgentConfig;
  toolConfigsApplied?: Record<string, ToolConfigData>;
  icon?: string;
  color?: string;
  isTemplate?: boolean;
  tags?: string[];
  category?: string;
  version?: string;
}