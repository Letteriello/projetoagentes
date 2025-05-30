import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// In-memory store for demonstration purposes
let registeredServices: {
  id: string;
  serviceName: string;
  dateAdded: string;
}[] = [
  // Example initial data:
  // { id: uuidv4(), serviceName: "OpenAI API Key", dateAdded: new Date().toISOString().split("T")[0] },
  // { id: uuidv4(), serviceName: "Google Search API Key", dateAdded: new Date().toISOString().split("T")[0] },
];

/**
 * Handles POST requests to register a new API service.
 * Expects a JSON body with a 'serviceName' property.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceName } = body;

    if (
      !serviceName ||
      typeof serviceName !== "string" ||
      serviceName.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Service name is required and must be a non-empty string." },
        { status: 400 },
      );
    }

    console.log(
      `API Route: Received request to register service: ${serviceName}`,
    );

    const newService = {
      id: uuidv4(),
      serviceName: serviceName.trim(),
      dateAdded: new Date().toISOString().split("T")[0],
    };

    registeredServices.push(newService);

    console.log(
      `API Route: Service "${serviceName}" registered successfully with ID ${newService.id}.`,
    );
    // TODO: Actual backend logic to verify/store key availability (e.g., check env vars) would go here.

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error("API Route POST /api/apikeys error:", error);
    if (error instanceof SyntaxError) {
      // Handle cases where request.json() fails
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to register service." },
      { status: 500 },
    );
  }
}

/**
 * Handles GET requests to retrieve all registered API services.
 */
export async function GET(request: NextRequest) {
  try {
    console.log("API Route: Received request to list all registered services.");
    // In a real application, this data would come from a database or secure configuration.
    return NextResponse.json(registeredServices, { status: 200 });
  } catch (error) {
    console.error("API Route GET /api/apikeys error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve services." },
      { status: 500 },
    );
  }
}

// Note: For DELETE, Next.js App Router typically uses dynamic segments for IDs,
// e.g., src/app/api/apikeys/[id]/route.ts
// However, the prompt implies a single route file for now.
// If we must use this single file, we'd parse the ID from the URL or body.
// For simplicity with the current structure and prompt, this DELETE won't be directly hit by /api/apikeys/{id}
// A more idiomatic approach would be a dynamic route file.
// The client-side is calling DELETE /api/apikeys/${deletingApiKey.id}
// So we need to create src/app/api/apikeys/[id]/route.ts for DELETE.
// For now, this DELETE function in this file won't be used as written.
// I will create the dynamic route file next.

/**
 * Handles DELETE requests to deregister an API service by its ID.
 * This function will be moved to `src/app/api/apikeys/[id]/route.ts`.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // This function is a placeholder here and will be properly implemented in [id]/route.ts
    // const id = params?.id; // This would be how params are accessed in a dynamic route
    // console.log(`API Route: Placeholder for DELETE request for ID: ${id}`);
    return NextResponse.json(
      { message: "DELETE method for specific ID should be in [id]/route.ts" },
      { status: 405 },
    );
  } catch (error) {
    console.error("API Route DELETE /api/apikeys error:", error);
    return NextResponse.json(
      { error: "Failed to deregister service." },
      { status: 500 },
    );
  }
}
