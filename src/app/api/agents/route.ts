// src/app/api/agents/route.ts
import { NextResponse } from "next/server";
import * as AgentActions from "@/app/agent-builder/actions";
import { SavedAgentConfiguration } from "@/types/agent-configs-fixed";
import { winstonLogger } from '@/lib/winston-logger';
import { writeLogEntry } from '@/lib/logService';

/**
 * Endpoint para criar/configurar agentes (Create Agent)
 */
export async function POST(request: Request) {
  const requestUrl = request.url; // For logging context
  let userId = request.headers.get("x-user-id"); // Initialize userId

  try {
    if (!userId) {
      // Although this is a validation error, it's critical enough for an immediate return.
      // Logging it as a warning as it's a client error.
      winstonLogger.warn('[API Agents POST] Missing x-user-id header.', { requestUrl });
      return NextResponse.json(
        { success: false, error: "User ID is missing in request headers.", code: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    let agentConfigData;
    try {
      agentConfigData = await request.json();
    } catch (parseError: any) {
      winstonLogger.error('[API Agents POST] JSON parsing error.', {
        userId,
        requestUrl,
        error: { message: parseError.message, stack: parseError.stack }
      });
      return NextResponse.json(
        { success: false, error: "Invalid request body: " + parseError.message, code: "BAD_REQUEST" },
        { status: 400 }
      );
    }
    
    if (!agentConfigData || typeof agentConfigData !== 'object' || !agentConfigData.name) {
      winstonLogger.warn('[API Agents POST] Invalid agent configuration data provided.', { userId, requestUrl, receivedConfig: agentConfigData });
      return NextResponse.json(
            { success: false, error: "Invalid agent configuration data provided.", code: "INVALID_AGENT_CONFIG" },
            { status: 400 }
        );
    }

    const fullAgentConfig: SavedAgentConfiguration = {
      ...agentConfigData,
      id: `temp-${Date.now()}`,
      userId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isTemplate: agentConfigData.isTemplate || false,
    };

    const result = await AgentActions.createAgent(fullAgentConfig);

    if (result.success) {
      winstonLogger.info('[API Agents POST] Agent created successfully.', { userId, agentId: result.data?.id, requestUrl });
      return NextResponse.json(
        { success: true, data: result.data },
        { status: 201 }
      );
    } else {
      // Log critical failure to create agent to both Winston and Firestore
      winstonLogger.error('[API Agents POST] Agent creation failed via AgentActions.', {
        userId,
        requestUrl,
        error: result.error,
        agentName: fullAgentConfig.name
      });
      // Persist this specific business logic failure to Firestore
      await writeLogEntry({
        type: 'error',
        severity: 'ERROR',
        flowName: 'AgentCreation',
        agentId: userId, // User who attempted to create
        message: 'Failed to create agent using AgentActions.createAgent.',
        details: {
          error: result.error || "Unknown error from AgentActions",
          attemptedAgentName: fullAgentConfig.name,
          userIdAttempted: userId,
          requestUrl,
        },
      });
      return NextResponse.json(
        { success: false, error: result.error || "Failed to create agent.", code: "AGENT_CREATION_FAILED" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    winstonLogger.error('[API Agents POST] Unhandled exception.', {
      userId: userId || "unknown", // userId might not be set if error occurred before its extraction
      requestUrl,
      error: { message: error.message, stack: error.stack, name: error.name }
    });
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected internal server error occurred.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para listar agentes (List Agents)
 */
export async function GET(request: Request) {
  const requestUrl = request.url;
  let userId = request.headers.get("x-user-id");

  try {
    if (!userId) {
      winstonLogger.warn('[API Agents GET] Missing x-user-id header.', { requestUrl });
      return NextResponse.json(
        { success: false, error: "User ID is missing in request headers.", code: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    const agents = await AgentActions.listAgents(userId);
    winstonLogger.debug('[API Agents GET] Agents listed successfully.', { userId, count: agents?.length, requestUrl });

    return NextResponse.json(
        { success: true, data: agents },
        { status: 200 }
    );
  } catch (error: any) {
    winstonLogger.error('[API Agents GET] Unhandled exception during agent listing.', {
      userId: userId || "unknown",
      requestUrl,
      error: { message: error.message, stack: error.stack, name: error.name }
    });
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve agents.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}