
'use server';

import { basicChatFlow, BasicChatInput, BasicChatOutput } from '@/ai/flows/chat-flow';
import type { SavedAgentConfiguration } from '@/app/agent-builder/page'; // Import para o tipo
import { z } from 'zod';

// Definindo um tipo mais simples para os detalhes da ferramenta passados para a action
const AgentToolDetailSchema = z.object({
  id: z.string(),
  label: z.string(),
  iconName: z.string().optional(),
  needsConfiguration: z.boolean().optional(),
  genkitToolName: z.string().optional(),
});

const ChatMessageSchema = z.object({
  userInput: z.string(), 
  agentSystemPrompt: z.string().optional(),
  agentModel: z.string().optional(),
  agentTemperature: z.coerce.number().optional(),
  chatHistoryJson: z.string().optional(),
  fileDataUri: z.string().optional(),
  agentToolsDetailsJson: z.string().optional(), // Novo campo para detalhes das ferramentas
}).refine(data => !!data.userInput?.trim() || !!data.fileDataUri, {
  message: "A mensagem ou um arquivo deve ser fornecido.",
  path: ["userInput"], 
});


interface ChatFormState {
  message: string;
  agentResponse?: string | null;
  errors?: {
    userInput?: string[];
    chatHistoryJson?: string[];
    fileDataUri?: string[];
    agentToolsDetailsJson?: string[];
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
    chatHistoryJson: formData.get('chatHistoryJson'),
    fileDataUri: formData.get('fileDataUri'),
    agentToolsDetailsJson: formData.get('agentToolsDetailsJson'), // Processar novo campo
  });

  if (!validatedFields.success) {
    return {
      message: "Falha na validação. Verifique sua entrada.",
      errors: validatedFields.error.flatten().fieldErrors,
      agentResponse: null,
    };
  }

  const { 
    userInput, 
    agentSystemPrompt, 
    agentModel, 
    agentTemperature, 
    chatHistoryJson, 
    fileDataUri,
    agentToolsDetailsJson 
  } = validatedFields.data;

  let history: Array<{ role: 'user' | 'model'; content: string }> | undefined = undefined;
  if (chatHistoryJson) {
    try {
      history = JSON.parse(chatHistoryJson);
    } catch (error) {
      console.error("Erro ao parsear o histórico do chat:", error);
      return {
        message: "Erro interno ao processar o histórico do chat.",
        agentResponse: null,
        errors: { chatHistoryJson: ["Formato inválido do histórico do chat."] },
      };
    }
  }

  let agentToolsDetails: SavedAgentConfiguration['toolsDetails'] | undefined = undefined;
  if (agentToolsDetailsJson) {
    try {
      agentToolsDetails = JSON.parse(agentToolsDetailsJson);
    } catch (error) {
      console.error("Erro ao parsear os detalhes das ferramentas do agente:", error);
      return {
        message: "Erro interno ao processar os detalhes das ferramentas do agente.",
        agentResponse: null,
        errors: { agentToolsDetailsJson: ["Formato inválido dos detalhes das ferramentas."] },
      };
    }
  }

  const input: BasicChatInput = {
    userMessage: userInput || "", 
    systemPrompt: agentSystemPrompt,
    modelName: agentModel,
    temperature: agentTemperature,
    history: history,
    fileDataUri: fileDataUri,
    agentToolsDetails: agentToolsDetails, // Passar os detalhes das ferramentas
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

    