import { z } from 'zod';
// Assuming path alias @/ is configured, adjust if necessary for your project structure
import type {
  AgentFramework as AgentFrameworkType, // Renaming to avoid conflict with Zod const
  AgentType as AgentTypeType,
  WorkflowDetailedType as WorkflowDetailedTypeType,
  TerminationConditionType as TerminationConditionTypeType,
  StatePersistenceType as StatePersistenceTypeType,
  ArtifactStorageType as ArtifactStorageTypeType,
  StateScope as StateScopeType,
  CommunicationChannel as CommunicationChannelType // For A2A
} from '@/types/agent-configs-new'; // Assuming agent-configs-new.ts is the correct new path

// Maximum length for system prompts
export const MAX_SYSTEM_PROMPT_LENGTH = 10000;

// Enums defined from TypeScript types
const AgentFrameworkEnum = z.enum(["genkit", "crewai", "langchain", "custom", "none"]);
const AgentTypeEnum = z.enum(["llm", "workflow", "custom", "a2a"]);
const WorkflowDetailedTypeEnum = z.enum(["sequential", "parallel", "loop", "graph", "stateMachine"]);
const TerminationConditionTypeEnum = z.enum(["tool_success", "state_change", "max_iterations", "none"]);
const StatePersistenceTypeEnum = z.enum(["session", "memory", "database"]);
const ArtifactStorageTypeEnum = z.enum(["local", "cloud", "memory", "filesystem"]);
const StateScopeEnum = z.enum(['GLOBAL', 'AGENT', 'TEMPORARY']);

// ADK Callbacks Schema (as per AgentBuilderDialog.tsx)
export const adkCallbacksConfigSchema = z.object({
  beforeAgent: z.string().optional().describe("Genkit flow name or function reference for before agent processing."),
  afterAgent: z.string().optional().describe("Genkit flow name or function reference for after agent processing."),
  beforeModel: z.string().optional().describe("Genkit flow name or function reference before a model is invoked."),
  afterModel: z.string().optional().describe("Genkit flow name or function reference after a model is invoked."),
  beforeTool: z.string().optional().describe("Genkit flow name or function reference before a tool is used."),
  afterTool: z.string().optional().describe("Genkit flow name or function reference after a tool is used.")
}).optional();

// Base Schemas (as per agent-configs-new.ts structures)
export const modelSafetySettingItemSchema = z.object({
  category: z.string(),
  threshold: z.string(),
});

export const agentTerminationConditionSchema = z.object({
  type: TerminationConditionTypeEnum,
  value: z.union([z.number(), z.string(), z.boolean()]).optional(),
  description: z.string().optional(),
});

export const statePersistenceConfigSchema = z.object({
  enabled: z.boolean().default(false),
  type: StatePersistenceTypeEnum,
  config: z.record(z.any()).optional(),
  defaultScope: StateScopeEnum.optional(),
  timeToLiveSeconds: z.number().int().positive().optional(),
  initialStateValues: z.array(z.object({
    key: z.string().min(1, "Key cannot be empty"),
    value: z.string(),
    scope: StateScopeEnum.optional(),
    description: z.string().optional(),
  })).optional(),
  validationRules: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1, "Rule name cannot be empty"),
    type: z.enum(['JSON_SCHEMA', 'REGEX']),
    rule: z.string().min(1, "Rule definition cannot be empty"),
  })).optional(),
});

export const knowledgeSourceSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1, "Knowledge source type is required"),
  name: z.string().min(1, "Knowledge source name is required"),
  description: z.string().optional(),
  config: z.record(z.any()).optional(),
  path: z.string().optional(),
  content: z.string().optional(),
});

export const ragMemoryConfigSchema = z.object({
  enabled: z.boolean().default(false),
  serviceType: z.string().optional(),
  knowledgeSources: z.array(knowledgeSourceSchema).optional(),
  retrievalParameters: z.object({
    topK: z.number().int().positive().optional(),
    similarityThreshold: z.number().min(0).max(1).optional(),
  }).optional(),
  embeddingModel: z.string().optional(),
  includeConversationContext: z.boolean().optional().default(false),
  persistentMemory: z.object({
    enabled: z.boolean().default(false),
    storagePath: z.string().optional(),
  }).optional(),
  chunkSize: z.number().int().positive().optional(),
  chunkOverlap: z.number().int().positive().optional(),
  maxRetrievedDocuments: z.number().int().positive().optional(),
});

export const artifactDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Artifact name is required"),
  description: z.string().optional(),
  mimeType: z.string().min(1, "MIME type is required"),
  required: z.boolean().default(false),
  accessPermissions: z.enum(['read', 'write', 'read_write']).default('read_write'),
  versioningEnabled: z.boolean().default(false),
});

export const artifactsConfigSchema = z.object({
  enabled: z.boolean().default(false),
  storageType: ArtifactStorageTypeEnum,
  cloudStorageBucket: z.string().optional(),
  localStoragePath: z.string().optional(),
  definitions: z.array(artifactDefinitionSchema).optional(),
});

const communicationChannelDirectionEnum = z.enum(['inbound', 'outbound']);
const communicationChannelMessageFormatEnum = z.enum(['json', 'text', 'binary']);
const communicationChannelSyncModeEnum = z.enum(['sync', 'async']);

export const a2aCommunicationChannelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Channel name is required."),
  direction: communicationChannelDirectionEnum,
  messageFormat: communicationChannelMessageFormatEnum,
  syncMode: communicationChannelSyncModeEnum,
  timeout: z.number().int().positive().optional(),
  targetAgentId: z.string().optional(),
  schema: z.string().optional(),
});

export const a2aSettingsSchema = z.object({
  enabled: z.boolean().default(false),
  communicationChannels: z.array(a2aCommunicationChannelSchema).optional(),
  defaultResponseFormat: communicationChannelMessageFormatEnum.optional(),
  maxMessageSize: z.number().int().positive().optional(),
  securityPolicy: z.enum(['none', 'jwt', 'api_key']).optional().default('none'),
  apiKeyHeaderName: z.string().optional(),
  loggingEnabled: z.boolean().default(false),
}).refine(data => {
  if (data.securityPolicy === 'api_key' && (!data.apiKeyHeaderName || data.apiKeyHeaderName.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: "API Key Header Name is required when Security Policy is API Key.",
  path: ["apiKeyHeaderName"],
});

export const evaluationGuardrailsSchema = z.object({
  prohibitedKeywords: z.array(z.string()).optional().describe("Lista de palavras-chave que não devem aparecer nas respostas."),
  maxResponseLength: z.number().int().positive().optional().describe("Comprimento máximo permitido para uma resposta do agente."),
  checkForToxicity: z.boolean().optional().describe("Habilita uma verificação simulada de toxicidade na resposta."),
}).optional();

export const speechConfigSchema = z.object({
  voice: z.string().optional(),
  speed: z.number().min(0.25).max(4.0).optional(), // Assuming speed is a multiplier
}).optional();

export const chatRunConfigSchema = z.object({
  max_llm_calls: z.number().int().min(0).optional().describe("Maximum number of LLM calls allowed. 0 for unlimited."),
  stream_response: z.boolean().optional().describe("Whether to stream the response from the LLM."),
  speech_config: speechConfigSchema, // Use the schema defined above
}).optional();

export const agentConfigBaseSharedSchema = z.object({
  framework: AgentFrameworkEnum,
  agentGoal: z.string().min(1, "Agent goal is required."),
  agentTasks: z.string().min(1, "Agent tasks are required."), // Assuming this was meant to be string array based on types, but schema had string. For now, string.
  terminationConditions: z.array(agentTerminationConditionSchema).optional(),
  statePersistence: statePersistenceConfigSchema.optional(),
  ragMemoryConfig: ragMemoryConfigSchema.optional(),
  artifacts: artifactsConfigSchema.optional(),
  systemPromptGenerated: z.string().optional().refine(
    (val) => val === undefined || val === null || val.length <= MAX_SYSTEM_PROMPT_LENGTH,
    { message: `O prompt gerado excede o limite de ${MAX_SYSTEM_PROMPT_LENGTH} caracteres.` }
  ),
  manualSystemPromptOverride: z.string().optional().refine(
    (val) => val === undefined || val === null || val.length <= MAX_SYSTEM_PROMPT_LENGTH,
    { message: `O prompt manual excede o limite de ${MAX_SYSTEM_PROMPT_LENGTH} caracteres.` }
  ),
  a2a: a2aSettingsSchema.optional(),
  isRootAgent: z.boolean().optional().default(true),
  subAgentIds: z.array(z.string()).optional(),
  globalInstruction: z.string().optional(),
  sandboxedCodeExecution: z.boolean().optional(), // Added from AgentConfigBase in types
  adkCallbacks: adkCallbacksConfigSchema, // Added ADK Callbacks here
  systemPromptHistory: z.array(z.object({
    prompt: z.string(),
    timestamp: z.string().datetime(),
  })).optional(),
  evaluationGuardrails: evaluationGuardrailsSchema, // Added for Task 9.4
  runConfig: chatRunConfigSchema,
});

export const llmAgentConfigSchema = agentConfigBaseSharedSchema.extend({
  type: z.literal(AgentTypeEnum.Values.llm),
  agentModel: z.string().min(1, "Model is required."),
  agentTemperature: z.number().min(0).max(1, "Temperature must be between 0 and 1.").default(0.7),
  agentPersonality: z.string().optional(),
  agentRestrictions: z.array(z.string().min(1, "Restriction cannot be empty.")).optional(),
  modelSafetySettings: z.array(modelSafetySettingItemSchema).optional(),
  maxHistoryTokens: z.number().int().positive().optional(),
  maxTokensPerResponse: z.number().int().positive().optional(),
  enableCompositionalFunctionCalling: z.boolean().optional(), // Added for CFC
});

export const workflowAgentConfigSchema = agentConfigBaseSharedSchema.extend({
  type: z.literal(AgentTypeEnum.Values.workflow),
  workflowType: WorkflowDetailedTypeEnum,
  workflowDescription: z.string().min(1, "Workflow description is required."),
  subAgents: z.array(z.string()).optional(),
  workflowConfig: z.record(z.any()).optional(),
});

export const customAgentConfigSchema = agentConfigBaseSharedSchema.extend({
  type: z.literal(AgentTypeEnum.Values.custom),
  customLogicDescription: z.string().min(1, "Custom logic description is required."),
  scriptPath: z.string().optional(),
  genkitFlowName: z.string().optional(),
});

export const a2aAgentSpecialistConfigSchema = agentConfigBaseSharedSchema.extend({
  type: z.literal(AgentTypeEnum.Values.a2a),
  // Add A2A specific fields here from its type if not covered by agentConfigBaseSharedSchema's a2a field
});

export const agentConfigSchema = z.discriminatedUnion("type", [
  llmAgentConfigSchema,
  workflowAgentConfigSchema,
  customAgentConfigSchema,
  a2aAgentSpecialistConfigSchema,
]);

export const toolDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string().optional(),
  genkitToolName: z.string().optional(),
});

export const toolConfigDataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number()), z.array(z.boolean())])
);

export const environmentVariableSchema = z.object({
  key: z.string().min(1, "Environment variable key cannot be empty."),
  value: z.string(),
  isSecret: z.boolean().optional(),
});

export const resourceRequirementsSchema = z.object({
  cpu: z.string().optional(),
  memory: z.string().optional(),
  gpu: z.string().optional(),
});

export const deploymentConfigSchema = z.object({
  // environment from DeployTab.tsx, targetPlatform from AgentBuilderDialog.tsx
  environment: z.enum(["development", "staging", "production", "custom"]).optional(),
  targetPlatform: z.enum(["gcp_cloud_run", "gcp_gke", "aws_lambda", "aws_ecs", "azure_functions", "azure_container_apps", "docker", "local_node", "custom_script"]).optional(),
  dockerfilePath: z.string().optional(), // From DeployTab.tsx
  customScriptPath: z.string().optional(), // From DeployTab.tsx
  port: z.number().int().positive().optional(), // From DeployTab.tsx
  envVars: z.array(environmentVariableSchema).optional(),
  resources: resourceRequirementsSchema.optional(),
  scaling: z.object({
    minInstances: z.number().int().positive().optional(),
    maxInstances: z.number().int().positive().optional(),
    targetConcurrency: z.number().int().positive().optional(),
  }).optional(),
});

export const savedAgentConfigurationSchema = z.object({
  id: z.string().uuid("ID must be a valid UUID."),
  agentName: z.string().min(1, "Agent name is required."),
  agentDescription: z.string().optional(),
  agentVersion: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be in format X.Y.Z (e.g., 1.0.0)").optional(),
  config: agentConfigSchema,
  tools: z.array(z.string()).min(1, "At least one tool must be selected.").optional(),
  toolsDetails: z.array(toolDetailSchema).optional(),
  toolConfigsApplied: z.record(z.string(), toolConfigDataSchema).optional(),
  deploymentConfig: deploymentConfigSchema.optional(),
  createdAt: z.string().datetime({ message: "Invalid creation date format." }),
  updatedAt: z.string().datetime({ message: "Invalid update date format." }),
  isTemplate: z.boolean().optional().default(false),
  userId: z.string().optional(),
});

// ---- Example Tool Schemas ----
export const webSearchToolSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  searchEngine: z.enum(["google", "bing", "duckduckgo"]).optional().default("google"),
});

export const customApiIntegrationToolSchema = z.object({
  baseUrl: z.string().url("Invalid base URL."),
  apiKey: z.string().optional(),
  authType: z.enum(["none", "apiKey", "oauth2"]).default("none"),
  tokenUrl: z.string().url().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
});

// ---- Other existing schemas ----
export const toolConfigFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "password", "select", "number", "textarea", "boolean"]),
  options: z.array(z.object({ label: z.string(), value: z.union([z.string(), z.number()]) })).optional(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

export const availableToolSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["genkit_native", "openapi", "mcp", "custom_script"]),
  icon: z.any().optional(),
  description: z.string().min(1),
  hasConfig: z.boolean().optional(),
  genkitToolName: z.string().optional(),
  configFields: z.array(toolConfigFieldSchema).optional(),
  category: z.string().optional(),
  requiresAuth: z.boolean().optional(),
  serviceTypeRequired: z.string().optional(),
});

export const chatToolDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  enabled: z.boolean()
});

export const chatInputSchema = z.object({
  userMessage: z.string().min(1),
  history: z.array(z.object({
    role: z.string(),
    content: z.string(),
    timestamp: z.date().optional()
  })).optional(),
  fileDataUri: z.string().optional(),
  modelName: z.string(),
  systemPrompt: z.string().optional(),
  temperature: z.number().optional(),
  agentToolsDetails: z.array(chatToolDetailSchema).optional()
});

export const finalSavedAgentConfigurationSchema = savedAgentConfigurationSchema;

// MCP Server Configuration Schemas
export const mcpServerConfigSchema = z.object({
  id: z.string().uuid().optional(), // Optional: usually generated on add by backend/client
  name: z.string().min(1, "Server name is required."),
  url: z.string().url("Invalid URL format. Please include http:// or https://"),
  description: z.string().optional(),
  status: z.enum(['connected', 'disconnected', 'error']).optional(), // Optional: usually set dynamically
});

export const mcpServerFormSchema = mcpServerConfigSchema.omit({ id: true, status: true });

// API Key Vault Form Schema
// Duplicating SERVICE_TYPE_OPTIONS here for schema validation independence.
// Ensure this list is kept in sync with the one in ApiKeyVaultPage.tsx if it's maintained there.
const API_KEY_SERVICE_TYPE_OPTIONS = [
  "OpenAI", "Google Gemini", "Google Search", "OpenRouter",
  "Generic", "Custom API", "Database", "Other"
] as const;

export const apiKeyFormSchema = z.object({
  serviceName: z.string().min(1, "Service name is required."),
  selectedServiceType: z.enum(API_KEY_SERVICE_TYPE_OPTIONS),
  customServiceType: z.string().optional(),
  // associatedAgentsInput is for client-side parsing, not directly part of the core ApiKeyVaultEntry model usually
  // The actual API key value is handled separately and securely, not in this form schema.
  associatedAgentsInput: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.selectedServiceType === "Other" && (!data.customServiceType || data.customServiceType.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["customServiceType"],
      message: "Custom service type is required when 'Other' is selected.",
    });
  }
});

export type ApiKeyFormData = z.infer<typeof apiKeyFormSchema>;

// Define available user roles
export const USER_ROLES = ["Usuário Padrão", "Administrador", "Desenvolvedor"] as const;
const UserRoleEnum = z.enum(USER_ROLES);

// Profile Page Form Schema
export const profileFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  birthDate: z.string().refine((date) => {
    if (!date) return true; // Allow empty string
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  }, { message: "Invalid date format. Use YYYY-MM-DD." }).optional().or(z.literal("")),
  email: z.string().email("Invalid email address.").or(z.literal("")),
  agentInstructions: z.string().optional(),
  globalMemory: z.string().optional(),
  allowMemoryAccess: z.boolean().default(true),
  simulatedRole: UserRoleEnum.optional().default("Usuário Padrão"), // Added simulatedRole
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
