import { NextResponse } from 'next/server';
// Adjust import paths to be relative
import admin, { firestore } from '../../../../lib/firebaseAdmin';
import { LogEntryV2 } from '../../../../lib/logger'; // Assuming LogEntryV2 is exported

// Define a more specific type for the logs we expect to retrieve if needed
// LogEntryV2 already includes most fields. We add 'id' for the document ID.
interface RetrievedLog extends LogEntryV2 {
  id: string;
}

export async function GET(
  request: Request,
  { params }: { params: { agentId: string } }
) {
  const { agentId } = params;
  if (!agentId) {
    return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');
  const status = searchParams.get('status'); // e.g., 'error', 'success', 'start', 'info', 'tool_call'
  const flowName = searchParams.get('flowName');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  if (isNaN(page) || page < 1) {
    return NextResponse.json({ error: 'Invalid page number, must be >= 1' }, { status: 400 });
  }
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ error: 'Invalid limit value, must be between 1 and 100' }, { status: 400 });
  }

  try {
    // Ensure firestore is initialized (firebaseAdmin.ts should handle this)
    if (!firestore) {
        console.error('Firestore not initialized');
        return NextResponse.json({ error: 'Firestore not available' }, { status: 500 });
    }

    let query: admin.firestore.Query = firestore.collection('agent_flow_logs')
                                          .where('agentId', '==', agentId);

    if (startDateStr) {
      const startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json({ error: 'Invalid startDate format' }, { status: 400 });
      }
      query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(startDate));
    }

    if (endDateStr) {
      const endDate = new Date(endDateStr);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid endDate format' }, { status: 400 });
      }
      // To include the whole end day, set time to end of day
      endDate.setHours(23, 59, 59, 999);
      query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(endDate));
    }

    // Combined timestamp ordering with other filters might require composite indexes in Firestore.
    // Default order by timestamp desc. If other filters are applied, this might need to be the last "range" filter or first "orderBy".
    // Firestore limitation: If you have a range filter (<, <=, >, >=), your first orderBy must be on the same field.
    // We have potential range filters on 'timestamp'.

    if (status) {
      const lowerStatus = status.toLowerCase();
      if (['error', 'end', 'start', 'tool_call', 'info'].includes(lowerStatus)) {
        // 'success' is mapped to 'end' type logs.
        const typeToQuery = lowerStatus === 'success' ? 'end' : lowerStatus;
        query = query.where('type', '==', typeToQuery);
      } else {
        return NextResponse.json({ error: `Invalid status value. Allowed: error, success, start, end, tool_call, info.` }, { status: 400 });
      }
    }

    if (flowName) {
      query = query.where('flowName', '==', flowName);
    }

    // Order by timestamp, most recent first. This is crucial.
    // If range filters on timestamp are used, this orderBy is compatible.
    // If other fields were used for range filters, Firestore query rules would be more complex.
    query = query.orderBy('timestamp', 'desc');

    // Pagination
    const offset = (page - 1) * limit;
    // Firestore's offset has limitations for large offsets. Cursor-based pagination (`startAfter`) is more robust.
    // For simplicity, using offset first. If performance issues arise, switch to cursors.
    query = query.limit(limit);
    if (offset > 0) {
      // To use offset, we need a document to start after, or just use query.offset() if supported directly
      // query.offset() is available in Node.js server SDK.
      query = query.offset(offset);
    }
    // If using startAfter, you would do:
    // if (page > 1 && lastDocumentSnapshot) { // lastDocumentSnapshot from previous page
    //   query = query.startAfter(lastDocumentSnapshot);
    // }

    const snapshot = await query.get();
    const logs: RetrievedLog[] = [];
    snapshot.forEach(doc => {
      // Ensure data conversion is safe, especially for the timestamp
      const data = doc.data();
      const logEntry: any = { id: doc.id, ...data };
      if (data.timestamp && typeof data.timestamp.toDate === 'function') {
        logEntry.timestamp = data.timestamp.toDate().toISOString(); // Convert to ISO string for JSON
      }
      logs.push(logEntry as RetrievedLog);
    });

    // Heuristic for hasNextPage. True if the number of logs returned equals the limit.
    // This isn't perfectly accurate if the total number of logs is exactly a multiple of the limit.
    // A more accurate way is to fetch limit + 1 items and see if an extra item is returned.
    const hasNextPage = logs.length === limit;

    return NextResponse.json({
      logs,
      currentPage: page,
      limit,
      hasNextPage,
    });

  } catch (error: any) {
    console.error(`Error fetching logs for agentId ${agentId}:`, error);
    // Check for specific Firestore error codes if needed for more granular responses
    // e.g., error.code === 'permission-denied' or 'invalid-argument'
    let errorMessage = 'Failed to fetch logs.';
    if (error.message) {
        errorMessage += ` Details: ${error.message}`;
    }
    // Avoid sending detailed stack traces or sensitive error info to client in production
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
