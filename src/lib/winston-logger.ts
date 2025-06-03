import { createLogger, format, transports } from 'winston';

// Define the logger instance
export const winstonLogger = createLogger({
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }), // Include stack traces for errors
    format.json(), // Output logs in JSON format
    format.printf(info => {
      // Basic log message
      let logMessage = `${info.timestamp} - ${info.level}: ${info.message}`;

      // Add stack trace if present
      if (info.stack) {
        logMessage += `\nStack: ${info.stack}`;
      }

      // Add any additional properties, excluding the standard ones already handled
      const additionalInfo: { [key: string]: any } = {};
      for (const key in info) {
        if (Object.prototype.hasOwnProperty.call(info, key) && !['timestamp', 'level', 'message', 'stack', 'splat', 'label', 'ms'].includes(key)) {
          additionalInfo[key] = info[key];
        }
      }

      if (Object.keys(additionalInfo).length > 0) {
        logMessage += ` ${JSON.stringify(additionalInfo, null, 2)}`;
      }

      return logMessage;
    })
  ),
  transports: [
    new transports.Console(),
  ],
});

// Exemplo de uso (removido para evitar execução no lado do cliente)
// winstonLogger.info('Mensagem informativa');
// winstonLogger.error('Mensagem de erro', new Error('Erro de exemplo'));
// winstonLogger.warn('Aviso com dados adicionais', { dado1: 'valor1', dado2: 'valor2' });
