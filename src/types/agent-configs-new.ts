// Tipos atualizados para agentes (nova versão)
export type AgentType = 'llm' | 'scriptable' | 'workflow' | 'reactive' | 'other';

export interface KnowledgeSource {
  id: string;
  name: string;
  type: KnowledgeSourceType;
  url?: string;
  content?: string;
  active?: boolean;
}

export type KnowledgeSourceType = 'url' | 'file' | 'text' | 'other';

export interface AgentConfigBase {
  type: AgentType;
  framework: AgentFramework;
  agentGoal: string;
  agentTasks?: string[];
  tools?: string[];
  knowledgeSources?: KnowledgeSource[];
}

export interface LLMAgentConfig extends AgentConfigBase {
  type: 'llm';
  agentModel: string;
  agentTemperature?: number;
}

export interface ScriptableAgentConfig extends AgentConfigBase {
  type: 'scriptable';
  scriptPath: string;
  scriptLanguage: string;
}

export type AgentConfig = LLMAgentConfig | ScriptableAgentConfig | WorkflowAgentConfig;

export interface WorkflowAgentConfig extends AgentConfigBase {
  type: 'workflow';
  workflowSteps: WorkflowStep[];
  workflowType: WorkflowDetailedType;
  agentModel: string;
  agentTemperature?: number;
  subAgents?: string[];
  terminationConditions?: {
    maxIterations?: number;
    successCondition?: string;
    failureCondition?: string;
  };
  loopStateKey?: string;
  loopExitStateValue?: string;
}

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

export interface RagMemoryConfig {
  knowledgeBaseId: string;
  embeddingModel?: string;
}

export interface LLMModelDetails {
  id: string; // renamed from modelId
  name: string; // new field
  provider: string; // existing
  capabilities?: { // new field
    streaming?: boolean;
    tools?: boolean;
    vision?: boolean;
  };
  estimatedCost?: { // new field
    input?: number;
    output?: number;
    unit?: string;
  };
  maxOutputTokens?: number; // renamed from maxTokens, optional
  temperature?: number; // existing, ensure optional
  customProperties?: Record<string, any>; // new field
}

export interface WorkflowStep {
  name: string;
  description: string;
  agentId: string;
  inputMapping: Record<string, string>;
  outputKey?: string;
}

export type AgentFramework = 'genkit' | 'langchain' | 'crewai' | 'other';

export type WorkflowDetailedType = 'sequential' | 'parallel' | 'conditional';