// src/app/api/apikeys/route.test.ts
import { POST, GET } from './route';
import { db } from '@/lib/firebaseAdmin'; // Actual path to your Firestore client
import { FieldValue } from 'firebase-admin/firestore';
import { jest } from '@jest/globals';

// Mock Firestore
jest.mock('@/lib/firebaseAdmin', () => ({
  db: {
    collection: jest.fn().mockReturnThis(), // Ensure 'this' is returned for chaining
    add: jest.fn(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn(),
  },
}));
// Mock FieldValue for serverTimestamp if it's used in a way that needs mocking (usually not for .add)
jest.mock('firebase-admin/firestore', () => ({
  ...jest.requireActual('firebase-admin/firestore'), // Import and retain default exports
  FieldValue: {
    serverTimestamp: jest.fn(() => 'mock_server_timestamp'), // Mock serverTimestamp
  },
}));


// Mock winstonLogger and writeLogEntry (if directly used and needing assertion)
jest.mock('@/lib/winston-logger', () => ({
  winstonLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
// writeLogEntry is not typically called directly from these apikey routes, but from deeper services.
// If it were, it would be mocked similarly.

describe('/api/apikeys', () => {
  const mockUserId = 'user-api-key-test-123';
  const mockRequestBase = (method: string, body?: any) => ({
    method,
    headers: new Headers({ 'x-user-id': mockUserId, 'Content-Type': 'application/json' }),
    body: body ? JSON.stringify(body) : undefined,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Firestore mock states that might be specific to a test
    (db.collection as jest.Mock).mockClear().mockReturnThis();
    (db.add as jest.Mock).mockClear();
    (db.where as jest.Mock).mockClear().mockReturnThis();
    (db.get as jest.Mock).mockClear();
  });

  describe('POST /api/apikeys', () => {
    const apiKeyPayload = {
      name: 'Test API Key',
      keyReference: 'ENV_VAR_TEST_KEY',
      serviceType: 'OpenAI',
      description: 'A test key reference',
      permissions: ['read'],
    };

    it('should create an API key metadata entry successfully', async () => {
      const mockDocId = 'new-key-id-123';
      (db.add as jest.Mock).mockResolvedValue({ id: mockDocId });
      // (db.collection('api_keys').add as jest.Mock).mockResolvedValue({ id: mockDocId });


      const request = new Request('http://localhost/api/apikeys', mockRequestBase('POST', apiKeyPayload));
      const response = await POST(request);
      const responseBody = await response.json();

      expect(response.status).toBe(201);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.id).toBe(mockDocId);
      expect(responseBody.data.name).toBe(apiKeyPayload.name);
      expect(responseBody.data.userId).toBe(mockUserId);
      expect(db.collection).toHaveBeenCalledWith('api_keys');
      expect(db.add).toHaveBeenCalledWith(expect.objectContaining({
        ...apiKeyPayload,
        userId: mockUserId,
        isActive: true, // Default
        // createdAt: 'mock_server_timestamp', // FieldValue.serverTimestamp(),
        // updatedAt: 'mock_server_timestamp', // FieldValue.serverTimestamp(),
      }));
    });

    it('should return 400 if x-user-id is missing', async () => {
      const request = new Request('http://localhost/api/apikeys', {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(apiKeyPayload),
      });
      const response = await POST(request);
      const responseBody = await response.json();
      expect(response.status).toBe(400);
      expect(responseBody.code).toBe('MISSING_USER_ID');
    });

    it('should return 400 for invalid JSON payload', async () => {
        const request = new Request('http://localhost/api/apikeys', {
            method: 'POST',
            headers: new Headers({ 'x-user-id': mockUserId, 'Content-Type': 'application/json' }),
            body: 'invalid json',
        });
        const response = await POST(request);
        const responseBody = await response.json();
        expect(response.status).toBe(400);
        expect(responseBody.code).toBe('BAD_REQUEST');
    });

    it('should return 400 if required fields (name, keyReference, serviceType) are missing', async () => {
        const incompletePayloads = [
            { keyReference: 'ref', serviceType: 'type' }, // Missing name
            { name: 'name', serviceType: 'type' },       // Missing keyReference
            { name: 'name', keyReference: 'ref' },       // Missing serviceType
        ];
        for (const payload of incompletePayloads) {
            const request = new Request('http://localhost/api/apikeys', mockRequestBase('POST', payload));
            const response = await POST(request);
            const responseBody = await response.json();
            expect(response.status).toBe(400);
            expect(responseBody.code).toBe('VALIDATION_ERROR');
        }
    });

    it('should return 500 if Firestore operation fails', async () => {
      (db.add as jest.Mock).mockRejectedValue(new Error('Firestore unavailable'));
      const request = new Request('http://localhost/api/apikeys', mockRequestBase('POST', apiKeyPayload));
      const response = await POST(request);
      const responseBody = await response.json();
      expect(response.status).toBe(500);
      expect(responseBody.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('GET /api/apikeys', () => {
    it('should retrieve API key metadata for the user', async () => {
      const mockKeys = [
        { id: 'key1', name: 'Key One', userId: mockUserId, createdAt: new Date(), updatedAt: new Date() },
        { id: 'key2', name: 'Key Two', userId: mockUserId, createdAt: new Date(), updatedAt: new Date() },
      ];
      // Mock Firestore's get() method to return a snapshot-like object
      (db.get as jest.Mock).mockResolvedValue({
        empty: false,
        docs: mockKeys.map(k => ({
            id: k.id,
            data: () => ({...k, createdAt: {toDate: () => k.createdAt}, updatedAt: {toDate: () => k.updatedAt}})
        })),
      });
      // (db.collection('api_keys').where(...).get as jest.Mock)

      const request = new Request('http://localhost/api/apikeys', mockRequestBase('GET'));
      const response = await GET(request);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.length).toBe(2);
      expect(responseBody.data[0].name).toBe('Key One');
      expect(db.collection).toHaveBeenCalledWith('api_keys');
      expect(db.where).toHaveBeenCalledWith('userId', '==', mockUserId);
    });

    it('should return an empty array if no keys found for the user', async () => {
      (db.get as jest.Mock).mockResolvedValue({ empty: true, docs: [] });
      const request = new Request('http://localhost/api/apikeys', mockRequestBase('GET'));
      const response = await GET(request);
      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toEqual([]);
    });

    it('should return 400 if x-user-id is missing', async () => {
      const request = new Request('http://localhost/api/apikeys', {
        method: 'GET',
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });
      const response = await GET(request);
      const responseBody = await response.json();
      expect(response.status).toBe(400);
      expect(responseBody.code).toBe('MISSING_USER_ID');
    });

    it('should return 500 if Firestore operation fails', async () => {
      (db.get as jest.Mock).mockRejectedValue(new Error('Firestore query failed'));
      const request = new Request('http://localhost/api/apikeys', mockRequestBase('GET'));
      const response = await GET(request);
      const responseBody = await response.json();
      expect(response.status).toBe(500);
      expect(responseBody.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });
});
