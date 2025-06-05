// Export types individually from their new core locations
export type {
  AgentFramework,
  AgentType,
  WorkflowDetailedType, // This is re-exported by agent-core
  TerminationConditionType,
  StatePersistenceType,
  ArtifactStorageType,
  StateScope,
  // ToolConfigField is in tool-core
  // ToolConfigData is in tool-core
  ArtifactDefinition, // Part of agent-core
  ArtifactsConfig,    // Part of agent-core
  CommunicationChannel, // Generic one in agent-core
  AgentTerminationCondition, // Part of agent-core
  KnowledgeSource,    // Part of agent-core
  StatePersistenceConfig, // Part of agent-core
  RagMemoryConfig,    // Part of agent-core
  AgentConfigBase,    // Part of agent-core
  LLMAgentConfig,     // Part of agent-core
  WorkflowStep,       // Part of agent-core (related to WorkflowAgentConfig)
  WorkflowAgentConfig, // Part of agent-core
  CustomAgentConfig,  // Part of agent-core
  A2AAgentSpecialistConfig, // Part of agent-core
  AgentConfig,        // Union type in agent-core
  EnvironmentVariable, // Part of agent-core (related to DeploymentConfig)
  ResourceRequirements, // Part of agent-core (related to DeploymentConfig)
  DeploymentConfig,   // Part of agent-core
  SavedAgentConfiguration // Part of agent-core
  // ToolDetail from agent-configs-fixed is removed to avoid confusion.
  // Consumers should use AvailableTool from tool-core or specific ToolDetail from chat-core.
} from './agent-core'; // Updated path

// Re-export tool types from tool-core
export type { AvailableTool, ToolConfigField, ToolConfigData, ToolReference } from './tool-core';

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
