// Interface para o parâmetro info do logger
interface LogInfo {
  timestamp: string;
  level: string;
  message: string;
  stack?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

// Verifica se está rodando no navegador ou no Node.js
const isBrowser = typeof window !== 'undefined';

// Implementação do logger seguro para navegador
const createBrowserLogger = () => {
  const log = (level: string, message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (meta && typeof meta === 'object') {
      try {
        meta = JSON.stringify(meta, null, 2);
      } catch (e) {
        meta = String(meta);
      }
    }
    
    switch (level.toLowerCase()) {
      case 'error':
        console.error(logMessage, meta || '');
        break;
      case 'warn':
        console.warn(logMessage, meta || '');
        break;
      case 'info':
        console.info(logMessage, meta || '');
        break;
      case 'debug':
      case 'verbose':
      case 'silly':
        console.debug(logMessage, meta || '');
        break;
      default:
        console.log(logMessage, meta || '');
    }
  };
  
  return {
    log: (level: string, message: string, meta?: any) => log(level, message, meta),
    error: (message: string, meta?: any) => log('error', message, meta),
    warn: (message: string, meta?: any) => log('warn', message, meta),
    info: (message: string, meta?: any) => log('info', message, meta),
    debug: (message: string, meta?: any) => log('debug', message, meta),
    verbose: (message: string, meta?: any) => log('verbose', message, meta),
    silly: (message: string, meta?: any) => log('silly', message, meta),
  };
};

// Cria o logger apropriado para o ambiente
const winstonLogger = isBrowser 
  ? createBrowserLogger() 
  : (() => {
      // Configuração do logger para Node.js
      const { createLogger, format, transports } = require('winston');
      const path = require('path');
      const logDir = path.join(process.cwd(), 'logs');
      
      const logger = createLogger({
        level: 'info',
        format: format.combine(
          format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
          }),
          format.errors({ stack: true }),
          format.splat(),
          format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label', 'stack'] })
        ),
        transports: [
          new transports.Console({
            format: format.combine(
              format.colorize(),
              format.printf((info: LogInfo) => {
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
            maxFiles: 5,
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
            maxFiles: 5,
            tailable: true,
          })
        ],
        exceptionHandlers: [
          new transports.File({ 
            filename: path.join(logDir, 'exceptions.log'), 
            format: format.json() 
          })
        ],
        exitOnError: false,
      });
      
      return logger;
    })();

// Exporta o logger
export { winstonLogger };