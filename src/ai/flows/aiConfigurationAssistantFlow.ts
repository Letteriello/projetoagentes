import { defineFlow } from '@genkit-ai/flow';
import { gemini15Pro } from '@genkit-ai/googleai';
import * as z from 'zod';
import { generate } from '@genkit-ai/ai';
import { allTools } from '@/data/agent-builder/available-tools';
import { AvailableTool } from '@/types/tool-types'; // Corrected import path for AvailableTool
import { SavedAgentConfiguration, AgentConfig, LLMAgentConfig, WorkflowAgentConfig, WorkflowDetailedType as WorkflowType } from '@/types/agent-configs';

// 1. Define Input Schema
/**
 * Defines the input structure for the AI Configuration Assistant flow.
 */
export const AiConfigurationAssistantInputSchema = z.object({
  fullAgentConfig: z.custom<SavedAgentConfiguration>().describe("The full current configuration of the agent"),
  suggestionContext: z.enum([
    "agentName",
    "agentDescription",
    "goal",
    "tasks",
    "tools",
    "personality",
    "restrictions",
    "workflowType",
    "inconsistencyAlerts"
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
  suggestions: z.array(z.string()).optional().describe("A list of general string suggestions."),
  systemPrompt: z.string().optional().describe("A suggested system prompt for LLM agents."),
  inconsistencyAlerts: z.array(z.string()).optional().describe("Alerts for detected inconsistencies in the configuration."),
});


// 3. Define the Flow Logic
export const aiConfigurationAssistantFlow = defineFlow(
  {
    name: 'aiConfigurationAssistantFlow',
    inputSchema: AiConfigurationAssistantInputSchema,
    outputSchema: AiConfigurationAssistantOutputSchema,
    // TODO: Add appropriate middleware if needed, e.g., for auth or logging
    // middleware: [someAuthMiddleware, someLoggingMiddleware], 
  },
  async (input) => {
    const { fullAgentConfig, suggestionContext } = input;
    console.log('aiConfigurationAssistantFlow received input for fullAgentConfig:', fullAgentConfig, 'and suggestionContext:', suggestionContext);

    // Minimal valid return based on schema to isolate parsing/syntax errors
    // All complex logic is temporarily removed.
    return {
      suggestions: [],
      suggestedTools: [],
      systemPrompt: undefined,
      inconsistencyAlerts: [],
    };
  }
);

// Helper function to safely parse LLM JSON output (remains for future use)
const parseLlmJsonResponse = (jsonString: string | null | undefined, expectedKeys: string[]): any => {
  if (!jsonString) return {};
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed === 'object' && parsed !== null && expectedKeys.every(key => key in parsed)) {
      return parsed;
    }
    console.warn("LLM JSON response did not contain all expected keys or was not an object. Expected:", expectedKeys, "Got:", jsonString);
    return {};
  } catch (e) {
    console.error("Error parsing LLM JSON response:", e, "Original string:", jsonString);
    return {};
  }
};


// Example of how to run the flow (remains for future use)
/*
import { runFlow } from '@genkit-ai/flow';
import { initializeGenkit } from '@/ai/genkit'; // Assuming genkit initialization is handled elsewhere

async function testFlow() {
  // initializeGenkit(); // Call this if Genkit is not initialized globally
  try {
    const mockFullAgentConfigLLM: SavedAgentConfiguration = {
      id: 'agent-123',
      agentName: 'Blog Writer',
      agentDescription: 'Helps write blog posts',
      agentType: 'llm',
      config: {
        type: 'llm',
        agentGoal: 'To assist users in creating engaging blog content.',
        agentTasks: ['Suggest titles', 'Generate outlines', 'Draft paragraphs'],
        agentPersonality: 'Creative and helpful',
        agentRestrictions: ['Avoid controversial topics'],
        modelProvider: 'googleai',
        modelName: 'gemini-1.5-pro-latest',
        temperature: 0.7,
        topP: 1,
        maxOutputTokens: 2048,
      },
      tools: [{ id: 'webSearch', name: 'Web Search', description: 'Searches the web' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const resultLLM = await runFlow(aiConfigurationAssistantFlow, {
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

// This function seems unrelated to the main flow but was present in the original file.
// Keeping it for now, but ensure it's correctly typed and used if needed.
export const getWorkflowType = async (query: string): Promise<WorkflowType> => {
  const workflowTypePrompt = `Analyze the following user query to determine the most appropriate workflow type:

${query}

Workflow types:
1. sequential - Tasks must be completed in a strict order
2. parallel - Tasks can be completed simultaneously
3. conditional - Tasks depend on certain conditions

Respond ONLY with a valid JSON object with a single key "suggestedWorkflowType", whose value is one of the allowed types.
For example: {"suggestedWorkflowType": "sequential"}.`;

  try {
    // Ensure generate is correctly called: model first, then options object
    const llmWorkflowResponse = await generate(gemini15Pro, { 
      prompt: workflowTypePrompt, 
      config: { temperature: 0.1 } 
    });
    // Ensure .text is used as a property, not a method
    const parsedWorkflowJson = parseLlmJsonResponse(llmWorkflowResponse.text, ["suggestedWorkflowType"]);
    
    // Validate the output against expected WorkflowType values
    const workflowType = parsedWorkflowJson.suggestedWorkflowType;
    if (workflowType === "sequential" || workflowType === "parallel" || workflowType === "loop" || workflowType === "graph" || workflowType === "stateMachine") {
         return workflowType as WorkflowType;
    } else {
        console.warn(`LLM returned an unexpected workflow type: ${workflowType}. Defaulting to sequential.`);
        return "sequential"; // Default fallback
    }

  } catch (error) {
    console.error("Error determining workflow type:", error);
    return "sequential"; // Default fallback
  }
};