// src/app/api/apikeys/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  ApiKeyMetadata,
  UpdateApiKeyMetadataPayload,
} from '@/types/apiKeyVaultTypes';
// Note: decryptApiKey is not used in these handlers as keys are not returned to client.

const API_KEYS_COLLECTION = 'api_key_metadata'; // Updated collection name

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User authentication required.' }, { status: 401 });
    }

    const keyId = params.id;
    if (!keyId) {
      return NextResponse.json({ error: 'API Key ID is required.' }, { status: 400 });
    }

    const docRef = db.collection(API_KEYS_COLLECTION).doc(keyId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'API key metadata not found.' }, { status: 404 });
    }

    const data = docSnap.data()!;
    if (data.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const createdAtTimestamp = data.createdAt as FirebaseFirestore.Timestamp;
    const updatedAtTimestamp = data.updatedAt as FirebaseFirestore.Timestamp;

    const apiKeyMeta: ApiKeyMetadata = {
      id: docSnap.id,
      serviceName: data.serviceName,
      serviceType: data.serviceType,
      displayFragment: data.displayFragment,
      associatedAgents: data.associatedAgents || [],
      createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date(0).toISOString(),
      updatedAt: updatedAtTimestamp ? updatedAtTimestamp.toDate().toISOString() : new Date(0).toISOString(),
      // IMPORTANT: Do NOT return encryptedApiKey or the actual key
    };

    return NextResponse.json(apiKeyMeta, { status: 200 });

  } catch (error: any) {
    console.error(`[APIKEYS GET /api/apikeys/${params.id}]`, error);
    return NextResponse.json({ error: 'Failed to retrieve API key metadata.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User authentication required.' }, { status: 401 });
    }

    const keyId = params.id;
    if (!keyId) {
      return NextResponse.json({ error: 'API Key ID is required.' }, { status: 400 });
    }

    const payload: UpdateApiKeyMetadataPayload = await request.json();

    // Basic validation for payload: ensure it's not empty
    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: 'Request body cannot be empty. Provide at least one field to update.' }, { status: 400 });
    }

    const docRef = db.collection(API_KEYS_COLLECTION).doc(keyId);

    // Transaction to ensure atomicity and check ownership before update
    const updatedApiKeyMeta = await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists) {
        throw new Error('NOT_FOUND');
      }

      const currentData = docSnap.data()!;
      if (currentData.userId !== userId) {
        throw new Error('FORBIDDEN');
      }

      const updateData: Partial<ApiKeyMetadata> & { updatedAt: FieldValue } = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Populate updateData with allowed fields from payload
      if (payload.serviceName !== undefined) updateData.serviceName = payload.serviceName;
      if (payload.serviceType !== undefined) updateData.serviceType = payload.serviceType;
      if (payload.displayFragment !== undefined) updateData.displayFragment = payload.displayFragment;
      if (payload.associatedAgents !== undefined) updateData.associatedAgents = payload.associatedAgents;

      // Prevent modification of other fields like id, userId, encryptedApiKey, createdAt
      const allowedUpdates = ['serviceName', 'serviceType', 'displayFragment', 'associatedAgents'];
      for (const key in payload) {
          if (!allowedUpdates.includes(key)) {
              // This check is more for explicit error handling if unexpected fields are sent
              console.warn(`Attempted to update unallowed field: ${key}`);
              // Depending on strictness, you could throw an error here
          }
      }


      transaction.update(docRef, updateData);

      // Construct the response object based on current data + updates
      // Timestamps will be updated by server, so we use current time for optimistic response
      const responseTimestamp = new Date().toISOString();
      return {
        id: docSnap.id,
        serviceName: payload.serviceName ?? currentData.serviceName,
        serviceType: payload.serviceType ?? currentData.serviceType,
        displayFragment: payload.displayFragment ?? currentData.displayFragment,
        associatedAgents: payload.associatedAgents ?? currentData.associatedAgents,
        createdAt: (currentData.createdAt as FirebaseFirestore.Timestamp).toDate().toISOString(),
        updatedAt: responseTimestamp, // Optimistic update
      };
    });

    return NextResponse.json(updatedApiKeyMeta, { status: 200 });

  } catch (error: any) {
    console.error(`[APIKEYS PUT /api/apikeys/${params.id}]`, error);
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'API key metadata not found.' }, { status: 404 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update API key metadata.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User authentication required.' }, { status: 401 });
    }

    const keyId = params.id;
    if (!keyId) {
      return NextResponse.json({ error: 'API Key ID is required.' }, { status: 400 });
    }

    const docRef = db.collection(API_KEYS_COLLECTION).doc(keyId);

    await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists) {
        throw new Error('NOT_FOUND');
      }
      if (docSnap.data()!.userId !== userId) {
        throw new Error('FORBIDDEN');
      }
      transaction.delete(docRef);
    });

    return NextResponse.json({ message: "API key metadata deleted successfully." }, { status: 200 }); // Or 204 No Content

  } catch (error: any) {
    console.error(`[APIKEYS DELETE /api/apikeys/${params.id}]`, error);
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'API key metadata not found.' }, { status: 404 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to delete API key metadata.' }, { status: 500 });
  }
}
