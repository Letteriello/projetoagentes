import { z } from 'zod';

// Schema for ToolConfigField
export const toolConfigFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "password", "select", "number", "textarea"]),
  options: z.array(z.object({ label: z.string(), value: z.union([z.string(), z.number()]) })).optional(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

// Schema for CommunicationChannel
export const communicationChannelSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["direct_http", "message_queue", "custom"]),
  targetAgentId: z.string().optional(),
  protocol: z.enum(["http", "https"]).optional(),
  endpoint: z.string().url().optional().or(z.literal('')), // Allow empty string or valid URL
  topic: z.string().optional(),
  brokerUrl: z.string().url().optional().or(z.literal('')), // Allow empty string or valid URL
  customConfig: z.record(z.any()).optional(),
  description: z.string().optional(),
});

// Schema for ArtifactDefinition
export const artifactDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  mimeType: z.string().min(1),
  required: z.boolean(),
  accessPermissions: z.enum(["read", "write", "read_write"]).optional(),
  versioningEnabled: z.boolean().optional(),
});

// Schema for InitialStateValue
export const initialStateValueSchema = z.object({
  key: z.string().min(1),
  value: z.string(), // Value can be empty initially
  scope: z.enum(['GLOBAL', 'AGENT', 'TEMPORARY']).optional(),
  description: z.string().optional(),
});

// Schema for StateValidationRule
export const stateValidationRuleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['JSON_SCHEMA', 'REGEX']),
  rule: z.string().min(1), // Rule itself should not be empty
});

// Schema for KnowledgeSource
export const knowledgeSourceSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["file", "url", "text_chunk", "google_drive"]),
  name: z.string().min(1),
  path: z.string().optional(), // Path can be optional, e.g. for text_chunk
  content: z.string().optional(), // Content can be optional, e.g. for file/url
  status: z.enum(["pending", "processing", "ready", "error"]).optional(),
  metadata: z.record(z.any()).optional(),
});

// Add more schemas in subsequent steps

// Schema for A2AConfig
export const a2aConfigSchema = z.object({
  enabled: z.boolean(),
  communicationChannels: z.array(communicationChannelSchema),
  defaultResponseFormat: z.enum(["json", "text", "xml"]),
  maxMessageSize: z.number().positive(),
  loggingEnabled: z.boolean(),
  securityPolicy: z.enum(["none", "jwt", "api_key"]).optional(),
  apiKeyHeaderName: z.string().optional(),
});

// Schema for ArtifactsConfig
export const artifactsConfigSchema = z.object({
  enabled: z.boolean(),
  storageType: z.enum(["local", "cloud", "memory", "filesystem"]),
  cloudStorageBucket: z.string().optional(),
  localStoragePath: z.string().optional(),
  definitions: z.array(artifactDefinitionSchema),
});

// Schema for StatePersistenceConfig
export const statePersistenceConfigSchema = z.object({
  enabled: z.boolean(),
  type: z.enum(["session", "memory", "database"]),
  defaultScope: z.enum(['GLOBAL', 'AGENT', 'TEMPORARY']).optional(),
  timeToLiveSeconds: z.number().positive().optional(),
  initialStateValues: z.array(initialStateValueSchema).optional(),
  validationRules: z.array(stateValidationRuleSchema).optional(),
});

// Schema for RagMemoryConfig
export const ragMemoryConfigSchema = z.object({
  enabled: z.boolean(),
  serviceType: z.enum(["in-memory", "vertex_ai_rag", "custom_vector_db"]),
  knowledgeSources: z.array(knowledgeSourceSchema),
  persistentMemory: z.object({
    enabled: z.boolean(),
    storagePath: z.string().optional(),
  }).optional(),
  retrievalParameters: z.object({
    topK: z.number().positive().optional(),
    similarityThreshold: z.number().min(0).max(1).optional(),
  }).optional(),
  embeddingModel: z.string().optional(),
  includeConversationContext: z.boolean().optional(),
});

// Schema for AvailableTool
// Note: icon type is complex (ReactNode | string), for Zod we'll keep it simple or use z.any()
// For now, focusing on the structure relevant for validation.
export const availableToolSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["genkit_native", "openapi", "mcp", "custom_script"]),
  icon: z.any().optional(), // Simplified for Zod schema, actual type is ReactNode | string
  description: z.string().min(1),
  hasConfig: z.boolean().optional(),
  genkitToolName: z.string().optional(),
  configFields: z.array(toolConfigFieldSchema).optional(),
  category: z.string().optional(),
});

// Schema for ToolConfigData
// This is a general key-value store. If specific structures are known for tool configs,
// they could be defined, but often this is dynamic.
export const toolConfigDataSchema = z.record(z.any());

// Base schema for Agent Configuration
export const agentConfigBaseSchema = z.object({
  // type: z.enum(["llm", "workflow", "custom", "a2a"]), // This will be part of specific schemas for discriminated union
  framework: z.enum(["genkit", "crewai", "langchain", "custom", "none"]),
  isRootAgent: z.boolean().optional(),
  subAgentIds: z.array(z.string()).optional(),
  globalInstruction: z.string().optional(),
  statePersistence: statePersistenceConfigSchema.optional(),
  rag: ragMemoryConfigSchema.optional(),
  artifacts: artifactsConfigSchema.optional(),
  a2a: a2aConfigSchema.optional(),
});

// Schema for LLMAgentConfig
export const llmAgentConfigSchema = agentConfigBaseSchema.extend({
  type: z.literal("llm"),
  agentGoal: z.string().min(1, "Agent goal is required."),
  agentTasks: z.array(z.string().min(1, "Task cannot be empty.")).min(1, "At least one agent task is required."),
  agentPersonality: z.string().optional(),
  agentRestrictions: z.array(z.string().min(1, "Restriction cannot be empty.")).optional(),
  agentModel: z.string().min(1, "Agent model is required."),
  agentTemperature: z.number().min(0).max(2), // Assuming a typical temperature range
  systemPromptGenerated: z.string().optional(),
});

// Schema for WorkflowAgentConfig
export const workflowAgentConfigSchema = agentConfigBaseSchema.extend({
  type: z.literal("workflow"),
  detailedWorkflowType: z.enum(["sequential", "parallel", "loop", "graph", "stateMachine"]),
  workflowDescription: z.string().min(1, "Workflow description is required."),
  loopMaxIterations: z.number().positive("Max iterations must be a positive number.").optional(),
  loopTerminationConditionType: z.enum(["tool_success", "state_change", "max_iterations", "none"]).optional(),
  loopExitToolName: z.string().optional(),
  loopExitStateKey: z.string().optional(),
  loopExitStateValue: z.string().optional(),
});

// Schema for CustomAgentConfig
export const customAgentConfigSchema = agentConfigBaseSchema.extend({
  type: z.literal("custom"),
  customLogicDescription: z.string().min(1, "Custom logic description is required."),
  genkitFlowName: z.string().optional(), // Might become required depending on framework choices
});

// Schema for A2AAgentSpecialistConfig
export const a2aAgentSpecialistConfigSchema = agentConfigBaseSchema.extend({
  type: z.literal("a2a"),
  // Add any specific fields for A2A specialist if they exist, otherwise it's same as base + type
});

// Discriminated union for AgentConfig
export const agentConfigSchema = z.discriminatedUnion("type", [
  llmAgentConfigSchema,
  workflowAgentConfigSchema,
  customAgentConfigSchema,
  a2aAgentSpecialistConfigSchema,
]);

// Schema for SavedAgentConfiguration
export const savedAgentConfigurationSchema = z.object({
  id: z.string().min(1, "ID is required."), // Usually a UUID or generated ID
  agentName: z.string().min(1, "Agent name is required."),
  agentDescription: z.string().min(1, "Agent description is required."),
  agentVersion: z.string().min(1, "Agent version is required."), // Consider semantic versioning if applicable, e.g., .regex(/^\d+\.\d+\.\d+$/)
  icon: z.string().optional(),
  templateId: z.string().optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime("Invalid creation date format.").optional(), // Optional because it might be set by the backend
  updatedAt: z.string().datetime("Invalid update date format.").optional(), // Optional because it might be set by the backend
  userId: z.string().optional(), // Optional as it might be contextually added
  config: agentConfigSchema, // Uses the discriminated union schema
  tools: z.array(z.string()), // Array of tool IDs or names
  toolConfigsApplied: z.record(toolConfigDataSchema).optional(), // Uses the generic toolConfigDataSchema
  toolsDetails: z.array(z.object({ // Basic validation for tool details, could be more specific if needed
    id: z.string().min(1),
    name: z.string().min(1),
    label: z.string().min(1),
    description: z.string().min(1),
    iconName: z.string().optional(),
    hasConfig: z.boolean().optional(),
    genkitToolName: z.string().optional(),
  })).optional(),
});

// Helper schema for validating the agent name and description suggestion flow
export const agentNameDescriptionSuggestionSchema = z.object({
  agentName: z.string().min(1, "Agent name is required."),
  agentDescription: z.string().min(1, "Agent description is required."),
});

// Helper schema for validating the LLM behavior suggestion flow
export const llmBehaviorSuggestionSchema = z.object({
  agentGoal: z.string().min(1, "Agent goal is required."),
  agentTasks: z.array(z.string().min(1, "Task cannot be empty.")).min(1, "At least one agent task is required."),
  agentPersonality: z.string().optional(), // Assuming personality is optional for suggestion
  // No agentRestrictions or other fields needed for this specific suggestion flow
});
