import { genkitFlow, WrappedFlow } from '@genkit-ai/flow';
import { instrumentation } from '@genkit-ai/core';
import { firestore }-> {
  // Assuming firebaseAdmin.ts initializes and exports firestore
  // Adjust the import path if your file structure is different
  try {
    // Attempt to import from the standard path
    return import('../lib/firebaseAdmin');
  } catch (e) {
    // Fallback for potential differences in compiled output structure
    return import('./firebaseAdmin');
  }
};

const LOGS_COLLECTION = 'agent_logs';

interface LogEntry {
  timestamp: admin.firestore.Timestamp;
  agentId?: string;
  flowName: string;
  type: 'start' | 'end' | 'tool_call' | 'error' | 'info';
  data: any;
}

async function writeLog(logEntry: Omit<LogEntry, 'timestamp'>) {
  const db = (await firestore()).firestore;
  try {
    await db.collection(LOGS_COLLECTION).add({
      ...logEntry,
      timestamp: admin.firestore.Timestamp.now(),
    });
  } catch (error) {
    console.error('Failed to write log to Firestore:', error);
    // Fallback to console logging if Firestore fails
    console.log('[FALLBACK_LOG]', logEntry);
  }
}

export const logger = {
  logStart: instrumentation.instrument(
    {
      tag: 'logger.logStart',
    },
    async (flowName: string, agentId?: string, input?: any) => {
      await writeLog({
        flowName,
        agentId,
        type: 'start',
        data: { input },
      });
    }
  ),

  logEnd: instrumentation.instrument(
    {
      tag: 'logger.logEnd',
    },
    async (flowName: string, agentId?: string, output?: any) => {
      await writeLog({
        flowName,
        agentId,
        type: 'end',
        data: { output },
      });
    }
  ),

  logToolCall: instrumentation.instrument(
    {
      tag: 'logger.logToolCall',
    },
    async (
      flowName: string,
      agentId?: string,
      toolName?: string,
      input?: any,
      output?: any
    ) => {
      await writeLog({
        flowName,
        agentId,
        type: 'tool_call',
        data: { toolName, input, output },
      });
    }
  ),

  logError: instrumentation.instrument(
    {
      tag: 'logger.logError',
    },
    async (flowName: string, agentId?: string, error?: any, details?: any) => {
      await writeLog({
        flowName,
        agentId,
        type: 'error',
        data: {
          error: error ? { name: error.name, message: error.message, stack: error.stack } : 'Unknown error',
          details,
        },
      });
    }
  ),

  logInfo: instrumentation.instrument(
    {
      tag: 'logger.logInfo',
    },
    async (flowName: string, agentId?: string, message?: string, data?: any) => {
      await writeLog({
        flowName,
        agentId,
        type: 'info',
        data: { message, ...data },
      });
    }
  ),
};

// Example of how to wrap a Genkit flow to automatically log its start and end.
export function loggableFlow<Request, Response>(
  name: string,
  flow: WrappedFlow<Request, Response>
): WrappedFlow<Request, Response> {
  return genkitFlow(
    {
      name,
      // You might want to add input/output schemas here if needed
      // inputSchema: z.any(),
      // outputSchema: z.any(),
    },
    async (input: Request, streamingCallback?: (chunk: Response) => void) => {
      // Here, you might not have agentId directly unless it's part of the input
      // or available in a broader context. For now, we'll pass undefined.
      // Consider how agentId will be available in your flows.
      const agentId = (input as any)?.agentId || 'unknown_agent';

      await logger.logStart(name, agentId, input);
      try {
        const result = await flow(input, streamingCallback);
        await logger.logEnd(name, agentId, result);
        return result;
      } catch (error: any) {
        await logger.logError(name, agentId, error, input);
        throw error; // Re-throw the error to maintain original flow behavior
      }
    }
  );
}

export default logger;

// Re-export admin for convenience if other parts of your app use it via logger
// However, it's generally better to import admin directly where needed.
// export { admin };

// It looks like admin is not directly re-exported or used in a way that TS can statically analyze
// for the 'admin.firestore.Timestamp.now()' call within writeLog.
// We need to ensure 'admin' is correctly imported and available.

// Let's try to get the admin namespace directly for Timestamp
import * as admin from 'firebase-admin';
// This might cause issues if admin is not initialized when this module is loaded.
// The dynamic import pattern for firestore aims to mitigate this,
// but Timestamp is a static type.

// A better way for Timestamp might be to pass it from the initialized admin instance.
// For now, this direct import of 'firebase-admin' for the type might be okay
// as 'firebaseAdmin.ts' should ensure initialization.
// If 'admin.firestore' is not available when 'writeLog' is called, it will fail.
// The dynamic import for `firestore()` should handle the async nature of initialization.
// However, `admin.firestore.Timestamp` is accessed synchronously.

// The dynamic import for firestore should be:
// const { firestore: db, Timestamp } = await import('../lib/firebaseAdmin');
// And then use Timestamp directly. Let's adjust `writeLog`.

// Adjusted writeLog to correctly get Timestamp
async function writeLogAdjusted(logEntry: Omit<LogEntry, 'timestamp'>) {
  const firebaseAdmin = await firestore(); // This gets the module with exports
  const db = firebaseAdmin.firestore;
  const Timestamp = firebaseAdmin.admin.firestore.Timestamp; // Access Timestamp via the resolved module

  try {
    await db.collection(LOGS_COLLECTION).add({
      ...logEntry,
      timestamp: Timestamp.now(), // Use the correctly accessed Timestamp
    });
  } catch (error) {
    console.error('Failed to write log to Firestore:', error);
    console.log('[FALLBACK_LOG]', logEntry);
  }
}

// Re-assign logger functions to use the adjusted writeLog
logger.logStart = instrumentation.instrument(
  { tag: 'logger.logStart' },
  async (flowName: string, agentId?: string, input?: any) => {
    await writeLogAdjusted({ flowName, agentId, type: 'start', data: { input } });
  }
);
logger.logEnd = instrumentation.instrument(
  { tag: 'logger.logEnd' },
  async (flowName: string, agentId?: string, output?: any) => {
    await writeLogAdjusted({ flowName, agentId, type: 'end', data: { output } });
  }
);
logger.logToolCall = instrumentation.instrument(
  { tag: 'logger.logToolCall' },
  async (flowName: string, agentId?: string, toolName?: string, input?: any, output?: any) => {
    await writeLogAdjusted({ flowName, agentId, type: 'tool_call', data: { toolName, input, output } });
  }
);
logger.logError = instrumentation.instrument(
  { tag: 'logger.logError' },
  async (flowName: string, agentId?: string, error?: any, details?: any) => {
    await writeLogAdjusted({
      flowName,
      agentId,
      type: 'error',
      data: { error: error ? { name: error.name, message: error.message, stack: error.stack } : 'Unknown error', details },
    });
  }
);
logger.logInfo = instrumentation.instrument(
  { tag: 'logger.logInfo' },
  async (flowName: string, agentId?: string, message?: string, data?: any) => {
    await writeLogAdjusted({ flowName, agentId, type: 'info', data: { message, ...data } });
  }
);

// The initial LogEntry interface used admin.firestore.Timestamp.
// This means 'firebase-admin' module must be available when this interface is defined.
// It's better to ensure 'admin' is imported at the top for types.
// The dynamic import is for runtime Firestore instance access.
// Let's ensure the 'admin' type import is robust.

// Final check on imports and types:
// import * as admin from 'firebase-admin'; // For types like admin.firestore.Timestamp
// import { genkitFlow, WrappedFlow } from '@genkit-ai/flow';
// import { instrumentation } from '@genkit-ai/core';
// Dynamically import firebaseAdmin for runtime values:
// const firestoreAdminModule = () => {
//   try {
//     return import('../lib/firebaseAdmin');
//   } catch (e) {
//     return import('./firebaseAdmin'); // Fallback for path differences
//   }
// };

// The LogEntry interface should use the imported admin type.
// interface LogEntry {
//   timestamp: admin.firestore.Timestamp; // Correctly uses 'admin' from 'import * as admin from "firebase-admin";'
//   ...
// }

// The writeLogAdjusted function should get Timestamp from the dynamically imported module.
// async function writeLogAdjusted(logEntry: Omit<LogEntry, 'timestamp'>) {
//   const adminModule = await firestoreAdminModule();
//   const db = adminModule.firestore;
//   const Timestamp = adminModule.admin.firestore.Timestamp; // Make sure 'admin' is exported from 'firebaseAdmin.ts'
//   ...
// }
// For this to work, firebaseAdmin.ts must export 'admin' itself, not just 'firestore'.
// Current firebaseAdmin.ts: `export default admin; export const firestore = admin.firestore();`
// So, `adminModule.default.firestore.Timestamp` or `adminModule.admin.firestore.Timestamp` if we add `export { admin }`

// Let's simplify and assume firebaseAdmin.ts correctly handles initialization
// and that its exports are consistently available.
// The primary concern is async initialization vs. sync module loading.
// Genkit plugins often handle this by initializing in a configure() step.

// The provided code for logger.ts has a dynamic import for firestore:
// `const firestore = () => { ... return import('../lib/firebaseAdmin'); ... }`
// This returns the *module* `firebaseAdmin.ts`.
// So, `(await firestore()).firestore` gets the db instance.
// And `(await firestore()).default.firestore.Timestamp` for Timestamp if 'admin' is default export.
// Or `(await firestore()).admin.firestore.Timestamp` if 'admin' is a named export.

// Let's assume firebaseAdmin.ts is:
// import * as fbAdmin from 'firebase-admin';
// ... init fbAdmin ...
// export const firestore = fbAdmin.firestore();
// export const admin = fbAdmin; // Exporting the admin namespace
// Then the dynamic import will provide access to these.

// The code had this at the end: import * as admin from 'firebase-admin';
// This is fine for type usage (LogEntry) and potentially for Timestamp if admin is initialized globally.
// But the dynamic import is safer for runtime values.

// The `writeLogAdjusted` function's way of getting Timestamp is:
// `const firebaseAdmin = await firestore();` (gets module)
// `const Timestamp = firebaseAdmin.admin.firestore.Timestamp;`
// This requires `firebaseAdmin.ts` to `export { admin }` (the namespace).
// Let's check `firebaseAdmin.ts` again: it does `export default admin;`
// So it should be `firebaseAdmin.default.firestore.Timestamp`.

// Final proposed structure for writeLog:
// (Ensuring admin types are imported at top, and runtime values are from dynamic import)

import * as admin from 'firebase-admin'; // For types like admin.firestore.Timestamp
import { genkitFlow, WrappedFlow } from '@genkit-ai/flow';
import { instrumentation } from '@genkit-ai/core';

// Dynamic import for Firestore instance and admin namespace
const getFirebaseInstances = () => {
  try {
    return import('../lib/firebaseAdmin');
  } catch (e) {
    // Adjust path for potential build/runtime differences
    console.warn("Could not import firebaseAdmin from ../lib/firebaseAdmin, trying ./firebaseAdmin");
    return import('./firebaseAdmin');
  }
};

const LOGS_COLLECTION_V2 = 'agent_flow_logs'; // Renamed to avoid conflict if old logs exist

interface LogEntryV2 {
  timestamp: admin.firestore.Timestamp; // Uses the 'admin' type import
  agentId?: string;
  flowName: string;
  type: 'start' | 'end' | 'tool_call' | 'error' | 'info';
  traceId?: string; // For linking with Genkit traces
  data: any;
}

async function writeLogToFirestore(logEntry: Omit<LogEntryV2, 'timestamp'>) {
  try {
    const firebaseAdminModule = await getFirebaseInstances();
    const db = firebaseAdminModule.firestore; // Assuming 'firestore' is an export
    // 'firebaseAdmin.ts' exports 'default admin' and 'firestore'.
    // So, Timestamp should be from 'default.firestore.Timestamp'.
    const Timestamp = firebaseAdminModule.default.firestore.Timestamp;

    if (!db || !Timestamp) {
        console.error('Firestore or Timestamp is not available from firebaseAdmin module.');
        console.log('[FALLBACK_LOG]', logEntry);
        return;
    }

    await db.collection(LOGS_COLLECTION_V2).add({
      ...logEntry,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Failed to write log to Firestore:', error);
    console.log('[FALLBACK_LOG]', logEntry);
  }
}

export const enhancedLogger = {
  logStart: instrumentation.instrument(
    { tag: 'logger.logStart' },
    async (flowName: string, agentId?: string, input?: any) => {
      const traceId = instrumentation.getTraceId();
      await writeLogToFirestore({ flowName, agentId, type: 'start', traceId, data: { input } });
    }
  ),

  logEnd: instrumentation.instrument(
    { tag: 'logger.logEnd' },
    async (flowName: string, agentId?: string, output?: any) => {
      const traceId = instrumentation.getTraceId();
      await writeLogToFirestore({ flowName, agentId, type: 'end', traceId, data: { output } });
    }
  ),

  logToolCall: instrumentation.instrument(
    { tag: 'logger.logToolCall' },
    async (flowName: string, agentId?: string, toolName?: string, input?: any, output?: any) => {
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
    { tag: 'logger.logError' },
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
    { tag: 'logger.logInfo' },
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
      // Consider adding input/output schemas for validation and observability
      // inputSchema: z.any(),
      // outputSchema: z.any(),
    },
    async (input: Request, streamingCallback?: (chunk: Response) => void) => {
      // Attempt to extract agentId from input, default if not available.
      // This part might need customization based on how agentId is passed in your application.
      const agentId = (input as any)?.agentId || 'unknown_agent';
      const traceId = instrumentation.getTraceId(); // Get traceId at the start of the flow

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

// Export the new logger
export default enhancedLogger;
