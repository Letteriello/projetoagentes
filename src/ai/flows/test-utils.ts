// test-utils.ts
// Utilitários e mocks reutilizáveis para testes de flows Genkit
import { LLMAgentConfig, WorkflowAgentConfig, SavedAgentConfiguration, AgentConfig } from '@/types/agent-core'; // Updated path

export const baseLLMConfig: LLMAgentConfig = {
  model: 'gpt-4',
  framework: 'openai',
  type: 'llm',
  agentGoal: 'Goal',
  agentTasks: ['Task'],
  temperature: 0.7,
};

export const baseAgentConfig: SavedAgentConfiguration = {
  id: 'agent-test-id',
  agentName: 'Test Agent',
  agentDescription: 'Test description', // Renamed from 'description' to match SavedAgentConfiguration
  config: { ...baseLLMConfig } as AgentConfig, // Assert as AgentConfig union
  tools: [],
  // toolsDetails is optional in SavedAgentConfiguration from agent-core.ts
  toolConfigsApplied: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  isTemplate: false,
  userId: 'user-test-user',
};

// WorkflowAgentConfig in agent-core.ts does allow workflowSteps.
export const baseWorkflowConfig: WorkflowAgentConfig = { // Now typed with WorkflowAgentConfig
  type: 'workflow',
  framework: 'genkit',
  agentGoal: 'Default workflow goal', // Added required field from AgentConfigBase
  agentTasks: ['Execute workflow steps'], // Added required field from AgentConfigBase
  workflowType: 'sequential',
  workflowSteps: [
    {
      agentId: 'step1',
      inputMapping: { input: 'foo' },
      outputKey: 'step1Result',
      name: 'Step 1',
      description: 'First step',
    },
    {
      agentId: 'step2',
      inputMapping: { input: '$step1Result' },
      outputKey: 'step2Result',
      name: 'Step 2',
      description: 'Second step',
    }
  ],
};

// Helper para criar mocks de SavedAgentConfiguration
// Use este helper nos testes para garantir mocks padronizados e evitar duplicidade.
export function createMockSavedAgentConfig(override: Partial<SavedAgentConfiguration> = {}): SavedAgentConfiguration {
  return { ...baseAgentConfig, ...override };
}

// Helper para criar mocks de WorkflowAgentConfig
// Use este helper nos testes para garantir mocks padronizados e evitar duplicidade.
export function createMockWorkflowAgentConfig(override: Partial<WorkflowAgentConfig> = {}): WorkflowAgentConfig {
  return { ...baseWorkflowConfig, ...override };
}

// Helper para mock de ActionContext mínimo
// Mock mínimo de ActionContext para uso em testes.
export const mockActionContext = {} as any;
