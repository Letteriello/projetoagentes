import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {openAI} from 'genkitx-openai';
import {ollama} from 'genkitx-ollama';
import process from 'node:process';

export const ai = genkit({
  plugins: [
    googleAI(),
    openAI({apiKey: process.env.OPENAI_API_KEY || "dummy"}),
    ollama({host: process.env.OLLAMA_API_HOST}),
  ],
  model: 'googleai/gemini-2.0-flash',
});
