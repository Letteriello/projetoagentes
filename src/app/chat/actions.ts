'use server';

import { basicChatFlow } from '@/ai/flows/chat-flow';
import { ChatInput, ChatOutput, ChatFormState, ChatToolDetail } from '@/types/chat-types';
import type { SavedAgentConfiguration } from '@/types/agent-configs-fixed'; // Import para o tipo
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


// Using ChatFormState from the shared types

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

  let parsedToolsDetails: SavedAgentConfiguration['toolsDetails'] | undefined = undefined;
  let agentToolsDetails: ChatToolDetail[] | undefined = undefined;
  
  if (agentToolsDetailsJson) {
    try {
      parsedToolsDetails = JSON.parse(agentToolsDetailsJson);
      
      // Converter do formato do formulário para o formato esperado pelo chat
      if (parsedToolsDetails) {
        agentToolsDetails = parsedToolsDetails.map(tool => ({
          id: tool.id,
          name: tool.label,
          description: tool.genkitToolName || tool.label,
          enabled: true
        }));
      }
    } catch (error) {
      console.error("Erro ao parsear os detalhes das ferramentas do agente:", error);
      return {
        message: "Erro interno ao processar os detalhes das ferramentas do agente.",
        agentResponse: null,
        errors: { agentToolsDetailsJson: ["Formato inválido dos detalhes das ferramentas."] },
      };
    }
  }

  const input: ChatInput = {
    userMessage: userInput || "", 
    systemPrompt: agentSystemPrompt,
    modelName: agentModel,
    temperature: agentTemperature,
    history: history,
    fileDataUri: fileDataUri,
    agentToolsDetails: agentToolsDetails, // Passar os detalhes das ferramentas
  };

  try {
    const result: ChatOutput = await basicChatFlow(input);
    return {
      message: "Resposta recebida.", // User-friendly success message
      agentResponse: result.outputMessage,
      errors: null,
    };
  } catch (error) {
    console.error("Erro ao chamar o fluxo de chat:", error); // Keep detailed log for developers
    let userFriendlyMessage = "Não foi possível processar sua mensagem. Verifique sua conexão ou tente novamente mais tarde.";
    let specificErrorField: { [key: string]: string[] } | null = null;

    if (error instanceof Error) {
      const lowerCaseError = error.message.toLowerCase();
      if (lowerCaseError.includes("auth") || lowerCaseError.includes("token") || lowerCaseError.includes("unauthorized")) {
        userFriendlyMessage = "Sua sessão expirou ou a autenticação falhou. Por favor, faça login novamente.";
        // Optionally, you could have a specific error field for auth if the form handles it
        // specificErrorField = { auth: [userFriendlyMessage] };
      } else if (lowerCaseError.includes("permission") || lowerCaseError.includes("denied")) {
        userFriendlyMessage = "Você não tem permissão para realizar esta ação ou acessar este recurso.";
      } else if (lowerCaseError.includes("not found") && lowerCaseError.includes("agent")) {
        userFriendlyMessage = "O agente configurado não foi encontrado. Por favor, verifique a configuração.";
      } else {
        // For other errors from basicChatFlow that are not caught above,
        // provide a slightly more specific generic error.
        userFriendlyMessage = "Falha ao comunicar com o agente. Se o problema persistir, contate o suporte.";
        // We can still pass the original error message for debugging if needed, but not directly to the user
        // unless it's deemed safe or helpful. For now, just a generic message.
        // specificErrorField = { flow: ["Erro interno do agente: " + error.message] }; // Example
      }
    }

    // The 'message' field in ChatFormState is the primary user-facing message.
    // 'errors' can provide more detailed (but still safe) field-specific issues.
    return {
      message: userFriendlyMessage,
      agentResponse: null,
      errors: specificErrorField || { general: [userFriendlyMessage] }, // Use general if no specific field
    };
  }
}

    