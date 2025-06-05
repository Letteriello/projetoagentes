"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, RefreshCcw } from "lucide-react";

interface Log {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  agentId: string;
}

interface AgentLogViewProps {
  name: string;
  agentId: string;
}

export default function AgentLogView({ name, agentId }: AgentLogViewProps) {
  const [logs, setLogs] = React.useState<Log[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Efeito para carregar logs do agente
  React.useEffect(() => {
    // Simulando carregamento de dados
    setIsLoading(true);
    
    // Timeout para simular chamada de API
    const timer = setTimeout(() => {
      // Dados mockados para demonstração
      const mockLogs: Log[] = [
        {
          id: "1",
          timestamp: new Date().toISOString(),
          level: "info",
          message: "Agente iniciado com sucesso",
          agentId: agentId
        },
        {
          id: "2",
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: "debug",
          message: "Processando solicitação do usuário",
          agentId: agentId
        },
        {
          id: "3",
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: "warn",
          message: "API externa respondeu lentamente",
          agentId: agentId
        },
        {
          id: "4",
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: "error",
          message: "Falha ao acessar recurso externo",
          agentId: agentId
        }
      ];
      
      setLogs(mockLogs);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [agentId]);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString();
  };

  // Função para obter cor do badge baseado no nível do log
  const getLevelColor = (level: string) => {
    switch(level) {
      case "error": return "bg-red-500";
      case "warn": return "bg-yellow-500";
      case "info": return "bg-blue-500";
      case "debug": return "bg-gray-500";
      default: return "bg-blue-500";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Logs do Agente</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {}} disabled={isLoading}>
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
          <Button variant="outline" size="sm" onClick={() => {}} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>Nenhum log disponível para este agente.</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="p-2 border rounded-md">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Badge className={`${getLevelColor(log.level)} mr-2`}>
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-400">{formatDate(log.timestamp)}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm">{log.message}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}