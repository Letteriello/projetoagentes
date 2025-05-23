
'use server';
/**
 * @fileOverview Fluxo de chat básico para interagir com um modelo de IA.
 *
 * - basicChatFlow - Uma função que lida com uma única troca de chat.
 * - BasicChatInput - O tipo de entrada para basicChatFlow.
 * - BasicChatOutput - O tipo de retorno para basicChatFlow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Esquema para a entrada do fluxo de chat
const BasicChatInputSchema = z.object({
  userMessage: z.string().describe('A mensagem do usuário para o agente.'),
  systemPrompt: z.string().optional().describe('O prompt do sistema para guiar o comportamento do agente.'),
  // agentId: z.string().optional().describe('O ID do agente configurado para usar (para lógica futura).'),
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
  name: 'basicChatPrompt',
  input: { schema: BasicChatInputSchema },
  output: { schema: BasicChatOutputSchema },
  // Usamos uma função de prompt para construir dinamicamente o histórico de mensagens
  // e o prompt do sistema.
  prompt: (input: BasicChatInput) => {
    const messages = [];
    if (input.systemPrompt) {
      messages.push({ role: 'system', content: input.systemPrompt });
    }
    messages.push({ role: 'user', content: input.userMessage });
    
    // Por enquanto, este prompt espera uma única resposta em `agentResponse`.
    // Se quisermos um histórico de chat mais complexo, teríamos que ajustar
    // o esquema de saída e a lógica aqui.
    return {
      messages,
      output: {
        format: 'json',
        schema: BasicChatOutputSchema,
      },
    };
  },
  // Configuração do modelo, se necessário (ex: temperatura)
  // config: {
  //   temperature: 0.7,
  // },
});

// Definição do fluxo Genkit
const internalChatFlow = ai.defineFlow(
  {
    name: 'internalChatFlow',
    inputSchema: BasicChatInputSchema,
    outputSchema: BasicChatOutputSchema,
  },
  async (input: BasicChatInput) => {
    // console.log("Fluxo: Recebido input:", input);

    // Aqui, em uma implementação mais avançada, você poderia:
    // 1. Carregar a configuração do agente com base no `input.agentId`.
    // 2. Usar um modelo específico ou ferramentas específicas para esse agente.
    // 3. Manter um histórico de chat mais longo.

    const llmResponse = await chatPrompt(input);
    const output = llmResponse.output();

    if (!output) {
      throw new Error("O modelo não retornou uma saída válida.");
    }
    
    // console.log("Fluxo: Resposta do LLM (output):", output);
    return output;
  }
);

