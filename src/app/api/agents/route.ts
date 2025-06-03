// src/app/api/agents/route.ts
import { NextResponse } from "next/server";
import * as AgentActions from "@/app/agent-builder/actions";
import { SavedAgentConfiguration } from "@/types/agent-configs-fixed";
import type { ApiResponse } from "@/types/api-types";

// TODO: Replace with actual authentication mechanism to get userId
const PLACEHOLDER_USER_ID = "test-user-id";

/**
 * Endpoint para criar/configurar agentes
 */
export async function POST(request: Request) {
  try {
    const agentConfigData = await request.json();
    
    const fullAgentConfig: SavedAgentConfiguration = {
      ...agentConfigData,
      id: `temp-${Date.now()}`,
      userId: PLACEHOLDER_USER_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isTemplate: false
    };

    // Chamada para criar o agente
    const result = await AgentActions.createAgent(fullAgentConfig);

    return NextResponse.json(result, { 
      status: result.success ? 200 : 500 
    });
  } catch (error: any) {
    console.error("[AgentsAPI] POST error:", error);
    const response: ApiResponse = {
      success: false,
      error: error.message || "Internal Server Error",
      timestamp: new Date().toISOString()
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * Endpoint para listar agentes
 */
export async function GET() {
  try {
    // Chamada para listar agentes
    const agents = await AgentActions.listAgents(PLACEHOLDER_USER_ID);
    return NextResponse.json(agents);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}