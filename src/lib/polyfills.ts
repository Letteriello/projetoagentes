/**
 * Browser-side polyfills for Node.js modules
 * This helps handle cases where Node.js modules might still be referenced in client code
 */

import { isClient, runOnClient } from './environment';

// Empty implementations for Node.js built-ins that might be imported
runOnClient(() => {
  // Browser environment - provide empty module implementations
  (window as any).process = {
    env: {},
    nextTick: (fn: Function) => setTimeout(fn, 0),
    cwd: () => '/',
    version: '',
    platform: 'browser',
  };
  
  // Empty module implementations
  const emptyModule = {};
  const emptyFunction = () => {};
  
  // Define module shims
  (window as any).fs = emptyModule;
  (window as any).path = {
    join: (...args: string[]) => args.join('/'),
    resolve: (...args: string[]) => args.join('/'),
    dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
    basename: (path: string) => path.split('/').pop(),
  };
  (window as any).os = {
    platform: () => 'browser',
    homedir: () => '/',
  };
  
  // Stream API
  class MockReadableStream {
    on() { return this; }
    pipe() { return this; }
    resume() { return this; }
    destroy() {}
    getReader() { return { read: async () => ({ done: true, value: undefined }) }; }
  }
  
  (window as any).stream = {
    Readable: MockReadableStream,
    Writable: class {},
    Transform: class {},
    Duplex: class {},
  };
  
  // Child process
  (window as any).child_process = {
    spawn: emptyFunction,
    exec: (cmd: string, options: any, callback: Function) => {
      if (typeof options === 'function') {
        callback = options;
      }
      if (callback) {
        callback(new Error('Not supported in browser'), '', '');
      }
      return { on: emptyFunction, stdout: { on: emptyFunction }, stderr: { on: emptyFunction } };
    },
    execSync: () => { throw new Error('Not supported in browser'); },
  };
  
  // Network modules
  (window as any).net = emptyModule;
  (window as any).tls = emptyModule;
  (window as any).http = emptyModule;
  (window as any).https = emptyModule;
  
  // Console message for debugging
  console.log('Node.js polyfills loaded for browser environment');
});
