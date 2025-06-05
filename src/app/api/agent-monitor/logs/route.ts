import { NextResponse } from 'next/server';
import { getRawLogs, RawLogFilters } from '@/lib/logService'; // Assuming @ points to src
import { DocumentSnapshot } from 'firebase-admin/firestore'; // Only for type if needed, not for runtime

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const filters: RawLogFilters = {};

    const agentId = searchParams.get('agentId');
    if (agentId) filters.agentId = agentId;

    const flowName = searchParams.get('flowName');
    if (flowName) filters.flowName = flowName;

    const type = searchParams.get('type');
    if (type) filters.type = type;

    const traceId = searchParams.get('traceId');
    if (traceId) filters.traceId = traceId;

    const startTime = searchParams.get('startTime');
    if (startTime) filters.startTime = new Date(startTime);

    const endTime = searchParams.get('endTime');
    if (endTime) filters.endTime = new Date(endTime);

    const limit = searchParams.get('limit');
    if (limit) filters.limit = parseInt(limit, 10);

    const startAfterTimestamp = searchParams.get('startAfterTimestamp');
    if (startAfterTimestamp) {
      // Basic validation for ISO string format could be added here if necessary
      // For now, assume it's a valid ISO string if provided.
      // The logService will handle parsing it into a Date object and then a Firestore Timestamp.
      filters.startAfterTimestamp = startAfterTimestamp;
    }

    // Validate date parsing for startTime and endTime
    if (searchParams.has('startTime') && filters.startTime && isNaN(filters.startTime.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid startTime format. Please use ISO 8601 format.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    if (searchParams.has('endTime') && filters.endTime && isNaN(filters.endTime.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid endTime format. Please use ISO 8601 format.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    // Validate limit parsing
    if (searchParams.has('limit') && (isNaN(filters.limit!) || filters.limit! <= 0)) {
      return NextResponse.json(
        { success: false, error: 'Invalid limit format. Must be a positive integer.', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    // Validate startAfterTimestamp
    if (filters.startAfterTimestamp && isNaN(new Date(filters.startAfterTimestamp).getTime())) {
        return NextResponse.json(
          { success: false, error: 'Invalid startAfterTimestamp format. Please use ISO 8601 format.', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
    }

    // Fetch logs using the service function
    const logs = await getRawLogs(filters);
    // For successful GET, directly return the data. Standardizing to { success: true, data: logs } is also an option.
    return NextResponse.json(logs, { status: 200 });

  } catch (error: unknown) { // Catch unknown for better type safety before instanceof check
    // Consider using a structured logger (e.g., Winston) if available throughout the project
    console.error('[API agent-monitor/logs GET] Error fetching raw logs:', error);

    let errorMessage = 'An unexpected error occurred while fetching logs.';
    // It's good practice to not expose raw internal error messages to the client in production.
    // However, providing some detail can be helpful for debugging if the error is deemed safe to share.
    let errorDetails; // Undefined by default, only populate if needed

    if (error instanceof Error) {
        // Potentially map known errors from getRawLogs to specific client messages/codes here
        // For now, we'll use a generic message for 500s from getRawLogs
        errorDetails = error.message; // Capture original message for details
    }

    // Standardized error response
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'INTERNAL_SERVER_ERROR',
        details: errorDetails // Only include details if it's considered safe and useful for the client
      },
      { status: 500 }
    );
  }
}
