// Export types individually to avoid duplicate exports
// Export from agent-configs-fixed as the source of truth
export type {
  AgentFramework,
  AgentType,
  WorkflowDetailedType,
  TerminationConditionType,
  StatePersistenceType,
  ArtifactStorageType,
  StateScope,
  ToolConfigField,
  ToolConfigData,
  ArtifactDefinition,
  ArtifactsConfig,
  CommunicationChannel,
  AgentTerminationCondition,
  KnowledgeSource,
  StatePersistenceConfig,
  RagMemoryConfig,
  AgentConfigBase,
  LLMAgentConfig,
  WorkflowStep,
  WorkflowAgentConfig,
  CustomAgentConfig,
  A2AAgentSpecialistConfig,
  AgentConfig,
  EnvironmentVariable,
  ResourceRequirements,
  DeploymentConfig,
  ToolDetail,
  SavedAgentConfiguration
} from './agent-configs-fixed';

// Re-export tool types
export type { AvailableTool } from './tool-types';

// Re-export workflow types if needed
export type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowState,
  WorkflowAction,
  WorkflowCondition,
  WorkflowTransition
} from './workflow-types';

// Common response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Utility types
export type Nullable<T> = T | null | undefined;
export type Maybe<T> = T | undefined;

// Helper types for form handling
export type FormErrors<T> = {
  [K in keyof T]?: string;
};

// Helper type for API request functions
export type ApiRequest<T> = {
  data?: T;
  params?: Record<string, any>;
  headers?: Record<string, string>;
};
