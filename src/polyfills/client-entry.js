// This file is the first one loaded in the browser environment
// It provides polyfills for Node.js modules that might be referenced in client code

if (typeof window !== 'undefined') {
  // Create mock implementations for Node.js built-ins
  const mockModules = {
    fs: {},
    path: {
      join: (...args) => args.join('/'),
      resolve: (...args) => args.join('/'),
      dirname: (path) => path.split('/').slice(0, -1).join('/'),
      basename: (path) => path.split('/').pop(),
    },
    os: {
      platform: () => 'browser',
      homedir: () => '/',
    },
    child_process: {
      spawn: () => ({}),
      exec: () => ({}),
      execSync: () => { throw new Error('Not supported in browser'); },
    },
    stream: {
      Readable: class {},
      Writable: class {},
      Transform: class {},
      Duplex: class {},
    },
    crypto: {
      randomBytes: () => new Uint8Array(0),
      createHash: () => ({
        update: () => ({}),
        digest: () => '',
      }),
    },
    util: {
      promisify: (fn) => fn,
      inspect: (obj) => JSON.stringify(obj),
    },
    net: {},
    tls: {},
    http: {},
    https: {},
    zlib: {},
    assert: {},
  };

  // Apply the mocks to the global window object
  Object.entries(mockModules).forEach(([name, implementation]) => {
    if (typeof window[name] === 'undefined') {
      window[name] = implementation;
    }
  });

  // Also add a process object for compatibility
  if (typeof window.process === 'undefined') {
    window.process = {
      env: {},
      nextTick: (fn) => setTimeout(fn, 0),
      cwd: () => '/',
      version: '',
      platform: 'browser',
    };
  }

  console.log('[Polyfills] Node.js module polyfills loaded for browser environment');
}
