/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  output: 'standalone',
  
  // Configurações experimentais
  experimental: {
    // Configurações experimentais podem ser adicionadas aqui
  },
  
  // Módulos externos no servidor
  serverExternalPackages: [
    'google-auth-library',
    'gcp-metadata',
    'gtoken',
    'agent-base',
    'https-proxy-agent',
    '@opentelemetry/exporter-jaeger',
    'firebase-functions',
    '@google-cloud/firestore',
    '@opentelemetry/sdk-trace-node',
    'setimmediate'
  ],
  
  // Configuração do TypeScript
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configuração do ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Pacotes para transpilar
  transpilePackages: [
    '@opentelemetry',
    '@google-cloud',
    'firebase-admin',
    'genkit',
    '@genkit-ai',
    'firebase',
    'buffer',
    'process',
    'stream-browserify',
    'util',
    'path-browserify',
    'os-browserify',
    'crypto-browserify',
    'stream-http',
    'https-browserify',
    'querystring-es3',
    'browserify-zlib',
    'assert'
  ],
  
  // Configuração do Webpack
  webpack: (config, { isServer, dev, webpack }) => {
    // Adicionar loader para Handlebars
    config.module.rules.push({
      test: /\.hbs$/,
      use: 'handlebars-loader',
    });
    
    // Configuração para o cliente (browser)
    if (!isServer) {
      // Módulos para ignorar no cliente
      const modulesToIgnore = [
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

      // Adicionar IgnorePlugin para módulos do servidor
      config.plugins.push(
        ...modulesToIgnore.map(
          mod => new webpack.IgnorePlugin({ 
            resourceRegExp: new RegExp(`^${mod}$`),
            contextRegExp: /./
          })
        ),
        // Plugin para lidar com imports com prefixo node:
        new webpack.NormalModuleReplacementPlugin(
          /^node:/,
          (resource) => {
            resource.request = resource.request.replace(/^node:/, '');
          }
        )
      );
      
      // Configurar fallbacks para módulos do Node.js
      config.resolve.fallback = {
        // Módulos comuns do Node.js
        path: 'path-browserify',
        os: 'os-browserify/browser',
        crypto: 'crypto-browserify',
        stream: 'stream-browserify',
        http: 'stream-http',
        https: 'https-browserify',
        zlib: 'browserify-zlib',
        util: 'util/',
        buffer: 'buffer/',
        assert: 'assert/',
        querystring: 'querystring-es3',
        url: 'url/',
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        tty: false,
        module: false,
        dgram: false,
        worker_threads: false,
        perf_hooks: false,
        async_hooks: false,
        http2: false,
        fs: false,
        'fs/promises': false
      };
      
      // Adicionar alias para setImmediate
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        setImmediate: 'setimmediate'
      };
      
      // Adicionar polyfills para o navegador
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
          setImmediate: ['setimmediate', 'setImmediate']
        }),
        new webpack.ContextReplacementPlugin(/keyv/)
      );
      
      // Garantir que o polyfill seja incluído no bundle
      config.resolve.fallback.setImmediate = require.resolve('setimmediate');
    }
    
    return config;
  },
};

module.exports = nextConfig;
