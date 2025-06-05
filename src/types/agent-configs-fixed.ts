// src/types/agent-configs-fixed.ts
export interface SavedAgentConfiguration {
  id: string;
  agentName: string;
  description?: string;
  createdAt: Date; // Changed from string to Date
  updatedAt: Date; // Changed from string to Date
  userId: string;
  config: AgentConfig;
  isTemplate?: boolean;
  isPublic?: boolean;
}

export interface AgentConfig {
  systemPrompt?: string;
  systemPromptGenerated?: string;
  systemPromptHistory?: SystemPromptHistoryEntry[];
  tools?: Tool[];
  model?: string;
  temperature?: number;
  knowledgeSources?: KnowledgeSource[];
  scriptPath?: string;
  scriptContent?: string;
  maxTokens?: number;
}

export interface SystemPromptHistoryEntry {
  prompt: string;
  timestamp: Date; // Changed from string to Date
}

export interface Tool {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  config?: Record<string, any>;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: string;
  url?: string;
  content?: string;
  config?: Record<string, any>;
}