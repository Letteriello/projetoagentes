import {
  AgentFramework,
  ArtifactDefinition,
  RagMemoryConfig,
  TerminationConditionType,
  A2AConfig,
  AvailableTool,
  ToolConfigData,
  type ToolConfigData as ImportedToolConfigData, // Alias for re-export
} from './agent-types';

// Base configuration for any agent
export interface AgentConfigBase {
  type: "llm" | "workflow" | "custom" | "a2a";
  framework: AgentFramework;
  isRootAgent?: boolean;
  subAgentIds?: string[];
  globalInstruction?: string;
  statePersistence?: {
    enabled: boolean;
    type: string; // "session", "memory", "database"
    initialState?: Array<{ key: string; value: any }>;
  };
  rag?: {
    enabled: boolean;
    config?: RagMemoryConfig;
  };
  artifacts?: {
    enabled: boolean;
    storageType?: "local" | "cloud" | "memory" | "filesystem";
    cloudStorageBucket?: string;
    localStoragePath?: string;
    definitions?: ArtifactDefinition[];
  };
  a2a?: A2AConfig;
}

// Configuration for LLM-based agents
export interface LLMAgentConfig extends AgentConfigBase {
  type: "llm";
  agentGoal?: string;
  agentTasks?: string[];
  agentPersonality?: string;
  agentRestrictions?: string[];
  agentModel?: string;
  agentTemperature?: number;
  systemPromptGenerated?: string;
}

// Configuration for Workflow-based agents
export interface WorkflowAgentConfig extends AgentConfigBase {
  type: "workflow";
  detailedWorkflowType?: "sequential" | "graph" | "stateMachine";
  workflowDescription?: string;
  loopMaxIterations?: number;
  loopTerminationConditionType?: TerminationConditionType;
  loopExitToolName?: string;
  loopExitStateKey?: string;
  loopExitStateValue?: string;
}

// Configuration for Custom logic agents
export interface CustomAgentConfig extends AgentConfigBase {
  type: "custom";
  customLogicDescription?: string;
}

// Configuration for A2A Specialist Agents
export interface A2AAgentSpecialistConfig extends AgentConfigBase {
  type: "a2a";
}

// Union type for any agent configuration
export type AgentConfig = LLMAgentConfig | WorkflowAgentConfig | CustomAgentConfig | A2AAgentSpecialistConfig;

// Represents the full saved configuration for an agent in storage/DB
export interface SavedAgentConfiguration {
  id: string;
  agentName: string;
  agentDescription: string; // Metadata field
  agentVersion: string;     // Metadata field
  enableArtifacts?: boolean; // Added based on lint error
  templateId?: string;
  isFavorite?: boolean;
  tags?: string[];
  icon?: string;
  config: AgentConfig;
  tools: string[];
  toolConfigsApplied?: Record<string, ToolConfigData>;
  toolsDetails?: Array<{
    id: string;
    name: string;
    label: string;
    description: string;
    iconName: string;
    hasConfig?: boolean;
    genkitToolName?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

// Re-export types that might be imported via this file
export type { ImportedToolConfigData as ToolConfigData };
export type { AgentFramework, ArtifactDefinition, RagMemoryConfig, TerminationConditionType, A2AConfig, AvailableTool };
