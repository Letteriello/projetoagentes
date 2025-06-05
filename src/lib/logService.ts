import * as admin from 'firebase-admin';
import { DocumentSnapshot } from 'firebase-admin/firestore';

// Define a LogEntry interface (similar to LogEntryV2)
export interface LogEntry {
  agentId?: string;
  flowName?: string;
  type?: string;
  traceId?: string;
  timestamp: admin.firestore.Timestamp;
  message?: string;
  // Add other fields as necessary
  [key: string]: any;
  // Potential new fields for more structured logging
  severity?: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG'; // Optional severity field
  details?: Record<string, any>; // For structured details
}

// Define the RawLogFilters interface
export interface RawLogFilters {
  agentId?: string;
  flowName?: string;
  type?: string;
  traceId?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  startAfterTimestamp?: string; // ISO date string for pagination
}

// DateRangeFilter interface
export interface DateRangeFilter {
  startTime?: Date;
  endTime?: Date;
}

// Firestore collection name
const LOGS_COLLECTION = 'agent_flow_logs';

// Suggested Firestore Indexes for agent_flow_logs collection:
// Single-field indexes are automatically created by Firestore for equality checks.
// For range queries and ordering, composite indexes are often beneficial.
// 1. For getRawLogs (common filters + default sort order):
//    - (timestamp DESC) - Base for default sorting and time-range queries.
//    - (agentId ASC, timestamp DESC)
//    - (flowName ASC, timestamp DESC)
//    - (type ASC, timestamp DESC)
//    - (traceId ASC, timestamp DESC)
//    Firestore might suggest more specific composite indexes based on exact query patterns observed in production.
//    Example: If filtering by agentId and type together is common: (agentId ASC, type ASC, timestamp DESC)
//
// 2. For aggregation-like functions (getAgentUsageFrequency, getErrorRates, etc.):
//    - (type ASC, timestamp ASC) - Or DESC depending on how date range is typically queried.
//      If startTime is always present, timestamp ASC might be slightly better for scan direction.
//
// Note: Firestore automatically creates single-field indexes. Composite indexes need to be manually created
// via the Firebase console or Firebase CLI. Firestore will usually provide an error message with a link
// to create a missing index if a query fails due to lack of a suitable index.


/**
 * Retrieves raw logs from Firestore based on the provided filters.
 *
 * @param filters The filters to apply to the query.
 * @returns A promise that resolves to an array of log entries.
 */
export async function getRawLogs(filters: RawLogFilters): Promise<LogEntry[]> {
  // It's assumed that 'admin.firestore()' is correctly initialized elsewhere (e.g., firebaseAdmin.ts)
  let query: admin.firestore.Query = admin.firestore().collection(LOGS_COLLECTION);

  // Apply filters
  // For each field used in 'where' equality, ensure Firestore has an index (usually automatic for single fields).
  if (filters.agentId) {
    query = query.where('agentId', '==', filters.agentId);
  }
  if (filters.flowName) {
    query = query.where('flowName', '==', filters.flowName);
  }
  if (filters.type) {
    query = query.where('type', '==', filters.type);
  }
  if (filters.traceId) {
    query = query.where('traceId', '==', filters.traceId);
  }

  // Timestamp range filters. A composite index involving 'timestamp' and other query fields can optimize this.
  if (filters.startTime) {
    query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.startTime));
  }
  if (filters.endTime) {
    query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.endTime));
  }

  // Order by timestamp (descending by default for most recent logs first)
  // This requires 'timestamp' to be part of a composite index if other 'where' clauses are used on different fields.
  query = query.orderBy('timestamp', 'desc');

  // Apply pagination limit
  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  // Apply pagination cursor (startAfter)
  // This also relies on the 'timestamp' ordering.
  if (filters.startAfterTimestamp) {
    try {
      const timestamp = admin.firestore.Timestamp.fromDate(new Date(filters.startAfterTimestamp));
      query = query.startAfter(timestamp);
    } catch (error) {
      console.error("[logService] Error parsing startAfterTimestamp for query:", error);
      // Consider how to handle invalid startAfterTimestamp.
      // For now, it logs and the query proceeds without startAfter, potentially returning the first page.
      // Returning a specific error or throwing might be appropriate if strict validation is needed here.
    }
  }

  const snapshot = await query.get();
  const logs: LogEntry[] = [];
  snapshot.forEach(doc => {
    logs.push(doc.data() as LogEntry);
  });

  return logs;
}

/**
 * Retrieves agent usage frequency.
 * This function fetches logs and performs client-side aggregation.
 * For very large datasets, consider dedicated analytics solutions or more denormalized data structures.
 * Firestore's server-side aggregation (sum, average) is not directly applicable for frequency counting of distinct IDs here.
 * Suggested index: type (ASC), timestamp (ASC or DESC depending on typical query patterns for date range)
 */
export async function getAgentUsageFrequency(filters: DateRangeFilter): Promise<{ agentId: string, count: number }[]> {
  let query: admin.firestore.Query = admin.firestore().collection(LOGS_COLLECTION);
  query = query.where('type', '==', 'start'); // Assuming 'start' type for usage counting

  if (filters.startTime) {
    query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.startTime));
  }
  if (filters.endTime) {
    query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.endTime));
  }
  // Consider adding .orderBy('timestamp') if the volume of 'start' events is very large
  // and you only need a subset or want to ensure consistent ordering before client-side processing,
  // though for this aggregation, it's not strictly necessary for correctness.

  const snapshot = await query.get();
  const agentCounts: { [key: string]: number } = {};

  snapshot.forEach(doc => {
    const log = doc.data() as LogEntry;
    if (log.agentId) {
      agentCounts[log.agentId] = (agentCounts[log.agentId] || 0) + 1;
    }
  });

  return Object.entries(agentCounts).map(([agentId, count]) => ({ agentId, count }));
}

/**
 * Retrieves flow usage frequency.
 * Similar to getAgentUsageFrequency, this performs client-side aggregation.
 * Suggested index: type (ASC), timestamp (ASC or DESC)
 */
export async function getFlowUsageFrequency(filters: DateRangeFilter): Promise<{ flowName: string, count: number }[]> {
  let query: admin.firestore.Query = admin.firestore().collection(LOGS_COLLECTION);
  query = query.where('type', '==', 'start'); // Assuming 'start' type for usage counting

  if (filters.startTime) {
    query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.startTime));
  }
  if (filters.endTime) {
    query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.endTime));
  }

  const snapshot = await query.get();
  const flowCounts: { [key: string]: number } = {};

  snapshot.forEach(doc => {
    const log = doc.data() as LogEntry;
    if (log.flowName) {
      flowCounts[log.flowName] = (flowCounts[log.flowName] || 0) + 1;
    }
  });

  return Object.entries(flowCounts).map(([flowName, count]) => ({ flowName, count }));
}

/**
 * Retrieves tool usage frequency.
 * Client-side aggregation. Ensure log structure for toolName is consistent.
 * Suggested index: type (ASC), timestamp (ASC or DESC)
 */
export async function getToolUsageFrequency(filters: DateRangeFilter): Promise<{ toolName: string, count: number }[]> {
  let query: admin.firestore.Query = admin.firestore().collection(LOGS_COLLECTION);
  query = query.where('type', '==', 'tool_call');

  if (filters.startTime) {
    query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.startTime));
  }
  if (filters.endTime) {
    query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.endTime));
  }

  const snapshot = await query.get();
  const toolCounts: { [key: string]: number } = {};

  snapshot.forEach(doc => {
    const log = doc.data() as LogEntry;
    // Standardize tool name access. If 'data' object and 'toolName' field are conventions:
    const toolName = log.details?.toolName || log.details?.tool; // Prefer 'details' if it's the structured data field
    // If toolName might be at top level of log entry: log.toolName
    if (toolName && typeof toolName === 'string') {
      toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
    }
  });

  return Object.entries(toolCounts).map(([toolName, count]) => ({ toolName, count }));
}

// Interface for getErrorRates filters
export interface GetErrorRatesFilters extends DateRangeFilter {
  groupBy?: 'agentId' | 'flowName'; // Fields to group errors by
}

/**
 * Retrieves error rates (counts for now) based on filters.
 * Client-side aggregation.
 * Suggested index: type (ASC), timestamp (ASC or DESC)
 */
export async function getErrorRates(filters: GetErrorRatesFilters): Promise<{ groupKey: string, errorCount: number }[]> {
  let query: admin.firestore.Query = admin.firestore().collection(LOGS_COLLECTION);
  query = query.where('type', '==', 'error'); // Targeting error logs

  if (filters.startTime) {
    query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.startTime));
  }
  if (filters.endTime) {
    query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.endTime));
  }
  // Optional: Add .orderBy('timestamp') if processing order matters or for consistency,
  // though not strictly required for this specific aggregation.

  const snapshot = await query.get();
  const errorCounts: { [key: string]: number } = {};

  snapshot.forEach(doc => {
    const log = doc.data() as LogEntry;
    let groupKeyValue = filters.groupBy ? `unknown_${filters.groupBy}` : 'all_errors'; // Default key if groupBy field is missing or no groupBy

    if (filters.groupBy === 'agentId' && log.agentId) {
      groupKeyValue = log.agentId;
    } else if (filters.groupBy === 'flowName' && log.flowName) {
      groupKeyValue = log.flowName;
    } else if (!filters.groupBy) {
      groupKeyValue = 'all_errors'; // Explicitly for the case when no groupBy is defined
    }
    // If groupBy is defined but the respective field (agentId/flowName) is not on the log,
    // it will fall into the `unknown_${filters.groupBy}` category.
    
    errorCounts[groupKeyValue] = (errorCounts[groupKeyValue] || 0) + 1;
  });

  return Object.entries(errorCounts).map(([groupKey, errorCount]) => ({ groupKey, errorCount }));
}

// Interface for getAverageResponseTimes filters
export interface GetAverageResponseTimesFilters extends DateRangeFilter {
  groupBy?: 'agentId' | 'flowName'; // Fields to group response times by
}

interface LogTimeInfo {
  timestamp: number; // Milliseconds
  groupKey: string;  // Key for grouping (e.g., agentId, flowName)
}
/**
 * Calculates average response times for flows by pairing 'start' and 'end' log events.
 * This function involves significant client-side processing.
 * For very large datasets, consider alternative data processing strategies (e.g., batch jobs, specialized analytics DB).
 * Suggested index: type (ASC), timestamp (ASC or DESC). A composite index on (traceId, type, timestamp) could also be
 * beneficial if individual trace lookups were common, but here we scan by type and time.
 */
export async function getAverageResponseTimes(
  filters: GetAverageResponseTimesFilters
): Promise<{ groupKey: string, averageDurationMs: number, count: number }[]> {
  let query: admin.firestore.Query = admin.firestore().collection(LOGS_COLLECTION);
  // Fetch 'start' and 'end' type logs. An 'in' query is efficient with a corresponding index.
  query = query.where('type', 'in', ['start', 'end']);

  if (filters.startTime) {
    query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.startTime));
  }
  if (filters.endTime) {
    // To correctly capture flows that may have ended after filters.endTime but started within the window,
    // it's complex. A simpler approach taken here is to filter both 'start' and 'end' events
    // strictly within the window. This means flows that started before filters.startTime or ended after
    // filters.endTime might be partially or fully excluded from duration calculation if one of their
    // critical 'start'/'end' markers falls outside.
    // For more precise long-running flow analysis, a different strategy might be needed,
    // e.g., querying only 'start' events in range, then fetching their corresponding 'end' events even if outside.
    query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.endTime));
  }
  // Ordering by traceId first then timestamp can help in processing logs sequentially for each trace,
  // though the current client-side logic with a map handles out-of-order events for a given traceId.
  // query = query.orderBy('traceId').orderBy('timestamp'); // Requires composite index (traceId, timestamp)

  // Fetch all relevant logs. This could be a large dataset.
  const snapshot = await query.get();
  const logs = snapshot.docs.map(doc => doc.data() as LogEntry);

  // Store start and end times for each traceId encountered.
  const flowTimings: { [traceId: string]: { start?: LogTimeInfo, end?: LogTimeInfo } } = {};

  logs.forEach(log => {
    if (!log.traceId) {
      // console.warn("[logService] Log entry missing traceId, cannot calculate duration:", log.id);
      return;
    }

    // Determine the groupKey based on the filter and log data.
    // The groupKey from the 'start' event will be authoritative for a given trace.
    let determinedGroupKey: string;
    if (filters.groupBy === 'agentId') {
      determinedGroupKey = log.agentId || `unknown_agentId`;
    } else if (filters.groupBy === 'flowName') {
      determinedGroupKey = log.flowName || `unknown_flowName`;
    } else {
      determinedGroupKey = 'all_flows'; // Default group if no specific groupBy
    }

    if (!flowTimings[log.traceId]) {
      flowTimings[log.traceId] = {};
    }

    const logTimestampMs = log.timestamp.toMillis();

    if (log.type === 'start') {
      // If multiple 'start' logs for the same traceId (should be rare/anomaly), take the earliest.
      if (!flowTimings[log.traceId].start || logTimestampMs < flowTimings[log.traceId].start!.timestamp) {
        flowTimings[log.traceId].start = { timestamp: logTimestampMs, groupKey: determinedGroupKey };
      }
    } else if (log.type === 'end') {
      // If multiple 'end' logs for the same traceId (could happen with retries/errors), take the latest.
      if (!flowTimings[log.traceId].end || logTimestampMs > flowTimings[log.traceId].end!.timestamp) {
        // Only associate with a start event if the groupKey matches (if grouping is active)
        // This ensures that 'start' and 'end' events are from the same group if groupBy is used.
        // However, the primary grouping should ideally be on the start event's context.
        // If start.groupKey is the authority, this check might be too strict or lead to missed pairings.
        // For now, we use the end event's determinedGroupKey for its own record.
        flowTimings[log.traceId].end = { timestamp: logTimestampMs, groupKey: determinedGroupKey };
      }
    }
  });

  const durationsByGroup: { [groupKey: string]: { totalDurationMs: number, count: number } } = {};

  Object.values(flowTimings).forEach(timing => {
    // Ensure both start and end events exist for a trace to calculate duration.
    if (timing.start && timing.end) {
      // Use the groupKey from the 'start' event as the definitive one for this trace's duration.
      const groupKey = timing.start.groupKey;

      // Optional: Sanity check if groupKeys must match between start and end if groupBy is active.
      // if (filters.groupBy && timing.end.groupKey !== groupKey) {
      //   console.warn(`[logService] Mismatched groupKey for trace: start group '${groupKey}', end group '${timing.end.groupKey}'. Using start group.`);
      // }

      const duration = timing.end.timestamp - timing.start.timestamp;
      if (duration >= 0) { // Ensure duration is not negative.
        if (!durationsByGroup[groupKey]) {
          durationsByGroup[groupKey] = { totalDurationMs: 0, count: 0 };
        }
        durationsByGroup[groupKey].totalDurationMs += duration;
        durationsByGroup[groupKey].count++;
      } else {
        // console.warn(`[logService] Negative duration for trace: ${Object.keys(flowTimings).find(k => flowTimings[k] === timing)}. Start: ${timing.start.timestamp}, End: ${timing.end.timestamp}`);
      }
    }
  });

  return Object.entries(durationsByGroup).map(([groupKey, data]) => ({
    groupKey,
    averageDurationMs: data.count > 0 ? data.totalDurationMs / data.count : 0, // Avoid division by zero
    count: data.count,
  }));
}

// =============================================
// Log Writing Functions
// =============================================

/**
 * Writes a log entry to Firestore.
 *
 * @param logData The data for the log entry, timestamp will be added automatically.
 * @returns A promise that resolves when the log entry has been written.
 */
export async function writeLogEntry(logData: Omit<LogEntry, 'timestamp'>): Promise<void> {
  try {
    const entry: LogEntry = {
      ...logData,
      timestamp: admin.firestore.Timestamp.now(),
    };
    await admin.firestore().collection(LOGS_COLLECTION).add(entry);
  } catch (error) {
    console.error('Failed to write log entry to Firestore:', error, 'Log data:', logData);
    // Depending on policy, might re-throw or handle silently
    // For now, just logging to console to avoid interrupting application flow
  }
}

// --- A2A Specific Logging Functions ---

interface A2ALogContext {
  agentId?: string; // The agent performing the action or being affected
  channelId?: string;
  sourceAgentId?: string; // For received messages/pongs
  targetAgentId?: string; // For sent messages/pings
  messageId?: string;
  traceId?: string; // To correlate logs for a single operation/flow
}

/**
 * Logs an A2A message event (sent or received).
 */
export function logA2AMessageEvent(
  type: 'a2a_message_sent' | 'a2a_message_received' | 'a2a_heartbeat_ping' | 'a2a_heartbeat_pong',
  context: A2ALogContext,
  message: string,
  additionalDetails?: Record<string, any>
): void {
  writeLogEntry({
    type,
    agentId: context.agentId,
    flowName: 'A2ACommunication', // Generic flow name for A2A
    traceId: context.traceId,
    message,
    details: {
      ...context,
      ...additionalDetails,
    },
    severity: 'INFO',
  });
}

/**
 * Logs an A2A error event.
 */
export function logA2AError(
  type: 'a2a_send_error' | 'a2a_receive_error' | 'a2a_processing_error' | 'a2a_connection_error',
  context: A2ALogContext,
  errorMessage: string,
  errorDetails?: Record<string, any> | Error
): void {
  let detailsObject = { ...context };
  if (errorDetails instanceof Error) {
    detailsObject = {
      ...detailsObject,
      errorName: errorDetails.name,
      errorMessage: errorDetails.message,
      errorStack: errorDetails.stack,
    };
  } else if (errorDetails) {
    detailsObject = { ...detailsObject, ...errorDetails };
  }

  writeLogEntry({
    type,
    agentId: context.agentId,
    flowName: 'A2ACommunication',
    traceId: context.traceId,
    message: errorMessage,
    details: detailsObject,
    severity: 'ERROR',
  });
}

/**
 * Logs an A2A channel status change or significant event.
 */
export function logA2AStatusChange(
  context: A2ALogContext,
  status: string, // e.g., "connected", "disconnected", "unresponsive", "reconnecting"
  message: string,
  additionalDetails?: Record<string, any>
): void {
  writeLogEntry({
    type: 'a2a_channel_status',
    agentId: context.agentId,
    flowName: 'A2ACommunication',
    traceId: context.traceId,
    message,
    details: {
      ...context,
      channelStatus: status,
      ...additionalDetails,
    },
    severity: 'INFO', // Could be WARNING for "unresponsive" or "disconnected" if desired
  });
}
