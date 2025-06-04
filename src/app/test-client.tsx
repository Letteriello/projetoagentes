"use client";

import { useEffect, useState } from 'react';
import { useEnvironment } from '@/contexts/EnvironmentContext';

export default function TestClientComponent() {
  const [moduleTests, setModuleTests] = useState<Record<string, boolean>>({});
  const env = useEnvironment();
  
  useEffect(() => {
    // Test if our polyfills are working
    console.log('Test client component mounted');
    console.log('Environment context:', env);
    
    // Check for various Node.js modules that should be polyfilled
    const nodeModules = ['fs', 'path', 'child_process', 'net', 'http', 'https', 'crypto'];
    const moduleStatus: Record<string, boolean> = {};
    
    nodeModules.forEach(mod => {
      moduleStatus[mod] = typeof (window as any)[mod] !== 'undefined';
      console.log(`${mod} object:`, (window as any)[mod]);
    });
    
    setModuleTests(moduleStatus);
  }, [env]);
  
  return (
    <div className="p-4 border rounded-md">
      <h2 className="text-xl font-bold mb-2">Client Component Test</h2>
      <p>This component is rendered on the {env.isClient ? 'client' : 'server'}.</p>
      
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Environment Status:</h3>
        <ul className="list-disc pl-5">
          <li>Client-side: <span className="font-mono">{env.isClient ? '✅' : '❌'}</span></li>
          <li>Polyfills loaded: <span className="font-mono">{env.isPolyfillsLoaded ? '✅' : '❌'}</span></li>
          <li>Browser: <span className="font-mono">{env.browserInfo.name}</span></li>
        </ul>
      </div>
      
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Node.js Module Polyfills:</h3>
        <ul className="list-disc pl-5">
          {Object.entries(moduleTests).map(([mod, available]) => (
            <li key={mod}>
              <code>{mod}</code>: <span className="font-mono">{available ? '✅' : '❌'}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <p className="mt-4 text-sm text-gray-600">Check the console for detailed polyfill verification.</p>
    </div>
  );
}
