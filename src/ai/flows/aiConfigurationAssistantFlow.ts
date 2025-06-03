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
  fullAgentConfig: z.custom<SavedAgentConfiguration>().optional().describe("The full current configuration of the agent, primarily for context or backward compatibility."),
  agentGoal: z.string().optional().describe("The primary goal of the AI agent."),
  agentTasks: z.array(z.string()).optional().describe("A list of tasks the AI agent is expected to perform."),
  suggestionContext: z.union([
    z.enum([
      "agentName",
      "agentDescription",
      "goal", // Kept for specific goal refinement if needed
      "tasks", // Kept for specific task refinement if needed
      "tools", // Kept for specific tool refinement if needed
      "personality", // Kept for specific personality refinement if needed
      "restrictions", // Kept for specific restriction refinement if needed
      "workflowType",
      "inconsistencyAlerts",
      "fullConfig" // New context for overall configuration suggestions
    ]),
    z.object({
      chatHistory: z.array(z.object({
        role: z.string(),
        content: z.string()
      })).optional(),
      userInput: z.string().optional()
    })
  ]).optional().describe("The specific context for which a suggestion is requested, or 'fullConfig' for new broad suggestions."),
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
  // New fields for 'fullConfig' suggestions
  suggestedPersonality: z.string().optional().describe("Suggested personality for the agent."),
  suggestedRestrictions: z.array(z.string()).optional().describe("Suggested restrictions for the agent."),
  suggestedModel: z.string().optional().describe("Suggested AI model for the agent."),
  suggestedTemperature: z.number().optional().describe("Suggested temperature for the AI model."),
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
  async (input: z.infer<typeof AiConfigurationAssistantInputSchema>) => {
    const { fullAgentConfig, agentGoal, agentTasks, suggestionContext } = input;

    // console.log('[aiConfigurationAssistantFlow] Received input:', JSON.stringify(input, null, 2));

    if (!fullAgentConfig && (!agentGoal || !agentTasks) && suggestionContext !== 'fullConfig') {
      console.warn("[aiConfigurationAssistantFlow] Insufficient input provided. Need either fullAgentConfig or (agentGoal and agentTasks for 'fullConfig' context).");
      // return {}; // Early exit if not enough info for any known context
    }
    
    const buildPromptForContext = (
      currentConfig: SavedAgentConfiguration | null | undefined,
      context: typeof suggestionContext,
      goal?: string,
      tasks?: string[],
      availableToolsList?: AvailableTool[]
    ): string | null => {
      let prompt = `You are an AI Configuration Assistant. Your goal is to help the user configure an AI agent.`;

      if (context === 'fullConfig' && goal && tasks) {
        prompt += `
The user wants to create an agent with the following goal and tasks:
Goal: "${goal}"
Tasks:
${tasks.map(t => `- ${t}`).join('\n')}

Based on this, please suggest the following configuration aspects:
- agentPersonality: A suitable personality for the agent.
- agentRestrictions: Any important restrictions or ethical considerations.
- agentModel: A recommended AI model (e.g., gemini-1.5-pro-latest, gpt-4-turbo).
- agentTemperature: A suitable temperature for the model (e.g., 0.7).
- agentTools: A list of relevant tools from the provided list that would help the agent achieve its goal and tasks.

Available tools:
${availableToolsList?.map(t => `${t.name} (ID: ${t.id}, Description: ${t.description}, GenkitToolName: ${t.genkitToolName || 'N/A'})`).join('\n') || 'No tools available.'}

Please provide your suggestions in a JSON object format that strictly matches the following fields from AiConfigurationAssistantOutputSchema: "suggestedPersonality", "suggestedRestrictions", "suggestedModel", "suggestedTemperature", "suggestedTools".
Example JSON output:
{
  "suggestedPersonality": "Helpful and efficient assistant",
  "suggestedRestrictions": ["Avoid giving financial advice", "Stick to the defined tasks"],
  "suggestedModel": "gemini-1.5-pro-latest",
  "suggestedTemperature": 0.5,
  "suggestedTools": [{ "id": "webSearch", "name": "Web Search", "description": "Searches the web for information." }]
}`;
        return prompt;
      }
      
      // Fallback to existing logic if not 'fullConfig' or if goal/tasks are missing for 'fullConfig'
      if (!currentConfig) {
        console.warn("[aiConfigurationAssistantFlow.buildPromptForContext] currentConfig is undefined or null, and not in 'fullConfig' mode with goal/tasks. Cannot build prompt.");
        return null;
      }

      prompt += ` Current configuration snapshot:\n${JSON.stringify(currentConfig, null, 2)}\n\n`;
      const llmConfig = currentConfig.config as LLMAgentConfig;

      switch (context) {
        case "agentName":
          prompt += "Suggest a creative and descriptive name for this agent.";
          break;
        case "agentDescription":
          prompt += "Suggest a concise and informative description for this agent.";
          break;
        case "goal":
          if (currentConfig.config?.type === 'llm') {
            prompt += `The agent's current goal is: '${llmConfig.agentGoal}'. Suggest refinements or alternative goals.`;
          }
          break;
        case "tasks":
          if (currentConfig.config?.type === 'llm') {
            prompt += `Current tasks: ${llmConfig.agentTasks?.join(', ') || 'None'}. Suggest additional relevant tasks or improvements.`;
          }
          break;
        case "tools":
          const currentToolNames = currentConfig.tools?.join(', ') || 'None';
          const allAvailableToolsDesc = availableToolsList?.map(t => `${t.name} (ID: ${t.id}, Description: ${t.description})`).join('\n');
          prompt += `Current tools: ${currentToolNames}. Available tools:\n${allAvailableToolsDesc}\nSuggest relevant tools to add or if any current tools seem inappropriate, based on the agent's purpose.`;
          break;
        // Add more cases for other contexts like 'personality', 'restrictions', 'workflowType', 'inconsistencyAlerts'
        default:
          // Check if context is an object (for chatHistory/userInput)
          if (typeof context === 'object' && context !== null) {
            // Handle chat history based suggestions if implemented
            prompt += "Based on the ongoing conversation, provide relevant suggestions for the agent's configuration.";
          } else {
            prompt += "Review the entire configuration for inconsistencies or areas of improvement and provide general suggestions.";
          }
          // For non-'fullConfig' contexts, or if it's a generic review, specify which parts of output schema are relevant.
          // This part might need refinement based on how granular the old contexts are expected to be.
          prompt += "\nReturn your suggestions in a JSON format. If suggesting tools, use the 'suggestedTools' key. For a name, use 'suggestedName', etc., aligning with AiConfigurationAssistantOutputSchema.";
          return prompt;
      }
      prompt += "\nReturn your suggestions in a JSON format that aligns with the AiConfigurationAssistantOutputSchema for the specific context (e.g., suggestedName, suggestedTasks).";
      return prompt;
    };

    try { // Main try block for LLM interaction and suggestions
      const promptForLLM = buildPromptForContext(fullAgentConfig, suggestionContext, agentGoal, agentTasks, allTools);

      if (!promptForLLM) {
        console.warn("[aiConfigurationAssistantFlow] Could not build prompt for LLM with the given input and context.");
        // Consider returning a specific error structure or an empty object based on desired client handling
        return AiConfigurationAssistantOutputSchema.parse({}); // Return empty object that conforms to schema
      }
      
      // console.log("[aiConfigurationAssistantFlow] Generated prompt for LLM:", promptForLLM);

      const llmResponse = await ai.generate({model: gemini10Pro, prompt: promptForLLM, config: {temperature: 0.7} });
      const responseText = llmResponse.text();

      if (!responseText) {
        console.warn("[aiConfigurationAssistantFlow] LLM returned an empty response for context:", suggestionContext);
        return AiConfigurationAssistantOutputSchema.parse({});
      }

      // console.log("[aiConfigurationAssistantFlow] LLM raw response text:", responseText);

      // Using the existing parseLlmJsonResponse which handles markdown ```json ... ``` blocks
      // For 'fullConfig', we don't need to pass specific expectedKeys, as Zod will validate all fields.
      // For older contexts, expectedKeys might still be relevant if we had stricter per-context parsing.
      // However, relying on Zod validation for the entire output is generally more robust.
      let parsedSuggestions;
      try {
        // parseLlmJsonResponse can be used, or direct parsing if confident about LLM output format
        // For 'fullConfig', the prompt asks for JSON, so direct parsing with fallback to the helper is fine.
        const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonString = match && match[1] ? match[1] : responseText;
        parsedSuggestions = JSON.parse(jsonString);
      } catch (parseError: any) {
        console.error("[aiConfigurationAssistantFlow] Failed to parse LLM response as JSON:", parseError.message, "\nRaw response:", responseText);
        // Attempt to use the robust parser as a fallback if direct parse fails
        try {
          parsedSuggestions = parseLlmJsonResponse(responseText, []); // No specific keys expected here, Zod handles it
        } catch (robustParseError: any) {
          console.error("[aiConfigurationAssistantFlow] Robust parseLlmJsonResponse also failed:", robustParseError.message);
          return AiConfigurationAssistantOutputSchema.parse({}); // Return empty, valid output
        }
      }

      // console.log("[aiConfigurationAssistantFlow] Parsed LLM response:", parsedSuggestions);

      const validatedOutput = AiConfigurationAssistantOutputSchema.safeParse(parsedSuggestions);

      if (validatedOutput.success) {
        // console.log("[aiConfigurationAssistantFlow] Validation successful. Returning data:", validatedOutput.data);
        return validatedOutput.data;
      } else {
        console.error("[aiConfigurationAssistantFlow] LLM output failed Zod validation:", validatedOutput.error.flatten());
        // console.log("[aiConfigurationAssistantFlow] Invalid data was:", parsedSuggestions);
        // Consider what to return in case of validation failure.
        // Returning an empty object that conforms to the schema might be safest.
        return AiConfigurationAssistantOutputSchema.parse({});
      }

    } catch (error: any) {
      console.error(`[aiConfigurationAssistantFlow] Error during suggestion generation for context "${suggestionContext}":`, error.message, error.stack);
      return AiConfigurationAssistantOutputSchema.parse({}); // Ensure a valid empty output on error
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