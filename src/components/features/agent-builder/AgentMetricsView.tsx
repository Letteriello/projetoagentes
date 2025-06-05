"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgentMetricsViewProps {
  name: string;
  agentId: string;
}

export default function AgentMetricsView({ name, agentId }: AgentMetricsViewProps) {
  const [metrics, setMetrics] = React.useState({
    totalRuns: 0,
    averageDuration: "0s",
    successRate: "0%",
    lastRun: "Nunca"
  });

  // Efeito para carregar métricas do agente
  React.useEffect(() => {
    // Dados mockados para demonstração
    // Em um ambiente real, isso seria uma chamada de API
    setMetrics({
      totalRuns: 42,
      averageDuration: "3.5s",
      successRate: "98%",
      lastRun: "Há 5 minutos"
    });
  }, [agentId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas do Agente</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="usage">Uso</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Total de Execuções</p>
                <h3 className="text-2xl font-bold">{metrics.totalRuns}</h3>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Última Execução</p>
                <h3 className="text-2xl font-bold">{metrics.lastRun}</h3>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Taxa de Sucesso</p>
                <h3 className="text-2xl font-bold">{metrics.successRate}</h3>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500">Duração Média</p>
                <h3 className="text-2xl font-bold">{metrics.averageDuration}</h3>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="performance">
            <div className="text-center py-8">
              <p className="text-gray-500">Dados detalhados de performance serão implementados em breve.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="usage">
            <div className="text-center py-8">
              <p className="text-gray-500">Estatísticas de uso serão implementadas em breve.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}