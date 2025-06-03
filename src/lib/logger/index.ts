import { winstonBrowser } from '../winston-browser';

// Exporta o logger otimizado para o navegador
export const logger = winstonBrowser;

// Tipos úteis para o logger
export type { Logger } from 'winston';

// Funções auxiliares para facilitar o uso
export const log = {
  info: (message: string, meta?: any) => winstonBrowser.info(message, meta),
  error: (message: string, meta?: any) => winstonBrowser.error(message, meta),
  warn: (message: string, meta?: any) => winstonBrowser.warn(message, meta),
  debug: (message: string, meta?: any) => winstonBrowser.debug(message, meta),
  verbose: (message: string, meta?: any) => winstonBrowser.verbose(message, meta),
  silly: (message: string, meta?: any) => winstonBrowser.silly(message, meta),
};
