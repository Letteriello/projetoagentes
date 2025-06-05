// src/app/api/apikeys/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  ApiKeyMetadata,
  RegisterApiKeyPayload,
} from '@/types/apiKeyVaultTypes';
import { encryptApiKey } from '@/lib/server-utils'; // Import encryption utility

const API_KEYS_COLLECTION = 'api_key_metadata'; // Collection name for metadata

// Helper to generate display fragment
const createDisplayFragment = (apiKey: string): string => {
  if (!apiKey || apiKey.length < 8) return '...';
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
};


export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id'); // Assuming authentication middleware sets this
    if (!userId) {
      return NextResponse.json({ error: 'User authentication required.' }, { status: 401 });
    }

    const payload: RegisterApiKeyPayload = await request.json();

    // --- Enhanced Validation Start ---
    if (!payload.serviceName || !payload.serviceType) {
      return NextResponse.json({ error: 'Missing required fields: serviceName, serviceType.' }, { status: 400 });
    }

    if (typeof payload.apiKey !== 'string') {
      return NextResponse.json({ error: 'API key must be a string.' }, { status: 400 });
    }

    const trimmedApiKey = payload.apiKey.trim(); // Use trimmed key

    if (trimmedApiKey === '') { // Check after trimming
        return NextResponse.json({ error: 'API key cannot be empty.' }, { status: 400 });
    }

    const MAX_API_KEY_LENGTH = 1024; // Define a max length
    if (trimmedApiKey.length > MAX_API_KEY_LENGTH) {
      return NextResponse.json({ error: `API key exceeds maximum allowed length of ${MAX_API_KEY_LENGTH} characters.` }, { status: 400 });
    }
    // --- Enhanced Validation End ---

    // Use trimmedApiKey for encryption and fragment creation
    const encryptedApiKey = encryptApiKey(trimmedApiKey);
    const displayFragment = payload.displayFragment || createDisplayFragment(trimmedApiKey);
    const createdAt = new Date().toISOString();

    const newApiKeyMetadata: Omit<ApiKeyMetadata, 'id'> & { userId: string; encryptedApiKey: string } = {
      userId,
      serviceName: payload.serviceName,
      serviceType: payload.serviceType,
      displayFragment,
      associatedAgents: payload.associatedAgents || [],
      encryptedApiKey, // Store the encrypted key
      createdAt,
      updatedAt: createdAt,
    };

    const docRef = await db.collection(API_KEYS_COLLECTION).add({
      ...newApiKeyMetadata,
      // Use Firestore server timestamp for actual storage
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const responseMetadata: ApiKeyMetadata = {
      id: docRef.id,
      serviceName: newApiKeyMetadata.serviceName,
      serviceType: newApiKeyMetadata.serviceType,
      displayFragment: newApiKeyMetadata.displayFragment,
      associatedAgents: newApiKeyMetadata.associatedAgents,
      createdAt: createdAt, // Return the ISO string we generated
      updatedAt: createdAt, // Return the ISO string we generated
    };

    return NextResponse.json(responseMetadata, { status: 201 });

  } catch (error: any) {
    console.error('[APIKEYS POST]', error);
    if (error.message.includes('Could not encrypt API key')) {
        return NextResponse.json({ error: 'Server configuration error: Could not secure API key.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to register API key.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User authentication required.' }, { status: 401 });
    }

    const snapshot = await db.collection(API_KEYS_COLLECTION).where('userId', '==', userId).orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      return NextResponse.json([], { status: 200 });
    }

    const apiKeys: ApiKeyMetadata[] = snapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure Timestamps are converted correctly
      const createdAtTimestamp = data.createdAt as FirebaseFirestore.Timestamp;
      const updatedAtTimestamp = data.updatedAt as FirebaseFirestore.Timestamp;

      return {
        id: doc.id,
        serviceName: data.serviceName,
        serviceType: data.serviceType,
        displayFragment: data.displayFragment,
        associatedAgents: data.associatedAgents || [],
        // IMPORTANT: Do NOT return encryptedApiKey or the actual key
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date(0).toISOString(),
        updatedAt: updatedAtTimestamp ? updatedAtTimestamp.toDate().toISOString() : new Date(0).toISOString(),
      };
    });

    return NextResponse.json(apiKeys, { status: 200 });

  } catch (error: any) {
    console.error('[APIKEYS GET]', error);
    return NextResponse.json({ error: 'Failed to retrieve API key metadata list.' }, { status: 500 });
  }
}
