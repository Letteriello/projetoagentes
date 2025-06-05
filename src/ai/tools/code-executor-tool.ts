/**
 * @fileOverview Defines a Genkit tool for executing code snippets.
 * This tool uses `python-shell` to execute Python code snippets.
 * It takes the code and an optional timeout as input.
 * The output includes success status, stdout, stderr, execution time, and any system errors.
 * CRITICAL: Executing arbitrary code is inherently risky. While `python-shell` is used,
 * it is NOT a sandbox. A real-world implementation requires robust sandboxing
 * for security.
 */
import { ai } from '@/ai/genkit'; // Import the configured 'ai' instance
import { PythonShell, Options } from 'python-shell';
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
    // Executing arbitrary code is extremely dangerous. `python-shell` itself is NOT a full sandbox.
    // A real-world implementation MUST use a robust sandboxing mechanism (e.g., Docker containers,
    // gVisor, WebAssembly, or dedicated cloud execution services) to isolate code execution.
    // Key considerations for sandboxing:
    // - Isolate file system access.
    // - Disable or strictly control network access.
    // - Limit execution time, memory, and CPU usage.
    // - Run as a non-root user with minimal privileges.
    // - Consider that disallowing specific modules (e.g., 'os', 'subprocess') requires more
    //   advanced parsing or a custom Python environment, which is beyond `python-shell` alone.

    const effectiveTimeout = Math.min(timeoutMs || 5000, 30000); // Cap timeout at 30s

    if (language.toLowerCase() !== 'python') {
      console.warn(`[CodeExecutorTool] Language '${language}' not supported. Only 'python' is currently implemented with python-shell.`);
      return {
        success: false,
        error: `This tool currently only supports 'python' code execution. Language requested: ${language}`,
      };
    }

    console.log(`[CodeExecutorTool] Executing Python code via python-shell (timeout: ${effectiveTimeout}ms):`);
    console.log(">>>\n" + code + "\n<<<");

    return new Promise((resolve) => {
      const startTime = Date.now();

      const options: Options = {
        mode: 'text',
        pythonOptions: ['-B'], // Don't write .pyc files
        // Consider adding pythonPath here if a specific virtual env or restricted Python binary should be used.
        // For example: pythonPath: '/usr/bin/restricted-python',
        args: [], // No arguments passed to the script itself in this basic setup
        timeout: effectiveTimeout,
      };

      PythonShell.runString(code, options, function (err, results) {
        const executionTimeMs = Date.now() - startTime;
        let stdout = "";
        let stderr = "";

        if (results) {
          stdout = results.join('\n');
        }

        if (err) {
          console.error('[CodeExecutorTool] python-shell error:', err);
          stderr = err.stderr || (err.message && !err.killed ? err.message : '') || 'Unknown error during Python script execution.';

          if (err.killed) { // True if the process was killed due to timeout
            resolve({
              success: false,
              stdout, // Might have partial stdout
              stderr: `Execution timed out after ${effectiveTimeout}ms.\n${stderr}`.trim(),
              executionTimeMs,
              error: `Execution timed out after ${effectiveTimeout}ms.`,
            });
          } else if (err.exitCode !== undefined && err.exitCode !== 0) {
            resolve({
              success: false, // Script ran but had an error
              stdout,
              stderr,
              executionTimeMs,
              error: `Python script execution error (exit code: ${err.exitCode}).`,
            });
          } else {
            // Other python-shell errors (e.g., python not found, though that's less likely in a controlled env)
            resolve({
              success: false,
              stdout,
              stderr,
              executionTimeMs,
              error: `Failed to execute Python script: ${err.message || 'Unknown internal error.'}`,
            });
          }
        } else {
          // Success
          resolve({
            success: true,
            stdout,
            stderr, // Could still have stderr (e.g. warnings)
            executionTimeMs,
          });
        }
      });
    });
  }
);
