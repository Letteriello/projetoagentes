import { defineTool } from 'genkit';
import { z } from 'zod';

// Input and Output Schemas
const ReadFileInputSchema = z.object({
  filename: z.string().min(1, { message: "Filename cannot be empty." }).describe("The name of the file to simulate reading."),
});
const ReadFileOutputSchema = z.string().describe("The mocked content of the file.");

const WriteFileInputSchema = z.object({
  filename: z.string().min(1, { message: "Filename cannot be empty." }).describe("The name of the file to simulate writing to."),
  content: z.string().describe("The content to simulate writing into the file."),
});
const WriteFileOutputSchema = z.string().describe("A message confirming the simulated write operation.");

// Tool Definition
export const fileIoTool = defineTool(
  {
    name: 'fileIoTool',
    description: 'Simulates basic file input/output operations like reading and writing. This tool does not interact with a real file system; it uses mocked data.',
    actions: {
      readFile: {
        description: 'Simulates reading the content of a specified file. Takes a filename (string) as input and returns a predefined mock string as the file content.',
        inputSchema: ReadFileInputSchema,
        outputSchema: ReadFileOutputSchema,
        async fn({ filename }: z.infer<typeof ReadFileInputSchema>): Promise<string> {
          // Mocked implementation
          console.log(`[fileIoTool.readFile] Called for filename: ${filename}`);
          return `Mocked content of ${filename}`;
        },
      },
      writeFile: {
        description: 'Simulates writing provided string content to a specified filename. Takes filename (string) and content (string) as input. Returns a success message. No actual file is created or modified.',
        inputSchema: WriteFileInputSchema,
        outputSchema: WriteFileOutputSchema,
        async fn({ filename, content }: z.infer<typeof WriteFileInputSchema>): Promise<string> {
          // Mocked implementation
          console.log(`[fileIoTool.writeFile] Called for filename: ${filename} with content: "${content}"`);
          // In a real scenario, this would interact with a file system or artifact service.
          return `Successfully wrote to ${filename} (simulated).`;
        },
      },
    },
  }
);

export default fileIoTool;
