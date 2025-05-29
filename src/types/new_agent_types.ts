// In src/types/new_agent_types.ts

export type StateScope = 'GLOBAL' | 'AGENT' | 'TEMPORARY';

export interface StateValidationRule {
  id: string; // For list management
  name: string; // e.g., "UserInputSchema"
  type: 'JSON_SCHEMA' | 'REGEX'; // Example validation types
  rule: string; // The JSON schema string or regex string
}

export interface InitialStateValue {
  key: string;
  value: string; // Assuming string for UI, parse as needed
  scope?: StateScope; // Allow overriding default scope for initial values
  description?: string; // Added for completeness based on existing UI
}

export interface StateMemoryConfig {
  enableStatePersistence?: boolean;
  statePersistenceType?: 'session' | 'memory' | 'database'; // from existing
  defaultScope?: StateScope;
  timeToLiveSeconds?: number; // TTL for TEMPORARY scope in seconds
  initialStateValues?: InitialStateValue[];
  validationRules?: StateValidationRule[];
  enableStateSharing?: boolean; // from existing
  stateSharingStrategy?: 'all' | 'explicit' | 'none'; // from existing
}

// Forward declaration for AgentConfig to avoid circular dependencies if other types are added later
export interface BaseAgentConfig {
  id: string; // Assuming agent has an ID
  agentName?: string;
  // ... other common base fields
}

export interface LLMAgentConfig extends BaseAgentConfig {
  // ... specific LLM fields
}

export interface WorkflowAgentConfig extends BaseAgentConfig {
  // ... specific Workflow fields
}

export interface CustomAgentConfig extends BaseAgentConfig {
  // ... specific Custom fields
}

// Define a more complete AgentConfig that uses StateMemoryConfig
// This might need to be merged with existing AgentConfig definitions from page.tsx later
export interface AgentConfig {
  id: string;
  templateId?: string; // from existing page.tsx
  agentName: string;
  agentDescription?: string;
  agentVersion?: string;
  agentTools?: string[];
  isRootAgent?: boolean;
  subAgents?: string[];
  globalInstruction?: string;
  agentType: "llm" | "workflow" | "custom" | "a2a"; // from existing page.tsx

  // LLM specific - assuming they might be part of a general config or a specific type
  agentGoal?: string;
  agentTasks?: string;
  agentPersonality?: string;
  agentRestrictions?: string;
  agentModel?: string;
  agentTemperature?: number;

  // Workflow specific
  workflowDescription?: string;
  detailedWorkflowType?: "sequential" | "parallel" | "loop";
  loopMaxIterations?: number;
  loopTerminationConditionType?: "none" | "subagent_signal";
  loopExitToolName?: string;
  loopExitStateKey?: string;
  loopExitStateValue?: string;
  
  // Custom/A2A specific
  customLogicDescription?: string;
  
  // State and Memory (NEW STRUCTURE)
  stateMemory?: StateMemoryConfig;

  // Placeholder for other configs to be added later
  ragMemory?: any; // To be detailed in RAG step
  artifactManagement?: any; // To be detailed in Artifacts step
  a2aConfig?: any; // from existing page.tsx
  
  // System generated / UI related
  systemPromptGenerated?: string; // from existing page.tsx
  toolsDetails?: any[]; // from existing page.tsx (type this properly later)
  toolConfigsApplied?: Record<string, any>; // from existing page.tsx (type this properly later)
  agentFramework?: string; // from agent-builder-dialog.tsx
}

// Include other related types if necessary for compilation, like AvailableTool, etc.
// For now, focus on the State settings.
