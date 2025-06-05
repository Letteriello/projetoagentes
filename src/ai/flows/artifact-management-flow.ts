import { defineFlow } from '@genkit-ai/flow';
import { promises as fs } from 'fs';
import { z } from 'zod';
<<<<<<< HEAD
import path from 'path';
=======
import { ArtifactStorageType } from '../../types/unified-agent-types'; // Ensured path is correct
import path from 'path'; // Import path for joining paths
>>>>>>> b49d3373ebd7f0451b28edd3f3d051cfa4caec3b

// Definir tipo local para storageType
const storageType = z.enum(['local', 's3', 'gcs', 'memory', 'filesystem', 'cloud']);
type StorageType = z.infer<typeof storageType>;

interface IndexingRequest {
  fileName: string;
  fileContent: string;
  storageType: StorageType;
  cloudStorageBucket?: string;
  localStoragePath?: string;
}

export const artifactManagementFlow = defineFlow(
  {
    name: 'artifactManagementFlow',
    inputSchema: z.object({
      fileName: z.string().min(1, "fileName cannot be empty."),
      storageType: storageType,
      fileContent: z.string(),
      cloudStorageBucket: z.string().optional(),
      localStoragePath: z.string().optional(),
    }),
    outputSchema: z.object({
      documentId: z.string(),
      status: z.enum(['success', 'failure']),
      message: z.string().optional(),
    }),
  },
  async (input: IndexingRequest) => {
    console.log(`[artifactManagementFlow] Called with input: ${JSON.stringify(input, null, 2)}`);
    let filePath = '';
    let message = '';

    switch (input.storageType) {
      case 'local':
        filePath = path.join(input.localStoragePath || './artifacts', input.fileName);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, input.fileContent);
        message = `File saved locally at ${filePath}`;
        break;

      case 's3':
      case 'gcs':
        // Implement cloud storage logic here
        filePath = `gs://${input.cloudStorageBucket}/${input.fileName}`;
        message = `File saved in cloud storage at ${filePath}`;
        break;

      case 'memory':
        // In-memory storage implementation
        filePath = `memory://${input.fileName}`;
        message = `File stored in memory with key ${input.fileName}`;
        break;

      case 'filesystem':
        // Alias for local
        filePath = path.join(input.localStoragePath || './artifacts', input.fileName);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, input.fileContent);
        message = `File saved in filesystem at ${filePath}`;
        break;

      case 'cloud':
        // Generic cloud storage
        filePath = `cloud://${input.cloudStorageBucket}/${input.fileName}`;
        message = `File saved in cloud storage at ${filePath}`;
        break;

      default:
        const exhaustiveCheck: never = input.storageType;
        throw new Error(`Unsupported storage type: ${exhaustiveCheck}`);
    }

    return { 
      documentId: filePath, 
      status: 'success' as const, 
      message: message || undefined
    };
  }
);
