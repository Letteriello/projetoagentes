import { NextRequest, NextResponse } from "next/server";

// This should ideally interact with the same in-memory store as in src/app/api/apikeys/route.ts
// For demonstration, we'll re-declare it here. In a real app, use a shared module or database.
let registeredServices: {
  id: string;
  serviceName: string;
  dateAdded: string;
}[] = [
  // This array should be kept in sync with the one in the main route.ts or managed by a shared data service.
  // Since this is a separate file and for demo purposes, it won't share the exact instance from the other route.
  // This limitation needs to be addressed with a proper data store in a real application.
];

/**
 * Handles DELETE requests to deregister an API service by its ID.
 * The ID is taken from the dynamic path parameter.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const idToDelete = params.id;

    if (!idToDelete) {
      return NextResponse.json(
        { error: "Service ID is required for deletion." },
        { status: 400 },
      );
    }

    console.log(
      `API Route (Dynamic): Received request to delete service with ID: ${idToDelete}`,
    );

    const initialLength = registeredServices.length;
    // Note: This `registeredServices` array is local to this file's scope in this simplified example.
    // In a real application, this would interact with a database or a shared in-memory store
    // to ensure consistency with the main /api/apikeys route.
    // For this subtask, we are simulating the deletion. A GET after DELETE might still show the item
    // if the main route's in-memory array was not affected. This is a known limitation of the current approach.

    const serviceExists = registeredServices.find(
      (service) => service.id === idToDelete,
    );
    if (!serviceExists) {
      // To mimic actual deletion behavior even if the array here is not the "source of truth"
      // we can assume it was deleted if the frontend thinks it exists.
      // Or, for a more robust simulation, this endpoint could be aware of the main list.
      // For now, we'll proceed as if it might exist and try to filter.
      // A better simulation would be to return 404 if not found, but the prompt asks to simulate success.
      console.log(
        `API Route (Dynamic): Service with ID ${idToDelete} not found in this local array, but proceeding with simulated success.`,
      );
    }

    registeredServices = registeredServices.filter(
      (service) => service.id !== idToDelete,
    );

    if (registeredServices.length < initialLength || serviceExists) {
      // Check if something was "removed" or if it was "found"
      console.log(
        `API Route (Dynamic): Service with ID "${idToDelete}" (conceptually) deregistered.`,
      );
      return NextResponse.json(
        { message: `Service with ID ${idToDelete} deregistered successfully.` },
        { status: 200 },
      );
    } else {
      // If strict checking is desired and the item must be in *this* array:
      // return NextResponse.json({ error: `Service with ID ${idToDelete} not found.` }, { status: 404 });
      // Per instructions, simulate success.
      console.log(
        `API Route (Dynamic): Service with ID ${idToDelete} not found in local array, but simulating successful deletion as per instructions.`,
      );
      return NextResponse.json(
        {
          message: `Service with ID ${idToDelete} (simulated) deregistered successfully.`,
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error(`API Route DELETE /api/apikeys/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to deregister service." },
      { status: 500 },
    );
  }
}
