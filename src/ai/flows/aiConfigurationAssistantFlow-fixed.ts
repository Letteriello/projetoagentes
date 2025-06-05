import { NextRequest } from 'next/server';
import { ai } from '@/ai/genkit';
import { gemini10Pro } from '@genkit-ai/googleai';
import * as z from 'zod';
import { ActionContext } from 'genkit';
import { allTools } from '@/data/agent-builder/available-tools';
import { AvailableTool } from '@/types/tool-types';
import { 
  SavedAgentConfiguration, 
  AgentConfig, 
  LLMAgentConfig, 
  WorkflowAgentConfig,
  WorkflowDetailedType 
} from '@/types/agent-configs-fixed';

// 1. Define Input Schema
/**
 * Defines the input structure for the AI Configuration Assistant flow.
 */
export const AiConfigurationAssistantInputSchema = z.object({
  fullAgentConfig: z.custom<SavedAgentConfiguration>().describe("The full current configuration of the agent"),
  suggestionContext: z.union([
    z.literal("initial"),
    z.literal("after-goal"),
    z.literal("after-tasks"),
    z.literal("after-tools"),
    z.literal("after-workflow"),
    z.literal("complete")
  ]).describe("The current context of the suggestion"),
  userPreferences: z.object({
    style: z.enum(["concise", "detailed", "technical"]).optional(),
    experienceLevel: z.enum(["beginner", "intermediate", "expert"]).optional()
  }).optional()
}).describe("Input for the AI Configuration Assistant");

// 2. Define Output Schema and Types
/**
 * Represents a single suggested tool.
 */
export const SuggestedToolSchema = z.object({
  id: z.string().describe("Unique identifier for the tool"),
  name: z.string().describe("Name of the tool"),
  description: z.string().describe("Brief description of what the tool does"),
  iconName: z.string().optional().describe("Optional icon name for UI representation"),
  genkitToolName: z.string().optional().describe("Corresponding Genkit tool name if applicable")
});

type SuggestedTool = z.infer<typeof SuggestedToolSchema>;

/**
 * Defines the output structure for the AI Configuration Assistant flow.
 * Each field is optional and may be undefined if its specific suggestion part failed
 * or if no relevant suggestion could be made, allowing for partial results.
 */
export const AiConfigurationAssistantOutputSchema = z.object({
  suggestedAgentName: z.string().optional().describe("Suggested name for the agent"),
  suggestedAgentDescription: z.string().optional().describe("Suggested description for the agent"),
  suggestedTasks: z.array(z.string()).optional().describe("Suggested tasks for the agent"),
  suggestedTools: z.array(SuggestedToolSchema).optional().describe("Suggested tools for the agent"),
  suggestedWorkflowType: z.custom<WorkflowDetailedType>().optional().describe("Suggested workflow type"),
  configurationTips: z.array(z.string()).optional().describe("General configuration tips"),
  potentialIssues: z.array(z.string()).optional().describe("Potential issues to be aware of")
});

type AiConfigurationAssistantOutput = z.infer<typeof AiConfigurationAssistantOutputSchema>;

// 3. Implement the Flow
export const aiConfigurationAssistantFlow = ai.defineFlow(
  {
    name: 'aiConfigurationAssistantFlow',
    inputSchema: AiConfigurationAssistantInputSchema,
    outputSchema: AiConfigurationAssistantOutputSchema,
    authPolicy: ai.authPolicies.allUsers,
  },
  async (input: z.infer<typeof AiConfigurationAssistantInputSchema>, _request: ActionContext) => {
    // Implementation of the flow...
    return {
      // Default empty response that matches the output schema
      suggestedAgentName: undefined,
      suggestedAgentDescription: undefined,
      suggestedTasks: undefined,
      suggestedTools: undefined,
      suggestedWorkflowType: undefined,
      configurationTips: undefined,
      potentialIssues: undefined
    };
  }
);

// Helper function to parse LLM responses, robustly handling potential JSON in markdown blocks
function parseLlmJsonResponse<T = Record<string, unknown>>(responseText: string, expectedKeys: string[]): T {
  let parsed: unknown;
  
  try {
    // Try to parse as pure JSON first
    parsed = JSON.parse(responseText);
  } catch (e) {
    // If that fails, try to extract JSON from markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        parsed = JSON.parse(jsonMatch[1]);
      } catch (innerError) {
        console.error('Failed to parse JSON from markdown:', innerError);
        throw new Error(`Could not parse LLM response as JSON: ${innerError}`);
      }
    } else {
      throw new Error(`Could not parse LLM response as JSON: ${e}`);
    }
  }

  // Validate that the parsed object has the expected keys
  if (typeof parsed === 'object' && parsed !== null) {
    const hasExpectedKeys = expectedKeys.every(key => key in parsed);
    if (!hasExpectedKeys) {
      throw new Error(`Parsed JSON is missing expected keys. Expected: ${expectedKeys.join(', ')}`);
    }
    return parsed as T;
  }

  throw new Error('Parsed response is not a valid JSON object');
}

// Helper function to get workflow type based on agent configuration
async function getWorkflowDetailedType(query: string): Promise<WorkflowDetailedType> {
  // Implementation would analyze the query and determine the appropriate workflow type
  // For now, we return a default value that matches the WorkflowDetailedType
  return "conversational" as const; // Default value with const assertion to ensure type safety
}
