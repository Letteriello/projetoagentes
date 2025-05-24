
'use server';

import { basicChatFlow, BasicChatInput, BasicChatOutput } from '@/ai/flows/chat-flow';
import { z } from 'zod';

const ChatMessageSchema = z.object({
  userInput: z.string().min(1, { message: "A mensagem não pode estar vazia." }),
  agentSystemPrompt: z.string().optional(),
  agentModel: z.string().optional(),
  agentTemperature: z.coerce.number().optional(), // Coerce string from FormData to number
});

interface ChatFormState {
  message: string;
  agentResponse?: string | null;
  errors?: {
    userInput?: string[];
  } | null;
}

export async function submitChatMessage(
  prevState: ChatFormState,
  formData: FormData
): Promise<ChatFormState> {
  const validatedFields = ChatMessageSchema.safeParse({
    userInput: formData.get('userInput'),
    agentSystemPrompt: formData.get('agentSystemPrompt'),
    agentModel: formData.get('agentModel'),
    agentTemperature: formData.get('agentTemperature'),
  });

  if (!validatedFields.success) {
    return {
      message: "Falha na validação. Verifique sua entrada.",
      errors: validatedFields.error.flatten().fieldErrors,
      agentResponse: null,
    };
  }

  const { userInput, agentSystemPrompt, agentModel, agentTemperature } = validatedFields.data;

  const input: BasicChatInput = {
    userMessage: userInput,
    systemPrompt: agentSystemPrompt, // Será o systemPrompt do agente ou do Gem
    modelName: agentModel, // Modelo específico do agente
    temperature: agentTemperature, // Temperatura específica do agente
  };

  try {
    const result: BasicChatOutput = await basicChatFlow(input);
    return {
      message: "Resposta recebida.",
      agentResponse: result.agentResponse,
      errors: null,
    };
  } catch (error) {
    console.error("Erro ao chamar o fluxo de chat:", error);
    let errorMessage = "Ocorreu um erro ao processar sua mensagem. Tente novamente.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return {
      message: errorMessage,
      agentResponse: null,
      errors: { userInput: ["Falha ao comunicar com o agente: " + errorMessage] },
    };
  }
}
