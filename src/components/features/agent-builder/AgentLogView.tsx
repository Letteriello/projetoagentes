"use client";

import * as React from "react";
import { useState, useEffect } from "react"; // Import useState and useEffect
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input for filter fields
import { Download, RefreshCcw } from "lucide-react";
import { LogEntry } from "../../../lib/logger";

// 1. Define RetrievedLog interface (updated to use LogEntry)
interface RetrievedLog extends LogEntry {
  id: string;
}

interface AgentLogViewProps {
  name: string;
  agentId: string;
}

export default function AgentLogView({ name, agentId }: AgentLogViewProps) {
  // 3. Implement new state variables
  const [logs, setLogs] = useState<RetrievedLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10); // Default limit
  const [hasNextPage, setHasNextPage] = useState(false);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "", // e.g., "info", "error"
    flowName: "",
  });
  const [tempFilters, setTempFilters] = useState({ ...filters }); // For staging filter changes

  // 4. Create fetchLogs async function
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
    if (currentFilters.status) params.append("status", currentFilters.status);
    if (currentFilters.flowName) params.append("flowName", currentFilters.flowName);

    try {
      const response = await fetch(`/api/agents/${currentAgentId}/logs?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Erro desconhecido ao buscar logs." }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Assuming API returns: { logs: RetrievedLog[], currentPage: number, hasNextPage: boolean, totalPages: number }
      setLogs(data.logs || []); // Ensure logs is always an array
      setCurrentPage(data.currentPage);
      setHasNextPage(data.hasNextPage);
    } catch (e: any) {
      setError(e.message || "Falha ao buscar logs. Verifique a conexão ou tente novamente.");
      setLogs([]); // Clear logs on error
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Implement useEffect hook that calls fetchLogs
  useEffect(() => {
    if (agentId) {
      fetchLogs(agentId, currentPage, limit, filters);
    }
  }, [agentId, currentPage, filters, limit]); // limit and filters added as dependencies

  // Função para formatar data (adjust if LogEntryV2 timestamp is different)
  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Função para obter cor do badge baseado no tipo do log
  const getLevelColor = (type: string) => { // Changed parameter name from level to type
    switch(type.toLowerCase()) { // Using type field now
      case "error": return "bg-red-500 hover:bg-red-600";
      // LogEntry has 'info', 'start', 'end', 'tool_call'. 'warn' and 'debug' are not standard in LogEntry.
      // Mapping 'start' and 'end' to info/debug colors for now, or choose specific colors.
      case "warn": return "bg-yellow-500 hover:bg-yellow-600"; // Kept if custom logs might use it
      case "info": return "bg-blue-500 hover:bg-blue-600";
      case "debug": return "bg-gray-500 hover:bg-gray-600"; // Kept if custom logs might use it
      case "start": return "bg-green-500 hover:bg-green-600";
      case "end": return "bg-purple-500 hover:bg-purple-600";
      case "tool_call": return "bg-indigo-500 hover:bg-indigo-600";
      default: return "bg-sky-500 hover:bg-sky-600";
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTempFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    setCurrentPage(1); // Reset to page 1 when applying new filters
    setFilters(tempFilters); // This will trigger the useEffect for fetchLogs
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      // fetchLogs will be called by useEffect due to currentPage change
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
      // fetchLogs will be called by useEffect due to currentPage change
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
            onClick={() => fetchLogs(agentId, currentPage, limit, filters)} // Direct refresh
            disabled={isLoading}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 space-y-4">
        {/* 6. Add basic UI elements for filtering */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 p-3 border rounded-md bg-slate-50">
          <Input
            type="datetime-local"
            name="startDate"
            placeholder="Data Início"
            value={tempFilters.startDate}
            onChange={handleFilterChange}
            className="text-xs"
          />
          <Input
            type="datetime-local"
            name="endDate"
            placeholder="Data Fim"
            value={tempFilters.endDate}
            onChange={handleFilterChange}
            className="text-xs"
          />
          <Input
            name="status"
            placeholder="Status (info, error)"
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

        {isLoading && logs.length === 0 ? ( // Show main loader only if logs are empty initially
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
          <ScrollArea className="flex-grow h-[calc(100vh-400px)]"> {/* Dynamic height */}
            <div className="space-y-3 pr-2">
              {logs.map((log) => (
                <div key={log.id} className="p-3 border rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow duration-150 ease-in-out">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center">
                      {/* Use log.type for color and display */}
                      <Badge className={`${getLevelColor(log.type)} text-white px-2 py-0.5 rounded-full text-[10px] font-semibold mr-2 leading-tight`}>
                        {log.type.toUpperCase()}
                      </Badge>
                      <span className="text-[11px] text-gray-500">{formatDate(log.timestamp)}</span>
                    </div>
                    {log.flowName && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{log.flowName}</Badge>
                    )}
                  </div>
                  {/* Message might not be present on all log types, or could be part of data.
                      LogEntry from logger.ts does not have a top-level `message` field.
                      enhancedLogger.logInfo has it in data: { message, ...data }
                      enhancedLogger.logError stores error details in data.error
                      Let's assume message is primarily in `log.data.message` for 'info' or specific types,
                      or display main error message for 'error' type.
                      For now, we'll try to display log.data.message if available, or a generic message for errors.
                  */}
                  <p className="text-xs text-gray-800 break-words">
                    {log.type === 'error' && log.data?.error?.message ? log.data.error.message :
                     log.data?.message || (typeof log.data === 'string' ? log.data : '')}
                  </p>

                  {/* Display error details if log.type is 'error' and error info exists in data */}
                  {log.type === 'error' && log.data?.error && typeof log.data.error === 'object' && (
                     <p className="mt-1 text-[11px] text-red-700 bg-red-50 p-1.5 rounded border border-red-200">
                       <strong>Erro Detalhado:</strong> {log.data.error.message || JSON.stringify(log.data.error)}
                       {log.data.error.stack && <pre className="mt-1 whitespace-pre-wrap text-[9px]">Stack: {log.data.error.stack}</pre>}
                     </p>
                  )}

                  {/* Display data, excluding error object if it was already displayed, or message if already displayed */}
                  {log.data && (Object.keys(log.data).length > 0) && (
                    <details className="mt-1.5 text-[11px]">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800 text-xs">Detalhes</summary>
                      <pre className="mt-1 p-2 bg-gray-50 rounded-md text-gray-700 overflow-auto text-[10px] max-h-40">
                        {JSON.stringify(log.data, null, 2)}
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