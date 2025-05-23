import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, Sparkles, LayoutGrid, LineChart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-12 px-4 text-center">
      <LayoutGrid className="w-24 h-24 text-primary mb-6" />
      <h1 className="text-5xl font-bold tracking-tight mb-4">
        Welcome to <span className="text-primary">AgentVerse</span>
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl mb-8">
        Empowering you to create, configure, and monitor intelligent AI agents with ease. Dive into the world of agent development using Google's ADK and bring your automated solutions to life.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 mb-12">
        <Button size="lg" asChild>
          <Link href="/agent-builder">
            <Cpu className="mr-2 h-5 w-5" />
            Start Building Agents
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/ai-assistant">
            <Sparkles className="mr-2 h-5 w-5" />
            Get AI Configuration Help
          </Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
        <Card className="text-left shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-6 h-6 text-primary" />
              Agent Builder
            </CardTitle>
            <CardDescription>Visually construct and fine-tune your agents with a comprehensive set of tools and configurations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image 
              src="https://placehold.co/600x400.png"
              alt="Agent Builder Illustration"
              width={600}
              height={400}
              className="rounded-md"
              data-ai-hint="abstract technology" 
            />
          </CardContent>
        </Card>
        <Card className="text-left shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Assistant
            </CardTitle>
            <CardDescription>Leverage AI to get optimal configuration suggestions based on your agent's task goals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image 
              src="https://placehold.co/600x400.png"
              alt="AI Assistant Illustration"
              width={600}
              height={400}
              className="rounded-md"
              data-ai-hint="artificial intelligence"
            />
          </CardContent>
        </Card>
        <Card className="text-left shadow-lg hover:shadow-xl transition-shadow md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-6 h-6 text-primary" />
              Agent Monitor
            </CardTitle>
            <CardDescription>Keep an eye on your agents' activities and performance with real-time monitoring and insightful visualizations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Image 
              src="https://placehold.co/600x400.png"
              alt="Agent Monitor Illustration"
              width={600}
              height={400}
              className="rounded-md"
              data-ai-hint="data analytics"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
