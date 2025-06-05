// This file provides TypeScript type definitions for Jest and our mocks

// Extend Jest's expect with @testing-library/jest-dom matchers
import '@testing-library/jest-dom';

declare module '@genkit-ai/googleai' {
  export function configure(options: any): void;
  // Add other types as needed
}

declare module 'genkit' {
  export function defineFlow<TInput = any, TOutput = any>(
    name: string,
    options: any,
    handler: (input: TInput) => Promise<TOutput> | TOutput
  ): any;
  
  export function run<T = any>(flow: any, input?: any): Promise<{ data: T }>;
  // Add other types as needed
}

// Add global Jest types
declare namespace NodeJS {
  interface Global {
    // Add any global mocks or variables here
  }
}

// This helps TypeScript understand our mock files
declare module '*/__mocks__/genkit-ai-googleai' {
  const mock: any;
  export default mock;
}

declare module '*/__mocks__/genkit' {
  const mock: any;
  export default mock;
}
