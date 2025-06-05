// src/ai/dev.ts
import { config } from 'dotenv';
config();

import { agentCreatorChatFlow } from './flows/agent-creator-flow'; // Adicionar import
import { basicChatFlow } from './flows/chat-flow'; // Assuming basicChatFlow is exported from here
import { aiConfigurationAssistantFlow } from './flows/aiConfigurationAssistantFlow';
import { workflowAgentRunnerFlow } from './flows/workflow-agent-flow'; // Import the new flow
// Import other tools or plugins if needed for the dev server
import './tools/web-search-tool.ts'; // Example if this registers a tool globally for dev

// Flows are typically discovered by the Genkit CLI or need to be exported
// for the main application entry point (e.g., in genkit.ts or a Next.js API route).
// This file, when run with `genkit start -- node your-compiled-dev.js`,
// will execute, thus ensuring flows and tools are initialized and registered if they do so upon import.

console.log('Development server entry point: Flows and tools should be initialized.');
console.log('Registered flows (ensure they are exported or globally registered):');
console.log('- agentCreatorChatFlow:', !!agentCreatorChatFlow);
console.log('- basicChatFlow:', !!basicChatFlow);
console.log('- aiConfigurationAssistantFlow:', !!aiConfigurationAssistantFlow);
console.log('- workflowAgentRunnerFlow:', !!workflowAgentRunnerFlow); // Log the new flow

// To make flows available to the Genkit dev server/UI, ensure they are either:
// 1. Exported from your main `genkit.ts` (if you have one that `configureGenkit` uses)
// 2. Or, if this `dev.ts` is your main entry for `genkit start`, ensure they are discoverable.
//    The Genkit CLI (`genkit start`) typically discovers flows defined with `defineFlow`
//    when the file containing them is executed.

import { langchainAgentFlow } from './flows/langchain-agent-flow';
import { crewAIAgentFlow } from './flows/crewai-agent-flow';

export default {
  flows: [
    agentCreatorChatFlow,
    basicChatFlow,
    aiConfigurationAssistantFlow,
    workflowAgentRunnerFlow,
    langchainAgentFlow,
    crewAIAgentFlow,
  ],
  // tools: [], // Add tools if you have any to export
  // instruments: [], // Add instruments if any
};
