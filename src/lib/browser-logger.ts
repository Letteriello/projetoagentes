import { createLogger, format, transports } from 'winston';

// Verifica se estamos no navegador
const isBrowser = typeof window !== 'undefined';

// Configuração básica do logger
const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'agentverse-client' },
  transports: [
    // No navegador, usamos apenas o console
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(
          ({ level, message, timestamp, ...meta }) => {
            return `${timestamp} [${level}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
            }`;
          }
        )
      )
    })
  ]
});

// Se não estivermos no navegador, adicionamos transporte para arquivo
if (!isBrowser) {
  logger.add(
    new transports.File({ filename: 'logs/error.log', level: 'error' })
  );
  logger.add(new transports.File({ filename: 'logs/combined.log' }));
}

export const browserLogger = logger;
