import { createLogger, format, transports } from 'winston';

// Configuração otimizada para o navegador
const { combine, timestamp, printf, colorize } = format;

// Formato personalizado para o navegador
const browserFormat = printf(({ level, message, timestamp, ...meta }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(meta).length > 0) {
    try {
      msg += ` ${JSON.stringify(meta, null, 2)}`;
    } catch (e) {
      // Ignora erros de serialização
      msg += ' [object Object]';
    }
  }
  
  return msg;
});

// Cria o logger otimizado para o navegador
export const winstonBrowser = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    browserFormat
  ),
  transports: [
    new transports.Console({
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
