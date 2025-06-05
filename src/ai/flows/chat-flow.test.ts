import { basicChatFlow, SENSITIVE_KEYWORDS } from './chat-flow';
import type { BasicChatInput, BasicChatOutput } from './chat-flow';
import { ai } from '@/ai/genkit';
import { ActionContext } from 'genkit';
import { runFlow } from '@genkit-ai/flow';
import { mockActionContext } from './test-utils';

// Mock @/ai/genkit
jest.mock('@/ai/genkit', () => ({
  ai: {
    generate: jest.fn(),
  },
}));

// Mock winstonLogger used in the flow
jest.mock('../../lib/winston-logger', () => ({
  winstonLogger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock allAvailableTools or individual tools if they are directly accessed.
// Para estes testes, utilizamos apenas o mockActionContext importado do test-utils.
// Removido mockActionContext local para evitar conflito de declaração.

describe('basicChatFlow Guardrails and Safety Alerts', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (ai.generate as jest.Mock).mockReset();
    // Reset logger mocks if necessary, e.g., winstonLogger.warn.mockReset();
  });

  const defaultInput: Omit<BasicChatInput, 'message'> = {
    config: { modelName: 'geminiPro', agentId: 'test-agent', streamingEnabled: true }, // agentId agora está dentro de config
  } as Omit<BasicChatInput, 'message'>;

  // == BeforeModel Guardrail Tests ==
  describe('BeforeModel Guardrail', () => {
    it('should block prompt with sensitive keywords', async () => {
      const input: BasicChatInput = {
        ...defaultInput,
        message: `Por favor, ${SENSITIVE_KEYWORDS[0]} do sistema.`,
      }; // já está correto, pois agentId está em config

      const result = await runFlow(basicChatFlow, input);
      
      expect(result.response).toContain('palavra sensível');
      expect(result.toolResponses).toBeDefined();
    });

    it('should allow clean prompt and call ai.generate', async () => {
      const input: BasicChatInput = {
        ...defaultInput,
        message: 'Olá, como você está?',
      }; // já está correto, pois agentId está em config
      const mockApiResponse = {
        candidates: [{ message: { content: [{ text: 'Estou bem, obrigado!' }] } }],
      };
      (ai.generate as jest.Mock).mockResolvedValue(mockApiResponse);

      const typedInput: BasicChatInput = input;
      const result = await runFlow(basicChatFlow, typedInput);
      
      expect(ai.generate).toHaveBeenCalledTimes(1);
      expect(result.response).toBe('Estou bem, obrigado!');
    });
  });

  // == BeforeTool Guardrail Tests ==
  describe('BeforeTool Guardrail', () => {
    const mockToolName = 'testCalculator';
    const mockTool = {
      id: mockToolName,
      name: mockToolName,
      description: 'Test calculator tool',
      enabled: true,
      // Mock the actual tool function if we expect it to be called
      func: jest.fn().mockResolvedValue({ result: 'calculation done' }),
      // Add inputSchema if your flow uses it for validation before guardrail
      inputSchema: { safeParse: jest.fn(data => ({ success: true, data })) }
    };

    const inputWithTool: BasicChatInput = {
      ...defaultInput,
      message: 'Use a calculadora para algo.',
      agentToolsDetails: [
        { id: mockToolName, name: mockToolName, description: 'A test tool', enabled: true }
      ],
    } as BasicChatInput;

    beforeEach(() => {
      // Reset tool mocks specifically if needed
      mockTool.func.mockClear();
      // Reset the global tool map or how tools are fetched if `allAvailableTools` is directly used.
      // For this test setup, we are relying on agentToolsDetails and ai.generate's tool_request simulation.
    });

    // This setup requires `allAvailableTools` to be accessible or mocked if `basicChatFlowInternal` uses it.
    // The current `basicChatFlowInternal` uses `allAvailableTools`.
    // A simple way to handle this is to ensure `allAvailableTools[mockToolName]` exists.
    // For a cleaner test, we might need to inject tools or mock the module where `allAvailableTools` is defined.
    // Let's assume the flow can find `mockTool` via `genkitTools.find` based on `agentToolsDetails`.
    // We need to ensure the `genkitTools` array inside `basicChatFlowInternal` gets populated correctly.
    // The current implementation of `basicChatFlowInternal` iterates `allAvailableTools`.
    // So, we need to mock `allAvailableTools` or the tools it contains.

    // Simplified approach: Mock `ai.generate` to simulate tool request & response cycle.
    // We will also mock `allAvailableTools` to include our test tool.
    jest.mock('@/ai/flows/chat-flow', () => {
      const originalModule = jest.requireActual('@/ai/flows/chat-flow');
      return {
        ...originalModule,
        // This specific way of mocking internal consts is tricky.
        // A better approach would be to refactor chat-flow.ts to allow tool injection for testing.
        // For now, we'll rely on mocking ai.generate responses.
      };
    });


    it('should block tool execution with sensitive parameters', async () => {
      const sensitiveParam = SENSITIVE_KEYWORDS[1]; // "excluir dados"
      const sensitiveTool = { query: `Por favor, ${sensitiveParam} sobre o usuário X` };
      const toolRequestPayload = {
        toolRequest: {
          name: mockToolName,
          input: sensitiveTool,
          ref: 'tool-ref-1',
        },
      };
      const mockLLMResponseWithSensitiveToolRequest = {
        candidates: [{
          message: { content: [{
            text: 'Vou usar a ferramenta',
            toolRequest: {
              name: mockToolName,
              input: sensitiveTool,
              ref: 'tool-ref-1',
            }
          }] }
        }]
      };

      (ai.generate as jest.Mock).mockResolvedValueOnce(mockLLMResponseWithSensitiveToolRequest);
      // No second ai.generate call as tool is blocked.

      // To properly test this, we need to ensure the tool *would* be found if not for the guardrail.
      // This means `genkitTools` inside the flow needs to contain a mock for `testCalculator`.
      // The current implementation of the flow uses `allAvailableTools` to populate `genkitTools`.
      // We'll assume `agentToolsDetails` is enough for the flow to try and find the tool,
      // and our guardrail should hit before `toolToRun.func` is called.

      const result = await runFlow(basicChatFlow, {
        ...inputWithTool,
      });
      
      expect(ai.generate).toHaveBeenCalledTimes(1); // LLM called once to request the tool
      expect(result.toolResponses).toBeDefined();
      expect(result.toolResponses).toHaveLength(1);
      const toolResult = result.toolResponses?.[0];
      expect(toolResult?.name).toBe(mockToolName);
      expect(toolResult?.status).toBe('error');
      expect(toolResult?.errorDetails?.code).toBe('GUARDRAIL_TOOL_BLOCKED');
      expect(toolResult?.errorDetails?.message).toContain(`Guardrail ativado: Execução de ferramenta '${mockToolName}' bloqueada`);
      expect(toolResult?.errorDetails?.message).toContain(sensitiveParam);
    });

    it('should allow tool execution with clean parameters', async () => {
      const calculatorInput = { query: 'Calcular 2+2' };
      const toolRequestPayload = {
        toolRequest: { name: mockToolName, input: calculatorInput, ref: 'tool-ref-2' },
      };
      const mockLLMResponseWithToolRequest = {
        candidates: [{ 
          message: { content: [{ 
            text: 'Usando a calculadora', 
            toolRequest: { name: mockToolName, input: calculatorInput, ref: 'tool-ref-2' } 
          }] } 
        }]
      };

      // To simulate the tool call, we need to provide a mock for the tool's function
      // that `basicChatFlowInternal` will execute. This is tricky because `allAvailableTools`
      // is defined within `chat-flow.ts`.
      // A practical way: assume the tool *would* be found and its func *would* be called.
      // The guardrail logic for tools is *before* `toolToRun.func(validatedInput)`.
      // So, if the guardrail *doesn't* block, the flow will attempt to call `toolToRun.func`.
      // If we can't easily mock `toolToRun.func` itself, we can check if `ai.generate`
      // is called a *second* time (with the tool response), which implies the tool call part was passed.

      (ai.generate as jest.Mock)
        .mockResolvedValueOnce(mockLLMResponseWithToolRequest) // First call: LLM requests tool
        .mockResolvedValueOnce({ // Second call: LLM responds to tool output
          candidates: [{ message: { content: [{ text: 'O resultado é 4.' }] } }],
        });

      // To make this test pass, the flow needs to be able to "execute" testCalculator.
      // This means `genkitTools.find(t => t.name === mockToolName)` must succeed.
      // This implies `allAvailableTools` must contain `testCalculator` with a `func`.
      // We will assume this part works and the guardrail is what we are testing.
      // The actual `func` call is hard to intercept without deeper mocking or refactoring.

      const toolInput: BasicChatInput = {
        ...inputWithTool,
        // Override agentToolsDetails to ensure our mockTool *could* be found if we were mocking allAvailableTools
        agentToolsDetails: [{ id: mockToolName, name: mockToolName, description: 'desc', enabled: true }]
      };
      const result = await runFlow(basicChatFlow, toolInput);
      
      expect(ai.generate).toHaveBeenCalledTimes(2);
      expect(result.response).toBe('O resultado é 4.');
      expect(result.toolResponses).toBeDefined();
      expect(result.toolResponses).toHaveLength(1);
      const toolResult = result.toolResponses?.[0];
      expect(toolResult?.name).toBe(mockToolName);
      expect(toolResult?.status).toBe('success');
      // `toolResult.output` depends on the actual (mocked) tool function.
      // Since mocking the actual tool func is complex here, we check for status 'success'.
    });
  });

  // == Simulated Gemini Security Alert Tests ==
  describe('Simulated Gemini Safety Alert', () => {
    it('should replace insecure LLM response', async () => {
      const input: BasicChatInput = {
        ...defaultInput,
        message: 'Conte-me algo.',
      };
      const mockApiResponse = {
        candidates: [{ message: { content: [{ text: 'Esta é uma resposta insegura simulada.' }] } }],
      };
      (ai.generate as jest.Mock).mockResolvedValue(mockApiResponse);

      const result = await runFlow(basicChatFlow, {
        ...input,
        
      });
      
      expect(ai.generate).toHaveBeenCalledTimes(1);
      expect(result.response).toBe('Não posso responder a isso.');
    });

    it('should allow secure LLM response', async () => {
      const input: BasicChatInput = {
        ...defaultInput,
        message: 'Conte-me algo seguro.',
      };
      const mockSecureResponse = 'Esta é uma resposta segura.';
      const mockApiResponse = {
        candidates: [{ message: { content: [{ text: mockSecureResponse }] } }],
      };
      (ai.generate as jest.Mock).mockResolvedValue(mockApiResponse);

      const result = await runFlow(basicChatFlow, {
        ...input,
        
      });
      
      expect(ai.generate).toHaveBeenCalledTimes(1);
      expect(result.response).toBe(mockSecureResponse);
    });
  });
});

// Helper to ensure the `SENSITIVE_KEYWORDS` array is accessible if needed for direct comparison in tests,
// though it's better if tests don't rely on knowing the exact internal list but rather on the behavior.
export { SENSITIVE_KEYWORDS };

