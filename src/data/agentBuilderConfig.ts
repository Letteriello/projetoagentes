// src/data/agentBuilderConfig.ts
import type { ReactNode, FC } from 'react';
import type { AvailableTool } from '@/types/unified-agent-types'; // GeminiModelConfig removed from this line
// If GeminiModelConfig is used, it needs its own correct import:
// import type { GeminiModelConfig } from '...'; // Path to GeminiModelConfig source

// Placeholder for initial Gemini model configurations or similar AI model settings
export const initialGems: GeminiModelConfig[] = [];

// Placeholder for mapping icon names to React components
// Example: import { SomeIcon } from 'lucide-react';
// export const iconComponents: Record<string, FC<any>> = { home: SomeIcon };
export const iconComponents: Record<string, FC<any>> = {};

// Placeholder for tools available in the agent builder UI
export const builderAvailableTools: AvailableTool[] = [
  // Example of a tool structure (can be populated later based on actual tools)
  // {
  //   id: 'calculator',
  //   label: 'Calculator',
  //   name: 'calculator',
  //   type: 'genkit_native',
  //   icon: 'CalculatorIcon', // This would map to a component in iconComponents or be a direct ReactNode
  //   description: 'Performs basic arithmetic calculations.',
  //   hasConfig: false,
  //   genkitToolName: 'calculator',
  //   category: 'Utilities',
  //   requiresAuth: false,
  //   serviceTypeRequired: '',
  // },
];

// You might also need to export other configurations that were previously in this file.
// For example, if there were default agent configurations or UI-specific data.
