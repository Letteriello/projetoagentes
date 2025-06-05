import { crewAIAgentFlow, CrewAIAgentFlowInputSchema } from './crewai-agent-flow';
import { runFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { initPlugin } from '@genkit-ai/core';
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

beforeAll(() => {
  initPlugin();
});

describe('crewAIAgentFlow', () => {
  afterEach(() => {
    (winstonLogger.winstonLogger.info as jest.Mock).mockClear();
  });

  it('should simulate CrewAI execution and return a response', async () => {
    const mockAgentConfig = {
      agentName: 'Test Crew',
      toolsDetails: [],
      config: {
        framework: 'crewai',
        // subAgents: ['PlannerAgent'] // Optional: for more specific simulation
      }
    };
    const input: z.infer<typeof CrewAIAgentFlowInputSchema> = {
      agentConfig: mockAgentConfig,
      userMessage: 'Plan my day!',
    };

    const output = await runFlow(crewAIAgentFlow, input);

    expect(output.simulatedResponse).toContain('CrewAI \'Test Crew\' simulated a response to: "Plan my day!"');
    expect(output.simulatedTasks).toBeDefined();
    expect(output.simulatedTasks?.length).toBeGreaterThan(0);
    expect(output.simulatedTasks?.[0].status).toBe('simulated_complete');

    expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('[crewAIAgentFlow] Initializing CrewAI simulation for: Test Crew'),
      expect.anything()
    );
    expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('[crewAIAgentFlow] Simulating creation of a Crew for \'Test Crew\''),
      expect.anything()
    );
    expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('[crewAIAgentFlow] Task \'Process user request: Plan my day!...\' marked as complete.'),
      expect.anything()
    );
    expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining('[crewAIAgentFlow] CrewAI simulation complete for: Test Crew'),
      expect.anything()
    );
  });

  it('should simulate tool usage within a task if toolsDetails are provided', async () => {
    const mockAgentConfig = {
      agentName: 'Tool-Using Crew',
      toolsDetails: [{ id: 'calendarTool', name: 'CalendarTool', description: 'A mock calendar tool' }],
      config: {
        framework: 'crewai',
        subAgents: ['TaskExecAgent']
      }
    };
    const input: z.infer<typeof CrewAIAgentFlowInputSchema> = {
      agentConfig: mockAgentConfig,
      userMessage: 'Schedule a meeting.',
    };

    const output = await runFlow(crewAIAgentFlow, input);
    const mainTask = output.simulatedTasks?.[0];

    expect(output.simulatedResponse).toContain("Task 'Process user request: Schedule a meeting....' involved simulated use of tool: 'CalendarTool'");
    expect(mainTask).toBeDefined();
    expect(mainTask?.toolEvents).toHaveLength(1);
    expect(mainTask?.toolEvents?.[0].toolName).toBe('CalendarTool');
    expect(mainTask?.toolEvents?.[0].status).toBe('simulated_success');

    expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("'TaskExecAgent' will simulate using 1 tool(s) for task 'Process user request: Schedule a meeting....'"),
      expect.anything()
    );
    expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("'TaskExecAgent' simulating call to tool: 'CalendarTool' for task 'Process user request: Schedule a meeting....'"),
      expect.anything()
    );
  });

  it('should use a default lead agent name if no subAgents are defined in config', async () => {
    const mockAgentConfig = {
      agentName: 'DefaultAgentCrew',
      toolsDetails: [],
      config: {
        framework: 'crewai',
        // No subAgents explicitly defined
      }
    };
    const input: z.infer<typeof CrewAIAgentFlowInputSchema> = {
      agentConfig: mockAgentConfig,
      userMessage: 'Hello Crew.',
    };

    await runFlow(crewAIAgentFlow, input);

    expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("Simulating creation of a Crew for 'DefaultAgentCrew' with a lead agent 'Lead Agent Alpha'"),
      expect.anything()
    );
     expect(winstonLogger.winstonLogger.info).toHaveBeenCalledWith(
      expect.stringContaining("Created and assigned main task 'Process user request: Hello Crew....' to 'Lead Agent Alpha'"),
      expect.anything()
    );
  });
});
