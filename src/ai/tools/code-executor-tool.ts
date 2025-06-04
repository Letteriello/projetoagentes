/**
 * @fileOverview Defines a Genkit tool for executing code snippets.
 * This tool simulates code execution, currently supporting only Python.
 * It takes the language, code, and an optional timeout as input.
 * The output includes success status, stdout, stderr, execution time, and any system errors.
 * CRITICAL: This is a simulation. A real-world implementation requires robust sandboxing
 * for security, which is extensively commented on within the tool's logic.
 */
import { ai } from '@/ai/genkit'; // Import the configured 'ai' instance
import { z } from 'zod';

// 1. Define Input Schema
export const CodeExecutorInputSchema = z.object({
  language: z.string().default("python").describe("The programming language of the code snippet. Defaults to 'python'."),
  code: z.string().describe("The actual code to execute."),
  timeoutMs: z.number().optional().default(5000).describe("Optional execution timeout in milliseconds. Max recommended: 30000."),
});

// 2. Define Output Schema
export const CodeExecutorOutputSchema = z.object({
  success: z.boolean().describe("Indicates whether the code execution was successful (completed without unhandled exceptions or major errors)."),
  stdout: z.string().optional().describe("The standard output (stdout) from the code execution."),
  stderr: z.string().optional().describe("The standard error (stderr) from the code execution. Non-empty stderr doesn't always mean failure, could be warnings."),
  executionTimeMs: z.number().optional().describe("The time taken for execution in milliseconds."),
  error: z.string().optional().describe("An error message if the execution itself failed to start or due to a critical issue (e.g., language not supported, timeout before start, sandbox setup failure)."),
});

// 3. Create codeExecutorTool using defineTool
export const codeExecutorTool = ai.defineTool(
  {
    name: 'codeExecutor',
    description:
      "Executes a given code snippet, defaulting to Python, in a sandboxed environment. " +
      "Returns stdout, stderr, and execution status. Specify the code, and optionally the language and timeout (max 30s). " +
      "IMPORTANT: Direct file system access, network calls, or use of sensitive OS modules are heavily restricted or disabled for security.",
    inputSchema: CodeExecutorInputSchema,
    outputSchema: CodeExecutorOutputSchema,
  },
  async (input: z.infer<typeof CodeExecutorInputSchema>) => {
    const { language, code, timeoutMs } = input;
    console.log('[CodeExecutorTool] Received parameters:', { language, code, timeoutMs });

    // CRITICAL SECURITY NOTE:
    // Executing arbitrary code is extremely dangerous. A real-world implementation
    // MUST use a robust sandboxing mechanism to isolate the code execution environment.
    // This simulation is NOT secure and is for demonstration purposes only.
    //
    // Options for sandboxing include:
    // 1. Docker Containers: Spin up a new, short-lived Docker container for each execution.
    //    Define strict resource limits (CPU, memory, network policies).
    // 2. gVisor: A container sandbox that provides a secure isolation boundary.
    // 3. WebAssembly (Wasm): If the language can compile to Wasm, run it in a Wasm runtime.
    //    Wasm provides a sandboxed environment by default.
    // 4. Dedicated Cloud Services: AWS Lambda, Google Cloud Functions, Azure Functions, or specialized
    //    code execution services (e.g., Judge0, Piston API) often provide sandboxing.
    // 5. Virtual Machines: Heavier weight, but provides strong isolation.
    //
    // Key considerations for a real implementation:
    // - Isolate file system access (use ephemeral storage or highly restricted mounts).
    // - Disable or strictly control network access.
    // - Limit execution time (timeout).
    // - Limit memory and CPU usage.
    // - Run as a non-root user with minimal privileges.
    // - Sanitize input code for known malicious patterns (though this is hard to get perfect).
    // - Regularly update the execution environment and dependencies.

    const effectiveTimeout = Math.min(timeoutMs || 5000, 30000); // Cap timeout at 30s

    if (language.toLowerCase() !== 'python') {
      console.warn(`[CodeExecutorTool] Language '${language}' not supported by this simulation.`);
      return {
        success: false,
        error: `This code execution simulation currently only supports 'python'. Language requested: ${language}`,
      };
    }

    // Simulated Python Execution Logic:
    console.log(`[CodeExecutorTool] Simulating Python code execution (timeout: ${effectiveTimeout}ms):`);
    console.log(">>>\n" + code + "\n<<<");

    // Simulate timeout before actual "execution" for testing
    // if (effectiveTimeout < 50) { // Arbitrary short timeout for testing timeout handling
    //   await new Promise(resolve => setTimeout(resolve, effectiveTimeout + 100)); // Simulate work that exceeds timeout
    //   return { success: false, error: `Execution timed out after ${effectiveTimeout}ms (simulated pre-execution).`};
    // }

    const startTime = Date.now();
    let stdout = "";
    let stderr = "";
    let success = true;
    let simError = "";

    try {
      if (code.trim() === "print('hello world')" || code.trim() === "print(\"hello world\")") {
        stdout = "hello world\n";
      } else if (code.includes("1 / 0")) {
        // Note: In a real sandbox, the process would exit with an error, and you'd capture stderr.
        // The `success` flag might be true if the process itself ran, but stderr would indicate the Python error.
        // For this simulation, we'll set success to false for clear error propagation.
        success = false;
        stderr = "Traceback (most recent call last):\n  File \"<stdin>\", line 1, in <module>\nZeroDivisionError: division by zero";
      } else if (code.includes("import os") || code.includes("import sys") || code.includes("subprocess") || code.includes("open(")) {
        success = false; // Or true, but with a security warning in stderr. Let's make it a failure for simulation.
        stderr = "SimulatedSecurityError: For security reasons, this simulation restricts modules like 'os', 'sys', 'subprocess' and functions like 'open()'. Such operations would be blocked in a real sandboxed environment.";
      } else if (code.includes("while True: pass")) {
        // Simulate a timeout for an infinite loop
        await new Promise(resolve => setTimeout(resolve, effectiveTimeout + 100)); // Exceed timeout
        // This path will likely not be reached in a real timeout scenario handled by the sandbox runner.
        // The sandbox runner would kill the process.
        // For simulation, we'll set an error as if the runner reported a timeout.
        throw new Error("SIMULATED_TIMEOUT");
      } else {
        // Generic successful execution simulation
        stdout = `Simulated output for Python code:\n${code}\nResult: ${Math.random() * 100}`;
      }
    } catch (e: any) {
        if (e.message === "SIMULATED_TIMEOUT") {
            success = false;
            simError = `Execution timed out after ${effectiveTimeout}ms (simulated).`;
            stderr = "TimeoutError: Code execution took too long.";
        } else {
            success = false;
            simError = `An unexpected error occurred during simulated execution: ${e.message}`;
            stderr = e.stack || e.message;
        }
    }

    const executionTimeMs = Date.now() - startTime;

    if (executionTimeMs > effectiveTimeout && !simError.includes("timed out")) {
        // This case handles if the simulation logic itself was slow but didn't hit the SIMULATED_TIMEOUT path.
        // A real sandbox would have terminated the process externally.
        success = false;
        simError = `Execution exceeded timeout of ${effectiveTimeout}ms. Actual: ${executionTimeMs}ms.`;
        stderr = stderr ? `${stderr}\nTimeoutError: Execution took too long.` : "TimeoutError: Execution took too long.";
    }


    return {
      success,
      stdout: success ? stdout : "", // Typically no stdout on failure, but depends on what was captured before error.
      stderr,
      executionTimeMs,
      error: simError, // This 'error' is for failures of the execution system itself (timeout, sandbox error)
    };
  }
);
