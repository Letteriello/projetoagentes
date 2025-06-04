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
}) as z.ZodType<WorkflowAgentConfig>; // Cast to ensure it matches the TS type for defineFlow

export const workflowAgentRunnerFlow: Flow<WorkflowAgentConfig, { status: string; message: string; simulatedOutputs?: any }> = defineFlow(
  {
    name: 'workflowAgentRunnerFlow',
    inputSchema: workflowAgentConfigSchema,
    outputSchema: z.object({
      status: z.string(),
      message: z.string(),
      simulatedOutputs: z.any().optional(), // To store simulated outputs from steps
    }),
    middleware: [], // Add auth or other middleware if needed
  },
  async (config: WorkflowAgentConfig) => {
    console.log(`[Workflow Flow] Starting workflow execution for agent with goal: "${config.agentGoal}"`);
    console.log(`[Workflow Flow] Workflow Type: ${config.workflowType}`);

    const simulatedOutputs: Record<string, any> = {};

    if (!config.workflowSteps || config.workflowSteps.length === 0) {
      console.log("[Workflow Flow] No steps found in the workflow configuration.");
      return {
        status: "COMPLETED_NO_STEPS",
        message: "Workflow completed, but no steps were defined.",
        simulatedOutputs,
      };
    }

    for (let i = 0; i < config.workflowSteps.length; i++) {
      const step = config.workflowSteps[i];
      const stepIdentifier = step.name || step.agentId || `Unnamed Step ${i + 1}`;

      console.log(`\n[Workflow Flow] Executing Step ${i + 1}: ${stepIdentifier}`);
      console.log(`  Agent ID: ${step.agentId}`);
      console.log(`  Input Mapping (original): ${JSON.stringify(step.inputMapping, null, 2)}`);
      console.log(`  Output Key: ${step.outputKey}`);

      // Resolve input mappings using the new logic
      const actualInput = resolveInputMapping(step.inputMapping, simulatedOutputs);

      console.log(`  Actual Input (after resolution): ${JSON.stringify(actualInput, null, 2)}`);

      console.log(`  Simulating execution of agent ${step.agentId}...`);
      // In a real scenario, you would call another flow or service here:
      // e.g., const stepOutput = await runFlow(someOtherAgentFlow, actualInput);
      // For simulation, we create a generic output structure.
      const simulatedStepOutput = {
        result: `Simulated output for agent ${step.agentId} (step: ${stepIdentifier})`,
        received_input: actualInput, // Include the actual input that was resolved
        timestamp: new Date().toISOString(),
      };

      if (!step.outputKey) {
        console.warn(`[Workflow Flow] Warning: Step "${stepIdentifier}" does not have an outputKey. Its output will not be available to subsequent steps.`);
      } else {
        simulatedOutputs[step.outputKey] = simulatedStepOutput;
        console.log(`  Simulated output for step ${i + 1} (${stepIdentifier}) stored with key "${step.outputKey}": ${JSON.stringify(simulatedStepOutput, null, 2)}`);
      }
    }

    console.log("\n[Workflow Flow] Workflow execution simulation completed.");
    return {
      status: "SUCCESS",
      message: "Workflow execution simulated successfully.",
      simulatedOutputs,
    };
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
