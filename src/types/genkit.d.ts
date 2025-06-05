// Type definitions for GenKit and related modules
declare module 'genkit' {
  export interface GenerateResponse<T = any> {
    candidates: Array<{
      message: {
        content: string;
        role?: string;
        [key: string]: any;
      };
      finishReason?: string;
      usage?: {
        promptTokens?: number;
        candidatesToken?: number;
        totalTokens?: number;
        completionTokens?: number;
        inputTokens?: number;
        outputTokens?: number;
        [key: string]: any;
      };
      [key: string]: any;
    }>;
    text: () => string;
    [key: string]: any;
  }

  export interface GenerateRequest {
    messages: Array<{
      role: string;
      content: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  }

  export function generate(request: GenerateRequest): Promise<GenerateResponse>;
  export function defineFlow<TInput = any, TOutput = any>(
    name: string,
    options: any,
    handler: (input: TInput) => Promise<TOutput> | TOutput
  ): any;
  export function run<T = any>(flow: any, input?: any): Promise<{ data: T }>;
}

declare module '@genkit-ai/googleai' {
  export function configure(options: {
    apiKey?: string;
    projectId?: string;
    location?: string;
    [key: string]: any;
  }): void;
}

// Extend the global namespace if needed
declare global {
  // Add any global type extensions here
}

export {};
