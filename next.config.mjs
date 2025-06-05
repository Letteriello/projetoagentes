import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações de construção para melhorar estabilidade
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  
  // Configurações importantes para produção
  output: 'standalone', // Modo standalone para melhor isolamento
  
  // Configuração do Turbopack (estável)
  turbopack: {
    // Configurações do Turbopack
  },
  
  // Configuração de módulos externos no servidor
  experimental: {
    // Configurações experimentais podem ser adicionadas aqui
  },
  
  // Configuração de módulos externos no servidor
  serverExternalPackages: [
    'google-auth-library',
    'gcp-metadata',
    'gtoken',
    'agent-base',
    'https-proxy-agent',
    '@opentelemetry/exporter-jaeger',
    'firebase-functions',
    '@google-cloud/firestore',
    '@opentelemetry/sdk-trace-node'
  ],
  
  // Configuração para melhor compatibilidade com Genkit e Firebase
  typescript: {
    // Ignorar erros durante o desenvolvimento
    ignoreBuildErrors: true,
  },
  
  eslint: {
    // Ignorar erros durante o desenvolvimento
    ignoreDuringBuilds: true,
  },
  
  // Configuração para ignorar erros de tipagem em módulos de terceiros
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
  
  // Configuração personalizada do Webpack
  webpack: (config, { isServer, dev, webpack }) => {
    // Adicionar loader para Handlebars
    config.module.rules.push({
      test: /\.hbs$/,
      use: 'handlebars-loader',
    });
    
    // Configuração para ignorar avisos de require.extensions
    config.module.noParse = /(node_modules\/|\.hbs$)/;
    
    // Configuração para o cliente (browser)
    if (!isServer) {
      // Módulos de terceiros que devem ser ignorados no cliente
      const THIRD_PARTY_MODULES_TO_IGNORE = [
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

      // Adicionar IgnorePlugin para módulos de terceiros
      config.plugins.push(
        ...THIRD_PARTY_MODULES_TO_IGNORE.map(
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
        'path': false,
        'fs': false,
        'os': false,
        'crypto': false,
        'stream': false,
        'http': false,
        'https': false,
        'zlib': false,
        'util': false,
        'buffer': false,
        'assert': false,
        'querystring': false,
        'url': false,
        'net': false,
        'tls': false,
        'dns': false,
        'child_process': false,
        'tty': false,
        'module': false,
        'dgram': false,
        'worker_threads': false,
        'perf_hooks': false,
        'async_hooks': false,
        'http2': false,
        'fs/promises': false
      };
      
      // Adicionar polyfills para o navegador
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer']
        })
      );
      
      // Configurações de otimização
      config.optimization = {
        ...config.optimization,
        minimize: !dev, // Apenas minimizar em produção
        runtimeChunk: 'single',
        moduleIds: 'deterministic',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: Infinity,
          minSize: 20000,
          maxSize: 300000,
          cacheGroups: {
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](@react|react|react-dom|next|framer-motion)[\\/]/,
              priority: 40,
              chunks: 'all',
              enforce: true,
            },
            firebase: {
              name: 'firebase',
              test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
              priority: 30,
              chunks: 'all',
              reuseExistingChunk: true,
            },
            genkit: {
              name: 'genkit',
              test: /[\\/]node_modules[\\/](@genkit-ai|genkit|genkitx)[\\/]/,
              priority: 20,
              chunks: 'all',
              reuseExistingChunk: true,
            },
            commons: {
              name: 'commons',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              chunks: 'all',
              reuseExistingChunk: true,
            },
          },
        },
      };
      
      // Plugins adicionais para o cliente
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ContextReplacementPlugin(/keyv/)
      );
      
      // Configurações de saída para evitar problemas de cache
      config.output.filename = dev
        ? 'static/chunks/[name].js'
        : 'static/chunks/[name].[contenthash].js';
      config.output.chunkFilename = dev
        ? 'static/chunks/[name].js'
        : 'static/chunks/[name].[contenthash].js';
    }
    
    return config;
  },
};

export default nextConfig;
