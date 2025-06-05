// Type definitions for workflow agent

declare module 'genkit' {
  export interface WorkflowStep<TInput = any, TOutput = any> {
    name: string;
    handler: (input: TInput) => Promise<TOutput> | TOutput;
  }

  export interface WorkflowOptions {
    steps: WorkflowStep[];
    maxConcurrent?: number;
    onError?: (error: Error, step: WorkflowStep, input: any) => void | Promise<void>;
  }

  export function createWorkflow<TInput = any, TOutput = any>(
    name: string,
    options: WorkflowOptions,
    handler?: (input: TInput) => Promise<TOutput> | TOutput
  ): any;
}

// Add any additional types needed for workflow agent
export interface WorkflowAgentConfig {
  workflow: any; // Replace with actual workflow type
  context?: Record<string, any>;
  maxSteps?: number;
  [key: string]: any;
}

export {};
