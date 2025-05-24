
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
  modelName: z.string().optional().describe('O nome do modelo de IA a ser usado (ex: googleai/gemini-1.5-pro-latest).'),
  temperature: z.number().optional().describe('A temperatura para a geração do modelo (ex: 0.7).'),
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
    // O systemPrompt agora vem do agente configurado ou do Gem selecionado
    if (input.systemPrompt) {
      messages.push({ role: 'system', content: input.systemPrompt });
    } else {
      messages.push({ role: 'system', content: "Você é um assistente prestativo."}); // Fallback
    }
    messages.push({ role: 'user', content: input.userMessage });
    
    return {
      messages,
      output: {
        format: 'json', // Ainda esperamos JSON, pois o schema de saída é um objeto
        schema: BasicChatOutputSchema,
      },
    };
  },
  // Configurações do modelo podem ser sobrescritas aqui ou passadas dinamicamente
  config: {
    // A temperatura padrão pode ser definida aqui, mas será sobrescrita se input.temperature for fornecido
    temperature: 0.7, 
  },
});

// Definição do fluxo Genkit
const internalChatFlow = ai.defineFlow(
  {
    name: 'internalChatFlow',
    inputSchema: BasicChatInputSchema,
    outputSchema: BasicChatOutputSchema,
  },
  async (input: BasicChatInput) => {
    
    const modelToUse = input.modelName || ai.getModel(); // Usa o modelo do input ou o padrão do Genkit
    const temperatureToUse = input.temperature; // Usa a temperatura do input, se definida

    const llmResponse = await chatPrompt(input, {
        model: modelToUse, // Passa o modelo dinamicamente
        config: temperatureToUse !== undefined ? { temperature: temperatureToUse } : undefined, // Passa a temperatura se definida
      }
    );
    const output = llmResponse.output();

    if (!output) {
      throw new Error("O modelo não retornou uma saída válida.");
    }
    
    return output;
  }
);
