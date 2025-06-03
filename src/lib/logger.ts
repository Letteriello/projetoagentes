// src/lib/logger.ts

// Definição do tipo Flow para uso no logger
type Flow<Req, Res> = (input: Req, context?: any) => Promise<Res>;

// Importação condicional do firebaseAdmin (apenas no servidor)
let admin: any;
let firestore: any;

// Verifica se estamos no servidor
if (typeof window === 'undefined') {
  const firebaseAdmin = require('./firebaseAdmin');
  admin = firebaseAdmin.default;
  firestore = firebaseAdmin.firestore;
}

const LOGS_COLLECTION = 'agent_logs_v3'; // Nome da coleção incrementado

interface LogEntry {
  timestamp: any; // Alterado para any para evitar erros no cliente
  agentId?: string;
  flowName: string;
  type: 'start' | 'end' | 'tool_call' | 'error' | 'info';
  traceId?: string;
  data: any;
}

async function writeLogToFirestore(logEntry: Omit<LogEntry, 'timestamp'>) {
  const db = firestore;
  if (!db || typeof db.collection !== 'function') {
    console.error('Firestore instance is not available or not correctly initialized in logger.ts. Log will not be written to Firestore.');
    console.log('[FALLBACK_LOG]', { ...logEntry, timestamp: new Date().toISOString() });
    return;
  }
  try {
    await db.collection(LOGS_COLLECTION).add({
      ...logEntry,
      timestamp: admin.firestore.Timestamp.now(),
    });
  } catch (error) {
    console.error('Failed to write log to Firestore:', error);
    console.log('[FALLBACK_LOG]', { ...logEntry, timestamp: new Date().toISOString(), errorDetails: String(error) });
  }
}

export const enhancedLogger = {
  logStart: async (flowName: string, agentId?: string, input?: any) => {
    await writeLogToFirestore({
      flowName: flowName,
      agentId: agentId,
      type: 'start',
      traceId: undefined,
      data: { input: input },
    });
  },
  
  logEnd: async (flowName: string, agentId?: string, output?: any) => {
    await writeLogToFirestore({
      flowName: flowName,
      agentId: agentId,
      type: 'end',
      traceId: undefined,
      data: { output: output },
    });
  },
  
  logToolCall: async (flowName: string, agentId?: string, toolName?: string, input?: any) => {
    await writeLogToFirestore({
      flowName: flowName,
      agentId: agentId,
      type: 'tool_call',
      traceId: undefined,
      data: { 
        tool: toolName,
        input: input 
      },
    });
  },
  
  logError: async (flowName: string, agentId?: string, error?: Error, details?: any) => {
    await writeLogToFirestore({
      flowName,
      agentId,
      type: 'error',
      traceId: undefined,
      data: {
        error: error ? { name: error.name, message: error.message, stack: error.stack } : 'Unknown error',
        details,
      },
    });
  },
  
  logInfo: async (flowName: string, agentId?: string, message?: string, data?: any) => {
    await writeLogToFirestore({
      flowName,
      agentId,
      type: 'info',
      traceId: undefined,
      data: { message, ...data },
    });
  },
};

// Função auxiliar para criar um fluxo logável
export function createLoggableFlow<Request, Response>(
  name: string,
  flow: (input: Request, context?: any) => Promise<Response>
): (input: Request, context?: any) => Promise<Response> {
  // Verifica se estamos no servidor
  if (typeof window !== 'undefined') {
    // No cliente, retornamos uma função vazia que lança um erro
    return (() => {
      throw new Error('createLoggableFlow should only be used on the server side');
    }) as unknown as (input: Request, context?: any) => Promise<Response>;
  }

  // Execução direta do fluxo, sem dependência de '@genkit-ai/flow'.
  return async (input: Request, context?: any): Promise<Response> => {
    const agentId = (input as any)?.agentId || 'unknown_agent';
    try {
      await enhancedLogger.logStart(name, agentId, input);
      const result = await flow(input, context);
      await enhancedLogger.logEnd(name, agentId, result);
      return result;
    } catch (error) {
      await enhancedLogger.logError(name, agentId, error as Error, { input });
      throw error;
    }
  };
}