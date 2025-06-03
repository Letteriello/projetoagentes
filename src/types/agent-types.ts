// src/types/agent-types.ts
export type {
  AgentFramework,
  AgentType,
  WorkflowDetailedType,
  TerminationConditionType,
  StatePersistenceType,
  ArtifactStorageType,
  StateScope,
  ToolConfigField,
  // AvailableTool, // Removed from here
  ToolConfigData,
  CommunicationChannel,
  A2AConfig,
  ArtifactDefinition,
  ArtifactsConfig,
  InitialStateValue,
  StateValidationRule,
  StatePersistenceConfig,
  KnowledgeSource,
  RagMemoryConfig,
  AgentConfigBase,
  LLMAgentConfig,
  WorkflowAgentConfig,
  CustomAgentConfig,
  A2AAgentSpecialistConfig,
  AgentConfig,
  SavedAgentConfiguration
} from './agent-configs';

// Re-export AvailableTool from its new single source of truth
export type { AvailableTool } from './tool-types';
