import type { LLMModelDetails } from '@/types/agent-configs-new'; // Adjust path if necessary based on where LLMModelDetails is defined

export const llmModels: LLMModelDetails[] = [
  {
    id: 'gemini-1.5-flash-latest',
    name: 'Gemini 1.5 Flash (Latest)',
    provider: 'Google',
    capabilities: {
      streaming: true,
      tools: true,
      vision: true,
    },
    estimatedCost: {
      input: 0.00035,
      output: 0.00070,
      unit: 'USD_PER_1K_CHARACTERS',
    },
    maxOutputTokens: 8192,
  },
  {
    id: 'gemini-1.5-pro-latest',
    name: 'Gemini 1.5 Pro (Latest)',
    provider: 'Google',
    capabilities: {
      streaming: true,
      tools: true,
      vision: true,
    },
    estimatedCost: {
      input: 0.0035,
      output: 0.0070,
      unit: 'USD_PER_1K_CHARACTERS',
    },
    maxOutputTokens: 8192,
  },
  {
    id: 'gemini-1.0-pro',
    name: 'Gemini 1.0 Pro',
    provider: 'Google',
    capabilities: {
      streaming: true,
      tools: true,
      // vision: false, // Implicitly false or not specified as true
    },
    estimatedCost: {
      input: 0.001,
      output: 0.002,
      unit: 'USD_PER_1K_CHARACTERS',
    },
    maxOutputTokens: 2048,
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    capabilities: {
      streaming: true,
      tools: true,
      vision: true,
    },
    estimatedCost: {
      input: 0.015,
      output: 0.075,
      unit: 'USD_PER_1K_TOKENS',
    },
    maxOutputTokens: 4096,
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    capabilities: {
      streaming: true,
      tools: true,
      vision: true,
    },
    estimatedCost: {
      input: 0.003,
      output: 0.015,
      unit: 'USD_PER_1K_TOKENS',
    },
    maxOutputTokens: 4096,
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    capabilities: {
      streaming: true,
      tools: false,
      vision: true,
    },
    estimatedCost: {
      input: 0.00025,
      output: 0.00125,
      unit: 'USD_PER_1K_TOKENS',
    },
    maxOutputTokens: 4096,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    capabilities: {
      streaming: true,
      tools: true,
      vision: true
    },
    estimatedCost: {
      input: 0.005,
      output: 0.015,
      unit: 'USD_PER_1K_TOKENS'
    },
    maxOutputTokens: 8192,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    capabilities: {
        streaming: true,
        tools: true,
        vision: true,
    },
    estimatedCost: {
        input: 0.01,
        output: 0.03,
        unit: 'USD_PER_1K_TOKENS',
    },
    maxOutputTokens: 8192,
  },
  {
    id: 'gpt-3.5-turbo-0125', // Updated ID
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    capabilities: {
        streaming: true,
        tools: true,
        // vision: false, // Explicitly not a vision model by default
    },
    estimatedCost: {
        input: 0.0005,
        output: 0.0015,
        unit: 'USD_PER_1K_TOKENS',
    },
    maxOutputTokens: 4096,
  },
  {
    id: 'cohere/command-r-plus',
    name: 'Cohere Command R+',
    provider: 'Cohere', // Changed from OpenRouter to Cohere
    capabilities: {
      streaming: true,
      tools: true,
      vision: false
    },
    estimatedCost: {
      input: 0.003,
      output: 0.015,
      unit: 'USD_PER_1K_TOKENS'
    },
    maxOutputTokens: 4096,
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'MistralAI', // Changed from OpenRouter to MistralAI
    capabilities: {
      streaming: true,
      tools: true,
      vision: false
    },
    estimatedCost: {
      input: 0.008,
      output: 0.024,
      unit: 'USD_PER_1K_TOKENS'
    },
    maxOutputTokens: 8192,
  },
  {
    id: 'googleai/gemini-1.0-pro-finetuned-support',
    name: 'Gemini 1.0 Pro (Fine-tuned for Support)',
    provider: 'Google',
    capabilities: {
      streaming: true,
      tools: true,
    },
    estimatedCost: {
      input: 0.0012,
      output: 0.0025,
      unit: 'USD_PER_1K_CHARACTERS',
    },
    maxOutputTokens: 2048,
    customProperties: {
      fineTuningType: "support_queries",
      baseModel: "gemini-1.0-pro",
      description: "Optimized for customer support, help desk interactions, and FAQ responses."
    },
  },
  {
    id: 'googleai/gemini-1.0-pro-finetuned-code',
    name: 'Gemini 1.0 Pro (Fine-tuned for Code Generation)',
    provider: 'Google',
    capabilities: {
      streaming: true,
      tools: true,
    },
    estimatedCost: {
      input: 0.0015,
      output: 0.0030,
      unit: 'USD_PER_1K_CHARACTERS',
    },
    maxOutputTokens: 2048,
    customProperties: {
      fineTuningType: "code_generation",
      baseModel: "gemini-1.0-pro",
      supportedLanguages: ["javascript", "python", "typescript", "java", "go"],
      description: "Optimized for generating code snippets, explaining code, and assisting with software development tasks."
    },
  }
];
