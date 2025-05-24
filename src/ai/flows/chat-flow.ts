
'use server';
/**
 * @fileOverview Fluxo de chat básico para interagir com um modelo de IA, com suporte a histórico.
 *
 * - basicChatFlow - Uma função que lida com uma única troca de chat, considerando o histórico.
 * - BasicChatInput - O tipo de entrada para basicChatFlow.
 * - BasicChatOutput - O tipo de retorno para basicChatFlow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Esquema interno para a entrada do fluxo de chat (não exportado)
const BasicChatInputSchema = z.object({
  userMessage: z.string().describe('A mensagem do usuário para o agente.'),
  systemPrompt: z.string().optional().describe('O prompt do sistema para guiar o comportamento do agente.'),
  modelName: z.string().optional().describe('O nome do modelo de IA a ser usado (ex: googleai/gemini-1.5-pro-latest).'),
  temperature: z.number().optional().describe('A temperatura para a geração do modelo (ex: 0.7).'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe('O histórico da conversa até o momento.'),
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
  name: 'basicChatPromptWithHistory',
  // Não precisamos definir input/output schema aqui se a função de prompt
  // lida com a construção da estrutura que o modelo espera.
  // input: { schema: BasicChatInputSchema }, 
  // output: { schema: BasicChatOutputSchema }, 
  prompt: (input: BasicChatInput) => {
    const messages: Array<{ role: string, content: string | Array<{text?: string, media?: {url: string}}> }> = []; // Ajuste para o tipo esperado pelo Genkit/Gemini

    // Adiciona o prompt do sistema como primeira mensagem, se fornecido
    // Alguns modelos preferem o system prompt dentro do primeiro 'user' ou como uma instrução geral.
    // Para Gemini, é comum iniciar com um prompt de sistema ou role 'user' com instruções.
    // Se o modelo realmente suportar role 'system', pode ser usado. Por ora, vamos assumir que o prompt de sistema é prepended.
    const systemInstruction = input.systemPrompt || "Você é um assistente prestativo.";
    
    // Adiciona o histórico, se existir
    if (input.history && input.history.length > 0) {
        // A primeira mensagem do histórico pode já ser o system prompt. 
        // Vamos garantir que o system prompt definido (do agente ou gem) tenha prioridade.
        // Uma abordagem é colocar o systemPrompt como a primeira mensagem do array.
        // Para modelos como Gemini, o histórico vem antes da última mensagem do usuário.

        // Adiciona o system prompt como primeira mensagem do histórico.
        // Se o histórico já contiver um prompt de sistema (ex: a primeira mensagem do usuário tem instruções),
        // a lógica aqui pode precisar ser mais sofisticada para mesclar ou priorizar.
        // Por simplicidade, vamos assumir que o systemPrompt fornecido é o guia principal.
        // E o histórico é simplesmente o que veio antes.

        // A forma mais simples é concatenar o systemPrompt no início da primeira mensagem do usuário se não houver system role
        // ou garantir que ele seja a primeira mensagem do history se a role 'system' for usada.
        // Para compatibilidade com Genkit esperando MessagePart[], vamos usar a estrutura {role, content}
        
        messages.push({ role: 'user', content: systemInstruction }); // Coloca o system prompt como primeira mensagem 'user'

        input.history.forEach(msg => {
          // Se o system prompt já foi adicionado como primeira mensagem user,
          // e a primeira mensagem do histórico também é um system prompt, evitamos duplicidade.
          // Esta lógica pode ser refinada. Por agora, vamos adicionar o histórico como está.
          if (messages.length > 0 && messages[0].content === systemInstruction && msg.role === 'user' && msg.content.startsWith(systemInstruction)) {
            //  Não adiciona se for a mesma instrução inicial, para evitar redundância.
          } else {
            messages.push({ role: msg.role, content: msg.content });
          }
        });
    } else {
      // Se não há histórico, o system prompt é a primeira interação do usuário.
      messages.push({ role: 'user', content: systemInstruction });
    }
    
    // Adiciona a última mensagem do usuário, certificando-se de que ela não seja igual ao system prompt se este foi o único item
     if (!(messages.length === 1 && messages[0].content === input.userMessage && messages[0].content === systemInstruction)) {
       // Verifica se a última mensagem no histórico já é a userMessage atual (caso o history já inclua a última msg)
       if(!(input.history && input.history.length > 0 && input.history[input.history.length -1].role === 'user' && input.history[input.history.length -1].content === input.userMessage)) {
         messages.push({ role: 'user', content: input.userMessage });
       }
     }


    return {
      messages, // Genkit espera um array de MessagePart
      output: { // Ainda esperamos a estrutura de output definida
        format: 'json',
        schema: BasicChatOutputSchema,
      },
    };
  },
  config: {
    temperature: 0.7, // Padrão, pode ser sobrescrito
  },
});

// Definição do fluxo Genkit
const internalChatFlow = ai.defineFlow(
  {
    name: 'internalChatFlowWithHistory',
    inputSchema: BasicChatInputSchema,
    outputSchema: BasicChatOutputSchema,
  },
  async (input: BasicChatInput) => {
    const modelToUse = input.modelName || ai.getModel();
    const temperatureToUse = input.temperature;

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

    