import {
  aiConfigurationAssistantFlow,
  AiConfigurationAssistantInputSchema, // Will be used for constructing input
  AiConfigurationAssistantOutputSchema,
  getWorkflowDetailedType
} from './aiConfigurationAssistantFlow';
import { ai } from '@/ai/genkit';
// gemini10Pro is used within the flow, but we mock ai.generate, so direct import might not be needed for mocking.
// import { gemini10Pro } from '@genkit-ai/googleai';
// allTools might be large, so using a simplified mock as requested.
// import { allTools as mockAvailableTools } from '@/data/agent-builder/available-tools';
import * as z from 'zod';
import { SavedAgentConfiguration, LLMAgentConfig, WorkflowDetailedType } from '@/types/unified-agent-types';

// Mock @/ai/genkit and specifically the generate function
// We need to mock the ai object and its generate method.
const mockedAiGenerate = jest.fn();
jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: mockedAiGenerate, // Use the mock function here
    defineFlow: jest.requireActual('@/ai/genkit').ai.defineFlow, // Keep actual defineFlow
  },
}));

// Simplified mock for available tools as the actual one might be large/complex.
const simplifiedMockTools = [
  { id: 'tool1', name: 'Search Tool', description: 'Searches things.', configFields: [{ id: 'apiKey', label: 'API Key', type: 'text' }], genkitToolName: 'searchToolGenkit' },
  { id: 'tool2', name: 'Calculator', description: 'Calculates math.', configFields: [], genkitToolName: 'calculatorGenkit' },
  { id: 'tool3', name: 'Custom API Tool', description: 'Connects to API.', configFields: [{id: 'endpoint', label: 'API Endpoint', type: 'text'}, {id: 'spec', label: 'API Spec (JSON)', type: 'json'}], genkitToolName: 'customApiToolGenkit' },
];

// Mock the allTools import from '@/data/agent-builder/available-tools'
// This is important because the flow itself imports `allTools` directly.
jest.mock('@/data/agent-builder/available-tools', () => ({
  allTools: simplifiedMockTools,
}));


describe('aiConfigurationAssistantFlow', () => {
  beforeEach(() => {
    // Clears mock usage data between tests (e.g., number of calls)
    mockedAiGenerate.mockClear();
    // Reset any implementations to default if they were changed in a test
    mockedAiGenerate.mockReset();
  });

  it('should successfully suggest fullConfig with tools and configData', async () => {
    const mockInput = {
      agentGoal: 'Test goal',
      agentTasks: ['Test task 1', 'Test task 2'],
      suggestionContext: 'fullConfig' as const,
      currentTools: [
        { id: 'tool2', name: 'Calculator', description: 'Calculates math.' },
        { id: 'existingToolWithConfig', name: 'Existing Tool', description: 'Has config.', configData: { setting: 'value' } }
      ],
    };

    const mockLLMResponse = {
      suggestedPersonality: "Helpful assistant",
      suggestedRestrictions: ["No financial advice"],
      suggestedModel: "gemini-1.5-pro-latest",
      suggestedTemperature: 0.6,
      suggestedTools: [
        { id: "tool1", name: "Search Tool", description: "Searches things.", suggestedConfigData: {"apiKey": "YOUR_API_KEY"} },
        { id: "tool3", name: "Custom API Tool", description: "Connects to API.", suggestedConfigData: {"endpoint": "https://api.example.com/data", "spec": {"openapi": "3.0.0"}} }
      ]
    };
    mockedAiGenerate.mockResolvedValue({
      text: () => JSON.stringify(mockLLMResponse),
    });

    const result = await aiConfigurationAssistantFlow(mockInput);

    expect(mockedAiGenerate).toHaveBeenCalledTimes(1);
    const promptArg = mockedAiGenerate.mock.calls[0][0].prompt;
    expect(promptArg).toContain(mockInput.agentGoal);
    expect(promptArg).toContain(mockInput.agentTasks[0]);
    expect(promptArg).toContain("ConfigFields: " + JSON.stringify(simplifiedMockTools[0].configFields)); // Check if config fields are in prompt
    expect(promptArg).toContain("Current Configuration: " + JSON.stringify(mockInput.currentTools[1].configData)); // Check currentTools info
    expect(promptArg).toContain("provide a `suggestedConfigData` object"); // Check instruction for configData

    // Validate the structure and content of the result
    const parsedResult = AiConfigurationAssistantOutputSchema.parse(result);
    expect(parsedResult.suggestedPersonality).toBe(mockLLMResponse.suggestedPersonality);
    expect(parsedResult.suggestedTools).toEqual(mockLLMResponse.suggestedTools);
    expect(parsedResult.suggestedTools?.[0].suggestedConfigData).toEqual({apiKey: "YOUR_API_KEY"});
  });

  it('should successfully suggest tools with configData for "tools" context', async () => {
    const mockFullAgentConfig: SavedAgentConfiguration = {
      id: 'agent1',
      agentName: 'Test Agent',
      agentDescription: 'An agent for testing.',
      agentVersion: '1.0',
      config: {
        type: 'llm',
        framework: 'genkit',
        agentGoal: 'To be tested',
        agentTasks: ['get tested'],
      } as LLMAgentConfig,
      tools: ['tool2'],
      toolsDetails: [{ id: 'tool2', name: 'Calculator', description: 'Calculates math.' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const mockInput = {
      fullAgentConfig: mockFullAgentConfig,
      suggestionContext: 'tools' as const,
      currentTools: [{ id: 'tool2', name: 'Calculator', description: 'Calculates math.' }],
    };
    const mockLLMResponse = {
      suggestedTools: [
        { id: "tool1", name: "Search Tool", description: "Searches things.", suggestedConfigData: {"apiKey": "YOUR_TOOL1_KEY"} },
      ]
    };
    mockedAiGenerate.mockResolvedValue({
      text: () => JSON.stringify(mockLLMResponse),
    });

    const result = await aiConfigurationAssistantFlow(mockInput);

    expect(mockedAiGenerate).toHaveBeenCalledTimes(1);
    const promptArg = mockedAiGenerate.mock.calls[0][0].prompt;
    expect(promptArg).toContain(JSON.stringify(mockFullAgentConfig)); // Check that current config is in prompt
    expect(promptArg).toContain("ConfigFields: " + JSON.stringify(simplifiedMockTools[0].configFields));
    expect(promptArg).toContain("provide a `suggestedConfigData` object");

    const parsedResult = AiConfigurationAssistantOutputSchema.parse(result);
    expect(parsedResult.suggestedTools).toEqual(mockLLMResponse.suggestedTools);
  });

  it('should return empty object for "fullConfig" if agentGoal is missing', async () => {
    const mockInput = {
      agentGoal: '', // Empty goal
      agentTasks: ['Test task 1'],
      suggestionContext: 'fullConfig' as const,
    };
    // No mock for ai.generate needed as it might not be called or its result ignored.

    const result = await aiConfigurationAssistantFlow(mockInput);

    // It should return a valid empty object according to the schema
    expect(result).toEqual(AiConfigurationAssistantOutputSchema.parse({}));
    expect(mockedAiGenerate).not.toHaveBeenCalled();
  });

  it('should handle malformed JSON response from LLM and return empty object', async () => {
    const mockInput = {
      agentGoal: 'Test goal',
      agentTasks: ['Test task 1'],
      suggestionContext: 'fullConfig' as const,
    };
    mockedAiGenerate.mockResolvedValue({
      text: () => "this is not json",
    });
    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await aiConfigurationAssistantFlow(mockInput);

    expect(result).toEqual(AiConfigurationAssistantOutputSchema.parse({}));
    expect(mockedAiGenerate).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled(); // Check if error was logged

    consoleErrorSpy.mockRestore(); // Restore console.error
  });

  it('should handle empty response text from LLM and return empty object', async () => {
    const mockInput = {
      agentGoal: 'Test goal',
      agentTasks: ['Test task 1'],
      suggestionContext: 'fullConfig' as const,
    };
    mockedAiGenerate.mockResolvedValue({
      text: () => "", // Empty response text
    });
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});


    const result = await aiConfigurationAssistantFlow(mockInput);

    expect(result).toEqual(AiConfigurationAssistantOutputSchema.parse({}));
    expect(mockedAiGenerate).toHaveBeenCalledTimes(1);
    // Check if a warning about empty response was logged (implementation specific)
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("LLM returned an empty response"));
    consoleWarnSpy.mockRestore();
  });

  it('should handle LLM response without text() method and return empty object', async () => {
    const mockInput = {
        agentGoal: 'Test goal',
        agentTasks: ['Test task 1'],
        suggestionContext: 'fullConfig' as const,
    };
    mockedAiGenerate.mockResolvedValue({}); // No text() method
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await aiConfigurationAssistantFlow(mockInput);

    expect(result).toEqual(AiConfigurationAssistantOutputSchema.parse({}));
    expect(mockedAiGenerate).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("LLM returned an empty response"));
    consoleWarnSpy.mockRestore();
  });


  it('should suggest agentName for "agentName" context', async () => {
    const mockFullAgentConfig: SavedAgentConfiguration = {
      id: 'agent1', agentName: 'Old Name', agentDescription: '', agentVersion: '1.0',
      config: { type: 'llm', framework: 'genkit', agentGoal: 'Goal', agentTasks: ['Task'] } as LLMAgentConfig,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    const mockInput = {
      fullAgentConfig: mockFullAgentConfig,
      suggestionContext: 'agentName' as const,
    };
    const mockLLMResponse = { suggestedName: "Super Agent" };
    mockedAiGenerate.mockResolvedValue({
      text: () => JSON.stringify(mockLLMResponse),
    });

    const result = await aiConfigurationAssistantFlow(mockInput);

    expect(mockedAiGenerate).toHaveBeenCalledTimes(1);
    const promptArg = mockedAiGenerate.mock.calls[0][0].prompt;
    expect(promptArg).toContain("Suggest a creative and descriptive name for this agent.");

    const parsedResult = AiConfigurationAssistantOutputSchema.parse(result);
    expect(parsedResult.suggestedName).toBe("Super Agent");
  });
});


describe('getWorkflowDetailedType', () => {
  beforeEach(() => {
    mockedAiGenerate.mockClear();
    mockedAiGenerate.mockReset();
  });

  it('should correctly suggest "sequential"', async () => {
    const query = "Tasks should be done one after another.";
    mockedAiGenerate.mockResolvedValue({
      text: () => JSON.stringify({ suggestedWorkflowType: "sequential" }),
    });

    const result = await getWorkflowDetailedType(query);
    expect(result).toBe("sequential");
    expect(mockedAiGenerate).toHaveBeenCalledTimes(1);
    expect(mockedAiGenerate.mock.calls[0][0].prompt).toContain(query);
  });

  it('should correctly suggest "parallel"', async () => {
    const query = "These tasks can run at the same time.";
    mockedAiGenerate.mockResolvedValue({
      text: () => JSON.stringify({ suggestedWorkflowType: "parallel" }),
    });

    const result = await getWorkflowDetailedType(query);
    expect(result).toBe("parallel");
    expect(mockedAiGenerate).toHaveBeenCalledTimes(1);
  });

  it('should default to "sequential" if LLM returns an unexpected type', async () => {
    const query = "Some query.";
    mockedAiGenerate.mockResolvedValue({
      text: () => JSON.stringify({ suggestedWorkflowType: "unknown_type" }),
    });
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await getWorkflowDetailedType(query);

    expect(result).toBe("sequential"); // Default value
    expect(mockedAiGenerate).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("LLM returned an unexpected workflow type: 'unknown_type'"));
    consoleWarnSpy.mockRestore();
  });

  it('should default to "sequential" and log error if LLM returns malformed JSON', async () => {
    const query = "Some other query.";
    mockedAiGenerate.mockResolvedValue({
      text: () => "this is not valid json",
    });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getWorkflowDetailedType(query);

    expect(result).toBe("sequential"); // Default value
    expect(mockedAiGenerate).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled(); // Check if error was logged
    consoleErrorSpy.mockRestore();
  });

  it('should default to "sequential" if ai.generate call fails', async () => {
    const query = "A failing query";
    mockedAiGenerate.mockRejectedValue(new Error("LLM call failed"));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getWorkflowDetailedType(query);

    expect(result).toBe("sequential");
    expect(mockedAiGenerate).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error determining workflow type"), expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});

// Helper to create a minimal SavedAgentConfiguration for tests
const createMockSavedAgentConfig = (override?: Partial<SavedAgentConfiguration>): SavedAgentConfiguration => {
  const defaultConfig: SavedAgentConfiguration = {
    id: 'agent-test-123',
    agentName: 'Test Agent',
    agentDescription: 'A test agent description.',
    agentVersion: '1.0.0',
    config: {
      type: 'llm',
      framework: 'genkit',
      agentGoal: 'Perform test operations.',
      agentTasks: ['task1', 'task2'],
      agentModel: 'gemini-1.0-pro',
      agentTemperature: 0.7,
    } as LLMAgentConfig,
    tools: [],
    toolsDetails: [],
    toolConfigsApplied: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTemplate: false,
    userId: 'user-test-id',
  };
  return { ...defaultConfig, ...override };
};
