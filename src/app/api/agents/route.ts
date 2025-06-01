// src/app/api/agents/route.ts
import { NextResponse } from "next/server";
import { createAgent, listAgents } from "@/app/agent-builder/actions";
import { SavedAgentConfiguration } from "@/types/agent-configs";

// TODO: Replace with actual authentication mechanism to get userId
const PLACEHOLDER_USER_ID = "test-user-id";

export async function POST(request: Request) {
  try {
    const agentConfigData = (await request.json()) as Omit<
      SavedAgentConfiguration,
      "id" | "createdAt" | "updatedAt" | "userId"
    >;

    // Input validation (basic example)
    if (!agentConfigData || !agentConfigData.name) {
      return NextResponse.json(
        { error: "Invalid agent data provided. Name is required." },
        { status: 400 }
      );
    }

    const result = await createAgent(agentConfigData, PLACEHOLDER_USER_ID);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 201 }); // 201 Created
  } catch (e: any) {
    console.error("Error in POST /api/agents:", e);
    // Check for specific error types if needed, e.g., JSON parsing errors
    if (e instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
    return NextResponse.json(
      { error: e.message || "Failed to create agent." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await listAgents(PLACEHOLDER_USER_ID);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (e: any) {
    console.error("Error in GET /api/agents:", e);
    return NextResponse.json(
      { error: e.message || "Failed to list agents." },
      { status: 500 }
    );
  }
}
