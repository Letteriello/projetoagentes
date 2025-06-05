// ===== IMPORTS =====
import { 
  aiConfigurationAssistantFlow, 
  AiConfigurationAssistantOutputSchema, 
  getWorkflowDetailedType 
} from './aiConfigurationAssistantFlow';
import { ai } from '@/ai/genkit';
import * as z from 'zod';
<<<<<<< HEAD
import { createMockSavedAgentConfig as createMockAgent, baseLLMConfig, baseAgentConfig, mockActionContext } from './test-utils';
import type { LLMAgentConfig, SavedAgentConfiguration } from '@/types/agent-configs-fixed';
=======
import { SavedAgentConfiguration, LLMAgentConfig, WorkflowDetailedType } from '@/types/unified-agent-types';
>>>>>>> b49d3373ebd7f0451b28edd3f3d051cfa4caec3b

// ===== MOCKS CENTRAIS =====
// Se precisar de mocks de tools, defina-os localmente ou centralize no test-utils.ts
const simplifiedMockTools = [
  { id: 'tool1', name: 'Search Tool', description: 'Searches things.', configFields: [{ id: 'apiKey', label: 'API Key', type: 'text' }], genkitToolName: 'searchToolGenkit' },
  { id: 'tool2', name: 'Calculator', description: 'Calculates math.', configFields: [], genkitToolName: 'calculatorGenkit' },
  { id: 'tool3', name: 'Custom API Tool', description: 'Connects to API.', configFields: [{id: 'endpoint', label: 'API Endpoint', type: 'text'}, {id: 'spec', label: 'API Spec (JSON)', type: 'json'}], genkitToolName: 'customApiToolGenkit' },
];

jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: jest.fn(), 
    defineFlow: jest.requireActual('@/ai/genkit').ai.defineFlow, 
  },
}));

jest.mock('@/data/agent-builder/available-tools', () => ({
  allTools: simplifiedMockTools,
}));

// ===== TESTES =====
describe('aiConfigurationAssistantFlow', () => {
  beforeEach(() => {
    // Clears mock usage data between tests (e.g., number of calls)
    jest.clearAllMocks();
  });

  it('should successfully suggest fullConfig with tools and configData', async () => {
    const mockInput: any = {
      agentGoal: 'Test goal',
      agentTasks: ['Test task 1', 'Test task 2'],
      suggestionContext: 'fullConfig',
      configData: {
        model: 'gpt-4',
        framework: 'openai'
      }
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
    (ai.generate as jest.Mock).mockResolvedValue({
      text: () => JSON.stringify(mockLLMResponse),
    });

    const result = await aiConfigurationAssistantFlow(mockInput);

    expect(ai.generate).toHaveBeenCalledTimes(1);
    const promptArg = (ai.generate as jest.Mock).mock.calls[0][0].prompt;
    expect(promptArg).toContain(mockInput.agentGoal);
    expect(promptArg).toContain(mockInput.agentTasks[0]);
    expect(promptArg).toContain("ConfigFields: " + JSON.stringify(simplifiedMockTools[0].configFields)); 
    expect(promptArg).toContain("Current Configuration: " + JSON.stringify(mockInput.configData)); 
    expect(promptArg).toContain("provide a `suggestedConfigData` object"); 

    const parsedResult = AiConfigurationAssistantOutputSchema.parse(result);
    expect(parsedResult.suggestedPersonality).toBe(mockLLMResponse.suggestedPersonality);
    expect(parsedResult.suggestedTools).toEqual(mockLLMResponse.suggestedTools);
    expect(parsedResult.suggestedTools?.[0].suggestedConfigData).toEqual({apiKey: "YOUR_API_KEY"});
  });

  it('should successfully suggest tools with configData for "tools" context', async () => {
    const mockFullAgentConfig: SavedAgentConfiguration = {
      ...createMockAgent(),
      id: 'agent1'
    };

    const mockInput = {
      fullAgentConfig: mockFullAgentConfig,
      suggestionContext: 'tools' as const,
    };

    const mockLLMResponse = {
      suggestedTools: [
        { id: "tool1", name: "Search Tool", description: "Searches things.", suggestedConfigData: {"apiKey": "YOUR_TOOL1_KEY"} },
      ]
    };
    (ai.generate as jest.Mock).mockResolvedValue({
      text: () => JSON.stringify(mockLLMResponse),
    });

    const result = await aiConfigurationAssistantFlow(mockInput);

    expect(ai.generate).toHaveBeenCalledTimes(1);
    const promptArg = (ai.generate as jest.Mock).mock.calls[0][0].prompt;
    expect(promptArg).toContain(JSON.stringify(mockFullAgentConfig)); 
    expect(promptArg).toContain("ConfigFields: " + JSON.stringify(simplifiedMockTools[0].configFields));
    expect(promptArg).toContain("provide a `suggestedConfigData` object");

    const parsedResult = AiConfigurationAssistantOutputSchema.parse(result);
    expect(parsedResult.suggestedTools).toEqual(mockLLMResponse.suggestedTools);
  });

  it('should return empty object for "fullConfig" if agentGoal is missing', async () => {
    const mockInput = {
      agentGoal: '', 
      agentTasks: ['Test task 1'],
      suggestionContext: 'fullConfig' as const,
    };
    const result = await aiConfigurationAssistantFlow(mockInput);

    expect(result).toEqual(AiConfigurationAssistantOutputSchema.parse({}));
    expect(ai.generate).not.toHaveBeenCalled();
  });

  it('should handle malformed JSON response from LLM and return empty object', async () => {
    const mockInput = {
      agentGoal: 'Test goal',
      agentTasks: ['Test task 1'],
      suggestionContext: 'fullConfig' as const,
    };
    (ai.generate as jest.Mock).mockResolvedValue({
      text: () => "this is not json",
    });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await aiConfigurationAssistantFlow(mockInput);

    expect(result).toEqual(AiConfigurationAssistantOutputSchema.parse({}));
    expect(ai.generate).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled(); 

    consoleErrorSpy.mockRestore(); 
  });

  it('should handle empty response text from LLM and return empty object', async () => {
    const mockInput = {
      agentGoal: 'Test goal',
      agentTasks: ['Test task 1'],
      suggestionContext: 'fullConfig' as const,
    };
    (ai.generate as jest.Mock).mockResolvedValue({
      text: () => "", 
    });
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await aiConfigurationAssistantFlow(mockInput);

    expect(result).toEqual(AiConfigurationAssistantOutputSchema.parse({}));
    expect(ai.generate).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("LLM returned an empty response"));
    consoleWarnSpy.mockRestore();
  });

  it('should handle LLM response without text() method and return empty object', async () => {
    const mockInput = {
      agentGoal: 'Test goal',
      agentTasks: ['Test task 1'],
      suggestionContext: 'fullConfig' as const,
    };
    (ai.generate as jest.Mock).mockResolvedValue({}); 
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await aiConfigurationAssistantFlow(mockInput);

    expect(result).toEqual(AiConfigurationAssistantOutputSchema.parse({}));
    expect(ai.generate).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("LLM returned an empty response"));
    consoleWarnSpy.mockRestore();
  });

  it('should suggest agentName for "agentName" context', async () => {
    const mockFullAgentConfig: SavedAgentConfiguration = {
      ...createMockAgent(),
      id: 'agent1',
      agentName: 'Old Name'
    };

    const mockInput = {
      fullAgentConfig: mockFullAgentConfig,
      suggestionContext: 'agentName' as const,
    };
    const mockLLMResponse = { suggestedName: "Super Agent" };
    (ai.generate as jest.Mock).mockResolvedValue({
      text: () => JSON.stringify(mockLLMResponse),
    });

    const result = await aiConfigurationAssistantFlow(mockInput);

    expect(ai.generate).toHaveBeenCalledTimes(1);
    const promptArg = (ai.generate as jest.Mock).mock.calls[0][0].prompt;
    expect(promptArg).toContain("Suggest a creative and descriptive name for this agent.");

    const parsedResult = AiConfigurationAssistantOutputSchema.parse(result);
    expect(parsedResult.suggestedName).toBe("Super Agent");
  });
});

describe('getWorkflowDetailedType', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should correctly suggest "sequential"', async () => {
    const query = "Tasks should be done one after another.";
    (ai.generate as jest.Mock).mockResolvedValue({
      text: () => JSON.stringify({ suggestedWorkflowType: "sequential" }),
    });

    const result = await getWorkflowDetailedType(query);
    expect(result).toBe("sequential");
    expect(ai.generate).toHaveBeenCalledTimes(1);
    expect((ai.generate as jest.Mock).mock.calls[0][0].prompt).toContain(query);
  });

  it('should correctly suggest "parallel"', async () => {
    const query = "These tasks can run at the same time.";
    (ai.generate as jest.Mock).mockResolvedValue({
      text: () => JSON.stringify({ suggestedWorkflowType: "parallel" }),
    });

    const result = await getWorkflowDetailedType(query);
    expect(result).toBe("parallel");
    expect(ai.generate).toHaveBeenCalledTimes(1);
  });

  it('should default to "sequential" if LLM returns an unexpected type', async () => {
    const query = "Some query.";
    (ai.generate as jest.Mock).mockResolvedValue({
      text: () => JSON.stringify({ suggestedWorkflowType: "unknown_type" }),
    });
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await getWorkflowDetailedType(query);

    expect(result).toBe("sequential"); 
    expect(ai.generate).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("LLM returned an unexpected workflow type: 'unknown_type'"));
    consoleWarnSpy.mockRestore();
  });

  it('should default to "sequential" and log error if LLM returns malformed JSON', async () => {
    const query = "Some other query.";
    (ai.generate as jest.Mock).mockResolvedValue({
      text: () => "this is not valid json",
    });
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getWorkflowDetailedType(query);

    expect(result).toBe("sequential"); 
    expect(ai.generate).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalled(); 
    consoleErrorSpy.mockRestore();
  });

  it('should default to "sequential" if ai.generate call fails', async () => {
    const query = "A failing query";
    (ai.generate as jest.Mock).mockRejectedValue(new Error("LLM call failed"));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getWorkflowDetailedType(query);

    expect(result).toBe("sequential");
    expect(ai.generate).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error determining workflow type"), expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});

// Helper to create a minimal SavedAgentConfiguration for tests
const createMockSavedAgentConfig = (override?: Partial<SavedAgentConfiguration>): SavedAgentConfiguration => {
  const defaultConfig: SavedAgentConfiguration = {
    id: 'agent-test-123',
    agentName: 'Test Agent',
    description: 'A test agent description.',

    config: {
      model: 'gpt-4',
      framework: 'genkit',
      type: 'llm',
      agentGoal: 'Goal',
      agentTasks: ['Task']
    } as LLMAgentConfig,
    tools: [],
    toolsDetails: [],
    toolConfigsApplied: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    isTemplate: false,
    userId: 'user-test-id'
  };
  return { ...defaultConfig, ...override };
};

// USOS NO ARQUIVO
export const testAgent: SavedAgentConfiguration = {
  ...createMockAgent(),
  agentName: 'Custom Name',
  userId: 'user-test-id',
  config: {
    type: 'llm',
    framework: 'genkit',
    ...baseLLMConfig
  }
};

export const testLLMConfig: LLMAgentConfig = {
  ...baseLLMConfig,
  temperature: 0.7
};

// Correção para linha ~98
const savedConfig: SavedAgentConfiguration = {
  ...createMockAgent(),
  id: 'agent1',
  userId: 'user-test-id',
  config: {
    type: 'llm',
    framework: 'genkit',
    ...baseLLMConfig
  }
};

// Correção para linha ~101
const llmConfig: LLMAgentConfig = {
  ...baseLLMConfig,
  agentGoal: 'To be tested',
  agentTasks: ['get tested']
};

// Correção para linha ~246
const complexConfig: LLMAgentConfig = {
  ...baseLLMConfig
};

const validConfig: SavedAgentConfiguration = {
  ...createMockAgent(),
  agentName: 'Test Agent',
  userId: 'user-test-id',
  config: {
    type: 'llm',
    framework: 'genkit',
    ...baseLLMConfig
  }
};
