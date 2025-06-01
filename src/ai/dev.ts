// src/ai/dev.ts
import { config } from 'dotenv';
config();

import { runDevServer } from '@genkit-ai/flow/dev';
import { agentCreatorChatFlow } from './flows/agent-creator-flow'; // Adicionar import
import { basicChatFlow } from './flows/chat-flow'; // Assuming basicChatFlow is exported from here
// Import other tools or plugins if needed for the dev server
import './tools/web-search-tool.ts'; // Example if this registers a tool globally for dev

runDevServer({
  flows: [
    agentCreatorChatFlow, // Adicionar aqui
    basicChatFlow,
    // ... outros fluxos
  ],
  // Se suas ferramentas são definidas e exportadas de arquivos e precisam ser explicitamente registradas:
  // tools: [
  //   webSearchTool // Exemplo, se webSearchTool for uma constante exportada
  // ],
  // port: 4000, // Opcional: definir porta para o servidor de desenvolvimento
  // O Genkit pode descobrir automaticamente plugins e ferramentas em alguns casos.
});
