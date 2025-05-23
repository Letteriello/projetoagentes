
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Cpu, PlusCircle, Save, Info, Workflow, Settings, Brain } from "lucide-react"; // Adicionado Brain
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

export default function AgentBuilderPage() {
  const { toast } = useToast();

  const [agentName, setAgentName] = React.useState("");
  const [agentDescription, setAgentDescription] = React.useState("");
  const [agentSystemPrompt, setAgentSystemPrompt] = React.useState("");
  const [agentModel, setAgentModel] = React.useState("");
  const [agentTemperature, setAgentTemperature] = React.useState([0.7]); // Slider value is an array
  const [agentVersion, setAgentVersion] = React.useState("1.0.0");
  const [agentTools, setAgentTools] = React.useState<string[]>([]); 

  const handleCreateNewAgent = () => {
    setAgentName("");
    setAgentDescription("");
    setAgentSystemPrompt("");
    setAgentModel("");
    setAgentTemperature([0.7]);
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
      systemPrompt: agentSystemPrompt,
      model: agentModel,
      temperature: agentTemperature[0],
      version: agentVersion,
      tools: agentTools,
    };
    console.log("Configuração do Agente Salva:", agentConfiguration);
    toast({
      title: "Configuração Salva!",
      description: `O agente "${agentName}" foi salvo com sucesso (simulado).`,
    });
  };

  const handleAddTool = () => {
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
        Projete, configure e implante seus agentes de IA personalizados. Use a interface visual abaixo para definir as capacidades, ferramentas e comportamento do seu agente, utilizando os modelos de IA do Google (como Gemini) via Genkit.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuração do Agente</CardTitle>
            <CardDescription>Defina as propriedades e configurações principais para o seu agente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
            <div className="space-y-2">
              <Label htmlFor="agentSystemPrompt">Instruções do Sistema (System Prompt)</Label>
               <Textarea 
                id="agentSystemPrompt" 
                placeholder="Defina o papel, personalidade e diretrizes do agente. Ex: 'Você é um assistente virtual amigável e especialista em culinária vegana...'" 
                value={agentSystemPrompt}
                onChange={(e) => setAgentSystemPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><Brain className="w-5 h-5 text-primary/80" /> Configurações do Modelo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentModel">Modelo de IA (via Genkit)</Label>
                  <p className="text-xs text-muted-foreground">
                    Selecione o modelo de IA que seu agente utilizará. A integração com os modelos do Google e outros provedores é feita através do Genkit. Para opções como OpenRouter ou endpoints HTTP personalizados, você precisará de um fluxo Genkit específico.
                  </p>
                  <Select value={agentModel} onValueChange={setAgentModel}>
                    <SelectTrigger id="agentModel">
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="googleai/gemini-1.5-pro-latest">Gemini 1.5 Pro (Google)</SelectItem>
                      <SelectItem value="googleai/gemini-1.5-flash-latest">Gemini 1.5 Flash (Google)</SelectItem>
                      <SelectItem value="googleai/gemini-pro">Gemini 1.0 Pro (Google)</SelectItem>
                      <SelectItem value="googleai/gemini-2.0-flash">Gemini 2.0 Flash (Google - Padrão Genkit)</SelectItem>
                      <SelectItem value="openrouter/custom">OpenRouter (requer fluxo Genkit)</SelectItem>
                      <SelectItem value="requestly/custom">Requestly (requer fluxo Genkit)</SelectItem>
                      <SelectItem value="custom-http/genkit">Outro Endpoint HTTP (via Genkit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentTemperature">Temperatura: {agentTemperature[0].toFixed(1)}</Label>
                  <Slider
                    id="agentTemperature"
                    min={0}
                    max={1} // Gemini models typically go up to 1 or 2. Let's stick to 1 for simplicity.
                    step={0.1}
                    value={agentTemperature}
                    onValueChange={setAgentTemperature}
                  />
                  <p className="text-xs text-muted-foreground">
                    Controla a criatividade da resposta. Baixo = mais focado, Alto = mais aleatório.
                  </p>
                </div>
              </div>
            </div>

            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="agentVersion">Versão do Agente</Label>
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
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">Conecte ferramentas (ex: busca na web, APIs) ao seu agente via Genkit para estender suas capacidades.</p>
                  <Button variant="outline" size="sm" onClick={handleAddTool}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Ferramenta</Button>
                  {agentTools.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-xs font-medium mb-1">Ferramentas Adicionadas:</h4>
                      <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
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
              <CardTitle className="flex items-center gap-2">
                <Workflow className="w-6 h-6 text-primary" />
                Designer de Fluxo Visual (Conceito / Futuro)
              </CardTitle>
              <CardDescription>
                Conceitualmente, esta seria uma interface de arrastar e soltar para modelar a lógica do seu agente. 
                Você poderia adicionar etapas como: receber entrada do usuário, chamar um modelo de IA (Prompt Genkit), usar ferramentas (Tools Genkit), executar lógica condicional e formatar a saída.
                Cada fluxo visual seria traduzido para um fluxo Genkit em TypeScript nos bastidores, permitindo tanto a facilidade visual quanto o poder do código.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Image 
                src="https://placehold.co/600x400.png"
                alt="Placeholder do Fluxo de Trabalho Visual"
                width={600}
                height={400}
                className="rounded-md aspect-video object-cover opacity-70"
                data-ai-hint="diagrama fluxograma ui interativo"
              />
              <p className="text-sm text-muted-foreground mt-2">Este recurso permitirá a construção visual de fluxos de agentes, simplificando a criação de lógicas complexas que seriam implementadas com Genkit.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Dicas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>• Defina claramente o objetivo do seu agente nas "Instruções do Sistema" para melhor assistência da IA.</p>
              <p>• Experimente diferentes temperaturas para ajustar a criatividade do agente.</p>
              <p>• Comece com modelos mais simples e itere.</p>
              <p>• Teste seu agente frequentemente durante o desenvolvimento.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
    

    