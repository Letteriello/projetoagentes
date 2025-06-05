// src/app/api/agents/[agentId]/route.test.ts
import { GET, PUT, DELETE } from './route'; // Assuming your route handlers are exported
import * as AgentActions from '@/app/agent-builder/actions';
import { NextResponse } from 'next/server';
import { jest } from '@jest/globals';

// Mock the AgentActions module
jest.mock('@/app/agent-builder/actions');
const mockedAgentActions = AgentActions as jest.Mocked<typeof AgentActions>;

// Mock loggers
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

describe('/api/agents/[agentId]', () => {
  const mockUserId = 'test-user-123';
  const mockAgentId = 'agent-test-id-456';
  const mockRequestBase = (method: string, body?: any) => ({
    method,
    headers: new Headers({ 'x-user-id': mockUserId, 'Content-Type': 'application/json' }),
    body: body ? JSON.stringify(body) : undefined,
  });
  const mockRouteParams = { params: { agentId: mockAgentId } };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/agents/{agentId}', () => {
    it('should retrieve an agent successfully', async () => {
      const mockAgent = { id: mockAgentId, name: 'Specific Agent', userId: mockUserId };
      mockedAgentActions.getAgentById.mockResolvedValue({ success: true, agent: mockAgent });

      const request = new Request(`http://localhost/api/agents/${mockAgentId}`, mockRequestBase('GET'));
      const response = await GET(request, mockRouteParams);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockAgent);
      expect(mockedAgentActions.getAgentById).toHaveBeenCalledWith(mockAgentId, mockUserId);
    });

    it('should return 404 if agent not found', async () => {
      mockedAgentActions.getAgentById.mockResolvedValue({ success: false, error: 'Agent not found', status: 404 });
      const request = new Request(`http://localhost/api/agents/${mockAgentId}`, mockRequestBase('GET'));
      const response = await GET(request, mockRouteParams);
      const responseBody = await response.json();

      expect(response.status).toBe(404);
      expect(responseBody.success).toBe(false);
      expect(responseBody.code).toBe('AGENT_NOT_FOUND');
    });

    it('should return 400 if x-user-id is missing', async () => {
        const invalidRequest = new Request(`http://localhost/api/agents/${mockAgentId}`, {
            method: 'GET',
            headers: new Headers({ 'Content-Type': 'application/json' }), // No x-user-id
        });
        const response = await GET(invalidRequest, mockRouteParams);
        const responseBody = await response.json();
        expect(response.status).toBe(400);
        expect(responseBody.code).toBe('MISSING_USER_ID');
    });

    it('should return 500 for other errors during getAgentById', async () => {
      mockedAgentActions.getAgentById.mockResolvedValue({ success: false, error: 'Some internal error', status: 500 });
       const request = new Request(`http://localhost/api/agents/${mockAgentId}`, mockRequestBase('GET'));
      const response = await GET(request, mockRouteParams);
      const responseBody = await response.json();

      expect(response.status).toBe(500);
      expect(responseBody.success).toBe(false);
      expect(responseBody.code).toBe('GET_AGENT_FAILED');
    });

    it('should return 500 for unhandled exceptions', async () => {
      mockedAgentActions.getAgentById.mockRejectedValue(new Error('Unexpected failure'));
      const request = new Request(`http://localhost/api/agents/${mockAgentId}`, mockRequestBase('GET'));
      const response = await GET(request, mockRouteParams);
      const responseBody = await response.json();
      expect(response.status).toBe(500);
      expect(responseBody.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('PUT /api/agents/{agentId}', () => {
    const updatePayload = { name: 'Updated Agent Name' };
    it('should update an agent successfully', async () => {
      const mockUpdatedAgent = { id: mockAgentId, name: updatePayload.name, userId: mockUserId };
      mockedAgentActions.updateAgent.mockResolvedValue({ success: true, agent: mockUpdatedAgent });

      const request = new Request(`http://localhost/api/agents/${mockAgentId}`, mockRequestBase('PUT', updatePayload));
      const response = await PUT(request, mockRouteParams);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual(mockUpdatedAgent);
      expect(mockedAgentActions.updateAgent).toHaveBeenCalledWith(mockAgentId, updatePayload, mockUserId);
    });

    it('should return 400 for invalid JSON payload', async () => {
      const request = new Request(`http://localhost/api/agents/${mockAgentId}`, {
        method: 'PUT',
        headers: new Headers({ 'x-user-id': mockUserId, 'Content-Type': 'application/json' }),
        body: 'invalid json',
      });
      const response = await PUT(request, mockRouteParams);
      const responseBody = await response.json();
      expect(response.status).toBe(400);
      expect(responseBody.code).toBe('BAD_REQUEST');
    });

    it('should return 400 for empty update payload', async () => {
      const request = new Request(`http://localhost/api/agents/${mockAgentId}`, mockRequestBase('PUT', {}));
      const response = await PUT(request, mockRouteParams);
      const responseBody = await response.json();
      expect(response.status).toBe(400);
      expect(responseBody.code).toBe('INVALID_PAYLOAD');
    });

    it('should return 404 if agent to update is not found', async () => {
        mockedAgentActions.updateAgent.mockResolvedValue({ success: false, error: 'Agent not found to update', status: 404 });
        const request = new Request(`http://localhost/api/agents/${mockAgentId}`, mockRequestBase('PUT', updatePayload));
        const response = await PUT(request, mockRouteParams);
        const responseBody = await response.json();
        expect(response.status).toBe(404);
        expect(responseBody.code).toBe('AGENT_NOT_FOUND');
    });

    it('should return 500 if updateAgent action fails with a server error', async () => {
        mockedAgentActions.updateAgent.mockResolvedValue({ success: false, error: 'DB update error', status: 500 });
        const request = new Request(`http://localhost/api/agents/${mockAgentId}`, mockRequestBase('PUT', updatePayload));
        const response = await PUT(request, mockRouteParams);
        const responseBody = await response.json();
        expect(response.status).toBe(500);
        expect(responseBody.code).toBe('UPDATE_AGENT_FAILED');
    });
  });

  describe('DELETE /api/agents/{agentId}', () => {
    it('should delete an agent successfully', async () => {
      mockedAgentActions.deleteAgent.mockResolvedValue({ success: true });
      const request = new Request(`http://localhost/api/agents/${mockAgentId}`, mockRequestBase('DELETE'));
      const response = await DELETE(request, mockRouteParams);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.message).toContain('Agent deleted successfully');
      expect(mockedAgentActions.deleteAgent).toHaveBeenCalledWith(mockAgentId, mockUserId);
    });

    it('should return 404 if agent to delete is not found', async () => {
      mockedAgentActions.deleteAgent.mockResolvedValue({ success: false, error: 'Not found', status: 404 });
      const request = new Request(`http://localhost/api/agents/${mockAgentId}`, mockRequestBase('DELETE'));
      const response = await DELETE(request, mockRouteParams);
      const responseBody = await response.json();

      expect(response.status).toBe(404);
      expect(responseBody.success).toBe(false);
      expect(responseBody.code).toBe('AGENT_NOT_FOUND');
    });

    it('should return 500 if deleteAgent action fails with a server error', async () => {
        mockedAgentActions.deleteAgent.mockResolvedValue({ success: false, error: 'DB deletion error', status: 500 });
        const request = new Request(`http://localhost/api/agents/${mockAgentId}`, mockRequestBase('DELETE'));
        const response = await DELETE(request, mockRouteParams);
        const responseBody = await response.json();
        expect(response.status).toBe(500);
        expect(responseBody.code).toBe('DELETE_AGENT_FAILED');
    });
  });
});
