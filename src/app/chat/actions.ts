'use server';

import { basicChatFlow } from '@/ai/flows/chat-flow';
import { ChatInput, ChatOutput, ChatFormState, ChatToolDetail } from '@/types/chat-types';
import type { SavedAgentConfiguration } from '@/types/unified-agent-types';
import { z } from 'zod';
import { winstonLogger } from '@/lib/winston-logger'; // Import winstonLogger

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
      winstonLogger.error("Erro ao parsear o histórico do chat JSON", {
        error: error instanceof Error ? error.toString() : String(error),
        chatHistoryJsonSubstring: chatHistoryJson.substring(0, 100), // Log a snippet
      });
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
      if (parsedToolsDetails) {
        agentToolsDetails = parsedToolsDetails.map(tool => ({
          id: tool.id,
          name: tool.label,
          description: tool.genkitToolName || tool.label, // Ensure description is populated
          enabled: true // Assuming tools passed are intended to be enabled
        }));
      }
    } catch (error) {
      winstonLogger.error("Erro ao parsear os detalhes das ferramentas do agente JSON", {
        error: error instanceof Error ? error.toString() : String(error),
        agentToolsDetailsJsonSubstring: agentToolsDetailsJson.substring(0, 100), // Log a snippet
      });
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
      message: "Resposta recebida.",
      agentResponse: result.outputMessage,
      errors: null,
    };
  } catch (error) {
    winstonLogger.error("Erro ao chamar o basicChatFlow em submitChatMessage", {
      userInputLength: input.userMessage?.length,
      modelName: input.modelName,
      fileProvided: !!input.fileDataUri,
      numTools: input.agentToolsDetails?.length,
      error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : String(error),
    });

    let userFriendlyMessage = "Não foi possível processar sua mensagem. Verifique sua conexão ou tente novamente mais tarde.";
    let specificErrorField: { [key: string]: string[] } | null = null;

    if (error instanceof Error) {
      const lowerCaseError = error.message.toLowerCase();
      if (lowerCaseError.includes("auth") || lowerCaseError.includes("token") || lowerCaseError.includes("unauthorized")) {
        userFriendlyMessage = "Sua sessão expirou ou a autenticação falhou. Por favor, faça login novamente.";
      } else if (lowerCaseError.includes("permission") || lowerCaseError.includes("denied")) {
        userFriendlyMessage = "Você não tem permissão para realizar esta ação ou acessar este recurso.";
      } else if (lowerCaseError.includes("not found") && (lowerCaseError.includes("agent") || lowerCaseError.includes("flow"))) {
        userFriendlyMessage = "O agente ou fluxo configurado não foi encontrado. Por favor, verifique a configuração.";
      } else if (lowerCaseError.includes("fetch failed") || lowerCaseError.includes("networkerror")) {
        userFriendlyMessage = "Erro de rede ao tentar comunicar com o serviço. Verifique sua conexão e tente novamente.";
      } else {
        userFriendlyMessage = "Falha ao comunicar com o agente. Se o problema persistir, contate o suporte.";
      }
    }
    // For non-Error instances or if more specific classification is needed, could add more checks here.

    return {
      message: userFriendlyMessage,
      agentResponse: null,
      errors: specificErrorField || { general: [userFriendlyMessage] }, // Use general if no specific field
    };
  }
}

    