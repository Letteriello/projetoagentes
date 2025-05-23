import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart as LineChartIcon, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { BarChart, CartesianGrid, XAxis, Bar, Tooltip, ResponsiveContainer, Legend, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const agentData = [
  { id: "agent_001", name: "Support Bot Alpha", status: "active", tasksCompleted: 102, errors: 3, lastActivity: "5m ago" },
  { id: "agent_002", name: "Inventory Manager Zeta", status: "idle", tasksCompleted: 560, errors: 1, lastActivity: "1h ago" },
  { id: "agent_003", name: "Email Campaigner Gamma", status: "error", tasksCompleted: 12, errors: 15, lastActivity: "2d ago" },
  { id: "agent_004", name: "Data Scraper Delta", status: "active", tasksCompleted: 1203, errors: 0, lastActivity: "10s ago" },
];

const chartData = [
  { month: 'Jan', tasks: 400, errors: 24 },
  { month: 'Feb', tasks: 300, errors: 13 },
  { month: 'Mar', tasks: 600, errors: 98 },
  { month: 'Apr', tasks: 480, errors: 39 },
  { month: 'May', tasks: 700, errors: 48 },
  { month: 'Jun', tasks: 550, errors: 38 },
];

const chartConfig = {
  tasks: { label: "Tasks Completed", color: "hsl(var(--primary))" },
  errors: { label: "Errors", color: "hsl(var(--destructive))" },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function AgentMonitorPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <LineChartIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Agent Monitor</h1>
      </header>
      <p className="text-muted-foreground">
        Oversee your agents in real-time. Track their activities, performance metrics, and identify any issues promptly.
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentData.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently managed agents
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentData.filter(a => a.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">
              Currently processing tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +15% from yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentData.reduce((sum, a) => sum + (a.status === 'error' ? 1 : 0), 0)}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Performance Overview</CardTitle>
            <CardDescription>Monthly tasks completed vs. errors.</CardDescription>
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
            <CardTitle>Activity Log (Placeholder)</CardTitle>
            <CardDescription>Recent activities across all agents.</CardDescription>
          </CardHeader>
          <CardContent>
             <Image 
                src="https://placehold.co/600x400.png"
                alt="Activity Log Placeholder"
                width={600}
                height={300}
                className="rounded-md aspect-video object-cover"
                data-ai-hint="log file text"
              />
            <p className="text-sm text-muted-foreground mt-2">Real-time logs will be displayed here.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
          <CardDescription>Overview of all configured agents and their current status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tasks Completed</TableHead>
                <TableHead className="text-right">Errors</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentData.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>
                    <Badge variant={agent.status === 'active' ? 'default' : agent.status === 'error' ? 'destructive' : 'secondary'}>
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
