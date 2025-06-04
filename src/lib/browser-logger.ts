// Logging para browser: substitua Winston por console.log
export const logger = {
  info: (...args: any[]) => console.info('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

});

// Se não estivermos no navegador, adicionamos transporte para arquivo
if (!isBrowser) {
  logger.add(
    new transports.File({ filename: 'logs/error.log', level: 'error' })
  );
  logger.add(new transports.File({ filename: 'logs/combined.log' }));
}

export const browserLogger = logger;
