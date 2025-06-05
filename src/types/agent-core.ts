// src/types/agent-core.ts
import {
  A2AConfig as ActualA2AConfig,
  CommunicationChannel as A2ACommunicationChannel
} from './a2a-types';
import { ChatRunConfig } from './run-config-types'; // Added import

// Re-export types from other foundational files
export * from './tool-core'; // Provides AvailableTool, ToolConfigData, ToolConfigField etc.
export * from './workflow-types'; // Provides WorkflowDetailedType from agent-configs originally

// ======================================// Tipos Básicos
// ======================================
export type AgentFramework = "genkit" | "crewai" | "langchain" | "custom" | "none" | "other"; // Added 'other' from agent-configs-new
export type AgentType = "llm" | "workflow" | "custom" | "a2a" | "task" | "reactive"; // Harmonized 'scriptable' to 'custom'
// WorkflowDetailedType is re-exported from workflow-types.ts which gets it from agent-configs.ts
// export type WorkflowDetailedType = "sequential" | "parallel" | "loop" | "graph" | "stateMachine"; // Already available via re-export
export type TerminationConditionType = "tool_success" | "state_change" | "max_iterations" | "none";
export type StatePersistenceType = "session" | "memory" | "database";
export type ArtifactStorageType = "local" | "cloud" | "memory" | "filesystem";
export type StateScope = 'GLOBAL' | 'AGENT' | 'TEMPORARY';

// ======================================// Interfaces de Configuração
// ======================================
// ToolConfigField is available via re-export from './tool-core'
// ToolConfigData is available via re-export from './tool-core'

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

export interface InitialStateValue { // Added from agent-types.ts
  key: string;
  value: string;
  scope: StateScope; // StateScope is already defined
  description?: string; // description was in agent-types.ts
}

export interface StatePersistenceConfig {
  type: StatePersistenceType;
  config?: Record<string, any>;
  initialValues?: InitialStateValue[]; // Added from agent-types.ts (initialStateValues)
  enableSharing?: boolean; // Added from agent-types.ts (enableStateSharing)
  sharingStrategy?: 'all' | 'explicit' | 'none'; // Added from agent-types.ts (stateSharingStrategy)
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
  // agentPersonality from agent-types.ts AgentConfig (generic) can be added here if applicable to all
  // agentRestrictions from agent-types.ts AgentConfig (generic) can be added here if applicable to all

  terminationConditions?: AgentTerminationCondition[];
  statePersistence?: StatePersistenceConfig;
  knowledgeSources?: KnowledgeSource[];
  ragMemoryConfig?: RagMemoryConfig;
  artifacts?: ArtifactsConfig;
  // enableRAG from agent-types.ts AgentConfig is implicitly handled by the presence of ragMemoryConfig
  // enableArtifacts from agent-types.ts AgentConfig is implicitly handled by the presence of artifacts config

  systemPromptGenerated?: string;
  manualSystemPromptOverride?: string;
  sandboxedCodeExecution?: boolean;
  systemPromptHistory?: Array<{ prompt: string; timestamp: string }>; // timestamp as string, Date in fixed
  evaluationGuardrails?: EvaluationGuardrails; // From agent-configs.ts
  runConfig?: ChatRunConfig; // Added from agent-configs.ts

  // Multi-agent fields from agent-types.ts AgentConfig
  isRootAgent?: boolean; // From agent-types.ts
  globalInstruction?: string; // From agent-types.ts

  // Fields that were in agent-types.ts AgentConfig but better fit into specific configs or SavedAgentConfiguration
  // agentName, agentDescription, agentVersion -> SavedAgentConfiguration
  // agentTools -> SavedAgentConfiguration.tools
  // agentModel, agentTemperature -> LLMAgentConfig
  // detailedWorkflowType, workflowDescription -> WorkflowAgentConfig
  // customLogicDescription -> CustomAgentConfig
  // a2aConfig -> A2AAgentSpecialistConfig
  // cloudStorageBucket, localStoragePath are within ArtifactsConfig
}

// Represents a simpler, task-oriented agent, potentially a subset of LLMAgentConfig features
export interface TaskAgentConfig extends AgentConfigBase {
  type: "task";
  // agentGoal is in AgentConfigBase
  // agentTasks is in AgentConfigBase (as string[])
  agentPersonality?: string; // From agent-types.ts TaskAgentConfig
  agentRestrictions?: string[]; // From agent-types.ts TaskAgentConfig (harmonized to string[])
  agentModel?: string; // From agent-types.ts TaskAgentConfig
  agentTemperature?: number; // From agent-types.ts TaskAgentConfig
}

export interface LLMAgentConfig extends AgentConfigBase {
  type: "llm";
  agentModel: string;
  agentTemperature: number;
  agentPersonality?: string; // Already here, consistent with agent-types.ts LLMAgentConfig
  agentRestrictions?: string[]; // Already here, consistent with agent-types.ts LLMAgentConfig (though original was string)
  // agentTasks for LLMAgentConfig in agent-types.ts was string, AgentConfigBase has string[] - keep string[]
  modelSafetySettings?: ModelSafetySettingItem[];
  maxHistoryTokens?: number;
  maxTokensPerResponse?: number; // From agent-configs.ts (LLMAgentConfig)
  maxOutputTokens?: number; // From unified-agent-types original LLM config
  topP?: number; // From unified-agent-types original LLM config
  topK?: number; // From unified-agent-types original LLM config
  forceToolUsage?: boolean; // From unified-agent-types original LLM config
  stopSequences?: string[]; // Added from agent-configs-fixed.ts LLMAgentConfig
  presencePenalty?: number; // Added from agent-configs-fixed.ts LLMAgentConfig
  frequencyPenalty?: number; // Added from agent-configs-fixed.ts LLMAgentConfig
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
  subAgents?: string[]; // Already here, consistent with agent-types.ts AgentConfig.subAgents
  workflowConfig?: Record<string, any>; // From agent-configs.ts & unified-agent-types
  workflowSteps?: WorkflowStep[]; // From agent-configs.ts & unified-agent-types
  workflowDescription?: string; // From agent-types.ts WorkflowAgentConfig
  agentModel?: string; // Added from agent-configs-new.ts (WorkflowAgentConfig)
  agentTemperature?: number; // Added from agent-configs-new.ts (WorkflowAgentConfig)
  inputSchema?: Record<string, any>; // Added from agent-configs-fixed.ts WorkflowAgentConfig
  outputSchema?: Record<string, any>; // Added from agent-configs-fixed.ts WorkflowAgentConfig

  // Loop specific fields from agent-types.ts (WorkflowAgentConfig) & unified-agent-types
  loopMaxIterations?: number; // Already here
  loopTerminationConditionType?: 'tool' | 'state'; // Already here
  loopExitToolName?: string; // Already here
  loopExitStateKey?: string; // Already here
  loopExitStateValue?: string; // Already here
}

export interface CustomAgentConfig extends AgentConfigBase {
  type: "custom"; // Corresponds to 'scriptable' from agent-configs-new.ts
  scriptPath?: string;
  customConfig?: Record<string, any>; // From agent-configs.ts & unified-agent-types
  // scriptContent from agent-configs-fixed.ts could go here or in customConfig
  scriptContent?: string;
  customLogicDescription?: string; // From agent-types.ts CustomAgentConfig
  scriptLanguage?: string; // Added from agent-configs-new.ts (ScriptableAgentConfig)
}

// For agents that primarily react to events or inputs.
export interface ReactiveAgentConfig extends AgentConfigBase {
  type: "reactive";
  // Specific configuration for reactive agents can be added here.
  // For now, it relies on base fields.
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
  | CustomAgentConfig // Covers 'scriptable'
  | A2AAgentSpecialistConfig
  | TaskAgentConfig
  | ReactiveAgentConfig; // Added ReactiveAgentConfig
//  | (Record<string, any> & { type: string }); // Keep this for flexibility if needed, but prefer specific types

// ======================================// Outros Tipos Relacionados a Agentes
// ======================================
export interface LLMModelDetails { // Added from agent-configs-new.ts
  modelId: string;
  provider: string;
  temperature?: number;
  maxTokens?: number;
}

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

// ======================================// Ferramentas (ToolDetail is now AvailableTool from tool-core)
// ======================================// AvailableTool is re-exported from tool-core.
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
  // toolsDetails uses AvailableTool from tool-core (re-exported)
  toolsDetails?: AvailableTool[]; // From agent-types.ts (SavedAgentConfiguration)
  // toolConfigsApplied uses ToolConfigData from tool-core (re-exported)
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
  // systemPromptGenerated is in AgentConfigBase now
}

// ======================================// Tipos para Formulários
// ======================================
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
