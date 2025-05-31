import { A2AConfig as ImportedA2AConfig } from "./a2a-types";
import { ArtifactDefinition as ImportedArtifactDefinition } from "@/components/features/agent-builder/artifact-management-tab";
import { KnowledgeSource as ImportedKnowledgeSource, RagMemoryConfig as ImportedRagMemoryConfig } from "@/components/features/agent-builder/memory-knowledge-tab";

// Export imported types for use in other type definition files
export type ArtifactDefinition = ImportedArtifactDefinition;
export type KnowledgeSource = ImportedKnowledgeSource;
export type RagMemoryConfig = ImportedRagMemoryConfig;
export type A2AConfig = ImportedA2AConfig; // Exporting with the original name for direct use

export interface ToolConfigData {
  [key: string]: any;
}

import type { AvailableTool as UIAvailableTool } from './tool-types';
export type AvailableTool = UIAvailableTool;

export type AgentFramework = "genkit" | "crewai" | "langchain" | "custom" | "none";
export type TerminationConditionType = 'tool' | 'state' | 'none';

// Types previously defined here are now canonical in agent-configs.ts
// Re-exporting for compatibility or until all imports are updated.
export type {
  AgentConfig,
  SavedAgentConfiguration,
  LLMAgentConfig,
  // TaskAgentConfig, // Assuming TaskAgentConfig is not in agent-configs.ts or needs specific handling
  WorkflowAgentConfig,
  CustomAgentConfig,
  // A2AAgentConfig // Assuming A2AAgentConfig is covered by A2AAgentSpecialistConfig in agent-configs.ts
} from './agent-configs';

// Keep specific types from this file that are not in agent-configs.ts or are genuinely distinct
// For example, if TaskAgentConfig or A2AAgentConfig here had truly different structures
// than what's derived from agent-configs.ts, they might need to stay or be merged carefully.
// For now, I'm commenting them out from re-export if they seem to have equivalents.

// If TaskAgentConfig is needed and distinct:
// export interface TaskAgentConfig extends BaseAgentConfigFromConfigs { // extend from a base in agent-configs
//   type: 'task'; 
//   // ... specific properties
// }

// If A2AAgentConfig is needed and distinct:
// export interface A2AAgentConfig extends BaseAgentConfigFromConfigs {
//   type: 'a2a';
//   // ... specific properties
// }
