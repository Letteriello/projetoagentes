// src/app/api/chat-stream/route.test.ts
import { POST } from './route';
import * as ChatFlow from '@/ai/flows/chat-flow';
import * as AgentGenkitUtils from '@/lib/agent-genkit-utils'; // For mocking constructSystemPromptForGenkit
// Assuming fetchAgentConfiguration is in the same file or can be mocked if it's imported from elsewhere.
// For this test, we'll mock it as if it's part of the route module or globally available.

import { jest } from '@jest/globals';

// Mock AI Flow
jest.mock('@/ai/flows/chat-flow');
const mockedChatFlow = ChatFlow as jest.Mocked<typeof ChatFlow>;

// Mock utility for system prompt if it's complex, otherwise allow it to run
jest.mock('@/lib/agent-genkit-utils');
const mockedAgentGenkitUtils = AgentGenkitUtils as jest.Mocked<typeof AgentGenkitUtils>;

// Mock winstonLogger
jest.mock('../../../lib/winston-logger', () => ({ // Adjust path as necessary
  winstonLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock logService if its writeLogEntry is called for errors within the flow
jest.mock('../../../lib/logService', () => ({ // Adjust path as necessary
  writeLogEntry: jest.fn().mockResolvedValue(undefined),
}));

// Mock fetchAgentConfiguration (if it were imported from elsewhere)
// For this example, we assume it's part of the route file and will be implicitly covered
// or we can mock it globally if it's a global fetch.
// jest.mock('./route', () => ({
//   ...jest.requireActual('./route'), // import and retain default exports
//   fetchAgentConfiguration: jest.fn(), // if we want to mock local function
// }));
// For now, let's assume fetchAgentConfiguration is part of the module and test its effects.


// Helper to read NDJSON stream
async function streamToNdjson(stream: ReadableStream<Uint8Array>): Promise<any[]> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const result = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      if (buffer.trim()) { // Process any remaining buffer
        result.push(JSON.parse(buffer.trim()));
      }
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\\n');
    buffer = lines.pop() || ''; // Keep the last partial line in buffer
    for (const line of lines) {
      if (line.trim()) {
        result.push(JSON.parse(line.trim()));
      }
    }
  }
  return result;
}


describe('/api/chat-stream', () => {
  const mockApiKey = 'test-chat-api-key';
  const mockAgentId = 'agent_simple_llm'; // Use one of the mock agent IDs from the route

  const mockChatInput = {
    agentId: mockAgentId,
    userMessage: 'Hello, world!',
    history: [],
  };

  const mockRequestBase = (body: any) => ({
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mockApiKey}`,
    }),
    body: JSON.stringify(body),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CHAT_API_KEY = mockApiKey; // Set up mock API key
    mockedAgentGenkitUtils.constructSystemPromptForGenkit.mockReturnValue("Mocked System Prompt");
  });

  it('should return a streaming response with text data on successful flow', async () => {
    mockedChatFlow.basicChatFlow.mockResolvedValue({
      outputMessage: 'Mocked AI response.',
      chatEvents: [{ type: 'INFO', message: 'Flow started' }],
      error: null,
    });

    const request = new Request('http://localhost/api/chat-stream', mockRequestBase(mockChatInput));
    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/x-ndjson; charset=utf-8');

    const streamedObjects = await streamToNdjson(response.body!);

    expect(streamedObjects.length).toBe(2); // One event, one text
    expect(streamedObjects[0].type).toBe('event');
    expect(streamedObjects[0].data.type).toBe('INFO');
    expect(streamedObjects[1].type).toBe('text');
    expect(streamedObjects[1].data).toBe('Mocked AI response.');
  });

  it('should stream an error object if basicChatFlow returns an error', async () => {
    mockedChatFlow.basicChatFlow.mockResolvedValue({
      outputMessage: null,
      chatEvents: [],
      error: 'LLM generation failed',
    });

    const request = new Request('http://localhost/api/chat-stream', mockRequestBase(mockChatInput));
    const response = await POST(request);

    expect(response.status).toBe(200); // SSE itself is 200, error is in stream
    const streamedObjects = await streamToNdjson(response.body!);

    expect(streamedObjects.length).toBe(1);
    expect(streamedObjects[0].type).toBe('error');
    expect(streamedObjects[0].data.code).toBe('AGENT_EXECUTION_FAILED'); // Or more specific if categorized
    expect(streamedObjects[0].data.details).toContain('LLM generation failed');
  });

  it('should return 401 if API key is invalid or missing', async () => {
    const request = new Request('http://localhost/api/chat-stream', {
        method: 'POST',
        headers: new Headers({'Content-Type': 'application/json', 'Authorization': 'Bearer wrong_key'}),
        body: JSON.stringify(mockChatInput)
    });
    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(401);
    expect(responseBody.success).toBe(false);
    expect(responseBody.code).toBe('UNAUTHORIZED');
  });

  it('should return 400 if agentId is missing', async () => {
    const invalidInput = { ...mockChatInput, agentId: undefined };
    const request = new Request('http://localhost/api/chat-stream', mockRequestBase(invalidInput));
    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.success).toBe(false);
    expect(responseBody.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 if agent configuration is not found', async () => {
    // This test relies on the mock fetchAgentConfiguration behavior in the route
    // For 'agent_not_real', it should return null.
    const inputWithNonExistentAgent = { ...mockChatInput, agentId: 'agent_not_real' };
    const request = new Request('http://localhost/api/chat-stream', mockRequestBase(inputWithNonExistentAgent));
    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(404);
    expect(responseBody.success).toBe(false);
    expect(responseBody.code).toBe('AGENT_CONFIG_NOT_FOUND');
  });

  it('should handle pre-stream setup errors gracefully (e.g. JSON parsing)', async () => {
    const request = new Request('http://localhost/api/chat-stream', {
        method: 'POST',
        headers: new Headers({'Content-Type': 'application/json', 'Authorization': `Bearer ${mockApiKey}`}),
        body: 'invalid-json-body'
    });
    const response = await POST(request);
    const responseBody = await response.json();

    expect(response.status).toBe(400);
    expect(responseBody.success).toBe(false);
    expect(responseBody.code).toBe('BAD_REQUEST');
  });
});
