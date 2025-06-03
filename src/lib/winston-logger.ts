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

// Example usage (optional, can be removed)
winstonLogger.info('This is an informational message.');
winstonLogger.error('This is an error message with a stack trace.', new Error('Example Error'));
winstonLogger.warn('This is a warning message with extra data.', { data1: 'value1', data2: 'value2' });
