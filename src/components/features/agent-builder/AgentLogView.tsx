"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2, Search } from "lucide-react";

// Define the structure of a single log entry based on API response
export interface LogEntry {
  id: string;
  timestamp: string; // Assuming ISO string from API
  agentId: string;
  flowName: string;
  type: 'start' | 'end' | 'tool_call' | 'error' | 'info';
  traceId?: string;
  data: {
    input?: any;
    output?: any;
    toolName?: string;
    error?: { name?: string; message?: string; stack?: string };
    details?: any;
    message?: string;
    [key: string]: any; // For other data fields
  };
}

interface AgentLogViewProps {
  agentId: string;
}

const LOG_STATUS_OPTIONS = [
  { value: "all", label: "Todos os Tipos" },
  { value: "start", label: "Início de Execução" },
  { value: "end", label: "Fim de Execução (Sucesso)" }, // API maps 'success' to 'end'
  { value: "error", label: "Erro" },
  { value: "tool_call", label: "Chamada de Ferramenta" },
  { value: "info", label: "Informação" },
];

export function AgentLogView({ agentId }: AgentLogViewProps) {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [limit] = React.useState(10); // Logs per page
  const [hasNextPage, setHasNextPage] = React.useState(false);

  // Filters
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [flowNameFilter, setFlowNameFilter] = React.useState<string>("");

  const fetchLogs = React.useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    let url = `/api/agents/${agentId}/logs?page=${page}&limit=${limit}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    if (statusFilter !== "all") url += `&status=${statusFilter}`;
    if (flowNameFilter.trim()) url += `&flowName=${encodeURIComponent(flowNameFilter.trim())}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch logs: ${response.statusText}`);
      }
      const data = await response.json();
      setLogs(data.logs || []);
      setHasNextPage(data.hasNextPage || false);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
      setLogs([]);
      setHasNextPage(false);
    } finally {
      setIsLoading(false);
    }
  }, [agentId, limit, startDate, endDate, statusFilter, flowNameFilter]);

  React.useEffect(() => {
    if (agentId) {
      fetchLogs(currentPage);
    }
  }, [agentId, currentPage, fetchLogs]);

  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchLogs(1);
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
    setFlowNameFilter("");
    setCurrentPage(1);
    // fetchLogs(1) will be called by useEffect due to filter state changes if fetchLogs is in dep array
    // or call it explicitly if preferred. For now, let handleApplyFilters do it or useEffect.
    // Explicitly calling after resetting page and filters:
    // fetchLogs(1); // This might cause double fetch if useEffect also triggers.
    // Better to rely on a single source of truth for fetching, e.g. a submit button.
    // The current setup with fetchLogs in useEffect dependency array might auto-refetch.
    // Let's make filter application explicit via the button.
  };


  const renderLogDetails = (log: LogEntry) => {
    const { type, data } = log;
    let detailsSummary = "";
    let detailsObject: any = null;

    switch (type) {
      case 'start':
        detailsSummary = `Input: ${JSON.stringify(data.input, null, 2).substring(0, 100)}...`;
        detailsObject = data.input;
        break;
      case 'end':
        detailsSummary = `Output: ${JSON.stringify(data.output, null, 2).substring(0, 100)}...`;
        detailsObject = data.output;
        break;
      case 'tool_call':
        detailsSummary = `Tool: ${data.toolName}, Input: ${JSON.stringify(data.input, null, 2).substring(0, 100)}...`;
        detailsObject = { toolName: data.toolName, input: data.input, output: data.output };
        break;
      case 'error':
        detailsSummary = `Error: ${data.error?.message || 'Unknown error'}`;
        detailsObject = data.error;
        if (data.details) detailsObject.additionalDetails = data.details;
        break;
      case 'info':
        detailsSummary = data.message || "Informational log";
        detailsObject = data;
        break;
      default:
        detailsSummary = JSON.stringify(data, null, 2).substring(0, 100) + "...";
        detailsObject = data;
    }
    return (
      <details>
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          {detailsSummary}
        </summary>
        <pre className="mt-2 p-2 bg-muted text-xs rounded overflow-auto max-h-60">
          {JSON.stringify(detailsObject, null, 2)}
        </pre>
      </details>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs do Agente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-1 border rounded-md">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Data Início"
            className="text-sm"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Data Fim"
            className="text-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              {LOG_STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-sm">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="text"
            value={flowNameFilter}
            onChange={(e) => setFlowNameFilter(e.target.value)}
            placeholder="Nome do Fluxo (Flow)"
            className="text-sm"
          />
          <div className="flex gap-2 col-span-full sm:col-span-1 lg:col-span-4">
             <Button onClick={handleApplyFilters} size="sm" className="flex-1 sm:flex-none">
                <Search size={16} className="mr-1.5" /> Aplicar Filtros
            </Button>
            <Button onClick={handleClearFilters} size="sm" variant="outline" className="flex-1 sm:flex-none">
                Limpar Filtros
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Carregando logs...</p>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center py-4 text-destructive">
            <AlertTriangle className="h-8 w-8" />
            <p className="ml-2 mt-2 text-center">Erro ao carregar logs: {error}</p>
          </div>
        )}
        {!isLoading && !error && logs.length === 0 && (
          <p className="text-center py-4 text-muted-foreground">Nenhum log encontrado para os filtros aplicados.</p>
        )}
        {!isLoading && !error && logs.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Fluxo (Flow)</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Detalhes</TableHead>
                 <TableHead className="w-[150px]">Trace ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs font-medium">{log.flowName}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        log.type === 'error' ? 'bg-destructive/80 text-destructive-foreground' :
                        log.type === 'start' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                        log.type === 'end' ? 'bg-green-500/20 text-green-700 dark:text-green-300' :
                        log.type === 'tool_call' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300' :
                        'bg-muted text-muted-foreground'
                      }`}
                    >
                      {LOG_STATUS_OPTIONS.find(s => s.value === log.type)?.label || log.type}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-md">{renderLogDetails(log)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate">{log.traceId || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">Página {currentPage}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={!hasNextPage || isLoading}
          >
            Próxima
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
