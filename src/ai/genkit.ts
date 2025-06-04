import { configureGenkit } from '@genkit-ai/core'; // Changed import
import { googleAI } from '@genkit-ai/googleai';
import { openAI } from 'genkitx-openai';
import { firestoreSessionStore } from 'genkit-plugin-firestore'; // Assuming this plugin
import { VertexAiRagMemoryService } from 'genkit-plugin-vertexai'; // Assuming this plugin
import { ollama } from 'genkitx-ollama';
import process from 'node:process';

export const ai = configureGenkit({ // Changed function call
  plugins: [
    googleAI(),
    openAI({apiKey: process.env.OPENAI_API_KEY || "dummy"}),
    ollama({host: process.env.OLLAMA_API_HOST}),
  ],
  model: 'googleai/gemini-2.0-flash',
  telemetry: {
    // Removida referência a instrumentation que não é suportada
    logger: 'google',
  },
  logLevel: 'info',
  enableTracing: false,
  sessionStore: firestoreSessionStore({ // Add session store configuration
    projectId: process.env.GCP_PROJECT_ID,
    collectionName: 'genkit_sessions'
  }),
  memoryStore: new VertexAiRagMemoryService({ // Add memory store configuration
    projectId: process.env.GCP_PROJECT_ID,
    location: process.env.GCP_LOCATION,
    ragCorpusName: process.env.RAG_CORPUS_NAME,
    embeddingModel: 'googleai/text-embedding-004',
  }),
});
