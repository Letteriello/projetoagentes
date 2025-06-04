"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Activity, BarChartBig, FileQuestion, Inbox, LineChart, ListX, PieChart, ScrollText, SearchX, ShieldAlert, Table2, WifiOff, ChevronDown, ChevronRight, Settings2
} from "lucide-react"; // Added icons
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { type MonitorEvent, ToolCallEvent, ErrorEvent, InfoEvent, TaskCompletionEvent, AgentStateEvent, PerformanceMetricsEvent } from '@/types/monitor-events';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type AgentStatus,
  type ExecutionHistory,
  type AverageResponseTime,
  type ToolUsage as ToolUsageMetric, // Renamed to avoid conflict
  generateAgentStatusData,
  generateExecutionHistoryData,
  generateAverageResponseTimeData,
  generateToolUsageData,
} from "@/services/mockAgentData";


interface Filters {
  agentId: string;
  flowName: string;
  logType: string;
  status: string; 
  traceId: string;
  startTime?: Date;
  endTime?: Date;
}

interface AgentUsageData {
  agentId: string;
  count: number;
}
interface FlowUsageData {
  flowName: string;
  count: number;
}
interface ToolUsageData {
  toolName: string;
  count: number;
}
interface ErrorRatesData {
  groupKey: string; // Could be agentId or flowName
  errorCount: number;
}
interface AvgResponseTimesData {
  groupKey: string; // Could be agentId or flowName
  averageDurationMs: number;
  count: number; // Number of flows averaged
}

// Client-side LogEntry type
interface ClientLogEntry {
  id?: string; 
  timestamp: string; // Serialized ISO string
  agentId?: string;
  flowName?: string;
  type: 'start' | 'end' | 'tool_call' | 'error' | 'info' | string;
  traceId?: string;
  data: any;
  message?: string;
}

const initialFilters: Filters = {
  agentId: '',
  flowName: '',
  logType: 'all',
  status: 'all',
  traceId: '',
  startTime: undefined,
  endTime: undefined,
};

// Simple DatePicker component using Popover and Calendar
function DatePicker({ date, setDate, placeholder }: { date?: Date, setDate: (date?: Date) => void, placeholder: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// Helper component for consistent empty states
const EmptyStateDisplay = ({ icon: Icon, title, message, suggestion }: { icon: React.ElementType, title: string, message: string, suggestion?: string }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 md:py-16">
    <Icon className="w-12 h-12 text-muted-foreground/70 mb-4" />
    <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-md">{message}</p>
    {suggestion && <p className="text-xs text-muted-foreground/80 mt-2">{suggestion}</p>}
  </div>
);

export default function AgentMonitorPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  
  // State for Agent Usage Chart
  const [agentUsageData, setAgentUsageData] = useState<AgentUsageData[]>([]);
  const [agentUsageLoading, setAgentUsageLoading] = useState<boolean>(false);
  const [agentUsageError, setAgentUsageError] = useState<string | null>(null);

  // State for Flow Usage Chart
  const [flowUsageData, setFlowUsageData] = useState<FlowUsageData[]>([]);
  const [flowUsageLoading, setFlowUsageLoading] = useState<boolean>(false);
  const [flowUsageError, setFlowUsageError] = useState<string | null>(null);

  // State for Tool Usage Chart
  const [toolUsageData, setToolUsageData] = useState<ToolUsageData[]>([]);
  const [toolUsageLoading, setToolUsageLoading] = useState<boolean>(false);
  const [toolUsageError, setToolUsageError] = useState<string | null>(null);
  
  // State for Error Rates Chart
  const [errorRatesData, setErrorRatesData] = useState<ErrorRatesData[]>([]);
  const [errorRatesLoading, setErrorRatesLoading] = useState<boolean>(false);
  const [errorRatesError, setErrorRatesError] = useState<string | null>(null);

  // State for Average Response Times Chart
  const [avgResponseTimesData, setAvgResponseTimesData] = useState<AvgResponseTimesData[]>([]);
  const [avgResponseTimesLoading, setAvgResponseTimesLoading] = useState<boolean>(false);
  const [avgResponseTimesError, setAvgResponseTimesError] = useState<string | null>(null);

  // New states for mock data
  const [agentStatusData, setAgentStatusData] = useState<AgentStatus[]>([]);
  const [agentStatusLoading, setAgentStatusLoading] = useState<boolean>(false);
  const [agentStatusError, setAgentStatusError] = useState<string | null>(null);

  const [executionHistoryData, setExecutionHistoryData] = useState<ExecutionHistory[]>([]);
  const [executionHistoryLoading, setExecutionHistoryLoading] = useState<boolean>(false);
  const [executionHistoryError, setExecutionHistoryError] = useState<string | null>(null);

  const [averageResponseTimeData, setAverageResponseTimeData] = useState<AverageResponseTime[]>([]);
  const [averageResponseTimeLoading, setAverageResponseTimeLoading] = useState<boolean>(false);
  const [averageResponseTimeError, setAverageResponseTimeError] = useState<string | null>(null);

  const [toolUsageMetricsData, setToolUsageMetricsData] = useState<ToolUsageMetric[]>([]);
  const [toolUsageMetricsLoading, setToolUsageMetricsLoading] = useState<boolean>(false);
  const [toolUsageMetricsError, setToolUsageMetricsError] = useState<string | null>(null);

  // State for Trace Details
  const [traceData, setTraceData] = useState<ClientLogEntry[]>([]);
  const [traceLoading, setTraceLoading] = useState<boolean>(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [currentTraceId, setCurrentTraceId] = useState<string>('');

  interface DisplayAgent {
    id: string;
    name?: string; // Optional: if we can get names
    currentStatus: AgentStateEvent['status'] | 'unknown'; // 'unknown' for agents not yet seen in SSE
    lastSeen: string; // Timestamp of last status event
  }
  const [displayAgents, setDisplayAgents] = useState<Record<string, DisplayAgent>>({});

  const [liveEvents, setLiveEvents] = useState<MonitorEvent[]>([]);
  const [isSseConnected, setIsSseConnected] = useState<boolean>(false);
  const [sseError, setSseError] = useState<string | null>(null);
  const MAX_LIVE_EVENTS = 100;

  const [feedSearchQuery, setFeedSearchQuery] = useState<string>('');
  const [feedFilterAgentId, setFeedFilterAgentId] = useState<string>('');
  const [feedFilterEventType, setFeedFilterEventType] = useState<string>('all');
  const [feedFilterStatus, setFeedFilterStatus] = useState<string>('all');
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);

  const [verboseMode, setVerboseMode] = useState<boolean>(false);
  const [selectedTraceIdForTrajectory, setSelectedTraceIdForTrajectory] = useState<string | null>(null);
  const [expandedTrajectoryNodes, setExpandedTrajectoryNodes] = useState<Record<string, boolean>>({});

  interface ChartableMetric {
    id: string;
    name: string;
    value: number;
    [key: string]: any;
  }

  const [latencyMetrics, setLatencyMetrics] = useState<ChartableMetric[]>([]);
  const [tokenUsageMetrics, setTokenUsageMetrics] = useState<ChartableMetric[]>([]);
  const [costMetrics, setCostMetrics] = useState<ChartableMetric[]>([]);

  const MAX_METRIC_DATAPOINTS_PER_AGENT = 30;


  const agentUsageChartConfig = {
    count: {
      label: "Usage Count",
      color: "hsl(var(--chart-1))",
    },
    agentId: { // Though agentId is on XAxis, it's good practice to define it if tooltips or legends might refer to it.
      label: "Agent ID",
    }
  } satisfies ChartConfig;

  const flowUsageChartConfig = {
    count: { label: "Usage Count", color: "hsl(var(--chart-2))" },
    flowName: { label: "Flow Name" }
  } satisfies ChartConfig;

  const toolUsageChartConfig = {
    count: { label: "Usage Count", color: "hsl(var(--chart-3))" },
    toolName: { label: "Tool Name" }
  } satisfies ChartConfig;

  const errorRatesChartConfig = {
    errorCount: { label: "Error Count", color: "hsl(var(--chart-4))" },
    groupKey: { label: "Group" }
  } satisfies ChartConfig;

  const avgResponseTimesChartConfig = {
    averageDurationMs: { label: "Avg. Duration (ms)", color: "hsl(var(--chart-5))" },
    groupKey: { label: "Group" }
  } satisfies ChartConfig;

  // Chart configs for new mock data
  const executionHistoryChartConfig = {
    count: { label: "Count", color: "hsl(var(--chart-1))" }, // Using chart-1 for consistency, can be changed
    status: { label: "Status" },
  } satisfies ChartConfig;

  const averageResponseTimeChartConfig = {
    averageTime: { label: "Avg. Response Time (ms)", color: "hsl(var(--chart-2))" }, // Using chart-2
    agentId: { label: "Agent ID" },
  } satisfies ChartConfig;

  const toolUsageMetricsChartConfig = {
    usageCount: { label: "Usage Count", color: "hsl(var(--chart-3))" }, // Using chart-3
    toolName: { label: "Tool Name" },
  } satisfies ChartConfig;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (name: keyof Filters, date?: Date) => {
    setFilters(prev => ({ ...prev, [name]: date }));
  };

  const fetchAgentUsage = async (currentFilters: Filters) => {
    setAgentUsageLoading(true);
    setAgentUsageError(null);
    try {
      const params = new URLSearchParams();
      params.append('type', 'agentUsage');
      if (currentFilters.startTime) params.append('startTime', currentFilters.startTime.toISOString());
      if (currentFilters.endTime) params.append('endTime', currentFilters.endTime.toISOString());
      // Add other relevant filters from currentFilters if the API supports them for this endpoint
      
      const response = await fetch(`/api/agent-monitor/stats?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch agent usage data: ${response.statusText}`);
      }
      const data: AgentUsageData[] = await response.json();
      setAgentUsageData(data);
    } catch (error) {
      console.error("Error fetching agent usage:", error);
      setAgentUsageError(error instanceof Error ? error.message : String(error));
      setAgentUsageData([]); // Clear data on error
    } finally {
      setAgentUsageLoading(false);
    }
  };

  const fetchFlowUsage = async (currentFilters: Filters) => {
    setFlowUsageLoading(true);
    setFlowUsageError(null);
    try {
      const params = new URLSearchParams();
      params.append('type', 'flowUsage');
      if (currentFilters.startTime) params.append('startTime', currentFilters.startTime.toISOString());
      if (currentFilters.endTime) params.append('endTime', currentFilters.endTime.toISOString());
      const response = await fetch(`/api/agent-monitor/stats?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch flow usage: ${response.statusText}`);
      }
      const data: FlowUsageData[] = await response.json();
      setFlowUsageData(data);
    } catch (error) {
      console.error("Error fetching flow usage:", error);
      setFlowUsageError(error instanceof Error ? error.message : String(error));
      setFlowUsageData([]);
    } finally {
      setFlowUsageLoading(false);
    }
  };

  const fetchToolUsage = async (currentFilters: Filters) => {
    setToolUsageLoading(true);
    setToolUsageError(null);
    try {
      const params = new URLSearchParams();
      params.append('type', 'toolUsage');
      if (currentFilters.startTime) params.append('startTime', currentFilters.startTime.toISOString());
      if (currentFilters.endTime) params.append('endTime', currentFilters.endTime.toISOString());
      const response = await fetch(`/api/agent-monitor/stats?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch tool usage: ${response.statusText}`);
      }
      const data: ToolUsageData[] = await response.json();
      setToolUsageData(data);
    } catch (error) {
      console.error("Error fetching tool usage:", error);
      setToolUsageError(error instanceof Error ? error.message : String(error));
      setToolUsageData([]);
    } finally {
      setToolUsageLoading(false);
    }
  };

  const fetchErrorRates = async (currentFilters: Filters) => {
    setErrorRatesLoading(true);
    setErrorRatesError(null);
    try {
      const params = new URLSearchParams();
      params.append('type', 'errorRates');
      // Defaulting groupBy to 'flowName' as per instructions for now
      params.append('groupBy', 'flowName'); 
      if (currentFilters.startTime) params.append('startTime', currentFilters.startTime.toISOString());
      if (currentFilters.endTime) params.append('endTime', currentFilters.endTime.toISOString());
      const response = await fetch(`/api/agent-monitor/stats?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch error rates: ${response.statusText}`);
      }
      const data: ErrorRatesData[] = await response.json();
      setErrorRatesData(data);
    } catch (error) {
      console.error("Error fetching error rates:", error);
      setErrorRatesError(error instanceof Error ? error.message : String(error));
      setErrorRatesData([]);
    } finally {
      setErrorRatesLoading(false);
    }
  };

  const fetchAverageResponseTimes = async (currentFilters: Filters) => {
    setAvgResponseTimesLoading(true);
    setAvgResponseTimesError(null);
    try {
      const params = new URLSearchParams();
      params.append('type', 'averageResponseTimes');
      // Defaulting groupBy to 'flowName' as per instructions for now
      params.append('groupBy', 'flowName');
      if (currentFilters.startTime) params.append('startTime', currentFilters.startTime.toISOString());
      if (currentFilters.endTime) params.append('endTime', currentFilters.endTime.toISOString());
      const response = await fetch(`/api/agent-monitor/stats?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch average response times: ${response.statusText}`);
      }
      const data: AvgResponseTimesData[] = await response.json();
      setAvgResponseTimesData(data);
    } catch (error) {
      console.error("Error fetching average response times:", error);
      setAvgResponseTimesError(error instanceof Error ? error.message : String(error));
      setAvgResponseTimesData([]);
    } finally {
      setAvgResponseTimesLoading(false);
    }
  };

  const handleApplyFilters = () => {
    console.log("Applying filters:", filters);
    fetchAgentUsage(filters);
    fetchFlowUsage(filters);
    fetchToolUsage(filters);
    fetchErrorRates(filters);
    fetchAverageResponseTimes(filters);
  };

  const fetchTraceDetails = async (traceIdToFetch: string) => {
    if (!traceIdToFetch.trim()) {
      setTraceData([]);
      setTraceError(null);
      setCurrentTraceId('');
      return;
    }
    setTraceLoading(true);
    setTraceError(null);
    setCurrentTraceId(traceIdToFetch);
    try {
      const params = new URLSearchParams();
      params.append('type', 'traceDetails');
      params.append('traceId', traceIdToFetch);
      
      const response = await fetch(`/api/agent-monitor/stats?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch trace details: ${response.statusText}`);
      }
      const data: ClientLogEntry[] = await response.json();
      setTraceData(data); // API already sorts these
    } catch (error) {
      console.error("Error fetching trace details:", error);
      setTraceError(error instanceof Error ? error.message : String(error));
      setTraceData([]);
    } finally {
      setTraceLoading(false);
    }
  };

  const handleViewTrace = () => {
    if (filters.traceId) {
      fetchTraceDetails(filters.traceId);
    } else {
      setTraceData([]);
      setCurrentTraceId('');
      setTraceError('Please enter a Trace ID to view details.');
    }
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    console.log("Filters cleared");
    // Clear chart data as well
    setAgentUsageData([]);
    setFlowUsageData([]);
    setToolUsageData([]);
    setErrorRatesData([]);
    setAvgResponseTimesData([]);
    // Clear errors
    setAgentUsageError(null);
    setFlowUsageError(null);
    setToolUsageError(null);
    setErrorRatesError(null);
    setAvgResponseTimesError(null);
    // Clear trace
    setTraceData([]);
    setCurrentTraceId('');
    setTraceError(null);
    // Clear new mock data states
    setAgentStatusData([]);
    setExecutionHistoryData([]);
    setAverageResponseTimeData([]);
    setToolUsageMetricsData([]);
    setAgentStatusError(null);
    setExecutionHistoryError(null);
    setAverageResponseTimeError(null);
    setToolUsageMetricsError(null);
  };

  // useEffect for mock data generation on component mount
  useEffect(() => {
    setAgentStatusLoading(true);
    setAverageResponseTimeLoading(true); // Combined for efficiency with agentIds
    try {
      // Generate 5 agent IDs for mock data consistency
      const mockAgentIds = Array.from({ length: 5 }, (_, i) => `agent-${i}`);

      const initialAgentStatusData = generateAgentStatusData(mockAgentIds.length);
      setAgentStatusData(initialAgentStatusData);

      // Initialize displayAgents from agentStatusData and sseAgentIds
      const initialDisplayAgents: Record<string, DisplayAgent> = {};
      initialAgentStatusData.forEach(agent => {
        initialDisplayAgents[agent.id] = {
          id: agent.id,
          name: agent.id, // Assuming name is same as ID for mock
          currentStatus: agent.isActive ? 'online' : 'offline',
          lastSeen: new Date().toISOString(),
        };
      });

      const sseAgentIds = ['agent-001', 'agent-002', 'agent-003', 'agent-004', 'corp-workflow-agent']; // From monitor-stream route
      sseAgentIds.forEach(id => {
        if (!initialDisplayAgents[id]) {
          initialDisplayAgents[id] = { id, name: id, currentStatus: 'unknown', lastSeen: new Date().toISOString() };
        }
      });
      setDisplayAgents(initialDisplayAgents);

      // Pass the generated agent IDs to the response time generator
      setAverageResponseTimeData(generateAverageResponseTimeData(mockAgentIds));
    } catch (err) {
      setAgentStatusError('Failed to load agent status data.');
      setAverageResponseTimeError('Failed to load average response time data.');
      console.error("Error in agent status/avg response time data generation:", err);
    } finally {
      setAgentStatusLoading(false);
      setAverageResponseTimeLoading(false);
    }

    setExecutionHistoryLoading(true);
    try {
      setExecutionHistoryData(generateExecutionHistoryData(50)); // Example count
    } catch (err) {
      setExecutionHistoryError('Failed to load execution history data.');
      console.error("Error in execution history data generation:", err);
    } finally {
      setExecutionHistoryLoading(false);
    }

    setToolUsageMetricsLoading(true);
    try {
      const tools = ['ToolReader', 'ToolWriter', 'ToolAPI', 'ToolDB', 'ToolAnalysis']; // Example tool names
      setToolUsageMetricsData(generateToolUsageData(tools, 100)); // Example max usage
    } catch (err) {
      setToolUsageMetricsError('Failed to load tool usage metrics data.');
      console.error("Error in tool usage metrics data generation:", err);
    } finally {
      setToolUsageMetricsLoading(false);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    const eventSource = new EventSource('/api/monitor-stream');
    console.log("Attempting to connect to SSE stream...");
    setSseError(null);

    eventSource.onopen = () => {
      console.log('SSE connection established.');
      setIsSseConnected(true);
      setSseError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const newEvent = JSON.parse(event.data) as MonitorEvent;
        setLiveEvents((prevEvents) => {
          const updatedEvents = [newEvent, ...prevEvents];
          if (updatedEvents.length > MAX_LIVE_EVENTS) {
            return updatedEvents.slice(0, MAX_LIVE_EVENTS);
          }
          return updatedEvents;
        });

        // Update displayAgents based on the new event
        if (newEvent.eventType === 'agent_state') {
          const stateEvent = newEvent as AgentStateEvent;
          setDisplayAgents(prevAgents => ({
            ...prevAgents,
            [stateEvent.agentId]: {
              id: stateEvent.agentId,
              name: prevAgents[stateEvent.agentId]?.name || stateEvent.agentId,
              currentStatus: stateEvent.status,
              lastSeen: stateEvent.timestamp,
            }
          }));
        } else {
          setDisplayAgents(prevAgents => {
            if (prevAgents[newEvent.agentId] && (prevAgents[newEvent.agentId].currentStatus === 'offline' || prevAgents[newEvent.agentId].currentStatus === 'unknown' || prevAgents[newEvent.agentId].currentStatus === 'idle')) {
              return {
                ...prevAgents,
                [newEvent.agentId]: {
                  ...prevAgents[newEvent.agentId],
                  currentStatus: 'busy',
                  lastSeen: newEvent.timestamp,
                }
              };
            } else if (!prevAgents[newEvent.agentId]) {
              return {
                ...prevAgents,
                [newEvent.agentId]: {
                  id: newEvent.agentId,
                  name: newEvent.agentId,
                  currentStatus: 'busy',
                  lastSeen: newEvent.timestamp,
                }
              };
            }
            // If agent is already online/busy and it's not an agent_state event, update lastSeen
            else if (prevAgents[newEvent.agentId]) {
               return {
                 ...prevAgents,
                 [newEvent.agentId]: {
                   ...prevAgents[newEvent.agentId],
                   lastSeen: newEvent.timestamp,
                 }
               };
            }
            return prevAgents;
          });
        } else if (newEvent.eventType === 'performance_metrics') {
          const perfEvent = newEvent as PerformanceMetricsEvent;
          const metricItem: ChartableMetric = {
            id: perfEvent.agentId,
            name: perfEvent.agentId,
            value: perfEvent.value,
            timestamp: perfEvent.timestamp,
            unit: perfEvent.unit,
          };

          if (perfEvent.metricName === 'latency') {
            setLatencyMetrics(prevMetrics => {
              const agentIndex = prevMetrics.findIndex(m => m.id === perfEvent.agentId);
              if (agentIndex > -1) {
                 const newMetrics = [...prevMetrics.filter(m => m.id !== perfEvent.agentId), metricItem];
                 return newMetrics.sort((a,b) => a.name.localeCompare(b.name));
              } else {
                 return [...prevMetrics, metricItem].sort((a,b) => a.name.localeCompare(b.name));
              }
            });
          } else if (perfEvent.metricName === 'token_usage') {
            if(perfEvent.details?.tokensUsed) metricItem.value = perfEvent.details.tokensUsed;
            else if(perfEvent.details?.totalTokens) metricItem.value = perfEvent.details.totalTokens;

            setTokenUsageMetrics(prevMetrics => {
              const agentIndex = prevMetrics.findIndex(m => m.id === perfEvent.agentId);
              if (agentIndex > -1) {
                const newMetrics = [...prevMetrics.filter(m => m.id !== perfEvent.agentId), metricItem];
                return newMetrics.sort((a,b) => a.name.localeCompare(b.name));
              } else {
                return [...prevMetrics, metricItem].sort((a,b) => a.name.localeCompare(b.name));
              }
            });
          } else if (perfEvent.metricName === 'cost') {
             if(perfEvent.details?.simulatedCost) metricItem.value = perfEvent.details.simulatedCost;

            setCostMetrics(prevMetrics => {
              const agentIndex = prevMetrics.findIndex(m => m.id === perfEvent.agentId);
               if (agentIndex > -1) {
                const newMetrics = [...prevMetrics.filter(m => m.id !== perfEvent.agentId), metricItem];
                return newMetrics.sort((a,b) => a.name.localeCompare(b.name));
              } else {
                return [...prevMetrics, metricItem].sort((a,b) => a.name.localeCompare(b.name));
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to parse SSE event data:', error);
        // setSseError('Failed to parse event data.'); // Optionally update UI
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsSseConnected(false);
      setSseError('Connection to live feed failed. If this persists, please check the console or try refreshing.');
      eventSource.close();
    };

    const eventSourceRef = React.useRef(eventSource);

    return () => {
      console.log('Closing SSE connection.');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setIsSseConnected(false);
    };
  }, []);


  const logTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'start', label: 'Start' },
    { value: 'end', label: 'End' },
    { value: 'tool_call', label: 'Tool Call' },
    { value: 'error', label: 'Error' },
    { value: 'info', label: 'Info' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'success', label: 'Success' }, // Assuming 'success' can be determined (e.g. presence of 'end' and no 'error' for a trace)
    { value: 'error', label: 'Error' },   // Directly from 'error' type logs
  ];

  const filteredLiveEvents = React.useMemo(() => {
    return liveEvents.filter(event => {
      // Event Type Filter
      if (feedFilterEventType !== 'all' && event.eventType !== feedFilterEventType) {
        return false;
      }

      // Agent ID Filter (exact match for simplicity, could be partial)
      if (feedFilterAgentId && event.agentId !== feedFilterAgentId) {
        return false;
      }

      // Status Filter
      if (feedFilterStatus !== 'all') {
        let eventStatus = '';
        if (event.eventType === 'tool_call') eventStatus = (event as ToolCallEvent).status;
        else if (event.eventType === 'task_completion') eventStatus = (event as TaskCompletionEvent).status;
        else if (event.eventType === 'agent_state') eventStatus = (event as AgentStateEvent).status;
        // Errors have their own eventType, so 'error' status check might be redundant if eventType 'error' is selected
        // but useful if filtering other event types for an error *within* them (e.g. tool_call error status)
        else if (event.eventType === 'error') eventStatus = 'error';


        if (eventStatus !== feedFilterStatus) {
          // Specific handling for 'error' status to catch tool_call errors when 'error' status is selected
          if (!(feedFilterStatus === 'error' && event.eventType === 'tool_call' && (event as ToolCallEvent).status === 'error')) {
             if (!(feedFilterStatus === 'failure' && event.eventType === 'task_completion' && (event as TaskCompletionEvent).status === 'failure')) {
              // Allow 'error' eventType to always pass if status filter is 'error'
              if (!(feedFilterStatus === 'error' && event.eventType === 'error')) {
                 return false;
              }
             }
          }
        }
      }

      // Search Query Filter (case-insensitive)
      if (feedSearchQuery) {
        const query = feedSearchQuery.toLowerCase();
        let searchableContent = `${event.agentId} ${event.eventType} ${event.id} ${event.timestamp}`;
        if (event.traceId) searchableContent += ` ${event.traceId}`;

        switch (event.eventType) {
          case 'tool_call':
            const tcEvent = event as ToolCallEvent;
            searchableContent += ` ${tcEvent.toolName} ${tcEvent.status}`;
            if (tcEvent.input) searchableContent += ` ${JSON.stringify(tcEvent.input).toLowerCase()}`;
            if (tcEvent.output) searchableContent += ` ${JSON.stringify(tcEvent.output).toLowerCase()}`;
            if (tcEvent.errorDetails) searchableContent += ` ${tcEvent.errorDetails.message.toLowerCase()}`;
            break;
          case 'task_completion':
            const tcompEvent = event as TaskCompletionEvent;
            searchableContent += ` ${tcompEvent.status}`;
            if (tcompEvent.message) searchableContent += ` ${tcompEvent.message.toLowerCase()}`;
            if (tcompEvent.result) searchableContent += ` ${JSON.stringify(tcompEvent.result).toLowerCase()}`;
            break;
          case 'error':
            const errEvent = event as ErrorEvent;
            searchableContent += ` ${errEvent.errorMessage.toLowerCase()}`;
            if (errEvent.stackTrace) searchableContent += ` ${errEvent.stackTrace.toLowerCase()}`;
            if (errEvent.errorSource) searchableContent += ` ${errEvent.errorSource.toLowerCase()}`;
            break;
          case 'info':
            const infoEvent = event as InfoEvent;
            searchableContent += ` ${infoEvent.message.toLowerCase()}`;
            if (infoEvent.data) searchableContent += ` ${JSON.stringify(infoEvent.data).toLowerCase()}`;
            break;
          case 'agent_state':
            const asEvent = event as AgentStateEvent;
            searchableContent += ` ${asEvent.status}`;
            if (asEvent.message) searchableContent += ` ${asEvent.message.toLowerCase()}`;
            break;
          case 'performance_metrics':
            const pmEvent = event as PerformanceMetricsEvent;
            searchableContent += ` ${pmEvent.metricName} ${pmEvent.value}`;
            if(pmEvent.unit) searchableContent += ` ${pmEvent.unit}`;
            if(pmEvent.details) searchableContent += ` ${JSON.stringify(pmEvent.details).toLowerCase()}`;
            break;
        }
        if (!searchableContent.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [liveEvents, feedSearchQuery, feedFilterAgentId, feedFilterEventType, feedFilterStatus]);

  const feedEventTypeOptions = [
    { value: 'all', label: 'All Event Types' },
    { value: 'tool_call', label: 'Tool Call' },
    { value: 'task_completion', label: 'Task Completion' },
    { value: 'error', label: 'Error' },
    { value: 'info', label: 'Info' },
    { value: 'agent_state', label: 'Agent State' },
    { value: 'performance_metrics', label: 'Performance Metrics' },
  ];

  const feedStatusOptions = [
    { value: 'all', label: 'All Statuses' },
    // For ToolCallEvent
    { value: 'started', label: 'Started (Tool)' },
    { value: 'completed', label: 'Completed (Tool)' },
    // For TaskCompletionEvent
    { value: 'success', label: 'Success (Task)' },
    { value: 'failure', label: 'Failure (Task)' },
    // For ErrorEvent (implicit status)
    { value: 'error', label: 'Error (Event/Tool)' }, // Catches ErrorEvent type and tool_call with error status
    // For AgentStateEvent
    { value: 'online', label: 'Online (Agent)' },
    { value: 'offline', label: 'Offline (Agent)' },
    { value: 'busy', label: 'Busy (Agent)' },
    { value: 'idle', label: 'Idle (Agent)' },
  ];

  const getStatusIndicatorClass = (status: DisplayAgent['currentStatus']): string => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-slate-400 dark:bg-slate-600';
      case 'busy':
        return 'bg-yellow-500 animate-pulse';
      case 'idle':
        return 'bg-sky-500';
      case 'unknown':
      default:
        return 'bg-gray-300 dark:bg-gray-700';
    }
  };

  const latencyChartConfig = {
    value: { label: "Latency (ms)", color: "hsl(var(--chart-1))" },
    name: { label: "Agent ID" },
  } satisfies ChartConfig;

  const tokenUsageChartConfig = {
    value: { label: "Tokens Used", color: "hsl(var(--chart-2))" },
    name: { label: "Agent ID" },
  } satisfies ChartConfig;

  const costChartConfig = {
    value: { label: "Simulated Cost (USD)", color: "hsl(var(--chart-3))" },
    name: { label: "Agent ID" },
  } satisfies ChartConfig;

  const getTrajectoryEvents = (traceId: string | null): MonitorEvent[] => {
    if (!traceId) return [];
    return liveEvents
      .filter(event => event.traceId === traceId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const renderEventDetails = (event: MonitorEvent) => {
    let details = `Agent: ${event.agentId}`;
    let content = '';
    let styleClass = 'text-sm'; // Base style

    switch (event.eventType) {
      case 'tool_call':
        const tcEvent = event as ToolCallEvent;
        content = `Tool: ${tcEvent.toolName} (${tcEvent.status})`;
        if (tcEvent.status === 'error' && tcEvent.errorDetails) {
          content += ` - Error: ${tcEvent.errorDetails.message}`;
          styleClass += ' text-orange-500 dark:text-orange-400';
        } else if (tcEvent.status === 'completed') {
           styleClass += ' text-green-500 dark:text-green-400';
        } else if (tcEvent.status === 'started') {
          styleClass += ' text-sky-500 dark:text-sky-400';
        }
        break;
      case 'task_completion':
        const tcompEvent = event as TaskCompletionEvent;
        content = `${tcompEvent.message || 'Task completed'} (Status: ${tcompEvent.status})`;
        if (tcompEvent.status === 'failure') {
          styleClass += ' text-red-500 dark:text-red-400 font-medium';
        } else {
          styleClass += ' text-blue-500 dark:text-blue-400';
        }
        break;
      case 'error':
        const errEvent = event as ErrorEvent;
        content = `Error: ${errEvent.errorMessage}`;
        styleClass += ' text-red-500 dark:text-red-400 font-semibold';
        break;
      case 'info':
        content = `Info: ${(event as InfoEvent).message}`;
        styleClass += ' text-gray-500 dark:text-gray-300';
        break;
      case 'agent_state':
        const asEvent = event as AgentStateEvent;
        content = `Agent Status: ${asEvent.status}. ${asEvent.message || ''}`;
        if (asEvent.status === 'online') styleClass += ' text-emerald-500 dark:text-emerald-400';
        else if (asEvent.status === 'offline') styleClass += ' text-slate-500 dark:text-slate-400';
        else if (asEvent.status === 'busy') styleClass += ' text-yellow-500 dark:text-yellow-400';
        else styleClass += ' text-gray-500 dark:text-gray-300';
        break;
      case 'performance_metrics':
        const pmEvent = event as PerformanceMetricsEvent;
        content = `Perf: ${pmEvent.metricName}: ${typeof pmEvent.value === 'number' ? pmEvent.value.toFixed(2) : pmEvent.value}${pmEvent.unit ? ' ' + pmEvent.unit : ''}`;
        styleClass += ' text-purple-500 dark:text-purple-400';
        break;
      default:
        const unknownEvent = event as any;
        content = `Unknown event type: ${unknownEvent.eventType}`;
        styleClass += ' text-gray-400 dark:text-gray-500';
    }
    return <span className={styleClass}><strong className="font-medium">{details}</strong> - {content}</span>;
  };


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Agent Monitor</h1>
      
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="agentId">Agent ID</Label>
            <Input id="agentId" name="agentId" value={filters.agentId} onChange={handleChange} placeholder="Enter Agent ID" />
          </div>
          <div>
            <Label htmlFor="flowName">Flow Name</Label>
            <Input id="flowName" name="flowName" value={filters.flowName} onChange={handleChange} placeholder="Enter Flow Name" />
          </div>
          <div className="flex flex-col space-y-1.5"> {/* Ensure label and input group are vertically aligned */}
            <Label htmlFor="traceId">Trace ID</Label>
            <div className="flex space-x-2">
              <Input 
                id="traceId" 
                name="traceId" 
                className="flex-1" 
                value={filters.traceId} 
                onChange={handleChange} 
                placeholder="Enter Trace ID" 
              />
              <Button 
                onClick={handleViewTrace} 
                variant="secondary" 
                disabled={!filters.traceId || (traceLoading && currentTraceId === filters.traceId)}
              >
                {(traceLoading && currentTraceId === filters.traceId) ? "Loading..." : "View Trace"}
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="logType">Log Type</Label>
            <Select name="logType" value={filters.logType} onValueChange={(value) => handleSelectChange('logType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Log Type" />
              </SelectTrigger>
              <SelectContent>
                {logTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
             <Select name="status" value={filters.status} onValueChange={(value) => handleSelectChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startTime">Start Time</Label>
            <DatePicker date={filters.startTime} setDate={(date) => handleDateChange('startTime', date)} placeholder="Select start date" />
          </div>
          <div>
            <Label htmlFor="endTime">End Time</Label>
            <DatePicker date={filters.endTime} setDate={(date) => handleDateChange('endTime', date)} placeholder="Select end date" />
          </div>
        </div>
        <div className="flex justify-end items-center space-x-4 mt-6">
          <div className="flex items-center space-x-2 mr-auto"> {/* Pushes toggle to the left */}
            <Switch
              id="verbose-mode"
              checked={verboseMode}
              onCheckedChange={setVerboseMode}
            />
            <Label htmlFor="verbose-mode" className="text-sm">Verbose Mode (Show Trajectories)</Label>
          </div>
          <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </div>
      </div>
      {/* END OF FILTERS SECTION */}

      {/* START OF LIVE ACTIVITY FEED SECTION */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Live Activity Feed</h2>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isSseConnected ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' : 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'}`}>
              {isSseConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 mb-6 pb-4 border-b border-border">
          <div>
            <Label htmlFor="feedSearchQuery" className="text-xs text-muted-foreground">Search Feed</Label>
            <Input
              id="feedSearchQuery"
              name="feedSearchQuery"
              placeholder="Keywords, IDs, messages..."
              value={feedSearchQuery}
              onChange={(e) => setFeedSearchQuery(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="feedFilterAgentId" className="text-xs text-muted-foreground">Agent ID</Label>
            <Input
              id="feedFilterAgentId"
              name="feedFilterAgentId"
              placeholder="Filter by Agent ID"
              value={feedFilterAgentId}
              onChange={(e) => setFeedFilterAgentId(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="feedFilterEventType" className="text-xs text-muted-foreground">Event Type</Label>
            <Select value={feedFilterEventType} onValueChange={setFeedFilterEventType}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select Event Type" />
              </SelectTrigger>
              <SelectContent>
                {feedEventTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="feedFilterStatus" className="text-xs text-muted-foreground">Status</Label>
            <Select value={feedFilterStatus} onValueChange={setFeedFilterStatus}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {feedStatusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <ScrollArea className="h-[400px] w-full border rounded-md p-0 bg-muted/20 dark:bg-muted/10">
          <div className="p-4"> {/* Inner div for padding */}
            {filteredLiveEvents.length === 0 ? (
              <EmptyStateDisplay
                icon={isSseConnected ? Inbox : WifiOff}
                title={
                  !isSseConnected ? "Connecting to event stream..." :
                  liveEvents.length === 0 ? "Waiting for events..." :
                  "No events match filters"
                }
                message={
                  sseError ? sseError :
                  !isSseConnected ? "Attempting to connect to the live feed. If this persists, check the console." :
                  liveEvents.length === 0 ? "No new agent activities detected yet." :
                  "Try adjusting your search or filter criteria."
                }
              />
            ) : (
              <ul className="space-y-2.5">
                {filteredLiveEvents.map((event) => (
                  <li key={event.id} className="text-xs p-2.5 rounded-lg bg-background dark:bg-black/20 shadow-sm border border-border/50 hover:border-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-mono text-muted-foreground text-[11px]">{format(new Date(event.timestamp), "HH:mm:ss.SSS")}</span>
                      <div className="flex items-center space-x-2">
                        {event.traceId && <span className="text-[10px] text-muted-foreground/70 hover:text-muted-foreground transition-colors">Trace: {event.traceId}</span>}
                        {event.eventType === 'error' && (event as ErrorEvent).stackTrace && (
                          <Button
                            variant="link"
                            size="xs" // Assuming you have or can create a small size for buttons, or use text styling
                            className="text-xs h-auto p-0 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            onClick={() => setExpandedErrorId(expandedErrorId === event.id ? null : event.id)}
                          >
                            {expandedErrorId === event.id ? 'Hide Details' : 'Show Details'}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-0.5">{renderEventDetails(event)}</div>
                    {event.eventType === 'error' && expandedErrorId === event.id && (event as ErrorEvent).stackTrace && (
                      <div className="mt-2 pt-2 border-t border-dashed border-border/70">
                        <h4 className="text-xs font-semibold mb-1 text-muted-foreground">Stack Trace:</h4>
                        <pre className="text-[10px] p-2 bg-muted/50 dark:bg-muted/20 rounded-md overflow-x-auto whitespace-pre-wrap break-all">
                          {(event as ErrorEvent).stackTrace}
                        </pre>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollArea>
      </div>
      {/* END OF LIVE ACTIVITY FEED SECTION */}

      {/* START OF AGENT STATUS INDICATORS SECTION */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Agent Live Status</h2>
        {Object.keys(displayAgents).length === 0 ? (
          <EmptyStateDisplay
            icon={Activity} // Or UsersIcon if you import it
            title="No Agents Detected"
            message="Agent statuses will appear here as they become active or send events."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.values(displayAgents)
              .sort((a, b) => a.id.localeCompare(b.id)) // Sort for consistent order
              .map((agent) => (
              <div key={agent.id} className="flex items-center p-3 rounded-md border bg-background dark:bg-black/20 shadow-sm hover:shadow-md transition-shadow">
                <span className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${getStatusIndicatorClass(agent.currentStatus)}`}></span>
                <div className="flex-grow">
                  <p className="text-sm font-medium text-foreground truncate" title={agent.name || agent.id}>{agent.name || agent.id}</p>
                  <p className="text-xs text-muted-foreground capitalize">{agent.currentStatus}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/80 ml-2 whitespace-nowrap">
                  {format(new Date(agent.lastSeen), "HH:mm:ss")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* END OF AGENT STATUS INDICATORS SECTION */}

      {/* START OF VISUAL TRAJECTORY SECTION */}
      {verboseMode && (
        <div className="bg-card p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Agent Execution Trajectory</h2>
          <div className="flex items-end gap-4 mb-6 pb-4 border-b border-border">
            <div className="flex-grow">
              <Label htmlFor="trajectoryTraceIdInput" className="text-xs text-muted-foreground">Enter Trace ID to View Trajectory</Label>
              <Input
                id="trajectoryTraceIdInput"
                placeholder="Enter Trace ID..."
                value={selectedTraceIdForTrajectory || ''}
                onChange={(e) => setSelectedTraceIdForTrajectory(e.target.value)}
                className="h-9 text-sm mt-1"
              />
            </div>
            <Button
              onClick={() => {
                if (selectedTraceIdForTrajectory) {
                  setExpandedTrajectoryNodes({});
                }
              }}
              disabled={!selectedTraceIdForTrajectory}
              className="h-9"
              variant="secondary"
            >
              View Trajectory
            </Button>
          </div>

          {selectedTraceIdForTrajectory ? (
            getTrajectoryEvents(selectedTraceIdForTrajectory).length > 0 ? (
              <ScrollArea className="h-[500px] w-full rounded-md p-0">
                <div className="p-1">
                  <p className="text-sm text-muted-foreground mb-3">
                    Showing trajectory for Trace ID: <span className="font-mono text-primary">{selectedTraceIdForTrajectory}</span>
                  </p>
                  <ul className="space-y-1">
                    {getTrajectoryEvents(selectedTraceIdForTrajectory).map((event, index, array) => {
                      return (
                        <li key={event.id} className={`p-2.5 rounded-md border border-border/70 bg-background dark:bg-black/20`}>
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-[10px] text-muted-foreground">{format(new Date(event.timestamp), "HH:mm:ss.SSS")}</span>
                          </div>
                          <div className="mt-1 text-xs">
                            {renderEventDetails(event)}
                          </div>
                           {(event.eventType === 'tool_call' && ((event as ToolCallEvent).input || (event as ToolCallEvent).output)) && (
                            <div className="mt-1.5 pt-1.5 border-t border-dashed border-border/50 text-[10px]">
                              { (event as ToolCallEvent).input && (
                                <div className="mb-1">
                                  <strong className="text-muted-foreground">Input:</strong>
                                  <pre className="p-1.5 bg-muted/30 dark:bg-muted/10 rounded whitespace-pre-wrap break-all">{JSON.stringify((event as ToolCallEvent).input, null, 2)}</pre>
                                </div>
                              )}
                              { (event as ToolCallEvent).output && (
                                <div>
                                  <strong className="text-muted-foreground">Output:</strong>
                                  <pre className="p-1.5 bg-muted/30 dark:bg-muted/10 rounded whitespace-pre-wrap break-all">{JSON.stringify((event as ToolCallEvent).output, null, 2)}</pre>
                                </div>
                              )}
                               {(event as ToolCallEvent).status === 'error' && (event as ToolCallEvent).errorDetails && (
                                <div className="mt-1">
                                  <strong className="text-red-500 dark:text-red-400">Tool Error:</strong>
                                  <pre className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded whitespace-pre-wrap break-all">{JSON.stringify((event as ToolCallEvent).errorDetails, null, 2)}</pre>
                                </div>
                              )}
                            </div>
                          )}
                           {event.eventType === 'error' && (event as ErrorEvent).stackTrace && (
                            <div className="mt-1.5 pt-1.5 border-t border-dashed border-border/50 text-[10px]">
                                <strong className="text-red-500 dark:text-red-400">Stack Trace:</strong>
                                <pre className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded  whitespace-pre-wrap break-all">{(event as ErrorEvent).stackTrace}</pre>
                            </div>
                           )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </ScrollArea>
            ) : (
              <EmptyStateDisplay
                icon={SearchX}
                title="No Events for Trace ID"
                message={`No events found for Trace ID: ${selectedTraceIdForTrajectory}. Ensure the ID is correct and events have been processed.`}
              />
            )
          ) : (
            <EmptyStateDisplay
              icon={Settings2}
              title="Select a Trace ID"
              message="Enter a Trace ID in the input above to view its execution trajectory. Verbose mode must be enabled."
            />
          )}
        </div>
      )}
      {/* END OF VISUAL TRAJECTORY SECTION */}

      {/* START OF PERFORMANCE METRICS CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Latency Chart */}
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Average Latency per Agent</h2>
          {latencyMetrics.length > 0 ? (
            <ChartContainer config={latencyChartConfig} className="min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={latencyMetrics} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis strokeDasharray="3 3" tickLine={false} axisLine={false} fontSize={10} unit="ms" />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" valueFormatter={(value) => `${value} ms`} />}
                  />
                  <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyStateDisplay icon={LineChart} title="No Latency Data" message="Latency metrics will appear here." />
          )}
        </div>

        {/* Token Usage Chart */}
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Token Usage per Agent</h2>
          {tokenUsageMetrics.length > 0 ? (
            <ChartContainer config={tokenUsageChartConfig} className="min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tokenUsageMetrics} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis strokeDasharray="3 3" tickLine={false} axisLine={false} fontSize={10} unit=" tokens" />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" valueFormatter={(value) => `${value} tokens`} />}
                  />
                  <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyStateDisplay icon={PieChart} title="No Token Usage Data" message="Token usage metrics will appear here." />
          )}
        </div>

        {/* Cost Chart */}
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Simulated Cost per Agent</h2>
          {costMetrics.length > 0 ? (
            <ChartContainer config={costChartConfig} className="min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={costMetrics} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis strokeDasharray="3 3" tickLine={false} axisLine={false} fontSize={10} unit="$" tickFormatter={(value) => value.toFixed(4)} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dashed" valueFormatter={(value) => `$${Number(value).toFixed(4)}`} />}
                  />
                  <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyStateDisplay icon={BarChartBig} title="No Cost Data" message="Simulated cost metrics will appear here." />
          )}
        </div>
      </div>
      {/* END OF PERFORMANCE METRICS CHARTS SECTION */}

      {/* Agent Status Summary */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Agent Status Overview</h2>
        {agentStatusLoading ? (
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <Skeleton className="h-8 w-1/4 mx-auto mb-2" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
            <div>
              <Skeleton className="h-8 w-1/4 mx-auto mb-2" />
              <Skeleton className="h-4 w-1/2 mx-auto" />
            </div>
          </div>
        ) : agentStatusError ? (
          <p className="text-red-500 text-center py-4">{agentStatusError}</p>
        ) : agentStatusData.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-green-500">{agentStatusData.filter(a => a.isActive).length}</p>
              <p className="text-sm text-muted-foreground">Active Agents</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-red-500">{agentStatusData.filter(a => !a.isActive).length}</p>
              <p className="text-sm text-muted-foreground">Inactive Agents</p>
            </div>
          </div>
        )}
         {!agentStatusLoading && !agentStatusError && agentStatusData.length === 0 && (
          <EmptyStateDisplay
            icon={Activity}
            title="Nenhum Status de Agente"
            message="Não há dados de status de agente disponíveis no momento."
          />
        )}
      </div>

      {/* Execution History Chart */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Execution History (Mock Data)</h2>
        {executionHistoryLoading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : executionHistoryError ? (
          <p className="text-red-500 text-center py-10">{executionHistoryError}</p>
        ) : executionHistoryData.length > 0 ? (
          <ChartContainer config={executionHistoryChartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { status: 'Success', count: executionHistoryData.filter(e => e.status === 'success').length, fill: "var(--color-count)" },
                  { status: 'Failure', count: executionHistoryData.filter(e => e.status === 'failure').length, fill: "hsl(var(--chart-4))" /* Using chart-4 for errors */ }
                ]}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="status" tickLine={false} axisLine={false} />
                <YAxis strokeDasharray="3 3" tickLine={false} axisLine={false} allowDecimals={false}/>
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                {/* No legend needed for this simple chart */}
                <Bar dataKey="count" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        {!executionHistoryLoading && !executionHistoryError && executionHistoryData.length === 0 && (
          <EmptyStateDisplay
            icon={ListX}
            title="Nenhum Histórico de Execução"
            message="Não há dados de histórico de execução disponíveis."
          />
        )}
      </div>

      {/* Average Response Time Chart (Mock) */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Average Response Times (Mock Data)</h2>
        {averageResponseTimeLoading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : averageResponseTimeError ? (
          <p className="text-red-500 text-center py-10">{averageResponseTimeError}</p>
        ) : averageResponseTimeData.length > 0 ? (
          <ChartContainer config={averageResponseTimeChartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={averageResponseTimeData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="agentId" tickLine={false} axisLine={false} />
                <YAxis dataKey="averageTime" strokeDasharray="3 3" tickLine={false} axisLine={false} unit="ms" />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" valueFormatter={(value) => `${value} ms`} />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="averageTime" fill="var(--color-averageTime)" radius={4} name="Avg. Response Time" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        {!averageResponseTimeLoading && !averageResponseTimeError && averageResponseTimeData.length === 0 && (
          <EmptyStateDisplay
            icon={LineChart}
            title="Nenhum Dado de Tempo de Resposta"
            message="Não há dados de tempo médio de resposta disponíveis."
          />
        )}
      </div>

      {/* Tool Usage Metrics Chart (Mock) */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Tool Usage Metrics (Mock Data)</h2>
        {toolUsageMetricsLoading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : toolUsageMetricsError ? (
          <p className="text-red-500 text-center py-10">{toolUsageMetricsError}</p>
        ) : toolUsageMetricsData.length > 0 ? (
          <ChartContainer config={toolUsageMetricsChartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={toolUsageMetricsData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="toolName" tickLine={false} axisLine={false} />
                <YAxis dataKey="usageCount" strokeDasharray="3 3" tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="usageCount" fill="var(--color-usageCount)" radius={4} name="Usage Count"/>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        {!toolUsageMetricsLoading && !toolUsageMetricsError && toolUsageMetricsData.length === 0 && (
          <EmptyStateDisplay
            icon={PieChart}
            title="Nenhuma Métrica de Uso de Ferramenta"
            message="Não há métricas de uso de ferramenta disponíveis."
          />
        )}
      </div>

      {/* Existing charts below - these are driven by API and filters */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Agent Usage Frequency</h2>
        {agentUsageLoading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : agentUsageError ? (
          <p className="text-red-500 text-center py-10">Error loading agent usage: {agentUsageError}</p>
        ) : agentUsageData.length > 0 ? (
          <ChartContainer config={agentUsageChartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentUsageData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="agentId" tickLine={false} axisLine={false} />
                <YAxis strokeDasharray="3 3" tickLine={false} axisLine={false} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        {!agentUsageLoading && !agentUsageError && agentUsageData.length === 0 && (
          <EmptyStateDisplay
            icon={BarChartBig}
            title="Nenhum Uso de Agente"
            message="Nenhum dado de uso de agente disponível para os filtros selecionados."
            suggestion="Tente ajustar os filtros ou aguarde novos dados."
          />
        )}
      </div>
      
      {/* Keep other placeholders for now */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Flow Usage Frequency</h2>
        {flowUsageLoading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : flowUsageError ? (
          <p className="text-red-500 text-center py-10">Error loading flow usage: {flowUsageError}</p>
        ) : flowUsageData.length > 0 ? (
          <ChartContainer config={flowUsageChartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={flowUsageData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="flowName" tickLine={false} axisLine={false} />
                <YAxis strokeDasharray="3 3" tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        {!flowUsageLoading && !flowUsageError && flowUsageData.length === 0 && (
          <EmptyStateDisplay
            icon={BarChartBig}
            title="Nenhum Uso de Fluxo"
            message="Nenhum dado de uso de fluxo disponível para os filtros selecionados."
            suggestion="Tente ajustar os filtros ou aguarde novos dados."
          />
        )}
      </div>

      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Tool Usage Frequency</h2>
        {toolUsageLoading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : toolUsageError ? (
          <p className="text-red-500 text-center py-10">Error loading tool usage: {toolUsageError}</p>
        ) : toolUsageData.length > 0 ? (
          <ChartContainer config={toolUsageChartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={toolUsageData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="toolName" tickLine={false} axisLine={false} />
                <YAxis strokeDasharray="3 3" tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        {!toolUsageLoading && !toolUsageError && toolUsageData.length === 0 && (
          <EmptyStateDisplay
            icon={BarChartBig}
            title="Nenhum Uso de Ferramenta"
            message="Nenhum dado de uso de ferramenta disponível para os filtros selecionados."
            suggestion="Tente ajustar os filtros ou aguarde novos dados."
          />
        )}
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Error Rates (by Flow Name)</h2>
        {errorRatesLoading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : errorRatesError ? (
          <p className="text-red-500 text-center py-10">Error loading error rates: {errorRatesError}</p>
        ) : errorRatesData.length > 0 ? (
          <ChartContainer config={errorRatesChartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={errorRatesData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="groupKey" tickLine={false} axisLine={false} />
                <YAxis strokeDasharray="3 3" tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="errorCount" fill="var(--color-errorCount)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        {!errorRatesLoading && !errorRatesError && errorRatesData.length === 0 && (
          <EmptyStateDisplay
            icon={ShieldAlert}
            title="Nenhuma Taxa de Erro"
            message="Nenhuma taxa de erro disponível para os filtros selecionados."
            suggestion="Tente ajustar os filtros ou aguarde novos dados."
          />
        )}
      </div>

      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Average Response Times (by Flow Name)</h2>
        {avgResponseTimesLoading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : avgResponseTimesError ? (
          <p className="text-red-500 text-center py-10">Error loading average response times: {avgResponseTimesError}</p>
        ) : avgResponseTimesData.length > 0 ? (
          <ChartContainer config={avgResponseTimesChartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={avgResponseTimesData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="groupKey" tickLine={false} axisLine={false} />
                <YAxis strokeDasharray="3 3" tickLine={false} axisLine={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="averageDurationMs" fill="var(--color-averageDurationMs)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        {!avgResponseTimesLoading && !avgResponseTimesError && avgResponseTimesData.length === 0 && (
          <EmptyStateDisplay
            icon={LineChart}
            title="Nenhum Tempo de Resposta"
            message="Nenhum dado de tempo médio de resposta disponível para os filtros selecionados."
            suggestion="Tente ajustar os filtros ou aguarde novos dados."
          />
        )}
      </div>

      {/* Trace Details Section */}
      {currentTraceId && (
        <div className="bg-card p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Trace Details for ID: {currentTraceId}</h2>
            <Button variant="outline" size="sm" onClick={() => { setCurrentTraceId(''); setTraceData([]); setTraceError(null); }}>Clear Trace</Button>
          </div>
          {traceLoading ? (
            <div className="overflow-x-auto">
              <table className="min-w-full"> {/* Use table-fixed if desired, but might not be necessary for skeletons */}
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="w-[200px] px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</th>
                    <th scope="col" className="w-[100px] px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th scope="col" className="w-[250px] px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Flow / Agent</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <tr key={`skel-trace-${index}`}>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-3/4" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-5/6" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : traceError ? (
            <p className="text-red-500 text-center py-10">Error loading trace: {traceError}</p>
          ) : traceData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border table-fixed">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="w-[200px] px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</th>
                    <th scope="col" className="w-[100px] px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                    <th scope="col" className="w-[250px] px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Flow / Agent</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {traceData.map((log, index) => (
                    <tr key={log.id || index} className={log.type === 'error' ? 'bg-red-50 dark:bg-red-900/30' : ''}>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.timestamp), "PP p")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.type === 'error' ? 'bg-red-200 text-red-900 dark:bg-red-700 dark:text-red-100' :
                          log.type === 'start' ? 'bg-green-200 text-green-900 dark:bg-green-700 dark:text-green-100' :
                          log.type === 'end' ? 'bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-blue-100' :
                          log.type === 'tool_call' ? 'bg-yellow-200 text-yellow-900 dark:bg-yellow-700 dark:text-yellow-100' :
                          'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {log.flowName && <div className="font-medium text-foreground">{log.flowName}</div>}
                        {log.agentId && <div className="text-xs">Agent: {log.agentId}</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground break-words">
                        {log.type === 'start' && log.data?.input != null && <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">Input: {JSON.stringify(log.data.input, null, 2)}</pre>}
                        {log.type === 'end' && log.data?.output != null && <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">Output: {JSON.stringify(log.data.output, null, 2)}</pre>}
                        {log.type === 'tool_call' && (
                          <>
                            <div className="font-medium">Tool: {log.data?.toolName || 'N/A'}</div>
                            {log.data?.input != null && <pre className="text-xs bg-muted p-2 rounded mt-1 whitespace-pre-wrap">Input: {JSON.stringify(log.data.input, null, 2)}</pre>}
                            {log.data?.output != null && <pre className="text-xs bg-muted p-2 rounded mt-1 whitespace-pre-wrap">Output: {JSON.stringify(log.data.output, null, 2)}</pre>}
                          </>
                        )}
                        {log.type === 'error' && (
                           <>
                            <div className="text-red-600 dark:text-red-400 font-medium">{log.data?.error?.message || JSON.stringify(log.data?.error) || log.message || 'Unknown error'}</div>
                            {log.data?.details != null && <pre className="text-xs bg-muted p-2 rounded mt-1 whitespace-pre-wrap">Details: {JSON.stringify(log.data.details, null, 2)}</pre>}
                           </>
                        )}
                        {log.type === 'info' && (
                          <>
                           <div>{log.message || log.data?.message}</div>
                           {log.data && Object.keys(log.data).filter(k => k !== 'message').length > 0 && (
                            <pre className="text-xs bg-muted p-2 rounded mt-1 whitespace-pre-wrap">Data: {JSON.stringify(Object.fromEntries(Object.entries(log.data).filter(([key]) => key !== 'message')), null, 2)}</pre>
                           )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!traceLoading && !traceError && currentTraceId && traceData.length === 0 && (
            <EmptyStateDisplay
              icon={FileQuestion}
              title="Nenhum Detalhe de Trace"
              message={`Nenhum log encontrado para o Trace ID: ${currentTraceId}.`}
              suggestion="Verifique o ID do trace ou tente um diferente."
            />
          )}
        </div>
      )}

      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Log Viewer</h2>
        <EmptyStateDisplay
          icon={ScrollText}
          title="Visualizador de Logs"
          message="Os logs brutos com filtros e paginação serão exibidos aqui assim que a funcionalidade for implementada."
        />
      </div>

      <div className="bg-card p-6 rounded-lg shadow mb-8"> {/* Added mb-8 for spacing */}
        <h2 className="text-xl font-semibold mb-4">Log Viewer (Alternativo)</h2> {/* Renamed title for clarity if they are different sections */}
         <EmptyStateDisplay
          icon={Inbox} // Using a different icon for variety if this is a distinct section
          title="Visualizador de Logs Detalhado"
          message="Uma visualização mais detalhada dos logs, possivelmente com análise avançada, aparecerá aqui."
          suggestion="Funcionalidade a ser implementada com base na API de logs."
        />
      </div>

      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Detailed Statistics (API Driven)</h2>
        <EmptyStateDisplay
          icon={Table2}
          title="Estatísticas Detalhadas"
          message="Métricas específicas baseadas em dados de log reais serão exibidas aqui quando a integração API estiver completa."
          suggestion="Aguarde a implementação completa da API para visualização de dados."
        />
      </div>
    </div>
  );
}
