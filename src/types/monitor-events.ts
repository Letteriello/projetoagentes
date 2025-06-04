export interface BaseEvent {
  id: string; // Unique event ID
  timestamp: string; // ISO string format
  agentId: string;
  traceId?: string; // To group events belonging to the same execution flow
}

export interface ToolCallEvent extends BaseEvent {
  eventType: 'tool_call';
  toolName: string;
  input?: any;
  output?: any;
  status: 'started' | 'completed' | 'error';
  errorDetails?: {
    message: string;
    stack?: string; // Optional stack trace for tool errors
  };
}

export interface TaskCompletionEvent extends BaseEvent {
  eventType: 'task_completion';
  status: 'success' | 'failure';
  message?: string; // e.g., "Task completed successfully" or "Task failed"
  result?: any; // Optional: data returned by the task
}

export interface ErrorEvent extends BaseEvent {
  eventType: 'error';
  errorMessage: string;
  stackTrace?: string; // Simulated or actual stack trace
  errorSource?: string; // e.g., 'agent_core', 'llm_service', 'tool_execution'
}

export interface InfoEvent extends BaseEvent {
  eventType: 'info';
  message: string;
  data?: any; // Arbitrary data for informational purposes
}

export interface AgentStateEvent extends BaseEvent {
  eventType: 'agent_state';
  status: 'online' | 'offline' | 'busy' | 'idle'; // Reflects agent's operational state
  message?: string; // e.g., "Agent agent-123 is now online"
}

// Event for latency and token/cost metrics (as per task 5.5)
export interface PerformanceMetricsEvent extends BaseEvent {
  eventType: 'performance_metrics';
  metricName: 'latency' | 'token_usage' | 'cost';
  value: number;
  unit?: string; // e.g., 'ms' for latency, 'tokens' for token_usage
  details?: any; // e.g., { tokensUsed: 1500, simulatedCost: 0.02 } for a combined metric
}

// New event type for A2A Messages
export interface A2AMessageEvent extends BaseEvent {
  eventType: 'a2a_message';
  fromAgentId: string;
  toAgentId: string;
  messageContent: string | any; // Allowing complex objects, will need serialization for display
  status: 'sent' | 'received' | 'simulated_success' | 'simulated_failed' | 'error';
  channelId?: string; // Optional, to link to a specific communication channel
  errorDetails?: { // Optional error details if status is 'error' or 'simulated_failed'
    message: string;
    stack?: string;
  };
}


export type MonitorEvent =
  | ToolCallEvent
  | TaskCompletionEvent
  | A2AMessageEvent // Added A2AMessageEvent
  | ErrorEvent
  | InfoEvent
  | AgentStateEvent
  | PerformanceMetricsEvent;

// For task 5.2 (Visual Trajectory)
// We might need a way to represent hierarchical relationships.
// One way is to add an optional parentEventId to BaseEvent,
// or rely on traceId and careful ordering/processing on the frontend.
// For now, will assume traceId and timestamp ordering is primary.

// Example of how a trajectory might be structured from events:
export interface TrajectoryStep {
  eventId: string;
  eventType: MonitorEvent['eventType'];
  timestamp: string;
  details: string; // Summary of the event, e.g., "Tool: search_web called" or "Error: LLM timeout"
  input?: any;
  output?: any;
  status?: string;
  children: TrajectoryStep[];
  depth: number; // For rendering hierarchy
}
