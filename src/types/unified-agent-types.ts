// src/types/unified-agent-types.ts
import {
  A2AConfig as ActualA2AConfig,
  CommunicationChannel as A2ACommunicationChannel
} from './a2a-types';

// Re-export types from other foundational files
export * from './tool-types'; // Provides AvailableTool, ToolConfigData, ToolConfigField etc.
export * from './workflow-types'; // Provides WorkflowDetailedType from agent-configs originally

// ======================================// Tipos Básicos
// ======================================
export type AgentFramework = "genkit" | "crewai" | "langchain" | "custom" | "none";
export type AgentType = "llm" | "workflow" | "custom" | "a2a";
// WorkflowDetailedType is re-exported from workflow-types.ts which gets it from agent-configs.ts
// export type WorkflowDetailedType = "sequential" | "parallel" | "loop" | "graph" | "stateMachine"; // Already available via re-export
export type TerminationConditionType = "tool_success" | "state_change" | "max_iterations" | "none";
export type StatePersistenceType = "session" | "memory" | "database";
export type ArtifactStorageType = "local" | "cloud" | "memory" | "filesystem";
export type StateScope = 'GLOBAL' | 'AGENT' | 'TEMPORARY';

// ======================================// Interfaces de Configuração
// ======================================
// ToolConfigField is available via re-export from './tool-types'
// ToolConfigData is available via re-export from './tool-types'

export interface ArtifactDefinition {
  id: string;
  name: string;
  description?: string;
  mimeType?: string;
  required?: boolean;
  accessPermissions?: 'read' | 'write' | 'read_write';
  versioningEnabled?: boolean;
  storagePath?: string; // From agent-configs.ts
  fileName?: string;    // From agent-configs.ts
}

export interface ArtifactsConfig {
  enabled: boolean;
  storageType: ArtifactStorageType;
  cloudStorageBucket?: string;
  localStoragePath?: string;
  definitions?: ArtifactDefinition[];
}

// Generic CommunicationChannel (distinct from A2ACommunicationChannel)
export interface CommunicationChannel {
  type: string; // e.g., 'webhook', 'message_queue' - generic
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
  | "custom"
  | "knowledge_base" // Added from unified-agent-types original
  | "url" // Added from agent-configs-new.ts (KnowledgeSourceType)
  | "file" // Added from agent-configs-new.ts (KnowledgeSourceType)
  | "text"; // Added from agent-configs-new.ts (KnowledgeSourceType)


export interface KnowledgeSource {
  id: string;
  name: string;
  type: KnowledgeSourceType;
  description?: string;
  location: string; // From agent-configs.ts (was url in some, content in others)
  credentials?: string; // From agent-configs.ts
  format?: string; // From agent-configs.ts
  updateFrequency?: "static" | "daily" | "weekly" | "monthly" | "custom"; // From agent-configs.ts
  enabled: boolean; // From agent-configs.ts
  content?: string; // From agent-configs-fixed.ts & agent-configs-new.ts
  active?: boolean; // From agent-configs-new.ts (similar to enabled)
  config?: Record<string, any>; // From agent-configs-fixed.ts
}

export interface StatePersistenceConfig {
  type: StatePersistenceType;
  config?: Record<string, any>;
}

export interface EvaluationGuardrails { // Added from agent-configs.ts
  prohibitedKeywords?: string[];
  maxResponseLength?: number;
  checkForToxicity?: boolean;
}

export interface RagMemoryConfig {
  enabled: boolean;
  chunkSize?: number; // From unified-agent-types original
  chunkOverlap?: number; // From unified-agent-types original
  embeddingModel?: string;
  similarityThreshold?: number; // From unified-agent-types original
  maxRetrievedDocuments?: number; // From unified-agent-types original
  maxDocuments?: number; // From agent-configs.ts & unified-agent-types original
  maxDocumentSize?: number; // From agent-configs.ts & unified-agent-types original
  vectorStoreType?: string;
}

export interface ModelSafetySettingItem { // From agent-configs.ts & unified-agent-types
  category: string;
  threshold: string;
}

// ======================================// Configurações de Agente
// ======================================
export interface AgentConfigBase {
  type: AgentType;
  framework: AgentFramework;
  agentGoal: string;
  agentTasks: string[]; // Should be string[] as per agent-configs.ts & unified-agent-types
  terminationConditions?: AgentTerminationCondition[];
  statePersistence?: StatePersistenceConfig;
  knowledgeSources?: KnowledgeSource[];
  ragMemoryConfig?: RagMemoryConfig;
  artifacts?: ArtifactsConfig;
  systemPromptGenerated?: string;
  manualSystemPromptOverride?: string;
  sandboxedCodeExecution?: boolean;
  systemPromptHistory?: Array<{ prompt: string; timestamp: string }>; // timestamp as string, Date in fixed
  evaluationGuardrails?: EvaluationGuardrails; // From agent-configs.ts
  // prompt?: string; // Removed, should be part of LLMConfig or handled differently
  // timestamp?: string; // Removed, seems like metadata not config
}

export interface LLMAgentConfig extends AgentConfigBase {
  type: "llm";
  agentModel: string;
  agentTemperature: number;
  agentPersonality?: string;
  agentRestrictions?: string[];
  modelSafetySettings?: ModelSafetySettingItem[];
  maxHistoryTokens?: number;
  maxTokensPerResponse?: number; // From agent-configs.ts (LLMAgentConfig)
  maxOutputTokens?: number; // From unified-agent-types original LLM config
  topP?: number; // From unified-agent-types original LLM config
  topK?: number; // From unified-agent-types original LLM config
  forceToolUsage?: boolean; // From unified-agent-types original LLM config
  // Fields from agent-configs-fixed.ts AgentConfig that fit here
  // systemPrompt?: string; // Covered by manualSystemPromptOverride or systemPromptGenerated
  // maxTokens?: number; // Covered by maxTokensPerResponse or maxOutputTokens
}

export interface WorkflowStep { // From agent-configs.ts & unified-agent-types
  agentId: string;
  inputMapping: Record<string, any>;
  outputKey: string;
  name?: string;
  description?: string;
}

export interface WorkflowAgentConfig extends AgentConfigBase {
  type: "workflow";
  workflowType: WorkflowDetailedType; // WorkflowDetailedType is from workflow-types.ts (originally agent-configs.ts)
  subAgents?: string[];
  workflowConfig?: Record<string, any>; // From agent-configs.ts & unified-agent-types
  workflowSteps?: WorkflowStep[]; // From agent-configs.ts & unified-agent-types
  // Loop specific fields from agent-types.ts (WorkflowAgentConfig) & unified-agent-types
  loopMaxIterations?: number;
  loopTerminationConditionType?: 'tool' | 'state'; // This is a subset of TerminationConditionType
  loopExitToolName?: string;
  loopExitStateKey?: string;
  loopExitStateValue?: string;
}

export interface CustomAgentConfig extends AgentConfigBase {
  type: "custom";
  scriptPath?: string;
  customConfig?: Record<string, any>; // From agent-configs.ts & unified-agent-types
  // scriptContent from agent-configs-fixed.ts could go here or in customConfig
  scriptContent?: string;
}

export interface A2AAgentSpecialistConfig extends AgentConfigBase {
  type: "a2a";
  specialistRole: string; // From agent-configs.ts
  specialistSkills: string[]; // From agent-configs.ts
  targetAudience?: string; // From agent-configs.ts
  responseFormat?: string; // From agent-configs.ts
  specialistExamples?: string[]; // From agent-configs.ts
  a2a?: ActualA2AConfig; // Embed the detailed A2A configuration
}

// Union of all specific agent configurations
export type AgentConfig =
  | LLMAgentConfig
  | WorkflowAgentConfig
  | CustomAgentConfig
  | A2AAgentSpecialistConfig;
//  | (Record<string, any> & { type: string }); // Keep this for flexibility if needed, but prefer specific types

// ======================================// Configuração de Implantação
// ======================================
export interface EnvironmentVariable { // From agent-configs.ts & unified-agent-types
  key: string;
  value: string;
  isSecret?: boolean;
}

export interface ResourceRequirements { // From agent-configs.ts & unified-agent-types
  cpu?: string;
  memory?: string;
  gpu?: string;
}

export interface DeploymentConfig { // From agent-configs.ts & unified-agent-types
  environment: "development" | "staging" | "production";
  envVars?: EnvironmentVariable[];
  resources?: ResourceRequirements;
  scaling?: {
    minInstances?: number;
    maxInstances?: number;
    targetConcurrency?: number;
  };
  // unified-agent-types also had these directly, covered by scaling now.
  // minInstances?: number;
  // maxInstances?: number;
  // targetConcurrency?: number;
}

// ======================================// Ferramentas (ToolDetail is now AvailableTool from tool-types.ts)
// ======================================// AvailableTool is re-exported from tool-types.ts.
// ToolDetail from original unified-agent-types.ts is effectively replaced by AvailableTool.

// ======================================// Configuração de Agente Salva
// ======================================
export interface SavedAgentConfiguration {
  id: string;
  agentName: string;
  agentDescription: string; // Ensure this is present, was optional in some
  agentVersion: string; // Ensure this is present
  config: AgentConfig; // This config will hold the specific agent config (LLM, Workflow, etc.)
  tools: string[]; // Array of tool IDs
  // toolsDetails uses AvailableTool from tool-types.ts (re-exported)
  toolsDetails?: AvailableTool[]; // From agent-types.ts (SavedAgentConfiguration)
  // toolConfigsApplied uses ToolConfigData from tool-types.ts (re-exported)
  toolConfigsApplied: ToolConfigData; // From agent-configs-new.ts (SavedAgentConfiguration) & unified-agent-types

  a2aConfig?: ActualA2AConfig; // From agent-configs.ts & unified-agent-types (matches A2AAgentSpecialistConfig.a2a)
  // communicationChannels specific to A2A
  communicationChannels?: A2ACommunicationChannel[]; // From agent-configs.ts & unified-agent-types

  deploymentConfig?: DeploymentConfig;
  debugModeEnabled?: boolean; // From agent-configs.ts
  createdAt: string; // In fixed it was Date, but string is more common for API/JSON
  updatedAt: string; // In fixed it was Date
  isTemplate: boolean;
  userId: string;

  // Optional fields from various versions
  icon?: string; // From agent-configs-new.ts
  color?: string; // From agent-configs-new.ts
  tags?: string[]; // From agent-configs-new.ts
  category?: string; // From agent-configs-new.ts
  isPublic?: boolean; // From agent-configs-fixed.ts
  isFavorite?: boolean; // From unified-agent-types original
  templateId?: string; // From agent-types.ts (SavedAgentConfiguration)
  tool_trajectory_avg_score?: number; // From agent-types.ts (SavedAgentConfiguration)
}

// ======================================// Tipos para Formulários
// ======================================

// AgentSummary: A lightweight version of SavedAgentConfiguration for list displays
export interface AgentSummary {
  id: string;
  userId: string;
  agentName: string;
  agentDescription?: string;
  agentType: AgentType; // 'llm' | 'workflow' | 'custom' | 'a2a'
  icon?: string;
  framework?: AgentFramework; // 'genkit' | 'crewai' | 'langchain' | 'custom' | 'none'
  isRootAgent?: boolean; // Derived from agent.config.isRootAgent
  templateId?: string;
  toolsSummary?: {
    count: number;
    configuredNeeded: boolean; // True if any tool needs configuration or if toolConfigsApplied is missing/empty for tools that expect it
  };
  updatedAt: Date; // For sorting, ensure it's a Date object
  agentVersion?: string;
  isTemplate?: boolean;
  isFavorite?: boolean;
  tags?: string[];
  category?: string;
  // Consider any other fields absolutely essential for AgentCard that are small.
  // Avoid large objects or long strings like system prompts, goals, full tool schemas etc.
}

// Omit utility fields and userId for form data, id is optional for creation
export type AgentFormData = Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'tool_trajectory_avg_score' | 'isFavorite'> & {
  id?: string; // id is optional when creating a new agent
};

// ======================================// Tipos Utilitários
// ======================================
export type AnyAgent =
  | SavedAgentConfiguration
  | AgentFormData
  | { [key: string]: any };

/**
 * Verifica se um objeto é um SavedAgentConfiguration
 */
export function isSavedAgentConfiguration(agent: any): agent is SavedAgentConfiguration {
  return agent &&
         typeof agent === 'object' &&
         'id' in agent &&
         'agentName' in agent &&
         'config' in agent &&
         'tools' in agent &&
         'createdAt' in agent &&
         'updatedAt' in agent &&
         'userId' in agent;
}

/**
 * Verifica se um objeto é um AgentFormData
 */
export function isAgentFormData(agent: any): agent is AgentFormData {
  return agent &&
         typeof agent === 'object' &&
         'agentName' in agent &&
         'config' in agent &&
         'tools' in agent &&
         !('createdAt' in agent && 'id' in agent && 'userId' in agent); // Heuristic to differentiate
}
