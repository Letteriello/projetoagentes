// In src/lib/new_google_adk_utils.ts
import type {
  AgentConfig,
  StateMemoryConfig,
  InitialStateValue,
  StateValidationRule,
  StateScope,
} from "@/types/new_agent_types"; // Adjust path as necessary

// Assuming other necessary types like ToolConfigData, LLMAgentConfig etc.
// would also be in new_agent_types.ts or imported from their original location.
// For this exercise, we'll focus on the state_settings mapping.

// Placeholder for the full ADK configuration structure.
// This should be more comprehensively defined based on actual ADK specs.
export interface GoogleADKToolParameter {
  name: string;
  type: string; // e.g., 'string', 'number', 'object'
  description?: string;
  required?: boolean;
}

export interface GoogleADKTool {
  name: string;
  description?: string;
  parameters?: GoogleADKToolParameter[];
  // Potentially other fields like 'schema_version', 'authentication', etc.
}
export interface GoogleADKStateSettings {
  persistence_level?: 'SESSION' | 'MEMORY' | 'DATABASE'; // Mapped from statePersistenceType
  default_scope?: StateScope; // e.g., 'AGENT', 'GLOBAL', 'TEMPORARY'
  time_to_live_seconds?: number;
  initial_values?: Array<{
    key: string;
    value: any; // Parsed value
    scope?: StateScope;
    description?: string;
  }>;
  validation_rules?: Array<{
    name: string;
    type: 'JSON_SCHEMA' | 'REGEX';
    rule_definition: any; // Parsed JSON schema or regex string
  }>;
  sharing_strategy?: 'ALL' | 'EXPLICIT' | 'NONE'; // Mapped from stateSharingStrategy
}

export interface GoogleADKAgentConfig {
  name: string;
  description?: string;
  version?: string;
  instructions?: string; // Generated system prompt
  temperature?: number;
  model_name?: string;
  tools?: GoogleADKTool[];
  // TODO: Add other ADK components like memory_service, artifact_settings when defined
  state_settings?: GoogleADKStateSettings;
  // For multi-agent setups
  is_root_agent?: boolean;
  sub_agents?: string[]; // list of sub-agent names or IDs
  global_instruction?: string;
  // Workflow specific (conceptual, ADK might have different structure)
  workflow_type?: 'SEQUENTIAL' | 'PARALLEL' | 'LOOP';
  workflow_description?: string;
  loop_config?: {
      max_iterations?: number;
      condition_type?: 'NONE' | 'SUBAGENT_SIGNAL' | 'TOOL_RESULT' | 'STATE_CHANGE';
      exit_tool_name?: string;
      exit_state_key?: string;
      exit_state_value?: string;
  };
}

// Helper function to parse state values (simple JSON.parse for now)
function parseStateValue(value: string): any {
  try {
    return JSON.parse(value);
  } catch (e) {
    // If JSON.parse fails, return as string
    return value;
  }
}

// Helper function to map UI state persistence type to ADK persistence_level
function mapStatePersistenceType(
  uiType?: 'session' | 'memory' | 'database'
): GoogleADKStateSettings['persistence_level'] | undefined {
  switch (uiType) {
    case 'session': return 'SESSION';
    case 'memory': return 'MEMORY';
    case 'database': return 'DATABASE';
    default: return undefined;
  }
}

// Helper function to map UI state sharing strategy to ADK sharing_strategy
function mapStateSharingStrategy(
  uiStrategy?: 'all' | 'explicit' | 'none'
): GoogleADKStateSettings['sharing_strategy'] | undefined {
  switch (uiStrategy) {
    case 'all': return 'ALL';
    case 'explicit': return 'EXPLICIT';
    case 'none': return 'NONE';
    default: return undefined;
  }
}


export function convertToGoogleADKConfig(agentConfig: AgentConfig): GoogleADKAgentConfig {
  const adkConfig: GoogleADKAgentConfig = {
    name: agentConfig.agentName,
    description: agentConfig.agentDescription,
    version: agentConfig.agentVersion,
    instructions: agentConfig.systemPromptGenerated, // Assuming this is the main instruction set
    temperature: agentConfig.agentTemperature,
    model_name: agentConfig.agentModel,
    is_root_agent: agentConfig.isRootAgent,
    sub_agents: agentConfig.subAgents,
    global_instruction: agentConfig.globalInstruction,
  };

  // Map tools - assuming toolsDetails contains the necessary info
  if (agentConfig.toolsDetails && agentConfig.toolsDetails.length > 0) {
    adkConfig.tools = agentConfig.toolsDetails.map(toolDetail => {
      // This mapping would be more complex based on actual AvailableTool and ADKTool structure
      const adkTool: GoogleADKTool = {
        name: toolDetail.genkitToolName || toolDetail.id, // Use genkitToolName if available
        description: (toolDetail.label as string) || toolDetail.id, // Fallback to ID if label isn't string
        // parameters would need to be mapped from toolDetail.configFields or a more structured source
      };
      return adkTool;
    });
  }
  
  // Workflow specific mapping
  if (agentConfig.agentType === 'workflow') {
    adkConfig.workflow_type = agentConfig.detailedWorkflowType?.toUpperCase() as GoogleADKAgentConfig['workflow_type'];
    adkConfig.workflow_description = agentConfig.workflowDescription;
    if (agentConfig.detailedWorkflowType === 'loop') {
        adkConfig.loop_config = {
            max_iterations: agentConfig.loopMaxIterations,
            condition_type: agentConfig.loopTerminationConditionType?.toUpperCase() as GoogleADKAgentConfig['loop_config']['condition_type'],
            exit_tool_name: agentConfig.loopExitToolName,
            exit_state_key: agentConfig.loopExitStateKey,
            exit_state_value: agentConfig.loopExitStateValue,
        };
    }
  }


  // Map State Settings
  if (agentConfig.stateMemory?.enableStatePersistence) {
    adkConfig.state_settings = {};

    adkConfig.state_settings.persistence_level = mapStatePersistenceType(agentConfig.stateMemory.statePersistenceType);
    
    if (agentConfig.stateMemory.defaultScope) {
      adkConfig.state_settings.default_scope = agentConfig.stateMemory.defaultScope;
    }

    if (agentConfig.stateMemory.defaultScope === 'TEMPORARY' && agentConfig.stateMemory.timeToLiveSeconds !== undefined) {
      adkConfig.state_settings.time_to_live_seconds = agentConfig.stateMemory.timeToLiveSeconds;
    }

    if (agentConfig.stateMemory.initialStateValues && agentConfig.stateMemory.initialStateValues.length > 0) {
      adkConfig.state_settings.initial_values = agentConfig.stateMemory.initialStateValues.map(val => ({
        key: val.key,
        value: parseStateValue(val.value), // Parse the string value
        scope: val.scope || agentConfig.stateMemory?.defaultScope, // Use default if not overridden
        description: val.description,
      }));
    }

    if (agentConfig.stateMemory.validationRules && agentConfig.stateMemory.validationRules.length > 0) {
      adkConfig.state_settings.validation_rules = agentConfig.stateMemory.validationRules.map(rule => {
        let parsedRuleDefinition: any = rule.rule;
        if (rule.type === 'JSON_SCHEMA') {
          try {
            parsedRuleDefinition = JSON.parse(rule.rule);
          } catch (e) {
            console.warn(`Failed to parse JSON schema for rule "${rule.name}". Storing as string. Error: ${e}`);
            // Keep as string if parsing fails, or handle error as appropriate
          }
        }
        return {
          name: rule.name,
          type: rule.type,
          rule_definition: parsedRuleDefinition,
        };
      });
    }

    if (agentConfig.stateMemory.enableStateSharing) {
      adkConfig.state_settings.sharing_strategy = mapStateSharingStrategy(agentConfig.stateMemory.stateSharingStrategy);
    }
  }
  
  // TODO: Map RAG settings (memory_service) from agentConfig.ragMemory
  // TODO: Map Artifact settings from agentConfig.artifactManagement

  return adkConfig;
}

// Placeholder for generateInstructionFromFields if needed by other parts, or remove if fully encapsulated
// For this subtask, we assume systemPromptGenerated is the primary source for adkConfig.instructions
export function generateInstructionFromFields(config: AgentConfig): string {
  // This function would replicate the logic from AgentBuilderDialog's constructSystemPrompt
  // if needed for direct ADK generation without relying on a pre-generated prompt.
  // For now, we use config.systemPromptGenerated.
  return config.systemPromptGenerated || `Agent: ${config.agentName}. Type: ${config.agentType}.`;
}
