import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { PlusCircle, MessageSquare, KeyRound, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-24 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <h1 className="text-4xl font-bold mb-4 text-center">Bem-vindo ao AgentVerse!</h1>
      <p className="text-lg text-slate-300 mb-10 text-center max-w-2xl">
        Seu guia para começar a criar e interagir com agentes de IA.
      </p>

      {/* Progress Section */}
      <div className="w-full max-w-xl mb-12">
        <p className="text-sm text-slate-400 mb-2">Você completou 25% dos primeiros passos.</p>
        <Progress value={25} className="h-3 bg-slate-700 [&>div]:bg-green-500" />
      </div>

      {/* Action Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {/* Card 1: Criar seu Primeiro Agente */}
        <Link href="/agent-builder">
          <Card className="bg-slate-800 border-slate-700 hover:border-sky-500 transition-all duration-200 ease-in-out transform hover:scale-105 h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-sky-400">
                <PlusCircle className="mr-2 h-5 w-5" />
                Criar seu Primeiro Agente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">Comece a construir seu primeiro agente inteligente.</p>
              <div className="mt-4 flex items-center text-sky-400 font-medium">
                <ArrowRight className="mr-2 h-4 w-4" />
                Ir para o Construtor
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Ir para o Chat */}
        <Link href="/chat">
          <Card className="bg-slate-800 border-slate-700 hover:border-lime-500 transition-all duration-200 ease-in-out transform hover:scale-105 h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-lime-400">
                <MessageSquare className="mr-2 h-5 w-5" />
                Ir para o Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">Interaja com seus agentes ou explore o chat.</p>
              <div className="mt-4 flex items-center text-lime-400 font-medium">
                <ArrowRight className="mr-2 h-4 w-4" />
                Abrir Chat
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 3: Configurar Chaves API */}
        <Link href="/api-key-vault">
          <Card className="bg-slate-800 border-slate-700 hover:border-amber-500 transition-all duration-200 ease-in-out transform hover:scale-105 h-full">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-amber-400">
                <KeyRound className="mr-2 h-5 w-5" />
                Configurar Chaves API
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">Adicione suas chaves para conectar com serviços de IA.</p>
              <div className="mt-4 flex items-center text-amber-400 font-medium">
                <ArrowRight className="mr-2 h-4 w-4" />
                Gerenciar Chaves
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}
