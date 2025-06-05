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
  version?: string;
  tools?: Tool[];
  toolConfigsApplied?: Record<string, any>;
  toolsDetails?: Record<string, any>;
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
  type?: string;
  framework?: string;
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

export interface LLMAgentConfig extends AgentConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  agentGoal?: string;
  agentTasks?: string[];
  agentPersonality?: string;
  agentRestrictions?: string[];
  agentModel?: string;
}

export interface WorkflowAgentConfig extends AgentConfig {
  workflowType: string;
  steps: Array<{
    id: string;
    type: string;
    config: Record<string, any>;
  }>;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  workflowDescription?: string;
  detailedWorkflowType?: string;
  loopExitToolName?: string;
}

export type WorkflowDetailedType = 
  | 'conversational'
  | 'data_processing'
  | 'decision_making'
  | 'information_retrieval'
  | 'content_generation'
  | 'task_automation'
  | 'analytical'
  | 'creative'
  | 'educational'
  | 'entertainment'
  | 'customer_support'
  | 'research_assistant'
  | 'code_assistant'
  | 'personal_assistant';