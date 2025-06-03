"use client";

import React, { useState, useEffect } from 'react';
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

      setAgentStatusData(generateAgentStatusData(mockAgentIds.length));
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
        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </div>
      </div>
      {/* END OF FILTERS SECTION */}


      {/* Agent Status Summary */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Agent Status Overview</h2>
        {agentStatusLoading && <p className="text-center py-4 text-muted-foreground">Loading agent status...</p>}
        {agentStatusError && <p className="text-red-500 text-center py-4">{agentStatusError}</p>}
        {!agentStatusLoading && !agentStatusError && agentStatusData.length > 0 && (
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
          <p className="text-center py-4 text-muted-foreground">No agent status data available.</p>
        )}
      </div>

      {/* Execution History Chart */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Execution History (Mock Data)</h2>
        {executionHistoryLoading && <p className="text-center py-10 text-muted-foreground">Loading chart...</p>}
        {executionHistoryError && <p className="text-red-500 text-center py-10">{executionHistoryError}</p>}
        {!executionHistoryLoading && !executionHistoryError && executionHistoryData.length > 0 && (
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
          <p className="text-center py-10 text-muted-foreground">No execution history data available.</p>
        )}
      </div>

      {/* Average Response Time Chart (Mock) */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Average Response Times (Mock Data)</h2>
        {averageResponseTimeLoading && <p className="text-center py-10 text-muted-foreground">Loading chart...</p>}
        {averageResponseTimeError && <p className="text-red-500 text-center py-10">{averageResponseTimeError}</p>}
        {!averageResponseTimeLoading && !averageResponseTimeError && averageResponseTimeData.length > 0 && (
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
          <p className="text-center py-10 text-muted-foreground">No average response time data available.</p>
        )}
      </div>

      {/* Tool Usage Metrics Chart (Mock) */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Tool Usage Metrics (Mock Data)</h2>
        {toolUsageMetricsLoading && <p className="text-center py-10 text-muted-foreground">Loading chart...</p>}
        {toolUsageMetricsError && <p className="text-red-500 text-center py-10">{toolUsageMetricsError}</p>}
        {!toolUsageMetricsLoading && !toolUsageMetricsError && toolUsageMetricsData.length > 0 && (
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
          <p className="text-center py-10 text-muted-foreground">No tool usage metrics data available.</p>
        )}
      </div>

      {/* Existing charts below - these are driven by API and filters */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Agent Usage Frequency</h2>
        {agentUsageLoading && <p className="text-center py-10">Loading chart...</p>}
        {agentUsageError && <p className="text-red-500 text-center py-10">Error loading agent usage: {agentUsageError}</p>}
        {!agentUsageLoading && !agentUsageError && agentUsageData.length > 0 && (
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
          <p className="text-center py-10 text-muted-foreground">No data available for the selected filters.</p>
        )}
      </div>
      
      {/* Keep other placeholders for now */}
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Flow Usage Frequency</h2>
        {flowUsageLoading && <p className="text-center py-10">Loading chart...</p>}
        {flowUsageError && <p className="text-red-500 text-center py-10">Error loading flow usage: {flowUsageError}</p>}
        {!flowUsageLoading && !flowUsageError && flowUsageData.length > 0 && (
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
          <p className="text-center py-10 text-muted-foreground">No data available for the selected filters.</p>
        )}
      </div>

      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Tool Usage Frequency</h2>
        {toolUsageLoading && <p className="text-center py-10">Loading chart...</p>}
        {toolUsageError && <p className="text-red-500 text-center py-10">Error loading tool usage: {toolUsageError}</p>}
        {!toolUsageLoading && !toolUsageError && toolUsageData.length > 0 && (
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
          <p className="text-center py-10 text-muted-foreground">No data available for the selected filters.</p>
        )}
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Error Rates (by Flow Name)</h2>
        {errorRatesLoading && <p className="text-center py-10">Loading chart...</p>}
        {errorRatesError && <p className="text-red-500 text-center py-10">Error loading error rates: {errorRatesError}</p>}
        {!errorRatesLoading && !errorRatesError && errorRatesData.length > 0 && (
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
          <p className="text-center py-10 text-muted-foreground">No data available for the selected filters.</p>
        )}
      </div>

      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Average Response Times (by Flow Name)</h2>
        {avgResponseTimesLoading && <p className="text-center py-10">Loading chart...</p>}
        {avgResponseTimesError && <p className="text-red-500 text-center py-10">Error loading average response times: {avgResponseTimesError}</p>}
        {!avgResponseTimesLoading && !avgResponseTimesError && avgResponseTimesData.length > 0 && (
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
          <p className="text-center py-10 text-muted-foreground">No data available for the selected filters.</p>
        )}
      </div>

      {/* Trace Details Section */}
      {currentTraceId && (
        <div className="bg-card p-6 rounded-lg shadow mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Trace Details for ID: {currentTraceId}</h2>
            <Button variant="outline" size="sm" onClick={() => { setCurrentTraceId(''); setTraceData([]); setTraceError(null); }}>Clear Trace</Button>
          </div>
          {traceLoading && <p className="text-center py-10">Loading trace details...</p>}
          {traceError && <p className="text-red-500 text-center py-10">Error loading trace: {traceError}</p>}
          {!traceLoading && !traceError && traceData.length > 0 && (
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
            <p className="text-center py-10 text-muted-foreground">No logs found for Trace ID: {currentTraceId}</p>
          )}
        </div>
      )}

      <div className="bg-card p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Log Viewer</h2>
        <p>Raw logs with filtering and pagination will be displayed here.</p>
      </div>

      <div className="bg-card p-6 rounded-lg shadow mb-8"> {/* Added mb-8 for spacing */}
        <h2 className="text-xl font-semibold mb-4">Log Viewer</h2>
        <p className="text-muted-foreground">Raw logs with filtering and pagination will be displayed here. (Functionality to be fully implemented based on API)</p>
      </div>

      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Detailed Statistics (API Driven)</h2>
        <p className="text-muted-foreground">Specific metrics like usage frequency, error rates, and response times based on actual log data will be shown here once API calls are fully filtered and connected to these charts.</p>
      </div>
    </div>
  );
}
