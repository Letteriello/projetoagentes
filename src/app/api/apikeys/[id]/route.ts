import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin"; // Assuming firebaseAdmin.ts initializes and exports 'db'
import { FieldValue } from "firebase-admin/firestore";
import { ApiKeyMetadata } from "@/types/apiKeyVaultTypes"; // Assuming this type is defined and suitable

const API_KEYS_COLLECTION = "api_keys";

interface UpdateApiKeyRequest {
  name?: string;
  keyReference?: string;
  serviceType?: string;
  description?: string;
  permissions?: string[];
  associatedAgents?: string[];
  isActive?: boolean;
  // lastUsed is typically updated by usage, not direct PUT, unless specified.
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }, // id is the Firestore document ID
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is missing in request headers.", code: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    const keyId = params.id;
    if (!keyId) {
      // This should ideally be caught by Next.js routing if id is missing in path
      return NextResponse.json({ success: false, error: "API Key ID is required in path.", code: "MISSING_KEY_ID" }, { status: 400 });
    }

    const docRef = db.collection(API_KEYS_COLLECTION).doc(keyId);

    await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);

      if (!docSnap.exists) {
        // Throw an error to be caught by the outer catch, then return 404
        throw new Error("NOT_FOUND");
      }

      const data = docSnap.data();
      if (data?.userId !== userId) {
        // Throw an error for forbidden access
        throw new Error("FORBIDDEN");
      }

      transaction.delete(docRef);
    });

    return NextResponse.json(
      { success: true, message: "API key metadata deleted successfully." },
      { status: 200 } // Can also be 204 No Content, but 200 with message is often clearer
    );

  } catch (error: any) {
    console.error(`[APIKEYS DELETE /api/apikeys/${params.id}]`, error);
    if (error.message === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "API key metadata not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "User is not authorized to delete this API key metadata.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete API key metadata.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }, // id is the Firestore document ID
) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is missing in request headers.", code: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    const keyId = params.id;
    if (!keyId) {
      return NextResponse.json({ success: false, error: "API Key ID is required in path.", code: "MISSING_KEY_ID" }, { status: 400 });
    }

    let body: UpdateApiKeyRequest;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    // Validate that the body is not empty and contains at least one updatable field
    if (Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, error: "Request body is empty. Provide at least one field to update.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updateData: { [key: string]: any } = {}; // Build a dynamic update object

    // Validate and add fields to updateData
    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        return NextResponse.json({ success: false, error: "API key name must be a non-empty string.", code: "VALIDATION_ERROR" }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }
    if (body.keyReference !== undefined) {
      if (typeof body.keyReference !== "string" || body.keyReference.trim() === "") {
        return NextResponse.json({ success: false, error: "API key reference must be a non-empty string.", code: "VALIDATION_ERROR" }, { status: 400 });
      }
      updateData.keyReference = body.keyReference.trim();
    }
    if (body.serviceType !== undefined) {
      if (typeof body.serviceType !== "string" || body.serviceType.trim() === "") {
        return NextResponse.json({ success: false, error: "Service type must be a non-empty string.", code: "VALIDATION_ERROR" }, { status: 400 });
      }
      updateData.serviceType = body.serviceType.trim();
    }
    if (body.description !== undefined) {
      if (typeof body.description !== "string") {
        return NextResponse.json({ success: false, error: "Description must be a string.", code: "VALIDATION_ERROR" }, { status: 400 });
      }
      updateData.description = body.description;
    }
    if (body.permissions !== undefined) {
      if (!Array.isArray(body.permissions) || !body.permissions.every(p => typeof p === 'string')) {
        return NextResponse.json({ success: false, error: "Permissions must be an array of strings.", code: "VALIDATION_ERROR" }, { status: 400 });
      }
      updateData.permissions = body.permissions;
    }
    if (body.associatedAgents !== undefined) {
      if (!Array.isArray(body.associatedAgents) || !body.associatedAgents.every(a => typeof a === 'string')) {
        return NextResponse.json({ success: false, error: "Associated agents must be an array of strings.", code: "VALIDATION_ERROR" }, { status: 400 });
      }
      updateData.associatedAgents = body.associatedAgents;
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json({ success: false, error: "isActive must be a boolean.", code: "VALIDATION_ERROR" }, { status: 400 });
      }
      updateData.isActive = body.isActive;
    }
     // Ensure there's something to update if specific checks passed but object is still empty
    if (Object.keys(updateData).length === 0 && Object.keys(body).length > 0) {
        // This case might happen if body contained only fields not matching UpdateApiKeyRequest, e.g. "id"
        return NextResponse.json(
            { success: false, error: "No valid fields provided for update.", code: "VALIDATION_ERROR" },
            { status: 400 }
        );
    } else if (Object.keys(updateData).length === 0) { // if body was empty, it's caught above
         return NextResponse.json(
            { success: false, error: "No updatable fields provided.", code: "VALIDATION_ERROR" },
            { status: 400 }
        );
    }


    updateData.updatedAt = FieldValue.serverTimestamp();
    const docRef = db.collection(API_KEYS_COLLECTION).doc(keyId);
    let updatedApiKey: ApiKeyMetadata | null = null;

    await db.runTransaction(async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists) {
        throw new Error("NOT_FOUND");
      }
      const currentData = docSnap.data() as ApiKeyMetadata; // Cast to ensure type
      if (currentData.userId !== userId) {
        throw new Error("FORBIDDEN");
      }
      transaction.update(docRef, updateData);
      // For the response, merge updateData with currentData and simulate timestamp update
      updatedApiKey = {
        ...currentData,
        ...updateData,
        id: keyId,
        updatedAt: new Date().toISOString() // Placeholder, actual is server-generated
      };
    });

    if (!updatedApiKey) { // Should not happen if transaction was successful
        throw new Error("Update failed to return data.");
    }

    return NextResponse.json({ success: true, data: updatedApiKey }, { status: 200 });

  } catch (error: any) {
    console.error(`[APIKEYS PUT /api/apikeys/${params.id}]`, error);
    if (error.message === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, error: "API key metadata not found.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, error: "User is not authorized to update this API key metadata.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }
    // Handle SyntaxError from request.json() if not caught earlier (though it is)
    if (error instanceof SyntaxError) {
        return NextResponse.json( { success: false, error: "Invalid JSON payload.", code: "BAD_REQUEST" }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: "Failed to update API key metadata.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
