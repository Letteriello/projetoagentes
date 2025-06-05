/**
 * @fileOverview Defines Genkit tools for simulated Google Cloud Storage (GCS) operations.
 * These tools provide mock responses and do not perform actual GCS interactions.
 */

import { ai } from '@/ai/genkit'; // Import the configured 'ai' instance
import { z } from 'zod';

// 1. GCS List Buckets Tool

// Define Input Schema for GCS List Buckets
export const GcsListBucketsInputSchema = z.object({
  filterPrefix: z.string().optional().describe("Optional prefix to filter bucket names."),
});

// Define Schema for a GCS Bucket
export const GcsBucketSchema = z.object({
  name: z.string().describe("The name of the GCS bucket."),
  id: z.string().describe("The unique ID of the GCS bucket."),
  created: z.string().datetime().describe("The ISO 8601 datetime string when the bucket was created."),
});

// Define Output Schema for GCS List Buckets
export const GcsListBucketsOutputSchema = z.object({
  buckets: z.array(GcsBucketSchema).describe("A list of simulated GCS buckets."),
});

// Create gcsListBucketsTool
export const gcsListBucketsTool = ai.defineTool(
  {
    name: 'gcsListBuckets',
    description: 'Simulates listing Google Cloud Storage buckets. Returns a mock list of bucket names and details.',
    inputSchema: GcsListBucketsInputSchema,
    outputSchema: GcsListBucketsOutputSchema,
  },
  async (input: z.infer<typeof GcsListBucketsInputSchema>) => {
    console.log('[GcsListBucketsTool] Received input:', input);
    const mockBuckets: z.infer<typeof GcsBucketSchema>[] = [
      { name: "my-simulated-bucket-alpha", id: "bucket-alpha-123", created: new Date(Date.now() - 100000000).toISOString() },
      { name: "project-files-bucket-beta", id: "bucket-beta-456", created: new Date(Date.now() - 200000000).toISOString() },
      { name: "another-simulated-storage", id: "bucket-gamma-789", created: new Date().toISOString() },
      { name: "my-app-data", id: "bucket-delta-012", created: new Date(Date.now() - 50000000).toISOString() },
    ];

    let filteredBuckets = mockBuckets;
    if (input.filterPrefix) {
      filteredBuckets = mockBuckets.filter(bucket => bucket.name.startsWith(input.filterPrefix!));
      console.log(`[GcsListBucketsTool] Filtering with prefix "${input.filterPrefix}". Found ${filteredBuckets.length} buckets.`);
    } else {
      console.log(`[GcsListBucketsTool] No prefix provided. Returning all ${filteredBuckets.length} mock buckets.`);
    }

    return { buckets: filteredBuckets };
  }
);

// 2. GCS Upload File Tool

// Define Input Schema for GCS Upload File
export const GcsUploadFileInputSchema = z.object({
  bucketName: z.string().describe("The name of the GCS bucket."),
  fileName: z.string().describe("The desired name of the file in the bucket."),
  fileContent: z.string().describe("Mock file content (e.g., base64 string or plain text for simulation)."),
});

// Define Output Schema for GCS Upload File
export const GcsUploadFileOutputSchema = z.object({
  success: z.boolean().describe("Whether the mock upload was successful."),
  filePath: z.string().optional().describe("The simulated GCS path to the uploaded file (e.g., gs://bucketName/fileName)."),
  message: z.string().describe("A message indicating the result of the operation."),
});

// Create gcsUploadFileTool
export const gcsUploadFileTool = ai.defineTool(
  {
    name: 'gcsUploadFile',
    description: 'Simulates uploading a file to Google Cloud Storage. Takes bucket name, file name, and content.',
    inputSchema: GcsUploadFileInputSchema,
    outputSchema: GcsUploadFileOutputSchema,
  },
  async (input: z.infer<typeof GcsUploadFileInputSchema>) => {
    console.log('[GcsUploadFileTool] Received input:', { bucketName: input.bucketName, fileName: input.fileName, contentSnippet: input.fileContent.substring(0,50) + '...' });

    if (input.bucketName.toLowerCase() === "fail-bucket") {
      console.warn(`[GcsUploadFileTool] Simulating upload failure for bucket: ${input.bucketName}`);
      return {
        success: false,
        message: `Simulated failure: Bucket "${input.bucketName}" is designated to cause failures.`,
      };
    }

    // Simulate a check if the bucket exists (using the list from the other tool for some realism)
    const knownBuckets = [
        "my-simulated-bucket-alpha",
        "project-files-bucket-beta",
        "another-simulated-storage",
        "my-app-data"
    ];
    if (!knownBuckets.includes(input.bucketName)) {
        console.warn(`[GcsUploadFileTool] Simulating upload failure: Bucket "${input.bucketName}" not found.`);
        return {
            success: false,
            message: `Simulated failure: Bucket "${input.bucketName}" does not exist in the mock list.`,
        };
    }

    const simulatedFilePath = `gs://${input.bucketName}/${input.fileName}`;
    console.log(`[GcsUploadFileTool] Simulating successful upload to: ${simulatedFilePath}`);
    return {
      success: true,
      filePath: simulatedFilePath,
      message: `File ${input.fileName} simulated upload to ${input.bucketName} successfully with content: ${input.fileContent.substring(0, 30)}...`,
    };
  }
);

// Export the tools
// export { gcsListBucketsTool, gcsUploadFileTool };
