// src/lib/logger/index.ts

// Determine if the environment is development
// For Next.js, NEXT_PUBLIC_NODE_ENV might be more appropriate if this needs to be client-accessible
// and configured through environment variables. For simplicity, using process.env.NODE_ENV.
const isDevelopment = process.env.NODE_ENV === 'development';

const consoleLogger = {
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    // As per instructions, info logs are development-only for now
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  verbose: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[VERBOSE] ${message}`, ...args); // console.verbose is not standard, using console.log
    }
  },
  // 'silly' is not a standard console method, using console.debug or console.log if needed
  silly: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.debug(`[SILLY] ${message}`, ...args); // Or console.log
    }
  }
};

// Add global error handlers for client-side
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event: ErrorEvent) => {
    // Log the error object itself if available, otherwise the message
    consoleLogger.error('Unhandled global error:', event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      // It's good practice to pass the event object itself for more details if needed
      eventObject: event
    });
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    consoleLogger.error('Unhandled promise rejection:', event.reason, {
      // It's good practice to pass the event object itself for more details if needed
      eventObject: event
    });
  });
}

export const logger = consoleLogger;

// Optionally, export individual methods if that's a common pattern in the project
export const debug = consoleLogger.debug;
export const info = consoleLogger.info;
export const warn = consoleLogger.warn;
export const error = consoleLogger.error;
export const verbose = consoleLogger.verbose;
export const silly = consoleLogger.silly;

// It's good practice to also provide a no-op logger for environments where logging is not desired
// or to easily disable all logs. However, the current setup handles this with NODE_ENV checks.

// Note: The original file had 'Logger' type export from 'winston'.
// Since Winston is removed, this type export is no longer applicable.
// If a generic logger type is needed, it could be defined here:
/*
export interface LoggerMethods {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  verbose?: (message: string, ...args: any[]) => void;
  silly?: (message: string, ...args: any[]) => void;
}
export type Logger = LoggerMethods;
*/
