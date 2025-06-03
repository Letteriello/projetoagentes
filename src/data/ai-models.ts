export interface AIModel {
  id: string;
  name: string;
  provider: string;
  price: string;
  useCases: string;
  strengths?: string;
  limitations?: string;
}

export const aiModels: AIModel[] = [
  // Google AI Models
  {
    id: 'gemini-1.5-flash-latest',
    name: 'Gemini 1.5 Flash',
    provider: 'Google AI',
    price: '$0.35 / 1M tokens (input), $0.70 / 1M tokens (output)',
    useCases: 'Fast, efficient, good for summarization, chat, captioning, and data extraction at scale.',
    strengths: 'High speed, lower cost, multimodal capabilities, long context window (1M tokens).',
    limitations: 'May not match Pro for highly complex reasoning.',
  },
  {
    id: 'gemini-1.5-pro-latest',
    name: 'Gemini 1.5 Pro',
    provider: 'Google AI',
    price: '$3.50 / 1M tokens (input), $10.50 / 1M tokens (output)',
    useCases: 'Highest-performing model for complex tasks, multimodal reasoning, long context understanding.',
    strengths: 'State-of-the-art performance, very long context window (1M tokens), advanced multimodal capabilities.',
    limitations: 'Higher cost compared to Flash.',
  },
  {
    id: 'gemini-1.0-pro',
    name: 'Gemini 1.0 Pro',
    provider: 'Google AI',
    price: '$0.50 / 1M characters (input), $1.50 / 1M characters (output)',
    useCases: 'General purpose tasks, chat, text generation, analysis.',
    strengths: 'Good balance of performance and cost for many applications.',
    limitations: 'Smaller context window (32k tokens) than 1.5 series.',
  },

  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    price: '$5.00 / 1M tokens (input), $15.00 / 1M tokens (output)',
    useCases: 'Most advanced tasks, complex instruction following, visual understanding, chat.',
    strengths: 'Excellent reasoning, strong vision capabilities, high accuracy.',
    limitations: 'Higher cost, potential rate limits.',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'OpenAI',
    price: '$10.00 / 1M tokens (input), $30.00 / 1M tokens (output)',
    useCases: 'Complex tasks, large context processing (128k), optimized for performance.',
    strengths: 'Large context window, strong performance, good for enterprises.',
    limitations: 'Higher cost than GPT-3.5.',
  },
  {
    id: 'gpt-3.5-turbo-0125',
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    price: '$0.50 / 1M tokens (input), $1.50 / 1M tokens (output)',
    useCases: 'General purpose, cost-effective, chat, text generation, summarization.',
    strengths: 'Fast, very low cost, good for a wide range of simpler tasks.',
    limitations: 'Less capable for highly complex reasoning compared to GPT-4 models.',
  },

  // OpenRouter Models
  // Prices and details are examples and should be verified with OpenRouter
  {
    id: 'cohere/command-r-plus',
    name: 'Cohere Command R+',
    provider: 'OpenRouter',
    price: '$3.00 / 1M tokens (input), $15.00 / 1M tokens (output) (via OpenRouter)',
    useCases: 'Enterprise-grade RAG, multilingual, tool use, complex chat.',
    strengths: 'Strong multilingual capabilities, good for RAG and tool use, 128k context.',
    limitations: 'Accessed via OpenRouter, pricing may vary.',
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'OpenRouter',
    price: '$8.00 / 1M tokens (input), $24.00 / 1M tokens (output) (via OpenRouter)',
    useCases: 'Top-tier reasoning, multilingual, code generation, complex instruction following.',
    strengths: 'Excellent reasoning, strong in code and multilingual tasks, 32k context.',
    limitations: 'Accessed via OpenRouter, pricing may vary.',
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Anthropic Claude 3 Opus',
    provider: 'OpenRouter',
    price: '$15.00 / 1M tokens (input), $75.00 / 1M tokens (output) (via OpenRouter)',
    useCases: 'Top-tier reasoning, research, complex analysis, long document summarization.',
    strengths: 'Extremely strong reasoning and analysis, 200K context window, vision capabilities.',
    limitations: 'Higher cost, accessed via OpenRouter.',
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Anthropic Claude 3 Sonnet',
    provider: 'OpenRouter',
    price: '$3.00 / 1M tokens (input), $15.00 / 1M tokens (output) (via OpenRouter)',
    useCases: 'Balanced performance for enterprise workloads, RAG, data processing.',
    strengths: 'Good balance of speed and capability, 200K context window, vision.',
    limitations: 'Accessed via OpenRouter.',
  },
];
