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

    // Validate date parsing
    // Validate date parsing for startTime and endTime
    if (searchParams.has('startTime') && filters.startTime && isNaN(filters.startTime.getTime())) {
      return NextResponse.json({ error: 'Invalid startTime format. Please use ISO 8601 format.' }, { status: 400 });
    }
    if (searchParams.has('endTime') && filters.endTime && isNaN(filters.endTime.getTime())) {
      return NextResponse.json({ error: 'Invalid endTime format. Please use ISO 8601 format.' }, { status: 400 });
    }
    // Validate limit parsing
    if (searchParams.has('limit') && (isNaN(filters.limit!) || filters.limit! <= 0)) {
      return NextResponse.json({ error: 'Invalid limit format. Must be a positive integer.' }, { status: 400 });
    }
    // Validate startAfterTimestamp (basic check, more robust validation could be added)
    if (filters.startAfterTimestamp && isNaN(new Date(filters.startAfterTimestamp).getTime())) {
        return NextResponse.json({ error: 'Invalid startAfterTimestamp format. Please use ISO 8601 format.' }, { status: 400 });
    }


    const logs = await getRawLogs(filters);
    return NextResponse.json(logs);

  } catch (error) {
    console.error('Error fetching raw logs:', error);
    let errorMessage = 'Failed to fetch logs';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // It's good practice to not expose raw internal error messages to the client in production
    // For now, we'll return a generic message or the error message if available.
    return NextResponse.json({ error: 'Failed to fetch logs', details: errorMessage }, { status: 500 });
  }
}
