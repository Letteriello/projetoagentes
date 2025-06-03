import { NextRequest } from 'next/server';
import { ai } from '@/ai/genkit';
import { gemini10Pro } from '@genkit-ai/googleai';
import * as z from 'zod';
import { allTools } from '@/data/agent-builder/available-tools';
import { AvailableTool } from '@/types/tool-types';
import { SavedAgentConfiguration, AgentConfig, LLMAgentConfig, WorkflowAgentConfig, WorkflowDetailedType as WorkflowType } from '@/types/agent-configs-fixed';

// 1. Define Input Schema
/**
 * Defines the input structure for the AI Configuration Assistant flow.
 */
export const AiConfigurationAssistantInputSchema = z.object({
  fullAgentConfig: z.custom<SavedAgentConfiguration>().describe("The full current configuration of the agent"),
  suggestionContext: z.union([
    z.enum([
      "agentName",
      "agentDescription",
      "goal",
      "tasks",
      "tools",
      "personality",
      "restrictions",
      "workflowType",
      "inconsistencyAlerts"
    ]),
    z.object({
      chatHistory: z.array(z.object({
        role: z.string(),
        content: z.string()
      })).optional(),
      userInput: z.string().optional()
    })
  ]).optional().describe("The specific context for which a suggestion is requested."),
});

// 2. Define Output Schema
/**
 * Represents a single suggested tool.
 */
export interface SuggestedToolSchema {
  /** The unique identifier of the suggested tool. */
  id: string;
  /** The name of the suggested tool. */
  name: string;
  /** A brief description of the suggested tool's function. */
  description: string;
  /** Optional name of an icon to represent the tool. */
  iconName?: string;
  /** Optional Genkit tool name, if applicable. */
  genkitToolName?: string;
}

/**
 * Defines the output structure for the AI Configuration Assistant flow.
 * Each field is optional and may be undefined if its specific suggestion part failed
 * or if no relevant suggestion could be made, allowing for partial results.
 */
export const AiConfigurationAssistantOutputSchema = z.object({
  suggestedTools: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    iconName: z.string().optional(),
    genkitToolName: z.string().optional(),
  })).optional().describe("A list of suggested tools."),
  suggestions: z.array(z.string()).optional().describe("A list of general textual suggestions."),
  // Example: If suggesting a name, it could be a direct string
  suggestedName: z.string().optional().describe("A suggested name for the agent."),
  suggestedDescription: z.string().optional().describe("A suggested description for the agent."),
  // Add other specific suggestion fields as needed based on context
  // For example, if context is 'tasks', this might be an array of task strings
  suggestedTasks: z.array(z.string()).optional().describe("A list of suggested tasks for the agent."),
  suggestedWorkflowType: z.custom<WorkflowDetailedType>().optional().describe("Suggested workflow type for a workflow agent."),
  inconsistencyAlerts: z.array(z.string()).optional().describe("Alerts about inconsistencies in the agent configuration."),
});


// Helper function to parse LLM responses, robustly handling potential JSON in markdown blocks
const parseLlmJsonResponse = (responseText: string, expectedKeys: string[]): any => {
  if (!responseText) {
    throw new Error("LLM returned an empty response.");
  }
  try {
    const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = match && match[1] ? match[1] : responseText;
    const parsed = JSON.parse(jsonString);

    // Basic validation for expected keys
    for (const key of expectedKeys) {
      if (!(key in parsed)) {
        console.warn(`Expected key "${key}" not found in LLM JSON response:`, parsed);
        // Depending on strictness, could throw an error here
      }
    }
    return parsed;
  } catch (e: any) {
    console.error("Failed to parse JSON response from LLM:", responseText, e);
    throw new Error(`Failed to parse suggestions from LLM. Raw response: ${responseText}. Error: ${e.message}`);
  }
};

// 3. Implement the Flow
export const aiConfigurationAssistantFlow = ai.defineFlow(
  {
    name: 'aiConfigurationAssistantFlow',
    inputSchema: AiConfigurationAssistantInputSchema,
    outputSchema: AiConfigurationAssistantOutputSchema,
    httpsCallable: true, // Assuming this flow might be called from a frontend
  },
  async (input: { fullAgentConfig: SavedAgentConfiguration | null | undefined; suggestionContext: string | undefined; }) => {
    // console.log('[aiConfigurationAssistantFlow] Received input:', JSON.stringify(input, null, 2));

    if (!input.fullAgentConfig) {
      console.warn("[aiConfigurationAssistantFlow] fullAgentConfig is undefined or null. Proceeding with caution or default behavior.");
    }
    
    // This inner helper function constructs the prompt based on the context.
    // It's defined inside the flow to have access to `input` and other flow-scoped variables if needed,
    // though in this version it primarily uses what's passed to it.
    const buildPromptForContext = (
      config: SavedAgentConfiguration | null | undefined, 
      context?: string, 
      availableTools?: AvailableTool[]
    ): string | null => {
      if (!config) return null; // Cannot build prompt without config

      let prompt = `You are an AI Configuration Assistant. Your goal is to help the user refine their AI agent's configuration. Current configuration snapshot:\n${JSON.stringify(config, null, 2)}\n\n`;
      
      const llmConfig = config.config as LLMAgentConfig;

      switch (context) {
        case "agentName":
          prompt += "Suggest a creative and descriptive name for this agent.";
          break;
        case "agentDescription":
          prompt += "Suggest a concise and informative description for this agent.";
          break;
        case "goal":
          if (config.config?.type === 'llm') {
            prompt += `The agent's current goal is: '${llmConfig.agentGoal}'. Suggest refinements or alternative goals.`;
          }
          break;
        case "tasks":
          if (config.config?.type === 'llm') {
            prompt += `Current tasks: ${llmConfig.agentTasks?.join(', ') || 'None'}. Suggest additional relevant tasks or improvements.`;
          }
          break;
        case "tools":
          const currentToolNames = config.tools?.join(', ') || 'None';
          const allAvailableToolsDesc = availableTools?.map(t => `${t.name} (ID: ${t.id}, Description: ${t.description})`).join('\n');
          prompt += `Current tools: ${currentToolNames}. Available tools:\n${allAvailableToolsDesc}\nSuggest relevant tools to add or if any current tools seem inappropriate, based on the agent's purpose.`;
          break;
        // Add more cases for other contexts like 'personality', 'restrictions', 'workflowType', 'inconsistencyAlerts'
        default:
          prompt += "Review the entire configuration for inconsistencies or areas of improvement and provide general suggestions.";
          return null; // Or a generic prompt if no specific context
      }
      prompt += "\nReturn your suggestions in a JSON format that aligns with the AiConfigurationAssistantOutputSchema.";
      return prompt;
    };

    try { // Main try block for LLM interaction and suggestions
      const promptForLLM = buildPromptForContext(input.fullAgentConfig, input.suggestionContext, allTools);

      if (!promptForLLM) {
        return {};
      }
      
      const llmResponse = await ai.generate({model: gemini10Pro, prompt: promptForLLM, config: {temperature: 0.7} });
      const responseText = llmResponse.text();

      if (!responseText) {
        console.warn("[aiConfigurationAssistantFlow] LLM returned an empty response for context:", input.suggestionContext);
        return {};
      }

      let parsedSuggestions;
      try {
        parsedSuggestions = JSON.parse(responseText); 
      } catch (parseError) {
        console.error("[aiConfigurationAssistantFlow] Failed to parse LLM response as JSON:", parseError, "\nRaw response:", responseText);
        return {};
      }

      const validatedOutput = AiConfigurationAssistantOutputSchema.safeParse(parsedSuggestions);

      if (validatedOutput.success) {
        return validatedOutput.data;
      } else {
        console.error("[aiConfigurationAssistantFlow] LLM output failed Zod validation:", validatedOutput.error.flatten());
        return {};
      }

    } catch (error: any) {
      console.error(`[aiConfigurationAssistantFlow] Error during suggestion generation for context "${input.suggestionContext}":`, error);
      return {};
    }
  }
);


// Example of how to run the flow (optional, for testing)
/*
async function testFlow() {
  // Mock SavedAgentConfiguration data for testing
  const mockFullAgentConfigLLM: SavedAgentConfiguration = {
    id: 'agent-123',
    agentName: 'Customer Support Bot',
    agentDescription: 'A bot to help with customer queries.',
    agentVersion: '1.0',
    config: {
      type: 'llm',
      framework: 'genkit',
      agentGoal: 'Resolve customer issues efficiently.',
      agentTasks: ['Answer FAQs', 'Troubleshoot common problems'],
      agentModel: 'gemini10Pro',
      agentTemperature: 0.7,
      agentPersonality: 'Friendly and helpful',
      agentRestrictions: ['Do not provide financial advice'],
    } as LLMAgentConfig,
    tools: ['webSearch', 'calculator'],
    toolsDetails: [
      { id: 'webSearch', name: 'Web Search', description: 'Searches the web.' },
      { id: 'calculator', name: 'Calculator', description: 'Performs calculations.' }
    ],
    toolConfigsApplied: {},
    a2aConfig: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTemplate: false,
    userId: 'user-test-123',
    // ... any other required fields
  };

  try {
    console.log('Testing LLM Agent Configuration Suggestions...');
    const resultLLM = await ai.runFlow(aiConfigurationAssistantFlow, {
      fullAgentConfig: mockFullAgentConfigLLM,
      suggestionContext: "tasks"
    });
    console.log('LLM Agent Flow Result:', JSON.stringify(resultLLM, null, 2));

  } catch (error) {
    console.error('Flow Error:', error);
  }
}
// testFlow();
*/

export const getWorkflowDetailedType = async (query: string): Promise<WorkflowDetailedType> => {
  const workflowDetailedTypePrompt = `Analyze the following user query to determine the most appropriate workflow type:

${query}

Workflow types:
1. sequential - Tasks must be completed in a strict order
2. parallel - Tasks can be completed simultaneously
3. conditional - Tasks depend on certain conditions

Respond ONLY with a valid JSON object with a single key "suggestedWorkflowType", whose value is one of the allowed types.
For example: {"suggestedWorkflowType": "sequential"}.`;

  try {
    const llmWorkflowResponse = await ai.generate({model: gemini10Pro, 
      prompt: workflowDetailedTypePrompt, 
      config: { temperature: 0.1 } 
    });
    const parsedWorkflowJson = parseLlmJsonResponse(llmWorkflowResponse.text(), ["suggestedWorkflowType"]);
    
    const workflowType = parsedWorkflowJson.suggestedWorkflowType;
    if (workflowType === "sequential" || workflowType === "parallel" || workflowType === "loop" || workflowType === "graph" || workflowType === "stateMachine") {
         return workflowType as WorkflowDetailedType;
    } else {
        console.warn(`LLM returned an unexpected workflow type: ${workflowType}. Defaulting to sequential.`);
        return "sequential" as WorkflowDetailedType;
    }

  } catch (error) {
    console.error("Error determining workflow type:", error);
    return "sequential" as WorkflowDetailedType;
  }
};