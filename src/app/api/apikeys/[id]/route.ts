import { NextRequest, NextResponse } from "next/server";
// We need to import the actual registeredServices array from the parent route file.
// This requires `registeredServices` to be exported from `../route`.
// And crucially, for mutations (DELETE, PUT) to affect the original array,
// it must be the *same* array instance. In Node.js module caching usually handles this,
// but with Next.js serverless functions, this can be tricky.
// A proper database or external store is the robust solution.
// For this exercise, we'll assume direct import works as intended for shared in-memory state.

import { registeredServices } from "../route"; // Import from parent
import { ApiKeyVaultEntry } from "../../../types/apiKeyVaultTypes";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    console.log(`API Route: DELETE request for ID: ${id}`);

    const index = registeredServices.findIndex((service) => service.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    registeredServices.splice(index, 1); // Mutates the imported array
    console.log(`API Route: Service with ID ${id} deregistered.`);

    return NextResponse.json(
      { message: "Service deregistered successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(`API Route DELETE /api/apikeys/[id] error:`, error);
    return NextResponse.json(
      { error: "Failed to deregister service." },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const body = await request.json();
    // Only destructure fields that are expected and updatable
    const { serviceName, associatedAgents, serviceType } = body;

    console.log(`API Route: PUT request for ID: ${id} with body:`, body);

    const index = registeredServices.findIndex((service) => service.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const serviceToUpdate: ApiKeyVaultEntry = registeredServices[index];

    if (serviceName !== undefined) {
      if (typeof serviceName !== "string" || serviceName.trim() === "") {
        return NextResponse.json(
          { error: "Service name must be a non-empty string." },
          { status: 400 },
        );
      }
      serviceToUpdate.serviceName = serviceName.trim();
    }

    if (serviceType !== undefined) {
      if (typeof serviceType !== "string" || serviceType.trim() === "") {
        return NextResponse.json(
          { error: "Service type must be a non-empty string." },
          { status: 400 },
        );
      }
      serviceToUpdate.serviceType = serviceType.trim();
    }

    if (associatedAgents !== undefined) {
      if (!Array.isArray(associatedAgents)) {
        return NextResponse.json(
          { error: "Associated agents must be an array." },
          { status: 400 },
        );
      }
      // Ensure all elements in associatedAgents are strings
      if (!associatedAgents.every(agentId => typeof agentId === 'string')) {
        return NextResponse.json(
          { error: "All associated agent IDs must be strings." },
          { status: 400 },
        );
      }
      serviceToUpdate.associatedAgents = associatedAgents;
    }

    // The `lastUsed` field should typically be updated when the key is *used*,
    // not necessarily when the entry is manually edited via PUT.
    // However, if the intention is to allow manual update of `lastUsed` via PUT:
    if (body.lastUsed !== undefined) {
      if (typeof body.lastUsed !== 'string' || isNaN(Date.parse(body.lastUsed))) {
         return NextResponse.json({ error: 'Invalid lastUsed date format. Must be ISO string.' }, { status: 400 });
      }
      serviceToUpdate.lastUsed = body.lastUsed;
    }


    // registeredServices[index] = serviceToUpdate; // This line is redundant as serviceToUpdate is a reference
    console.log(`API Route: Service with ID ${id} updated:`, serviceToUpdate);

    return NextResponse.json(serviceToUpdate, { status: 200 });
  } catch (error) {
    console.error(`API Route PUT /api/apikeys/[id] error:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON payload." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update service." },
      { status: 500 },
    );
  }
}
