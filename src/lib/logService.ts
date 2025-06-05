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

/**
 * Retrieves raw logs from Firestore based on the provided filters.
 *
 * @param filters The filters to apply to the query.
 * @returns A promise that resolves to an array of log entries.
 */
export async function getRawLogs(filters: RawLogFilters): Promise<LogEntry[]> {
  let query: admin.firestore.Query = admin.firestore().collection(LOGS_COLLECTION);

  // Apply filters
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
  if (filters.startTime) {
    query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.startTime));
  }
  if (filters.endTime) {
    query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.endTime));
  }

  // Order by timestamp (descending by default)
  query = query.orderBy('timestamp', 'desc');

  // Apply pagination
  if (filters.limit) {
    query = query.limit(filters.limit);
  }
  // Modify pagination to use startAfterTimestamp
  if (filters.startAfterTimestamp) {
    try {
      const timestamp = admin.firestore.Timestamp.fromDate(new Date(filters.startAfterTimestamp));
      query = query.startAfter(timestamp);
    } catch (error) {
      console.error("Error parsing startAfterTimestamp for query:", error);
      // Decide if to throw, or ignore, or handle. For now, log and ignore.
      // Depending on requirements, might want to return a 400 if timestamp is invalid.
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
    // Assuming tool name is in data.toolName or data.tool based on common patterns
    const toolName = log.data?.toolName || log.data?.tool; 
    if (toolName && typeof toolName === 'string') {
      toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
    }
  });

  return Object.entries(toolCounts).map(([toolName, count]) => ({ toolName, count }));
}

// Interface for getErrorRates filters
export interface GetErrorRatesFilters extends DateRangeFilter {
  groupBy?: 'agentId' | 'flowName';
}

/**
 * Retrieves error rates (counts for now) based on filters.
 */
export async function getErrorRates(filters: GetErrorRatesFilters): Promise<{ groupKey: string, errorCount: number }[]> {
  let query: admin.firestore.Query = admin.firestore().collection(LOGS_COLLECTION);
  query = query.where('type', '==', 'error');

  if (filters.startTime) {
    query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.startTime));
  }
  if (filters.endTime) {
    query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.endTime));
  }

  const snapshot = await query.get();
  const errorCounts: { [key: string]: number } = {};

  snapshot.forEach(doc => {
    const log = doc.data() as LogEntry;
    let groupKeyValue = 'all_errors'; // Default key if no groupBy

    if (filters.groupBy === 'agentId' && log.agentId) {
      groupKeyValue = log.agentId;
    } else if (filters.groupBy === 'flowName' && log.flowName) {
      groupKeyValue = log.flowName;
    } else if (filters.groupBy) {
      // If groupBy is specified but the respective field is missing, group them under a specific key
      groupKeyValue = `unknown_${filters.groupBy}`;
    }
    
    errorCounts[groupKeyValue] = (errorCounts[groupKeyValue] || 0) + 1;
  });

  return Object.entries(errorCounts).map(([groupKey, errorCount]) => ({ groupKey, errorCount }));
}

// Interface for getAverageResponseTimes filters
export interface GetAverageResponseTimesFilters extends DateRangeFilter {
  groupBy?: 'agentId' | 'flowName';
}

interface LogTimeInfo {
  timestamp: number;
  groupKey: string;
}
/**
 * Calculates average response times for flows.
 */
export async function getAverageResponseTimes(
  filters: GetAverageResponseTimesFilters
): Promise<{ groupKey: string, averageDurationMs: number, count: number }[]> {
  let query: admin.firestore.Query = admin.firestore().collection(LOGS_COLLECTION);
  // We need both 'start' and 'end' logs
  query = query.where('type', 'in', ['start', 'end']);

  if (filters.startTime) {
    query = query.where('timestamp', '>=', admin.firestore.Timestamp.fromDate(filters.startTime));
  }
  // For endTime, we might need to fetch logs slightly beyond the endTime if a flow started before
  // but ended after. However, for simplicity, we'll filter 'start' and 'end' logs within the range.
  // The impact depends on how long flows typically run.
  if (filters.endTime) {
    query = query.where('timestamp', '<=', admin.firestore.Timestamp.fromDate(filters.endTime));
  }

  // If specific agentId or flowName is provided in filters for grouping,
  // it might be more efficient to apply them to the query directly if possible.
  // However, the current implementation fetches broadly by type and date, then groups in code.
  // This is fine for flexibility but could be optimized for very large datasets if a specific group is always requested.
  // For example:
  // if (filters.groupBy === 'agentId' && filters.agentId) { // Assuming agentId is part of GetAverageResponseTimesFilters
  //   query = query.where('agentId', '==', filters.agentId);
  // } else if (filters.groupBy === 'flowName' && filters.flowName) { // Assuming flowName is part of GetAverageResponseTimesFilters
  //   query = query.where('flowName', '==', filters.flowName);
  // }


  const snapshot = await query.get();
  const logs = snapshot.docs.map(doc => doc.data() as LogEntry);

  const flowTimings: { [traceId: string]: { start?: LogTimeInfo, end?: LogTimeInfo } } = {};

  logs.forEach(log => {
    if (!log.traceId) return; // traceId is crucial for matching

    // Determine the groupKey based on the filter and log data.
    // The groupKey for 'start' and 'end' of the same traceId should be consistent.
    let determinedGroupKey: string;
    if (filters.groupBy === 'agentId') {
      determinedGroupKey = log.agentId || 'unknown_agentId';
    } else if (filters.groupBy === 'flowName') {
      determinedGroupKey = log.flowName || 'unknown_flowName';
    } else {
      determinedGroupKey = 'all_flows';
    }

    if (!flowTimings[log.traceId]) {
      flowTimings[log.traceId] = {};
    }

    if (log.type === 'start') {
      // If multiple 'start' logs for the same traceId, prefer the earliest.
      if (!flowTimings[log.traceId].start || log.timestamp.toMillis() < flowTimings[log.traceId].start!.timestamp) {
        flowTimings[log.traceId].start = { timestamp: log.timestamp.toMillis(), groupKey: determinedGroupKey };
      }
    } else if (log.type === 'end') {
      // If multiple 'end' logs for the same traceId, prefer the latest.
      if (!flowTimings[log.traceId].end || log.timestamp.toMillis() > flowTimings[log.traceId].end!.timestamp) {
        flowTimings[log.traceId].end = { timestamp: log.timestamp.toMillis(), groupKey: determinedGroupKey };
      }
    }
  });

  const durationsByGroup: { [groupKey: string]: { totalDurationMs: number, count: number } } = {};

  Object.values(flowTimings).forEach(timing => {
    if (timing.start && timing.end) {
      // Use the groupKey from the 'start' event as the definitive one for this trace.
      const groupKey = timing.start.groupKey;
      // Optional: Verify groupKey consistency if end event's groupKey must match start's.
      // if (filters.groupBy && timing.end.groupKey !== groupKey) {
      //   console.warn(`Mismatch groupKey for traceId ${Object.keys(flowTimings).find(k => flowTimings[k] === timing)}: start is ${groupKey}, end is ${timing.end.groupKey}`);
      //   // Skip this pair or handle as an anomaly
      //   return; 
      // }

      const duration = timing.end.timestamp - timing.start.timestamp;
      if (duration >= 0) { // Ensure end is after start
        if (!durationsByGroup[groupKey]) {
          durationsByGroup[groupKey] = { totalDurationMs: 0, count: 0 };
        }
        durationsByGroup[groupKey].totalDurationMs += duration;
        durationsByGroup[groupKey].count++;
      }
    }
  });

  return Object.entries(durationsByGroup).map(([groupKey, data]) => ({
    groupKey,
    averageDurationMs: data.totalDurationMs / data.count,
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
