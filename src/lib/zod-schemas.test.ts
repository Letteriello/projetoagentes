import { z } from 'zod';
import {
  savedAgentConfigurationSchema,
  agentConfigSchema,
  llmAgentConfigSchemaUpdated,
  workflowAgentConfigSchemaUpdated,
  customAgentConfigSchemaUpdated,
  a2aAgentSpecialistConfigSchemaUpdated,
  // Assuming other necessary sub-schemas like statePersistenceConfigSchema etc. are implicitly tested
  // via savedAgentConfigurationSchema if they are included in the mock data.
  // This test focuses on the primary schemas listed in the prompt.
} from './zod-schemas'; // Adjust path as necessary
import type { SavedAgentConfiguration, LLMAgentConfig, WorkflowAgentConfig, CustomAgentConfig, A2AAgentSpecialistConfig } from '@/types/agent-configs'; // Adjust path


// Helper to check for a specific error
const findError = (result: z.SafeParseError<any>, path: string, messageSubstring?: string): boolean => {
  return result.error.errors.some(
    err => err.path.join('.') === path && (messageSubstring ? err.message.includes(messageSubstring) : true)
  );
};

// Base valid configurations for reusability
const baseLLMConfig: LLMAgentConfig = {
  type: 'llm',
  framework: 'genkit',
  agentModel: 'gemini-1.5-flash-latest',
  agentGoal: 'Test goal for LLM',
  agentTasks: ['Test task 1 for LLM'],
  agentPersonality: 'neutral',
  agentTemperature: 0.7,
  safetySettings: [],
  // Optional fields can be omitted or explicitly set to undefined if schema allows .optional()
  // For required but potentially complex sub-objects, provide minimal valid structures
  statePersistence: { enabled: false, type: 'session', defaultScope: 'AGENT', initialStateValues: [], validationRules: [] },
  rag: { enabled: false, serviceType: 'in-memory', knowledgeSources: [], retrievalParameters: {}, persistentMemory: {enabled: false} },
  artifacts: { enabled: false, storageType: 'memory', definitions: [] },
  a2a: { enabled: false, communicationChannels: [], defaultResponseFormat: 'json', securityPolicy: 'none', loggingEnabled: false },
  adkCallbacks: {},
  deploymentConfig: {},
};

const baseWorkflowConfig: WorkflowAgentConfig = {
  type: 'workflow',
  framework: 'genkit',
  detailedWorkflowType: 'sequential',
  workflowDescription: 'Test workflow description',
  // Minimal valid structures for optional complex fields
  statePersistence: { enabled: false, type: 'session', defaultScope: 'AGENT', initialStateValues: [], validationRules: [] },
  rag: { enabled: false, serviceType: 'in-memory', knowledgeSources: [], retrievalParameters: {}, persistentMemory: {enabled: false} },
  artifacts: { enabled: false, storageType: 'memory', definitions: [] },
  a2a: { enabled: false, communicationChannels: [], defaultResponseFormat: 'json', securityPolicy: 'none', loggingEnabled: false },
  adkCallbacks: {},
  deploymentConfig: {},
};

const baseCustomConfig: CustomAgentConfig = {
  type: 'custom',
  framework: 'genkit',
  customLogicDescription: 'Test custom logic description',
  // Minimal valid structures for optional complex fields
  statePersistence: { enabled: false, type: 'session', defaultScope: 'AGENT', initialStateValues: [], validationRules: [] },
  rag: { enabled: false, serviceType: 'in-memory', knowledgeSources: [], retrievalParameters: {}, persistentMemory: {enabled: false} },
  artifacts: { enabled: false, storageType: 'memory', definitions: [] },
  a2a: { enabled: false, communicationChannels: [], defaultResponseFormat: 'json', securityPolicy: 'none', loggingEnabled: false },
  adkCallbacks: {},
  deploymentConfig: {},
};

const baseA2ASpecialistConfig: A2AAgentSpecialistConfig = {
  type: 'a2a',
  framework: 'genkit',
  // Minimal valid structures for optional complex fields
  statePersistence: { enabled: false, type: 'session', defaultScope: 'AGENT', initialStateValues: [], validationRules: [] },
  rag: { enabled: false, serviceType: 'in-memory', knowledgeSources: [], retrievalParameters: {}, persistentMemory: {enabled: false} },
  artifacts: { enabled: false, storageType: 'memory', definitions: [] },
  a2a: { enabled: false, communicationChannels: [], defaultResponseFormat: 'json', securityPolicy: 'none', loggingEnabled: false },
  adkCallbacks: {},
  deploymentConfig: {},
};


const baseSavedAgentConfig: SavedAgentConfiguration = {
  id: 'test-agent-id',
  agentName: 'Test Agent',
  agentDescription: 'Test agent description',
  agentVersion: '1.0.0',
  config: { ...baseLLMConfig }, // Default to LLM for base saved config
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: 'test-user',
  tools: [],
  toolsDetails: [],
  toolConfigsApplied: {},
  templateId: '',
  isTemplate: false,
  isFavorite: false,
  tags: [],
  icon: '',
  internalVersion: 1,
  isLatest: true,
  originalAgentId: 'test-agent-id',
};


describe('savedAgentConfigurationSchema', () => {
  test('should parse a valid LLM agent configuration successfully', () => {
    const result = savedAgentConfigurationSchema.safeParse(baseSavedAgentConfig);
    if (!result.success) console.error("Valid LLM Agent Save Error:", result.error.issues);
    expect(result.success).toBe(true);
  });

  test('should fail if id is missing', () => {
    const data = { ...baseSavedAgentConfig, id: undefined };
    const result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'id', 'Required')).toBe(true);
  });

  test('should fail if agentName is missing or empty', () => {
    let data: any = { ...baseSavedAgentConfig, agentName: undefined };
    let result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'agentName', 'Agent name is required.')).toBe(true);

    data = { ...baseSavedAgentConfig, agentName: "" };
    result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'agentName', 'Agent name is required.')).toBe(true);
  });

  test('should fail if agentDescription is missing or empty', () => {
    let data: any = { ...baseSavedAgentConfig, agentDescription: undefined };
    let result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'agentDescription', 'Agent description is required.')).toBe(true);
    
    data = { ...baseSavedAgentConfig, agentDescription: "" };
    result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'agentDescription', 'Agent description is required.')).toBe(true);
  });

  test('should fail if agentVersion is missing or empty', () => {
     let data: any = { ...baseSavedAgentConfig, agentVersion: undefined };
    let result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'agentVersion', 'Agent version is required.')).toBe(true);

    data = { ...baseSavedAgentConfig, agentVersion: "" };
    result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'agentVersion', 'Agent version is required.')).toBe(true);
  });

  test('should fail if config is missing', () => {
    const data = { ...baseSavedAgentConfig, config: undefined };
    const result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'config', 'Required')).toBe(true);
  });

  test('should fail for invalid field types', () => {
    let data: any = { ...baseSavedAgentConfig, agentName: 123 };
    let result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'agentName', 'Expected string, received number')).toBe(true);

    data = { ...baseSavedAgentConfig, isFavorite: "not-a-boolean" };
    result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'isFavorite', 'Expected boolean, received string')).toBe(true);

    data = { ...baseSavedAgentConfig, tags: "not-an-array" };
    result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'tags', 'Expected array, received string')).toBe(true);
    
    data = { ...baseSavedAgentConfig, createdAt: "invalid-date" };
    result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'createdAt', 'Invalid datetime')).toBe(true);
  });

  test('should fail if config object is invalid (e.g., missing type)', () => {
    const data = { ...baseSavedAgentConfig, config: {} }; // Missing type
    const result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    // Error path might be 'config.type' or a more generic error about discriminated union
    if (!result.success) {
        const hasError = result.error.errors.some(err => err.path.join('.') === 'config.type');
        expect(hasError).toBe(true);
    }
  });

   test('should fail if config type is llm but llm fields are missing', () => {
    const data = { ...baseSavedAgentConfig, config: { type: 'llm', framework: 'genkit' } }; // Missing llm specifics
    const result = savedAgentConfigurationSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
        expect(findError(result, 'config.agentModel', 'Agent model is required.')).toBe(true);
        expect(findError(result, 'config.agentGoal', 'Agent goal is required.')).toBe(true);
        expect(findError(result, 'config.agentTasks', 'At least one agent task is required.')).toBe(true);
    }
  });
});


describe('agentConfigSchema (discriminated union)', () => {
  test('should parse valid LLM config', () => {
    const result = agentConfigSchema.safeParse(baseLLMConfig);
    if (!result.success) console.error("Valid LLM Config Error:", result.error.issues);
    expect(result.success).toBe(true);
  });

  test('should parse valid Workflow config', () => {
    const result = agentConfigSchema.safeParse(baseWorkflowConfig);
     if (!result.success) console.error("Valid Workflow Config Error:", result.error.issues);
    expect(result.success).toBe(true);
  });

  test('should parse valid Custom config', () => {
    const result = agentConfigSchema.safeParse(baseCustomConfig);
    if (!result.success) console.error("Valid Custom Config Error:", result.error.issues);
    expect(result.success).toBe(true);
  });
  
  test('should parse valid A2A Specialist config', () => {
    const result = agentConfigSchema.safeParse(baseA2ASpecialistConfig);
    if (!result.success) console.error("Valid A2A Config Error:", result.error.issues);
    expect(result.success).toBe(true);
  });

  test('should fail for invalid type in discriminated union', () => {
    const data = { ...baseLLMConfig, type: 'invalidType' };
    const result = agentConfigSchema.safeParse(data as any); // Cast to any to bypass TS error for test
    expect(result.success).toBe(false);
    if (!result.success) {
      // Zod's error for discriminated union might be specific
      const hasDiscriminatedUnionError = result.error.errors.some(err => 
        err.message.includes("Invalid discriminator value") || err.code === "invalid_union_discriminator"
      );
      expect(hasDiscriminatedUnionError).toBe(true);
    }
  });

  describe('llmAgentConfigSchemaUpdated', () => {
    test('should fail if agentGoal is missing', () => {
      const data = { ...baseLLMConfig, agentGoal: undefined };
      const result = llmAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'agentGoal', 'Agent goal is required.')).toBe(true);
    });

    test('should fail if agentTasks is missing or empty', () => {
      let data: any = { ...baseLLMConfig, agentTasks: undefined };
      let result = llmAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'agentTasks', 'At least one agent task is required.')).toBe(true);

      data = { ...baseLLMConfig, agentTasks: [] };
      result = llmAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'agentTasks', 'At least one agent task is required.')).toBe(true);
    });
    
    test('should fail if agentTasks contains empty strings', () => {
      const data = { ...baseLLMConfig, agentTasks: [""] };
      const result = llmAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'agentTasks.0', 'Task cannot be empty.')).toBe(true);
    });

    test('should fail if agentModel is missing', () => {
      const data = { ...baseLLMConfig, agentModel: undefined };
      const result = llmAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'agentModel', 'Agent model is required.')).toBe(true);
    });

    test('should fail for invalid agentTemperature', () => {
      let data: any = { ...baseLLMConfig, agentTemperature: "not-a-number" };
      let result = llmAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'agentTemperature', 'Expected number, received string')).toBe(true);

      data = { ...baseLLMConfig, agentTemperature: -1 };
      result = llmAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'agentTemperature', 'Number must be greater than or equal to 0')).toBe(true);
      
      data = { ...baseLLMConfig, agentTemperature: 3 };
      result = llmAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'agentTemperature', 'Number must be less than or equal to 2')).toBe(true);
    });
  });

  describe('workflowAgentConfigSchemaUpdated', () => {
    test('should fail if detailedWorkflowType is missing', () => {
      const data = { ...baseWorkflowConfig, detailedWorkflowType: undefined };
      const result = workflowAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'detailedWorkflowType', 'Detailed workflow type is required.')).toBe(true);
    });
    
    test('should fail if workflowDescription is missing or empty', () => {
      let data: any = { ...baseWorkflowConfig, workflowDescription: undefined };
      let result = workflowAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'workflowDescription', 'Workflow description is required.')).toBe(true);
      
      data = { ...baseWorkflowConfig, workflowDescription: "" };
      result = workflowAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'workflowDescription', 'Workflow description is required.')).toBe(true);
    });

    test('should fail if loopMaxIterations is not positive', () => {
      let data = { ...baseWorkflowConfig, detailedWorkflowType: 'loop' as const, loopMaxIterations: 0 };
      let result = workflowAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'loopMaxIterations', 'Number must be greater than 0')).toBe(true);
      
      data = { ...baseWorkflowConfig, detailedWorkflowType: 'loop' as const, loopMaxIterations: -1 };
      result = workflowAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'loopMaxIterations', 'Number must be greater than 0')).toBe(true);
    });
  });

  describe('customAgentConfigSchemaUpdated', () => {
    test('should fail if customLogicDescription is missing or empty', () => {
      let data: any = { ...baseCustomConfig, customLogicDescription: undefined };
      let result = customAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'customLogicDescription', 'Custom logic description is required.')).toBe(true);

      data = { ...baseCustomConfig, customLogicDescription: "" };
      result = customAgentConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, 'customLogicDescription', 'Custom logic description is required.')).toBe(true);
    });
  });
  
  describe('a2aAgentSpecialistConfigSchemaUpdated', () => {
    // This schema currently only enforces type: 'a2a' and inherits base fields.
    // No additional required fields specific to this schema itself.
    test('should parse valid A2A specialist config (minimal)', () => {
      const data = { type: 'a2a', framework: 'genkit' }; // Only type is strictly from this schema, framework from base
      const result = a2aAgentSpecialistConfigSchemaUpdated.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});


// Unit tests for more granular schemas

describe('toolConfigFieldSchema', () => {
  const baseField = { key: 'apiKey', label: 'API Key', fieldType: 'text' as const };

  test('should parse valid data', () => {
    expect(toolConfigFieldSchema.safeParse(baseField).success).toBe(true);
    expect(toolConfigFieldSchema.safeParse({ ...baseField, required: true, placeholder: 'Enter API Key', helpText: 'Your API key' }).success).toBe(true);
    expect(toolConfigFieldSchema.safeParse({ ...baseField, fieldType: 'number', defaultValue: 123 }).success).toBe(true);
    expect(toolConfigFieldSchema.safeParse({ ...baseField, fieldType: 'select', options: [{value: 'a', label: 'A'}] }).success).toBe(true);

  });

  test('should fail if key, label, or fieldType are missing', () => {
    let result = toolConfigFieldSchema.safeParse({ ...baseField, key: undefined });
    if (!result.success) expect(findError(result, 'key', 'Required')).toBe(true);

    result = toolConfigFieldSchema.safeParse({ ...baseField, label: undefined });
    if (!result.success) expect(findError(result, 'label', 'Required')).toBe(true);
    
    result = toolConfigFieldSchema.safeParse({ ...baseField, fieldType: undefined });
    if (!result.success) expect(findError(result, 'fieldType', 'Required')).toBe(true);
  });

  test('should fail for invalid fieldType', () => {
    const result = toolConfigFieldSchema.safeParse({ ...baseField, fieldType: 'invalidInput' });
    if (!result.success) expect(findError(result, 'fieldType', "Invalid enum value.")).toBe(true);
  });
   
  test('should require options for select fieldType', () => {
    const result = toolConfigFieldSchema.safeParse({ ...baseField, fieldType: 'select', options: undefined });
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'options', 'Options are required for select field type')).toBe(true);
  });
});

describe('communicationChannelSchema', () => {
  const baseChannel = { id: 'ch1', name: 'Default Channel', direction: 'outbound' as const, messageFormat: 'json' as const, syncMode: 'async' as const };
  
  test('should parse valid data', () => {
    expect(communicationChannelSchema.safeParse(baseChannel).success).toBe(true);
    expect(communicationChannelSchema.safeParse({ ...baseChannel, endpoint: 'http://example.com/hook', targetAgentId: 'agent2' }).success).toBe(true);
  });

  test('should fail for missing required fields', () => {
    for (const field of ['id', 'name', 'direction', 'messageFormat', 'syncMode']) {
      const data = { ...baseChannel, [field]: undefined };
      const result = communicationChannelSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, field, 'Required')).toBe(true);
    }
  });
  
  test('should fail for invalid enum values', () => {
    let result = communicationChannelSchema.safeParse({ ...baseChannel, direction: 'invalid' });
    if (!result.success) expect(findError(result, 'direction')).toBe(true);
    result = communicationChannelSchema.safeParse({ ...baseChannel, messageFormat: 'invalid' });
    if (!result.success) expect(findError(result, 'messageFormat')).toBe(true);
    result = communicationChannelSchema.safeParse({ ...baseChannel, syncMode: 'invalid' });
    if (!result.success) expect(findError(result, 'syncMode')).toBe(true);
  });

  test('should validate endpoint and brokerUrl as URL or empty string if present', () => {
    expect(communicationChannelSchema.safeParse({ ...baseChannel, endpoint: '' }).success).toBe(true); // empty is valid
    expect(communicationChannelSchema.safeParse({ ...baseChannel, brokerUrl: '' }).success).toBe(true); // empty is valid

    let result = communicationChannelSchema.safeParse({ ...baseChannel, endpoint: 'not-a-url' });
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'endpoint', 'Invalid url')).toBe(true);
    
    result = communicationChannelSchema.safeParse({ ...baseChannel, brokerUrl: 'not-a-url' });
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'brokerUrl', 'Invalid url')).toBe(true);
  });
});

describe('artifactDefinitionSchema', () => {
  const baseArtifactDef = { id: 'art1', name: 'report.pdf', description: 'Generated report', mimeType: 'application/pdf' };

  test('should parse valid data', () => {
    expect(artifactDefinitionSchema.safeParse(baseArtifactDef).success).toBe(true);
    expect(artifactDefinitionSchema.safeParse({ ...baseArtifactDef, required: true, accessPermissions: 'read' as const, versioningEnabled: true }).success).toBe(true);
  });
  
  test('should fail for missing required fields', () => {
     for (const field of ['id', 'name', 'description', 'mimeType']) {
      const data = { ...baseArtifactDef, [field]: undefined };
      const result = artifactDefinitionSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, field, 'Required')).toBe(true);
    }
  });
});

describe('initialStateValueSchema', () => {
  const baseInitialState = { key: 'userRole', value: '"admin"', scope: 'AGENT' as const };
  test('should parse valid data', () => {
    expect(initialStateValueSchema.safeParse(baseInitialState).success).toBe(true);
    expect(initialStateValueSchema.safeParse({ ...baseInitialState, description: 'User role setting' }).success).toBe(true);
  });
   test('should fail for missing required fields', () => {
     for (const field of ['key', 'value', 'scope']) {
      const data = { ...baseInitialState, [field]: undefined };
      const result = initialStateValueSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, field, 'Required')).toBe(true);
    }
  });
});

describe('stateValidationRuleSchema', () => {
  const baseRule = { id: 'rule1', name: 'UserSchema', type: 'JSON_SCHEMA' as const, rule: '{}' };
  test('should parse valid data', () => {
    expect(stateValidationRuleSchema.safeParse(baseRule).success).toBe(true);
  });
  test('should fail for missing required fields', () => {
     for (const field of ['id', 'name', 'type', 'rule']) {
      const data = { ...baseRule, [field]: undefined };
      const result = stateValidationRuleSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, field, 'Required')).toBe(true);
    }
  });
});

describe('knowledgeSourceSchema', () => {
  const baseKnowledge = { id: 'ks1', name: 'Product FAQ', type: 'url' as const, path: 'http://example.com/faq' };
  test('should parse valid data', () => {
    expect(knowledgeSourceSchema.safeParse(baseKnowledge).success).toBe(true);
    expect(knowledgeSourceSchema.safeParse({ ...baseKnowledge, type: 'text_chunk' as const, content: 'Some text', path: undefined }).success).toBe(true);
  });
   test('should fail for missing required fields', () => {
     for (const field of ['id', 'name', 'type']) { // path/content are conditional / optional based on type in a real sense, but not strictly by Zod without superRefine
      const data = { ...baseKnowledge, [field]: undefined };
      const result = knowledgeSourceSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, field, 'Required')).toBe(true);
    }
  });
});

describe('a2aConfigSchema', () => {
  const baseA2A = { enabled: true, communicationChannels: [ { id: 'ch1', name: 'Default Channel', direction: 'outbound' as const, messageFormat: 'json' as const, syncMode: 'async' as const } ] };
  test('should parse valid data', () => {
    expect(a2aConfigSchema.safeParse(baseA2A).success).toBe(true);
    expect(a2aConfigSchema.safeParse({ enabled: false }).success).toBe(true); // Other fields optional if not enabled
  });
  test('should fail if communicationChannels contains invalid object', () => {
    const data = { ...baseA2A, communicationChannels: [{ id: 'ch1' }] }; // Missing fields in channel
    const result = a2aConfigSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'communicationChannels.0.name')).toBe(true);
  });
});

describe('artifactsConfigSchema', () => {
  const baseArtifacts = { enabled: true, storageType: 'memory' as const, definitions: [ { id: 'art1', name: 'report.pdf', description: 'Generated report', mimeType: 'application/pdf' } ] };
  test('should parse valid data', () => {
    expect(artifactsConfigSchema.safeParse(baseArtifacts).success).toBe(true);
     expect(artifactsConfigSchema.safeParse({ enabled: false }).success).toBe(true);
  });
   test('should fail if definitions contains invalid object', () => {
    const data = { ...baseArtifacts, definitions: [{ id: 'art1' }] }; // Missing fields in definition
    const result = artifactsConfigSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'definitions.0.name')).toBe(true);
  });
});

describe('statePersistenceConfigSchema', () => {
  const baseState = { enabled: true, type: 'session' as const, defaultScope: 'AGENT' as const };
  test('should parse valid data', () => {
    expect(statePersistenceConfigSchema.safeParse(baseState).success).toBe(true);
    expect(statePersistenceConfigSchema.safeParse({ enabled: false }).success).toBe(true);
  });
  test('should fail for invalid type or scope if enabled', () => {
    let result = statePersistenceConfigSchema.safeParse({ ...baseState, type: 'invalid' });
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'type')).toBe(true);
    
    result = statePersistenceConfigSchema.safeParse({ ...baseState, defaultScope: 'invalid' });
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'defaultScope')).toBe(true);
  });
});

describe('ragMemoryConfigSchema', () => {
  const baseRAG = { enabled: true, serviceType: 'in-memory' as const };
  test('should parse valid data', () => {
    expect(ragMemoryConfigSchema.safeParse(baseRAG).success).toBe(true);
    expect(ragMemoryConfigSchema.safeParse({ enabled: false }).success).toBe(true);
    const fullRag = {
      ...baseRAG,
      knowledgeSources: [{ id: 'ks1', name: 'Doc', type: 'url' as const, path: 'http://example.com' }],
      retrievalParameters: { topK: 5, similarityThreshold: 0.75 },
      persistentMemory: { enabled: true, storagePath: '/data' },
      embeddingModel: 'text-embedding-004',
      includeConversationContext: true,
    };
    expect(ragMemoryConfigSchema.safeParse(fullRag).success).toBe(true);
  });
  
  test('should fail for invalid retrievalParameters if enabled', () => {
    let data: any = { ...baseRAG, retrievalParameters: { topK: 0 } }; // Not positive
    let result = ragMemoryConfigSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'retrievalParameters.topK', 'Number must be greater than 0')).toBe(true);

    data = { ...baseRAG, retrievalParameters: { similarityThreshold: 1.1 } }; // > 1
    result = ragMemoryConfigSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'retrievalParameters.similarityThreshold', 'Number must be less than or equal to 1')).toBe(true);
  });
});

describe('availableToolSchema', () => {
  const baseTool = { id: 'tool1', name: 'My Tool', label: 'My Test Tool', type: 'genkit_native' as const };
  test('should parse valid data', () => {
    expect(availableToolSchema.safeParse(baseTool).success).toBe(true);
    expect(availableToolSchema.safeParse({ ...baseTool, type: 'openapi' as const, openapiSpecUrl: 'http://example.com/openapi.json' }).success).toBe(true);
  });
  test('should fail for missing required fields', () => {
    for (const field of ['id', 'name', 'label', 'type']) {
      const data = { ...baseTool, [field]: undefined };
      const result = availableToolSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) expect(findError(result, field, 'Required')).toBe(true);
    }
  });
  test('should fail for invalid type enum', () => {
    const result = availableToolSchema.safeParse({ ...baseTool, type: 'invalid_type' });
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'type')).toBe(true);
  });
});

describe('toolConfigDataSchema', () => {
  test('should parse valid record data', () => {
    expect(toolConfigDataSchema.safeParse({ apiKey: '123', region: 'us-east-1' }).success).toBe(true);
    expect(toolConfigDataSchema.safeParse({}).success).toBe(true); // Empty object is a valid record
  });
  // This schema is z.record(z.string(), z.any()), so it's very permissive.
  // Testing non-object would fail, but that's usually caught by parent schemas.
});

describe('adkCallbacksConfigSchema', () => {
  const baseCallbacks = { beforeAgent: 'beforeAgentFlow' };
  test('should parse valid callback strings', () => {
    expect(adkCallbacksConfigSchema.safeParse(baseCallbacks).success).toBe(true);
    expect(adkCallbacksConfigSchema.safeParse({ ...baseCallbacks, afterTool: 'afterToolFlow' }).success).toBe(true);
    expect(adkCallbacksConfigSchema.safeParse({}).success).toBe(true); // All fields optional
  });
  test('should fail if a callback is not a string', () => {
    const result = adkCallbacksConfigSchema.safeParse({ beforeAgent: 123 });
    expect(result.success).toBe(false);
    if (!result.success) expect(findError(result, 'beforeAgent', 'Expected string, received number')).toBe(true);
  });
});
