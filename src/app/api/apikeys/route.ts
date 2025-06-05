import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { ApiKeyVaultEntry } from "@/types/apiKeyVaultTypes";

// In-memory store for demonstration purposes
// Exporting this to allow mutation from [id]/route.ts
export let registeredServices: ApiKeyVaultEntry[] = [
  // Example initial data:
  // {
  //   id: uuidv4(),
  //   serviceName: "OpenAI API Key",
  //   dateAdded: new Date().toISOString(),
  //   serviceType: "OpenAI",
  //   associatedAgents: ["agent123"],
  //   lastUsed: new Date().toISOString(),
  // },
  // {
  //   id: uuidv4(),
  //   serviceName: "Google Search API Key",
  //   dateAdded: new Date().toISOString(),
  //   serviceType: "Google Search",
  // },
];

/**
 * Handles POST requests to register a new API service.
 * Expects a JSON body with 'serviceName' and 'serviceType' properties.
 * 'associatedAgents' is optional.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceName, serviceType, associatedAgents } = body;

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

    if (
      !serviceType ||
      typeof serviceType !== "string" ||
      serviceType.trim() === ""
    ) {
      return NextResponse.json(
        { error: "Service type is required and must be a non-empty string." },
        { status: 400 },
      );
    }

    console.log(
      `API Route: Received request to register service: ${serviceName}, type: ${serviceType}`,
    );

    const newService: ApiKeyVaultEntry = {
      id: uuidv4(),
      serviceName: serviceName.trim(),
      dateAdded: new Date().toISOString(),
      serviceType: serviceType.trim(),
      associatedAgents: Array.isArray(associatedAgents) ? associatedAgents : [],
      lastUsed: new Date().toISOString(), // Initialize lastUsed on creation
    };

    registeredServices.push(newService);

    console.log(
      `API Route: Service "${newService.serviceName}" (type: ${newService.serviceType}) registered successfully with ID ${newService.id}.`,
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
