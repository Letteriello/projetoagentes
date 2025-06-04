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
      input: 0.00035, // Example cost
      output: 0.00070, // Example cost
      unit: 'USD_PER_1K_CHARACTERS', // Example unit, adjust as needed
    },
    maxOutputTokens: 8192, // Default max for this model
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
      input: 0.0035, // Example cost
      output: 0.0070, // Example cost
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
    },
    estimatedCost: {
      input: 0.001,
      output: 0.002,
      unit: 'USD_PER_1K_CHARACTERS',
    },
    maxOutputTokens: 2048,
  },
  {
    id: 'text-bison-001', // An older model example
    name: 'PaLM 2 (text-bison-001)',
    provider: 'Google',
    capabilities: {
      streaming: true,
      tools: false, // Example: This model does not support tools
    },
    estimatedCost: {
      input: 0.0005,
      output: 0.0005,
      unit: 'USD_PER_1K_CHARACTERS',
    },
    maxOutputTokens: 1024,
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
      input: 0.015, // Example cost
      output: 0.075, // Example cost
      unit: 'USD_PER_1K_TOKENS', // Different unit example
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
      tools: false, // Example: This model does not support tools well
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
    maxOutputTokens: 8192, // GPT-4 Turbo has a larger context window, often 128k, but max output tokens might be less
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    capabilities: {
        streaming: true,
        tools: true,
    },
    estimatedCost: {
        input: 0.0005,
        output: 0.0015,
        unit: 'USD_PER_1K_TOKENS',
    },
    maxOutputTokens: 4096, // Or 16k depending on the specific version
  },
  // Add a model that is "more concise" for simulation purposes
  {
    id: 'concise-model-test',
    name: 'Test Model (Concise)',
    provider: 'TestProvider',
    capabilities: {
      streaming: true,
      tools: true,
    },
    // Add a custom property for simulation, or rely on name parsing in chat-flow
    customProperties: {
      behavior: 'concise',
    },
    maxOutputTokens: 50, // Very low for testing conciseness
  },
  // Add a model that is "more creative" for simulation
  {
    id: 'creative-model-test',
    name: 'Test Model (Creative)',
    provider: 'TestProvider',
    capabilities: {
      streaming: true,
      tools: true,
    },
    customProperties: {
      behavior: 'creative',
    },
    maxOutputTokens: 2048,
  },
  // Add a model that "fails to use tools" explicitly for simulation
  {
    id: 'no-tool-model-test',
    name: 'Test Model (No Tools)',
    provider: 'TestProvider',
    capabilities: {
      streaming: true,
      tools: false, // Explicitly false
    },
    customProperties: {
      behavior: 'tool_failure_simulation',
    },
    maxOutputTokens: 1024,
  }
];
