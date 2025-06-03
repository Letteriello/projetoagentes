// src/lib/logger.ts
import { genkitFlow, WrappedFlow } from '@genkit-ai/flow';
import { instrumentation } from '@genkit-ai/core';
// Certifique-se de que 'firebaseAdmin.ts' está em 'src/lib/' e exporta 'firestore' e 'admin'
import { firestore, admin } from './firebaseAdmin'; 

const LOGS_COLLECTION = 'agent_logs_v3'; // Nome da coleção incrementado

interface LogEntry {
  timestamp: admin.firestore.Timestamp;
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

export function createLoggableFlow<Request, Response>(
  name: string,
  flow: WrappedFlow<Request, Response>
): WrappedFlow<Request, Response> {
  return genkitFlow(
    {
      name,
      // Considere adicionar schemas de entrada/saída para validação e observabilidade
      // inputSchema: z.any(), 
      // outputSchema: z.any(),
    },
    async (input: Request, streamingCallback?: (chunk: Response) => void) => {
      const agentId = (input as any)?.agentId || 'unknown_agent';
      
      await enhancedLogger.logStart(name, agentId, input);
      try {
        const result = await flow(input, streamingCallback);
        await enhancedLogger.logEnd(name, agentId, result);
        return result;
      } catch (error: any) {
        await enhancedLogger.logError(name, agentId, error, { input });
        throw error;
      }
    }
  );
}

// NOTA: Nenhuma exportação padrão aqui, enhancedLogger já é exportado como uma constante nomeada.
