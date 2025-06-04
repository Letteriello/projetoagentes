// Logging para browser: substitua Winston por console.log
export const winstonBrowser = {
  info: (...args: any[]) => console.info('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  debug: (...args: any[]) => console.debug('[DEBUG]', ...args),
};

      format: combine(
        colorize(),
        browserFormat
      )
    })
  ]
});

// Adiciona tratamento de erros não capturados
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    winstonBrowser.error('Erro não capturado', {
      message: event.message,
      error: event.error,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    winstonBrowser.error('Promise não tratada', {
      reason: event.reason,
      error: event.reason instanceof Error ? event.reason.stack : event.reason
    });
  });
}
