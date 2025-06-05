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
// Success and error fields are removed. Output represents successful execution.
export const CodeExecutorOutputSchema = z.object({
  stdout: z.string().optional().describe("The standard output (stdout) from the code execution."),
  stderr: z.string().optional().describe("The standard error (stderr) from the code execution. Non-empty stderr doesn't always mean failure, could be warnings or errors from the script itself."),
  executionTimeMs: z.number().optional().describe("The time taken for execution in milliseconds."),
  // Note: If the script itself has an error (e.g. Python exception), it would typically be in stderr.
  // The tool itself only throws errors for setup/execution environment issues.
});

// 3. Create codeExecutorTool using defineTool
export const codeExecutorTool = ai.defineTool(
  {
    name: 'codeExecutor',
    description:
      "Executes a given code snippet, defaulting to Python. " + // Sandboxing note removed for brevity here, but important.
      "Returns stdout, stderr, and execution time. Specify the code, and optionally language (python only for now) and timeout (max 30s).",
    inputSchema: CodeExecutorInputSchema,
    outputSchema: CodeExecutorOutputSchema, // Updated schema
  },
  async (input: z.infer<typeof CodeExecutorInputSchema>): Promise<z.infer<typeof CodeExecutorOutputSchema>> => {
    const { language, code, timeoutMs } = input;
    console.log('[CodeExecutorTool] Received parameters:', { language, code, timeoutMs });

    const effectiveTimeout = Math.min(timeoutMs || 5000, 30000); // Cap timeout at 30s

    if (language.toLowerCase() !== 'python') {
      const errorMsg = `Language '${language}' not supported. Only 'python' is currently implemented.`;
      console.error(`[CodeExecutorTool] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    console.log(`[CodeExecutorTool] Executing Python code via python-shell (timeout: ${effectiveTimeout}ms):`);
    console.log(">>>\n" + code + "\n<<<");

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      const options: Options = {
        mode: 'text',
        pythonOptions: ['-B'], // Don't write .pyc files
        args: [],
        timeout: effectiveTimeout,
      };

      PythonShell.runString(code, options, function (err, results) {
        const executionTimeMs = Date.now() - startTime;
        let stdout = results ? results.join('\n') : "";
        // stderr from python-shell's err object is usually the most relevant for script errors
        let stderr = err?.stderr || (err?.message && !err?.killed ? err.message : '');

        if (err) {
          console.error('[CodeExecutorTool] python-shell execution error:', {
            message: err.message,
            killed: err.killed,
            exitCode: err.exitCode,
            stderr: err.stderr, // Log the raw stderr from the err object
            stdoutFromErr: err.stdout, // Log stdout if available on err
          });

          // Construct a more informative error message
          let specificErrorMsg = `Python script execution failed`;
          if (err.killed) {
            specificErrorMsg = `Execution timed out after ${effectiveTimeout}ms.`;
            stderr = stderr ? `${specificErrorMsg}\n${stderr}` : specificErrorMsg; // Prepend timeout message to stderr
          } else if (err.exitCode !== undefined && err.exitCode !== 0) {
            specificErrorMsg = `Script exited with code ${err.exitCode}.`;
            // stderr should already contain the Python exception, if any.
          } else { // Other errors like python not found, etc.
            specificErrorMsg = err.message || 'Unknown internal error with python-shell.';
          }
          // Reject the promise with an Error object
          // Include stdout and stderr in the error object if needed for richer error reporting by the caller,
          // but the primary error message should be concise.
          const executionError = new Error(specificErrorMsg);
          // Attach additional info if desired, though not standard for Error objects
          // (executionError as any).stdout = stdout;
          // (executionError as any).stderr = stderr; // The most relevant stderr is already in the message or separate
          // (executionError as any).executionTimeMs = executionTimeMs;
          reject(executionError);

        } else {
          // Success: script ran without python-shell throwing an error (exit code 0)
          // stderr might still contain Python warnings, which is fine.
          if (stderr) {
             console.warn(`[CodeExecutorTool] Python script executed with stderr (warnings/info):`, stderr);
          }
          resolve({
            stdout,
            stderr: stderr || undefined, // Ensure it's undefined if empty, not ""
            executionTimeMs,
          });
        }
      });
    });
  }
);
