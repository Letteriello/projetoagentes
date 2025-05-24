
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
    tools: [performWebSearchTool],
  },
  async (input: BasicChatInput) => {
    // Esta função de prompt agora é mais um placeholder,
    // a lógica de construção de mensagens está dentro do fluxo para maior controle.
    return {}; // Retorna objeto vazio, pois a lógica de prompt está no fluxo.
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
    const modelToUse = input.modelName || ai.getModel();
    const temperatureToUse = input.temperature;

    // Tratamento para modelos que exigem configuração customizada no backend
    if (['openrouter/custom', 'requestly/custom', 'custom-http/genkit'].includes(modelToUse)) {
      let providerName = "um provedor personalizado";
      if (modelToUse === 'openrouter/custom') providerName = "OpenRouter";
      if (modelToUse === 'requestly/custom') providerName = "Requestly";
      if (modelToUse === 'custom-http/genkit') providerName = "um endpoint HTTP customizado";
      
      return { 
        agentResponse: `Este agente está configurado para usar ${providerName}. A integração completa para este tipo de configuração (que requer um fluxo Genkit customizado no backend) ainda não está implementada no sistema de chat padrão. Para usar este agente com todas as suas capacidades, um fluxo Genkit específico precisa ser desenvolvido e invocado.` 
      };
    }

    const messages: Array<{ role: string, content: any | Array<{text?: string, media?: {url: string, contentType?: string}}> }> = [];

    let systemInstruction = input.systemPrompt || "Você é um assistente prestativo.";
    
    if (!systemInstruction.toLowerCase().includes('performwebsearch') && 
        (input.systemPrompt?.toLowerCase().includes('ferramentas disponíveis') || !input.systemPrompt ) // Add if tools are generally mentioned or no specific system prompt
       ) {
        systemInstruction += "\n\nVocê tem uma ferramenta chamada 'performWebSearch' que pode usar para pesquisar informações atuais ou tópicos que não conhece. Se precisar, use-a informando a consulta de busca.";
    }
    // Para modelos Gemini, o system prompt geralmente é a primeira mensagem do usuário ou uma mensagem com role 'system'
    // dependendo da versão e como o modelo é invocado.
    // Para consistência, vamos adicionar como a primeira mensagem do 'user'.
    messages.push({ role: 'user', content: [{ text: systemInstruction }] }); 

    if (input.history && input.history.length > 0) {
      input.history.forEach(msg => {
         // Evitar adicionar o prompt do sistema do histórico novamente se ele já foi o primeiro
        if (messages.length > 0 && messages[0].role === 'user' && typeof messages[0].content === 'object' && (messages[0].content as Array<any>)[0].text === msg.content) {
          // Não adiciona se for idêntico à instrução de sistema já inserida
        } else {
          messages.push({ role: msg.role, content: [{ text: msg.content }] });
        }
      });
    }

    const currentUserMessageParts: Array<{text?: string, media?: {url: string, contentType?: string}}> = [];
    if (input.userMessage && input.userMessage.trim() !== "") {
      currentUserMessageParts.push({ text: input.userMessage });
    }
    if (input.fileDataUri) {
      const mimeTypeMatch = input.fileDataUri.match(/^data:(image\/[^;]+);base64,/);
      const contentType = mimeTypeMatch ? mimeTypeMatch[1] : undefined;
      currentUserMessageParts.push({ media: { url: input.fileDataUri, contentType } });
    }

    if (currentUserMessageParts.length > 0) {
      messages.push({ role: 'user', content: currentUserMessageParts });
    } else if (messages.length === 1 && messages[0].role === 'user') { 
      // Apenas a instrução de sistema e nenhuma mensagem atual do usuário
      // Adiciona uma mensagem vazia para garantir que o modelo tenha algo para responder,
      // ou dependendo do modelo, pode ser melhor não enviar nada. Para Gemini, é bom ter um input.
      messages.push({ role: 'user', content: [{text: " "}] });
    }
    
    const llmResponse = await ai.generate({
        model: modelToUse,
        prompt: { messages }, 
        tools: [performWebSearchTool], 
        config: temperatureToUse !== undefined ? { temperature: temperatureToUse } : undefined,
        output: {
            format: 'json',
            schema: BasicChatOutputSchema,
        },
    });

    const output = llmResponse.output();

    if (!output || !output.agentResponse) {
      console.error("Fluxo: Resposta do LLM inválida ou vazia", llmResponse.usage, llmResponse.candidates);
      const plainText = llmResponse.text;
      if (plainText) {
        return { agentResponse: plainText };
      }
      throw new Error("O modelo não retornou uma saída válida ou a resposta do agente estava vazia.");
    }
    
    return output;
  }
);
