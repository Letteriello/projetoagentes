// src/types/agent-configs.ts
import { ReactNode } from 'react';
import { ToolConfigField as ToolConfigFieldBase } from './tool-types';
import { ChatRunConfig } from './run-config-types';

// Tipos básicos
export type AgentFramework = "genkit" | "crewai" | "langchain" | "custom" | "none";
export type AgentType = "llm" | "workflow" | "custom" | "a2a";
export type WorkflowDetailedType = "sequential" | "parallel" | "loop" | "graph" | "stateMachine";
export type TerminationConditionType = "tool_success" | "state_change" | "max_iterations" | "none";
export type StatePersistenceType = "session" | "memory" | "database";
export type ArtifactStorageType = "local" | "cloud" | "memory" | "filesystem";
export type StateScope = 'GLOBAL' | 'AGENT' | 'TEMPORARY';

// Interfaces principais
export interface ToolConfigField extends ToolConfigFieldBase {
  // Herda todos os campos de ToolConfigFieldBase
}

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

export interface CommunicationChannel {
  type: string;
  config: Record<string, any>;
}

export interface AgentTerminationCondition {
  type: TerminationConditionType;
  value?: number | string | boolean;
  description?: string;
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

export interface StatePersistenceConfig {
  type: StatePersistenceType;
  config?: Record<string, any>;
}

export interface RagMemoryConfig {
  enabled: boolean;
  maxDocuments?: number;
  maxDocumentSize?: number;
  embeddingModel?: string;
  vectorStoreType?: string;
}

export interface EvaluationGuardrails {
  prohibitedKeywords?: string[];
  maxResponseLength?: number;
  checkForToxicity?: boolean;
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
  prompt: string; // This seems like a duplicate or misplaced field, often prompts are part of LLMConfig. Review.
  timestamp: string; // This seems like a metadata field, not typically part of base config. Review.
  evaluationGuardrails?: EvaluationGuardrails; // Added for Task 9.4
  runConfig?: ChatRunConfig;
}

export interface ModelSafetySettingItem {
  category: string;
  threshold: string;
}

export interface LLMAgentConfig extends Omit<AgentConfigBase, 'type' | 'prompt' | 'timestamp'> { // Removed prompt and timestamp if they are truly base, otherwise they should be here
  type: "llm";
  agentModel: string;
  agentTemperature: number;
  agentPersonality?: string;
  agentRestrictions?: string[];
  modelSafetySettings?: ModelSafetySettingItem[];
  maxHistoryTokens?: number;
  maxTokensPerResponse?: number;
  // Re-add prompt if it's specific to LLM and not base
  // prompt?: string;
}

export interface WorkflowStep {
  agentId: string;
  inputMapping: Record<string, any>;
  outputKey: string;
  name?: string;
  description?: string;
}

export interface WorkflowAgentConfig extends Omit<AgentConfigBase, 'type' | 'prompt' | 'timestamp'> {
  type: "workflow";
  workflowType: WorkflowDetailedType;
  subAgents?: string[];
  workflowConfig?: Record<string, any>;
  workflowSteps?: WorkflowStep[];
}

export interface CustomAgentConfig extends Omit<AgentConfigBase, 'type' | 'prompt' | 'timestamp'> {
  type: "custom";
  scriptPath?: string;
  customConfig?: Record<string, any>;
}

export interface A2AAgentSpecialistConfig extends Omit<AgentConfigBase, 'type' | 'prompt' | 'timestamp'> {
  type: "a2a";
  specialistRole: string;
  specialistSkills: string[];
  targetAudience?: string;
  responseFormat?: string;
  specialistExamples?: string[];
}

export type AgentConfig = LLMAgentConfig | WorkflowAgentConfig | CustomAgentConfig | A2AAgentSpecialistConfig;

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
}

export interface SavedAgentConfiguration {
  id: string;
  agentName: string;
  agentDescription?: string;
  agentVersion?: string;
  config: AgentConfig;
  tools: string[];
  toolsDetails?: Array<{
    id:string;
    name: string;
    description: string;
    icon?: string;
    genkitToolName?: string;
  }>;
  toolConfigsApplied: Record<string, any>;
  a2aConfig?: Record<string, any>;
  communicationChannels?: CommunicationChannel[];
  deploymentConfig?: DeploymentConfig;
  debugModeEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
  userId: string;
}

// Exportar todos os tipos
export * from './workflow-types';

// Exportar tipos de ferramentas
export * from './tool-types';
