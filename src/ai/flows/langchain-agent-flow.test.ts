import { langchainAgentFlow, LangchainAgentFlowInputSchema } from './langchain-agent-flow';
import { runFlow } from '@genkit-ai/flow';
import { createMockSavedAgentConfig } from './test-utils';
import { z } from 'zod';

import * as winstonLogger from '@/lib/winston-logger'; // Mock winstonLogger

// Mock winstonLogger
jest.mock('@/lib/winston-logger', () => ({
  winstonLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Initialize Genkit core before running tests if needed by flows


describe('langchainAgentFlow', () => {
  afterEach(() => {
    // Clear mock history after each test
    (winstonLogger.winstonLogger.info as jest.Mock).mockClear();
  });

  it('should simulate Langchain agent execution and return a response', async () => {

    const mockAgentConfig = createMockSavedAgentConfig({
      agentName: 'Test Langchain Agent',
      toolsDetails: [],
      config: { framework: 'langchain' }
    });
    const input: z.infer<typeof LangchainAgentFlowInputSchema> = {
      agentConfig: mockAgentConfig,
      userMessage: 'Hello Langchain!',
    };

    const output = await runFlow(langchainAgentFlow, input);

    expect(output.simulatedResponse).toContain('Langchain agent \'Test Langchain Agent\' simulated response to: "Hello Langchain!"');
    expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('[langchainAgentFlow] Initializing Langchain agent simulation for: Test Langchain Agent'),
      expect.anything()
    );
    expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('[langchainAgentFlow] Received user message: "Hello Langchain!"'),
      expect.anything()
    );
    expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('[langchainAgentFlow] Langchain agent simulation complete for: Test Langchain Agent'),
      expect.anything()
    );
  });

  it('should simulate tool usage if toolsDetails are provided', async () => {
    const mockAgentConfig = createMockSavedAgentConfig({
      agentName: 'Langchain Tool Agent',
      toolsDetails: [{ id: 'searchTool', name: 'SearchTool', description: 'A mock search tool' }],
      config: { framework: 'langchain' }
    });
    const input: z.infer<typeof LangchainAgentFlowInputSchema> = {
      agentConfig: mockAgentConfig,
      userMessage: 'Search for something.',
    };

    const output = await runFlow(langchainAgentFlow, input);

    expect(output.simulatedResponse).toContain("Simulated using tool: 'SearchTool'");
    expect(output.toolEvents).toHaveLength(1);
    expect(output.toolEvents?.[0].toolName).toBe('SearchTool');
    expect(output.toolEvents?.[0].status).toBe('simulated_success');
    expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('[langchainAgentFlow] Simulating Langchain tool conversion and usage for 1 tool(s).'),
      expect.anything()
    );
    expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("[langchainAgentFlow] Simulating call to Langchain tool: 'SearchTool'"),
      expect.anything()
    );
  });

  it('should handle agents with no tools', async () => {
    const mockAgentConfig = createMockSavedAgentConfig({
      agentName: 'Langchain NoTool Agent',
      toolsDetails: [],
      config: { framework: 'langchain' }
    });
    const input: z.infer<typeof LangchainAgentFlowInputSchema> = {
      agentConfig: mockAgentConfig,
      userMessage: 'Just chat.',
    };

    const output = await runFlow(langchainAgentFlow, input);

    expect(output.simulatedResponse).not.toContain("Simulated using tool:");
    expect(output.toolEvents).toHaveLength(0);
    expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('[langchainAgentFlow] No tools to simulate for this Langchain agent.'),
      expect.anything()
    );
  });
});
