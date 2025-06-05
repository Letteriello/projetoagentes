// src/ai/flows/agent-creator-flow.ts
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai'; // Added for dynamic model creation
import * as z from 'zod';
import { SavedAgentConfiguration, AgentConfig, AgentType, LLMAgentConfig, WorkflowAgentConfig, CustomAgentConfig, A2AAgentSpecialistConfig } from '@/types/unified-agent-types';
import { winstonLogger } from '../../lib/winston-logger';
import { llmModels } from '../../data/llm-models'; // Import consolidated models

const AgentCreatorChatInputSchema = z.object({
  userNaturalLanguageInput: z.string(),
  currentAgentConfigJson: z.string().optional(),
  chatHistory: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

const AgentCreatorChatOutputSchema = z.object({
  updatedAgentConfigJson: z.string(),
  assistantResponse: z.string(),
  error: z.string().optional(),
});

function ensureBaseConfig(config: Partial<SavedAgentConfiguration>): Partial<SavedAgentConfiguration> {
    config.agentName = config.agentName || "";
    config.agentDescription = config.agentDescription || "";
    config.agentVersion = config.agentVersion || "1.0.0";
    config.tools = config.tools || [];
    config.toolConfigsApplied = config.toolConfigsApplied || {};
    config.toolsDetails = config.toolsDetails || [];

    if (!config.config) {
        config.config = { type: undefined, framework: 'genkit' } as any;
    } else {
        config.config.type = config.config.type || undefined;
        config.config.framework = config.config.framework || 'genkit';
    }
    // Ensure type-specific fields are initialized if the type is set
    if (config.config?.type === 'llm' && typeof (config.config as LLMAgentConfig).agentGoal === 'undefined') {
        const llmConfig = config.config as Partial<LLMAgentConfig>;
        llmConfig.agentGoal = "";
        llmConfig.agentTasks = [];
        llmConfig.agentPersonality = "";
        llmConfig.agentRestrictions = [];

        // Determine default model for new agents
        const defaultAgentModelId = 'gemini-1.5-flash-latest';
        let defaultModelForNewAgents = llmModels.find(m => m.id === defaultAgentModelId);
        if (!defaultModelForNewAgents && llmModels.length > 0) {
            winstonLogger.warn(`Default model ${defaultAgentModelId} not found for new agents, falling back to the first available model: ${llmModels[0].id}`);
            defaultModelForNewAgents = llmModels[0];
        }

        if (defaultModelForNewAgents) {
            llmConfig.agentModel = defaultModelForNewAgents.id;
        } else {
            winstonLogger.error("No LLM models found in llmModels list. Cannot set a default model for new agents.");
            llmConfig.agentModel = "default-model-if-list-empty"; // Fallback if list is empty
        }

        llmConfig.agentTemperature = 0.7;
    } else if (config.config?.type === 'workflow' && typeof (config.config as WorkflowAgentConfig).workflowType === 'undefined') {
        const workflowConfig = config.config as Partial<WorkflowAgentConfig>;
        workflowConfig.workflowType = "sequential";
    }
    // A2A has no specific fields beyond base by default in this structure
    return config;
}


// Define the flow function that takes the input and processes it
export const agentCreatorChatFlow = ai.defineFlow('agentCreatorChatFlow', async (input: z.infer<typeof AgentCreatorChatInputSchema>) => {
    winstonLogger.info("[agentCreatorChatFlow] Input received", { flowName: 'agentCreatorChatFlow', input });

    let currentConfig: Partial<SavedAgentConfiguration> = {};
    if (input.currentAgentConfigJson && input.currentAgentConfigJson !== "{}" && input.currentAgentConfigJson !== "null") {
      try {
        currentConfig = JSON.parse(input.currentAgentConfigJson);
      } catch (e) {
        winstonLogger.error("[agentCreatorChatFlow] Error parsing currentAgentConfigJson", { flowName: 'agentCreatorChatFlow', error: e, currentAgentConfigJson: input.currentAgentConfigJson });
        currentConfig = ensureBaseConfig({}); // Start fresh if parsing fails
        // Do not return error immediately, let the LLM try to work with a fresh config or ask user.
        // The assistant message will indicate an issue if needed.
      }
    }
    currentConfig = ensureBaseConfig(currentConfig);

    const historyForPrompt = input.chatHistory?.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`).join('\n') || 'Nenhuma conversa anterior nesta sessão de criação.';

    const systemPrompt = `
      Você é um assistente especialista em configurar agentes de IA. Sua tarefa é ajudar um usuário a construir a configuração de um agente passo a passo, interpretando as instruções em linguagem natural e atualizando um objeto JSON que representa a configuração do agente.

      A estrutura principal da configuração do agente é \`SavedAgentConfiguration\`. Dentro dela, existe um campo \`config\` do tipo \`AgentConfig\` que varia conforme o \`config.type\` ("llm", "workflow", "a2a").

      Configuração JSON ATUAL do agente (pode estar vazia ou parcial):
      \`\`\`json
      ${JSON.stringify(currentConfig, null, 2)}
      \`\`\`

      Histórico da conversa DESTA SESSÃO DE CRIAÇÃO:
      ${historyForPrompt}

      Instrução ATUAL do usuário: "${input.userNaturalLanguageInput}"

      SUAS RESPONSABILIDADES:
      1.  INTERPRETAR a instrução do usuário à luz da configuração atual e do histórico.
      2.  PRIORIDADES DE COLETA DE DADOS:
          - Se a configuração atual NÃO tiver um 'agentName' definido ou estiver vazio, SUA PRIMEIRA PRIORIDADE é perguntar ao usuário: "Qual nome você gostaria de dar a este agente?". Não modifique o JSON ainda, apenas faça esta pergunta.
          - Se a configuração atual tem um 'agentName' mas NÃO tem 'config.type' definido (ou seja, \`config.type\` é \`undefined\` ou nulo), SUA PRÓXIMA PRIORIDADE é perguntar: "Qual será o tipo deste agente? As opções são: LLM, Workflow, ou A2A." Não modifique o JSON ainda, apenas faça esta pergunta.
      3.  ATUALIZAR o JSON da configuração do agente (fornecido acima) para refletir a instrução do usuário, SE as prioridades acima estiverem satisfeitas e a instrução for clara.
          - Se o usuário fornecer um nome, atualize \`agentName\`.
          - Se o usuário definir um tipo, atualize \`config.type\`. Certifique-se que o objeto \`config\` exista. Se \`config.type\` mudar, reinicie as propriedades específicas do tipo antigo para evitar inconsistências.
          - Para agentes "llm", campos importantes são \`config.agentGoal\`, \`config.agentTasks\` (array de strings), \`config.agentPersonality\`, \`config.agentModel\`, \`config.temperature\`.
          - Para adicionar ferramentas, modifique o array \`tools\` (adicione o ID da ferramenta, ex: "webSearch", "calculator").
      4.  GERAR uma mensagem de conversação para o usuário (\`assistantMessage\`).
          - Se você fez uma pergunta (prioridade de coleta ou esclarecimento), \`assistantMessage\` deve ser APENAS a pergunta.
          - Se você atualizou a configuração, \`assistantMessage\` DEVE confirmar a principal alteração realizada e pode perguntar o que mais o usuário deseja fazer. Ex: "Ok, atualizei o modelo para 'gemini-1.5-pro'. Mais alguma alteração nesse agente?" ou "Calculadora adicionada às ferramentas. O que mais?".
      5.  RETORNAR um objeto JSON contendo DUAS chaves:
          - \`updatedConfig\`: O objeto JSON COMPLETO da \`SavedAgentConfiguration\` atualizada. Se você fez apenas uma pergunta de esclarecimento (e não uma pergunta de prioridade que impede a modificação), você PODE retornar a configuração atual sem modificações. Se for uma pergunta de prioridade (nome/tipo faltando), retorne a configuração como está.
          - \`assistantMessage\`: Sua mensagem textual para o usuário.

      TRATAMENTO DE INSTRUÇÕES:
      - Se a prioridade de coleta de dados (nome/tipo) se aplicar, faça a pergunta correspondente e retorne a configuração atual em \`updatedConfig\`.
      - Se a instrução do usuário for clara e você puder atualizar a configuração (e as prioridades estão satisfeitas):
          1. Modifique o JSON em 'updatedConfig'.
          2. Formule uma 'assistantMessage' confirmando a ação e perguntando o próximo passo.
      - Se a instrução for vaga ou você precisar de mais informações (e não for uma prioridade de coleta já mencionada):
          1. NÃO modifique o JSON em 'updatedConfig' (retorne o JSON atual).
          2. Formule uma 'assistantMessage' pedindo o esclarecimento necessário. Ex: "Para definir o fluxo de trabalho, você gostaria que fosse sequencial, paralelo ou baseado em um grafo?"
      - Tente ser conciso e amigável em suas mensagens. Evite jargões técnicos excessivos.

      EXEMPLOS DE INTERAÇÃO (após nome e tipo já definidos, se aplicável):
      Usuário: "Defina o objetivo como 'Resumir documentos longos'."
      Sua resposta JSON (para o sistema):
      {
        "updatedConfig": { "agentName": "AgenteDeExemplo", "config": { "type": "llm", "agentGoal": "Resumir documentos longos", "outrosCamposPreservados": "..." }, "outrosCamposBasePreservados": "..." },
        "assistantMessage": "Entendido. O objetivo do agente agora é 'Resumir documentos longos'. Gostaria de adicionar tarefas específicas?"
      }

      Usuário: "Adicione a capacidade de buscar na web."
      Sua resposta JSON (para o sistema):
      {
        "updatedConfig": { "agentName": "AgenteDeExemplo", "tools": ["webSearch"], "config": {"type": "llm", "outrosCamposPreservados": "..."}, "outrosCamposBasePreservados": "..." },
        "assistantMessage": "Adicionei a ferramenta de busca na web. Algo mais?"
      }

      SEMPRE retorne o JSON completo e atualizado em \`updatedConfig\`. Certifique-se que todos os campos da estrutura base (agentName, description, version, tools, toolConfigsApplied, toolsDetails, config.type, config.framework) estejam presentes no \`updatedConfig\`.
    `;

    try {
      // Select model for the agent creator flow's own logic
      const agentCreatorModelId = 'gemini-1.5-pro-latest'; // Preferred model for this flow
      let agentCreatorModelDetails = llmModels.find(m => m.id === agentCreatorModelId);

      if (!agentCreatorModelDetails && llmModels.length > 0) {
          winstonLogger.warn(`Model ${agentCreatorModelId} not found for agent creator flow, falling back to the first available model: ${llmModels[0].id}`);
          agentCreatorModelDetails = llmModels[0];
      }

      if (!agentCreatorModelDetails) {
          winstonLogger.error("No LLM models found in llmModels list for agentCreatorChatFlow. Cannot proceed.");
          throw new Error("No LLM models available for agentCreatorChatFlow.");
      }

      // Assuming googleAI for Google provider based on original gemini10Pro usage.
      // This would need to be more dynamic if the chosen model could be from another provider.
      // For example: if (agentCreatorModelDetails.provider === 'OpenAI') { genkitAgentCreatorModel = openai(agentCreatorModelDetails.id) }
      if (agentCreatorModelDetails.provider !== 'Google' && agentCreatorModelDetails.provider !== 'OpenAI') { // Adjusted to allow OpenAI as well, assuming openai is imported and handled
        winstonLogger.warn(`Agent creator model ${agentCreatorModelDetails.id} is from provider ${agentCreatorModelDetails.provider}. Ensure Genkit is configured for this provider.`);
        // Potentially throw error if provider not supported by this flow's specific setup
      }
      const genkitAgentCreatorModel = googleAI(agentCreatorModelDetails.id as any); // Cast to 'any' to satisfy Genkit's specific model type if IDs are generic strings

      // Make the generation request with JSON schema validation
      const { text } = await ai.generate({ prompt: systemPrompt, model: genkitAgentCreatorModel });
      
      // Parse the JSON response
      let responseValue;
      try {
        responseValue = JSON.parse(text);
        // Validate and transform the response
        const { updatedConfig, assistantMessage } = responseValue;
        responseValue = {
          updatedConfig: ensureBaseConfig(updatedConfig as Partial<SavedAgentConfiguration>),
          assistantMessage: assistantMessage
        };
      } catch (e) {
        winstonLogger.error("[agentCreatorChatFlow] Error parsing LLM JSON response", { flowName: 'agentCreatorChatFlow', error: e, llmResponseText: text });
        throw new Error("Failed to parse LLM response as JSON");
      }

      if (!responseValue) {
        throw new Error("LLM não retornou dados válidos (output nulo).");
      }

      if (typeof responseValue.updatedConfig !== 'object' || responseValue.updatedConfig === null || typeof responseValue.assistantMessage !== 'string') {
        winstonLogger.error("[agentCreatorChatFlow] LLM response does not have the expected structure", { flowName: 'agentCreatorChatFlow', responseValue });
        throw new Error("Resposta do LLM não está no formato esperado (updatedConfig objeto, assistantMessage string).");
      }

      winstonLogger.info("[agentCreatorChatFlow] LLM Response value", { flowName: 'agentCreatorChatFlow', responseValue });

      // Pequena lógica para garantir que se o LLM não fornecer agentName ou config.type, e eles estiverem vazios,
      // a mensagem do assistente seja ajustada para continuar perguntando, mesmo que o LLM não tenha seguido essa instrução à risca.
      let finalAssistantMessage = responseValue.assistantMessage;
      const finalConfig = responseValue.updatedConfig as Partial<SavedAgentConfiguration>;

      if (!finalConfig.agentName) {
        finalAssistantMessage = "Qual nome você gostaria de dar a este agente?";
      } else if (!finalConfig.config?.type) {
        finalAssistantMessage = `O agente se chama "${finalConfig.agentName}". Qual será o tipo deste agente? As opções são: LLM, Workflow, ou A2A.`;
      }


      return {
        updatedAgentConfigJson: JSON.stringify(finalConfig),
        assistantResponse: finalAssistantMessage,
      };

    } catch (e: any) {
      winstonLogger.error("[agentCreatorChatFlow] Error during LLM call or processing", { flowName: 'agentCreatorChatFlow', error: e, input });
      // Tentar retornar a configuração atual se o LLM falhar completamente, para não perder o estado.
      const currentJsonOnError = input.currentAgentConfigJson && input.currentAgentConfigJson !== "{}" && input.currentAgentConfigJson !== "null"
                                 ? input.currentAgentConfigJson
                                 : JSON.stringify(ensureBaseConfig({}));
      return {
        updatedAgentConfigJson: currentJsonOnError,
        assistantResponse: `Desculpe, tive um problema ao processar sua solicitação: ${e.message}. Poderia tentar de novo ou reformular?`,
        error: e.message,
      };
    }
});
