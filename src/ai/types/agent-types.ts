// This file is a candidate for deletion if AgentTestConfig is not widely used
// or can be refactored into the test files that use it.
// For now, refactoring AgentTestConfig to use core types.

import type {
  SavedAgentConfiguration as CoreSavedAgentConfiguration,
  LLMAgentConfig as CoreLLMAgentConfig,
  AgentConfig as CoreAgentConfig // For more flexibility in AgentTestConfig.config
} from '@/types/agent-core';

// Local LLMAgentConfig, SavedAgentConfiguration, and WorkflowDetailedType removed
// as they are superseded by types in @/types/agent-core.

// Tipo estendido para compatibilidade com testes, agora usando os tipos centrais.
export interface AgentTestConfig extends CoreSavedAgentConfiguration {
  // CoreSavedAgentConfiguration already includes:
  // id, agentName, agentDescription, agentVersion, config, tools, toolsDetails,
  // toolConfigsApplied, createdAt, updatedAt, isTemplate, userId, etc.

  // Ensure the 'config' field here is compatible with CoreAgentConfig.
  // If it's always LLM-like for tests, we can use CoreLLMAgentConfig.
  // If it can be other agent types for tests, CoreAgentConfig is better.
  config: CoreAgentConfig & { // Using CoreAgentConfig for broader compatibility
    // Add specific overrides or additional test-specific fields for config if necessary.
    // For example, if tests rely on agentGoal and agentTasks being directly in this
    // config object (though in agent-core they are part of LLMAgentConfig or similar):
    agentGoal?: string; // This is usually within config.agentGoal if config is LLMAgentConfig
    agentTasks?: string[]; // Usually within config.agentTasks if config is LLMAgentConfig
  };

  // tools, toolsDetails, toolConfigsApplied are already part of CoreSavedAgentConfiguration.
  // Re-declaring them here might be redundant unless the test type needs a different shape.
  // For now, relying on the fields from CoreSavedAgentConfiguration.
  // If tests need 'tools' to be 'any[]', that's a specific local override.
}

// Example of how AgentTestConfig might be structured if config is always LLM for these tests:
/*
export interface AgentTestLLMConfig extends CoreSavedAgentConfiguration {
  config: CoreLLMAgentConfig & {
    // any additional test-specific fields for the LLM config part
  };
}
*/
