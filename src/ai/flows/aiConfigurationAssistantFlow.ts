import { defineFlow } from '@genkit-ai/flow';
import { gemini15Pro } from '@genkit-ai/googleai';
import * as z from 'zod';
import { generate } from '@genkit-ai/ai';
import { allTools } from '@/data/agent-builder/available-tools';
import { SavedAgentConfiguration, AgentConfig } from '@/types/agent-configs';

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
  suggestedGoal: z.string().optional().describe("A suggested improvement for the agent's goal/objective."),
  suggestedTasks: z.array(z.string()).optional().describe("Suggested improvements or additions to the agent's tasks."),
  inconsistencyAlerts: z.array(z.string()).optional().describe("Alerts for detected inconsistencies in the agent configuration."),
  suggestedAgentName: z.string().optional().describe("A suggested name for the agent."),
  suggestedAgentDescription: z.string().optional().describe("A suggested description for the agent."),
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
  async (input: z.infer<typeof AiConfigurationAssistantInputSchema>): Promise<z.infer<typeof AiConfigurationAssistantOutputSchema>> => {
    const { fullAgentConfig, suggestionContext } = input;
    const { config, tools: selectedToolIds = [], agentName, agentDescription } = fullAgentConfig; // selectedToolIds from fullAgentConfig.tools
    const agentType = config.type;

    // Helper to get current values from the discriminated union 'config'
    const getAgentProperty = (propName: string, defaultValue: any = undefined) => {
        if (config && typeof config === 'object' && propName in config) {
            return (config as any)[propName];
        }
        return defaultValue;
    };

    const agentObjective = agentType === 'llm' ? getAgentProperty('agentGoal', '') :
                           agentType === 'workflow' ? getAgentProperty('workflowDescription', '') : '';
    const agentTasks = agentType === 'llm' ? getAgentProperty('agentTasks', []) : [];
    const currentPersonality = agentType === 'llm' ? getAgentProperty('agentPersonality') : undefined;
    const currentRestrictions = agentType === 'llm' ? getAgentProperty('agentRestrictions', []) : [];


    // Initialize parts of the output
    let suggestedToolObjects: z.infer<typeof SuggestedToolSchema>[] = [];
    let suggestedPersonalityText: string | undefined = undefined;
    let suggestedRestrictionsList: string[] | undefined = undefined;
    let suggestedWorkflowTypeResult: z.infer<typeof AiConfigurationAssistantOutputSchema>['suggestedWorkflowType'] = undefined;
    let suggestedGoalText: string | undefined = undefined;
    let suggestedTasksList: string[] | undefined = undefined;
    let inconsistencyAlertsList: string[] | undefined = [];
    let suggestedAgentNameText: string | undefined = undefined;
    let suggestedAgentDescriptionText: string | undefined = undefined;


    // Helper function for robust JSON parsing from LLM
    const parseLlmJsonResponse = (responseText: string, expectedKeys: string[]): any => {
        try {
            const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonToParse = match ? match[1].trim() : responseText.trim();
            const parsed = JSON.parse(jsonToParse);
            // Basic check if all expected keys are present
            // For more complex validation, Zod schemas for each LLM response part would be better
            // if (expectedKeys.every(key => key in parsed)) {
            //   return parsed;
            // }
            return parsed; // For now, return parsed if JSON is valid, specific checks done by caller
        } catch (e) {
            console.error("Failed to parse JSON response from LLM:", responseText, e);
            // Try a more lenient parsing if the above fails
            const firstBrace = responseText.indexOf('{');
            const lastBrace = responseText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                try {
                    return JSON.parse(responseText.substring(firstBrace, lastBrace + 1));
                } catch (subE) {
                    console.error("Secondary parsing attempt failed:", responseText, subE);
                }
            }
        }
        return {}; // Return empty object on failure
    };

    // --- Tool Suggestion Logic ---
    if (!suggestionContext || suggestionContext === "tools") {
      const toolDescriptionsForPrompt = allTools.map(tool =>
        `ID: "${tool.id}", Name: "${tool.name}", Description: "${tool.description}"`
      ).join('\n');

      const selectedToolNames = selectedToolIds.map(id => allTools.find(t => t.id === id)?.name || id).join(', ') || 'None';
      const toolSuggestionPrompt = `
Agent Objective: ${agentObjective}
Agent Tasks: ${(agentTasks || []).join('; ') || 'Not specified'}
Currently Selected Tools: ${selectedToolNames}
Available Tools (with ID, Name, Description):
${toolDescriptionsForPrompt}

Based on the agent's objective and tasks, suggest up to 3 relevant tools from the "Available Tools" list.
CRITICAL CONSIDERATIONS:
1.  **Prioritize Essential Tools**: If the objective or tasks strongly imply a certain capability (e.g., "data analysis" often requires a 'Calculator' or 'Database Access' tool; "research" often needs a 'Web Search' tool), you MUST suggest these if they are not already selected.
2.  **Avoid Redundancy**: Do NOT suggest tools that are already listed in "Currently Selected Tools" unless the available tool offers a significantly different or more appropriate functionality despite a similar name (this is rare, be cautious).
3.  **Complement Existing Tools**: Suggest tools that complement the functionality of the currently selected tools to achieve the agent's objective.
4.  **Relevance is Key**: Only suggest tools that directly contribute to fulfilling the agent's stated objective and tasks. Do not suggest tools for unrelated capabilities.

Respond ONLY with a valid JSON object with a single key "suggestedToolIds", which is an array of tool IDs (strings).
For example: {"suggestedToolIds": ["calculator", "databaseAccess"]}.
If no *new* relevant tools are genuinely needed, or if all essential tools are already selected, return {"suggestedToolIds": []}.
Do not include any explanatory text or markdown formatting around the JSON.`;

      try {
          const llmToolResponse = await generate({ model: gemini15Pro, prompt: toolSuggestionPrompt, config: { temperature: 0.2 } });
          const parsedToolJson = parseLlmJsonResponse(llmToolResponse.text(), ["suggestedToolIds"]);

          const validationResult = z.object({ suggestedToolIds: z.array(z.string()).optional() }).safeParse(parsedToolJson);
          if (validationResult.success && validationResult.data.suggestedToolIds) {
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
    }

    // --- Personality and Restrictions Suggestion Logic ---
    if (agentType === 'llm' && (!suggestionContext || suggestionContext === "personality" || suggestionContext === "restrictions")) {
      const behaviorSuggestionPrompt = `
Agent Objective: ${agentObjective}
Agent Tasks: ${(agentTasks || []).join('; ') || 'Not specified'}
Current Personality: ${currentPersonality || 'Not specified'}
Current Restrictions: ${(currentRestrictions || []).join('; ') || 'Not specified'}

Suggest an improved "Personality" (a brief descriptive string) and a list of up to 3 "Behavioral Restrictions" (an array of concise strings) for this agent.
These suggestions should complement the agent's objective, tasks, and existing behavior.
If current settings are good, you can suggest minor refinements or affirm them.
Respond ONLY with a valid JSON object with two keys: "suggestedPersonality" (string) and "suggestedRestrictions" (array of strings).
For example: {"suggestedPersonality": "Helpful and friendly", "suggestedRestrictions": ["Do not use slang", "Avoid controversial topics"]}.
Do not include any other text or markdown formatting.\`;
      try {
        const llmBehaviorResponse = await generate({ model: gemini15Pro, prompt: behaviorSuggestionPrompt, config: { temperature: 0.5 } });
        const parsedBehaviorJson = parseLlmJsonResponse(llmBehaviorResponse.text(), ["suggestedPersonality", "suggestedRestrictions"]);
        if (!suggestionContext || suggestionContext === "personality") {
            if (parsedBehaviorJson.suggestedPersonality && typeof parsedBehaviorJson.suggestedPersonality === 'string') {
            suggestedPersonalityText = parsedBehaviorJson.suggestedPersonality;
            }
        }
        if (!suggestionContext || suggestionContext === "restrictions") {
            if (parsedBehaviorJson.suggestedRestrictions && Array.isArray(parsedBehaviorJson.suggestedRestrictions)) {
            suggestedRestrictionsList = parsedBehaviorJson.suggestedRestrictions.filter((r: any) => typeof r === 'string');
            }
        }
      } catch (error) { console.error("Error in behavior suggestion LLM call: ", error); }
    }

    // --- Workflow Type Suggestion Logic ---
    if (agentType === 'workflow' && agentTasks && agentTasks.length > 0 && (!suggestionContext || suggestionContext === "workflowType")) {
        const workflowTypePrompt = `
Agent Objective: ${agentObjective}
Agent Tasks: ${(agentTasks || []).join('; ')}

Based on these tasks, suggest the most appropriate workflow type. The allowed types are "sequential", "parallel", or "loop".
- "sequential": Tasks must be performed in order.
- "parallel": Tasks can be performed independently at the same time.
- "loop": Tasks (or a sequence of tasks) are repeated.

Respond ONLY with a valid JSON object with a single key "suggestedWorkflowType", whose value is one of the allowed types.
For example: {"suggestedWorkflowType": "sequential"}.
Do not include any explanatory text or markdown formatting around the JSON.`;
        try {
            const llmWorkflowResponse = await generate({ model: gemini15Pro, prompt: workflowTypePrompt, config: { temperature: 0.1 } });
            const parsedWorkflowJson = parseLlmJsonResponse(llmWorkflowResponse.text(), ["suggestedWorkflowType"]);
            const validationResult = z.object({ suggestedWorkflowType: z.enum(["sequential", "parallel", "loop"]).optional() }).safeParse(parsedWorkflowJson);
            if (validationResult.success) {
                suggestedWorkflowTypeResult = validationResult.data.suggestedWorkflowType;
            } else {
                 console.error("LLM workflow type JSON did not match intermediate schema:", validationResult.error.flatten(), "Original JSON attempt:", parsedWorkflowJson);
            }
        } catch (error) {
            console.error("Error during LLM call for workflow type suggestion:", error);
        }
    }

    // --- Goal Optimization Logic ---
    if (agentType === 'llm' && (!suggestionContext || suggestionContext === "goal")) {
      const goalOptimizationPrompt = `
You are an AI Agent Configuration Optimizer.
Current Agent Configuration:
Name: ${agentName}
Description: ${agentDescription}
Current Goal: ${agentObjective}
Tasks: ${(agentTasks || []).join('; ') || 'Not specified'}
Selected Tools: ${selectedToolIds.map(tId => allTools.find(at => at.id === tId)?.name || tId).join(', ') || 'None'}
Personality: ${currentPersonality || 'Not specified'}

Based on the current agent configuration, suggest an improved and more effective "Agent Goal".
The goal should be clear, concise, actionable, and well-aligned with the agent's tasks and tools.
If the current goal is already good, you can state that or offer a minor refinement.
Respond ONLY with a valid JSON object with a single key "suggestedGoal" (string).
For example: {"suggestedGoal": "A new, improved goal statement."}.
Do not include any other text or markdown formatting.\`;
      try {
        const llmGoalResponse = await generate({ model: gemini15Pro, prompt: goalOptimizationPrompt, config: { temperature: 0.4 } });
        const parsedGoalJson = parseLlmJsonResponse(llmGoalResponse.text(), ["suggestedGoal"]);
        if (parsedGoalJson.suggestedGoal && typeof parsedGoalJson.suggestedGoal === 'string') {
          suggestedGoalText = parsedGoalJson.suggestedGoal;
        }
      } catch (error) { console.error("Error in goal suggestion LLM call: ", error); }
    }

    // --- Task Optimization Logic ---
    if (agentType === 'llm' && (!suggestionContext || suggestionContext === "tasks")) {
      const taskOptimizationPrompt = `
You are an AI Agent Task Optimizer.
Current Agent Configuration:
Name: ${agentName}
Goal: ${agentObjective}
Current Tasks: ${(agentTasks || []).join('; ') || 'Not specified'}
Selected Tools: ${selectedToolIds.map(tId => allTools.find(at => at.id === tId)?.name || tId).join(', ') || 'None'}
Personality: ${currentPersonality || 'Not specified'}

Based on the agent's goal and selected tools, suggest a revised list of "Main Tasks" (array of strings).
The tasks should be specific, actionable steps that help achieve the goal.
Consider if any tasks are redundant, unclear, or if new tasks could be added.
Respond ONLY with a valid JSON object with a single key "suggestedTasks" (array of strings).
For example: {"suggestedTasks": ["New Task 1", "Improved Task 2"]}.
If current tasks are good, you may return them or suggest minor improvements.
Do not include any other text or markdown formatting.\`;
      try {
        const llmTasksResponse = await generate({ model: gemini15Pro, prompt: taskOptimizationPrompt, config: { temperature: 0.4 } });
        const parsedTasksJson = parseLlmJsonResponse(llmTasksResponse.text(), ["suggestedTasks"]);
        if (parsedTasksJson.suggestedTasks && Array.isArray(parsedTasksJson.suggestedTasks)) {
          suggestedTasksList = parsedTasksJson.suggestedTasks.filter((t: any) => typeof t === 'string');
        }
      } catch (error) { console.error("Error in task suggestion LLM call: ", error); }
    }

    // --- Agent Name Suggestion Logic ---
    if (!suggestionContext || suggestionContext === "agentName") {
        const nameSuggestionPrompt = `
You are an AI Agent Naming Assistant.
Current Agent Configuration:
Type: ${agentType}
Objective/Goal: ${agentObjective}
Tasks: ${(agentTasks || []).join('; ') || 'Not specified'}
Current Name: ${agentName || 'Not named yet'}

Based on the agent's objective and tasks, suggest a concise, descriptive, and catchy "Agent Name".
The name should ideally reflect the agent's core purpose.
Respond ONLY with a valid JSON object with a single key "suggestedAgentName" (string).
For example: {"suggestedAgentName": "Data Analyzer Pro"}.
Do not include any other text or markdown formatting.\`;
        try {
        const llmNameResponse = await generate({ model: gemini15Pro, prompt: nameSuggestionPrompt, config: { temperature: 0.6 } });
        const parsedNameJson = parseLlmJsonResponse(llmNameResponse.text(), ["suggestedAgentName"]);
        if (parsedNameJson.suggestedAgentName && typeof parsedNameJson.suggestedAgentName === 'string') {
            suggestedAgentNameText = parsedNameJson.suggestedAgentName;
        }
        } catch (error) {
        console.error("Error in agent name suggestion LLM call: ", error);
        }
    }

    // --- Agent Description Suggestion Logic ---
    if (!suggestionContext || suggestionContext === "agentDescription") {
        const descriptionSuggestionPrompt = `
You are an AI Agent Description Writer.
Current Agent Configuration:
Name: ${suggestedAgentNameText || agentName || 'N/A'} 
Type: ${agentType}
Objective/Goal: ${agentObjective}
Tasks: ${(agentTasks || []).join('; ') || 'Not specified'}
Selected Tools: ${selectedToolIds.map(tId => allTools.find(at => at.id === tId)?.name || tId).join(', ') || 'None'}
Current Description: ${agentDescription || 'Not described yet'}

Based on the agent's (potentially new) name, objective, tasks, and tools, write a concise and informative "Agent Description" (1-2 sentences).
The description should clearly explain what the agent does and its main benefits.
Respond ONLY with a valid JSON object with a single key "suggestedAgentDescription" (string).
For example: {"suggestedAgentDescription": "This agent analyzes sales data to provide weekly performance reports and identify trends."}.
Do not include any other text or markdown formatting.\`;
        try {
        const llmDescriptionResponse = await generate({ model: gemini15Pro, prompt: descriptionSuggestionPrompt, config: { temperature: 0.5 } });
        const parsedDescriptionJson = parseLlmJsonResponse(llmDescriptionResponse.text(), ["suggestedAgentDescription"]);
        if (parsedDescriptionJson.suggestedAgentDescription && typeof parsedDescriptionJson.suggestedAgentDescription === 'string') {
            suggestedAgentDescriptionText = parsedDescriptionJson.suggestedAgentDescription;
        }
        } catch (error) {
        console.error("Error in agent description suggestion LLM call: ", error);
        }
    }
    
    // --- Inconsistency Detection Logic ---
    // Generate if no specific context, or if context is inconsistencyAlerts, or if context is a major config area.
    const shouldRunInconsistencyCheck = !suggestionContext || 
                                        suggestionContext === "inconsistencyAlerts" ||
                                        suggestionContext === "goal" ||
                                        suggestionContext === "tasks" ||
                                        suggestionContext === "tools" ||
                                        suggestionContext === "workflowType";

    if (shouldRunInconsistencyCheck) {
        const selectedToolNames = selectedToolIds.map(id => allTools.find(t => t.id === id)?.name || id).join(', ') || 'None';
        const workflowStepsString = config.type === 'workflow' && config.detailedWorkflowType === 'sequential' && config.sequentialSteps
        ? config.sequentialSteps.map((s, i) => `${i+1}. ${allTools.find(at => at.id === s.toolId)?.name || s.toolId} (Output: ${s.outputKey || 'none'})`).join(' -> ') || 'Not defined'
        : '';
        const ragInfo = config.rag?.enabled ? `RAG Enabled. Knowledge Sources: ${config.rag.knowledgeSources?.length || 0}` : 'RAG Disabled';

        const inconsistencyDetectionPrompt = `
You are an AI Agent Configuration Analyst.
Agent Configuration Snapshot:
Name: ${agentName}
Description: ${agentDescription}
Type: ${agentType}
Objective/Goal: ${agentObjective}
Tasks: ${(agentTasks || []).join('; ') || 'Not specified'}
Selected Tools: ${selectedToolNames}
${agentType === 'llm' ? `Personality: \${currentPersonality || 'Not specified'}` : ''}
${agentType === 'llm' ? `Restrictions: \${(currentRestrictions || []).join('; ') || 'None'}` : ''}
${agentType === 'workflow' ? `Workflow Type: \${getAgentProperty('detailedWorkflowType', 'N/A')}` : ''}
${workflowStepsString ? `Sequential Workflow Steps: \${workflowStepsString}` : ''}
${ragInfo}

Analyze the provided agent configuration for critical inconsistencies, logical issues, or missing components that would likely impair functionality or lead to poor performance. Focus on high-impact issues.
Examples:
- Objective/tasks misalignment with selected tools (e.g., 'financial analysis' task with no calculator/data tool).
- Illogical workflow sequences (e.g., summarizing content before fetching it).
- Contradictory LLM personality/restrictions for given tasks.
- RAG enabled but no knowledge sources provided.

List up to 3-4 major alerts.
Respond ONLY with a valid JSON object with a single key "inconsistencyAlerts" (array of strings).
For example: {"inconsistencyAlerts": ["Alert: Agent tasks require data analysis, but no calculator or data processing tool is selected.", "Warning: RAG is enabled, but no knowledge sources are configured."]}.
If no major inconsistencies are found, return {"inconsistencyAlerts": []}.
Do not include any other text or markdown formatting.\`;
        try {
        const llmInconsistencyResponse = await generate({ model: gemini15Pro, prompt: inconsistencyDetectionPrompt, config: { temperature: 0.3 } });
        const parsedInconsistencyJson = parseLlmJsonResponse(llmInconsistencyResponse.text(), ["inconsistencyAlerts"]);
        if (parsedInconsistencyJson.inconsistencyAlerts && Array.isArray(parsedInconsistencyJson.inconsistencyAlerts)) {
            inconsistencyAlertsList = parsedInconsistencyJson.inconsistencyAlerts.filter((alert: any) => typeof alert === 'string');
        }
        } catch (error) { console.error("Error in inconsistency detection LLM call: ", error); }
    }

    // --- Assemble Final Output ---
    const finalOutput: z.infer<typeof AiConfigurationAssistantOutputSchema> = {
      suggestedTools: suggestedToolObjects.length > 0 ? suggestedToolObjects : undefined,
      suggestedPersonality: suggestedPersonalityText,
      suggestedRestrictions: suggestedRestrictionsList && suggestedRestrictionsList.length > 0 ? suggestedRestrictionsList : undefined,
      suggestedWorkflowType: suggestedWorkflowTypeResult,
      suggestedGoal: suggestedGoalText,
      suggestedTasks: suggestedTasksList && suggestedTasksList.length > 0 ? suggestedTasksList : undefined,
      inconsistencyAlerts: inconsistencyAlertsList && inconsistencyAlertsList.length > 0 ? inconsistencyAlertsList : undefined,
      suggestedAgentName: suggestedAgentNameText,
      suggestedAgentDescription: suggestedAgentDescriptionText,
    };

    const parseResult = AiConfigurationAssistantOutputSchema.safeParse(finalOutput);
    if (!parseResult.success) {
      console.error("Final output validation error in aiConfigurationAssistantFlow:", parseResult.error.flatten(), "Constructed output:", finalOutput);
      return finalOutput;
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
