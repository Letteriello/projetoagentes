import { NextResponse } from 'next/server';
import { getRawLogs, RawLogFilters, writeLogEntry } from '@/lib/logService'; // MODIFIED: Ensure writeLogEntry is imported
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
    // MODIFIED: Use writeLogEntry for internal logging
    const errorDetailsForLogging = error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : { message: String(error) };
    await writeLogEntry({
      type: 'API_ERROR',
      severity: 'ERROR',
      flowName: 'agent-monitor/logs', // Identifies the API route
      message: 'Error fetching raw logs via API.',
      details: {
        errorMessage: errorDetailsForLogging.message,
        errorStack: errorDetailsForLogging.stack,
        errorName: errorDetailsForLogging.name,
        // Consider including stringified request query or relevant parts if helpful and not sensitive
        // originalError: error, // Could be verbose, log essentials
      }
    });

    let errorMessage = 'An unexpected error occurred while fetching logs.';
    // It's good practice to not expose raw internal error messages or detailed stack traces to the client.
    // The actual error has been logged internally via writeLogEntry.
    // Provide a generic error message to the client.
    // If specific user-facing error messages are needed, they can be determined based on error type.

    // For client-facing error, only send generic message or specific safe-to-display details
    let clientErrorDetails;
    if (error instanceof Error) {
      // Example: if it was a known type of error you want to communicate specifically
      // if (error.name === 'SpecificClientSafeError') clientErrorDetails = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'INTERNAL_SERVER_ERROR',
        details: clientErrorDetails // Only send if specifically intended for client
      },
      { status: 500 }
    );
  }
}
