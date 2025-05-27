// Placeholder for ADK integration with streaming
export const sendMessageToAI = async (
  message: string,
  onChunk: (chunk: string) => void
): Promise<void> => {
  console.log(`Simulating AI call for: ${message}`);
  const fullResponse = "This is a simulated streamed AI response.";
  // Split into smaller, more realistic chunks (e.g., by word or even character for finer-grained streaming)
  const chunks = fullResponse.match(/.{1,5}/g) || []; // Split into chunks of up to 5 chars

  let resolved = false;
  const stream = async () => {
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200)); // Simulate variable delay
      onChunk(chunk); // Send chunk
    }
    resolved = true;
  };

  return new Promise((resolve, reject) => {
    stream()
      .then(() => {
        // Optionally, call onChunk one last time with a special "end" signal if your UI needs it
        // onChunk("", true); // Example: onChunk(content, isEndOfStream)
        resolve();
      })
      .catch(reject);

    // Safety timeout - adjust as needed for expected max streaming duration
    setTimeout(() => {
      if (!resolved) {
        console.error("Streaming simulation timed out in adk.ts");
        reject(new Error("Streaming timeout in adk.ts"));
      }
    }, 10000); // 10-second timeout
  });
};
