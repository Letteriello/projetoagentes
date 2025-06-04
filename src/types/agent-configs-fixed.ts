// src/types/agent-configs-fixed.ts
import type { ReactNode } from 'react';

// Tipos básicos
export type AgentFramework = "genkit" | "crewai" | "langchain" | "custom" | "none";
export type AgentType = "llm" | "workflow" | "custom" | "a2a";
export type WorkflowDetailedType = "sequential" | "parallel" | "loop" | "graph" | "stateMachine";
export type TerminationConditionType = "tool_success" | "state_change" | "max_iterations" | "none";
export type StatePersistenceType = "session" | "memory" | "database";
export type ArtifactStorageType = "local" | "cloud" | "memory" | "filesystem";
export type StateScope = 'GLOBAL' | 'AGENT' | 'TEMPORARY';

// Artifact Interfaces
export interface ArtifactDefinition {
  id: string;
  name: string;
  description?: string;
  mimeType?: string;
  required?: boolean;
  accessPermissions?: 'read' | 'write' | 'read_write';
  versioningEnabled?: boolean;
  storagePath?: string;
  fileName?: string;
}

export interface ArtifactsConfig {
  enabled: boolean;
  storageType: ArtifactStorageType;
  cloudStorageBucket?: string;
  localStoragePath?: string;
  definitions?: ArtifactDefinition[];
}

export interface ToolConfigField {
  id: string;
  label: string;
  type: "text" | "password" | "select" | "number" | "textarea" | "boolean";
  required?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  defaultValue?: string | number | boolean;
  placeholder?: string;
  description?: string;
}

export interface ToolConfigData {
  [toolId: string]: {
    [fieldId: string]: string | number | boolean;
  };
}

export interface CommunicationChannel {
  type: string;
  config: Record<string, any>;
}

export interface AgentTerminationCondition {
  type: TerminationConditionType;
  value?: number | string | boolean;
  description?: string;
}

export interface StatePersistenceConfig {
  type: StatePersistenceType;
  config?: Record<string, any>;
}

export type KnowledgeSourceType =
  | "document"
  | "website"
  | "api"
  | "database"
  | "custom";

export interface KnowledgeSource {
  id: string;
  name: string;
  type: KnowledgeSourceType;
  description?: string;
  location: string;
  credentials?: string;
  format?: string;
  updateFrequency?: "static" | "daily" | "weekly" | "monthly" | "custom";
  enabled: boolean;
}

export interface RagMemoryConfig {
  enabled: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
  embeddingModel?: string;
  similarityThreshold?: number;
  maxRetrievedDocuments?: number;
}

export interface AgentConfigBase {
  type: AgentType;
  framework: AgentFramework;
  agentGoal: string;
  agentTasks: string[];
  terminationConditions?: AgentTerminationCondition[];
  statePersistence?: StatePersistenceConfig;
  knowledgeSources?: KnowledgeSource[];
  ragMemoryConfig?: RagMemoryConfig;
  artifacts?: ArtifactsConfig;
  systemPromptGenerated?: string;
  manualSystemPromptOverride?: string;
  sandboxedCodeExecution?: boolean;
  systemPromptHistory?: Array<{ prompt: string; timestamp: string }>;
  prompt: string;
  timestamp: string;
}

export interface ModelSafetySettingItem {
  category: string;
  threshold: string;
}

export interface LLMAgentConfig extends AgentConfigBase {
  type: "llm";
  agentModel: string;
  agentTemperature: number;
  agentPersonality?: string;
  agentRestrictions?: string[];
  modelSafetySettings?: ModelSafetySettingItem[];
  maxHistoryTokens?: number;
  maxTokensPerResponse?: number;
}

export interface WorkflowStep {
  agentId: string;
  inputMapping: Record<string, any>;
  outputKey: string;
  name?: string;
  description?: string;
}

export interface WorkflowAgentConfig extends AgentConfigBase {
  type: "workflow";
  workflowType: WorkflowDetailedType;
  subAgents?: string[];
  workflowConfig?: Record<string, any>;
  workflowSteps?: WorkflowStep[];
}

export interface CustomAgentConfig extends AgentConfigBase {
  type: "custom";
  scriptPath?: string;
  customConfig?: Record<string, any>;
}

export interface A2AAgentSpecialistConfig extends AgentConfigBase {
  type: "a2a";
  specialistRole: string;
  specialistSkills: string[];
  targetAudience?: string;
  responseFormat?: string;
  specialistExamples?: string[];
}

// Definindo um tipo de união discriminada para AgentConfig
export type AgentConfig = 
  | LLMAgentConfig 
  | WorkflowAgentConfig 
  | CustomAgentConfig 
  | A2AAgentSpecialistConfig
  | (Record<string, any> & { type: string }); // Permite objetos com propriedades adicionais, mas requer um tipo

export interface EnvironmentVariable {
  key: string;
  value: string;
  isSecret?: boolean;
}

export interface ResourceRequirements {
  cpu?: string;
  memory?: string;
  gpu?: string;
}

export interface DeploymentConfig {
  environment: "development" | "staging" | "production";
  envVars?: EnvironmentVariable[];
  resources?: ResourceRequirements;
  scaling?: {
    minInstances?: number;
    maxInstances?: number;
    targetConcurrency?: number;
  };
  minInstances?: number;
  maxInstances?: number;
  targetConcurrency?: number;
}

export interface ToolDetail {
  id: string;
  name: string;
  description: string;
  icon?: string;
  genkitToolName?: string;
}

export interface SavedAgentConfiguration {
  id: string;
  agentName: string;
  agentDescription: string;
  agentVersion: string;
  config: AgentConfig;
  tools: string[];
<<<<<<< HEAD
  toolsDetails?: ToolDetail[];
  toolConfigsApplied: ToolConfigData;
  a2aConfig?: Record<string, any>;
  communicationChannels?: CommunicationChannel[];
  deploymentConfig?: DeploymentConfig;
  debugModeEnabled?: boolean;
=======
  toolConfigsApplied?: Record<string, any>;
  callbacks?: Record<string, string>;
>>>>>>> bda22c13ea204b57a3e15d02ce95339da8b0ab06
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
  userId: string;
  isFavorite?: boolean;
}

// Exportar todos os tipos
export * from './workflow-types';

// Exportar tipos de ferramentas
export * from './tool-types';
