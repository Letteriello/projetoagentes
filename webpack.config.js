const { IgnorePlugin } = require('webpack');
const { dirname, resolve } = require('path');

// Lista de módulos do Node.js que devem ser ignorados no cliente
const NODE_MODULES_TO_IGNORE = [
  'async_hooks',
  'child_process',
  'dgram',
  'dns',
  'fs',
  'fs/promises',
  'http2',
  'net',
  'tls',
  'module',
  'perf_hooks',
  'tty',
  'worker_threads',
  // Adicione outros módulos conforme necessário
];

// Módulos de terceiros que devem ser ignorados no cliente
const THIRD_PARTY_MODULES_TO_IGNORE = [
  '@opentelemetry/sdk-trace-node',
  'firebase-functions',
  '@google-cloud/firestore',
  // Adicione outros módulos conforme necessário
];

module.exports = (config, { isServer }) => {
  // Ignorar módulos específicos no cliente
  if (!isServer) {
    // Ignorar módulos do Node.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      ...Object.fromEntries(NODE_MODULES_TO_IGNORE.map(mod => [mod, false])),
      // Adicionar versões com prefixo node:
      ...Object.fromEntries(NODE_MODULES_TO_IGNORE.map(mod => [`node:${mod}`, false]))
    };

    // Adicionar IgnorePlugin para módulos de terceiros
    config.plugins.push(
      ...THIRD_PARTY_MODULES_TO_IGNORE.map(
        mod => new IgnorePlugin({ resourceRegExp: new RegExp(`^${mod}$`) })
      )
    );
  }


  return config;
};

// Adicionar suporte para módulos ES
config.module.rules.push({
  test: /\.m?js$/,
  resolve: {
    fullySpecified: false, // Desativa a necessidade de extensões de arquivo
  },
});
