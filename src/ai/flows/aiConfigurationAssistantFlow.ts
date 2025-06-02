import { defineFlow } from '@genkit-ai/flow';
import { gemini15Pro } from '@genkit-ai/googleai';
import * as z from 'zod';
import { generate } from '@genkit-ai/ai';
import { allTools } from '@/data/agent-builder/available-tools';

// 1. Define Input Schema
/**
 * Defines the input structure for the AI Configuration Assistant flow.
 */
export const AiConfigurationAssistantInputSchema = z.object({
  /** The primary goal or objective of the agent being configured. */
  agentObjective: z.string().describe("The primary goal or objective of the agent"),
  /** Optional list of main tasks the agent is expected to perform. */
  agentTasks: z.array(z.string()).optional().describe("The main tasks the agent is expected to perform"),
  /** Optional type of the agent, e.g., 'llm' or 'workflow'. This can influence suggestions. */
  agentType: z.string().optional().describe("The type of agent (e.g., 'llm', 'workflow')")
});

// 2. Define Output Schema
/**
 * Represents a single suggested tool.
 */
const SuggestedToolSchema = z.object({
  /** The unique identifier of the suggested tool. */
  id: z.string(),
  /** The name of the suggested tool. */
  name: z.string(),
  /** A brief description of the suggested tool's function. */
  description: z.string(),
  /** Optional name of an icon to represent the tool. */
  iconName: z.string().optional(),
  /** Optional Genkit tool name, if applicable. */
  genkitToolName: z.string().optional(),
});

/**
 * Defines the output structure for the AI Configuration Assistant flow.
 * Each field is optional and may be undefined if its specific suggestion part failed
 * or if no relevant suggestion could be made, allowing for partial results.
 */
export const AiConfigurationAssistantOutputSchema = z.object({
  /**
   * A list of suggested tools relevant to the agent's objective and tasks.
   * May be an empty array if tool suggestion failed, no relevant tools were found,
   * or the LLM returned an empty list, even if other suggestions were successful.
   */
  suggestedTools: z.array(SuggestedToolSchema).optional().describe("A list of suggested tools. May be empty if tool suggestion failed or no relevant tools were found, even if other suggestions were successful."),
  /**
   * A suggested personality or tone for the agent.
   * May be undefined if personality suggestion failed, even if other parts succeeded.
   */
  suggestedPersonality: z.string().optional().describe("A suggested personality or tone for the agent. May be undefined if suggestion failed."),
  /**
   * A list of suggested restrictions for the agent's behavior.
   * May be undefined or an empty array if restriction suggestion failed or no restrictions were deemed necessary,
   * even if other parts succeeded.
   */
  suggestedRestrictions: z.array(z.string()).optional().describe("A list of suggested restrictions for the agent's behavior. May be undefined or empty if suggestion failed or none were applicable."),
  /**
   * Suggested workflow type (e.g., sequential, parallel, loop) if applicable (typically for 'workflow' agent types).
   * May be undefined if workflow type suggestion failed, is not applicable for the agent type,
   * or the LLM provided an invalid type, even if other parts succeeded.
   */
  suggestedWorkflowType: z.enum(["sequential", "parallel", "loop"]).optional().describe("Suggested workflow type. May be undefined if suggestion failed, not applicable, or an invalid type was returned."),
});

// 3. Define the Flow
/**
 * @defineFlow
 * The AI Configuration Assistant flow helps in generating initial configuration suggestions
 * for an AI agent based on its objective, tasks, and type.
 * It leverages an LLM to suggest relevant tools, personality traits, behavioral restrictions,
 * and workflow types.
 * The flow is designed to be resilient, meaning if one part of the suggestion process
 * fails (e.g., tool suggestion), it will attempt to provide suggestions for other parts
 * (e.g., personality), thus returning partial results where possible.
 *
 * @inputSchema AiConfigurationAssistantInputSchema
 * @outputSchema AiConfigurationAssistantOutputSchema
 */
export const aiConfigurationAssistantFlow = defineFlow(
  {
    name: 'aiConfigurationAssistant',
    inputSchema: AiConfigurationAssistantInputSchema,
    outputSchema: AiConfigurationAssistantOutputSchema,
  },
  async (input): Promise<z.infer<typeof AiConfigurationAssistantOutputSchema>> => {
    const { agentObjective, agentTasks, agentType } = input;
    const tasksString = agentTasks && agentTasks.length > 0 ? agentTasks.join('; ') : 'Not specified';

    // Initialize parts of the output
    let suggestedToolObjects: z.infer<typeof SuggestedToolSchema>[] = [];
    let suggestedPersonality: string | undefined = undefined;
    let suggestedRestrictions: string[] | undefined = undefined;
    let suggestedWorkflowType: z.infer<typeof AiConfigurationAssistantOutputSchema>['suggestedWorkflowType'] = undefined;

    // --- Tool Suggestion Logic ---
    const toolDescriptionsForPrompt = allTools.map(tool =>
      `ID: "${tool.id}", Name: "${tool.name}", Description: "${tool.description}"`
    ).join('\n');

    const toolSuggestionPrompt = `
Agent Objective: ${agentObjective}
Agent Tasks: ${tasksString}
Available Tools:
${toolDescriptionsForPrompt}

Based on the agent's objective and tasks, suggest up to 3 relevant tools from the "Available Tools" list.
Respond ONLY with a valid JSON object with a single key "suggestedToolIds", which is an array of tool IDs (strings).
For example: {"suggestedToolIds": ["toolId1", "toolId2"]}.
If no tools are relevant, return {"suggestedToolIds": []}.
Do not include any explanatory text or markdown formatting around the JSON.`;

    // Intermediate Zod schema for parsing the LLM response for tool suggestions.
    // Expects an object with an optional array of tool IDs.
    const LlmToolIdsSchema = z.object({ suggestedToolIds: z.array(z.string()).optional() });

    // This block attempts to get tool suggestions from the LLM.
    // If the LLM call fails, or if the response parsing/validation fails,
    // `suggestedToolObjects` will remain its default empty array.
    // The flow then continues to the next suggestion type.
    try {
      const llmToolResponse = await generate({ model: gemini15Pro, prompt: toolSuggestionPrompt, config: { temperature: 0.2 } });
      const toolResponseText = llmToolResponse.text();
      let parsedToolJson: z.infer<typeof LlmToolIdsSchema> = {};

      // Attempt to parse the JSON response from the LLM.
      try {
        const match = toolResponseText.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonToParse = match ? match[1].trim() : toolResponseText.trim();
        parsedToolJson = JSON.parse(jsonToParse);
      } catch (e) {
        console.error("Failed to parse tool suggestions JSON string from LLM:", toolResponseText, e);
      }

      // Validate the parsed JSON against the intermediate schema.
      const validationResult = LlmToolIdsSchema.safeParse(parsedToolJson);
      if (validationResult.success && validationResult.data.suggestedToolIds) {
        // Map valid tool IDs to full tool objects from `allTools`.
        suggestedToolObjects = validationResult.data.suggestedToolIds.map(id => {
          const foundTool = allTools.find(t => t.id === id);
          return foundTool ? { id: foundTool.id, name: foundTool.name, description: foundTool.description, iconName: (foundTool.icon as any)?.displayName || (typeof foundTool.icon === 'string' ? foundTool.icon : undefined) || 'HelpCircle', genkitToolName: foundTool.genkitToolName } : null;
        }).filter(t => t !== null) as z.infer<typeof SuggestedToolSchema>[];
      } else if (!validationResult.success) {
         console.error("LLM tool suggestions JSON did not match intermediate schema:", validationResult.error.flatten(), "Original JSON attempt:", parsedToolJson);
      }
    } catch (error) {
      console.error("Error during LLM call for tool suggestions:", error);
    }

    // --- Personality and Restrictions Suggestion Logic ---
    // This section attempts to get personality and restriction suggestions.
    // Similar to tool suggestions, failures here (LLM, parsing, validation)
    // will result in `suggestedPersonality` and `suggestedRestrictions`
    // retaining their default (undefined) values, and the flow will continue.
    const behaviorSuggestionPrompt = `
Agent Objective: ${agentObjective}
Agent Tasks: ${tasksString}

Suggest a suitable personality (a brief descriptive string) and a list of behavioral restrictions (an array of strings) for this agent.
Respond ONLY with a valid JSON object with two keys: "suggestedPersonality" (string) and "suggestedRestrictions" (array of strings).
For example: {"suggestedPersonality": "Helpful and friendly", "suggestedRestrictions": ["Do not use slang", "Avoid controversial topics"]}.
If no specific personality or restrictions are applicable, you can return empty or default values like: {"suggestedPersonality": "Neutral", "suggestedRestrictions": []}.
Do not include any explanatory text or markdown formatting around the JSON.`;

    // Intermediate Zod schema for parsing the LLM response for behavior (personality & restrictions).
    const LlmBehaviorSchema = z.object({
        suggestedPersonality: z.string().optional(),
        suggestedRestrictions: z.array(z.string()).optional(),
    });

    try {
      const llmBehaviorResponse = await generate({ model: gemini15Pro, prompt: behaviorSuggestionPrompt, config: { temperature: 0.5 } });
      const behaviorResponseText = llmBehaviorResponse.text();
      let parsedBehaviorJson: z.infer<typeof LlmBehaviorSchema> = {};

      // Attempt to parse the JSON response.
      try {
        const match = behaviorResponseText.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonToParse = match ? match[1].trim() : behaviorResponseText.trim();
        parsedBehaviorJson = JSON.parse(jsonToParse);
      } catch (e) {
        console.error("Failed to parse behavior suggestions JSON string from LLM:", behaviorResponseText, e);
      }

      // Validate parsed JSON against the intermediate schema.
      const validationResult = LlmBehaviorSchema.safeParse(parsedBehaviorJson);
      if (validationResult.success) {
        suggestedPersonality = validationResult.data.suggestedPersonality;
        suggestedRestrictions = validationResult.data.suggestedRestrictions;
      } else {
        console.error("LLM behavior suggestions JSON did not match intermediate schema:", validationResult.error.flatten(), "Original JSON attempt:", parsedBehaviorJson);
      }
    } catch (error) {
      console.error("Error during LLM call for behavior suggestions:", error);
    }

    // --- Workflow Type Suggestion Logic ---
    // This section attempts to get workflow type suggestions if the agent type is 'workflow'
    // and tasks are provided. Errors are handled similarly, leaving `suggestedWorkflowType`
    // undefined upon failure, allowing the flow to proceed.
    if (agentType && agentType.toLowerCase().includes('workflow') && agentTasks && agentTasks.length > 0) {
      const workflowTypePrompt = `
Agent Objective: ${agentObjective}
Agent Tasks: ${tasksString}

Based on these tasks, suggest the most appropriate workflow type. The allowed types are "sequential", "parallel", or "loop".
- "sequential": Tasks must be performed in order.
- "parallel": Tasks can be performed independently at the same time.
- "loop": Tasks (or a sequence of tasks) are repeated.

Respond ONLY with a valid JSON object with a single key "suggestedWorkflowType", whose value is one of the allowed types.
For example: {"suggestedWorkflowType": "sequential"}.
Do not include any explanatory text or markdown formatting around the JSON.`;

      // Intermediate Zod schema for parsing the LLM response for workflow type.
      const LlmWorkflowTypeSchema = z.object({ suggestedWorkflowType: z.enum(["sequential", "parallel", "loop"]).optional() });

      try {
        const llmWorkflowResponse = await generate({ model: gemini15Pro, prompt: workflowTypePrompt, config: { temperature: 0.1 } });
        const workflowResponseText = llmWorkflowResponse.text();
        let parsedWorkflowJson: z.infer<typeof LlmWorkflowTypeSchema> = {};

        // Attempt to parse JSON response.
        try {
          const match = workflowResponseText.match(/```json\s*([\s\S]*?)\s*```/);
          const jsonToParse = match ? match[1].trim() : workflowResponseText.trim();
          parsedWorkflowJson = JSON.parse(jsonToParse);
        } catch (e) {
            console.error("Failed to parse workflow type JSON string from LLM:", workflowResponseText, e);
        }

        // Validate parsed JSON against intermediate schema.
        const validationResult = LlmWorkflowTypeSchema.safeParse(parsedWorkflowJson);
        if (validationResult.success) {
            suggestedWorkflowType = validationResult.data.suggestedWorkflowType;
        } else {
            console.error("LLM workflow type JSON did not match intermediate schema:", validationResult.error.flatten(), "Original JSON attempt:", parsedWorkflowJson);
        }
      } catch (error) {
        console.error("Error during LLM call for workflow type suggestion:", error);
      }
    }

    // Construct the final output from potentially partial suggestions.
    const finalOutput: z.infer<typeof AiConfigurationAssistantOutputSchema> = {
      suggestedTools: suggestedToolObjects,
      suggestedPersonality: suggestedPersonality,
      suggestedRestrictions: suggestedRestrictions,
      suggestedWorkflowType: suggestedWorkflowType,
    };

    const parseResult = AiConfigurationAssistantOutputSchema.safeParse(finalOutput);
    if (!parseResult.success) {
      // This error indicates a mismatch between the assembled `finalOutput`
      // and the `AiConfigurationAssistantOutputSchema`. This might happen if, for example,
      // a previously optional field in the output schema became required, but a
      // suggestion part failed, leaving it undefined.
      console.error("Final output validation error before returning:", parseResult.error.flatten(), "Constructed output:", finalOutput);

      // Return the partially populated data. It's up to the caller to handle
      // cases where the output might not be fully populated due to errors in suggestion generation.
      // The individual fields are optional in the schema, so this fallback output
      // should still be schema-compliant if defaults (like [] or undefined) are used.
      return {
        suggestedTools: suggestedToolObjects,
        suggestedPersonality: suggestedPersonality,
        suggestedRestrictions: suggestedRestrictions,
        suggestedWorkflowType: suggestedWorkflowType,
      };
    }
    return parseResult.data;
  }
);

// Example of how to run the flow
/*
import { runFlow } from '@genkit-ai/flow';
import { initializeGenkit } from '@/ai/genkit';

async function testFlow() {
  initializeGenkit();
  try {
    const resultWorkflow = await runFlow(aiConfigurationAssistantFlow, {
      agentObjective: 'Process customer orders by validating, checking stock, processing payment, and sending confirmation.',
      agentTasks: ['Validate order details', 'Check product availability in inventory', 'Process credit card payment', 'Send email confirmation to customer'],
      agentType: 'workflow'
    });
    console.log('Workflow Agent Flow Result:', JSON.stringify(resultWorkflow, null, 2));

    const resultLLM = await runFlow(aiConfigurationAssistantFlow, {
        agentObjective: 'Help users write blog posts.',
        agentTasks: ['Suggest blog post titles', 'Generate an outline', 'Write a draft paragraph'],
        agentType: 'llm'
      });
    console.log('LLM Agent Flow Result (no workflow type expected):', JSON.stringify(resultLLM, null, 2));

  } catch (error) {
    console.error('Flow Error:', error);
  }
}
// testFlow();
*/
