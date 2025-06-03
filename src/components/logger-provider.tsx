'use client';

import { createContext, useContext, useEffect } from 'react';
import { createLogger, format, transports } from 'winston';

// Polyfill para setImmediate no navegador
if (typeof setImmediate === 'undefined') {
  global.setImmediate = (callback: (...args: any[]) => void, ...args: any[]) => {
    return setTimeout(callback, 0, ...args);
  } as any;
}

// Cria uma instância do logger otimizada para o navegador
const winstonBrowser = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        })
      )
    })
  ]
});

// Cria um objeto de log com métodos auxiliares
const log = {
  info: (message: string, meta?: any) => winstonBrowser.info(message, meta),
  error: (message: string, meta?: any) => winstonBrowser.error(message, meta),
  warn: (message: string, meta?: any) => winstonBrowser.warn(message, meta),
  debug: (message: string, meta?: any) => winstonBrowser.debug(message, meta),
  verbose: (message: string, meta?: any) => winstonBrowser.verbose(message, meta),
  silly: (message: string, meta?: any) => winstonBrowser.silly(message, meta),
};

const LoggerContext = createContext<typeof winstonBrowser | null>(null);

export function LoggerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Log de inicialização apenas no navegador
    if (typeof window !== 'undefined') {
      log.info('Logger do navegador inicializado');
      
      // Exemplo de log de informações do navegador
      log.debug('Informações do navegador', {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookiesEnabled: navigator.cookieEnabled,
        online: navigator.onLine,
      });
    }
  }, []);

  return (
    <LoggerContext.Provider value={winstonBrowser}>
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
export { log };

