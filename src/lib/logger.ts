// src/lib/logger.ts
import { instrumentation } from '@genkit-ai/core';

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
    console.log('[FALLBACK_LOG]', { ...logEntry, timestamp: admin.firestore.Timestamp.now(), errorDetails: String(error) });
  }
}

export const enhancedLogger = {
  logStart: instrumentation.instrument(
    { tag: 'enhancedLogger.logStart' },
    async (flowName: string, agentId?: string, input?: any) => {
      const traceId = instrumentation.getTraceId();
      await writeLogToFirestore({
        flowName,
        agentId,
        type: 'start',
        traceId,
        data: { input },
      });
    }
  ),
  logEnd: instrumentation.instrument(
    { tag: 'enhancedLogger.logEnd' },
    async (flowName: string, agentId?: string, output?: any) => {
      const traceId = instrumentation.getTraceId();
      await writeLogToFirestore({
        flowName,
        agentId,
        type: 'end',
        traceId,
        data: { output },
      });
    }
  ),

  logToolCall: instrumentation.instrument(
    { tag: 'enhancedLogger.logToolCall' },
    async (
      flowName: string,
      agentId?: string,
      toolName?: string,
      input?: any,
      output?: any
    ) => {
      const traceId = instrumentation.getTraceId();
      await writeLogToFirestore({
        flowName,
        agentId,
        type: 'tool_call',
        traceId,
        data: { toolName, input, output },
      });
    }
  ),

  logError: instrumentation.instrument(
    { tag: 'enhancedLogger.logError' },
    async (flowName: string, agentId?: string, error?: any, details?: any) => {
      const traceId = instrumentation.getTraceId();
      await writeLogToFirestore({
        flowName,
        agentId,
        type: 'error',
        traceId,
        data: {
          error: error ? { name: error.name, message: error.message, stack: error.stack } : 'Unknown error',
          details,
        },
      });
    }
  ),
  logInfo: instrumentation.instrument(
    { tag: 'enhancedLogger.logInfo' },
    async (flowName: string, agentId?: string, message?: string, data?: any) => {
      const traceId = instrumentation.getTraceId();
      await writeLogToFirestore({
        flowName,
        agentId,
        type: 'info',
        traceId,
        data: { message, ...data },
      });
    }
  ),
};

// Função auxiliar para criar um fluxo logável
export function createLoggableFlow<Request, Response>(
  name: string,
  flow: FlowType<Request, Response>
): FlowType<Request, Response> {
  // Verifica se estamos no servidor
  if (typeof window !== 'undefined') {
    // No cliente, retornamos uma função vazia que lança um erro
    return (() => {
      throw new Error('createLoggableFlow should only be used on the server side');
    }) as unknown as Flow<Request, Response>;
  }

  // Importação dinâmica apenas no servidor
  const { genkitFlow } = require('@genkit-ai/flow');
  
  return genkitFlow(
    { name },
    async (input: Request, context?: any) => {
      const agentId = (input as any)?.agentId || 'unknown_agent';
      
      try {
        await enhancedLogger.logStart(name, agentId, input);
        
        // Executa o fluxo original
        const result = await flow(input, context);
        
        // Registra o término bem-sucedido
        await enhancedLogger.logEnd(name, agentId, result);
        
        return result;
      } catch (error) {
        // Registra o erro
        await enhancedLogger.logError(
          name, 
          agentId, 
          error as Error, 
          { input }
        );
        throw error; // Re-lança o erro para o chamador
      }
    }
  );
}
