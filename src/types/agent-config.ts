export type AgentType = 'llm' | 'workflow' | 'custom' | 'a2a';

export interface BaseAgentConfig {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  createdAt: string;
  updatedAt: string;
  tools: ToolReference[];
  ragMemory?: RagMemoryConfig;
  a2aConfig?: A2AConfigType;
}

export interface LLMAgentConfig extends BaseAgentConfig {
  type: 'llm';
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
}

export interface WorkflowAgentConfig extends BaseAgentConfig {
  type: 'workflow';
  workflowDescription: string;
  steps: WorkflowStep[];
}

export interface CustomAgentConfig extends BaseAgentConfig {
  type: 'custom';
  customConfig: Record<string, any>;
}

export interface A2AAgentConfig extends BaseAgentConfig {
  type: 'a2a';
  communicationChannels: CommunicationChannel[];
}

export type AgentConfigBase = LLMAgentConfig | WorkflowAgentConfig | CustomAgentConfig | A2AAgentConfig;

export interface ToolReference {
  toolId: string;
  configuration: Record<string, any>;
}

export interface RagMemoryConfig {
  enabled: boolean;
  collectionName: string;
  maxResults: number;
  minRelevanceScore: number;
}

export interface A2AConfigType {
  enabled: boolean;
  communicationChannels: CommunicationChannel[];
}

export interface ArtifactDefinition {
  id: string;
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface ToolConfigData {
  toolId: string;
  configuration: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  agentId: string;
  inputMappings: Record<string, string>;
  outputMappings: Record<string, string>;
}

export interface LoopTerminationCondition {
  type: 'maxIterations' | 'condition' | 'never';
  value?: any;
}

export type BaseAgentType = 'llm' | 'workflow' | 'custom' | 'a2a';
