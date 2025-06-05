import type {NextConfig} from 'next';
// import nextBundleAnalyzer from '@next/bundle-analyzer'; // Commented out
// import webpack from 'webpack'; // Commented out as webpack function is commented out

// const withBundleAnalyzer = nextBundleAnalyzer({
//   enabled: process.env.ANALYZE === 'true',
// });

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  output: 'standalone',
  experimental: {
    // Configurações experimentais podem ser adicionadas aqui
  },
  // serverExternalPackages: [
  //   'google-auth-library',
  //   'gcp-metadata',
  //   'gtoken',
  //   'agent-base',
  //   'https-proxy-agent',
  //   '@opentelemetry/exporter-jaeger',
  //   'firebase-functions',
  //   '@google-cloud/firestore',
  //   '@opentelemetry/sdk-trace-node',
  //   'setimmediate'
  // ],
  typescript: {
    ignoreBuildErrors: false, // Changed from true to false
  },
  eslint: {
    ignoreDuringBuilds: false, // Changed from true to false
  },
  // transpilePackages: [
  //   '@opentelemetry',
  //   '@google-cloud',
  //   'firebase-admin',
  //   'genkit',
  //   '@genkit-ai',
  //   'firebase',
  //   'buffer',
  //   'process',
  //   'stream-browserify',
  //   'util',
  //   'path-browserify',
  //   'os-browserify',
  //   'crypto-browserify',
  //   'stream-http',
  //   'https-browserify',
  //   'querystring-es3',
  //   'browserify-zlib',
  //   'assert'
  // ],
  images: { // Kept from original next.config.ts
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // webpack: (config, { isServer, dev, webpack: webpackInstance }) => { // webpackInstance alias to avoid conflict
  //   // Add loader for Handlebars
  //   config.module.rules.push({
  //     test: /\.hbs$/,
  //     use: 'handlebars-loader',
  //   });
  //
  //   // Configuração para o cliente (browser)
  //   if (!isServer) {
  //     // Módulos para ignorar no cliente
  //     const modulesToIgnore = [
  //       '@opentelemetry/sdk-trace-node',
  //       'firebase-functions',
  //       '@google-cloud/firestore',
  //       'firebase-admin',
  //       'genkit',
  //       '@genkit-ai/.*', // Adjusted to match regex usage
  //       'keyv',
  //       'pino',
  //       'pino-pretty',
  //       'pino-std-serializers'
  //     ];
  //
  //     // Adicionar IgnorePlugin para módulos do servidor
  //     config.plugins.push(
  //       ...modulesToIgnore.map(
  //         mod => new webpackInstance.IgnorePlugin({ // Use webpackInstance here
  //           resourceRegExp: new RegExp(`^${mod}$`),
  //           contextRegExp: /./
  //         })
  //       ),
  //       // Plugin para lidar com imports com prefixo node:
  //       new webpackInstance.NormalModuleReplacementPlugin( // Use webpackInstance here
  //         /^node:/,
  //         (resource: any) => { // Added type for resource
  //           resource.request = resource.request.replace(/^node:/, '');
  //         }
  //       )
  //     );
  //
  //     // Configurar fallbacks para módulos do Node.js
  //     config.resolve.fallback = {
  //       // Módulos comuns do Node.js
  //       path: require.resolve('path-browserify'), // Added require.resolve
  //       os: require.resolve('os-browserify/browser'), // Added require.resolve
  //       crypto: require.resolve('crypto-browserify'), // Added require.resolve
  //       stream: require.resolve('stream-browserify'), // Added require.resolve
  //       http: require.resolve('stream-http'), // Added require.resolve
  //       https: require.resolve('https-browserify'), // Added require.resolve
  //       zlib: require.resolve('browserify-zlib'), // Added require.resolve
  //       util: require.resolve('util/'), // Added require.resolve
  //       buffer: require.resolve('buffer/'), // Added require.resolve
  //       assert: require.resolve('assert/'), // Added require.resolve
  //       querystring: require.resolve('querystring-es3'), // Added require.resolve
  //       url: require.resolve('url/'), // Added require.resolve
  //       net: false,
  //       tls: false,
  //       dns: false,
  //       child_process: false,
  //       tty: false,
  //       module: false, // Added from next.config.js
  //       dgram: false, // Added from next.config.js
  //       worker_threads: false, // Added from next.config.js
  //       perf_hooks: false, // Added from next.config.js
  //       async_hooks: false, // Added from next.config.js
  //       http2: false, // Added from next.config.js
  //       fs: false, // Added from next.config.js
  //       'fs/promises': false // Added from next.config.js
  //     };
  //
  //     // Adicionar alias para setImmediate
  //     config.resolve.alias = {
  //       ...(config.resolve.alias || {}),
  //       setImmediate: require.resolve('setimmediate') // Added require.resolve
  //     };
  //
  //     // Adicionar polyfills para o navegador
  //     config.plugins.push(
  //       new webpackInstance.ProvidePlugin({ // Use webpackInstance here
  //         process: 'process/browser',
  //         Buffer: ['buffer', 'Buffer'],
  //         setImmediate: ['setimmediate', 'setImmediate']
  //       }),
  //       new webpackInstance.ContextReplacementPlugin(/keyv/) // Use webpackInstance here
  //     );
  //
  //     // Garantir que o polyfill seja incluído no bundle
  //     if (config.resolve.fallback && typeof config.resolve.fallback === 'object') { // Type guard
  //       config.resolve.fallback.setImmediate = require.resolve('setimmediate');
  //     }
  //   }
  //   return config;
  // },
};

// export default withBundleAnalyzer(nextConfig);
export default nextConfig; // Export directly after commenting out withBundleAnalyzer
