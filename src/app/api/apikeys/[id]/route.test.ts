// src/app/api/apikeys/[id]/route.test.ts
import { PUT, DELETE } from './route';
import { db } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { jest } from '@jest/globals';

// Mock Firestore
const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockRunTransaction = jest.fn();

jest.mock('@/lib/firebaseAdmin', () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn(() => ({ // Return an object that includes the methods used in runTransaction
      get: mockGet,
      update: mockUpdate,
      delete: mockDelete,
    })),
    runTransaction: mockRunTransaction, // Mock runTransaction at the db level
  },
}));
jest.mock('firebase-admin/firestore', () => ({
  ...jest.requireActual('firebase-admin/firestore'),
  FieldValue: {
    serverTimestamp: jest.fn(() => 'mock_server_timestamp_put'),
  },
}));

// Mock loggers
jest.mock('@/lib/winston-logger', () => ({
  winstonLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
// writeLogEntry is not directly called by these route handlers.

describe('/api/apikeys/[id]', () => {
  const mockUserId = 'user-apikey-id-test-123';
  const mockApiKeyId = 'key-doc-id-456';
  const mockRequestBase = (method: string, body?: any) => ({
    method,
    headers: new Headers({ 'x-user-id': mockUserId, 'Content-Type': 'application/json' }),
    body: body ? JSON.stringify(body) : undefined,
  });
  const mockRouteParams = { params: { id: mockApiKeyId } };

  beforeEach(() => {
    jest.clearAllMocks();
    // Configure default behavior for runTransaction to execute the callback
    // This allows testing the logic within the transaction.
    mockRunTransaction.mockImplementation(async (updateFunction: (transaction: any) => Promise<any>) => {
      // Provide a mock transaction object that can be used by updateFunction
      const mockTransaction = {
        get: mockGet,
        update: mockUpdate,
        delete: mockDelete,
      };
      return updateFunction(mockTransaction);
    });
  });

  describe('PUT /api/apikeys/{id}', () => {
    const updatePayload = { name: 'Updated Key Name', description: 'Updated description' };
    const mockCurrentKeyData = {
      userId: mockUserId,
      name: 'Old Name',
      keyReference: 'OLD_REF',
      serviceType: 'OpenAI',
      // other fields...
    };

    it('should update API key metadata successfully', async () => {
      mockGet.mockResolvedValue({ exists: true, data: () => mockCurrentKeyData });
      mockUpdate.mockResolvedValue(undefined); // Firestore update doesn't return data

      const request = new Request(`http://localhost/api/apikeys/${mockApiKeyId}`, mockRequestBase('PUT', updatePayload));
      const response = await PUT(request, mockRouteParams);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.name).toBe(updatePayload.name);
      expect(responseBody.data.description).toBe(updatePayload.description);
      expect(db.collection).toHaveBeenCalledWith('api_keys');
      expect(db.doc).toHaveBeenCalledWith(mockApiKeyId);
      expect(mockRunTransaction).toHaveBeenCalled();
      expect(mockGet).toHaveBeenCalled(); // With the docRef from db.doc(...)
      expect(mockUpdate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        name: updatePayload.name,
        description: updatePayload.description,
        updatedAt: 'mock_server_timestamp_put',
      }));
    });

    it('should return 400 if x-user-id is missing', async () => {
      const request = new Request(`http://localhost/api/apikeys/${mockApiKeyId}`, {
        method: 'PUT',
        headers: new Headers({'Content-Type': 'application/json'}),
        body: JSON.stringify(updatePayload)
      });
      const response = await PUT(request, mockRouteParams);
      const responseBody = await response.json();
      expect(response.status).toBe(400);
      expect(responseBody.code).toBe('MISSING_USER_ID');
    });

    it('should return 400 for invalid JSON payload', async () => {
      const request = new Request(`http://localhost/api/apikeys/${mockApiKeyId}`, {
        method: 'PUT',
        headers: new Headers({ 'x-user-id': mockUserId, 'Content-Type': 'application/json' }),
        body: 'invalid json',
      });
      const response = await PUT(request, mockRouteParams);
      const responseBody = await response.json();
      expect(response.status).toBe(400);
      expect(responseBody.code).toBe('BAD_REQUEST');
    });

    it('should return 400 if update payload is empty', async () => {
        const request = new Request(`http://localhost/api/apikeys/${mockApiKeyId}`, mockRequestBase('PUT', {}));
        const response = await PUT(request, mockRouteParams);
        const responseBody = await response.json();
        expect(response.status).toBe(400);
        expect(responseBody.code).toBe('VALIDATION_ERROR'); // "Request body is empty" or "No updatable fields"
        expect(responseBody.error).toMatch(/Request body is empty|No updatable fields provided/);
    });

    it('should return 400 if payload contains no valid fields for update', async () => {
        const request = new Request(`http://localhost/api/apikeys/${mockApiKeyId}`, mockRequestBase('PUT', { unknownField: "value"}));
        const response = await PUT(request, mockRouteParams);
        const responseBody = await response.json();
        expect(response.status).toBe(400);
        expect(responseBody.code).toBe('VALIDATION_ERROR');
        expect(responseBody.error).toBe('No valid fields provided for update.');
    });


    it('should return 404 if API key metadata not found', async () => {
      mockGet.mockResolvedValue({ exists: false });
      const request = new Request(`http://localhost/api/apikeys/${mockApiKeyId}`, mockRequestBase('PUT', updatePayload));
      const response = await PUT(request, mockRouteParams);
      const responseBody = await response.json();
      expect(response.status).toBe(404);
      expect(responseBody.code).toBe('NOT_FOUND');
    });

    it('should return 403 if user is not authorized to update the key', async () => {
      mockGet.mockResolvedValue({ exists: true, data: () => ({ ...mockCurrentKeyData, userId: 'another-user-id' }) });
      const request = new Request(`http://localhost/api/apikeys/${mockApiKeyId}`, mockRequestBase('PUT', updatePayload));
      const response = await PUT(request, mockRouteParams);
      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody.code).toBe('FORBIDDEN');
    });

    it('should return 500 if Firestore transaction fails', async () => {
      mockRunTransaction.mockRejectedValue(new Error('Firestore transaction failed'));
      const request = new Request(`http://localhost/api/apikeys/${mockApiKeyId}`, mockRequestBase('PUT', updatePayload));
      const response = await PUT(request, mockRouteParams);
      const responseBody = await response.json();
      expect(response.status).toBe(500);
      expect(responseBody.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('DELETE /api/apikeys/{id}', () => {
    const mockCurrentKeyData = { userId: mockUserId /* other fields */ };

    it('should delete API key metadata successfully', async () => {
      mockGet.mockResolvedValue({ exists: true, data: () => mockCurrentKeyData });
      mockDelete.mockResolvedValue(undefined);

      const request = new Request(`http://localhost/api/apikeys/${mockApiKeyId}`, mockRequestBase('DELETE'));
      const response = await DELETE(request, mockRouteParams);
      const responseBody = await response.json();

      expect(response.status).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.message).toBe('API key metadata deleted successfully.');
      expect(db.collection).toHaveBeenCalledWith('api_keys');
      expect(db.doc).toHaveBeenCalledWith(mockApiKeyId);
      expect(mockRunTransaction).toHaveBeenCalled();
      expect(mockGet).toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalled();
    });

    it('should return 400 if x-user-id is missing', async () => {
        const request = new Request(`http://localhost/api/apikeys/${mockApiKeyId}`, {
            method: 'DELETE',
            headers: new Headers({'Content-Type': 'application/json'}),
        });
        const response = await DELETE(request, mockRouteParams);
        const responseBody = await response.json();
        expect(response.status).toBe(400);
        expect(responseBody.code).toBe('MISSING_USER_ID');
    });

    it('should return 404 if API key metadata not found for deletion', async () => {
      mockGet.mockResolvedValue({ exists: false });
      const request = new Request(`http://localhost/api/apikeys/${mockApiKeyId}`, mockRequestBase('DELETE'));
      const response = await DELETE(request, mockRouteParams);
      const responseBody = await response.json();
      expect(response.status).toBe(404);
      expect(responseBody.code).toBe('NOT_FOUND');
    });

    it('should return 403 if user is not authorized to delete the key', async () => {
      mockGet.mockResolvedValue({ exists: true, data: () => ({ ...mockCurrentKeyData, userId: 'another-user-id' }) });
      const request = new Request(`http://localhost/api/apikeys/${mockApiKeyId}`, mockRequestBase('DELETE'));
      const response = await DELETE(request, mockRouteParams);
      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody.code).toBe('FORBIDDEN');
    });

    it('should return 500 if Firestore transaction fails during delete', async () => {
      mockRunTransaction.mockRejectedValue(new Error('Firestore transaction failed'));
      const request = new Request(`http://localhost/api/apikeys/${mockApiKeyId}`, mockRequestBase('DELETE'));
      const response = await DELETE(request, mockRouteParams);
      const responseBody = await response.json();
      expect(response.status).toBe(500);
      expect(responseBody.code).toBe('INTERNAL_SERVER_ERROR');
    });
  });
});
