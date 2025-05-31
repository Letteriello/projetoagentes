import { AvailableTool, ArtifactDefinition, RagMemoryConfig, TerminationConditionType, A2AConfigType } from './agent-types'; // Assuming agent-types.ts exists in src/types

// Base configuration for any agent
export interface AgentConfigBase {
  type: "llm" | "workflow" | "custom" | "a2a"; // Type of agent
  framework: string; // e.g., "genkit", "crewai"
  isRootAgent?: boolean;
  subAgentIds?: string[];
  globalInstruction?: string; // System prompt or high-level instruction
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
    storageType?: "local" | "cloud" | "memory"; // Added memory from dialog
    cloudStorageBucket?: string;
    localStoragePath?: string;
    definitions?: ArtifactDefinition[]; // From dialog state
  };
  a2a?: A2AConfigType;
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
  systemPromptGenerated?: string; // Auto-generated or user-customized system prompt
}

// Configuration for Workflow-based agents
export interface WorkflowAgentConfig extends AgentConfigBase {
  type: "workflow";
  detailedWorkflowType?: "sequential" | "graph" | "stateMachine";
  workflowDescription?: string;
  loopMaxIterations?: number;
  // Specific workflow definition (e.g., steps, graph structure) would go here
  loopTerminationConditionType?: TerminationConditionType;
  loopExitToolName?: string;
  loopExitStateKey?: string;
  loopExitStateValue?: string;
}

// Configuration for Custom logic agents
export interface CustomAgentConfig extends AgentConfigBase {
  type: "custom";
  customLogicDescription?: string;
  // Potentially paths to scripts, or inline script definitions (use with caution)
}

// Configuration for A2A specialist agents
export interface A2AAgentSpecialistConfig extends AgentConfigBase {
  type: "a2a";
  // A2A specific configurations are already in AgentConfigBase via A2AConfigType
}

// Union type for all possible agent configurations
export type AgentConfig = LLMAgentConfig | WorkflowAgentConfig | CustomAgentConfig | A2AAgentSpecialistConfig;

// Data structure for tool-specific configurations applied to an agent
export interface ToolConfigData {
  googleApiKey?: string;
  googleCseId?: string;
  openapiSpecUrl?: string;
  openapiApiKey?: string;
  dbType?: string;
  dbHost?: string;
  dbPort?: string | number; // Allow number from modal, save as string if needed
  dbName?: string;
  dbUser?: string;
  dbPassword?: string;
  dbConnectionString?: string;
  dbDescription?: string;
  knowledgeBaseId?: string;
  calendarApiEndpoint?: string;
  [key: string]: any; // For other potential tool configs
}

// Structure for a saved agent configuration (includes UI metadata + core config)
export interface SavedAgentConfiguration {
  id: string; // Unique ID for the agent
  templateId?: string; // ID of the template used, if any
  agentName: string; // User-defined name for the agent
  name?: string; // Duplicate of agentName, ensure consistency or remove
  description?: string;
  agentDescription?: string; // Duplicate of description
  version: string;
  agentVersion?: string; // Duplicate of version
  icon?: string; // Icon name or path
  agentIcon?: string; // Duplicate of icon
  config: AgentConfig; // The core agent configuration
  agentTools: string[]; // List of tool IDs enabled for the agent
  tools?: string[]; // Duplicate of agentTools
  toolConfigsApplied?: Record<string, ToolConfigData>; // Configurations for each enabled tool
  toolsDetails?: Array<{ // Details of the tools for UI or quick reference
    id: string;
    name: string;
    label: string;
    description: string;
    iconName: string; // Name of the icon component
    hasConfig?: boolean;
    genkitToolName?: string;
  }>;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string

  // Fields from Dialog state that might need to be on SavedAgentConfiguration if they persist
  enableArtifacts?: boolean;
  artifactStorageType?: 'memory' | 'filesystem' | 'cloud' | 'local'; // 'local' was in dialog, map to filesystem?
  cloudStorageBucket?: string;
  localStoragePath?: string;
  artifacts?: ArtifactDefinition[]; // From dialog state, maps to config.artifacts.definitions

  ragMemoryConfig?: RagMemoryConfig; // From dialog state, maps to config.rag.config
  a2aConfig?: A2AConfigType; // From dialog state, maps to config.a2a

  // Workflow specific fields that might be top-level or part of config.
  loopTerminationConditionType?: TerminationConditionType;
  // loopExitToolName, loopExitStateKey, loopExitStateValue are in WorkflowAgentConfig

  // Custom logic description if not strictly in config
  // customLogicDescription?: string; // in CustomAgentConfig

  // LLM specific fields if not strictly in config
  // systemPromptGenerated?: string; // in LLMAgentConfig
}

// Ensure no duplicate optional fields in SavedAgentConfiguration vs AgentConfig subtypes
// e.g. if agentName is top level, it doesn't need to be in AgentConfig.
// The current SavedAgentConfiguration has duplicates (name/agentName, etc.)
// These should be cleaned up for a single source of truth.
// For now, including them to match existing structure from dialog.
// TODO: Refactor SavedAgentConfiguration to remove duplicate optional fields (e.g. agentName/name)
// and ensure single source of truth for properties that are also in AgentConfig.
// For example, `config.type` is the source of truth for agent type.
// `tools` should be `agentTools`. `config.framework` for framework.
// `config.isRootAgent`, `config.subAgentIds`, `config.globalInstruction` for multi-agent props.
// `config.statePersistence` for state persistence.
// `config.rag` for RAG.
// `config.artifacts` for artifacts.
// `config.a2a` for A2A.
// The top-level fields on SavedAgentConfiguration like `ragMemoryConfig`, `a2aConfig`, `enableArtifacts`
// are redundant if their data is stored within `config`.
// These should be consolidated into `config` when loading/saving.
// Example: `editingAgent.ragMemoryConfig` should become `editingAgent.config.rag.config`.
// The `useEffect` in the dialog should populate its local state from `editingAgent.config`.
// The `handleSaveAgent` should build `agentDataToSave.config` from the local dialog state.
// This makes `SavedAgentConfiguration.config` the single source of truth for all core agent behaviors and settings.
// Other fields on `SavedAgentConfiguration` (id, agentName, description, version, icon, tools, toolConfigsApplied, toolsDetails, createdAt, updatedAt, templateId)
// are metadata about the saved configuration.

// It seems `AvailableTool` is also used in `page.tsx`. If so, it should also be in a shared types file.
// For now, assuming `agent-types.ts` is the correct location for it.
// `iconComponents` prop type might also be shareable if used elsewhere.

export type AgentFramework =
  | "genkit"
  | "crewai"
  | "langchain"
  | "custom"
  | "none"; // Added from page.tsx for completeness if used by AgentConfig

// Update AgentConfigBase to use AgentFramework type
export interface AgentConfigBase {
  type: "llm" | "workflow" | "custom" | "a2a";
  framework: AgentFramework; // Use the defined type
  // ... other properties from AgentConfigBase
}

// The above re-declaration of AgentConfigBase is problematic.
// Let's define AgentFramework first, then use it in AgentConfigBase.
// Final structure should be:
// 1. AgentFramework
// 2. AgentConfigBase (using AgentFramework)
// 3. LLMAgentConfig, WorkflowAgentConfig, etc. (extending AgentConfigBase)
// 4. AgentConfig (union type)
// 5. ToolConfigData
// 6. SavedAgentConfiguration

// Corrected Order:

export type CorrectedAgentFramework =
  | "genkit"
  | "crewai"
  | "langchain"
  | "custom"
  | "none";

export interface CorrectedAgentConfigBase {
  type: "llm" | "workflow" | "custom" | "a2a";
  framework: CorrectedAgentFramework;
  isRootAgent?: boolean;
  subAgentIds?: string[];
  globalInstruction?: string;
  statePersistence?: {
    enabled: boolean;
    type: string;
    initialState?: Array<{ key: string; value: any }>;
  };
  rag?: {
    enabled: boolean;
    config?: RagMemoryConfig; // from ./agent-types
  };
  artifacts?: {
    enabled: boolean;
    storageType?: "local" | "cloud" | "memory";
    cloudStorageBucket?: string;
    localStoragePath?: string;
    definitions?: ArtifactDefinition[]; // from ./agent-types
  };
  a2a?: A2AConfigType; // from ./agent-types
}

export interface CorrectedLLMAgentConfig extends CorrectedAgentConfigBase {
  type: "llm";
  agentGoal?: string;
  agentTasks?: string[];
  agentPersonality?: string;
  agentRestrictions?: string[];
  agentModel?: string;
  agentTemperature?: number;
  systemPromptGenerated?: string;
}

export interface CorrectedWorkflowAgentConfig extends CorrectedAgentConfigBase {
  type: "workflow";
  detailedWorkflowType?: "sequential" | "graph" | "stateMachine";
  workflowDescription?: string;
  loopMaxIterations?: number;
  loopTerminationConditionType?: TerminationConditionType; // from ./agent-types
  loopExitToolName?: string;
  loopExitStateKey?: string;
  loopExitStateValue?: string;
}

export interface CorrectedCustomAgentConfig extends CorrectedAgentConfigBase {
  type: "custom";
  customLogicDescription?: string;
}

export interface CorrectedA2AAgentSpecialistConfig extends CorrectedAgentConfigBase {
  type: "a2a";
}

export type CorrectedAgentConfig =
  | CorrectedLLMAgentConfig
  | CorrectedWorkflowAgentConfig
  | CorrectedCustomAgentConfig
  | CorrectedA2AAgentSpecialistConfig;

// ToolConfigData remains the same as defined before.
// SavedAgentConfiguration should then use CorrectedAgentConfig for its `config` field.
// And remove the duplicate fields as per the TODO notes.

// For the purpose of this exercise, I will use the "Corrected" versions and simplify SavedAgentConfiguration.

export interface FinalSavedAgentConfiguration {
  id: string;
  templateId?: string;
  agentName: string;
  description?: string;
  version: string;
  icon?: string; // Icon name or path (e.g. "cpu", "custom-icon.svg")
  config: CorrectedAgentConfig; // Single source of truth for core configuration
  tools: string[]; // List of tool IDs (maps to agentTools)
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
// The types `AvailableTool`, `ArtifactDefinition`, `RagMemoryConfig`, `TerminationConditionType`, `A2AConfigType`
// are assumed to be correctly defined in `src/types/agent-types.ts`.
// If `agent-types.ts` does not exist or these types are incorrect, further adjustments would be needed.

// This new file `src/types/agent-configs.ts` will now be the source for these core configurations.
// `agent-builder-dialog.tsx` and `page.tsx` will need to import from here.
// The `ToolConfigData` definition here is based on what was in `page.tsx` (implicitly) and dialog state.
// The `SavedAgentConfiguration` (as `FinalSavedAgentConfiguration`) is simplified to reduce redundancy with `AgentConfig`.
// Actual migration of dialog state to this structure will be handled in subsequent steps.
// The types from `page.tsx` will be removed from there.
// Note: The file uses `CorrectedAgentFramework`, `CorrectedAgentConfigBase`, etc. to avoid re-declaration errors within this block.
// When actually saved, these should be the primary definitions (e.g. `AgentFramework`, `AgentConfigBase`).
// For this tool, I'll use the "Corrected" prefix and then adjust in the next step if needed, or use the first set of definitions if the tool handles re-declarations gracefully.
// Let's use the first set of definitions and assume the tool is okay with it or I'll fix it later.
// Reverting to the non-"Corrected" prefixed names for the actual file content.

// --- Actual content for src/types/agent-configs.ts ---

// import { AvailableTool } from './agent-types'; // Assuming this is where AvailableTool is
import { ArtifactDefinition, RagMemoryConfig, TerminationConditionType, A2AConfigType } from './agent-types';

export type AgentFramework =
  | "genkit"
  | "crewai"
  | "langchain"
  | "custom"
  | "none";

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
    storageType?: "local" | "cloud" | "memory";
    cloudStorageBucket?: string;
    localStoragePath?: string;
    definitions?: ArtifactDefinition[];
  };
  a2a?: A2AConfigType;
}

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

export interface CustomAgentConfig extends AgentConfigBase {
  type: "custom";
  customLogicDescription?: string;
}

export interface A2AAgentSpecialistConfig extends AgentConfigBase {
  type: "a2a";
}

export type AgentConfig = LLMAgentConfig | WorkflowAgentConfig | CustomAgentConfig | A2AAgentSpecialistConfig;

export interface ToolConfigData {
  googleApiKey?: string;
  googleCseId?: string;
  openapiSpecUrl?: string;
  openapiApiKey?: string;
  dbType?: string;
  dbHost?: string;
  dbPort?: string | number;
  dbName?: string;
  dbUser?: string;
  dbPassword?: string;
  dbConnectionString?: string;
  dbDescription?: string;
  knowledgeBaseId?: string;
  calendarApiEndpoint?: string;
  [key: string]: any;
}

// This is the structure that should be saved and loaded.
// It contains the core configuration within `config` and metadata around it.
export interface SavedAgentConfiguration {
  id: string;
  templateId?: string; // ID of the template used, if any
  agentName: string;   // User-defined name
  description?: string;
  version: string;
  icon?: string;        // Icon name or path (e.g. "cpu", "custom-icon.svg")

  config: AgentConfig; // Core configuration for the agent's behavior and capabilities

  tools: string[];     // List of tool IDs enabled for the agent (maps to agentTools in dialog)
  toolConfigsApplied?: Record<string, ToolConfigData>; // Configurations for enabled tools

  // Optional: Denormalized tool details for easier display, if needed.
  // Otherwise, these can be reconstructed from `tools` and `availableTools` list.
  toolsDetails?: Array<{
    id:string;
    name: string;
    label: string;
    description: string;
    iconName: string; // Name of the icon component from iconComponents
    hasConfig?: boolean;
    genkitToolName?: string;
  }>;

  createdAt?: string;   // ISO date string
  updatedAt?: string;   // ISO date string
}

// Note: The previous `SavedAgentConfiguration` in `page.tsx` had many redundant/optional fields
// that were also part of `AgentConfig` (e.g., `agentType`, `framework`, `isRootAgent`, specific config fields like `agentGoal`).
// This new `SavedAgentConfiguration` makes `config: AgentConfig` the single source of truth for these.
// The dialog's `useEffect` and `handleSaveAgent` will need to map to/from this structure.
// For example, when loading an `editingAgent`:
// - `agentName` state comes from `editingAgent.agentName`
// - `selectedAgentType` state comes from `editingAgent.config.type`
// - `agentGoal` state comes from `(editingAgent.config as LLMAgentConfig).agentGoal`
//
// When saving:
// - `agentDataToSave.agentName = agentName` (state)
// - `agentDataToSave.config.type = selectedAgentType` (state)
// - If `selectedAgentType === 'llm'`, then `(agentDataToSave.config as LLMAgentConfig).agentGoal = agentGoal` (state)

// The `AvailableTool` type is still assumed to come from `src/types/agent-types.ts`.
// If it's defined in `page.tsx` or `agent-builder-dialog.tsx`, it should also be moved to a shared types file.
// For this step, we focus on `AgentConfig` and `SavedAgentConfiguration`.
