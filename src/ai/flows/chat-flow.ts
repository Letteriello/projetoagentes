
'use server';
/**
 * @fileOverview Fluxo de chat básico para interagir com um modelo de IA, com suporte a histórico, envio de imagens e ferramentas dinâmicas.
 *
 * - basicChatFlow - Uma função que lida com uma única troca de chat, considerando o histórico, possível imagem e ferramentas.
 * - BasicChatInput - O tipo de entrada para basicChatFlow.
 * - BasicChatOutput - O tipo de retorno para basicChatFlow.
 */

import { ai } from '@/ai/genkit';
import { performWebSearchTool } from '@/ai/tools/web-search-tool';
// Importe outras ferramentas Genkit aqui conforme são criadas
// Ex: import { calculatorTool } from '@/ai/tools/calculator-tool';
import { openAI } from 'genkitx-openai';
import { ollama } from 'genkitx-ollama';
import process from 'node:process';
import { z } from 'genkit';
import type { ToolsArgument } from 'genkit/model';

// Mapa de todas as ferramentas Genkit disponíveis na aplicação
// A chave deve corresponder ao 'genkitToolName' definido em 'agent-builder/page.tsx'
const allAvailableGenkitTools: Record<string, ToolsArgument[0]> = {
  performWebSearch: performWebSearchTool,
  // calculator: calculatorTool, // Exemplo
};

interface AgentToolDetail {
  id: string;
  label: string;
  iconName?: string;
  needsConfiguration?: boolean;
  genkitToolName?: string;
}

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
  agentToolsDetails: z.array(z.object({ // Detalhes das ferramentas configuradas para o agente
    id: z.string(),
    label: z.string(),
    iconName: z.string().optional(),
    needsConfiguration: z.boolean().optional(),
    genkitToolName: z.string().optional(),
  })).optional().describe('Detalhes das ferramentas configuradas para o agente ativo.'),
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

// Definição do prompt Genkit - Simplificado, pois as ferramentas são passadas dinamicamente
const chatPrompt = ai.definePrompt(
  {
    name: 'basicChatPromptWithDynamicTools',
    // Não definimos 'tools' aqui, pois serão passados dinamicamente para ai.generate()
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
    name: 'internalChatFlowWithDynamicTools',
    inputSchema: BasicChatInputSchema,
    outputSchema: BasicChatOutputSchema,
  },
  async (input: BasicChatInput) => {
    const modelToUse = input.modelName || ai.getModel(); // Usa o modelo do agente ou o padrão do Genkit
    const temperatureToUse = input.temperature;

    let dynamicModel; // To hold the dynamically configured model instance

    if (modelToUse.startsWith('openrouter/')) {
        const modelId = modelToUse.split('openrouter/')[1];
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return { agentResponse: "Erro: OPENROUTER_API_KEY não está configurada no servidor." };
        }
        dynamicModel = openAI({ 
            apiKey: apiKey, 
            model: modelId, 
            baseUrl: "https://openrouter.ai/api/v1" 
        });
        console.log(`Usando OpenRouter: ${modelId}`);
    } else if (modelToUse.startsWith('groq/')) {
        const modelId = modelToUse.split('groq/')[1];
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            return { agentResponse: "Erro: GROQ_API_KEY não está configurada no servidor." };
        }
        dynamicModel = openAI({ 
            apiKey: apiKey, 
            model: modelId, 
            baseUrl: "https://api.groq.com/openai/v1"
        });
        console.log(`Usando Groq: ${modelId}`);
    } else if (modelToUse.startsWith('ollama/')) {
        const modelId = modelToUse.split('ollama/')[1];
        const ollamaHost = process.env.OLLAMA_API_HOST;
        if (!ollamaHost) {
            return { agentResponse: "Erro: OLLAMA_API_HOST não está configurado no servidor." };
        }
        dynamicModel = ollama({ 
            host: ollamaHost, 
            model: modelId 
        });
        console.log(`Usando Ollama: ${modelId} em ${ollamaHost}`);
    } else if (modelToUse.startsWith('requestly/custom')) {
        return { 
            agentResponse: "Este agente está configurado para usar Requestly (Mock). Resposta mock: 'Olá do Requestly!'" 
        };
    } else if (modelToUse.startsWith('custom-http/genkit')) {
        return { 
            agentResponse: "Este agente está configurado para usar um endpoint HTTP customizado. A integração completa para este tipo de configuração ainda não está implementada no sistema de chat padrão." 
        };
    } else if (modelToUse.startsWith('googleai/')) {
        dynamicModel = modelToUse; 
        console.log(`Usando Google AI: ${modelToUse}`);
    } else {
        dynamicModel = ai.getModel(); 
        console.log(`Usando modelo padrão Genkit ou modelo não reconhecido: ${modelToUse}`);
    }

    const messages: Array<{ role: string, content: any | Array<{text?: string, media?: {url: string, contentType?: string}}> }> = [];

    let systemInstruction = input.systemPrompt || "Você é um assistente prestativo.";
    
    // A lógica para adicionar nomes de ferramentas ao systemInstruction já está no constructSystemPrompt do agent-builder.
    // Portanto, o systemPrompt recebido aqui já deve conter essa informação.

    messages.push({ role: 'user', content: [{ text: systemInstruction }] }); 

    if (input.history && input.history.length > 0) {
      input.history.forEach(msg => {
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
      messages.push({ role: 'user', content: [{text: " "}] });
    }
    
    // Selecionar dinamicamente as ferramentas Genkit com base na configuração do agente
    const activeGenkitTools: ToolsArgument = [];
    if (input.agentToolsDetails) {
      input.agentToolsDetails.forEach(toolDetail => {
        if (toolDetail.genkitToolName && allAvailableGenkitTools[toolDetail.genkitToolName]) {
          activeGenkitTools.push(allAvailableGenkitTools[toolDetail.genkitToolName]);
        }
      });
    }
    // Se nenhuma ferramenta específica do agente for encontrada, podemos usar um conjunto padrão ou nenhuma.
    // Por enquanto, se activeGenkitTools estiver vazio, nenhuma ferramenta será passada.
    // Ou podemos adicionar uma ferramenta padrão se necessário, ex:
    // if (activeGenkitTools.length === 0) {
    //   activeGenkitTools.push(performWebSearchTool); // Exemplo: sempre ter busca web se nenhuma outra for definida
    // }


    const llmResponse = await ai.generate({
        model: dynamicModel,
        prompt: { messages }, 
        tools: activeGenkitTools.length > 0 ? activeGenkitTools : undefined, // Passa as ferramentas dinâmicas
        config: temperatureToUse !== undefined ? { temperature: temperatureToUse } : undefined,
        output: { // Solicitar saída JSON para consistência
            format: 'json',
            schema: BasicChatOutputSchema,
        },
    });

    const output = llmResponse.output();

    if (!output || !output.agentResponse) {
      console.warn("Fluxo: Resposta do LLM inválida ou vazia (output.agentResponse ausente). Tentando llmResponse.text().", llmResponse.usage);
      const plainText = llmResponse.text;
      if (plainText) {
        console.log("Fluxo: Usando llmResponse.text() como fallback:", plainText);
        return { agentResponse: plainText };
      }
      console.error("Fluxo: Falha crítica, nenhuma resposta do LLM pôde ser extraída.");
      throw new Error("O modelo não retornou uma saída válida ou a resposta do agente estava vazia.");
    }
    
    return output;
  }
);

    