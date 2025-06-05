"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, RefreshCcw } from "lucide-react";
import { LogEntry } from "@/lib/logService"; // MODIFIED: Import from logService

// MODIFIED: RetrievedLog interface
interface RetrievedLog extends Omit<LogEntry, 'timestamp'> {
  id: string; // Assuming the API adds an ID to each log entry for keying
  timestamp: string; // Timestamps from Firestore are often converted to ISO strings in API responses
}

interface AgentLogViewProps {
  name: string;
  agentId: string;
}

export default function AgentLogView({ name, agentId }: AgentLogViewProps) {
  const [logs, setLogs] = useState<RetrievedLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
    flowName: "",
  });
  const [tempFilters, setTempFilters] = useState({ ...filters });

  const fetchLogs = async (
    currentAgentId: string,
    page: number,
    currentLimit: number,
    currentFilters: typeof filters
  ) => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: currentLimit.toString(),
    });

    if (currentFilters.startDate) params.append("startDate", currentFilters.startDate);
    if (currentFilters.endDate) params.append("endDate", currentFilters.endDate);
    if (currentFilters.status) params.append("status", currentFilters.status); // This should map to `severity` or `type` for logService
    if (currentFilters.flowName) params.append("flowName", currentFilters.flowName);

    try {
      const response = await fetch(`/api/agents/${currentAgentId}/logs?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido ao buscar logs." }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLogs(data.logs || []);
      setCurrentPage(data.currentPage);
      setHasNextPage(data.hasNextPage);
    } catch (e: any) {
      setError(e.message || "Falha ao buscar logs. Verifique a conexão ou tente novamente.");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchLogs(agentId, currentPage, limit, filters);
    }
  }, [agentId, currentPage, filters, limit]);

  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getLevelColor = (type: string = "info") => { // Default to 'info' if type is undefined
    switch(type.toLowerCase()) {
      case "error": return "bg-red-500 hover:bg-red-600";
      case "warn": case "warning": return "bg-yellow-500 hover:bg-yellow-600"; // logService uses 'WARNING'
      case "info": return "bg-blue-500 hover:bg-blue-600";
      case "debug": return "bg-gray-500 hover:bg-gray-600";
      case "start": return "bg-green-500 hover:bg-green-600";
      case "end": return "bg-purple-500 hover:bg-purple-600";
      case "tool_call": return "bg-indigo-500 hover:bg-indigo-600";
      // Added a mapping for severity levels from logService.ts
      case "critical": return "bg-pink-700 hover:bg-pink-800"; // Example for a potential CRITICAL severity
      default: return "bg-sky-500 hover:bg-sky-600"; // Default for other types or severity INFO
    }
  };

  // Helper to determine badge color based on severity or type
  const getBadgeColor = (log: RetrievedLog) => {
    return getLevelColor(log.severity || log.type); // Prioritize severity, fallback to type
  };

  // Helper to get display text for badge
  const getBadgeText = (log: RetrievedLog) => {
    return (log.severity || log.type || "LOG").toUpperCase();
  }


  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setCurrentPage(1);
    setFilters(tempFilters);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Logs do Agente: {name}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => alert('Functionality to be implemented')} disabled={isLoading}>
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs(agentId, currentPage, limit, filters)}
            disabled={isLoading}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 p-3 border rounded-md bg-slate-50">
          <Input
            type="datetime-local"
            name="startDate"
            value={tempFilters.startDate}
            onChange={handleFilterChange}
            className="text-xs"
          />
          <Input
            type="datetime-local"
            name="endDate"
            value={tempFilters.endDate}
            onChange={handleFilterChange}
            className="text-xs"
          />
          <Input
            name="status" // This field might need to map to 'severity' or 'type' in the API query
            placeholder="Nível (INFO, ERROR)"
            value={tempFilters.status}
            onChange={handleFilterChange}
            className="text-xs"
          />
          <Input
            name="flowName"
            placeholder="Nome do Fluxo"
            value={tempFilters.flowName}
            onChange={handleFilterChange}
            className="text-xs"
          />
          <Button onClick={applyFilters} size="sm" disabled={isLoading} className="text-xs md:col-span-1 sm:col-span-2">
            Aplicar Filtros
          </Button>
        </div>

        {isLoading && logs.length === 0 ? (
          <div className="flex-grow flex justify-center items-center">
            <div className="animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="flex-grow flex flex-col justify-center items-center text-red-600 p-4 bg-red-50 rounded-md">
            <p className="font-semibold">Erro ao carregar logs:</p>
            <p className="text-sm">{error}</p>
            <Button onClick={() => fetchLogs(agentId, currentPage, limit, filters)} variant="outline" size="sm" className="mt-2">
              Tentar Novamente
            </Button>
          </div>
        ) : !isLoading && logs.length === 0 ? (
          <div className="flex-grow flex justify-center items-center text-gray-500">
            <p>Nenhum log disponível para os filtros aplicados.</p>
          </div>
        ) : (
          <ScrollArea className="flex-grow h-[calc(100vh-400px)]">
            <div className="space-y-3 pr-2">
              {logs.map((log) => (
                <div key={log.id} className="p-3 border rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow duration-150 ease-in-out">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center">
                      <Badge className={`${getBadgeColor(log)} text-white px-2 py-0.5 rounded-full text-[10px] font-semibold mr-2 leading-tight`}>
                        {getBadgeText(log)}
                      </Badge>
                      <span className="text-[11px] text-gray-500">{formatDate(log.timestamp)}</span>
                    </div>
                    {log.flowName && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{log.flowName}</Badge>
                    )}
                  </div>
                  {/* MODIFIED: Accessing log.message and log.details */}
                  <p className="text-xs text-gray-800 break-words">
                    {log.message || (log.type === 'error' && log.details?.error?.message) || (typeof log.details === 'string' ? log.details : JSON.stringify(log.details))}
                  </p>

                  {/* MODIFIED: Accessing log.details.error */}
                  {log.type === 'error' && log.details?.error && typeof log.details.error === 'object' && (
                     <p className="mt-1 text-[11px] text-red-700 bg-red-50 p-1.5 rounded border border-red-200">
                       <strong>Erro Detalhado:</strong> {log.details.error.message || JSON.stringify(log.details.error)}
                       {log.details.error.stack && <pre className="mt-1 whitespace-pre-wrap text-[9px]">Stack: {log.details.error.stack}</pre>}
                     </p>
                  )}
                  {/* MODIFIED: Stringify log.details or log.data (from original if details is not present) */}
                  {(log.details || log.data) && (Object.keys(log.details || log.data).length > 0) && (
                    <details className="mt-1.5 text-[11px]">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800 text-xs">Detalhes</summary>
                      <pre className="mt-1 p-2 bg-gray-50 rounded-md text-gray-700 overflow-auto text-[10px] max-h-40">
                        {JSON.stringify(log.details || log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}