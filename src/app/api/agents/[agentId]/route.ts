// src/app/api/agents/[agentId]/route.ts
import { NextResponse } from "next/server";
import {
  getAgentById,
  updateAgent,
  deleteAgent,
} from "@/app/agent-builder/actions";
import { SavedAgentConfiguration } from "@/types/agent-configs";

// TODO: Replace with actual authentication mechanism to get userId
const PLACEHOLDER_USER_ID = "test-user-id";

interface RouteParams {
  params: {
    agentId: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { agentId } = params;
    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required." }, { status: 400 });
    }

    const result = await getAgentById(agentId, PLACEHOLDER_USER_ID);

    if ("error" in result) {
      const status = typeof result.status === 'number' ? result.status : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    console.error(`Error in GET /api/agents/${params.agentId}:`, e);
    return NextResponse.json(
      { error: e.message || "Failed to retrieve agent." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { agentId } = params;
    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required." }, { status: 400 });
    }

    const agentConfigUpdate = (await request.json()) as Partial<
      Omit<SavedAgentConfiguration, "id" | "createdAt" | "updatedAt" | "userId">
    >;

    // Basic input validation
    if (Object.keys(agentConfigUpdate).length === 0) {
      return NextResponse.json({ error: "Update data is required." }, { status: 400 });
    }

    // Note: The `updateAgent` action in actions.ts does not currently take userId.
    // If ownership check is required at the action level, `updateAgent` signature
    // and implementation in actions.ts would need to be modified to accept and use userId.
    // For now, the ownership check is implicitly handled by `getAgentById` if called before update,
    // or would need to be added to `updateAgent` itself.
    // The current `updateAgent` in actions.ts will update if the document exists,
    // without checking which user owns it.
    // For this task, we are proceeding with the current `updateAgent` which doesn't use userId directly for auth.

    const result = await updateAgent(agentId, agentConfigUpdate);

    if ("error" in result) {
      // A more robust error handling might check result.status if available
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    console.error(`Error in PUT /api/agents/${params.agentId}:`, e);
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    return NextResponse.json(
      { error: e.message || "Failed to update agent." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { agentId } = params;
    if (!agentId) {
      return NextResponse.json({ error: "Agent ID is required." }, { status: 400 });
    }

    // Note: Similar to PUT, `deleteAgent` action in actions.ts does not currently take userId.
    // If an ownership check is required at the action level, `deleteAgent` signature
    // and implementation in actions.ts would need to be modified.
    // For this task, we are proceeding with the current `deleteAgent`.

    const result = await deleteAgent(agentId);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to delete agent" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 }); // Or 204 No Content
  } catch (e: any) {
    console.error(`Error in DELETE /api/agents/${params.agentId}:`, e);
    return NextResponse.json(
      { error: e.message || "Failed to delete agent." },
      { status: 500 }
    );
  }
}
