import {
  SavedAgentConfiguration,
  AgentConfig,
  LLMAgentConfig,
  WorkflowAgentConfig,
  AgentFramework,
  // Import other specific config types from agent-core if needed for casting, e.g., A2AAgentSpecialistConfig
} from '@/types/agent-core'; // Updated path
import * as yaml from 'js-yaml';

// Define a more comprehensive structure for the manifest
interface AgentManifest {
  manifestVersion: string;
  agentId: string;
  agentName: string;
  agentDescription?: string;
  agentVersion: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
  icon?: string;
  isRootAgent?: boolean;
  framework?: AgentFramework;
  modelConfiguration?: {
    modelName?: string;
    temperature?: number;
    [key: string]: any; // For other model params
  };
  systemPrompt?: string;
  goal?: string;
  tasks?: string[] | string; // agentTasks can be string or string[] depending on source
  restrictions?: string[] | string; // agentRestrictions can be string or string[]
  workflowConfiguration?: {
    workflowType?: string; // e.g., sequential, parallel, loop from detailedWorkflowType
    steps?: any[]; // Simplified structure from agentData.config.workflowSteps
  };
  toolsUsed?: Array<{
    toolId: string;
    name?: string;
    description?: string;
    genkitToolName?: string;
    configuration?: any;
  }>;
  dependencies?: string[]; // Simulated for now
  statePersistence?: AgentConfig['statePersistence'];
  ragConfig?: AgentConfig['rag'];
  artifactsConfig?: AgentConfig['artifacts'];
  a2aConfig?: AgentConfig['a2a'];
  evaluationGuardrails?: AgentConfig['evaluationGuardrails'];
  deploymentConfig?: SavedAgentConfiguration['deploymentConfig'];
  // Add any other fields that might be relevant from SavedAgentConfiguration
  rawConfig?: AgentConfig; // Optionally include the raw config for completeness
}

const prepareAgentManifestData = (agentData: SavedAgentConfiguration): AgentManifest => {
  const config = agentData.config; // Convenience alias

  const manifest: AgentManifest = {
    manifestVersion: "1.0.0",
    agentId: agentData.id,
    agentName: agentData.agentName,
    agentDescription: agentData.agentDescription,
    agentVersion: agentData.agentVersion,
    createdAt: agentData.createdAt,
    updatedAt: agentData.updatedAt,
    tags: agentData.tags,
    icon: agentData.icon,
    isRootAgent: config?.isRootAgent, // Assuming isRootAgent is directly in config
    framework: config?.framework,
    systemPrompt: config?.systemPromptGenerated || (config as LLMAgentConfig)?.manualSystemPromptOverride, // Handle both prompt fields
    dependencies: (agentData.tools || []).map(toolId => typeof toolId === 'string' ? toolId : toolId.id), // Simplified dependency list
    statePersistence: config?.statePersistence,
    ragConfig: config?.rag,
    artifactsConfig: config?.artifacts,
    a2aConfig: config?.a2a,
    evaluationGuardrails: config?.evaluationGuardrails,
    deploymentConfig: agentData.deploymentConfig,
    // rawConfig: config, // Uncomment if raw config is desired
  };

  // Model Configuration (primarily for LLM agents)
  if (config?.type === 'llm') {
    const llmConfig = config as LLMAgentConfig;
    manifest.modelConfiguration = {
      modelName: llmConfig.agentModel,
      temperature: llmConfig.agentTemperature,
      // Potentially add other model params if they exist in llmConfig.modelParams or similar
      ...(llmConfig.modelParams && { customParams: llmConfig.modelParams }),
    };
    manifest.goal = llmConfig.agentGoal;
    manifest.tasks = llmConfig.agentTasks; // This could be string or string[]
    manifest.restrictions = llmConfig.agentRestrictions; // This could be string or string[]
  }

  // Workflow Configuration
  if (config?.type === 'workflow') {
    const workflowConfig = config as WorkflowAgentConfig;
    manifest.workflowConfiguration = {
      workflowType: workflowConfig.workflowType, // This might be 'sequential', 'parallel', etc.
      // Map workflowSteps to a simpler structure if needed, or include as is
      steps: workflowConfig.workflowSteps?.map(step => ({
        name: step.name,
        description: step.description,
        agentId: step.agentId,
        inputMapping: step.inputMapping, // Could be string or object
        outputKey: step.outputKey,
      })),
    };
    // Workflow agents can also have goal/tasks/etc. if they are also LLM-driven for some aspects
    if (workflowConfig.agentGoal) manifest.goal = workflowConfig.agentGoal;
    if (workflowConfig.agentTasks) manifest.tasks = workflowConfig.agentTasks;

  }

  // Tools Used
  if (agentData.toolsDetails && agentData.toolsDetails.length > 0) {
    manifest.toolsUsed = agentData.toolsDetails.map(toolDetail => ({
      toolId: toolDetail.id,
      name: toolDetail.name, // name from toolsDetails
      description: toolDetail.description, // description from toolsDetails
      genkitToolName: toolDetail.genkitToolName,
      configuration: agentData.toolConfigsApplied?.[toolDetail.id],
    }));
  } else if (agentData.tools && agentData.tools.length > 0) {
    // Fallback if toolsDetails is not populated but tools array (of IDs) is
    manifest.toolsUsed = agentData.tools.map(toolIdOrObject => {
      const toolId = typeof toolIdOrObject === 'string' ? toolIdOrObject : toolIdOrObject.id;
      return {
        toolId: toolId,
        configuration: agentData.toolConfigsApplied?.[toolId],
      };
    });
  }

  return manifest;
};

export const generateAgentManifestJson = (agentData: SavedAgentConfiguration): string => {
  const manifestData = prepareAgentManifestData(agentData);
  return JSON.stringify(manifestData, null, 2);
};

export const generateAgentManifestYaml = (agentData: SavedAgentConfiguration): string => {
  const manifestData = prepareAgentManifestData(agentData);
  return yaml.dump(manifestData);
};
