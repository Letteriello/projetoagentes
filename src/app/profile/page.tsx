"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { User, Brain, StickyNote, Save } from "lucide-react";

export default function ProfilePage() {
  const { toast } = useToast();
  const [fullName, setFullName] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [agentInstructions, setAgentInstructions] = React.useState("");
  const [globalMemory, setGlobalMemory] = React.useState("");
  const [allowMemoryAccess, setAllowMemoryAccess] = React.useState(true);

  const handleSaveChanges = () => {
    // Lógica para salvar os dados do perfil (ex: chamada de API)
    // Por enquanto, apenas uma simulação com toast
    console.log({
      fullName,
      birthDate,
      email,
      agentInstructions,
      globalMemory,
      allowMemoryAccess,
    });
    toast({
      title: "Perfil Atualizado!",
      description: "Suas informações foram salvas (simulado).",
    });
  };

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
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
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                  />
                </div>
              </div>
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
              <Textarea
                id="agentInstructions"
                value={agentInstructions}
                onChange={(e) => setAgentInstructions(e.target.value)}
                placeholder="Ex: Eu prefiro respostas concisas. Tenho interesse em tecnologia e ciência. Quando estiver falando sobre programação, use exemplos em Python..."
                rows={8}
                className="min-h-[150px]"
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
              <Textarea
                id="globalMemory"
                value={globalMemory}
                onChange={(e) => setGlobalMemory(e.target.value)}
                placeholder="Ex: Meu time de futebol favorito é o Electron FC. Meu próximo projeto é sobre energias renováveis. Contato de emergência: João (11) 99999-8888..."
                rows={10}
                className="flex-grow min-h-[200px]"
              />
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="allowMemoryAccess"
                  checked={allowMemoryAccess}
                  onCheckedChange={setAllowMemoryAccess}
                />
                <Label htmlFor="allowMemoryAccess" className="text-sm">
                  Permitir que agentes acessem esta memória global
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSaveChanges} className="button-live-glow">
          <Save size={18} className="mr-2" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
