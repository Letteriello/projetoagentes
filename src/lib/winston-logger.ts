import { createLogger, format, transports } from 'winston';
import path from 'path'; // Import path for log file paths

// Define log directory
const logDir = path.join(process.cwd(), 'logs');

// Define the logger instance
export const winstonLogger = createLogger({
  level: 'info', // Default level for the logger
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }), // Include stack traces for errors
    format.splat(), // Necessary for string interpolation like %s, %d
    format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label', 'stack'] }) // Collects rest into metadata
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(info => {
          const metadataString = Object.keys(info.metadata || {}).length > 0
            ? `\n${JSON.stringify(info.metadata, null, 2)}`
            : '';
          return `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}${metadataString}`;
        })
      )
    }),
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5, // Keep up to 5 log files
      tailable: true,
    }),
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5, // Keep up to 5 log files
      tailable: true,
    })
  ],
  exceptionHandlers: [ // Optional: Log unhandled exceptions
    new transports.File({ filename: path.join(logDir, 'exceptions.log'), format: format.json() })
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// Exemplo de uso (removido para evitar execução no lado do cliente)
// winstonLogger.info('Mensagem informativa');
// winstonLogger.error('Mensagem de erro', new Error('Erro de exemplo'));
// winstonLogger.warn('Aviso com dados adicionais', { dado1: 'valor1', dado2: 'valor2' });
