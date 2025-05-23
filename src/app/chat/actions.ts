
'use server';

import { basicChatFlow, BasicChatInput, BasicChatOutput } from '@/ai/flows/chat-flow';
import { z } from 'zod';

const ChatMessageSchema = z.object({
  userInput: z.string().min(1, { message: "A mensagem não pode estar vazia." }),
  gemPrompt: z.string().optional(),
  selectedAgent: z.string().optional(),
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
    gemPrompt: formData.get('gemPrompt'),
    selectedAgent: formData.get('selectedAgent'),
  });

  if (!validatedFields.success) {
    return {
      message: "Falha na validação. Verifique sua entrada.",
      errors: validatedFields.error.flatten().fieldErrors,
      agentResponse: null,
    };
  }

  const { userInput, gemPrompt, selectedAgent } = validatedFields.data;

  const input: BasicChatInput = {
    userMessage: userInput,
    systemPrompt: gemPrompt || "Você é um assistente prestativo.", // Default if not provided
    // agentId: selectedAgent, // We'll use this later for agent-specific logic
  };

  try {
    // console.log("Chamando basicChatFlow com:", input);
    const result: BasicChatOutput = await basicChatFlow(input);
    // console.log("Resultado do basicChatFlow:", result);
    return {
      message: "Resposta recebida.",
      agentResponse: result.agentResponse,
      errors: null,
    };
  } catch (error) {
    console.error("Erro ao chamar o fluxo de chat:", error);
    return {
      message: "Ocorreu um erro ao processar sua mensagem. Tente novamente.",
      agentResponse: null,
      errors: { userInput: ["Falha ao comunicar com o agente."] },
    };
  }
}
