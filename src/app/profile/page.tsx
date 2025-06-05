"use client";

import * as React from "react";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// Label is replaced by FormLabel
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { User, Brain, StickyNote, Save, MessageSquare, DatabaseZap, Users as UsersIcon, Activity, Trophy } from "lucide-react"; // Added icons
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Added Select components
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'; // Added chart imports
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'; // Added chart UI imports
import { profileFormSchema, ProfileFormData, USER_ROLES } from "@/lib/zod-schemas"; // Added USER_ROLES
import withAuth from '@/components/auth/withAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAchievements, Achievement } from '@/hooks/useAchievements'; // Added useAchievements

// Chart Config for Personal Agent Usage
const agentUsageChartConfig: ChartConfig = {
  usage: { label: "Utilizações", color: "hsl(var(--chart-1))" },
  name: { label: "Agente" },
};

function ProfilePage() {
  const { toast } = useToast();
  const { saveProfile, loadProfile } = useUserProfile();
  const { achievements, unlockAchievement, resetAchievements } = useAchievements();

  const [personalUsageStats, setPersonalUsageStats] = React.useState<{
    totalMessagesSent: number;
    mostUsedAgents: Array<{ name: string; usage: number }>;
    tokensConsumedToday: number;
  } | null>(null);

  const generateMockPersonalUsageStats = () => {
    const mockAgents = ["Agente de Suporte", "Agente Financeiro", "Agente Criativo", "Agente de Pesquisa", "Agente Pessoal"];
    const mostUsed = mockAgents.map(name => ({
      name,
      usage: Math.floor(Math.random() * 100) + 10
    })).sort((a, b) => b.usage - a.usage).slice(0, 3); // Top 3

    return {
      totalMessagesSent: Math.floor(Math.random() * 500) + 50,
      mostUsedAgents: mostUsed,
      tokensConsumedToday: Math.floor(Math.random() * 15000) + 1000,
    };
  };

  React.useEffect(() => {
    setPersonalUsageStats(generateMockPersonalUsageStats());
  }, []);

  const methods = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      birthDate: "",
      email: "",
      agentInstructions: "",
      globalMemory: "",
      allowMemoryAccess: true,
      simulatedRole: "Usuário Padrão", // Default from schema but good to be explicit
    },
  });

  React.useEffect(() => {
    const loadedData = loadProfile();
    if (loadedData) {
      methods.reset(loadedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methods.reset]); // methods.reset is stable, but good to include if linting

  const handleProfileSubmit: SubmitHandler<ProfileFormData> = (data) => {
    saveProfile(data);
    console.log("Validated profile data:", data); // Keep for debugging or remove
    toast({
      title: "Perfil Atualizado!",
      description: "Suas informações foram salvas com sucesso no localStorage.",
    });
  };

  return (
    <FormProvider {...methods}>
      <>
        <form onSubmit={methods.handleSubmit(handleProfileSubmit)} className="space-y-8 p-4 md:p-6 lg:p-8">
          <header className="flex items-center gap-3">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Meu Perfil</h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna de Informações Pessoais e Instruções */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User size={20} className="text-primary/80" />
                    Informações Pessoais
                  </CardTitle>
                  <CardDescription>
                    Gerencie suas informações pessoais.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={methods.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="fullName">Nome Completo</FormLabel>
                        <FormControl>
                          <Input id="fullName" {...field} placeholder="Seu nome completo" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={methods.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="birthDate">Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input id="birthDate" type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={methods.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="email">E-mail</FormLabel>
                          <FormControl>
                            <Input id="email" type="email" {...field} placeholder="seu.email@exemplo.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User size={20} className="text-primary/80" />
                    Função de Usuário (Simulada)
                  </CardTitle>
                  <CardDescription>
                    Selecione uma função para simular diferentes níveis de acesso ou personas.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={methods.control}
                    name="simulatedRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="simulatedRole">Função Simulada</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger id="simulatedRole">
                              <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {USER_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain size={20} className="text-primary/80" />
                    Instruções para Agentes
                  </CardTitle>
                  <CardDescription>
                    O que os agentes precisam saber sobre você para te ajudar
                    melhor? (Semelhante às instruções personalizadas do ChatGPT)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={methods.control}
                    name="agentInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="agentInstructions" className="sr-only">Instruções para Agentes</FormLabel>
                        <FormControl>
                          <Textarea
                            id="agentInstructions"
                            {...field}
                            placeholder="Ex: Eu prefiro respostas concisas. Tenho interesse em tecnologia e ciência. Quando estiver falando sobre programação, use exemplos em Python..."
                            rows={8}
                            className="min-h-[150px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Coluna de Memória Global */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <StickyNote size={20} className="text-primary/80" />
                    Minha Memória Global
                  </CardTitle>
                  <CardDescription>
                    Armazene informações importantes aqui que podem ser acessadas
                    pelos seus agentes (se permitido).
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col space-y-4">
                  <FormField
                    control={methods.control}
                    name="globalMemory"
                    render={({ field }) => (
                      <FormItem className="flex-grow flex flex-col">
                        <FormLabel htmlFor="globalMemory" className="sr-only">Minha Memória Global</FormLabel>
                        <FormControl className="flex-grow">
                          <Textarea
                            id="globalMemory"
                            {...field}
                            placeholder="Ex: Meu time de futebol favorito é o Electron FC. Meu próximo projeto é sobre energias renováveis. Contato de emergência: João (11) 99999-8888..."
                            rows={10}
                            className="flex-grow min-h-[200px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={methods.control}
                    name="allowMemoryAccess"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-auto">
                        <FormLabel htmlFor="allowMemoryAccess" className="text-sm mb-0">
                          Permitir que agentes acessem esta memória global
                        </FormLabel>
                        <FormControl>
                          <Switch
                            id="allowMemoryAccess"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="button-live-glow">
              <Save size={18} className="mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </form>

        {/* New Personal Usage Stats Section */}
        <section className="p-4 md:p-6 lg:p-8 space-y-6 mt-8 border-t border-border">
          <h2 className="text-2xl font-bold text-foreground mb-4 pt-6">Minhas Estatísticas de Uso (Simulado)</h2>
          {personalUsageStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Mensagens Enviadas</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{personalUsageStats.totalMessagesSent}</div>
                  <p className="text-xs text-muted-foreground">Desde o início (simulado)</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tokens Consumidos Hoje</CardTitle>
                  <DatabaseZap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{personalUsageStats.tokensConsumedToday.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Estimativa diária (simulada)</p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <UsersIcon className="h-4 w-4 text-muted-foreground mr-2" />
                    Meus Agentes Mais Usados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {personalUsageStats.mostUsedAgents.length > 0 ? (
                    <ChartContainer config={agentUsageChartConfig} className="min-h-[200px] w-full h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={personalUsageStats.mostUsedAgents} layout="vertical" margin={{ right: 20, left: 0, top: 5, bottom: 5 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} fontSize={11} width={100} interval={0} />
                          <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            content={<ChartTooltipContent hideLabel nameKey="usage" />}
                          />
                          <Bar dataKey="usage" fill="var(--color-usage)" radius={4} barSize={16} name="Utilizações"/>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum dado de uso de agente disponível.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p>Carregando estatísticas...</p>
          )}
        </section>

        {/* Achievements Section */}
        <section className="p-4 md:p-6 lg:p-8 space-y-6 mt-8 border-t border-border">
          <div className="flex items-center justify-between mb-4 pt-6">
            <h2 className="text-2xl font-bold text-foreground">Minhas Conquistas</h2>
            <div>
              <Button variant="outline" size="sm" onClick={() => unlockAchievement('tool-used')} className="mr-2">
                Simular Uso de Ferramenta
              </Button>
              <Button variant="destructive" size="sm" onClick={resetAchievements}>
                Resetar Conquistas
              </Button>
            </div>
          </div>
          {achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement: Achievement) => (
                <Card key={achievement.id} className={`transition-all ${achievement.unlocked ? 'border-primary/50 shadow-lg' : 'opacity-60'}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <span className={`mr-2 ${achievement.unlocked ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                        {achievement.icon || <Trophy className="h-4 w-4" />}
                      </span>
                      {achievement.name}
                    </CardTitle>
                    {achievement.unlocked && <Trophy className="h-5 w-5 text-yellow-500" />}
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>Nenhuma conquista definida ainda.</p>
          )}
        </section>
      </>
    </FormProvider>
  );
}

export default withAuth(ProfilePage);
