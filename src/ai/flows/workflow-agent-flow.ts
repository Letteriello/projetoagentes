import { defineFlow, Flow } from 'genkit'; // runFlow e prompt removidos, pois não existem
import { z } from 'zod';
import type {
  AgentConfigBase, // Assuming this might be needed for a fuller schema eventually
  WorkflowAgentConfig,
  WorkflowStep,
  AgentType,
  AgentFramework,
  WorkflowDetailedType,
  // Import other nested types if a more complete Zod schema is built
} from '@/types/agent-core'; // Updated path

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
// This é uma versão simplificada focando nos campos relevantes para este fluxo.
// Adicionada loopExitToolName e garantido que workflowSteps é array.
const workflowAgentConfigSchema = z.object({
  // ... outros campos ...
  loopExitToolName: z.string().optional(),
  // Fields from AgentConfigBase (simplified)
  type: z.literal('workflow'),
  framework: z.enum(['genkit', 'langchain', 'crewai', 'other']),
  agentGoal: z.string(),
  workflowType: z.enum(['sequential', 'parallel', 'conditional', 'loop']),
  agentModel: z.string(),
  agentTemperature: z.number().optional(),
  // Optional fields from AgentConfigBase can be added here if needed by the flow
  // For now, keeping it focused on what workflowAgentRunnerFlow directly uses beyond workflow specific fields.

  // Fields specific to WorkflowAgentConfig
  workflowSteps: z.array(workflowStepSchema),
  agentTasks: z.array(z.string()).optional(),
  subAgents: z.array(z.string()).optional(),
  terminationConditions: z.object({
    maxIterations: z.number().optional(),
    successCondition: z.string().optional(),
    failureCondition: z.string().optional()
  }).optional(),
  loopStateKey: z.string().optional(),
  loopExitStateValue: z.string().optional()
}); // Não usar cast para ZodType<WorkflowAgentConfig>

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
      const maxIterationsFromConfig = config.terminationConditions?.maxIterations as number | undefined;
      const maxIterations = maxIterationsFromConfig ?? 10; // Default to 10 if not specified

      console.log(`[Workflow Flow] Starting LOOP. Max iterations: ${maxIterations}`);
      if(config.loopExitToolName) console.log(`  Exit on tool: ${config.loopExitToolName}`);
      if(config.loopStateKey) console.log(`  Exit on state: ${config.loopStateKey} = ${config.loopExitStateValue}`);


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
        if (config.loopStateKey && config.loopExitStateValue !== undefined) {
          const stateValue = resolveValuePath(`$${config.loopStateKey}`, iterationOutputs); // Resolve from current iteration's state
          console.log(`  [Iter ${currentIteration}] Checking state termination: Key '${config.loopStateKey}', Value: '${stateValue}', Expected: '${config.loopExitStateValue}'`);
          if (stateValue !== undefined && String(stateValue) === String(config.loopExitStateValue)) {
            console.log(`[Workflow Flow] Terminating loop: State condition met (${config.loopStateKey} = ${config.loopExitStateValue}).`);
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

    } else if (config.workflowType === 'conditional') {
      // Lógica para workflow condicional
      console.log("[Workflow Flow] Executing Conditional Workflow");
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
      console.log("\n[Workflow Flow] Conditional workflow execution simulated successfully.");
      return { status: "SUCCESS", message: "Conditional workflow execution simulated successfully.", simulatedOutputs: globalSimulatedOutputs };

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
