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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Import Accordion components
import {
  Activity, BarChartBig, FileQuestion, Inbox, LineChart, ListX, PieChart, ScrollText, SearchX, ShieldAlert, Table2, WifiOff, ChevronDown, ChevronRight, Settings2, MessageSquare, Send, AlertTriangle, Loader2, Brain, Waypoints, AlertCircle as AlertCircleIcon, Info as InfoIconLucide, CheckCircle2, Users as UsersIcon, Package, Workflow, ListChecks, Clock, AlertTriangle as AlertTriangleIcon, RefreshCw, DollarSign // Added new icons
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Import Card components
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"; // Import Alert components
import { type MonitorEvent, ToolCallEvent, ErrorEvent, InfoEvent, TaskCompletionEvent, AgentStateEvent, PerformanceMetricsEvent, A2AMessageEvent } from '@/types/monitor-events'; // Added A2AMessageEvent
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EvaluationReport } from '@/types/evaluation-report'; // Added for Task 9.1
import {
  type AgentStatus,
  type ExecutionHistory,
  type AverageResponseTime,
  type ToolUsage as ToolUsageMetric, // Renamed to avoid conflict
  generateAgentStatusData,
  // generateExecutionHistoryData, // Already imported
  // generateAverageResponseTimeData, // Already imported
  // generateToolUsageData, // Already imported
} from "@/services/mockAgentData"; // Assuming mockAgentData is the correct path

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"; // Import Table components
  generateExecutionHistoryData,
  generateAverageResponseTimeData,
  generateToolUsageData,


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

  // State for Error Frequency by Agent Chart
  const [errorFrequencyByAgentData, setErrorFrequencyByAgentData] = useState<{ agentId: string; errorCount: number }[]>([]);
  const [errorFrequencyByAgentLoading, setErrorFrequencyByAgentLoading] = useState<boolean>(false);
  const [errorFrequencyByAgentError, setErrorFrequencyByAgentError] = useState<string | null>(null);

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
  const [feedFilterToolName, setFeedFilterToolName] = useState<string>(''); // New filter state for tool name
  const [feedFilterEventType, setFeedFilterEventType] = useState<string>('all');
  const [feedFilterStatus, setFeedFilterStatus] = useState<string>('all');
  // const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null); // No longer needed, replaced by Accordion

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

  // State for A2A Messages
  const [a2aMessages, setA2aMessages] = useState<A2AMessageEvent[]>([]);
  const [a2aMessagesLoading, setA2aMessagesLoading] = useState<boolean>(false); // For future API calls
  const [a2aMessagesError, setA2aMessagesError] = useState<string | null>(null);

// States for Task 9.1: Agent Evaluation
const [selectedAgentForEvaluation, setSelectedAgentForEvaluation] = useState<DisplayAgent | null>(null);
const [isEvaluatingAgent, setIsEvaluatingAgent] = useState<boolean>(false);
const [evaluationReport, setEvaluationReport] = useState<EvaluationReport | null>(null);
const [evaluationError, setEvaluationError] = useState<string | null>(null);

// State for Task 9.5: Simulated Tool Performance
interface SimulatedToolPerformance {
  toolName: string;
  successRate: number;
  averageLatencyMs: number;
  errorCount: number;
  totalRuns: number;
}
const [simulatedToolPerformance, setSimulatedToolPerformance] = useState<SimulatedToolPerformance[]>([]);

// State for Agent Activity Heatmap
interface HeatmapDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 'Sun', 'Mon', ...
  activity: number; // 0-10, for example
}
const [agentActivityHeatmapData, setAgentActivityHeatmapData] = useState<HeatmapDay[]>([]);

// State for Key Metrics
const [totalExecutions, setTotalExecutions] = useState<number | null>(null);
const [successRate, setSuccessRate] = useState<number | null>(null);
const [estimatedCostToday, setEstimatedCostToday] = useState<number | null>(null);
const [keyMetricsLoading, setKeyMetricsLoading] = useState<boolean>(true);

  // States for Task 8.1: Relatórios de Uso de Agentes (Simulados)
  const [yearlyAgentUsageData, setYearlyAgentUsageData] = useState<Array<{ year: number; agentId: string; agentName?: string; usageCount: number; estimatedCost: number; successRate: number; }>>([]);
  const [monthlyAgentUsageData, setMonthlyAgentUsageData] = useState<Array<{ year: number; month: number; /* 1-12 */ agentId: string; agentName?: string; usageCount: number; estimatedCost: number; successRate: number; }>>([]);
  const [selectedReportYear, setSelectedReportYear] = useState<number>(new Date().getFullYear());
  const [selectedReportMonth, setSelectedReportMonth] = useState<number | 'all'>(new Date().getMonth() + 1); // Default to current month (1-12) or 'all'

// Agent Type Definitions
const AGENT_TYPES = ["All Types", "LLM", "Workflow", "Customizado"] as const;
type AgentType = typeof AGENT_TYPES[number];

const getAgentType = (agentId: string): Exclude<AgentType, "All Types"> => {
  if (agentId.toLowerCase().includes('llm')) return "LLM";
  if (agentId.toLowerCase().includes('workflow') || agentId.toLowerCase().includes('wf')) return "Workflow";
  return "Customizado";
};

// State for Agent Type Filter
const [feedFilterAgentType, setFeedFilterAgentType] = useState<AgentType>("All Types");

// State for Anomaly Alerts
const [anomalyAlerts, setAnomalyAlerts] = useState<string[]>([]);

  // Chart Configs for Task 8.1
  const yearlyUsageChartConfig = {
    usageCount: { label: "Utilizações", color: "hsl(var(--chart-1))" },
    estimatedCost: { label: "Custo Est. ($)", color: "hsl(var(--chart-2))" },
    successRate: { label: "Taxa Sucesso (%)", color: "hsl(var(--chart-3))" },
    agentName: { label: "Agente" },
  } satisfies ChartConfig;

  const monthlyUsageChartConfig = {
    usageCount: { label: "Utilizações", color: "hsl(var(--chart-1))" },
    estimatedCost: { label: "Custo Est. ($)", color: "hsl(var(--chart-2))" },
    successRate: { label: "Taxa Sucesso (%)", color: "hsl(var(--chart-3))" },
    agentName: { label: "Agente" },
  } satisfies ChartConfig;

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

  const errorFrequencyByAgentChartConfig = {
    errorCount: { label: "Error Count", color: "hsl(var(--chart-error))" }, // Assuming --chart-error is defined or use another color
    agentId: { label: "Agent ID" },
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
    setFeedFilterToolName(''); // Clear tool name filter
    setFeedFilterAgentType("All Types"); // Clear agent type filter

    // Clear Task 8.1 states
    setYearlyAgentUsageData([]);
    setMonthlyAgentUsageData([]);
    // Reset year/month selectors to current? Or leave as is? For now, leave.
    // setSelectedReportYear(new Date().getFullYear());
    // setSelectedReportMonth(new Date().getMonth() + 1);
  };

  // useEffect for mock data generation on component mount

  const loadMockA2AMessages = () => {
    setA2aMessagesLoading(true);
    try {
      const mockMessages: A2AMessageEvent[] = [
        {
          id: 'a2a-msg-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          agentId: 'agent-001', // This is the sender in this context
          eventType: 'a2a_message',
          fromAgentId: 'agent-001',
          toAgentId: 'agent-002',
          messageContent: 'Hello agent-002, this is a test message.',
          status: 'simulated_success',
          channelId: 'channel-alpha',
        },
        {
          id: 'a2a-msg-2',
          timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 minutes ago
          agentId: 'agent-002', // This is the receiver, but event is logged by sender or system
          eventType: 'a2a_message',
          fromAgentId: 'agent-002',
          toAgentId: 'agent-003',
          messageContent: { data: 'Some complex object data', value: 123 },
          status: 'simulated_failed',
          channelId: 'channel-beta',
          errorDetails: { message: 'Simulated target agent offline' }
        },
        {
          id: 'a2a-msg-3',
          timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(), // 1 minute ago
          agentId: 'agent-system', // Logged by a system observer perhaps
          eventType: 'a2a_message',
          fromAgentId: 'agent-004',
          toAgentId: 'corp-workflow-agent',
          messageContent: 'Initiate workflow XYZ with params A, B, C.',
          status: 'sent', // Actual status if it were a real system
          channelId: 'workflow-intake-channel',
        },
      ];
      setA2aMessages(mockMessages);
    } catch (err) {
      setA2aMessagesError('Failed to load mock A2A messages.');
      console.error("Error in A2A mock data generation:", err);
    } finally {
      setA2aMessagesLoading(false);
    }
  };

  const loadMockAgentStatusAndAvgResponseData = () => {
    setAgentStatusLoading(true);
    setAverageResponseTimeLoading(true);
    try {
      const mockAgentIds = Array.from({ length: 5 }, (_, i) => `agent-${i}`);
      const initialAgentStatusData = generateAgentStatusData(mockAgentIds.length);
      setAgentStatusData(initialAgentStatusData);

      const initialDisplayAgents: Record<string, DisplayAgent> = {};
      initialAgentStatusData.forEach(agent => {
        initialDisplayAgents[agent.id] = {
          id: agent.id,
          name: agent.id,
          currentStatus: agent.isActive ? 'online' : 'offline',
          lastSeen: new Date().toISOString(),
        };
      });

      // Use a2aMessages state directly here as it would have been loaded
      const sseAgentIds = ['agent-001', 'agent-002', 'agent-003', 'agent-004', 'corp-workflow-agent'];
       a2aMessages.forEach(msg => { // ensure a2aMessages is populated before this runs if it's a dependency
        if (!sseAgentIds.includes(msg.fromAgentId)) sseAgentIds.push(msg.fromAgentId);
        if (!sseAgentIds.includes(msg.toAgentId)) sseAgentIds.push(msg.toAgentId);
      });

      sseAgentIds.forEach(id => {
        if (!initialDisplayAgents[id]) {
          initialDisplayAgents[id] = { id, name: id, currentStatus: 'unknown', lastSeen: new Date().toISOString() };
        }
      });
      setDisplayAgents(initialDisplayAgents);
      setAverageResponseTimeData(generateAverageResponseTimeData(mockAgentIds));
    } catch (err) {
      setAgentStatusError('Failed to load agent status data.');
      setAverageResponseTimeError('Failed to load average response time data.');
      console.error("Error in agent status/avg response time data generation:", err);
    } finally {
      setAgentStatusLoading(false);
      setAverageResponseTimeLoading(false);
    }
  };

  const loadMockExecutionHistoryData = () => {
    setExecutionHistoryLoading(true);
    try {
      setExecutionHistoryData(generateExecutionHistoryData(50));
    } catch (err) {
      setExecutionHistoryError('Failed to load execution history data.');
      console.error("Error in execution history data generation:", err);
    } finally {
      setExecutionHistoryLoading(false);
    }
  };

  const loadMockToolUsageMetricsData = () => {
    setToolUsageMetricsLoading(true);
    try {
      const tools = ['ToolReader', 'ToolWriter', 'ToolAPI', 'ToolDB', 'ToolAnalysis'];
      setToolUsageMetricsData(generateToolUsageData(tools, 100));
    } catch (err) {
      setToolUsageMetricsError('Failed to load tool usage metrics data.');
      console.error("Error in tool usage metrics data generation:", err);
    } finally {
      setToolUsageMetricsLoading(false);
    }
  };

  const loadMockSimulatedToolPerformanceData = () => {
    const mockToolPerformanceData: SimulatedToolPerformance[] = [
      { toolName: "Web Search", successRate: 0.90, averageLatencyMs: 520, errorCount: 5, totalRuns: 50 },
      { toolName: "Calculator", successRate: 0.99, averageLatencyMs: 45, errorCount: 1, totalRuns: 100 },
      { toolName: "DatabaseAccess", successRate: 0.85, averageLatencyMs: 150, errorCount: 15, totalRuns: 100 },
      { toolName: "KnowledgeBase", successRate: 0.92, averageLatencyMs: 210, errorCount: 8, totalRuns: 100 },
      { toolName: "CustomAPIIntegration", successRate: 0.75, averageLatencyMs: 800, errorCount: 25, totalRuns: 100 },
    ];
    setSimulatedToolPerformance(mockToolPerformanceData);
  };

  const generateMockHeatmapData = (days: number): HeatmapDay[] => {
    const data: HeatmapDay[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: format(date, "yyyy-MM-dd"),
        dayOfWeek: dayNames[date.getDay()],
        activity: Math.floor(Math.random() * 11), // Random activity between 0 and 10
      });
    }
    return data;
  };

  const loadMockHeatmapData = () => {
    setAgentActivityHeatmapData(generateMockHeatmapData(7));
  };

  const loadMockKeyMetrics = () => {
    setKeyMetricsLoading(true);
    // Simulate a slight delay for loading effect
    setTimeout(() => {
      setTotalExecutions(Math.floor(Math.random() * 1000) + 500); // Random number between 500 and 1500
      setSuccessRate(Math.random() * (0.99 - 0.70) + 0.70); // Random rate between 70% and 99%
      setEstimatedCostToday(Math.random() * 50 + 10); // Random cost between $10 and $60
      setKeyMetricsLoading(false);
    }, 300); // Simulate small fetch time
  };

  // Mock Data Generation Functions for Task 8.1
  const generateMockYearlyAgentUsage = (agents: DisplayAgent[], years: number[]): Array<{ year: number; agentId: string; agentName?: string; usageCount: number; estimatedCost: number; successRate: number; }> => {
    const data: Array<{ year: number; agentId: string; agentName?: string; usageCount: number; estimatedCost: number; successRate: number; }> = [];
    agents.forEach(agent => {
      years.forEach(year => {
        const usageCount = Math.floor(Math.random() * 4001) + 1000; // 1000-5000
        const estimatedCost = usageCount * (Math.random() * 0.04 + 0.01); // usageCount * (0.01 - 0.05)
        const successRate = Math.random() * 0.29 + 0.7; // 0.70 - 0.99
        data.push({
          year,
          agentId: agent.id,
          agentName: agent.name || agent.id,
          usageCount,
          estimatedCost,
          successRate,
        });
      });
    });
    return data;
  };

  const generateMockMonthlyAgentUsage = (agents: DisplayAgent[], year: number): Array<{ year: number; month: number; agentId: string; agentName?: string; usageCount: number; estimatedCost: number; successRate: number; }> => {
    const data: Array<{ year: number; month: number; agentId: string; agentName?: string; usageCount: number; estimatedCost: number; successRate: number; }> = [];
    agents.forEach(agent => {
      for (let month = 1; month <= 12; month++) {
        const usageCount = Math.floor(Math.random() * 451) + 50; // 50-500
        const estimatedCost = usageCount * (Math.random() * 0.04 + 0.01); // usageCount * (0.01 - 0.05)
        const successRate = Math.random() * 0.29 + 0.7; // 0.70 - 0.99
        data.push({
          year,
          month,
          agentId: agent.id,
          agentName: agent.name || agent.id,
          usageCount,
          estimatedCost,
          successRate,
        });
      }
    });
    return data;
  };

  const loadAgentUsageReportsData = () => {
    const currentYear = new Date().getFullYear();
    const yearsToGenerate = [currentYear, currentYear - 1, currentYear - 2];
    const agentList = Object.values(displayAgents);

    if (agentList.length === 0) {
        // Handle case with no agents, maybe set empty data or log a message
        setYearlyAgentUsageData([]);
        setMonthlyAgentUsageData([]);
        return;
    }

    const yearlyData = generateMockYearlyAgentUsage(agentList, yearsToGenerate);
    setYearlyAgentUsageData(yearlyData);

    // Generate monthly data only for the initially selected year
    const monthlyData = generateMockMonthlyAgentUsage(agentList, selectedReportYear);
    setMonthlyAgentUsageData(monthlyData);
  };


  useEffect(() => {
    loadMockA2AMessages();
    loadMockAgentStatusAndAvgResponseData(); // Depends on a2aMessages being available if used for agent IDs
    loadMockExecutionHistoryData();
    loadMockToolUsageMetricsData();
    loadMockSimulatedToolPerformanceData();
    loadMockHeatmapData();
    loadMockKeyMetrics();
    // Load data for Task 8.1 - must be called after displayAgents is potentially populated
  }, []); // Empty dependency array ensures this runs only once on mount

  useEffect(() => {
    // This effect will run when displayAgents changes, specifically its length.
    // This ensures that mock data using agent names is generated after agents are available.
    if (Object.keys(displayAgents).length > 0) {
      loadAgentUsageReportsData();
    }
    // Ensure monthly data is also reloaded if the selected year changes
    // This dependency array ensures that if selectedReportYear changes externally (though not typical for this setup yet)
    // or if displayAgents changes, monthly data is re-evaluated.
  }, [displayAgents, selectedReportYear]);


  // Memoized selectors for Task 8.1 chart data
  const filteredYearlyReportData = useMemo(() => {
    return yearlyAgentUsageData.filter(d => d.year === selectedReportYear);
  }, [yearlyAgentUsageData, selectedReportYear]);

  const filteredMonthlyReportData = useMemo(() => {
    if (selectedReportMonth === 'all') {
      // Aggregate monthly data for the selected year
      const aggregatedData: Record<string, { agentId: string; agentName?: string; usageCount: number; estimatedCost: number; successRateSum: number; successRateCount: number; year: number; }> = {};
      monthlyAgentUsageData
        .filter(d => d.year === selectedReportYear)
        .forEach(item => {
          if (!aggregatedData[item.agentId]) {
            aggregatedData[item.agentId] = {
              agentId: item.agentId,
              agentName: item.agentName || item.agentId,
              usageCount: 0,
              estimatedCost: 0,
              successRateSum: 0,
              successRateCount: 0,
              year: item.year,
            };
          }
          aggregatedData[item.agentId].usageCount += item.usageCount;
          aggregatedData[item.agentId].estimatedCost += item.estimatedCost;
          aggregatedData[item.agentId].successRateSum += item.successRate;
          aggregatedData[item.agentId].successRateCount += 1;
        });
      return Object.values(aggregatedData).map(agg => ({
        ...agg,
        successRate: agg.successRateCount > 0 ? agg.successRateSum / agg.successRateCount : 0,
      }));
    } else {
      // Filter for specific month and year
      return monthlyAgentUsageData.filter(d => d.year === selectedReportYear && d.month === selectedReportMonth);
    }
  }, [monthlyAgentUsageData, selectedReportYear, selectedReportMonth]);

  const handleReloadAllData = async () => {
    console.log("Reloading all data...");
    // Call API fetch functions
    fetchAgentUsage(filters);
    fetchFlowUsage(filters);
    fetchToolUsage(filters);
    fetchErrorRates(filters);
    fetchAverageResponseTimes(filters);

    // Call mock data reload functions
    loadMockA2AMessages();
    loadMockAgentStatusAndAvgResponseData();
    loadMockExecutionHistoryData();
    loadMockToolUsageMetricsData();
    loadMockSimulatedToolPerformanceData();
    loadMockHeatmapData();
    loadMockKeyMetrics();
    loadAgentUsageReportsData(); // Reload Task 8.1 data
    // Note: liveEvents and errorFrequencyByAgentData (derived from liveEvents) are not reloaded here
    // as SSE handles live updates.
  };

  // useEffect to calculate error frequency by agent whenever liveEvents changes
  useEffect(() => {
    setErrorFrequencyByAgentLoading(true);
    try {
      const errorsByAgent: Record<string, number> = {};
      liveEvents.forEach(event => {
        // Apply agent type filter HERE before counting
        if (feedFilterAgentType !== "All Types" && event.agentId) {
          if (getAgentType(event.agentId) !== feedFilterAgentType) {
            return; // Skip this event
          }
        }
        if (event.eventType === 'error' || (event.eventType === 'tool_call' && (event as ToolCallEvent).status === 'error')) {
          const agentId = event.agentId; // Assuming agentId is always present
          errorsByAgent[agentId] = (errorsByAgent[agentId] || 0) + 1;
        }
      });
      const calculatedData = Object.entries(errorsByAgent).map(([agentId, errorCount]) => ({ agentId, errorCount }));
      setErrorFrequencyByAgentData(calculatedData);
      setErrorFrequencyByAgentError(null);
    } catch (error) {
      console.error("Error calculating error frequency by agent:", error);
      setErrorFrequencyByAgentError("Failed to calculate error frequency data.");
      setErrorFrequencyByAgentData([]);
    } finally {
      setErrorFrequencyByAgentLoading(false);
    }
  }, [liveEvents, feedFilterAgentType]); // Added feedFilterAgentType dependency

  // useEffect for Anomaly Detection
  useEffect(() => {
    const newAlerts: string[] = [];
    const HIGH_ERROR_THRESHOLD_COUNT = 3;
    const HIGH_LATENCY_THRESHOLD_MS = 2000;

    errorFrequencyByAgentData.forEach(agentError => {
      if (agentError.errorCount > HIGH_ERROR_THRESHOLD_COUNT) {
        newAlerts.push(
          `Agente '${agentError.agentId}' registrou ${agentError.errorCount} erros. Limite: ${HIGH_ERROR_THRESHOLD_COUNT}.`
        );
      }
    });

    latencyMetrics.forEach(metric => {
      if (metric.value > HIGH_LATENCY_THRESHOLD_MS) {
        newAlerts.push(
          `Agente '${metric.name}' apresenta alta latência (${metric.value.toFixed(0)}ms). Limite: ${HIGH_LATENCY_THRESHOLD_MS}ms.`
        );
      }
    });

    // To prevent spamming alerts or keeping old alerts indefinitely, one might add logic here
    // to only add new, unique alerts, or to clear alerts after a while.
    // For this task, we'll just set the new alerts found in this check.
    setAnomalyAlerts(newAlerts);
  }, [errorFrequencyByAgentData, latencyMetrics]);

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

        if (newEvent.eventType === 'a2a_message') {
          setA2aMessages(prev => [newEvent as A2AMessageEvent, ...prev.slice(0, MAX_LIVE_EVENTS -1)]);
          // Also add to live events if desired, or handle separately
           setLiveEvents((prevEvents) => {
            const updatedEvents = [newEvent, ...prevEvents];
            return updatedEvents.length > MAX_LIVE_EVENTS ? updatedEvents.slice(0, MAX_LIVE_EVENTS) : updatedEvents;
          });
        } else {
          setLiveEvents((prevEvents) => {
            const updatedEvents = [newEvent, ...prevEvents];
            return updatedEvents.length > MAX_LIVE_EVENTS ? updatedEvents.slice(0, MAX_LIVE_EVENTS) : updatedEvents;
          });
        }

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
        } else if (newEvent.eventType !== 'a2a_message') { // Don't let a2a messages make agent 'busy' by default
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

          if (perfEvent.metricName === 'latency') {
            const metricItem: ChartableMetric = {
              id: perfEvent.agentId, // Group by agentId
              name: perfEvent.agentId, // Display agentId on chart
              value: perfEvent.value, // Latency value
              timestamp: perfEvent.timestamp,
              unit: perfEvent.unit,
            };
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
            // Aggregate token usage per agent
            setTokenUsageMetrics(prevMetrics => {
              const agentId = perfEvent.agentId;
              // Find existing metric for this agent
              const existingMetricIndex = prevMetrics.findIndex(m => m.id === agentId);
              let newMetricsArray;

              if (existingMetricIndex > -1) {
                  // Update existing agent's token count by adding the new value
                  newMetricsArray = prevMetrics.map((m, index) =>
                      index === existingMetricIndex ? { ...m, value: m.value + perfEvent.value, timestamp: perfEvent.timestamp } : m
                  );
              } else {
                  // Add new agent's token count
                  const newMetric: ChartableMetric = {
                      id: agentId,
                      name: agentId, // Display agentId on chart
                      value: perfEvent.value, // Initial token value
                      timestamp: perfEvent.timestamp,
                      unit: perfEvent.unit || 'tokens',
                  };
                  newMetricsArray = [...prevMetrics, newMetric];
              }
              return newMetricsArray.sort((a,b) => a.name.localeCompare(b.name));
            });
          } else if (perfEvent.metricName === 'cost') {
            const metricItem: ChartableMetric = { // Define metricItem here for cost as well
              id: perfEvent.agentId,
              name: perfEvent.agentId,
              value: perfEvent.value, // Default to perfEvent.value
              timestamp: perfEvent.timestamp,
              unit: perfEvent.unit,
            };
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
            case 'a2a_message': // Make A2A messages searchable
              const a2aEvent = event as A2AMessageEvent;
              searchableContent += ` ${a2aEvent.fromAgentId} ${a2aEvent.toAgentId} ${a2aEvent.status}`;
              if (a2aEvent.channelId) searchableContent += ` ${a2aEvent.channelId}`;
              if (typeof a2aEvent.messageContent === 'string') {
                searchableContent += ` ${a2aEvent.messageContent.toLowerCase()}`;
              } else {
                searchableContent += ` ${JSON.stringify(a2aEvent.messageContent).toLowerCase()}`;
              }
              if (a2aEvent.errorDetails) searchableContent += ` ${a2aEvent.errorDetails.message.toLowerCase()}`;
              break;
        }
        if (!searchableContent.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Tool Name Filter (new)
      if (feedFilterToolName && event.eventType === 'tool_call') {
        if ((event as ToolCallEvent).toolName !== feedFilterToolName) {
          return false;
        }
      }

      // Agent Type Filter for Live Feed
      if (feedFilterAgentType !== "All Types" && event.agentId) {
        if (getAgentType(event.agentId) !== feedFilterAgentType) {
          return false;
        }
      }
      return true;
    });
  }, [liveEvents, feedSearchQuery, feedFilterAgentId, feedFilterEventType, feedFilterStatus, feedFilterToolName, feedFilterAgentType]); // Added feedFilterAgentType dependency

  const feedEventTypeOptions = [
    { value: 'all', label: 'All Event Types' },
    { value: 'tool_call', label: 'Tool Call' },
    { value: 'task_completion', label: 'Task Completion' },
    { value: 'error', label: 'Error' },
    { value: 'info', label: 'Info' },
    { value: 'agent_state', label: 'Agent State' },
    { value: 'performance_metrics', label: 'Performance Metrics' },
    { value: 'a2a_message', label: 'A2A Message' }, // Added A2A to filter options
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

  const getEventIcon = (eventType: MonitorEvent['eventType'], event?: MonitorEvent) => {
    switch (eventType) {
      case 'tool_call':
        return <Waypoints size={16} className="mr-2 text-blue-500" />;
      case 'task_completion':
        return <CheckCircle2 size={16} className="mr-2 text-green-500" />;
      case 'error':
        return <AlertCircleIcon size={16} className="mr-2 text-red-500" />;
      case 'info':
        // Could differentiate further based on info message content if needed
        if ((event as InfoEvent)?.data?.type === 'llm_request' || (event as InfoEvent)?.message.toLowerCase().includes('llm')) {
           return <Brain size={16} className="mr-2 text-purple-500" />;
        }
        return <InfoIconLucide size={16} className="mr-2 text-gray-500" />;
      case 'agent_state':
         // Could check for specific states if needed for different icons
        return <Activity size={16} className="mr-2 text-teal-500" />;
      case 'performance_metrics':
        return <BarChartBig size={16} className="mr-2 text-indigo-500" />;
      case 'a2a_message':
        return <MessageSquare size={16} className="mr-2 text-orange-500" />;
      default:
        return <Package size={16} className="mr-2 text-gray-400" />; // Default icon
    }
  };

  const renderEventDetails = (event: MonitorEvent, isTrajectoryView: boolean = false) => {
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
      case 'a2a_message':
        const a2aEvent = event as A2AMessageEvent;
        details = `A2A: ${a2aEvent.fromAgentId} -> ${a2aEvent.toAgentId}`;
        content = `Msg: ${typeof a2aEvent.messageContent === 'string' ? a2aEvent.messageContent : JSON.stringify(a2aEvent.messageContent)} (Status: ${a2aEvent.status})`;
        if (a2aEvent.channelId) content += ` (Channel: ${a2aEvent.channelId})`;

        switch(a2aEvent.status) {
          case 'sent': styleClass += ' text-sky-500 dark:text-sky-400'; break;
          case 'received': styleClass += ' text-blue-500 dark:text-blue-400'; break;
          case 'simulated_success': styleClass += ' text-green-500 dark:text-green-400'; break;
          case 'simulated_failed':
          case 'error':
            styleClass += ' text-red-500 dark:text-red-400 font-medium';
            if (a2aEvent.errorDetails) content += ` - Error: ${a2aEvent.errorDetails.message}`;
            break;
          default: styleClass += ' text-gray-500 dark:text-gray-300';
        }
        break;
      default:
    // In trajectory view, we might want to be more verbose for unknown types
    // For the main feed, it's already handled.
    // This function is also used by the main feed, so keep existing behavior for that.
    // If isTrajectoryView is true, we could add more, but for now, it's consistent.
    const unknownEvent = event as any;
    content = `Evento desconhecido: ${unknownEvent.eventType} - Dados: ${JSON.stringify(unknownEvent)}`;
    styleClass += ' text-gray-400 dark:text-gray-500';
    }
    return <span className={styleClass}><strong className="font-medium">{details}</strong> - {content}</span>;
  };

  const renderFullEventDetails = (event: MonitorEvent): React.ReactNode => {
    const commonDetails = (
      <>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-2">
          <p><strong className="font-semibold text-muted-foreground">ID:</strong> {event.id}</p>
          <p><strong className="font-semibold text-muted-foreground">Timestamp:</strong> {format(new Date(event.timestamp), "PPP HH:mm:ss.SSS")}</p>
          <p><strong className="font-semibold text-muted-foreground">Agent ID:</strong> {event.agentId}</p>
          <p><strong className="font-semibold text-muted-foreground">Event Type:</strong> <span className="font-mono bg-muted/50 px-1 py-0.5 rounded text-primary">{event.eventType}</span></p>
          {event.traceId && <p><strong className="font-semibold text-muted-foreground">Trace ID:</strong> {event.traceId}</p>}
        </div>
        <hr className="my-2 border-border/50" />
      </>
    );

    let specificDetails: React.ReactNode = null;

    switch (event.eventType) {
      case 'tool_call':
        const tcEvent = event as ToolCallEvent;
        specificDetails = (
          <div className="space-y-1.5 text-xs">
            <p><strong className="font-semibold text-muted-foreground">Tool Name:</strong> {tcEvent.toolName}</p>
            <p><strong className="font-semibold text-muted-foreground">Status:</strong> {tcEvent.status}</p>
            {tcEvent.input && (
              <div>
                <strong className="font-semibold text-muted-foreground">Input:</strong>
                <pre className="p-2 mt-0.5 bg-muted/30 dark:bg-muted/10 rounded-md overflow-x-auto text-[11px] whitespace-pre-wrap break-all">
                  {JSON.stringify(tcEvent.input, null, 2)}
                </pre>
              </div>
            )}
            {tcEvent.output && (
              <div>
                <strong className="font-semibold text-muted-foreground">Output:</strong>
                <pre className="p-2 mt-0.5 bg-muted/30 dark:bg-muted/10 rounded-md overflow-x-auto text-[11px] whitespace-pre-wrap break-all">
                  {JSON.stringify(tcEvent.output, null, 2)}
                </pre>
              </div>
            )}
            {tcEvent.errorDetails && (
              <div>
                <strong className="font-semibold text-muted-foreground">Error Details:</strong>
                <pre className="p-2 mt-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md overflow-x-auto text-[11px] whitespace-pre-wrap break-all">
                  {JSON.stringify(tcEvent.errorDetails, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
        break;
      case 'error':
        const errEvent = event as ErrorEvent;
        specificDetails = (
          <div className="space-y-1.5 text-xs">
            <p><strong className="font-semibold text-muted-foreground">Error Message:</strong> <span className="text-red-600 dark:text-red-400">{errEvent.errorMessage}</span></p>
            <p><strong className="font-semibold text-muted-foreground">Error Source:</strong> {errEvent.errorSource || 'N/A'}</p>
            {errEvent.stackTrace && (
              <div>
                <strong className="font-semibold text-muted-foreground">Stack Trace:</strong>
                <pre className="p-2 mt-0.5 bg-muted/30 dark:bg-muted/10 rounded-md overflow-x-auto text-[11px] whitespace-pre-wrap break-all">
                  {errEvent.stackTrace}
                </pre>
              </div>
            )}
          </div>
        );
        break;
      case 'task_completion':
        const tcompEvent = event as TaskCompletionEvent;
        specificDetails = (
          <div className="space-y-1.5 text-xs">
            <p><strong className="font-semibold text-muted-foreground">Status:</strong> {tcompEvent.status}</p>
            <p><strong className="font-semibold text-muted-foreground">Message:</strong> {tcompEvent.message || 'N/A'}</p>
            {tcompEvent.result && (
              <div>
                <strong className="font-semibold text-muted-foreground">Result:</strong>
                <pre className="p-2 mt-0.5 bg-muted/30 dark:bg-muted/10 rounded-md overflow-x-auto text-[11px] whitespace-pre-wrap break-all">
                  {JSON.stringify(tcompEvent.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
        break;
      case 'info':
        const infoEvent = event as InfoEvent;
        specificDetails = (
          <div className="space-y-1.5 text-xs">
            <p><strong className="font-semibold text-muted-foreground">Message:</strong> {infoEvent.message}</p>
            {infoEvent.data && (
              <div>
                <strong className="font-semibold text-muted-foreground">Data:</strong>
                <pre className="p-2 mt-0.5 bg-muted/30 dark:bg-muted/10 rounded-md overflow-x-auto text-[11px] whitespace-pre-wrap break-all">
                  {JSON.stringify(infoEvent.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
        break;
      case 'agent_state':
        const asEvent = event as AgentStateEvent;
        specificDetails = (
          <div className="space-y-1.5 text-xs">
            <p><strong className="font-semibold text-muted-foreground">Status:</strong> {asEvent.status}</p>
            <p><strong className="font-semibold text-muted-foreground">Message:</strong> {asEvent.message || 'N/A'}</p>
          </div>
        );
        break;
      case 'performance_metrics':
        const pmEvent = event as PerformanceMetricsEvent;
        specificDetails = (
          <div className="space-y-1.5 text-xs">
            <p><strong className="font-semibold text-muted-foreground">Metric Name:</strong> {pmEvent.metricName}</p>
            <p><strong className="font-semibold text-muted-foreground">Value:</strong> {pmEvent.value}</p>
            <p><strong className="font-semibold text-muted-foreground">Unit:</strong> {pmEvent.unit || 'N/A'}</p>
            {pmEvent.details && (
              <div>
                <strong className="font-semibold text-muted-foreground">Details:</strong>
                <pre className="p-2 mt-0.5 bg-muted/30 dark:bg-muted/10 rounded-md overflow-x-auto text-[11px] whitespace-pre-wrap break-all">
                  {JSON.stringify(pmEvent.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
        break;
      case 'a2a_message':
        const a2aEvent = event as A2AMessageEvent;
        specificDetails = (
          <div className="space-y-1.5 text-xs">
            <p><strong className="font-semibold text-muted-foreground">From Agent ID:</strong> {a2aEvent.fromAgentId}</p>
            <p><strong className="font-semibold text-muted-foreground">To Agent ID:</strong> {a2aEvent.toAgentId}</p>
            <p><strong className="font-semibold text-muted-foreground">Status:</strong> {a2aEvent.status}</p>
            <p><strong className="font-semibold text-muted-foreground">Channel ID:</strong> {a2aEvent.channelId || 'N/A'}</p>
            <div>
              <strong className="font-semibold text-muted-foreground">Message Content:</strong>
              <pre className="p-2 mt-0.5 bg-muted/30 dark:bg-muted/10 rounded-md overflow-x-auto text-[11px] whitespace-pre-wrap break-all">
                {typeof a2aEvent.messageContent === 'string' ? a2aEvent.messageContent : JSON.stringify(a2aEvent.messageContent, null, 2)}
              </pre>
            </div>
            {a2aEvent.errorDetails && (
              <div>
                <strong className="font-semibold text-muted-foreground">Error Details:</strong>
                <pre className="p-2 mt-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md overflow-x-auto text-[11px] whitespace-pre-wrap break-all">
                  {JSON.stringify(a2aEvent.errorDetails, null, 2)}
                </pre>
              </div>
            )}
          </div>
        );
        break;
      default:
        specificDetails = <p className="text-xs text-muted-foreground">No specific details available for this event type.</p>;
    }

    return (
      <div className="p-2">
        {commonDetails}
        {specificDetails}
      </div>
    );
  };

  const getActivityColor = (activity: number): string => {
    if (activity === 0) return 'bg-gray-100 dark:bg-gray-700 hover:border-gray-400';
    if (activity <= 2) return 'bg-green-200 dark:bg-green-800 hover:border-green-500';
    if (activity <= 4) return 'bg-green-300 dark:bg-green-700 hover:border-green-600';
    if (activity <= 6) return 'bg-green-400 dark:bg-green-600 hover:border-green-700';
    if (activity <= 8) return 'bg-green-500 dark:bg-green-500 hover:border-green-700';
    return 'bg-green-600 dark:bg-green-400 hover:border-green-700'; // Max activity
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Visão Geral do Monitor de Agentes</h1>

      {/* START OF ANOMALY ALERTS DISPLAY SECTION */}
      {anomalyAlerts.length > 0 && (
        <div className="space-y-3 mb-8">
          {anomalyAlerts.map((alertMsg, index) => (
            <Alert key={index} variant="destructive" className="bg-yellow-50 border-yellow-400 text-yellow-700 dark:bg-yellow-900/40 dark:border-yellow-700/60 dark:text-yellow-300 shadow-md">
              <AlertTriangle className="h-5 w-5 !text-yellow-600 dark:!text-yellow-400" />
              <AlertTitle className="font-semibold text-yellow-800 dark:text-yellow-200">Alerta de Anomalia Detectada!</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300/90">
                {alertMsg}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      {/* END OF ANOMALY ALERTS DISPLAY SECTION */}

      {/* START OF KEY METRICS CARDS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Execuções</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {keyMetricsLoading ? (
              <Skeleton className="h-8 w-3/4 my-1" />
            ) : (
              <div className="text-2xl font-bold">{totalExecutions?.toLocaleString() || 'N/A'}</div>
            )}
            <p className="text-xs text-muted-foreground">Execuções totais nas últimas 24h (simulado)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> {/* Changed to CheckCircle2 for consistency */}
          </CardHeader>
          <CardContent>
            {keyMetricsLoading ? (
              <Skeleton className="h-8 w-1/2 my-1" />
            ) : (
              <div className="text-2xl font-bold">
                {successRate !== null ? `${(successRate * 100).toFixed(1)}%` : 'N/A'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Percentual de execuções bem-sucedidas (simulado)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Estimado (Hoje)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {keyMetricsLoading ? (
              <Skeleton className="h-8 w-1/2 my-1" />
            ) : (
              <div className="text-2xl font-bold">
                {estimatedCostToday !== null ? `$${estimatedCostToday.toFixed(2)}` : 'N/A'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Custo operacional estimado de hoje (simulado)</p>
          </CardContent>
        </Card>
      </div>
      {/* END OF KEY METRICS CARDS SECTION */}

      {/* START OF TASK 8.1 AGENT USAGE REPORTS SECTION */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Relatórios de Uso de Agentes (Simulados)</CardTitle>
          <CardDescription>Filtre e visualize dados de uso anual e mensal por agente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reportYearSelect">Selecionar Ano do Relatório</Label>
              <Select
                value={selectedReportYear.toString()}
                onValueChange={(value) => {
                  const year = parseInt(value, 10);
                  setSelectedReportYear(year);
                  // Regenerate monthly data for the new selected year
                  if (Object.keys(displayAgents).length > 0) {
                    setMonthlyAgentUsageData(generateMockMonthlyAgentUsage(Object.values(displayAgents), year));
                  }
                }}
              >
                <SelectTrigger id="reportYearSelect" className="h-9 text-sm mt-1">
                  <SelectValue placeholder="Selecione o Ano" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(yearlyAgentUsageData.map(d => d.year)))
                    .sort((a, b) => b - a)
                    .map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reportMonthSelect">Selecionar Mês do Relatório</Label>
              <Select
                value={selectedReportMonth.toString()}
                onValueChange={(value) => setSelectedReportMonth(value === 'all' ? 'all' : parseInt(value, 10))}
              >
                <SelectTrigger id="reportMonthSelect" className="h-9 text-sm mt-1">
                  <SelectValue placeholder="Selecione o Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Meses</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>
                      {new Date(0, month -1).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yearly Agent Usage Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Relatório Anual de Uso de Agentes (Simulado) - {selectedReportYear}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredYearlyReportData.length > 0 ? (
            <ChartContainer config={yearlyUsageChartConfig} className="min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredYearlyReportData} margin={{ top: 5, right: 20, left: 5, bottom: 50 /* Increased bottom margin for labels */ }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="agentName"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis strokeDasharray="3 3" tickLine={false} axisLine={false} fontSize={10} />
                  <ChartTooltip
                    cursor={true}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value, payload) => {
                          // Assuming payload[0].payload contains the full data item
                          return payload && payload.length && payload[0].payload.agentName ? `Agente: ${payload[0].payload.agentName}` : value;
                        }}
                        formatter={(value, name, props) => {
                          const dataItem = props.payload as any; // Cast to any to access original data
                          if (name === 'usageCount') return [`${(value as number).toLocaleString()}`, "Utilizações"];
                          if (name === 'estimatedCost') return [`$${(value as number).toFixed(2)}`, "Custo Est."];
                          if (name === 'successRate') return [`${((value as number) * 100).toFixed(1)}%`, "Taxa Sucesso"];
                          // Include all relevant data from the payload for the tooltip
                          const { agentName, usageCount, estimatedCost, successRate } = dataItem;
                          const tooltipData = [
                            `Utilizações: ${usageCount.toLocaleString()}`,
                            `Custo Est.: $${estimatedCost.toFixed(2)}`,
                            `Taxa Sucesso: ${(successRate * 100).toFixed(1)}%`
                          ];
                          // This part might need adjustment based on how ChartTooltipContent expects data
                          // For now, the formatter above handles individual lines. If a single block is needed, adjust here.
                          return [tooltipData.join('\n'), `Agente: ${agentName}`];
                        }}
                        itemStyle={{ fontSize: '12px' }}
                        formatter={(value, name, entry) => {
                            const payload = entry.payload as any;
                            if (name === 'usageCount') return [value, yearlyUsageChartConfig.usageCount.label];
                            if (name === 'estimatedCost') return [payload.estimatedCost.toFixed(2), yearlyUsageChartConfig.estimatedCost.label];
                            if (name === 'successRate') return [(payload.successRate * 100).toFixed(1) + '%', yearlyUsageChartConfig.successRate.label];
                            return [value, name];
                        }}
                        payloadFormatter={(payload) => { // Custom payload to show all metrics
                            if (payload && payload.length > 0 && payload[0].payload) {
                                const item = payload[0].payload;
                                return [
                                    { name: yearlyUsageChartConfig.usageCount.label, value: item.usageCount, color: yearlyUsageChartConfig.usageCount.color },
                                    { name: yearlyUsageChartConfig.estimatedCost.label, value: `$${item.estimatedCost.toFixed(2)}`, color: yearlyUsageChartConfig.estimatedCost.color },
                                    { name: yearlyUsageChartConfig.successRate.label, value: `${(item.successRate * 100).toFixed(1)}%`, color: yearlyUsageChartConfig.successRate.color },
                                ];
                            }
                            return payload;
                        }}
                      />
                    }
                  />
                  <Legend content={<ChartLegendContent />} />
                  <Bar dataKey="usageCount" fill="var(--color-usageCount)" radius={4} name={yearlyUsageChartConfig.usageCount.label} />
                  {/* Other bars can be added here if needed, or keep them in tooltip only */}
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyStateDisplay
              icon={BarChartBig}
              title="Nenhum Dado Anual de Uso"
              message={`Nenhum dado de uso de agente disponível para o ano ${selectedReportYear}.`}
            />
          )}
        </CardContent>
      </Card>

      {/* Monthly Agent Usage Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            Relatório Mensal de Uso de Agentes (Simulado) -
            {selectedReportMonth === 'all' ? 'Todos os Meses (Agregado)' : new Date(0, (selectedReportMonth as number) -1).toLocaleString('default', { month: 'long' })} {selectedReportYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMonthlyReportData.length > 0 ? (
            <ChartContainer config={monthlyUsageChartConfig} className="min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={filteredMonthlyReportData} margin={{ top: 5, right: 20, left: 5, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="agentName" tickLine={false} axisLine={false} fontSize={10} interval={0} angle={-45} textAnchor="end" />
                  <YAxis strokeDasharray="3 3" tickLine={false} axisLine={false} fontSize={10} />
                  <ChartTooltip
                    cursor={true}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value, payload) => payload && payload.length && payload[0].payload.agentName ? `Agente: ${payload[0].payload.agentName}` : value}
                        payloadFormatter={(payload) => { // Custom payload to show all metrics
                            if (payload && payload.length > 0 && payload[0].payload) {
                                const item = payload[0].payload;
                                return [
                                    { name: monthlyUsageChartConfig.usageCount.label, value: item.usageCount.toLocaleString(), color: monthlyUsageChartConfig.usageCount.color },
                                    { name: monthlyUsageChartConfig.estimatedCost.label, value: `$${item.estimatedCost.toFixed(2)}`, color: monthlyUsageChartConfig.estimatedCost.color },
                                    { name: monthlyUsageChartConfig.successRate.label, value: `${(item.successRate * 100).toFixed(1)}%`, color: monthlyUsageChartConfig.successRate.color },
                                ];
                            }
                            return payload;
                        }}
                      />
                    }
                  />
                  <Legend content={<ChartLegendContent />} />
                  <Bar dataKey="usageCount" fill="var(--color-usageCount)" radius={4} name={monthlyUsageChartConfig.usageCount.label} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyStateDisplay
              icon={BarChartBig}
              title="Nenhum Dado Mensal de Uso"
              message={`Nenhum dado de uso de agente disponível para ${selectedReportMonth === 'all' ? 'Todos os Meses' : new Date(0, (selectedReportMonth as number) -1).toLocaleString('default', { month: 'long' })} de ${selectedReportYear}.`}
            />
          )}
        </CardContent>
      </Card>
      {/* END OF TASK 8.1 AGENT USAGE REPORTS SECTION */}


      {/* START OF AGENT ACTIVITY HEATMAP SECTION */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Agent Activity Heatmap (Last 7 Days)</h2>
        {agentActivityHeatmapData.length > 0 ? (
          <div className="flex space-x-1 overflow-x-auto py-2">
            {agentActivityHeatmapData.map((dayData, index) => (
              <div key={index} className="flex flex-col items-center space-y-1 min-w-[3rem]"> {/* min-w to prevent squishing */}
                <div
                  className={`w-10 h-10 rounded border border-transparent transition-all ${getActivityColor(dayData.activity)}`}
                  title={`Date: ${dayData.date}\nActivity: ${dayData.activity}`}
                ></div>
                <span className="text-xs text-muted-foreground">{dayData.dayOfWeek}</span>
              </div>
            ))}
          </div>
        ) : (
           <Skeleton className="h-[70px] w-full rounded-md" /> // Placeholder for heatmap
        )}
      </div>
      {/* END OF AGENT ACTIVITY HEATMAP SECTION */}
      
      {/* START OF AGENT EVALUATION SECTION (Task 9.1) */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Avaliação de Agente (Simulado)</h2>
        <div className="flex items-end gap-4 mb-4">
          <div className="flex-grow">
            <Label htmlFor="agentForEvalSelect" className="text-xs text-muted-foreground">Selecione um Agente para Avaliar</Label>
            <Select
              value={selectedAgentForEvaluation?.id || ""}
              onValueChange={(agentId) => {
                const agentToEval = Object.values(displayAgents).find(a => a.id === agentId);
                setSelectedAgentForEvaluation(agentToEval || null);
                setEvaluationReport(null); // Clear previous report
                setEvaluationError(null); // Clear previous error
              }}
            >
              <SelectTrigger id="agentForEvalSelect" className="h-9 text-sm mt-1">
                <SelectValue placeholder="Selecione um Agente" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(displayAgents).length > 0 ? (
                  Object.values(displayAgents).map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>{agent.name || agent.id}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-agents" disabled>Nenhum agente ativo detectado</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleEvaluateAgent}
            disabled={!selectedAgentForEvaluation || isEvaluatingAgent}
            className="h-9"
          >
            {isEvaluatingAgent ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Avaliando...</> : "Avaliar Agente"}
          </Button>
        </div>
        {evaluationError && <p className="text-red-500 text-sm mb-4">Erro na Avaliação: {evaluationError}</p>}
        {evaluationReport && (
          <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-muted/20 dark:bg-muted/10">
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(evaluationReport, null, 2)}</pre>
          </ScrollArea>
        )}
      </div>
      {/* END OF AGENT EVALUATION SECTION */}

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
          <Button onClick={handleReloadAllData} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Recarregar Dados
          </Button>
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
          <div>
            <Label htmlFor="feedFilterAgentType" className="text-xs text-muted-foreground">Agent Type</Label>
            <Select value={feedFilterAgentType} onValueChange={(value: AgentType) => setFeedFilterAgentType(value)}>
              <SelectTrigger id="feedFilterAgentType" className="h-9 text-sm">
                <SelectValue placeholder="Filter by Agent Type" />
              </SelectTrigger>
              <SelectContent>
                {AGENT_TYPES.map(type => (
                  <SelectItem key={type} value={type} className="text-sm">{type}</SelectItem>
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
              <Accordion type="multiple" collapsible className="w-full space-y-2">
                {filteredLiveEvents.map((event) => (
                  <AccordionItem
                    key={event.id}
                    value={event.id}
                    className="bg-background dark:bg-black/20 shadow-sm border border-border/50 hover:border-primary/30 transition-all rounded-lg data-[state=open]:border-primary/50"
                  >
                    <AccordionTrigger className="p-2.5 text-xs hover:no-underline group">
                      <div className="flex justify-between items-center w-full">
                        <div className="flex-grow text-left">
                          <span className="font-mono text-muted-foreground text-[11px] mr-3 group-hover:text-foreground transition-colors">
                            {format(new Date(event.timestamp), "HH:mm:ss.SSS")}
                          </span>
                          {renderEventDetails(event)}
                        </div>
                        {event.traceId && (
                          <span className="text-[10px] text-muted-foreground/70 group-hover:text-muted-foreground transition-colors ml-2 mr-1 hidden md:inline">
                            Trace: {event.traceId}
                          </span>
                        )}
                         {/* Accordion adds its own chevron, so manual one is removed.
                             The button for stack trace is also removed as it's now in AccordionContent */}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 text-xs border-t border-border/50 data-[state=open]:bg-muted/20 dark:data-[state=open]:bg-muted/10 rounded-b-lg">
                      {renderFullEventDetails(event)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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
                  <ul className="space-y-1.5"> {/* Increased spacing slightly */}
                    {getTrajectoryEvents(selectedTraceIdForTrajectory).map((event, index, array) => {
                      const isExpanded = expandedTrajectoryNodes[event.id] || false; // Default to false if not set
                      // Basic depth calculation (example - can be refined)
                      let depth = 0;
                      if (event.eventType === 'tool_call') depth = 1;
                      else if (event.eventType === 'error' && array[index-1]?.eventType === 'tool_call') depth = 2;

                      return (
                        <li key={event.id} className={`p-2.5 rounded-md border border-border/70 bg-background dark:bg-black/20 group/trajectory-item`} style={{ marginLeft: `${depth * 20}px` }}> {/* Apply depth as margin */}
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-[10px] text-muted-foreground">{format(new Date(event.timestamp), "HH:mm:ss.SSS")}</span>
                          </div>
                          <div className="mt-0.5 flex items-center"> {/* Flex container for icon and details */}
                            {getEventIcon(event.eventType, event)} {/* Call getEventIcon here */}
                            {renderEventDetails(event, true)} {/* Pass true for isTrajectoryView */}
                          </div>
                           {(event.eventType === 'tool_call' && ((event as ToolCallEvent).input || (event as ToolCallEvent).output)) && (
                          <div className="mt-1.5 text-[10px]">
                            <Button variant="link" size="xs" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground group-hover/trajectory-item:opacity-100 opacity-0 transition-opacity" onClick={() => setExpandedTrajectoryNodes(prev => ({...prev, [event.id]: !prev[event.id]}))}>
                              {isExpanded ? <ChevronDown size={12} className="mr-1"/> : <ChevronRight size={12} className="mr-1"/>}
                              {isExpanded ? 'Ocultar Detalhes' : 'Mostrar Detalhes do Input/Output'}
                            </Button>
                            {isExpanded && (
                              <div className="mt-1 pt-1.5 border-t border-dashed border-border/50">
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
                              </div>
                            )}
                           {event.eventType === 'error' && (event as ErrorEvent).stackTrace && (
                            // Similar expand/collapse for stack trace if desired
                            <div className="mt-1.5 pt-1.5 border-t border-dashed border-border/50 text-[10px]">
                                <div className="mt-1">
                                  <strong className="text-red-500 dark:text-red-400">Stack Trace:</strong>
                                  <pre className="p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded whitespace-pre-wrap break-all">{(event as ErrorEvent).stackTrace}</pre>
                                </div>
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
                message={`Nenhum evento encontrado para o Trace ID: ${selectedTraceIdForTrajectory}. Certifique-se de que o ID está correto e os eventos foram processados.`}
              />
            )
          ) : (
            <EmptyStateDisplay
              icon={Settings2}
              title="Select a Trace ID"
              message="Digite um Trace ID no campo acima para visualizar sua trajetória de execução. O modo verbose deve estar habilitado."
            />
          )}
        </div>
      )}
      {/* END OF VISUAL TRAJECTORY SECTION */}

      {/* START OF A2A MESSAGES SECTION */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Mensagens A2A (Simuladas)</h2>
        {a2aMessagesLoading ? (
          <Skeleton className="h-[200px] w-full rounded-md" />
        ) : a2aMessagesError ? (
          <EmptyStateDisplay
            icon={AlertTriangle}
            title="Erro ao Carregar Mensagens A2A"
            message={a2aMessagesError}
          />
        ) : a2aMessages.length === 0 ? (
          <EmptyStateDisplay
            icon={MessageSquare}
            title="Nenhuma Mensagem A2A Registrada"
            message="Mensagens de comunicação entre agentes aparecerão aqui."
          />
        ) : (
          <ScrollArea className="h-[300px] w-full border rounded-md p-0 bg-muted/20 dark:bg-muted/10">
            <div className="p-4">
              <ul className="space-y-3">
                {a2aMessages.map(msg => (
                  <li key={msg.id} className="text-xs p-3 rounded-lg bg-background dark:bg-black/20 shadow-sm border border-border/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-muted-foreground text-[11px]">{format(new Date(msg.timestamp), "PP HH:mm:ss")}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        msg.status === 'simulated_success' || msg.status === 'sent' || msg.status === 'received' ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' :
                        msg.status === 'simulated_failed' || msg.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100'
                      }`}>
                        {msg.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="font-medium text-foreground">
                      <Send size={12} className="inline mr-1.5 text-primary"/> De: <span className="font-mono">{msg.fromAgentId}</span>
                    </div>
                    <div className="font-medium text-foreground">
                      <Inbox size={12} className="inline mr-1.5 text-primary"/> Para: <span className="font-mono">{msg.toAgentId}</span>
                    </div>
                    {msg.channelId && <div className="text-muted-foreground text-[11px] mt-0.5">Canal: {msg.channelId}</div>}
                    <div className="mt-1.5 pt-1.5 border-t border-dashed border-border/50">
                      <strong className="text-muted-foreground">Conteúdo:</strong>
                      <pre className="text-[11px] p-1.5 bg-muted/30 dark:bg-muted/10 rounded whitespace-pre-wrap break-all mt-0.5">
                        {typeof msg.messageContent === 'string' ? msg.messageContent : JSON.stringify(msg.messageContent, null, 2)}
                      </pre>
                    </div>
                    {msg.errorDetails && (
                       <div className="mt-1.5 pt-1.5 border-t border-dashed border-red-500/30">
                        <strong className="text-red-500 dark:text-red-400">Detalhes do Erro:</strong>
                        <pre className="text-[11px] p-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded whitespace-pre-wrap break-all mt-0.5">
                          {msg.errorDetails.message}
                          {msg.errorDetails.stack && `\n${msg.errorDetails.stack}`}
                        </pre>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollArea>
        )}
      </div>
      {/* END OF A2A MESSAGES SECTION */}

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

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Tool Usage Distribution Chart (Clickable) */}
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Tool Usage Distribution (Click to Filter Feed)</h2>
          {toolUsageLoading ? (
            <Skeleton className="h-[300px] w-full rounded-md" />
          ) : toolUsageError ? (
            <p className="text-red-500 text-center py-10">Error: {toolUsageError}</p>
          ) : toolUsageData.length > 0 ? (
            <ChartContainer config={toolUsageChartConfig} className="min-h-[200px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={toolUsageData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="toolName" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis strokeDasharray="3 3" tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip cursor={true} content={<ChartTooltipContent indicator="dashed" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="count"
                    fill="var(--color-count)"
                    radius={4}
                    onClick={(data) => {
                      if (data && data.toolName) {
                        setFeedFilterToolName(data.toolName);
                        // Consider scrolling to activity feed or other visual feedback
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyStateDisplay
              icon={BarChartBig}
              title="No Tool Usage Data"
              message="Tool usage data will appear here. Apply filters or wait for new data if none is visible."
            />
          )}
        </div>

        {/* Error Frequency by Agent Chart (Clickable) */}
        <div className="bg-card p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Error Frequency by Agent (Click to Filter Feed)</h2>
          {errorFrequencyByAgentLoading ? (
            <Skeleton className="h-[300px] w-full rounded-md" />
          ) : errorFrequencyByAgentError ? (
            <p className="text-red-500 text-center py-10">Error: {errorFrequencyByAgentError}</p>
          ) : errorFrequencyByAgentData.length > 0 ? (
            <ChartContainer config={errorFrequencyByAgentChartConfig} className="min-h-[200px] w-full">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={errorFrequencyByAgentData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="agentId" tickLine={false} axisLine={false} fontSize={10} />
                  <YAxis strokeDasharray="3 3" tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip cursor={true} content={<ChartTooltipContent indicator="dashed" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="errorCount"
                    fill="var(--color-errorCount)" // Ensure this color is defined in your CSS variables
                    radius={4}
                    onClick={(data) => {
                      if (data && data.agentId) {
                        setFeedFilterAgentId(data.agentId);
                        // Consider scrolling to activity feed or other visual feedback
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyStateDisplay
              icon={ShieldAlert} // Or AlertTriangleIcon
              title="No Error Frequency Data"
              message="Error frequency by agent will appear here as errors are detected."
            />
          )}
        </div>
      </div>
      {/* End of Interactive Charts Section */}


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
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={4}
                  // onClick={(data) => { // This is now handled by the new interactive chart above
                  //   if (data && data.toolName) {
                  //     setFeedFilterToolName(data.toolName);
                  //   }
                  // }}
                 />
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

    const handleEvaluateAgent = async () => {
      if (!selectedAgentForEvaluation) {
        setEvaluationError("Nenhum agente selecionado para avaliação.");
        return;
      }
      setIsEvaluatingAgent(true);
      setEvaluationReport(null);
      setEvaluationError(null);

      try {
        // Simulate fetching agent config (using displayAgent for mock)
        const mockAgentConfig = {
          id: selectedAgentForEvaluation.id,
          name: selectedAgentForEvaluation.name,
          // Simulate some guardrails from a hypothetical full agent config
          evaluationGuardrails: {
            prohibitedKeywords: ["confidencial", "segredo"],
            maxResponseLength: 150,
            checkForToxicity: true,
          }
        };
        // Simulate some conversations
        const mockConversations = [
          { userInput: "Olá, como você está?", agentOutput: "Estou bem, obrigado por perguntar!" },
          { userInput: "Qual é o segredo para o sucesso?", agentOutput: "O segredo é trabalho duro e dedicação. Não posso revelar informações confidenciais." },
          { userInput: "Conte uma piada bem longa", agentOutput: "Por que a galinha atravessou a estrada? Para chegar ao outro lado! Esta é uma piada muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito, muito longa." }
        ];

        const response = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentConfig: mockAgentConfig, conversations: mockConversations }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Falha na avaliação: ${response.statusText}`);
        }
        const report: EvaluationReport = await response.json();
        setEvaluationReport(report);
      } catch (error: any) {
        console.error("Erro ao avaliar agente:", error);
        setEvaluationError(error.message || "Um erro inesperado ocorreu.");
      } finally {
        setIsEvaluatingAgent(false);
      }
    };
