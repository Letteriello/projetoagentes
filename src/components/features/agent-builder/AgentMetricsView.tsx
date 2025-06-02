"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Loader2, Zap, CheckCircle, XCircle, Tool, BarChart3 } from "lucide-react";
import type { LogEntry } from "./AgentLogView"; // Import LogEntry type

interface AgentMetricsViewProps {
  agentId: string;
}

interface CalculatedMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number; // Percentage
  errorRate: number; // Percentage
  toolFrequency: { name: string; count: number }[];
  averageExecutionTime?: number; // Optional: in ms, harder to calculate accurately without more info
}

// Helper to fetch all logs - In a real scenario, this might need to handle pagination from the API
// or ideally, there would be a dedicated metrics API endpoint.
async function fetchAllAgentLogs(agentId: string, maxLogsToFetch: number = 500): Promise<LogEntry[]> {
  let allLogs: LogEntry[] = [];
  let currentPage = 1;
  const limit = 100; // Fetch in chunks of 100
  let hasMore = true;

  while (hasMore && allLogs.length < maxLogsToFetch) {
    const response = await fetch(`/api/agents/${agentId}/logs?page=${currentPage}&limit=${limit}&status=all`); // Fetch all types for comprehensive metrics
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch logs for metrics: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.logs && data.logs.length > 0) {
      allLogs = allLogs.concat(data.logs);
    }
    hasMore = data.hasNextPage || false;
    currentPage++;
    if (currentPage * limit > maxLogsToFetch && hasMore) { // Stop if we'd exceed maxLogsToFetch significantly in next fetch
        console.warn("Reached near maxLogsToFetch limit for metrics calculation. Metrics might be based on partial data.");
        break;
    }
  }
  return allLogs.slice(0, maxLogsToFetch); // Ensure we don't exceed the hard limit
}


function calculateMetrics(logs: LogEntry[]): CalculatedMetrics {
  if (!logs || logs.length === 0) {
    return {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      successRate: 0,
      errorRate: 0,
      toolFrequency: [],
    };
  }

  const executionsMap = new Map<string, { hasStart: boolean; hasEnd: boolean; hasError: boolean; startTime?: number; endTime?: number }>();
  const toolCounts: Record<string, number> = {};

  logs.forEach(log => {
    if (!log.traceId) return; // Logs without traceId cannot be reliably tracked for execution status

    let exec = executionsMap.get(log.traceId);
    if (!exec) {
      exec = { hasStart: false, hasEnd: false, hasError: false };
      executionsMap.set(log.traceId, exec);
    }

    if (log.type === 'start') {
      exec.hasStart = true;
      // exec.startTime = new Date(log.timestamp).getTime();
    } else if (log.type === 'end') {
      exec.hasEnd = true;
      // exec.endTime = new Date(log.timestamp).getTime();
    } else if (log.type === 'error') {
      exec.hasError = true;
      // If an error occurs, it might not have an 'end' log, or 'end' might be logged before error handling.
      // For simplicity, any error log marks it as failed for now.
    } else if (log.type === 'tool_call' && log.data.toolName) {
      toolCounts[log.data.toolName] = (toolCounts[log.data.toolName] || 0) + 1;
    }
  });

  let totalExecutions = 0;
  let successfulExecutions = 0;
  let failedExecutions = 0;

  executionsMap.forEach(exec => {
    if (exec.hasStart) { // Count as an execution if it at least started
      totalExecutions++;
      if (exec.hasError) {
        failedExecutions++;
      } else if (exec.hasEnd) { // Considered success if it ended AND had no error
        successfulExecutions++;
      }
      // Cases where it started but neither ended nor errored (within fetched logs) are just counted in total.
    }
  });

  const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
  const errorRate = totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0;

  const toolFrequency = Object.entries(toolCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count); // Sort by count descending

  return {
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    successRate,
    errorRate,
    toolFrequency,
  };
}


export function AgentMetricsView({ agentId }: AgentMetricsViewProps) {
  const [metrics, setMetrics] = React.useState<CalculatedMetrics | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!agentId) {
        setIsLoading(false);
        setError("Agent ID is not provided.");
        return;
    };

    const loadMetrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch up to 500 logs for metrics calculation. This limit should be configurable or based on date range.
        const logs = await fetchAllAgentLogs(agentId, 500);
        const calculated = calculateMetrics(logs);
        setMetrics(calculated);
      } catch (err: any) {
        setError(err.message || "An unknown error occurred while calculating metrics.");
        setMetrics(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, [agentId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg">Carregando métricas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-destructive">
        <AlertTriangle className="h-10 w-10" />
        <p className="ml-3 mt-2 text-lg text-center">Erro ao carregar métricas: {error}</p>
      </div>
    );
  }

  if (!metrics) {
    return <p className="text-center py-10 text-muted-foreground">Nenhuma métrica disponível.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Execuções</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">Número de fluxos iniciados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.successfulExecutions} de {metrics.totalExecutions} execuções bem-sucedidas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.errorRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.failedExecutions} de {metrics.totalExecutions} execuções falharam
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tool className="h-5 w-5 mr-2 text-muted-foreground" />
            Uso de Ferramentas
          </CardTitle>
          <CardDescription>Ferramentas mais frequentemente utilizadas pelo agente.</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.toolFrequency.length > 0 ? (
            <ul className="space-y-2">
              {metrics.toolFrequency.slice(0, 5).map((tool) => ( // Display top 5 tools
                <li key={tool.name} className="flex justify-between items-center text-sm p-2 hover:bg-muted/50 rounded">
                  <span>{tool.name}</span>
                  <span className="font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md">{tool.count} usos</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma ferramenta utilizada ou dados de chamadas de ferramentas não encontrados.</p>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for potential charts if recharts or similar is added and configured */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-muted-foreground" />
            Visualização (Exemplo)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Gráficos apareceriam aqui.</p>
        </CardContent>
      </Card> */}
    </div>
  );
}
