"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { isClient, isServer } from '@/lib/environment';

type EnvironmentContextType = {
  isClient: boolean;
  isServer: boolean;
  isPolyfillsLoaded: boolean;
  browserInfo: {
    name: string;
    version: string;
  };
};

const defaultContext: EnvironmentContextType = {
  isClient,
  isServer,
  isPolyfillsLoaded: false,
  browserInfo: {
    name: 'unknown',
    version: 'unknown',
  },
};

const EnvironmentContext = createContext<EnvironmentContextType>(defaultContext);

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EnvironmentContextType>(defaultContext);

  useEffect(() => {
    // This code only runs in the browser
    const checkPolyfills = () => {
      const hasProcess = typeof (window as any).process !== 'undefined';
      const hasFs = typeof (window as any).fs !== 'undefined';
      
      // Get browser info
      const userAgent = window.navigator.userAgent;
      let browserName = 'unknown';
      let browserVersion = 'unknown';
      
      if (userAgent.indexOf('Chrome') > -1) browserName = 'chrome';
      else if (userAgent.indexOf('Safari') > -1) browserName = 'safari';
      else if (userAgent.indexOf('Firefox') > -1) browserName = 'firefox';
      else if (userAgent.indexOf('MSIE') > -1 || userAgent.indexOf('Trident') > -1) browserName = 'ie';
      
      setState({
        isClient: true,
        isServer: false,
        isPolyfillsLoaded: hasProcess && hasFs,
        browserInfo: {
          name: browserName,
          version: browserVersion,
        },
      });
      
      // Log environment info to console for debugging
      console.log('[Environment] Client-side environment initialized', {
        polyfillsLoaded: hasProcess && hasFs,
        browser: { name: browserName, version: browserVersion },
      });
    };
    
    checkPolyfills();
  }, []);

  return (
    <EnvironmentContext.Provider value={state}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  return useContext(EnvironmentContext);
}

export default EnvironmentContext;
