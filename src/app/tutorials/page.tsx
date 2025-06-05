"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BookOpen, AlertCircle, Zap, Construction } from 'lucide-react'; // Icons

const TutorialsPage = () => {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Tutoriais e Guias da Plataforma AgentVerse
        </h1>
        <p className="mt-3 text-lg leading-7 text-muted-foreground sm:mt-4">
          Aprenda a criar, gerenciar e otimizar seus agentes de IA.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* Primeiros Passos */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <BookOpen className="mr-3 h-7 w-7 text-primary" />
              Primeiros Passos
            </CardTitle>
            <CardDescription>
              Comece sua jornada no AgentVerse com estes guias essenciais.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Como criar seu primeiro agente</h3>
            <p className="text-sm text-muted-foreground">Um guia passo a passo para configurar e lançar seu agente inicial.</p>

            <h3 className="text-lg font-semibold text-foreground">Interagindo com agentes no chat</h3>
            <p className="text-sm text-muted-foreground">Descubra como conversar com seus agentes e testar suas capacidades.</p>

            <h3 className="text-lg font-semibold text-foreground">Configurando suas chaves de API</h3>
            <p className="text-sm text-muted-foreground">Conecte seus agentes a serviços externos configurando chaves de API de forma segura.</p>
          </CardContent>
        </Card>

        {/* Funcionalidades Avançadas */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Zap className="mr-3 h-7 w-7 text-primary" />
              Funcionalidades Avançadas
            </CardTitle>
            <CardDescription>
              Aprofunde-se nas capacidades mais poderosas da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Usando ferramentas com seus agentes</h3>
            <p className="text-sm text-muted-foreground">Capacite seus agentes com ferramentas para buscar informações e executar ações.</p>

            <h3 className="text-lg font-semibold text-foreground">Entendendo a memória do agente</h3>
            <p className="text-sm text-muted-foreground">Saiba como a memória de curto e longo prazo afeta o comportamento do seu agente.</p>

            <h3 className="text-lg font-semibold text-foreground">Dicas para prompts eficazes</h3>
            <p className="text-sm text-muted-foreground">Aprenda a arte de criar prompts que extraem o melhor dos seus agentes de IA.</p>
          </CardContent>
        </Card>

        {/* Solução de Problemas */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <AlertCircle className="mr-3 h-7 w-7 text-destructive" />
              Solução de Problemas
            </CardTitle>
            <CardDescription>
              Encontre soluções para os problemas mais comuns e dicas de diagnóstico.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow space-y-3">
            <h3 className="text-lg font-semibold text-foreground">Erro ao criar agente: O que fazer?</h3>
            <p className="text-sm text-muted-foreground">Passos para diagnosticar e resolver falhas na criação de agentes.</p>

            <h3 className="text-lg font-semibold text-foreground">Problemas comuns de conexão com API</h3>
            <p className="text-sm text-muted-foreground">Dicas para solucionar erros de autenticação e conectividade com APIs externas.</p>

            <h3 id="erros-chat" className="text-lg font-semibold text-foreground scroll-mt-20">Problemas Comuns no Chat</h3>
            <p className="text-sm text-muted-foreground">Ajuda para quando as coisas não saem como esperado na interface de chat.</p>
          </CardContent>
        </Card>

        {/* Em Breve */}
        <Card className="md:col-span-2 lg:col-span-3 bg-muted/50 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Construction className="mr-3 h-7 w-7 text-amber-500" />
              Mais Tutoriais em Breve!
            </CardTitle>
            <CardDescription>
              Estamos sempre trabalhando para adicionar novos guias e recursos para você.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">
              Volte em breve para mais tutoriais sobre desenvolvimento de plugins, otimização de custos,
              análise de logs avançada, e muito mais. Se tiver sugestões, entre em contato!
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default TutorialsPage;
