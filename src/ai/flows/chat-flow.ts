
'use server';
/**
 * @fileOverview Fluxo de chat básico para interagir com um modelo de IA, com suporte a histórico, envio de imagens e ferramentas.
 *
 * - basicChatFlow - Uma função que lida com uma única troca de chat, considerando o histórico, possível imagem e ferramentas.
 * - BasicChatInput - O tipo de entrada para basicChatFlow.
 * - BasicChatOutput - O tipo de retorno para basicChatFlow.
 */

import { ai } from '@/ai/genkit';
import { performWebSearchTool } from '@/ai/tools/web-search-tool';
import { z } from 'genkit';

// Esquema interno para a entrada do fluxo de chat (não exportado)
const BasicChatInputSchema = z.object({
  userMessage: z.string().describe('A mensagem do usuário para o agente. Pode ser vazia se fileDataUri for fornecido.'),
  systemPrompt: z.string().optional().describe('O prompt do sistema para guiar o comportamento do agente.'),
  modelName: z.string().optional().describe('O nome do modelo de IA a ser usado (ex: googleai/gemini-1.5-pro-latest).'),
  temperature: z.number().optional().describe('A temperatura para a geração do modelo (ex: 0.7).'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
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
const chatPrompt = ai.definePrompt(
  {
    name: 'basicChatPromptWithHistoryImageAndTools',
    // Adiciona a ferramenta de busca na web
    tools: [performWebSearchTool],
    // Não estamos usando o `prompt` callback aqui, pois a estrutura de `messages` é mais complexa e dinâmica.
    // A lógica de construção de `messages` será feita dentro do `internalChatFlow` antes de chamar o modelo.
  },
  async (input: BasicChatInput) => {
    // Esta função de prompt agora é mais um placeholder,
    // a lógica de construção de mensagens está dentro do fluxo para maior controle.
    // O Genkit espera que o prompt retorne a entrada para o modelo, que pode ser apenas as mensagens.
    // A configuração de output (schema e format) é agora passada no `generate` call.
    return {
      // messages: [], // Será construído no fluxo
      // output: { // Será definido no `generate`
      //   format: 'json',
      //   schema: BasicChatOutputSchema,
      // },
    };
  }
);


// Definição do fluxo Genkit
const internalChatFlow = ai.defineFlow(
  {
    name: 'internalChatFlowWithHistoryImageAndTools',
    inputSchema: BasicChatInputSchema,
    outputSchema: BasicChatOutputSchema,
  },
  async (input: BasicChatInput) => {
    const modelToUse = input.modelName || ai.getModel(); // ai.getModel() gets default from genkit.ts
    const temperatureToUse = input.temperature;

    // Construir o array de mensagens para o LLM
    const messages: Array<{ role: string, content: string | Array<{text?: string, media?: {url: string, contentType?: string}}> }> = [];

    let systemInstruction = input.systemPrompt || "Você é um assistente prestativo.";
    
    // Adiciona instrução sobre a ferramenta de busca se não estiver já no systemPrompt do agente
    // (O systemPrompt do agente já será atualizado para incluir isso)
    if (!systemInstruction.toLowerCase().includes('performwebsearch')) {
        systemInstruction += "\n\nVocê tem uma ferramenta chamada 'performWebSearch' que pode usar para pesquisar informações atuais ou tópicos que não conhece. Se precisar, use-a informando a consulta de busca.";
    }

    messages.push({ role: 'user', content: [{ text: systemInstruction }] }); // Tratar system prompt como primeira mensagem do usuário

    if (input.history && input.history.length > 0) {
      input.history.forEach(msg => {
        messages.push({ role: msg.role, content: [{ text: msg.content }] });
      });
    }

    const currentUserMessageParts: Array<{text?: string, media?: {url: string, contentType?: string}}> = [];
    if (input.userMessage) {
      currentUserMessageParts.push({ text: input.userMessage });
    }
    if (input.fileDataUri) {
      const mimeTypeMatch = input.fileDataUri.match(/^data:(image\/[^;]+);base64,/);
      const contentType = mimeTypeMatch ? mimeTypeMatch[1] : undefined;
      currentUserMessageParts.push({ media: { url: input.fileDataUri, contentType } });
    }

    if (currentUserMessageParts.length > 0) {
      messages.push({ role: 'user', content: currentUserMessageParts });
    } else if (messages.length === 1) { // Apenas a instrução de sistema
      messages.push({ role: 'user', content: [{text: " "}] }); // Garante que não está vazio
    }
    
    const llmResponse = await ai.generate({
        model: modelToUse,
        prompt: { messages }, // Passa o array de mensagens construído
        tools: [performWebSearchTool], // Garante que a ferramenta está disponível para esta chamada
        config: temperatureToUse !== undefined ? { temperature: temperatureToUse } : undefined,
        output: {
            format: 'json',
            schema: BasicChatOutputSchema,
        },
    });

    const output = llmResponse.output();

    if (!output || !output.agentResponse) {
      console.error("Fluxo: Resposta do LLM inválida ou vazia", llmResponse.usage, llmResponse.candidates);
      // Tenta obter texto simples se a resposta JSON falhar
      const plainText = llmResponse.text;
      if (plainText) {
        return { agentResponse: plainText };
      }
      throw new Error("O modelo não retornou uma saída válida ou a resposta do agente estava vazia.");
    }
    
    return output;
  }
);
