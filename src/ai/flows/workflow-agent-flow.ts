import { defineFlow, Flow, runFlow, prompt } from 'genkit';
import { z } from 'zod';
import type {
  AgentConfigBase, // Assuming this might be needed for a fuller schema eventually
  WorkflowAgentConfig,
  WorkflowStep,
  AgentType,
  AgentFramework,
  WorkflowDetailedType,
  // Import other nested types if a more complete Zod schema is built
} from '@/types/agent-configs-new'; // Adjusted path

// Helper function to resolve a path string (e.g., "$step1_output.data.text") from the state object
function resolveValuePath(path: string, state: Record<string, any>): any {
  if (typeof path !== 'string' || !path.startsWith('$')) {
    // It's a literal value, not a path string, or not a string at all
    return path;
  }

  const parts = path.substring(1).split('.'); // Remove $ and split by dot
  let currentValue = state;
  for (const part of parts) {
    if (currentValue && typeof currentValue === 'object' && part in currentValue) {
      currentValue = currentValue[part];
    } else {
      console.warn(`[Workflow Flow] Could not resolve path "${path}" at part "${part}". Returning undefined.`);
      return undefined;
    }
  }
  return currentValue;
}

// Helper function to recursively resolve input mappings
function resolveInputMapping(mapping: any, state: Record<string, any>): any {
  if (typeof mapping === 'string') {
    return resolveValuePath(mapping, state);
  }
  if (Array.isArray(mapping)) {
    return mapping.map(item => resolveInputMapping(item, state));
  }
  if (typeof mapping === 'object' && mapping !== null) {
    const resolvedObject: Record<string, any> = {};
    for (const key in mapping) {
      resolvedObject[key] = resolveInputMapping(mapping[key], state);
    }
    return resolvedObject;
  }
  // If it's not a string, array, or object, return it as is (e.g., number, boolean)
  return mapping;
}

// Zod Schema for WorkflowStep
const workflowStepSchema: z.ZodType<WorkflowStep> = z.object({
  agentId: z.string(),
  inputMapping: z.record(z.any()), // Record<string, any>
  outputKey: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
});

// Zod Schema for WorkflowAgentConfig
// This is a simplified version focusing on relevant fields for this flow.
// A complete schema would require defining Zod counterparts for all nested types in AgentConfigBase.
const workflowAgentConfigSchema: z.ZodType<WorkflowAgentConfig> = z.object({
  // Fields from AgentConfigBase (simplified)
  type: z.literal('workflow'),
  framework: z.custom<AgentFramework>(), // Using z.custom for enum-like types from TS
  agentGoal: z.string(),
  agentTasks: z.array(z.string()).optional(), // Assuming AgentConfigBase has this
  systemPromptGenerated: z.string().optional(), // Added in a previous step
  // Optional fields from AgentConfigBase can be added here if needed by the flow
  // For now, keeping it focused on what workflowAgentRunnerFlow directly uses beyond workflow specific fields.

  // Fields specific to WorkflowAgentConfig
  workflowType: z.custom<WorkflowDetailedType>(),
  subAgents: z.array(z.string()).optional(),
  workflowConfig: z.record(z.any()).optional(),
  workflowSteps: z.array(workflowStepSchema).optional(),
  // Add new optional fields for loop termination to the Zod schema
  loopExitToolName: z.string().optional(),
  loopExitStateKey: z.string().optional(),
  loopExitStateValue: z.string().optional(), // Assuming string for now, adjust if complex types needed
}) as z.ZodType<WorkflowAgentConfig>; // Cast to ensure it matches the TS type for defineFlow

export const workflowAgentRunnerFlow: Flow<WorkflowAgentConfig, { status: string; message: string; simulatedOutputs?: any, iterations?: number }> = defineFlow(
  {
    name: 'workflowAgentRunnerFlow',
    inputSchema: workflowAgentConfigSchema,
    outputSchema: z.object({
      status: z.string(),
      message: z.string(),
      simulatedOutputs: z.any().optional(),
      iterations: z.number().optional(), // For loop workflows
    }),
    middleware: [],
  },
  async (config: WorkflowAgentConfig) => {
    console.log(`[Workflow Flow] Starting workflow: "${config.agentGoal}", Type: ${config.workflowType}`);

    if (!config.workflowSteps || config.workflowSteps.length === 0) {
      console.log("[Workflow Flow] No steps defined.");
      return { status: "COMPLETED_NO_STEPS", message: "Workflow completed: No steps." };
    }

    const globalSimulatedOutputs: Record<string, any> = {}; // Stores outputs across all iterations for loops

    if (config.workflowType === 'loop') {
      let currentIteration = 0;
      const maxIterationsFromConfig = config.terminationConditions?.find(c => c.type === 'max_iterations')?.value as number | undefined;
      const maxIterations = maxIterationsFromConfig ?? 10; // Default to 10 if not specified

      console.log(`[Workflow Flow] Starting LOOP. Max iterations: ${maxIterations}`);
      if(config.loopExitToolName) console.log(`  Exit on tool: ${config.loopExitToolName}`);
      if(config.loopExitStateKey) console.log(`  Exit on state: ${config.loopExitStateKey} = ${config.loopExitStateValue}`);


      while (currentIteration < maxIterations) {
        currentIteration++;
        console.log(`\n[Workflow Flow] LOOP Iteration: ${currentIteration}`);
        const iterationOutputs: Record<string, any> = { ...globalSimulatedOutputs }; // Each iteration starts with global state, can overwrite

        for (let i = 0; i < config.workflowSteps.length; i++) {
          const step = config.workflowSteps[i];
          const stepIdentifier = step.name || step.agentId || `Step ${i + 1}`;
          console.log(`  [Iter ${currentIteration}] Executing Step: ${stepIdentifier}`);

          const actualInput = resolveInputMapping(step.inputMapping, iterationOutputs);
          console.log(`    [Iter ${currentIteration}] Actual Input: ${JSON.stringify(actualInput)}`);

          // Simulate step execution
          const simulatedStepOutput = {
            result: `Simulated output for ${step.agentId} (Iter ${currentIteration}, Step ${stepIdentifier})`,
            toolNameUsed: step.agentId, // Assuming agentId can be used as a tool name for simulation
            received_input: actualInput,
            timestamp: new Date().toISOString(),
          };

          if (step.outputKey) {
            iterationOutputs[step.outputKey] = simulatedStepOutput;
            globalSimulatedOutputs[step.outputKey] = simulatedStepOutput; // Persist in global for next iterations
            console.log(`    [Iter ${currentIteration}] Output stored to key "${step.outputKey}"`);
          }
        }

        // Check termination conditions
        let terminated = false;
        // 1. loopExitToolName
        if (config.loopExitToolName) {
          for (const key in iterationOutputs) {
            // Check if any output in the current iteration matches the tool name criteria
            // This is a simplified check; real tool call identification might be more complex
            if (iterationOutputs[key]?.toolNameUsed === config.loopExitToolName) {
              console.log(`[Workflow Flow] Terminating loop: Tool "${config.loopExitToolName}" executed.`);
              terminated = true;
              break;
            }
          }
        }
        if (terminated) break;

        // 2. loopExitStateKey / loopExitStateValue
        if (config.loopExitStateKey && config.loopExitStateValue !== undefined) {
          const stateValue = resolveValuePath(`$${config.loopExitStateKey}`, iterationOutputs); // Resolve from current iteration's state
          console.log(`  [Iter ${currentIteration}] Checking state termination: Key '${config.loopExitStateKey}', Value: '${stateValue}', Expected: '${config.loopExitStateValue}'`);
          if (stateValue !== undefined && String(stateValue) === String(config.loopExitStateValue)) {
            console.log(`[Workflow Flow] Terminating loop: State condition met (${config.loopExitStateKey} = ${config.loopExitStateValue}).`);
            terminated = true;
          }
        }
        if (terminated) break;

        // 3. Max iterations (checked by while loop condition, but good to log if it's the reason)
        if (currentIteration >= maxIterations && maxIterationsFromConfig) {
             console.log(`[Workflow Flow] Terminating loop: Max iterations (${maxIterations}) reached.`);
             // No 'terminated = true' needed as the while loop condition will handle it.
        }
      } // End of while loop

      return {
        status: "SUCCESS_LOOP_COMPLETED",
        message: `Loop workflow completed after ${currentIteration} iterations.`,
        simulatedOutputs: globalSimulatedOutputs,
        iterations: currentIteration,
      };

    } else { // Sequential, Parallel, Graph, StateMachine (currently treated as sequential)
      for (let i = 0; i < config.workflowSteps.length; i++) {
        const step = config.workflowSteps[i];
        const stepIdentifier = step.name || step.agentId || `Step ${i + 1}`;
        console.log(`\n[Workflow Flow] Executing Step ${i + 1}: ${stepIdentifier}`);

        const actualInput = resolveInputMapping(step.inputMapping, globalSimulatedOutputs);
        console.log(`  Actual Input: ${JSON.stringify(actualInput)}`);

        const simulatedStepOutput = {
          result: `Simulated output for ${step.agentId} (step: ${stepIdentifier})`,
          received_input: actualInput,
          timestamp: new Date().toISOString(),
        };

        if (step.outputKey) {
          globalSimulatedOutputs[step.outputKey] = simulatedStepOutput;
          console.log(`  Output stored to key "${step.outputKey}"`);
        }
      }
      console.log("\n[Workflow Flow] Workflow execution simulated successfully.");
      return { status: "SUCCESS", message: "Workflow execution simulated successfully.", simulatedOutputs: globalSimulatedOutputs };
    }
  }
);

// Example of how this flow might be called (for testing purposes, not part of the flow itself)
/*
async function testWorkflow() {
  const sampleConfig: WorkflowAgentConfig = {
    type: 'workflow',
    framework: 'genkit',
    agentGoal: 'Process an order',
    agentTasks: [], // Not directly used by this basic workflow runner but part of base
    workflowType: 'sequential',
    workflowSteps: [
      {
        agentId: 'inventoryCheckerAgent',
        name: 'Check Inventory',
        inputMapping: { item: 'product_id_123', quantity: 2 },
        outputKey: 'inventoryStatus',
        description: 'Checks if the item is in stock.',
      },
      {
        agentId: 'paymentProcessorAgent',
        name: 'Process Payment',
        inputMapping: { amount: 100, currency: 'USD', inventoryDetails: '$inventoryStatus' },
        outputKey: 'paymentConfirmation',
        description: 'Processes the payment for the order.',
      },
      {
        agentId: 'notificationAgent',
        name: 'Send Notification',
        inputMapping: { message: 'Order Confirmed!', paymentInfo: '$paymentConfirmation' },
        outputKey: 'notificationSent',
        description: 'Sends an order confirmation to the customer.',
      },
    ],
  };

  try {
    const result = await runFlow(workflowAgentRunnerFlow, sampleConfig);
    console.log('Workflow test result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Workflow test failed:', error);
  }
}

// To run the test:
// testWorkflow();
*/
