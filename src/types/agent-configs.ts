// src/types/agent-configs.ts
import type { ReactNode } from 'react';

export type AgentFramework = "genkit" | "crewai" | "langchain" | "custom" | "none";
export type AgentType = "llm" | "workflow" | "custom" | "a2a";
export type WorkflowDetailedType = "sequential" | "parallel" | "loop" | "graph" | "stateMachine";
export type TerminationConditionType = "tool_success" | "state_change" | "max_iterations" | "none";
export type StatePersistenceType = "session" | "memory" | "database";
export type ArtifactStorageType = "local" | "cloud" | "memory" | "filesystem";
export type StateScope = 'GLOBAL' | 'AGENT' | 'TEMPORARY';

export interface ToolConfigField {
  id: string;
  label: string;
  type: "text" | "password" | "select" | "number" | "textarea";
  options?: Array<{ label:string; value: string | number }>;
  placeholder?: string;
  description?: string;
  required?: boolean;
  defaultValue?: string | number | boolean;
}

export interface AvailableTool {
  id: string;
  label: string;
  name: string;
  type: "genkit_native" | "openapi" | "mcp" | "custom_script";
  icon?: ReactNode | string;
  description: string;
  hasConfig?: boolean;
  genkitToolName?: string;
  configFields?: ToolConfigField[];
  category?: string;
  requiresAuth: boolean;
  serviceTypeRequired: string;
}

export interface ToolConfigData {
  googleApiKey?: string;
  googleCseId?: string;
  openapiSpecUrl?: string;
  openapiApiKey?: string;
  dbType?: "postgresql" | "mysql" | "sqlserver" | "sqlite" | "other";
  dbHost?: string;
  dbPort?: number;
  dbName?: string;
  dbUser?: string;
  dbPassword?: string;
  dbConnectionString?: string;
  dbDescription?: string;
  knowledgeBaseId?: string;
  calendarApiEndpoint?: string;

  // New Guardrail fields
  allowedPatterns?: string;
  deniedPatterns?: string;
  customRules?: string;

  // For API Key Vault integration
  selectedApiKeyId?: string;

  [key: string]: any; // Keep for flexibility
}

export interface CommunicationChannel {
  id: string;
  name: string;
  direction: 'inbound' | 'outbound';
  targetAgentId?: string; // Optional, as per original, but consider if it should be mandatory for outbound
  messageFormat: 'json' | 'text' | 'binary';
  schema?: string; // Optional, can be a JSON schema string or URL
  syncMode: 'sync' | 'async';
  timeout?: number; // Optional, in milliseconds
  retryPolicy?: {
    maxRetries: number;
    delayMs: number;
    backoffFactor?: number; // Optional
  };
}

export interface A2AConfig {
  enabled: boolean;
  communicationChannels: CommunicationChannel[];
  defaultResponseFormat: "json" | "text";
  maxMessageSize: number;
  loggingEnabled: boolean;
  securityPolicy?: "none" | "jwt" | "api_key";
  apiKeyHeaderName?: string;
}

/**
 * Defines configuration for ADK (Agent Development Kit) callbacks.
 * These callbacks allow for invoking Genkit flows or function references
 * at various stages of an agent's lifecycle.
 */
export interface ADKCallbacksConfig {
  /** Genkit flow name or function reference to call before the agent starts processing. */
  beforeAgent?: string;
  /** Genkit flow name or function reference to call after the agent finishes processing. */
  afterAgent?: string;
  /** Genkit flow name or function reference to call before a model is invoked. */
  beforeModel?: string;
  /** Genkit flow name or function reference to call after a model is invoked. */
  afterModel?: string;
  /** Genkit flow name or function reference to call before a tool is used. */
  beforeTool?: string;
  /** Genkit flow name or function reference to call after a tool is used. */
  afterTool?: string;
}

export interface ArtifactDefinition {
  id: string;
  name: string;
  description: string;
  mimeType: string;
  required: boolean;
  accessPermissions?: "read" | "write" | "read_write";
  versioningEnabled?: boolean;
}

export interface ArtifactsConfig {
  enabled: boolean;
  storageType: ArtifactStorageType;
  cloudStorageBucket?: string;
  localStoragePath?: string;
  definitions: ArtifactDefinition[];
}

export interface InitialStateValue {
  key: string;
  value: string;
  scope?: StateScope;
  description?: string;
}

export interface StateValidationRule {
  id: string;
  name: string;
  type: 'JSON_SCHEMA' | 'REGEX';
  rule: string;
}

export interface StatePersistenceConfig {
  enabled: boolean;
  type: StatePersistenceType;
  defaultScope?: StateScope;
  timeToLiveSeconds?: number;
  initialStateValues?: InitialStateValue[];
  validationRules?: StateValidationRule[];
}

export interface KnowledgeSource {
  id: string;
  type: "file" | "url" | "text_chunk" | "google_drive";
  name: string;
  path?: string;
  content?: string;
  status?: "pending" | "processing" | "ready" | "error";
  metadata?: Record<string, any>;
}

export interface RagMemoryConfig {
  enabled: boolean;
  serviceType: "in-memory" | "vertex_ai_rag" | "custom_vector_db";
  knowledgeSources: KnowledgeSource[];
  persistentMemory?: {
    enabled: boolean;
    storagePath?: string;
  };
  retrievalParameters?: {
    topK?: number;
    similarityThreshold?: number;
  };
  embeddingModel?: string;
  includeConversationContext?: boolean;
}

export interface AgentConfigBase {
  type: AgentType;
  framework: AgentFramework;
  isRootAgent?: boolean;
  subAgentIds?: string[];
  globalInstruction?: string;
  statePersistence?: StatePersistenceConfig;
  rag?: RagMemoryConfig;
  artifacts?: ArtifactsConfig;
  a2a?: A2AConfig;
  genkitFlowName?: string;
  inputSchema?: string;
  outputSchema?: string;
  adkCallbacks?: ADKCallbacksConfig;
}

export interface LLMAgentConfig extends AgentConfigBase {
  type: "llm";
  agentGoal: string;
  agentTasks: string[];
  agentPersonality: string;
  agentRestrictions: string[];
  agentModel: string;
  agentTemperature: number;
  systemPromptGenerated?: string;
}

export interface WorkflowAgentConfig extends AgentConfigBase {
  type: "workflow";
  detailedWorkflowType: WorkflowDetailedType;
  workflowDescription: string;
  loopMaxIterations?: number;
  loopTerminationConditionType?: TerminationConditionType;
  loopExitToolName?: string;
  loopExitStateKey?: string;
  loopExitStateValue?: string;
  parallelSubagentIds?: string[];
  sequentialSteps?: { toolId: string; outputKey?: string }[];
}

export interface CustomAgentConfig extends AgentConfigBase {
  type: "custom";
  customLogicDescription: string;
  genkitFlowName?: string;
}

export interface A2AAgentSpecialistConfig extends AgentConfigBase {
  type: "a2a";
}

export type AgentConfig =
  | LLMAgentConfig
  | WorkflowAgentConfig
  | CustomAgentConfig
  | A2AAgentSpecialistConfig;

export interface SavedAgentConfiguration {
  id: string;
  agentName: string;
  agentDescription: string;
  agentVersion: string;
  icon?: string;
  templateId?: string;
  isFavorite?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  userId?: string;
  config: AgentConfig;
  tools: string[];
  toolConfigsApplied?: Record<string, ToolConfigData>;
  toolsDetails?: Array<{
    id: string;
    name: string;
    label: string;
    description: string;
    iconName?: string;
    hasConfig?: boolean;
    genkitToolName?: string;
  }>;
  internalVersion: number;
  isLatest: boolean;
  originalAgentId: string;
}
