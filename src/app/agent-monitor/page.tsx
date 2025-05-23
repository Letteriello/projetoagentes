"use client"; // Add this directive

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart as LineChartIcon, Activity, AlertTriangle, CheckCircle2, Cpu } from "lucide-react"; // Added Cpu
import Image from "next/image";
import { BarChart, CartesianGrid, XAxis, Bar, Tooltip, ResponsiveContainer, Legend, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const agentData = [
  { id: "agent_001", name: "Support Bot Alpha", status: "ativo", tasksCompleted: 102, errors: 3, lastActivity: "há 5min" },
  { id: "agent_002", name: "Inventory Manager Zeta", status: "ocioso", tasksCompleted: 560, errors: 1, lastActivity: "há 1h" },
  { id: "agent_003", name: "Email Campaigner Gamma", status: "erro", tasksCompleted: 12, errors: 15, lastActivity: "há 2d" },
  { id: "agent_004", name: "Data Scraper Delta", status: "ativo", tasksCompleted: 1203, errors: 0, lastActivity: "há 10s" },
];

const chartData = [
  { month: 'Jan', tasks: 400, errors: 24 },
  { month: 'Fev', tasks: 300, errors: 13 },
  { month: 'Mar', tasks: 600, errors: 98 },
  { month: 'Abr', tasks: 480, errors: 39 },
  { month: 'Mai', tasks: 700, errors: 48 },
  { month: 'Jun', tasks: 550, errors: 38 },
];

const chartConfig = {
  tasks: { label: "Tarefas Concluídas", color: "hsl(var(--primary))" },
  errors: { label: "Erros", color: "hsl(var(--destructive))" },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function AgentMonitorPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <LineChartIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Monitor de Agentes</h1>
      </header>
      <p className="text-muted-foreground">
        Supervisione seus agentes em tempo real. Acompanhe suas atividades, métricas de desempenho e identifique quaisquer problemas prontamente.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agentes</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentData.length}</div>
            <p className="text-xs text-muted-foreground">
              Agentes gerenciados atualmente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentData.filter(a => a.status === 'ativo').length}</div>
            <p className="text-xs text-muted-foreground">
              Processando tarefas atualmente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Hoje</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.234</div>
            <p className="text-xs text-muted-foreground">
              +15% desde ontem
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentData.reduce((sum, a) => sum + (a.status === 'erro' ? 1 : 0), 0)}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção imediata
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visão Geral do Desempenho dos Agentes</CardTitle>
            <CardDescription>Tarefas concluídas mensalmente vs. erros.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="tasks" fill="var(--color-tasks)" radius={4} />
                  <Bar dataKey="errors" fill="var(--color-errors)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Registro de Atividades (Placeholder)</CardTitle>
            <CardDescription>Atividades recentes em todos os agentes.</CardDescription>
          </CardHeader>
          <CardContent>
             <Image 
                src="https://placehold.co/600x400.png"
                alt="Placeholder do Registro de Atividades"
                width={600}
                height={300}
                className="rounded-md aspect-video object-cover"
                data-ai-hint="texto arquivo log"
              />
            <p className="text-sm text-muted-foreground mt-2">Logs em tempo real serão exibidos aqui.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status do Agente</CardTitle>
          <CardDescription>Visão geral de todos os agentes configurados e seu status atual.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tarefas Concluídas</TableHead>
                <TableHead className="text-right">Erros</TableHead>
                <TableHead>Última Atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentData.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>
                    <Badge variant={agent.status === 'ativo' ? 'default' : agent.status === 'erro' ? 'destructive' : 'secondary'}>
                      {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{agent.tasksCompleted}</TableCell>
                  <TableCell className="text-right">{agent.errors}</TableCell>
                  <TableCell>{agent.lastActivity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
