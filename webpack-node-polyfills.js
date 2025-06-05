// Polyfills para módulos do Node.js no navegador
const webpack = require('webpack');

// Lista de módulos do Node.js que devem ser polifillados
const nodePolyfills = {
  // Módulos principais
  fs: 'empty',
  net: 'empty',
  tls: 'empty',
  dns: 'empty',
  dgram: 'empty',
  child_process: 'empty',
  // Módulos adicionais
  async_hooks: 'empty',
  'async_hooks/promises': 'empty',
  'fs/promises': 'empty',
  http2: 'empty',
  module: 'empty',
  perf_hooks: 'empty',
  tty: 'empty',
  worker_threads: 'empty',
  // Versões com prefixo node:
  'node:async_hooks': 'empty',
  'node:child_process': 'empty',
  'node:crypto': 'empty',
  'node:dgram': 'empty',
  'node:dns': 'empty',
  'node:fs': 'empty',
  'node:http2': 'empty',
  'node:https': 'empty',
  'node:module': 'empty',
  'node:net': 'empty',
  'node:os': 'empty',
  'node:path': 'empty',
  'node:perf_hooks': 'empty',
  'node:process': 'empty',
  'node:stream': 'empty',
  'node:tls': 'empty',
  'node:tty': 'empty',
  'node:url': 'empty',
  'node:util': 'empty',
  'node:worker_threads': 'empty',
  'node:zlib': 'empty',
};

// Módulos que devem ser ignorados
const ignoreModules = [
  '@opentelemetry/sdk-trace-node',
  'firebase-functions',
  '@google-cloud/firestore',
  'firebase-admin',
  'genkit',
  '@genkit-ai/.*',
  'keyv',
  'pino',
  'pino-pretty',
  'pino-std-serializers'
];

// Configuração do Webpack
module.exports = function override(config, { isServer }) {
  // Apenas para o cliente
  if (!isServer) {
    // Configurar fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      ...nodePolyfills,
      // Fallbacks para módulos do browser
      url: require.resolve('url/'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      process: require.resolve('process/browser'),
      stream: require.resolve('stream-browserify'),
      util: require.resolve('util/'),
      buffer: require.resolve('buffer/'),
      querystring: require.resolve('querystring-es3'),
      crypto: require.resolve('crypto-browserify'),
      zlib: require.resolve('browserify-zlib'),
      assert: require.resolve('assert/')
    };

    // Adicionar plugins
    config.plugins.push(
      // Plugin para lidar com imports com prefixo node:
      new webpack.NormalModuleReplacementPlugin(
        /^node:/,
        (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        }
      ),
      // Ignorar módulos específicos
      ...ignoreModules.map(
        mod => new webpack.IgnorePlugin({ 
          resourceRegExp: new RegExp(`^${mod}$`),
          contextRegExp: /./
        })
      )
    );
  }


  return config;
};
