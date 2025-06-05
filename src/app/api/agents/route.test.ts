// src/app/api/agents/route.test.ts
import { POST, GET } from './route'; // Assuming your route handlers are exported
import * as AgentActions from '@/app/agent-builder/actions';
import { NextResponse } from 'next/server';
import { jest } from '@jest/globals'; // Or import { mock } from 'jest-mock-extended'; for more specific mocking

// Mock the AgentActions module
jest.mock('@/app/agent-builder/actions');
const mockedAgentActions = AgentActions as jest.Mocked<typeof AgentActions>;

// Mock winstonLogger and writeLogEntry if they are directly used for assertions or complex logic
// For this test, we primarily focus on request/response, so deep mocking of loggers might not be needed
// unless we want to verify *that* they were called.
jest.mock('@/lib/winston-logger', () => ({
  winstonLogger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));
jest.mock('@/lib/logService', () => ({
  writeLogEntry: jest.fn().mockResolvedValue(undefined),
}));


describe('/api/agents', () => {
  const mockUserId = 'test-user-123';
  const mockRequestBase = {
    headers: new Headers({ 'x-user-id': mockUserId }),
  };

  beforeEach(() => {
    // Clear mock history before each test
    jest.clearAllMocks();
  });

  describe('POST /api/agents', () => {
    it('should create an agent successfully', async () => {
      const mockAgentData = { name: 'Test Agent', description: 'A test agent' };
      const mockCreatedAgent = { id: 'agent-id-1', ...mockAgentData, userId: mockUserId };

      mockedAgentActions.createAgent.mockResolvedValue({ success: true, data: mockCreatedAgent });

      const request = new Request('http://localhost/api/agents', {
        ...mockRequestBase,
        method: 'POST',
        body: JSON.stringify(mockAgentData),
      });

      const response = await POST(request);
      const responseBody = await response.json();

      expect(response.status).toBe(201);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.id).toBe('agent-id-1');
      expect(responseBody.data.name).toBe(mockAgentData.name);
      expect(mockedAgentActions.createAgent).toHaveBeenCalledWith(expect.objectContaining({
        name: mockAgentData.name,
        userId: mockUserId,
      }));
    });

    it('should return 400 if x-user-id header is missing', async () => {
      const request = new Request('http://localhost/api/agents', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Agent' }),
        headers: new Headers(), // No x-user-id
      });
      const response = await POST(request);
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.code).toBe('MISSING_USER_ID');
    });

    it('should return 400 if request body is invalid JSON', async () => {
      const request = new Request('http://localhost/api/agents', {
        ...mockRequestBase,
        method: 'POST',
        body: 'invalid json',
      });
      const response = await POST(request);
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.code).toBe('BAD_REQUEST');
    });

    it('should return 400 if agent name is missing', async () => {
        const request = new Request('http://localhost/api/agents', {
            ...mockRequestBase,
            method: 'POST',
            body: JSON.stringify({ description: "Missing name" }),
        });
        const response = await POST(request);
        const responseBody = await response.json();

        expect(response.status).toBe(400);
        expect(responseBody.success).toBe(false);
        expect(responseBody.code).toBe('INVALID_AGENT_CONFIG');
    });

    it('should return 500 if AgentActions.createAgent fails', async () => {
      mockedAgentActions.createAgent.mockResolvedValue({ success: false, error: 'DB insertion failed' });
      const request = new Request('http://localhost/api/agents', {
        ...mockRequestBase,
        method: 'POST',
        body: JSON.stringify({ name: 'Test Agent' }),
      });
      const response = await POST(request);
      const responseBody = await response.json();

      expect(response.status).toBe(500);
      expect(responseBody.success).toBe(false);
      expect(responseBody.code).toBe('AGENT_CREATION_FAILED');
      expect(responseBody.error).toBe('DB insertion failed');
    });

    it('should return 500 for unhandled exceptions', async () => {
      mockedAgentActions.createAgent.mockRejectedValue(new Error('Unexpected error'));
      const request = new Request('http://localhost/api/agents', {
        ...mockRequestBase,
        method: 'POST',
        body: JSON.stringify({ name: 'Test Agent' }),
      });
      const response = await POST(request);
      const responseBody = await response.json();

      expect(response.status).toBe(500);
      expect(responseBody.success).toBe(false);
      expect(responseBody.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('GET /api/agents', () => {
    it('should retrieve a list of agents successfully', async () => {
      const mockAgentsList = [
        { id: 'agent-1', name: 'Agent One', userId: mockUserId },
        { id: 'agent-2', name: 'Agent Two', userId: mockUserId },
      ];
      mockedAgentActions.listAgents.mockResolvedValue(mockAgentsList); // Assuming listAgents returns the array directly

      const request = new Request('http://localhost/api/agents', {
        ...mockRequestBase,
        method: 'GET',
      });
      const response = await GET(request);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockAgentsList);
      expect(mockedAgentActions.listAgents).toHaveBeenCalledWith(mockUserId);
    });

    it('should return 400 if x-user-id header is missing', async () => {
      const request = new Request('http://localhost/api/agents', {
        method: 'GET',
        headers: new Headers(), // No x-user-id
      });
      const response = await GET(request);
      const responseBody = await response.json();

      expect(response.status).toBe(400);
      expect(responseBody.success).toBe(false);
      expect(responseBody.code).toBe('MISSING_USER_ID');
    });

    it('should return 500 if AgentActions.listAgents fails', async () => {
      mockedAgentActions.listAgents.mockRejectedValue(new Error('Database connection error'));
      const request = new Request('http://localhost/api/agents', {
        ...mockRequestBase,
        method: 'GET',
      });
      const response = await GET(request);
      const responseBody = await response.json();

      expect(response.status).toBe(500);
      expect(responseBody.success).toBe(false);
      expect(responseBody.code).toBe('INTERNAL_SERVER_ERROR');
      expect(responseBody.error).toContain('Failed to retrieve agents');
    });
  });
});
