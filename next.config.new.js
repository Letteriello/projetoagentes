/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações básicas
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  output: 'standalone',
  
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
  
  // Configurações de TypeScript e ESLint
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  
  // Configuração do Webpack
  webpack: (config, { isServer, webpack }) => {
    // Ignorar módulos problemáticos no cliente
    if (!isServer) {
      // Lista de módulos para ignorar
      const ignoreModules = [
        '@opentelemetry/sdk-trace-node',
        'firebase-functions',
        '@google-cloud/firestore',
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
        'worker_threads'
      ];
      
      // Adicionar plugins para ignorar os módulos
      ignoreModules.forEach(module => {
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: new RegExp(`^${module.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
          })
        );
      });
      
      // Configurar fallbacks para módulos do Node.js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Módulos comuns do Node.js
        fs: false,
        net: false,
        tls: false,
        dns: false,
        dgram: false,
        child_process: false,
        // Módulos específicos que estão causando erros
        async_hooks: false,
        'async_hooks/promises': false,
        'fs/promises': false,
        http2: false,
        module: false,
        perf_hooks: false,
        tty: false,
        worker_threads: false
      };
    }
    
    return config;
  }
};

module.exports = nextConfig;
