import { GET } from './route'; // Adjust path as necessary for your test setup
import { NextResponse } from 'next/server';

// Mock firebaseAdmin
const mockGet = jest.fn();
const mockOffset = jest.fn(() => ({ get: mockGet }));
const mockLimit = jest.fn(() => ({ offset: mockOffset }));
const mockOrderBy = jest.fn(() => ({ limit: mockLimit }));
const mockWhere = jest.fn(() => ({
  where: mockWhere, // Chainable where
  orderBy: mockOrderBy,
  limit: mockLimit, // Allow limit directly after where
  get: mockGet, // Allow get directly after where (for simple queries)
}));
const mockCollection = jest.fn(() => ({
  where: mockWhere,
}));

// Mock admin.firestore.Timestamp.fromDate
const mockTimestampFromDate = jest.fn((date) => ({
  seconds: date.getTime() / 1000, // Simplified mock
  nanos: 0,
}));

// Mock the entire firebaseAdmin module that is imported by the route
jest.mock('../../../../lib/firebaseAdmin', () => ({
  __esModule: true,
  default: { // admin namespace
    firestore: {
      Timestamp: {
        fromDate: (date: Date) => mockTimestampFromDate(date),
      },
    },
  },
  firestore: { // Firestore service instance
    collection: (collectionName: string) => mockCollection(collectionName),
  },
}));


// Helper to create a mock NextRequest
function mockNextRequest(urlPath: string, queryParams: Record<string, string> = {}): Request {
  const url = new URL(`http://localhost${urlPath}`);
  Object.entries(queryParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new Request(url.toString());
}

describe('GET /api/agents/[agentId]/logs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const agentId = 'test-agent-123';
  const mockLogs = [
    { id: 'log1', timestamp: new Date().toISOString(), flowName: 'flowA', type: 'start', data: {} },
    { id: 'log2', timestamp: new Date().toISOString(), flowName: 'flowA', type: 'end', data: {} },
  ];

  test('should return logs successfully with valid agentId', async () => {
    mockGet.mockResolvedValueOnce({
      empty: false,
      forEach: (callback: (doc: any) => void) =>
        mockLogs.map(log => callback({ id: log.id, data: () => log })),
    });

    const request = mockNextRequest(`/api/agents/${agentId}/logs`);
    const response = await GET(request, { params: { agentId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockCollection).toHaveBeenCalledWith('agent_flow_logs');
    expect(mockWhere).toHaveBeenCalledWith('agentId', '==', agentId);
    expect(mockOrderBy).toHaveBeenCalledWith('timestamp', 'desc');
    expect(mockLimit).toHaveBeenCalledWith(10); // Default limit
    expect(mockOffset).toHaveBeenCalledWith(0); // Default offset for page 1
    expect(body.logs.length).toBe(2);
    expect(body.logs[0].id).toBe('log1');
    expect(body.currentPage).toBe(1);
  });

  test('should apply date filters correctly', async () => {
    mockGet.mockResolvedValueOnce({ empty: true, forEach: () => {} });
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';

    const request = mockNextRequest(`/api/agents/${agentId}/logs`, { startDate, endDate });
    await GET(request, { params: { agentId } });

    expect(mockTimestampFromDate).toHaveBeenCalledWith(new Date(startDate));
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23, 59, 59, 999);
    expect(mockTimestampFromDate).toHaveBeenCalledWith(endDateObj);

    // Check that 'timestamp' where clauses were called
    // This requires a more detailed mock setup for mockWhere to track specific calls or arguments.
    // For simplicity, we're checking if Timestamp.fromDate was called.
    // A more robust test would spy on query.where('timestamp', '>=', ...)
    // and query.where('timestamp', '<=', ...).
    // For now, we assume if fromDate is called, the where clauses are constructed.
    expect(mockWhere).toHaveBeenCalledWith('timestamp', '>=', expect.any(Object));
    expect(mockWhere).toHaveBeenCalledWith('timestamp', '<=', expect.any(Object));
  });

  test('should apply status and flowName filters', async () => {
    mockGet.mockResolvedValueOnce({ empty: true, forEach: () => {} });
    const status = 'error';
    const flowName = 'critical_flow';

    const request = mockNextRequest(`/api/agents/${agentId}/logs`, { status, flowName });
    await GET(request, { params: { agentId } });

    expect(mockWhere).toHaveBeenCalledWith('type', '==', status);
    expect(mockWhere).toHaveBeenCalledWith('flowName', '==', flowName);
  });

  test('should handle pagination correctly', async () => {
    mockGet.mockResolvedValueOnce({ empty: true, forEach: () => {} });
    const page = '3';
    const limit = '20';

    const request = mockNextRequest(`/api/agents/${agentId}/logs`, { page, limit });
    await GET(request, { params: { agentId } });

    expect(mockLimit).toHaveBeenCalledWith(20);
    expect(mockOffset).toHaveBeenCalledWith(40); // (3 - 1) * 20
  });

  test('should return 400 if agentId is missing (though route structure prevents this)', async () => {
    // This case is typically handled by Next.js routing itself if the param is part of the path.
    // If agentId were a query param, this test would be more relevant.
    // For path params, if params.agentId is undefined, the handler should catch it.
    const request = mockNextRequest('/api/agents//logs'); // Invalid path
    const response = await GET(request, { params: { agentId: '' } }); // Simulate empty agentId
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toBe('agentId is required');
  });

  test('should return 400 for invalid page number', async () => {
    const request = mockNextRequest(`/api/agents/${agentId}/logs`, { page: 'invalid' });
    const response = await GET(request, { params: { agentId } });
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid page number');
  });

  test('should return 400 for invalid limit value', async () => {
    const request = mockNextRequest(`/api/agents/${agentId}/logs`, { limit: '999' }); // Max is 100
    const response = await GET(request, { params: { agentId } });
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid limit value');
  });

  test('should return 400 for invalid status value', async () => {
    const request = mockNextRequest(`/api/agents/${agentId}/logs`, { status: 'unknown_status' });
    const response = await GET(request, { params: { agentId } });
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error).toContain('Invalid status value');
  });


  test('should return 500 if Firestore query fails', async () => {
    mockGet.mockRejectedValueOnce(new Error('Firestore internal error'));
    const request = mockNextRequest(`/api/agents/${agentId}/logs`);
    const response = await GET(request, { params: { agentId } });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('Failed to fetch logs.');
    expect(body.details).toBe('Firestore internal error');
  });

  test('should correctly set hasNextPage to true if logs returned equals limit', async () => {
    const limitedLogs = new Array(5).fill(null).map((_, i) => ({
        id: `log${i}`, timestamp: new Date().toISOString(), flowName: 'flow', type: 'info', data: {}
    }));
    mockGet.mockResolvedValueOnce({
      empty: false,
      forEach: (callback: (doc: any) => void) =>
        limitedLogs.map(log => callback({ id: log.id, data: () => log })),
    });

    const request = mockNextRequest(`/api/agents/${agentId}/logs`, { limit: '5' });
    const response = await GET(request, { params: { agentId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.logs.length).toBe(5);
    expect(body.hasNextPage).toBe(true);
  });

  test('should correctly set hasNextPage to false if logs returned is less than limit', async () => {
    const fewLogs = new Array(3).fill(null).map((_, i) => ({
        id: `log${i}`, timestamp: new Date().toISOString(), flowName: 'flow', type: 'info', data: {}
    }));
    mockGet.mockResolvedValueOnce({
      empty: false,
      forEach: (callback: (doc: any) => void) =>
        fewLogs.map(log => callback({ id: log.id, data: () => log })),
    });

    const request = mockNextRequest(`/api/agents/${agentId}/logs`, { limit: '5' });
    const response = await GET(request, { params: { agentId } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.logs.length).toBe(3);
    expect(body.hasNextPage).toBe(false);
  });

});
