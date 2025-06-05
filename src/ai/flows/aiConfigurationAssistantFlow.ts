// Removed NextRequest as it's not used.
// import { NextRequest } from 'next/server';
import { ai } from '@/ai/genkit';
import { gemini10Pro } from '@genkit-ai/googleai';
import * as z from 'zod';
import { allTools } from '@/data/available-tools'; // Updated path
import { AvailableTool } from '@/types/tool-core'; // Updated path
import { SavedAgentConfiguration, LLMAgentConfig, WorkflowDetailedType } from '@/types/agent-core'; // Updated path

// 1. Define Input Schema
/**
 * Defines the input structure for the AI Configuration Assistant flow.
 * This schema is used to validate the input provided when calling the flow.
 */
export const AiConfigurationAssistantInputSchema = z.object({
  fullAgentConfig: z.custom<SavedAgentConfiguration>().optional().describe("The full current configuration of the agent, primarily for context or backward compatibility."),
  agentGoal: z.string().optional().describe("The primary goal of the AI agent."),
  agentTasks: z.array(z.string()).optional().describe("A list of tasks the AI agent is expected to perform."),
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
      "inconsistencyAlerts",
      "fullConfig"
    ]),
    z.object({ // For potential chat-based interaction context
      chatHistory: z.array(z.object({
        role: z.string(),
        content: z.string()
      })).optional(),
      userInput: z.string().optional()
    })
  ]).optional().describe("The specific context for which a suggestion is requested, or 'fullConfig' for new broad suggestions."),
  currentTools: z.array(z.object({ // Provides context about tools already selected/configured by the user
    id: z.string(),
    name: z.string(),
    description: z.string(),
    configData: z.any().optional() // Includes any existing configuration for these tools
  })).optional().describe("A list of currently selected tools by the user, including their existing configuration data if any.")
});

// 2. Define Output Schema
// This interface is not strictly necessary as Zod schema defines the shape, but can be useful for type hints.
// export interface SuggestedToolSchema { ... }

/**
 * Defines the output structure for the AI Configuration Assistant flow.
 * Each field is optional, allowing for partial results if a specific suggestion part fails
 * or if no relevant suggestion could be made.
 */
export const AiConfigurationAssistantOutputSchema = z.object({
  suggestedTools: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    iconName: z.string().optional(),
    genkitToolName: z.string().optional(),
    // This field allows the LLM to suggest initial configuration for a tool.
    suggestedConfigData: z.any().optional().describe("Suggested basic configuration data for this tool, conforming to the tool's expected ToolConfigData structure.")
  })).optional().describe("A list of suggested tools, potentially with configuration suggestions."),
  suggestions: z.array(z.string()).optional().describe("A list of general textual suggestions for improvements or considerations."),
  suggestedName: z.string().optional().describe("A suggested name for the agent."),
  suggestedDescription: z.string().optional().describe("A suggested description for the agent."),
  suggestedTasks: z.array(z.string()).optional().describe("A list of suggested tasks for the agent."),
  suggestedWorkflowType: z.custom<WorkflowDetailedType>().optional().describe("Suggested workflow type for a workflow agent."),
  inconsistencyAlerts: z.array(z.string()).optional().describe("Alerts about inconsistencies detected in the agent configuration."),
  // Fields primarily for 'fullConfig' suggestion context
  suggestedPersonality: z.string().optional().describe("Suggested personality for the agent."),
  suggestedRestrictions: z.array(z.string()).optional().describe("Suggested restrictions for the agent."),
  suggestedModel: z.string().optional().describe("Suggested AI model for the agent (e.g., gemini-1.5-pro-latest)."),
  suggestedTemperature: z.number().optional().describe("Suggested temperature for the AI model (e.g., 0.7)."),
});


/**
 * Parses LLM responses that are expected to be JSON, robustly handling
 * potential markdown code blocks (```json ... ```) around the JSON string.
 * @param responseText The raw text response from the LLM.
 * @param expectedKeys An array of keys that are expected to be present in the parsed JSON.
 *                     A warning is logged if any of these keys are missing.
 * @returns The parsed JSON object.
 * @throws Error if the responseText is empty or if parsing fails.
 */
const parseLlmJsonResponse = (responseText: string, expectedKeys: string[] = []): any => { // Added default for expectedKeys
  if (!responseText) {
    // TODO: Consider if this should return a structured error object or an empty object
    //       instead of throwing an error, depending on desired caller handling.
    throw new Error("LLM returned an empty response.");
  }
  try {
    // Attempt to extract JSON from markdown code block if present
    const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonString = match && match[1] ? match[1].trim() : responseText.trim(); // Ensure trimming

    if (!jsonString) { // Handle cases where only whitespace was in the markdown block or responseText
        throw new Error("Extracted JSON string is empty.");
    }
    const parsed = JSON.parse(jsonString);

    // Validate presence of expected keys (optional, for basic sanity check)
    for (const key of expectedKeys) {
      if (!(key in parsed)) {
        console.warn(`[parseLlmJsonResponse] Expected key "${key}" not found in LLM JSON response:`, parsed);
        // Depending on strictness, could throw an error here or return a partial result.
      }
    }
    return parsed;
  } catch (e: any) {
    console.error("[parseLlmJsonResponse] Failed to parse JSON response from LLM. Raw response:", responseText, "Error:", e);
    // TODO: Decide on a more structured error propagation strategy.
    //       For now, re-throwing to be caught by the main flow's error handler.
    throw new Error(`Failed to parse suggestions from LLM. Raw response snippet: ${responseText.substring(0,100)}. Error: ${e.message}`);
  }
};

// 3. Implement the Flow
/**
 * AI-powered flow to assist with agent configuration.
 * It generates suggestions for various aspects of agent configuration based on user input
 * (like agent goal, tasks) and the specified suggestion context.
 */
export const aiConfigurationAssistantFlow = ai.defineFlow(
  {
    name: 'aiConfigurationAssistantFlow',
    inputSchema: AiConfigurationAssistantInputSchema,
    outputSchema: AiConfigurationAssistantOutputSchema,
    httpsCallable: true, // Exposes this flow as an HTTP callable function
  },
  async (input: z.infer<typeof AiConfigurationAssistantInputSchema>) => {
    // Destructure input for easier access
    const { fullAgentConfig, agentGoal, agentTasks, suggestionContext, currentTools } = input;

    // Basic input validation for certain contexts (can be expanded)
    // For 'fullConfig', goal and tasks are primary drivers if no fullAgentConfig is given.
    if (!fullAgentConfig && (!agentGoal || !agentTasks || agentTasks.length === 0) && suggestionContext === 'fullConfig') {
      console.warn("[aiConfigurationAssistantFlow] Insufficient input for 'fullConfig' context. Requires agentGoal and agentTasks if fullAgentConfig is not provided.");
      // Return an empty object conforming to the schema, as per Zod's strictness.
      // This indicates no suggestions could be made due to missing prerequisites.
      return AiConfigurationAssistantOutputSchema.parse({});
    }
    
    /**
     * Builds the prompt string for the LLM based on the suggestion context and other inputs.
     * @param currentConfig The existing agent configuration, if available.
     * @param context The specific part of the configuration for which suggestions are requested.
     * @param goal The agent's primary goal.
     * @param tasks A list of tasks the agent is expected to perform.
     * @param availableToolsList A list of all tools available for the agent.
     * @param currentToolsParam Tools currently selected/configured by the user.
     * @returns A string prompt for the LLM, or null if a prompt cannot be built.
     */
    const buildPromptForContext = (
      currentConfig: SavedAgentConfiguration | null | undefined,
      context: typeof suggestionContext,
      goal?: string,
      tasks?: string[],
      availableToolsList?: AvailableTool[],
      currentToolsParam?: typeof currentTools
    ): string | null => {
      let prompt = `You are an AI Configuration Assistant. Your goal is to help the user configure an AI agent.`;

      // --- 'fullConfig' Context ---
      // This context is used to get a broad set of suggestions for a new agent
      // or a major reconfiguration based on its goal and tasks.
      if (context === 'fullConfig' && goal && tasks && tasks.length > 0) {
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
  - For each tool you suggest, if it has configuration options defined in its \`configFields\` (provided in the 'Available tools' list below), also provide a \`suggestedConfigData\` object.
  - This object should contain sensible defaults or placeholders for the tool's configuration.
  - For example, for a Google Search tool requiring a \`googleCseId\`, you might suggest \`{"googleCseId": "YOUR_CSE_ID_HERE"}\`.
  - For a custom API tool, suggest an initial JSON structure for its API specification based on its description and expected inputs/outputs.

Available tools (with their ID, Name, Description, and ConfigFields):
${availableToolsList?.map(t => `${t.name} (ID: ${t.id}, Description: ${t.description}, GenkitToolName: ${t.genkitToolName || 'N/A'}, ConfigFields: ${t.configFields ? JSON.stringify(t.configFields) : 'None'})`).join('\n') || 'No tools available.'}
`;
        // Information about currently selected tools, if any, to avoid redundant suggestions
        // or to suggest configuration changes for them.
        if (currentToolsParam && currentToolsParam.length > 0) {
          prompt += `
The user has already selected and potentially configured the following tools:
${currentToolsParam.map(t => `- ID: ${t.id}, Name: ${t.name}, Description: ${t.description}${t.configData ? `, Current Configuration: ${JSON.stringify(t.configData)}` : ''}`).join('\n')}
Please consider these existing tools. Avoid suggesting them again unless you are proposing a change to their configuration based on the agent's goal.
`;
        }

        prompt += `
Please provide your suggestions in a single JSON object format that strictly matches the following fields from AiConfigurationAssistantOutputSchema: "suggestedPersonality", "suggestedRestrictions", "suggestedModel", "suggestedTemperature", "suggestedTools".
Example JSON output:
{
  "suggestedPersonality": "Helpful and efficient assistant",
  "suggestedRestrictions": ["Avoid giving financial advice", "Stick to the defined tasks"],
  "suggestedModel": "gemini-1.5-pro-latest",
  "suggestedTemperature": 0.5,
  "suggestedTools": [{ "id": "webSearch", "name": "Web Search", "description": "Searches the web for information.", "suggestedConfigData": {"apiKeyName": "YOUR_SEARCH_API_KEY"} }]
}`;
        return prompt;
      }
      
      // --- Contexts requiring an existing configuration snapshot ---
      // For contexts other than 'fullConfig' (when goal/tasks are primary),
      // or if 'fullConfig' is requested but without goal/tasks (implying refinement of existing config),
      // a currentConfig snapshot is generally expected.
      if (!currentConfig) {
        console.warn(`[aiConfigurationAssistantFlow.buildPromptForContext] currentConfig is required for context '${typeof context === 'string' ? context : JSON.stringify(context)}' but was not provided.`);
        return null; // Cannot build prompt without configuration context for these cases.
      }

      prompt += ` Current configuration snapshot:\n${JSON.stringify(currentConfig, null, 2)}\n\n`;
      const llmConfig = currentConfig.config as LLMAgentConfig | undefined; // Type assertion

      switch (context) {
        case "agentName":
          prompt += "Suggest a creative and descriptive name for this agent.";
          break;
        case "agentDescription":
          prompt += "Suggest a concise and informative description for this agent.";
          break;
        case "goal":
          if (llmConfig && 'agentGoal' in llmConfig && llmConfig.agentGoal) {
            prompt += `The agent's current goal is: '${llmConfig.agentGoal}'. Suggest refinements or alternative goals.`;
          } else if (goal) { // Fallback if llmConfig not present but goal provided from input
             prompt += `The user is defining an agent with the goal: '${goal}'. Suggest refinements or alternative goals if appropriate, or confirm if it's well-defined.`;
          } else {
            prompt += "Suggest a primary goal for an AI agent based on its current configuration.";
          }
          break;
        case "tasks":
          if (llmConfig && 'agentTasks' in llmConfig && llmConfig.agentTasks) {
            prompt += `Current tasks: ${Array.isArray(llmConfig.agentTasks) ? llmConfig.agentTasks.join(', ') : 'None'}. Suggest additional relevant tasks or improvements.`;
          } else if (tasks && Array.isArray(tasks) && tasks.length > 0) { // Fallback
            prompt += `The user has defined these tasks: ${tasks.join(', ')}. Suggest additional relevant tasks or improvements based on the current configuration.`;
          } else {
            prompt += "Suggest a list of tasks for an AI agent, based on its current configuration and goal.";
          }
          break;
        // --- 'tools' Context ---
        // This context focuses on suggesting tools to add or modify, including their configuration.
        case "tools":
          const currentToolNames = (currentConfig as any).tools?.map((tool: any) => tool.name).join(', ') || 'None';
          // Provide details of all available tools, including their configFields, to the LLM.
          const allAvailableToolsDesc = availableToolsList?.map((t: any) =>
            `${t.name} (ID: ${t.id}, Description: ${t.description}, ConfigFields: ${t.configFields ? JSON.stringify(t.configFields) : 'None'})`
          ).join('\n');
          prompt += `Available tools (with ID, Name, Description, and ConfigFields):\n${allAvailableToolsDesc || 'No tools available.'}\n`;

          prompt += `
Based on the agent's current configuration and goal, suggest relevant tools to add.
If any current tools seem inappropriate, you can suggest removing them (though the output format focuses on additions).
For each tool you suggest:
  - Provide its 'id', 'name', and 'description'.
  - If the tool has configurable fields (indicated in \`ConfigFields\` from the 'Available tools' list), also provide a \`suggestedConfigData\` object.
  - This object should contain sensible default values or placeholders for these fields. For example, if a tool needs an API key, suggest \`{"apiKeyName": "YOUR_API_KEY_NAME"}\`.
`;
          // If the user has already selected some tools, list them so the LLM can consider them.
          // This helps avoid redundant suggestions or allows suggesting modifications to existing tool configs.
          if (currentToolsParam && currentToolsParam.length > 0) {
            prompt += `
The user has already selected and potentially configured the following tools:
${currentToolsParam.map(t => `- ID: ${t.id}, Name: ${t.name}, Description: ${t.description}${t.configData ? `, Current Configuration: ${JSON.stringify(t.configData)}` : ''}`).join('\n')}
Please consider these existing tools. Avoid suggesting tools that are already present unless you are suggesting a change or addition to their \`suggestedConfigData\`.
`;
          } else {
            prompt += `Current tools based on full configuration: ${currentToolNames}. Suggest relevant tools to add, or if any current tools seem inappropriate, based on the agent's purpose. Provide \`suggestedConfigData\` for tools that have configurable fields.`;
          }
          // Specify the expected JSON output format for tool suggestions.
          prompt += `\nReturn your suggestions in a JSON format. The primary key should be 'suggestedTools', containing an array of tool objects. Each tool object must include 'id', 'name', 'description', and optionally 'suggestedConfigData' if applicable.`;
          return prompt; // Return early for 'tools' context as the prompt is now complete.

        // TODO: Add detailed prompt logic for other specific contexts like 'personality', 'restrictions', 'workflowType', 'inconsistencyAlerts'
        // For now, they fall into the default case.

        default:
          // Handles generic review or chat-based suggestions
          if (typeof context === 'object' && context !== null) { // Chat history context
            // TODO: Implement more specific prompt engineering for chat history context
            prompt += "Based on the ongoing conversation (chat history and user input provided in the input object), provide relevant suggestions for the agent's configuration.";
          } else { // Generic review of the full configuration
            prompt += "Review the entire configuration provided for inconsistencies, areas of improvement, or missing critical components, and provide general suggestions.";
          }
          prompt += `\nReturn your suggestions in a JSON format, aligning with the AiConfigurationAssistantOutputSchema. For example, if suggesting a name, use 'suggestedName'; for tasks, use 'suggestedTasks'. If suggesting tools, use 'suggestedTools' with each tool object containing 'id', 'name', 'description', and optionally 'suggestedConfigData'.`;
          return prompt;
      }
      // For contexts that fall through the switch (e.g., agentName, agentDescription, goal, tasks after specific handling)
      prompt += `\nReturn your suggestions in a JSON format that aligns with the AiConfigurationAssistantOutputSchema for the specific context (e.g., for 'agentName', the output should be \`{"suggestedName": "New Agent Name"}\`).`;
      return prompt;
    };

    // --- Main Flow Logic ---
    // 1. Build the prompt for the LLM based on the input and context.
    const promptForLLM = buildPromptForContext(fullAgentConfig, suggestionContext, agentGoal, agentTasks, allTools, currentTools);

    if (!promptForLLM) {
      console.warn("[aiConfigurationAssistantFlow] Could not build prompt for LLM with the given input and context. Returning empty suggestions.");
      return AiConfigurationAssistantOutputSchema.parse({}); // Ensure a valid empty output
    }

    // console.log("[aiConfigurationAssistantFlow] Generated prompt for LLM:", promptForLLM);

    // 2. Call the LLM (Gemini 1.0 Pro in this case) with the generated prompt.
    const llmResponse = await ai.generate({model: gemini10Pro, prompt: promptForLLM, config: {temperature: 0.7} });
    const responseText = llmResponse.text();

    if (!responseText) {
      console.warn("[aiConfigurationAssistantFlow] LLM returned an empty response for context:", suggestionContext);
      return AiConfigurationAssistantOutputSchema.parse({});
    }

    // console.log("[aiConfigurationAssistantFlow] LLM raw response text:", responseText);

    // 3. Parse the LLM's JSON response.
    // The response is expected to be a JSON object (potentially within a markdown block).
    let parsedSuggestions;
    try {
      // Using the robust parseLlmJsonResponse helper.
      // No specific expectedKeys are passed here for 'fullConfig' or general contexts,
      // as Zod validation will handle the structure comprehensively.
      // For more specific contexts, expectedKeys could be used if stricter pre-validation is desired.
      parsedSuggestions = parseLlmJsonResponse(responseText);
    } catch (parseError: any) {
      console.error("[aiConfigurationAssistantFlow] Failed to parse LLM response:", parseError.message);
      // TODO: Consider returning a structured error in the output schema, e.g., an error field.
      // For now, returning empty valid output.
      return AiConfigurationAssistantOutputSchema.parse({});
    }

    // console.log("[aiConfigurationAssistantFlow] Parsed LLM response:", parsedSuggestions);

    // 4. Validate the parsed suggestions against the output schema.
    // This ensures the LLM's output conforms to the expected structure.
    const validatedOutput = AiConfigurationAssistantOutputSchema.safeParse(parsedSuggestions);

    if (validatedOutput.success) {
      // console.log("[aiConfigurationAssistantFlow] Validation successful. Returning data:", validatedOutput.data);
      return validatedOutput.data; // Return the validated suggestions
    } else {
      console.error("[aiConfigurationAssistantFlow] LLM output failed Zod validation:", validatedOutput.error.flatten());
      // console.log("[aiConfigurationAssistantFlow] Invalid data received from LLM:", parsedSuggestions);
      // TODO: Implement more sophisticated error reporting or fallback strategies.
      return AiConfigurationAssistantOutputSchema.parse({}); // Return empty, valid output on validation failure
    }

  }
);


// Example of how to run the flow (optional, for testing or direct invocation if needed)
/*
async function testFlow() {
  const mockFullAgentConfigLLM: SavedAgentConfiguration = {
    // ... (mock configuration) ...
  };

  try {
    console.log('Testing AI Configuration Assistant Flow...');
    const result = await ai.runFlow(aiConfigurationAssistantFlow, {
      // fullAgentConfig: mockFullAgentConfigLLM, // Example with full config
      agentGoal: "Create a research assistant for quantum physics",
      agentTasks: ["Search for recent papers", "Summarize key findings", "Explain complex concepts simply"],
      suggestionContext: "fullConfig", // Requesting a full set of suggestions
      currentTools: [{id: "webSearch", name: "Web Search", description: "Searches the web"}] // Example of a pre-selected tool
    });
    console.log('AI Configuration Assistant Flow Result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Flow Test Error:', error);

/**
 * Determines the workflow type based on a user query using an LLM call.
 * @param query The user's query describing the desired workflow.
 * @returns A promise that resolves to a WorkflowDetailedType.
 */
export const getWorkflowDetailedType = async (query: string): Promise<WorkflowDetailedType> => {
  const workflowDetailedTypePrompt = `Analyze the following user query to determine the most appropriate workflow type.
The goal is to categorize the workflow based on the main purpose of the agent.

User Query: "${query}"

Consider the following workflow types:
1. conversational: For chatbots and conversation-based interactions
2. data_processing: For transforming or analyzing data
3. decision_making: For making decisions based on input data
4. information_retrieval: For searching and retrieving information
5. content_generation: For creating new content
6. task_automation: For automating repetitive tasks
7. analytical: For data analysis and insights
8. creative: For creative tasks like writing or art
9. educational: For teaching or explaining concepts
10. entertainment: For games or entertainment purposes
11. customer_support: For assisting customers
12. research_assistant: For helping with research
13. code_assistant: For helping with programming tasks
14. personal_assistant: For personal organization and assistance

Based on the query, respond ONLY with a valid JSON object containing a single key "suggestedWorkflowType".
The value for this key must be one of the valid workflow types mentioned above.

Example for a conversational agent:
User Query: "I need a chatbot to answer customer questions"
{"suggestedWorkflowType": "conversational"}

Example for a data processing agent:
User Query: "Process and analyze sales data from multiple sources"
{"suggestedWorkflowType": "data_processing"}

Example for a content generation agent:
User Query: "Create blog posts about technology trends"
{"suggestedWorkflowType": "content_generation"}
`;

  try {
    const llmWorkflowResponse = await ai.generate({
      model: gemini10Pro,
      prompt: workflowDetailedTypePrompt, 
      config: { temperature: 0.1 } // Low temperature for more deterministic categorization
    });

    // Using parseLlmJsonResponse for robust parsing
    const parsedWorkflowJson = parseLlmJsonResponse(llmWorkflowResponse.text(), ["suggestedWorkflowType"]);
    
    const workflowType = parsedWorkflowJson.suggestedWorkflowType;

    // Valores válidos de WorkflowDetailedType conforme tipos centralizados
    const allowedTypes: WorkflowDetailedType[] = [
      'sequential', 'parallel', 'loop', 'graph', 'stateMachine'
    ];
    
    if (allowedTypes.includes(workflowType)) {
      return workflowType as WorkflowDetailedType;
    } else {
      console.warn(`[getWorkflowDetailedType] LLM returned an unexpected workflow type: '${workflowType}'. Defaulting to 'sequential'. Query was: "${query}"`);
      return 'sequential'; // Default to 'sequential' if the response is not one of the allowed types
    }

  } catch (error) {
    console.error(`[getWorkflowDetailedType] Error determining workflow type for query "${query}":`, error);
    return 'sequential'; // Default to 'sequential' on error
  }
};