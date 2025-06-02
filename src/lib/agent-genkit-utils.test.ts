const { constructSystemPromptForGenkit } = require('./agent-genkit-utils');
// Type imports removed as this file is now treated as plain JavaScript for Jest.
// The defaultConfig object's structure implicitly defines what an LLMAgentConfig should look like for testing.

// Plain JavaScript for Jest compatibility in this environment
function createMockLLMAgentConfig(overridesParam) {
  const overrides = overridesParam || {};
  // LLMAgentConfig structure is maintained by the object literal.
  // Type imports for StatePersistenceConfig, RagMemoryConfig, etc. are removed as 'as' assertions are removed.
  const defaultConfig/*: LLMAgentConfig*/ = {
    type: 'llm',
    framework: 'genkit',
    agentGoal: '',
    agentTasks: [],
    agentPersonality: '',
    agentRestrictions: [],
    globalInstruction: '',
    agentModel: 'gemini-pro',
    agentTemperature: 0.7,
    systemPromptGenerated: '',
    safetySettings: [],
    isRootAgent: false,
    subAgentIds: [],
    statePersistence: { enabled: false, type: 'session', defaultScope: 'AGENT', initialStateValues: [], validationRules: [] },
    rag: { enabled: false, serviceType: 'in-memory', knowledgeSources: [] },
    artifacts: { enabled: false, storageType: 'memory', definitions: [] },
    a2a: { enabled: false, communicationChannels: [], defaultResponseFormat: 'json', maxMessageSize: 1024, loggingEnabled: false },
    genkitFlowName: '',
    inputSchema: '',
    outputSchema: '',
    adkCallbacks: {},
  };

  return { ...defaultConfig, ...overrides };
};

describe('constructSystemPromptForGenkit', () => {
  it('Test 1: Full LLM Config - should concatenate all fields correctly', () => {
    const fullConfig/*: LLMAgentConfig*/ = createMockLLMAgentConfig({ // Type annotation commented out
      globalInstruction: 'Global Intro.',
      agentGoal: 'Achieve global peace.',
      agentTasks: ['Negotiate treaties.', 'Promote understanding.'],
      agentPersonality: 'Calm and Emapthetic.',
      agentRestrictions: ['No violence.', 'Only truth.'],
    });

    const expectedPrompt =
`Global Intro.

MAIN GOAL:
Achieve global peace.

KEY TASKS:
- Negotiate treaties.
- Promote understanding.

PERSONA/TONE:
Calm and Emapthetic.

IMPORTANT RESTRICTIONS:
- No violence.
- Only truth.`;
    expect(constructSystemPromptForGenkit(fullConfig)).toBe(expectedPrompt);
  });

  it('Test 2: LLM Config with Some Missing Optional Fields - should handle missing fields gracefully', () => {
    const partialConfig/*: LLMAgentConfig*/ = createMockLLMAgentConfig({ // Type annotation commented out
      agentGoal: 'Test a specific feature.',
      agentTasks: ['Write unit test.', 'Document results.'],
      // globalInstruction, agentPersonality, agentRestrictions are missing
    });

    const expectedPrompt =
`MAIN GOAL:
Test a specific feature.

KEY TASKS:
- Write unit test.
- Document results.`;
    expect(constructSystemPromptForGenkit(partialConfig)).toBe(expectedPrompt);
  });

  it('Test 3: LLM Config with All Prompt Fields Empty - should return an empty string', () => {
    const emptyConfig/*: LLMAgentConfig*/ = createMockLLMAgentConfig({ // Type annotation commented out
      globalInstruction: '',
      agentGoal: '',
      agentTasks: [],
      agentPersonality: '',
      agentRestrictions: [],
    });
    expect(constructSystemPromptForGenkit(emptyConfig)).toBe("");

    const undefinedConfig/*: LLMAgentConfig*/ = createMockLLMAgentConfig({ // Type annotation commented out
        // All prompt fields are undefined via default mock creation
    });
    expect(constructSystemPromptForGenkit(undefinedConfig)).toBe("");
  });

  it('Test 4: LLM Config with only globalInstruction', () => {
    const globalOnlyConfig/*: LLMAgentConfig*/ = createMockLLMAgentConfig({ // Type annotation commented out
      globalInstruction: 'This is a global instruction only.',
    });
    expect(constructSystemPromptForGenkit(globalOnlyConfig)).toBe('This is a global instruction only.');
  });

  it('Test 5: LLM Config with only agentGoal', () => {
    const goalOnlyConfig/*: LLMAgentConfig*/ = createMockLLMAgentConfig({ // Type annotation commented out
      agentGoal: 'Achieve this one goal.',
    });
    expect(constructSystemPromptForGenkit(goalOnlyConfig)).toBe('MAIN GOAL:\nAchieve this one goal.');
  });

  it('Test 6: LLM Config with tasks having leading/trailing spaces', () => {
    const configWithSpacedTasks/*: LLMAgentConfig*/ = createMockLLMAgentConfig({ // Type annotation commented out
      agentTasks: ['  Task A  ', 'Task B  ', '  Task C'],
    });
    const expectedPrompt =
`KEY TASKS:
- Task A
- Task B
- Task C`;
    expect(constructSystemPromptForGenkit(configWithSpacedTasks)).toBe(expectedPrompt);
  });

});
