'use client';

import { createContext, useContext, useEffect } from 'react';
import { winstonLogger } from '@/lib/winston-logger';

// Define a logger interface
interface Logger {
  info: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
  verbose: (message: string, meta?: any) => void;
  silly: (message: string, meta?: any) => void;
}

// Cria um logger seguro para o navegador
const browserLog: Logger = {
  info: (message, meta) => {
    console.info(`[INFO] ${message}`, meta || '');
    winstonLogger.info(message, meta);
  },
  error: (message, meta) => {
    console.error(`[ERROR] ${message}`, meta || '');
    winstonLogger.error(message, meta);
  },
  warn: (message, meta) => {
    console.warn(`[WARN] ${message}`, meta || '');
    winstonLogger.warn(message, meta);
  },
  debug: (message, meta) => {
    console.debug(`[DEBUG] ${message}`, meta || '');
    winstonLogger.debug(message, meta);
  },
  verbose: (message, meta) => {
    console.debug(`[VERBOSE] ${message}`, meta || '');
    winstonLogger.verbose(message, meta);
  },
  silly: (message, meta) => {
    console.debug(`[SILLY] ${message}`, meta || '');
    winstonLogger.silly(message, meta);
  },
};

const LoggerContext = createContext<Logger>(browserLog);

export function LoggerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Log de inicialização
    browserLog.info('Logger inicializado', {
      environment: typeof window !== 'undefined' ? 'browser' : 'server',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    });
  }, []);

  return (
    <LoggerContext.Provider value={browserLog}>
      {children}
    </LoggerContext.Provider>
  );
}

export function useLogger() {
  const logger = useContext(LoggerContext);
  if (!logger) {
    throw new Error('useLogger must be used within a LoggerProvider');
  }
  return logger;
}

// Exporta o logger para uso direto quando necessário
export { browserLog as log };