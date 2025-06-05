/**
 * @fileOverview Defines a Genkit tool for **simulated** invocation of custom user-defined Python functions.
 * CRITICAL: This tool is for demonstration purposes only and simulates execution.
 * Executing arbitrary user-provided code is extremely dangerous and requires robust sandboxing.
 */

import { ai } from '@/ai/genkit'; // Import the configured 'ai' instance
import { z } from 'zod';

const SECURITY_WARNING_TEXT = "CRITICAL: This is a simulated tool. Executing arbitrary user-defined code in a real environment without extreme sandboxing measures is a severe security vulnerability. This tool does NOT provide such sandboxing and only simulates the concept.";

// 1. Define Input Schema
export const CustomFunctionInvokerInputSchema = z.object({
  userDefinedPythonCode: z.string().describe(
    "The Python code string defining the function to be invoked. IMPORTANT: Executing arbitrary user code is a major security risk. This tool is a simulation and does not execute the code directly in a production-safe sandbox."
  ),
  inputArgs: z.record(z.any()).optional().describe(
    "An object containing arguments to be passed to the user-defined function. For simulation, these args will be echoed back."
  ),
  functionName: z.string().optional().describe(
    "Optional: The name of the function to call within the provided code. If not provided, the simulation assumes a single, callable block."
  ),
});

// 2. Define Output Schema
// Success and error fields are removed. Output represents a 'successful' simulation.
// Errors are thrown for simulation failures.
export const CustomFunctionInvokerOutputSchema = z.object({
  result: z.any().optional().describe("The simulated result from the function. May include a message about the simulation."),
  securityWarning: z.string().describe("A constant security warning about the dangers of this type of tool if implemented for real. This warning is always present."),
});

// 3. Create customFunctionInvokerTool
export const customFunctionInvokerTool = ai.defineTool(
  {
    name: 'customPythonFunctionInvoker',
    description:
      "SIMULATED: 'Invokes' a user-defined Python function provided as a string. CRITICAL SECURITY WARNING: Executing arbitrary code is extremely dangerous. This tool is for demonstration and simulates execution only. A real version would require a very secure sandboxed environment. This tool will always include a security warning in its output.",
    inputSchema: CustomFunctionInvokerInputSchema,
    outputSchema: CustomFunctionInvokerOutputSchema, // Updated schema
  },
  async (input: z.infer<typeof CustomFunctionInvokerInputSchema>): Promise<z.infer<typeof CustomFunctionInvokerOutputSchema>> => {
    console.log('[CustomFunctionInvokerTool] Received input:', {
      functionName: input.functionName,
      inputArgs: input.inputArgs,
      codeSnippet: input.userDefinedPythonCode.substring(0, 100) + '...',
    });

    // Always include the security warning.
    // The primary purpose of this tool in its current state is to demonstrate the *concept*
    // and its associated risks, rather than to be a functional executor.

    if (input.userDefinedPythonCode.toLowerCase().includes("error_trigger")) {
      const errorMsg = "Simulated error: 'error_trigger' keyword detected in user-defined code. This indicates a simulated failure condition.";
      console.warn(`[CustomFunctionInvokerTool] ${errorMsg}`);
      // Even when throwing an error, it might be useful to convey the constant security risk if this were a real tool.
      // However, standard error handling usually doesn't mix output fields with error messages.
      // The description of the tool should carry the primary security warning.
      // For this refactor, the error itself will be the focus.
      throw new Error(`${errorMsg} ${SECURITY_WARNING_TEXT}`);
    }

    // Simulate successful invocation
    const simulatedOutput = {
      message: "Simulated execution of user-defined Python function.",
      details: "This tool did NOT actually execute the provided Python code.",
      providedFunctionName: input.functionName || "N/A (no function name specified)",
      receivedArgs: input.inputArgs || {},
      mockedOutput: `Simulated output for ${input.functionName || 'unnamed function'}: ${Math.random().toString(36).substring(7)}`,
      notes: "In a real scenario, the actual stdout, stderr, and return value would be captured from a sandboxed environment."
    };

    console.log('[CustomFunctionInvokerTool] Simulating successful invocation.');
    return { // Success: directly return result and securityWarning
      result: simulatedOutput,
      securityWarning: SECURITY_WARNING_TEXT, // Ensure warning is always present
    };
  }
);

// Ensure the tool is exported
// export { customFunctionInvokerTool };
