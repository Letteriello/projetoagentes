'use client';

import { createContext, useContext, useEffect } from 'react';

// Define a logger interface
interface Logger {
  info: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
  verbose: (message: string, meta?: any) => void;
  silly: (message: string, meta?: any) => void;
}

const formatMeta = (meta?: any): string => {
  if (meta && typeof meta === 'object' && Object.keys(meta).length > 0) {
    try {
      return JSON.stringify(meta, null, 2);
    } catch (e) {
      return '[Unserializable meta]';
    }
  }
  return '';
};

// Create a browser-safe logger object
const browserLog: Logger = {
  info: (message, meta) => console.info(`${new Date().toISOString()} [INFO]: ${message} ${formatMeta(meta)}`),
  error: (message, meta) => console.error(`${new Date().toISOString()} [ERROR]: ${message} ${formatMeta(meta)}`),
  warn: (message, meta) => console.warn(`${new Date().toISOString()} [WARN]: ${message} ${formatMeta(meta)}`),
  debug: (message, meta) => console.debug(`${new Date().toISOString()} [DEBUG]: ${message} ${formatMeta(meta)}`),
  // console.verbose and console.silly are not standard, map to console.log or console.debug
  verbose: (message, meta) => console.log(`${new Date().toISOString()} [VERBOSE]: ${message} ${formatMeta(meta)}`),
  silly: (message, meta) => console.log(`${new Date().toISOString()} [SILLY]: ${message} ${formatMeta(meta)}`),
};

const LoggerContext = createContext<Logger | null>(null);

export function LoggerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Log de inicialização apenas no navegador
    browserLog.info('Logger do navegador inicializado');
    
    browserLog.debug('Informações do navegador', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
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
    throw new Error('useLogger deve ser usado dentro de um LoggerProvider');
  }
  return logger;
}

// Exporta o logger para uso direto quando necessário
export { browserLog as log };

