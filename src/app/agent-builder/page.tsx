
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Cpu, PlusCircle, Save, Info } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

export default function AgentBuilderPage() {
  const { toast } = useToast();

  const [agentName, setAgentName] = React.useState("");
  const [agentDescription, setAgentDescription] = React.useState("");
  const [agentModel, setAgentModel] = React.useState("");
  const [agentVersion, setAgentVersion] = React.useState("1.0.0");
  // Placeholder para ferramentas, pode ser uma lista de strings ou objetos mais complexos
  const [agentTools, setAgentTools] = React.useState<string[]>([]); 

  const handleCreateNewAgent = () => {
    setAgentName("");
    setAgentDescription("");
    setAgentModel("");
    setAgentVersion("1.0.0");
    setAgentTools([]);
    toast({
      title: "Formulário Limpo",
      description: "Você pode começar a configurar um novo agente.",
      action: <Info className="text-blue-500" />,
    });
  };

  const handleSaveConfiguration = () => {
    if (!agentName || !agentModel) {
      toast({
        title: "Campos Obrigatórios",
        description: "Nome do Agente e Modelo de IA são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const agentConfiguration = {
      name: agentName,
      description: agentDescription,
      model: agentModel,
      version: agentVersion,
      tools: agentTools, // Incluído no log
    };
    console.log("Configuração do Agente Salva:", agentConfiguration);
    toast({
      title: "Configuração Salva!",
      description: `O agente "${agentName}" foi salvo com sucesso (simulado).`,
    });
  };

  const handleAddTool = () => {
    // Placeholder para a lógica de adicionar ferramenta
    // Poderia abrir um modal ou adicionar um campo de input para nome da ferramenta
    console.log("Botão 'Adicionar Ferramenta' clicado. Funcionalidade a ser implementada.");
    setAgentTools(prevTools => [...prevTools, `Nova Ferramenta ${prevTools.length + 1}`]); // Exemplo
    toast({
      title: "Adicionar Ferramenta",
      description: "Interface para adicionar ferramentas ainda em desenvolvimento. Uma ferramenta de exemplo foi adicionada.",
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cpu className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Construtor de Agentes</h1>
        </div>
        <Button onClick={handleCreateNewAgent}>
          <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo Agente
        </Button>
      </header>
      
      <p className="text-muted-foreground">
        Projete, configure e implante seus agentes de IA personalizados. Use a interface visual abaixo para definir as capacidades, ferramentas e comportamento do seu agente.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuração do Agente</CardTitle>
            <CardDescription>Defina as propriedades e configurações principais para o seu agente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agentName">Nome do Agente</Label>
              <Input 
                id="agentName" 
                placeholder="ex: Agente de Suporte ao Cliente" 
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentDescription">Descrição</Label>
              <Textarea 
                id="agentDescription" 
                placeholder="Descreva a função principal e o objetivo deste agente..." 
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentModel">Provedor/Modelo de IA (via Genkit)</Label>
                <p className="text-xs text-muted-foreground">
                  Selecione o provedor e modelo de IA que seu agente utilizará. A integração é feita através do Genkit. Para opções como OpenRouter, Requestly ou outros endpoints HTTP, você precisará configurar um fluxo Genkit personalizado.
                </p>
                <Select value={agentModel} onValueChange={setAgentModel}>
                  <SelectTrigger id="agentModel">
                    <SelectValue placeholder="Selecione um provedor/modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="googleai/gemini-1.5-pro-latest">Gemini 1.5 Pro (Google)</SelectItem>
                    <SelectItem value="googleai/gemini-1.5-flash-latest">Gemini 1.5 Flash (Google)</SelectItem>
                    <SelectItem value="googleai/gemini-pro">Gemini 1.0 Pro (Google)</SelectItem>
                    <SelectItem value="openrouter/custom">OpenRouter (requer fluxo Genkit)</SelectItem>
                    <SelectItem value="requestly/custom">Requestly (requer fluxo Genkit)</SelectItem>
                    <SelectItem value="custom-http/genkit">Outro Endpoint HTTP (via Genkit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentVersion">Versão</Label>
                <Input 
                  id="agentVersion" 
                  placeholder="1.0.0" 
                  value={agentVersion}
                  onChange={(e) => setAgentVersion(e.target.value)}
                />
              </div>
            </div>
             <div className="space-y-2">
              <Label>Ferramentas e Integrações</Label>
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Selecione e configure ferramentas (ex: busca na web, acesso a APIs) via Genkit.</p>
                  <Button variant="outline" size="sm" onClick={handleAddTool}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Ferramenta</Button>
                  {agentTools.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <h4 className="text-xs font-medium">Ferramentas Adicionadas:</h4>
                      <ul className="list-disc list-inside text-xs text-muted-foreground">
                        {agentTools.map((tool, index) => (
                          <li key={index}>{tool}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveConfiguration}>
              <Save className="mr-2 h-4 w-4" /> Salvar Configuração do Agente
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Trabalho Visual (Em Breve)</CardTitle>
              <CardDescription>Interface de arrastar e soltar para a lógica do agente.</CardDescription>
            </CardHeader>
            <CardContent>
              <Image 
                src="https://placehold.co/600x400.png"
                alt="Placeholder do Fluxo de Trabalho Visual"
                width={600}
                height={400}
                className="rounded-md aspect-video object-cover"
                data-ai-hint="diagrama fluxograma"
              />
              <p className="text-sm text-muted-foreground mt-2">Este recurso permitirá a construção visual de fluxos de agentes.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Dicas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>• Defina claramente o objetivo do seu agente para melhor assistência da IA.</p>
              <p>• Comece com modelos mais simples e itere.</p>
              <p>• Teste seu agente frequentemente durante o desenvolvimento.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

    