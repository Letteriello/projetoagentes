
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Cpu, PlusCircle, Save, Info, Workflow, Settings, Brain, Target, ListChecks, Smile, Ban } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

export default function AgentBuilderPage() {
  const { toast } = useToast();

  const [agentName, setAgentName] = React.useState("");
  const [agentDescription, setAgentDescription] = React.useState("");
  
  const [agentGoal, setAgentGoal] = React.useState("");
  const [agentTasks, setAgentTasks] = React.useState("");
  const [agentPersonality, setAgentPersonality] = React.useState("");
  const [agentRestrictions, setAgentRestrictions] = React.useState("");

  const [agentModel, setAgentModel] = React.useState("");
  const [agentTemperature, setAgentTemperature] = React.useState([0.7]);
  const [agentVersion, setAgentVersion] = React.useState("1.0.0");
  const [agentTools, setAgentTools] = React.useState<string[]>([]);

  const constructSystemPrompt = () => {
    let prompt = "";
    if (agentGoal) prompt += `Objetivo Principal: ${agentGoal}\n\n`;
    if (agentTasks) prompt += `Tarefas Principais:\n${agentTasks}\n\n`;
    if (agentPersonality) prompt += `Personalidade/Tom: ${agentPersonality}\n\n`;
    if (agentRestrictions) prompt += `Restrições Importantes:\n${agentRestrictions}\n\n`;
    return prompt.trim() || "Você é um assistente prestativo."; // Fallback
  };

  const handleCreateNewAgent = () => {
    setAgentName("");
    setAgentDescription("");
    setAgentGoal("");
    setAgentTasks("");
    setAgentPersonality("");
    setAgentRestrictions("");
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

    const systemPrompt = constructSystemPrompt();

    const agentConfiguration = {
      name: agentName,
      description: agentDescription,
      goal: agentGoal,
      tasks: agentTasks,
      personality: agentPersonality,
      restrictions: agentRestrictions,
      systemPromptGenerated: systemPrompt,
      model: agentModel,
      temperature: agentTemperature[0],
      version: agentVersion,
      tools: agentTools,
    };
    console.log("Configuração do Agente Salva:", agentConfiguration);
    toast({
      title: "Configuração Salva!",
      description: `O agente "${agentName}" foi salvo com sucesso (simulado). O prompt do sistema gerado foi: "${systemPrompt}"`,
    });
  };

  const handleAddTool = () => {
    console.log("Botão 'Adicionar Ferramenta' clicado. Funcionalidade a ser implementada.");
    setAgentTools(prevTools => [...prevTools, `Nova Ferramenta ${prevTools.length + 1}`]);
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

            <Separator />
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-primary/80" /> Comportamento e Instruções do Agente</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Forneça instruções claras para guiar o comportamento do seu agente. As respostas abaixo ajudarão a construir o "Prompt do Sistema" ideal.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agentGoal" className="flex items-center gap-1.5"><Target size={16}/>Qual é o objetivo principal deste agente?</Label>
                  <Input 
                    id="agentGoal" 
                    placeholder="ex: Ajudar usuários a encontrarem informações sobre nossos produtos." 
                    value={agentGoal}
                    onChange={(e) => setAgentGoal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentTasks" className="flex items-center gap-1.5"><ListChecks size={16}/>Quais são as principais tarefas que este agente deve realizar?</Label>
                  <Textarea 
                    id="agentTasks" 
                    placeholder="ex: 1. Responder perguntas sobre especificações. 2. Comparar produtos. 3. Indicar onde comprar." 
                    value={agentTasks}
                    onChange={(e) => setAgentTasks(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentPersonality" className="flex items-center gap-1.5"><Smile size={16}/>Qual deve ser a personalidade/tom do agente?</Label>
                  <Input 
                    id="agentPersonality" 
                    placeholder="ex: Amigável, prestativo e um pouco informal." 
                    value={agentPersonality}
                    onChange={(e) => setAgentPersonality(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentRestrictions" className="flex items-center gap-1.5"><Ban size={16}/>Há alguma informação específica ou restrição importante?</Label>
                  <Textarea 
                    id="agentRestrictions" 
                    placeholder="ex: Nunca fornecer informações de contato direto. Não inventar funcionalidades que não existem." 
                    value={agentRestrictions}
                    onChange={(e) => setAgentRestrictions(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><Brain className="w-5 h-5 text-primary/80" /> Configurações do Modelo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentModel">Modelo de IA (via Genkit)</Label>
                  <p className="text-xs text-muted-foreground">
                    Escolha o modelo de IA que será o "cérebro" do seu agente. O Genkit é responsável por conectar-se a estes modelos. 
                    Para modelos do Google, a integração é direta. Para opções como OpenRouter ou outros endpoints HTTP, 
                    uma configuração de "Ferramenta" Genkit correspondente pode ser necessária para definir como o AgentVerse deve interagir com eles 
                    (geralmente gerenciando a chave API através do Cofre de Chaves).
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
                      <SelectItem value="openrouter/custom">OpenRouter (requer configuração de Ferramenta Genkit)</SelectItem>
                      <SelectItem value="requestly/custom">Requestly Mock (requer configuração de Ferramenta Genkit)</SelectItem>
                      <SelectItem value="custom-http/genkit">Outro Endpoint HTTP (via Ferramenta Genkit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentTemperature">Temperatura: {agentTemperature[0].toFixed(1)}</Label>
                  <Slider
                    id="agentTemperature"
                    min={0}
                    max={1}
                    step={0.1}
                    value={agentTemperature}
                    onValueChange={setAgentTemperature}
                  />
                  <p className="text-xs text-muted-foreground">
                    Controla a criatividade da resposta. Baixo = mais focado e direto, Alto = mais criativo e variado.
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
                    placeholder="ex: 1.0.0" 
                    value={agentVersion}
                    onChange={(e) => setAgentVersion(e.target.value)}
                    />
                </div>
            </div>
            
             <div className="space-y-2">
              <Label>Ferramentas e Integrações (Genkit Tools)</Label>
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Adicione "Ferramentas" (Genkit Tools) para dar ao seu agente habilidades extras, como buscar informações na internet, 
                    consultar bancos de dados, ou interagir com APIs externas (incluindo provedores de modelos como OpenRouter, se não integrado diretamente acima). 
                    Cada ferramenta representa uma capacidade que o agente pode decidir usar.
                  </p>
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
                alt="Diagrama conceitual de um fluxo de trabalho visual para agentes de IA"
                width={600}
                height={400}
                className="rounded-md aspect-video object-cover opacity-70"
                data-ai-hint="fluxograma interface diagrama"
              />
              <p className="text-sm text-muted-foreground mt-2">Este recurso permitirá a construção visual de fluxos de agentes, simplificando a criação de lógicas complexas que seriam implementadas com Genkit.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Dicas Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>• Defina claramente o <strong>objetivo</strong> e as <strong>tarefas</strong> do seu agente para melhor assistência da IA.</p>
              <p>• Experimente diferentes <strong>temperaturas</strong> para ajustar a criatividade.</p>
              <p>• Seja específico nas <strong>restrições</strong> para evitar comportamentos indesejados.</p>
              <p>• Teste seu agente frequentemente durante o desenvolvimento na seção "Chat com Agentes".</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
    

    