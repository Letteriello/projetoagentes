// src/lib/__tests__/firestoreConversationStorage.test.ts
import {
  createNewConversation,
  getAllConversations,
  getConversationById,
  addMessageToConversation,
  renameConversationInStorage,
  deleteConversationFromStorage,
  updateMessageFeedback,
  deleteMessageFromConversation,
} from '../firestoreConversationStorage'; // Adjust path as necessary
import { firestore } from '@/lib/firebaseClient'; // Actual import for type checking
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'; // Actual imports for type checking

// Mock Firestore methods
jest.mock('firebase/firestore', () => {
  const originalModule = jest.requireActual('firebase/firestore');
  return {
    ...originalModule,
    collection: jest.fn(),
    doc: jest.fn(),
    addDoc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    serverTimestamp: jest.fn(() => 'mocked_server_timestamp'), // Mock serverTimestamp
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    Timestamp: {
      fromDate: jest.fn((date: Date) => ({
        toDate: () => date,
        // Add other Timestamp methods if your functions use them
      })),
      now: jest.fn(() => ({
        toDate: () => new Date(),
      })),
    },
    writeBatch: jest.fn(() => ({
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock firebaseClient (if it initializes Firestore differently or has other exports)
jest.mock('@/lib/firebaseClient', () => ({
  firestore: {}, // Mocked Firestore instance
}));

describe('firestoreConversationStorage', () => {
  const mockUserId = 'testUser123';
  const mockConversationId = 'conv123';

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('createNewConversation', () => {
    it('should create a new conversation successfully', async () => {
      const mockTitle = 'Test Chat';
      const mockAgentId = 'agent007';
      const mockNewDocRef = { id: 'newConvId' };
      (addDoc as jest.Mock).mockResolvedValue(mockNewDocRef);

      const result = await createNewConversation(mockUserId, mockTitle, mockAgentId);

      expect(addDoc).toHaveBeenCalledWith(
        undefined, // collection(firestore, CONVERSATIONS_COLLECTION) will be undefined due to mock
        expect.objectContaining({
          userId: mockUserId,
          agentId: mockAgentId,
          title: mockTitle,
          // createdAt: serverTimestamp(), // serverTimestamp() is mocked
          // updatedAt: serverTimestamp(), // serverTimestamp() is mocked
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: mockNewDocRef.id,
          title: mockTitle,
          userId: mockUserId,
          agentId: mockAgentId,
          messages: [],
        }),
      );
      // Check if createdAt and updatedAt are dates (approximate check)
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null if userId is not provided', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      // @ts-ignore // Testing invalid input
      const result = await createNewConversation(null, 'Test Chat');
      expect(result).toBeNull();
      expect(addDoc).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith("createNewConversation: userId is required.");
      consoleErrorSpy.mockRestore();
    });

    it('should use a default title if none is provided', async () => {
        const mockNewDocRef = { id: 'newConvIdDefaultTitle' };
        (addDoc as jest.Mock).mockResolvedValue(mockNewDocRef);

        const result = await createNewConversation(mockUserId);
        const expectedDefaultTitlePattern = /Chat \d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} (AM|PM)/;


        expect(addDoc).toHaveBeenCalledWith(
            undefined,
            expect.objectContaining({
                userId: mockUserId,
                title: expect.stringMatching(expectedDefaultTitlePattern),
            })
        );
        expect(result?.title).toMatch(expectedDefaultTitlePattern);
    });


    it('should return null if Firestore operation fails', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        (addDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await createNewConversation(mockUserId, 'Error Case');
        expect(result).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error creating new conversation in Firestore:", expect.any(Error));
        consoleErrorSpy.mockRestore();
    });

  });

  describe('getAllConversations', () => {
    it('should fetch all conversations for a user', async () => {
      const mockSnapshot = {
        forEach: (callback: (doc: any) => void) => {
          callback({ id: 'conv1', data: () => ({ userId: mockUserId, title: 'Conv 1', createdAt: Timestamp.fromDate(new Date()), updatedAt: Timestamp.fromDate(new Date()) }) });
          callback({ id: 'conv2', data: () => ({ userId: mockUserId, title: 'Conv 2', createdAt: Timestamp.fromDate(new Date()), updatedAt: Timestamp.fromDate(new Date()) }) });
        }
      };
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const conversations = await getAllConversations(mockUserId);
      expect(query).toHaveBeenCalled(); // query(collection(firestore, CONVERSATIONS_COLLECTION), where(...), orderBy(...))
      expect(getDocs).toHaveBeenCalled();
      expect(conversations).toHaveLength(2);
      expect(conversations[0]).toEqual(expect.objectContaining({ id: 'conv1', title: 'Conv 1' }));
      expect(conversations[1]).toEqual(expect.objectContaining({ id: 'conv2', title: 'Conv 2' }));
    });

     it('should return an empty array if userId is not provided', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      // @ts-ignore // Testing invalid input
      const result = await getAllConversations(null);
      expect(result).toEqual([]);
      expect(getDocs).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith("getAllConversations: userId is required.");
      consoleErrorSpy.mockRestore();
    });

    it('should return an empty array if Firestore operation fails', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

        const result = await getAllConversations(mockUserId);
        expect(result).toEqual([]);
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching all conversations from Firestore:", expect.any(Error));
        consoleErrorSpy.mockRestore();
    });
  });

  // TODO: Add more tests for getConversationById, addMessageToConversation, renameConversationInStorage, deleteConversationFromStorage etc.
  // Example for getConversationById (structure only)
  describe('getConversationById', () => {
    it('should fetch a specific conversation and its messages', async () => {
      // Mock getDoc for conversation
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        id: mockConversationId,
        data: () => ({ title: 'Test Convo Details', userId: mockUserId, createdAt: Timestamp.fromDate(new Date()), updatedAt: Timestamp.fromDate(new Date()) }),
      });
      // Mock getDocs for messages subcollection
      (getDocs as jest.Mock).mockResolvedValueOnce({
        empty: false,
        forEach: (callback: (doc: any) => void) => {
          callback({ id: 'msg1', data: () => ({ sender: 'user', text: 'Hello', timestamp: Timestamp.fromDate(new Date()) }) });
        }
      });

      const conversation = await getConversationById(mockConversationId);
      expect(getDoc).toHaveBeenCalledWith(undefined); // doc(firestore, CONVERSATIONS_COLLECTION, mockConversationId)
      expect(getDocs).toHaveBeenCalledWith(undefined); // query(collection(docRef, MESSAGES_SUBCOLLECTION), orderBy("timestamp", "asc"))
      expect(conversation).toBeDefined();
      expect(conversation?.id).toBe(mockConversationId);
      expect(conversation?.messages).toHaveLength(1);
      expect(conversation?.messages[0]?.text).toBe('Hello');
    });

    it('should return undefined if conversationId is not provided', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      // @ts-ignore
      const result = await getConversationById(null);
      expect(result).toBeUndefined();
      expect(getDoc).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith("getConversationById: conversationId is required.");
      consoleErrorSpy.mockRestore();
    });

    it('should return undefined if conversation does not exist', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false });
      const result = await getConversationById('nonExistentId');
      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith("Conversation with ID nonExistentId not found.");
      consoleWarnSpy.mockRestore();
    });

    it('should return undefined if Firestore operation fails', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));
        const result = await getConversationById(mockConversationId);
        expect(result).toBeUndefined();
        expect(consoleErrorSpy).toHaveBeenCalledWith(`Error fetching conversation ${mockConversationId} from Firestore:`, expect.any(Error));
        consoleErrorSpy.mockRestore();
    });
  });

  // Add more describe blocks for other functions...
});
