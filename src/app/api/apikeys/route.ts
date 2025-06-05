import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin"; // Assuming firebaseAdmin.ts initializes and exports 'db'
import { FieldValue } from "firebase-admin/firestore";
import { ApiKeyMetadata } from "@/types/apiKeyVaultTypes"; // Assuming this type will be adapted or defined

const API_KEYS_COLLECTION = "api_keys";

interface CreateApiKeyRequest {
  name: string;
  keyReference: string; // Identifier for the key (e.g., env var name, Secret Manager ID)
  serviceType: string;
  description?: string;
  permissions?: string[];
  associatedAgents?: string[];
  isActive?: boolean;
}

/**
 * Handles POST requests to create a new API key metadata entry in Firestore.
 * The actual API key is NOT stored. This entry contains metadata about the key.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is missing in request headers.", code: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    let body: CreateApiKeyRequest;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    const { name, keyReference, serviceType, description, permissions, associatedAgents, isActive } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "API key name is required and must be a non-empty string.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    if (!keyReference || typeof keyReference !== "string" || keyReference.trim() === "") {
      return NextResponse.json(
        { success: false, error: "API key reference is required and must be a non-empty string.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }
    if (!serviceType || typeof serviceType !== "string" || serviceType.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Service type is required and must be a non-empty string.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Prepare data for Firestore
    const newApiKeyData: Omit<ApiKeyMetadata, "id"> = {
      userId,
      name: name.trim(),
      keyReference: keyReference.trim(),
      serviceType: serviceType.trim(),
      description: description || "",
      permissions: Array.isArray(permissions) ? permissions : [],
      associatedAgents: Array.isArray(associatedAgents) ? associatedAgents : [],
      isActive: typeof isActive === 'boolean' ? isActive : true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      // lastUsed can be omitted on creation or set to a specific value if needed
    };

    // Add to Firestore
    const docRef = await db.collection(API_KEYS_COLLECTION).add(newApiKeyData);

    // Return the created document's data, now including its ID and server-generated timestamps
    const createdApiKey: ApiKeyMetadata = {
      id: docRef.id,
      ...newApiKeyData,
      // Timestamps will be server-generated, so we cast them for the response type
      // Or fetch the document again: const snapshot = await docRef.get(); return snapshot.data()
      createdAt: new Date().toISOString(), // Placeholder, actual value is server-generated
      updatedAt: new Date().toISOString(), // Placeholder, actual value is server-generated
    };

    // For a more accurate response with server timestamps, you might fetch the doc:
    // const snapshot = await docRef.get();
    // const createdData = snapshot.data() as ApiKeyMetadata;
    // return NextResponse.json({ success: true, data: { ...createdData, id: snapshot.id } }, { status: 201 });

    return NextResponse.json({ success: true, data: createdApiKey }, { status: 201 });

  } catch (error: any) {
    console.error("[APIKEYS POST]", error);
    // Log the error using Winston or a preferred logger if available
    return NextResponse.json(
      { success: false, error: "Failed to create API key metadata.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * Handles GET requests to retrieve all API key metadata entries for a given user.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is missing in request headers.", code: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    const snapshot = await db.collection(API_KEYS_COLLECTION).where("userId", "==", userId).get();

    if (snapshot.empty) {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }

    const apiKeys: ApiKeyMetadata[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        keyReference: data.keyReference,
        serviceType: data.serviceType,
        description: data.description,
        permissions: data.permissions,
        associatedAgents: data.associatedAgents,
        isActive: data.isActive,
        // Convert Firestore Timestamps to ISO strings for JSON response
        createdAt: (data.createdAt as FirebaseFirestore.Timestamp)?.toDate().toISOString() || new Date(0).toISOString(),
        updatedAt: (data.updatedAt as FirebaseFirestore.Timestamp)?.toDate().toISOString() || new Date(0).toISOString(),
        lastUsed: (data.lastUsed as FirebaseFirestore.Timestamp)?.toDate().toISOString() || undefined,
      } as ApiKeyMetadata; // Type assertion might be needed if structure isn't perfectly matched
    });

    return NextResponse.json({ success: true, data: apiKeys }, { status: 200 });

  } catch (error: any) {
    console.error("[APIKEYS GET]", error);
    // Log the error using Winston or a preferred logger if available
    return NextResponse.json(
      { success: false, error: "Failed to retrieve API key metadata.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
