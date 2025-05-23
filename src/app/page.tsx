
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, Sparkles, LayoutGrid, LineChart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4 text-center">
      <LayoutGrid className="w-28 h-28 text-primary mb-8" />
      <h1 className="text-5xl font-bold tracking-tight mb-4">
        Bem-vindo ao <span className="text-primary">AgentVerse</span>
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-8">
        Capacitando você a criar, configurar e monitorar agentes de IA inteligentes com facilidade. Mergulhe no mundo do desenvolvimento de agentes usando o ADK do Google e dê vida às suas soluções automatizadas.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mb-12">
        <Button size="lg" asChild>
          <Link href="/agent-builder">
            <Cpu className="mr-2 h-5 w-5" />
            Comece a Construir Agentes
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/ai-assistant">
            <Sparkles className="mr-2 h-5 w-5" />
            Obtenha Ajuda de Configuração com IA
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl w-full">
        <Card className="text-left shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-6 h-6 text-primary" />
              Construtor de Agentes
            </CardTitle>
            <CardDescription>Construa e ajuste visualmente seus agentes com um conjunto abrangente de ferramentas e configurações.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image
              src="https://placehold.co/600x400.png"
              alt="Ilustração do Construtor de Agentes"
              width={600}
              height={400}
              className="rounded-md aspect-video object-cover"
              data-ai-hint="tecnologia abstrata"
            />
          </CardContent>
        </Card>
        <Card className="text-left shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Assistente de IA
            </CardTitle>
            <CardDescription>Utilize IA para obter sugestões de configuração ideais com base nos objetivos de tarefa do seu agente.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image
              src="https://placehold.co/600x400.png"
              alt="Ilustração do Assistente de IA"
              width={600}
              height={400}
              className="rounded-md aspect-video object-cover"
              data-ai-hint="assistente ia"
            />
          </CardContent>
        </Card>
        <Card className="text-left shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-6 h-6 text-primary" />
              Monitor de Agentes
            </CardTitle>
            <CardDescription>Acompanhe as atividades e o desempenho de seus agentes com monitoramento em tempo real e visualizações perspicazes.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image
              src="https://placehold.co/600x400.png"
              alt="Ilustração do Monitor de Agentes"
              width={600}
              height={400}
              className="rounded-md aspect-video object-cover"
              data-ai-hint="gráfico dados"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
