// src/app/api/agents/[agentId]/route.ts
import { NextResponse } from "next/server";
import {
  getAgentById,
  updateAgent,
  deleteAgent,
} from "@/app/agent-builder/actions";
import { SavedAgentConfiguration } from '@/types/agent-core'; // Updated path
import { winstonLogger } from '@/lib/winston-logger';
import { writeLogEntry } from '@/lib/logService';

interface RouteParams {
  params: {
    agentId: string; // Firestore document ID of the agent
  };
}

// Common function to get user ID from headers
function getUserId(request: Request): string | null {
  return request.headers.get("x-user-id");
}

/**
 * Endpoint para buscar um agente específico (Get Agent by ID)
 */
export async function GET(request: Request, { params }: RouteParams) {
  const requestUrl = request.url;
  let userId = getUserId(request);
  const agentIdFromParams = params.agentId;

  try {
    if (!userId) {
      winstonLogger.warn('[API Agents GET /id] Missing x-user-id header.', { agentId: agentIdFromParams, requestUrl });
      return NextResponse.json(
        { success: false, error: "User ID is missing in request headers.", code: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    if (!agentIdFromParams) {
      winstonLogger.warn('[API Agents GET /id] Missing agentId in path.', { userId, requestUrl });
      return NextResponse.json(
        { success: false, error: "Agent ID is missing in request path.", code: "MISSING_AGENT_ID" },
        { status: 400 }
      );
    }

    const result = await getAgentById(agentIdFromParams, userId);

    if (result.error) {
      const statusCode = result.status === 404 ? 404 : 500;
      winstonLogger.warn(`[API Agents GET /id] Failed to get agent for user.`, {
        userId, agentId: agentIdFromParams, error: result.error, statusCode, requestUrl
      });
      return NextResponse.json(
        { success: false, error: result.error, code: statusCode === 404 ? "AGENT_NOT_FOUND" : "GET_AGENT_FAILED" },
        { status: statusCode }
      );
    }

    winstonLogger.info('[API Agents GET /id] Agent retrieved successfully.', { userId, agentId: agentIdFromParams, requestUrl });
    return NextResponse.json(
      { success: true, data: result.agent },
      { status: 200 }
    );
  } catch (e: any) {
    winstonLogger.error(`[API Agents GET /id] Unhandled exception.`, {
      userId: userId || "unknown",
      agentId: agentIdFromParams,
      requestUrl,
      error: { message: e.message, stack: e.stack, name: e.name }
    });
    return NextResponse.json(
      { success: false, error: e.message || "Failed to retrieve agent due to an unexpected server error.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para atualizar um agente específico (Update Agent by ID)
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const requestUrl = request.url;
  let userId = getUserId(request);
  const agentIdFromParams = params.agentId;

  try {
    if (!userId) {
      winstonLogger.warn('[API Agents PUT /id] Missing x-user-id header.', { agentId: agentIdFromParams, requestUrl });
      return NextResponse.json(
        { success: false, error: "User ID is missing in request headers.", code: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    if (!agentIdFromParams) {
      winstonLogger.warn('[API Agents PUT /id] Missing agentId in path.', { userId, requestUrl });
      return NextResponse.json(
        { success: false, error: "Agent ID is missing in request path.", code: "MISSING_AGENT_ID" },
        { status: 400 }
      );
    }

    let agentConfigUpdate: Partial<Omit<SavedAgentConfiguration, "id" | "createdAt" | "updatedAt" | "userId">>;
    try {
      agentConfigUpdate = await request.json();
    } catch (parseError: any) {
      winstonLogger.error(`[API Agents PUT /id] JSON parsing error.`, {
        userId,
        agentId: agentIdFromParams,
        requestUrl,
        error: { message: parseError.message, stack: parseError.stack }
      });
      return NextResponse.json(
        { success: false, error: "Invalid request body: " + parseError.message, code: "BAD_REQUEST" },
        { status: 400 }
      );
    }

    if (Object.keys(agentConfigUpdate).length === 0) {
      winstonLogger.warn(`[API Agents PUT /id] Update data is empty.`, { userId, agentId: agentIdFromParams, requestUrl });
      return NextResponse.json(
        { success: false, error: "Update data is required in the request body.", code: "INVALID_PAYLOAD" },
        { status: 400 }
      );
    }

    const result = await updateAgent(agentIdFromParams, agentConfigUpdate, userId);

    if (result.error) {
        const statusCode = result.status === 404 ? 404 : 500;
        winstonLogger.error(`[API Agents PUT /id] Agent update failed via AgentActions.`, {
             userId, agentId: agentIdFromParams, error: result.error, statusCode, requestUrl, updatePayload: agentConfigUpdate
        });
        // Persist this specific business logic failure to Firestore
        await writeLogEntry({
            type: 'error',
            severity: 'ERROR',
            flowName: 'AgentUpdate',
            agentId: agentIdFromParams, // The agent being updated
            message: 'Failed to update agent using AgentActions.updateAgent.',
            details: {
              error: result.error || "Unknown error from AgentActions",
              userIdAttempted: userId,
              requestUrl,
              // Do not log full agentConfigUpdate if it contains sensitive details not meant for logs
              updateFields: Object.keys(agentConfigUpdate),
            },
        });
        return NextResponse.json(
            { success: false, error: result.error, code: statusCode === 404 ? "AGENT_NOT_FOUND" : "UPDATE_AGENT_FAILED" },
            { status: statusCode }
        );
    }

    winstonLogger.info('[API Agents PUT /id] Agent updated successfully.', { userId, agentId: agentIdFromParams, requestUrl });
    return NextResponse.json(
      { success: true, data: result.agent },
      { status: 200 }
    );
  } catch (e: any) {
    // This catch handles errors not caught by specific try/catch like JSON parsing, or unexpected errors.
    winstonLogger.error(`[API Agents PUT /id] Unhandled exception.`, {
      userId: userId || "unknown",
      agentId: agentIdFromParams,
      requestUrl,
      error: { message: e.message, stack: e.stack, name: e.name }
    });
    // Check if SyntaxError was already handled; if not, it's an unexpected one.
    if (e instanceof SyntaxError) { // Should have been caught by the inner try-catch for request.json()
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload.", code: "BAD_REQUEST" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: e.message || "Failed to update agent due to an unexpected server error.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * Endpoint para deletar um agente específico (Delete Agent by ID)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const requestUrl = request.url;
  let userId = getUserId(request);
  const agentIdFromParams = params.agentId;

  try {
    if (!userId) {
      winstonLogger.warn('[API Agents DELETE /id] Missing x-user-id header.', { agentId: agentIdFromParams, requestUrl });
      return NextResponse.json(
        { success: false, error: "User ID is missing in request headers.", code: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    if (!agentIdFromParams) {
      winstonLogger.warn('[API Agents DELETE /id] Missing agentId in path.', { userId, requestUrl });
      return NextResponse.json(
        { success: false, error: "Agent ID is missing in request path.", code: "MISSING_AGENT_ID" },
        { status: 400 }
      );
    }

    const result = await deleteAgent(agentIdFromParams, userId);

    if (!result.success) {
      const statusCode = result.status === 404 ? 404 : 500;
      winstonLogger.error(`[API Agents DELETE /id] Agent deletion failed via AgentActions.`, {
          userId, agentId: agentIdFromParams, error: result.error, statusCode, requestUrl
      });
      // Persist this specific business logic failure to Firestore
      await writeLogEntry({
        type: 'error',
        severity: 'ERROR',
        flowName: 'AgentDelete',
        agentId: agentIdFromParams, // The agent being deleted
        message: 'Failed to delete agent using AgentActions.deleteAgent.',
        details: {
          error: result.error || "Unknown error from AgentActions",
          userIdAttempted: userId,
          requestUrl,
        },
      });
      return NextResponse.json(
        { success: false, error: result.error || "Failed to delete agent.", code: statusCode === 404 ? "AGENT_NOT_FOUND" : "DELETE_AGENT_FAILED" },
        { status: statusCode }
      );
    }

    winstonLogger.info('[API Agents DELETE /id] Agent deleted successfully.', { userId, agentId: agentIdFromParams, requestUrl });
    return NextResponse.json(
      { success: true, data: { message: "Agent deleted successfully." } },
      { status: 200 }
    );
  } catch (e: any) {
    winstonLogger.error(`[API Agents DELETE /id] Unhandled exception.`, {
      userId: userId || "unknown",
      agentId: agentIdFromParams,
      requestUrl,
      error: { message: e.message, stack: e.stack, name: e.name }
    });
    return NextResponse.json(
      { success: false, error: e.message || "Failed to delete agent due to an unexpected server error.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
