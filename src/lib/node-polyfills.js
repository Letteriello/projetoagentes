// This file provides polyfills for Node.js built-in modules in the browser
if (typeof window !== 'undefined') {
  // Ensure global Buffer exists
  window.Buffer = window.Buffer || require('buffer/').Buffer;
  
  // Ensure global process exists
  window.process = window.process || require('process/browser');
  
  // Create mock implementations of other Node.js modules
  const mockModules = {
    events: require('events'),
    fs: {},
    path: {
      join: (...parts) => parts.join('/').replace(/\/+/g, '/'),
      resolve: (...parts) => parts.join('/').replace(/\/+/g, '/'),
      dirname: (path) => path.split('/').slice(0, -1).join('/'),
      basename: (path) => path.split('/').pop(),
    },
    os: {
      platform: () => 'browser',
      homedir: () => '/',
    },
    util: {
      promisify: (fn) => fn,
      inherits: () => {},
      inspect: () => {},
      format: (...args) => args.join(' '),
    },
    stream: {},
    zlib: {},
    crypto: {},
    http: {},
    https: {},
    net: {},
    tls: {},
    child_process: {},
    'node:events': require('events'),
    'node:path': require('path'),
    'node:util': require('util'),
    'node:fs': {},
    'node:http': {},
    'node:https': {},
    'node:crypto': {},
    'node:buffer': require('buffer/'),
  };

  // Apply mocks to window object
  Object.entries(mockModules).forEach(([name, implementation]) => {
    if (typeof window[name] === 'undefined') {
      window[name] = implementation;
    }
  });

  console.log('[Node.js Polyfills] Loaded for browser environment');
}
