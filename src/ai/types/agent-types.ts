export interface LLMAgentConfig {
  model: string;
  framework: string;
  type?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface SavedAgentConfiguration {
  id?: string; 
  description: string;
  type: string;
  framework: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Tipo estendido para compatibilidade com testes
export interface AgentTestConfig extends SavedAgentConfiguration {
  agentName: string;
  type: string;
  framework: string;
  config: LLMAgentConfig & {
    agentGoal?: string;
    agentTasks?: string[];
  };
  tools?: any[];
  toolsDetails?: any[];
  toolConfigsApplied?: Record<string, any>;
  isTemplate?: boolean;
  userId: string;
}

export type WorkflowDetailedType = 'sequential' | 'parallel' | 'conditional';
