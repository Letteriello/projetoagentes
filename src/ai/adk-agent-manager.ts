/**
 * @file adk-agent-manager.ts
 * 
 * This file is the core of the Agent Development Kit (ADK) backend logic. It is responsible for:
 * 1. Defining and managing various types of Genkit agents (LLM, Workflow, Custom) based on configurations
 *    provided by the frontend agent builder.
 * 2. Mapping frontend tool configurations to actual Genkit tool instances.
 * 3. Storing and retrieving defined agents for execution by API routes.
 * 
 * It interacts with:
 * - `./genkit.ts`: For initializing the Genkit AI SDK and accessing models.
 * - `./tools/*`: For importing specific Genkit tool implementations.
 * - API routes (e.g., `src/app/api/agents/route.ts`): Which use `defineAdkAgent` to create agents.
 * - API routes (e.g., `src/app/api/agents/[agentId]/run/route.ts`): Which use `getDefinedAgent` to retrieve agents for execution.
 */

import { ai } from './genkit'; // Genkit AI SDK utilities and model access
import { defineAgent, LlmAgent, Agent, Tool, SequentialAgent, ParallelAgent, LoopAgent } from '@genkit-ai/agent'; // Core Genkit agent types
import { performWebSearchTool } from './tools/web-search-tool'; // Example of a specific tool
import { calculatorTool } from './tools/calculator-tool'; // Example of another specific tool

/**
 * Represents configuration data for a specific tool instance,
 * as potentially provided by the frontend.
 * This interface might be extended based on the needs of different tools.
 */
export interface ToolConfigData {
  // Example: API key for a Google tool
  googleApiKey?: string; // API key for Google services (e.g., Web Search)
  googleCseId?: string;  // Custom Search Engine ID for Google Web Search
  // TODO: Add other tool-specific config fields as needed, e.g., for OpenAPI specs, database connections, etc.
}

/**
 * Represents the comprehensive configuration for an agent as saved or received from the frontend.
 * This structure is used to define and instantiate various types of Genkit agents.
 * It includes common fields and type-specific fields for LLM, Workflow, and Custom agents.
 */
export interface SavedAgentConfiguration {
  id: string; // Unique identifier for the agent configuration.
  agentName: string; // User-defined name for the agent.
  agentDescription: string; // General description of the agent's purpose and capabilities.
                           // This can be overridden by `systemPromptGenerated` for LLM agents
                           // or `workflowDescription` for Workflow agents.
  agentVersion: string; // Version of the agent configuration (e.g., "1.0.0").
  agentTools: string[]; // Array of tool IDs selected for this agent (primarily for LLM agents).
                        // These IDs correspond to the keys in `toolsDetails`.
  agentType: 'llm' | 'workflow' | 'custom'; // Specifies the type of agent to be created.
  systemPromptGenerated?: string; // For LLM agents: the main instruction set.
                                 // For Workflow/Custom agents: can be used as a primary description if more specific ones aren't available.
  toolsDetails: Array<{ // Details about the tools selected for this agent.
    id: string; // Unique ID for the tool in the frontend context (e.g., "webSearch").
    label: string; // User-friendly label for the tool (e.g., "Busca na Web").
    genkitToolName?: string; // The actual name of the Genkit tool to be used (e.g., "performWebSearch").
                             // This maps to a key in `allKnownGenkitTools`.
    needsConfiguration?: boolean; // Flag indicating if this tool requires further configuration (e.g., API keys).
  }>;
  toolConfigsApplied?: Record<string, ToolConfigData>; // Optional: A map of tool IDs to their specific configurations.
                                                     // The key is the `id` from `toolsDetails`.

  // LLM-specific fields (relevant when agentType is 'llm')
  agentGoal?: string; // High-level goal for the LLM agent (used for prompt generation).
  agentTasks?: string; // Specific tasks the LLM agent should perform (used for prompt generation).
  agentPersonality?: string; // Desired personality or tone for the LLM agent (used for prompt generation).
  agentRestrictions?: string; // Constraints or limitations for the LLM agent (used for prompt generation).
  agentModel?: string; // Identifier for the language model to be used (e.g., 'googleai/gemini-1.5-flash-latest').
  agentTemperature?: number; // Temperature setting for the language model (0.0 to 2.0).

  // Workflow-specific fields (relevant when agentType is 'workflow')
  detailedWorkflowType?: 'sequential' | 'parallel' | 'loop'; // The specific type of workflow agent.
  workflowDescription?: string; // A detailed description of the workflow's purpose and operation.
  loopMaxIterations?: number; // For 'loop' type workflows, the maximum number of iterations.
  // TODO: Add fields for loopTerminationConditionType, loopExitToolName, loopExitStateKey, loopExitStateValue from UI once implemented.

  // Custom-specific fields (relevant when agentType is 'custom')
  customLogicDescription?: string; // Description of the custom logic this agent will execute.
                                   // This is used in the placeholder implementation and for metadata.
}

/**
 * Extends `SavedAgentConfiguration` for LLM agents, making LLM-specific fields mandatory.
 * This provides stronger typing when working with configurations known to be for LLM agents.
 * Note: Some fields like `agentGoal`, `agentTasks`, `agentPersonality`, `agentRestrictions` are primarily
 * used for generating the `systemPromptGenerated` on the frontend and may not be directly consumed
 * by the Genkit `LlmAgent` definition itself, other than through the resulting prompt.
 */
export interface LLMAgentConfig extends SavedAgentConfiguration {
  agentType: 'llm';
  agentGoal: string; 
  agentTasks: string; 
  agentPersonality: string; 
  agentRestrictions: string; 
  agentModel: string; // Model identifier is critical for LlmAgent.
  agentTemperature: number; // Temperature is a direct config for LlmAgent.
}

/**
 * A record mapping user-friendly tool names (as used in `toolsDetails.genkitToolName`)
 * to actual Genkit `Tool` instances or `undefined` if the tool is known but not yet implemented.
 * This allows dynamic selection of tools for an agent based on its configuration.
 */
export const allKnownGenkitTools: Record<string, Tool | undefined> = {
  performWebSearch: performWebSearchTool, // Tool for performing web searches.
  calculator: calculatorTool,             // Tool for performing calculations.
  // TODO: Add other implemented tools here as they are created (e.g., queryKnowledgeBase, accessCalendar).
};

/**
 * In-memory map to store Genkit `Agent` instances that have been defined by `defineAdkAgent`.
 * The key is the agent's `id` (from `SavedAgentConfiguration.id`).
 * This allows agents to be retrieved for execution by other parts of the application (e.g., API routes).
 * In a production system, this might be replaced or augmented with a more persistent storage solution
 * if agents need to be managed across server restarts or scaled instances.
 */
const definedAgents: Map<string, Agent> = new Map();

/**
 * Defines a Genkit agent based on the provided configuration.
 * This is the central function for creating agents dynamically from frontend specifications.
 * It handles different agent types (LLM, Workflow, Custom) and configures them accordingly.
 *
 * @param {SavedAgentConfiguration} config - The configuration object for the agent, typically originating from the frontend.
 * @returns {Promise<Agent>} A promise that resolves to the defined Genkit `Agent` instance.
 * @throws {Error} If validation of the configuration fails (e.g., missing required fields, invalid types).
 */
export async function defineAdkAgent(config: SavedAgentConfiguration): Promise<Agent> {
  // Basic validation applicable to all agent types.
  if (!config.agentName || !config.agentDescription) { 
    throw new Error('Agent name and description are required for all agent types.');
  }

  // Logic for LLM Agent type
  if (config.agentType === 'llm') {
    const llmConfig = config as LLMAgentConfig;

    const llmConfig = config as LLMAgentConfig; // Cast to specific type for easier access to LLM fields.

    // Validate required LLM-specific configuration fields for robustness.
    if (!llmConfig.agentModel || typeof llmConfig.agentModel !== 'string' || llmConfig.agentModel.trim() === '') {
      throw new Error('LLM agent configuration requires a valid agentModel (non-empty string).');
    }
    if (!llmConfig.systemPromptGenerated || typeof llmConfig.systemPromptGenerated !== 'string' || llmConfig.systemPromptGenerated.trim() === '') {
      // The system prompt is crucial for LLM agent behavior.
      throw new Error('LLM agent configuration requires valid systemPromptGenerated (non-empty string).');
    }
    if (llmConfig.agentTemperature === undefined || typeof llmConfig.agentTemperature !== 'number' || llmConfig.agentTemperature < 0 || llmConfig.agentTemperature > 2) {
      // Temperature must be within a valid range for most models.
      throw new Error('LLM agent configuration requires a valid agentTemperature (number between 0 and 2).');
    }

    // Attempt to retrieve the Genkit model instance. This can fail if the model name is incorrect
    // or if the model provider (e.g., Google AI) is not configured correctly in `src/ai/genkit.ts`.
    let model;
    try {
      model = ai.getModel(llmConfig.agentModel);
    } catch (error: any) {
      console.error(`Error getting model '${llmConfig.agentModel}' for agent '${llmConfig.agentName}':`, error);
      throw new Error(`Failed to retrieve model '${llmConfig.agentModel}'. Ensure it is correctly configured in 'src/ai/genkit.ts'. Details: ${error.message}`);
    }

    // Resolve the tools selected in the configuration to actual Genkit Tool instances.
    const agentToolsToPass: Tool[] = [];
    if (llmConfig.toolsDetails) {
      for (const toolDetail of llmConfig.toolsDetails) {
        if (toolDetail.genkitToolName) {
          if (allKnownGenkitTools.hasOwnProperty(toolDetail.genkitToolName)) {
            const tool = allKnownGenkitTools[toolDetail.genkitToolName];
            if (tool) {
              agentToolsToPass.push(tool); // Add the implemented tool.
            } else {
              // Tool is known (in `allKnownGenkitTools`) but its implementation is `undefined`.
              console.warn(`Tool '${toolDetail.genkitToolName}' is known but not yet implemented. Agent: ${llmConfig.agentName}`);
            }
          } else {
            // Tool name from config doesn't match any key in `allKnownGenkitTools`.
            console.warn(`Unknown tool '${toolDetail.genkitToolName}' configured for agent '${llmConfig.agentName}' and will be ignored.`);
          }
        }
      }
    }

    // TODO: Consider adding try-catch blocks around each ai.defineAgent call if the Genkit SDK throws specific, 
    // catchable errors for issues like duplicate agent names, invalid tool definitions, etc. 
    // For now, generic errors will propagate upwards.
    const agent = await ai.defineAgent({
      name: llmConfig.agentName,
      description: llmConfig.agentDescription, // General description for discoverability.
      model: model, // The Genkit model instance.
      instructions: llmConfig.systemPromptGenerated, // The core instructions for the LLM.
      tools: agentToolsToPass, // Resolved Genkit tools.
      config: {
        temperature: llmConfig.agentTemperature, // Model-specific configuration.
      },
    }) as LlmAgent; // Cast to LlmAgent for type safety, though defineAgent returns a generic Agent.

    definedAgents.set(llmConfig.id, agent); // Store the defined agent in the in-memory map.
    return agent;

  // Logic for Workflow Agent type
  } else if (config.agentType === 'workflow') {
    const wfConfig = config; // Use the general config type, as workflow fields are optional on it.

    // Validate detailedWorkflowType as it's crucial for defining the correct workflow agent.
    if (!wfConfig.detailedWorkflowType || !['sequential', 'parallel', 'loop'].includes(wfConfig.detailedWorkflowType)) {
      throw new Error(`Workflow agent configuration requires a valid detailedWorkflowType ('sequential', 'parallel', or 'loop'). Received: '${wfConfig.detailedWorkflowType}'.`);
    }

    let agent: Agent;
    // Determine the description: prioritize specific workflow description, then system prompt, then general agent description.
    const description = wfConfig.systemPromptGenerated || wfConfig.workflowDescription || wfConfig.agentDescription;

    switch (wfConfig.detailedWorkflowType) {
      case 'sequential':
        agent = await ai.defineAgent({
          name: wfConfig.agentName,
          description: description,
          agents: [], // TODO: Implement sub-agent definition and linking. This will require UI changes to select/order sub-agents and logic here to retrieve and pass their Agent[] references.
        }, SequentialAgent); // Specify the Genkit SequentialAgent constructor.
        break;
      case 'parallel':
        agent = await ai.defineAgent({
          name: wfConfig.agentName,
          description: description,
          agents: [], // TODO: Implement sub-agent definition and linking (similar to SequentialAgent).
        }, ParallelAgent); // Specify the Genkit ParallelAgent constructor.
        break;
      case 'loop':
        agent = await ai.defineAgent({
          name: wfConfig.agentName,
          description: description,
          agents: [], // TODO: Implement sub-agent definition and linking. The sub-agent(s) here are what will be looped.
          maxIterations: wfConfig.loopMaxIterations || undefined, // Optional max iterations from config.
          // The `runUntil` function determines if the loop should continue.
          runUntil: async (context, history) => {
            // TODO: Implement sophisticated loop termination logic based on `wfConfig` fields
            // (e.g., loopTerminationConditionType, loopExitToolName, loopExitStateKey, loopExitStateValue).
            // This function should return `true` to continue looping, `false` to stop.
            // It can inspect `context` (for shared agent state, if implemented) 
            // and `history` (for sub-agent outputs, tool signals, etc.).
            
            // Example: Basic check for maxIterations.
            // Note: `history.length` might not directly correspond to iterations if multiple sub-agents or tools run per loop.
            // A more robust counter might be needed in `context` or based on specific history events.
            if (wfConfig.loopMaxIterations && history.length >= wfConfig.loopMaxIterations * 2) { // Crude assumption: 2 history entries per iteration.
                 console.log(`LoopAgent '${wfConfig.agentName}' reached maxIterations based on history length.`);
                 return false; // Stop looping.
            }
            
            // Placeholder: Default to continue if no other condition is met.
            // In a real scenario, if `maxIterations` is not set, other conditions (e.g., sub-agent signal) must be defined
            // to prevent infinite loops.
            return true; 
          },
          // TODO: Connect loopTerminationConditionType, loopExitToolName, loopExitStateKey, loopExitStateValue from `wfConfig` 
          // to the `runUntil` logic above for more controlled loop termination.
        }, LoopAgent); // Specify the Genkit LoopAgent constructor.
        break;
      default:
        // This case should ideally not be reached if detailedWorkflowType is validated, but acts as a safeguard.
        throw new Error(`Unknown detailedWorkflowType: '${wfConfig.detailedWorkflowType}' for workflow agent '${wfConfig.agentName}'.`);
    }

    definedAgents.set(wfConfig.id, agent);
    return agent;

  // Logic for Custom Agent type
  } else if (config.agentType === 'custom') {
    const customConfig = config as SavedAgentConfiguration; // Use general config, custom fields are optional.

    // Validate the customLogicDescription as it's key for the placeholder's behavior.
    if (!customConfig.customLogicDescription || typeof customConfig.customLogicDescription !== 'string' || customConfig.customLogicDescription.trim() === '') {
      throw new Error('Custom agent configuration requires a valid customLogicDescription (non-empty string).');
    }

    /**
     * Placeholder implementation for the `_run_async_impl` method of a CustomAgent.
     * In a real application, this would be replaced by or delegate to specific, registered
     * functions based on `customConfig.agentName` or another identifier.
     * @param {Agent} this - The Agent instance (bound by Genkit).
     * @param {any} input - The input provided to the agent.
     * @param {any} context - The agent execution context (can be used for state, history, etc.).
     * @returns {Promise<any>} The result of the agent's execution.
     */
    async function placeholderRunAsyncImpl(this: Agent, input: any, context: any) { 
      console.log(`CustomAgent '${this.name}' (Placeholder Implementation) executed with input:`, input);
      // The customLogicDescription is stored in metadata and can be accessed here.
      console.log(`CustomLogicDescription for '${this.name}':`, (this.metadata?.customLogicDescription || 'Not provided'));

      // Optional: Example of a simple LLM call using the customLogicDescription.
      // This demonstrates how a custom agent might internally use an LLM or other tools.
      // This requires careful error handling and ensuring `ai.getModel` and `ai.generate` are correctly used.
      /*
      try {
        const llmResponse = await ai.generate({
          model: ai.getModel(customConfig.agentModel || 'googleai/gemini-1.5-flash-latest'), // Use specified model or a default.
          prompt: { text: `Instruction: ${customConfig.customLogicDescription}\nInput: ${JSON.stringify(input)}` },
          output: { format: 'text' }
        });
        return llmResponse.text();
      } catch (llmError) {
        console.error(`Error in CustomAgent's placeholder LLM call for '${this.name}':`, llmError);
        return `Error during LLM execution in custom agent '${this.name}'.`;
      }
      */

      // Return a message indicating placeholder execution and referencing the description.
      return `CustomAgent '${this.name}' (Placeholder) executed. Description: '${(this.metadata?.customLogicDescription || 'N/A')}'. Input: ${JSON.stringify(input)}. Full implementation requires backend code changes.`;
    }

    const agent = await ai.defineAgent({
      name: customConfig.agentName,
      description: customConfig.systemPromptGenerated || customConfig.customLogicDescription || customConfig.agentDescription,
      _run_async_impl: placeholderRunAsyncImpl, // Assign the custom execution logic.
      metadata: { customLogicDescription: customConfig.customLogicDescription }, // Store description for access within `_run_async_impl`.
      tools: [], // TODO: Decide if CustomAgents can/should have tools configured in the same way as LlmAgents via UI.
                 // If so, tool resolution logic similar to LlmAgent would be needed here.
      // TODO: Implement a backend registry for specific custom agent logic. 
      // The current placeholder `_run_async_impl` is used for all custom agents. 
      // A registry (e.g., a Map<string, Function>) could map `customConfig.agentName` or a unique ID 
      // (perhaps a new field `customLogicIdentifier` in `SavedAgentConfiguration`) to specific `_run_async_impl` functions.
    });

    definedAgents.set(customConfig.id, agent);
    return agent;

  } else {
    // Fallback for any agentType not explicitly handled above.
    const errorMessage = `Agent type '${config.agentType}' is not supported or not yet implemented. Please choose from 'llm', 'workflow', or 'custom'.`;
    console.warn(errorMessage); // Log for server-side awareness.
    throw new Error(errorMessage); // Throw error to be caught by the API route.
  }
}

/**
 * Retrieves a previously defined Genkit agent from the in-memory store.
 *
 * @param {string} agentId - The unique identifier of the agent to retrieve (matches `SavedAgentConfiguration.id`).
 * @returns {Agent | undefined} The Genkit `Agent` instance if found, otherwise `undefined`.
 */
export function getDefinedAgent(agentId: string): Agent | undefined {
  return definedAgents.get(agentId);
}
