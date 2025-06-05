// test-utils.ts
// Utilitários e mocks reutilizáveis para testes de flows Genkit
import { LLMAgentConfig, WorkflowAgentConfig, SavedAgentConfiguration } from '@/types/agent-configs-fixed';

export const baseLLMConfig: LLMAgentConfig = {
  type: 'llm',
  framework: 'openai',
  model: 'gpt-4', // From BaseAgentConfig
  agentModel: 'gpt-4', // From LLMAgentConfig
  agentGoal: 'Goal',
  agentTasks: ['Task'],
  agentTemperature: 0.7,
};

export const baseAgentConfig: SavedAgentConfiguration = {
  id: 'agent-test-id',
  agentName: 'Test Agent',
  agentDescription: 'Test description',
  agentVersion: '1.0.0',
  config: { ...baseLLMConfig },
  tools: [],
  toolsDetails: [],
  toolConfigsApplied: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  isTemplate: false,
  userId: 'user-test-user',
};

// ATENÇÃO: Certifique-se de que o tipo WorkflowAgentConfig realmente permite workflowSteps. Se não, ajuste o tipo em '@/types/agent-configs-fixed'.
// TODO: Ajustar o tipo de baseWorkflowConfig para WorkflowAgentConfig assim que o tipo permitir 'workflowSteps' corretamente.
export const baseWorkflowConfig: any = {
  type: 'workflow',
  framework: 'genkit',
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
