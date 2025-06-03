/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações de construção para melhorar estabilidade
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  
  // Configurações importantes para produção
  output: 'standalone', // Modo standalone para melhor isolamento
  
  // Configuração de módulos externos no servidor
  serverExternalPackages: [
    'google-auth-library',
    'gcp-metadata',
    'gtoken',
    'agent-base',
    'https-proxy-agent',
    '@opentelemetry/exporter-jaeger'
  ],
  
  // Configuração para melhor compatibilidade com Genkit e Firebase
  typescript: {
    // Ignorar erros durante o desenvolvimento
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // Ignorar erros durante o desenvolvimento
    // ignoreDuringBuilds: true,
  },
  
  // Melhorias para chunks e cache
  webpack: (config, { isServer, dev }) => {
    // Adicionar loader para Handlebars
    config.module.rules.push({
      test: /\.hbs$/,
      use: 'handlebars-loader',
    });

    // Configuração para ignorar avisos de require.extensions
    config.module.noParse = /(node_modules\/|\\.hbs$)/;
    
    // Melhoria cruzada para TODOS os chunks para evitar ChunkLoadError
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
    
    // Resolver fallbacks para bibliotecas de browser para os agentes AI
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        events: require.resolve('events'),
        process: require.resolve('process/browser'),
        util: require.resolve('util'),
        stream: require.resolve('stream-browserify'),
        crypto: require.resolve('crypto-browserify'),
        zlib: require.resolve('browserify-zlib'),
        querystring: require.resolve('querystring-es3'),
        assert: require.resolve('assert'),
        url: require.resolve('url'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        fs: false,
        child_process: false,
        net: false,
        tls: false
      };
      
      // Cache busting para evitar problemas de ChunkLoadError após atualizações
      config.output.filename = dev
        ? 'static/chunks/[name].js'
        : 'static/chunks/[name].[contenthash].js';
      config.output.chunkFilename = dev
        ? 'static/chunks/[name].js'
        : 'static/chunks/[name].[contenthash].js';
    }
    
    // Plugins cruciais para estabilidade de carregamento
    if (!isServer) {
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ContextReplacementPlugin(/keyv/),
        new webpack.IgnorePlugin({
          resourceRegExp: /\.md$/,
        })
      );
    }
    
    return config;
  },
};

module.exports = nextConfig;
