import { defineFlow } from '../../core/flow';
import { z } from 'zod';
import { ArtifactStorageType } from '../../types/agent-configs-new'; // Ensured path is correct
import path from 'path'; // Import path for joining paths

// Define the enum for storageType within the flow file or ensure it's correctly imported if defined elsewhere.
// For this task, we'll use the z.enum directly as specified.

export const artifactManagementFlow = defineFlow(
  {
    name: 'artifactManagementFlow',
    inputSchema: z.object({
      fileName: z.string().min(1, "fileName cannot be empty."), // Added min validation
      storageType: z.enum(["local", "cloud", "memory", "filesystem"]), // Matches ArtifactStorageType values
      fileData: z.string(), // Placeholder for actual file content, can be empty for simulation
      cloudStorageBucket: z.string().optional(),
      localStoragePath: z.string().optional(),
    }),
    outputSchema: z.object({
      filePath: z.string(),
      message: z.string(),
    }),
  },
  async (input) => {
    console.log(`[artifactManagementFlow] Called with input: ${JSON.stringify(input, null, 2)}`);
    let filePath = '';
    let message = '';

    switch (input.storageType) {
      case 'memory':
        filePath = `mem://${input.fileName}`;
        message = `Artifact '${input.fileName}' successfully simulated in memory.`;
        console.log(`[artifactManagementFlow] ${message}`);
        break;

      case 'filesystem':
      case 'local': // Treat 'local' as 'filesystem' as per instructions
        if (!input.localStoragePath) {
          console.error("[artifactManagementFlow] Error: Local storage path is required for filesystem/local storage.");
          throw new Error('Local storage path is required for filesystem/local storage.');
        }
        // Using path.join for cross-platform compatibility and safety.
        filePath = `file://${path.join(input.localStoragePath, input.fileName)}`;
        message = `Artifact '${input.fileName}' successfully simulated on filesystem at: ${filePath}.`;
        console.log(`[artifactManagementFlow] ${message}`);
        break;

      case 'cloud':
        if (!input.cloudStorageBucket) {
          console.error("[artifactManagementFlow] Error: Cloud storage bucket is required for cloud storage.");
          throw new Error('Cloud storage bucket is required for cloud storage.');
        }
        filePath = `cloud://${input.cloudStorageBucket}/${input.fileName}`;
        message = `Artifact '${input.fileName}' successfully simulated in cloud storage bucket '${input.cloudStorageBucket}' at: ${filePath}.`;
        console.log(`[artifactManagementFlow] ${message}`);
        break;

      default:
        // This case should ideally not be reached if input validation is exhaustive,
        // but it's good practice for unhandled enum values.
        const exhaustiveCheck: never = input.storageType;
        console.error(`[artifactManagementFlow] Error: Unsupported storage type: ${exhaustiveCheck}`);
        throw new Error(`Unsupported storage type: ${exhaustiveCheck}`);
    }

    return { filePath, message };
  }
);
