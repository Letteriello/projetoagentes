
'use server';
/**
 * @fileOverview Fluxo de chat básico para interagir com um modelo de IA, com suporte a histórico e envio de imagens.
 *
 * - basicChatFlow - Uma função que lida com uma única troca de chat, considerando o histórico e possível imagem.
 * - BasicChatInput - O tipo de entrada para basicChatFlow.
 * - BasicChatOutput - O tipo de retorno para basicChatFlow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Esquema interno para a entrada do fluxo de chat (não exportado)
const BasicChatInputSchema = z.object({
  userMessage: z.string().describe('A mensagem do usuário para o agente. Pode ser vazia se fileDataUri for fornecido.'),
  systemPrompt: z.string().optional().describe('O prompt do sistema para guiar o comportamento do agente.'),
  modelName: z.string().optional().describe('O nome do modelo de IA a ser usado (ex: googleai/gemini-1.5-pro-latest).'),
  temperature: z.number().optional().describe('A temperatura para a geração do modelo (ex: 0.7).'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(), // History content remains text-based for this iteration for simplicity
  })).optional().describe('O histórico da conversa até o momento.'),
  fileDataUri: z.string().optional().describe("Uma imagem como data URI. Formato: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type BasicChatInput = z.infer<typeof BasicChatInputSchema>;

// Esquema para a saída do fluxo de chat
const BasicChatOutputSchema = z.object({
  agentResponse: z.string().describe('A resposta do agente para a mensagem do usuário.'),
});
export type BasicChatOutput = z.infer<typeof BasicChatOutputSchema>;

// Função pública para invocar o fluxo (wrapper)
export async function basicChatFlow(input: BasicChatInput): Promise<BasicChatOutput> {
  return internalChatFlow(input);
}

// Definição do prompt Genkit
const chatPrompt = ai.definePrompt({
  name: 'basicChatPromptWithHistoryAndImage',
  prompt: (input: BasicChatInput) => {
    // Genkit expects MessagePart content to be string | MessageContentPart[]
    // MessageContentPart is { text: string } | { media: { url: string, contentType?: string } } | ...
    const messages: Array<{ role: string, content: string | Array<{text?: string, media?: {url: string, contentType?: string}}> }> = [];

    const systemInstruction = input.systemPrompt || "Você é um assistente prestativo.";

    // Add system prompt as the first user message or a dedicated system message if supported
    // For Gemini, often it's part of the first user message content or instructions.
    messages.push({ role: 'user', content: [{ text: systemInstruction }] });


    if (input.history && input.history.length > 0) {
      input.history.forEach(msg => {
        // Assuming history content is always text for now for simplicity.
        // Future: history messages could also be multimodal.
        messages.push({ role: msg.role, content: [{ text: msg.content }] });
      });
    }

    // Construct current user message part (text + optional image)
    const currentUserMessageParts: Array<{text?: string, media?: {url: string, contentType?: string}}> = [];
    if (input.userMessage) {
      currentUserMessageParts.push({ text: input.userMessage });
    }
    if (input.fileDataUri) {
      // Extract MIME type if present, otherwise let Genkit/model infer
      const mimeTypeMatch = input.fileDataUri.match(/^data:(image\/[^;]+);base64,/);
      const contentType = mimeTypeMatch ? mimeTypeMatch[1] : undefined;
      currentUserMessageParts.push({ media: { url: input.fileDataUri, contentType } });
    }

    // Add the current user message if it has content (text or image)
    if (currentUserMessageParts.length > 0) {
      messages.push({ role: 'user', content: currentUserMessageParts });
    } else if (messages.length === 1 && messages[0].content === systemInstruction) {
      // If only system prompt is there and no user input/image, add a generic follow-up.
      // This case should ideally be handled by client-side validation (input or file required).
      // For safety, if an empty message somehow reaches here, we give it some text.
      messages.push({ role: 'user', content: [{text: " "}] }); // Send a space to ensure the turn isn't empty
    }
    
    return {
      messages,
      output: { 
        format: 'json',
        schema: BasicChatOutputSchema,
      },
    };
  },
  config: {
    temperature: 0.7, // Default, can be overridden
  },
});

// Definição do fluxo Genkit
const internalChatFlow = ai.defineFlow(
  {
    name: 'internalChatFlowWithHistoryAndImage',
    inputSchema: BasicChatInputSchema,
    outputSchema: BasicChatOutputSchema,
  },
  async (input: BasicChatInput) => {
    const modelToUse = input.modelName || ai.getModel(); // ai.getModel() gets default from genkit.ts
    const temperatureToUse = input.temperature;

    // Ensure the model used supports multimodal input if an image is provided.
    // The default gemini-2.0-flash in genkit.ts is multimodal.
    // If a modelName is provided, it should also be multimodal if fileDataUri is present.

    const llmResponse = await chatPrompt(input, {
      model: modelToUse,
      config: temperatureToUse !== undefined ? { temperature: temperatureToUse } : undefined,
    });
    const output = llmResponse.output();

    if (!output) {
      throw new Error("O modelo não retornou uma saída válida.");
    }

    return output;
  }
);
