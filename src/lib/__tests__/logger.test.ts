import { enhancedLogger, createLoggableFlow } from '../logger';

// Mocks para o Firestore
const mockAdd = jest.fn().mockResolvedValue({ id: 'test-doc-id' });
const mockCollection = jest.fn(() => ({ add: mockAdd }));

// Cria um mock para o Timestamp do Firestore
const createMockTimestamp = () => ({
  seconds: Math.floor(Date.now() / 1000),
  nanos: 0,
  toDate: () => new Date(),
  toMillis: () => Date.now(),
  isEqual: (other: any) => false,
  valueOf: () => 'test-timestamp'
});

// Mock firebaseAdmin dynamic import as used in logger.ts
jest.mock('../firebaseAdmin', () => {
  const mockTimestamp = createMockTimestamp();
  
  // Simula o objeto firestore que será usado no logger
  const mockFirestore = {
    collection: mockCollection
  };

  // Simula o módulo firebaseAdmin
  const firebaseAdmin = {
    __esModule: true,
    default: {
      firestore: () => ({
        collection: mockCollection
      })
    },
    firestore: mockFirestore
  };

  // Adiciona o Timestamp ao mock
  firebaseAdmin.firestore.Timestamp = {
    now: () => mockTimestamp,
    fromDate: (date: Date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanos: 0,
      toDate: () => date,
      toMillis: () => date.getTime(),
      isEqual: (other: any) => false,
      valueOf: () => 'test-timestamp-from-date'
    })
  };

  return firebaseAdmin;
});

// Mock Genkit Core
const mockInstrument = jest.fn((opts, fn) => fn);
const mockGetTraceId = jest.fn(() => 'test-trace-id');

jest.mock('@genkit-ai/core', () => ({
  instrumentation: {
    instrument: (opts: any, fn: any) => mockInstrument(opts, fn),
    getTraceId: () => mockGetTraceId(),
  },
}));

// Mock Genkit Flow
type Flow<Req = any, Res = any> = (input: Req, context?: any) => Promise<Res>;
const mockGenkitFlow = jest.fn((config, flow) => flow as Flow);

jest.mock('@genkit-ai/flow', () => ({
  genkitFlow: (config: any, flow: any) => {
    return mockGenkitFlow(config, flow);
  },
  flow: (config: any, flow: any) => {
    return mockGenkitFlow(config, flow);
  }
}));

describe('Enhanced Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log start of an operation', async () => {
    const flowName = 'test-flow';
    const agentId = 'test-agent';
    const input = { test: 'input' };

    await enhancedLogger.logStart(flowName, agentId, input);

    expect(mockCollection).toHaveBeenCalledWith('agent_logs_v3');
    expect(mockAdd).toHaveBeenCalledWith({
      flowName,
      agentId,
      type: 'start',
      traceId: 'test-trace-id',
      data: { input },
      timestamp: expect.any(Object)
    });
  });

  it('should log end of an operation', async () => {
    const flowName = 'test-flow';
    const agentId = 'test-agent';
    const output = { test: 'output' };

    await enhancedLogger.logEnd(flowName, agentId, output);

    expect(mockCollection).toHaveBeenCalledWith('agent_logs_v3');
    expect(mockAdd).toHaveBeenCalledWith({
      flowName,
      agentId,
      type: 'end',
      traceId: 'test-trace-id',
      data: { output },
      timestamp: expect.any(Object)
    });
  });

  it('should log errors', async () => {
    const flowName = 'test-flow';
    const agentId = 'test-agent';
    const error = new Error('Test error');
    const details = { some: 'details' };

    await enhancedLogger.logError(flowName, agentId, error, details);

    expect(mockCollection).toHaveBeenCalledWith('agent_logs_v3');
    expect(mockAdd).toHaveBeenCalledWith({
      flowName,
      agentId,
      type: 'error',
      traceId: 'test-trace-id',
      data: {
        error: {
          name: 'Error',
          message: 'Test error',
          stack: expect.any(String)
        },
        details
      },
      timestamp: expect.any(Object)
    });
  });
});

describe('createLoggableFlow', () => {
  const mockFlowLogic = jest.fn();
  const agentId = 'test-agent-in-flow';
  const flowName = 'logged-flow';
  const input = { test: 'input', agentId };
  const output = { test: 'output' };
  const error = new Error('Flow failed');

  beforeEach(() => {
    jest.clearAllMocks();
    mockFlowLogic.mockReset();
  });

  it('should create a flow that logs start and end', async () => {
    mockFlowLogic.mockResolvedValue(output);
    
    const loggedFlow = createLoggableFlow(flowName, mockFlowLogic);
    const result = await loggedFlow(input);

    // Verifica se o fluxo foi chamado com os parâmetros corretos
    expect(mockFlowLogic).toHaveBeenCalledWith(input, undefined);
    
    // Verifica se o resultado do fluxo foi retornado corretamente
    expect(result).toEqual(output);
    
    // Verifica se os logs de início e fim foram chamados
    expect(mockCollection).toHaveBeenCalledTimes(2);
    expect(mockAdd).toHaveBeenCalledTimes(2);
    
    // Verifica o log de início
    expect(mockAdd).toHaveBeenNthCalledWith(1, {
      flowName,
      agentId,
      type: 'start',
      traceId: 'test-trace-id',
      data: { input },
      timestamp: expect.any(Object)
    });
    
    // Verifica o log de fim
    expect(mockAdd).toHaveBeenNthCalledWith(2, {
      flowName,
      agentId,
      type: 'end',
      traceId: 'test-trace-id',
      data: { output },
      timestamp: expect.any(Object)
    });
  });

  it('should log errors when the flow fails', async () => {
    mockFlowLogic.mockRejectedValue(error);
    
    const loggedFlow = createLoggableFlow(flowName, mockFlowLogic);
    
    await expect(loggedFlow(input)).rejects.toThrow('Flow failed');
    
    // Verifica se o log de erro foi chamado
    expect(mockAdd).toHaveBeenCalledWith({
      flowName,
      agentId,
      type: 'error',
      traceId: 'test-trace-id',
      data: {
        error: {
          name: 'Error',
          message: 'Flow failed',
          stack: expect.any(String)
        },
        input
      },
      timestamp: expect.any(Object)
    });
  });

  it('should work with flow context', async () => {
    const context = { some: 'context' };
    mockFlowLogic.mockImplementation(async (input, ctx) => {
      expect(ctx).toBe(context);
      return output;
    });
    
    const loggedFlow = createLoggableFlow(flowName, mockFlowLogic);
    const result = await loggedFlow(input, context);
    
    expect(result).toEqual(output);
    expect(mockFlowLogic).toHaveBeenCalledWith(input, context);
  });
});
