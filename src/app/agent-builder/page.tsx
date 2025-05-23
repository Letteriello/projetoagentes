
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Cpu, PlusCircle, Save, Info, Workflow, Settings, Brain, Target, ListChecks, Smile, Ban, Search, Calculator, FileText, CalendarDays, Network, Layers } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

interface AvailableTool {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const availableTools: AvailableTool[] = [
  { id: "webSearch", label: "Busca na Web (Google)", icon: <Search size={16} className="mr-2"/>, description: "Permite ao agente pesquisar informações na internet." },
  { id: "calculator", label: "Calculadora", icon: <Calculator size={16} className="mr-2"/>, description: "Permite ao agente realizar cálculos matemáticos." },
  { id: "knowledgeBase", label: "Consulta à Base de Conhecimento", icon: <FileText size={16} className="mr-2"/>, description: "Permite ao agente buscar informações em documentos ou bases de dados internas." },
  { id: "calendarAccess", label: "Acesso à Agenda/Calendário", icon: <CalendarDays size={16} className="mr-2"/>, description: "Permite ao agente verificar ou criar eventos na agenda." },
  { id: "customApiIntegration", label: "Integração com API Externa", icon: <Network size={16} className="mr-2"/>, description: "Permite ao agente interagir com outros serviços via API (requer configuração Genkit específica)." },
];

const agentToneOptions = [
    { id: "friendly", label: "Amigável e Prestativo" },
    { id: "professional", label: "Profissional e Direto" },
    { id: "formal", label: "Formal e Educado" },
    { id: "casual", label: "Casual e Descontraído" },
    { id: "funny", label: "Engraçado e Divertido" },
    { id: "analytical", label: "Analítico e Detalhista" },
    { id: "concise", label: "Conciso e Objetivo" },
    { id: "empathetic", label: "Empático e Compreensivo" },
    { id: "creative", label: "Criativo e Inspirador" },
];

interface AgentTemplate {
  id: string;
  name: string;
  config: {
    agentName: string;
    agentDescription: string;
    agentGoal: string;
    agentTasks: string;
    agentPersonality: string;
    agentRestrictions: string;
    agentModel: string;
    agentTemperature: number;
    agentVersion: string;
    agentTools: string[];
  };
}

const agentTemplates: AgentTemplate[] = [
  {
    id: "custom",
    name: "Personalizado (Começar do Zero)",
    config: {
      agentName: "",
      agentDescription: "",
      agentGoal: "",
      agentTasks: "",
      agentPersonality: agentToneOptions[0].label,
      agentRestrictions: "",
      agentModel: "googleai/gemini-2.0-flash",
      agentTemperature: 0.7,
      agentVersion: "1.0.0",
      agentTools: [],
    },
  },
  {
    id: "support",
    name: "Modelo: Agente de Suporte ao Cliente",
    config: {
      agentName: "Agente de Suporte ao Cliente",
      agentDescription: "Um agente prestativo para responder a perguntas comuns de clientes e ajudar com problemas.",
      agentGoal: "Fornecer suporte rápido e eficiente aos clientes.",
      agentTasks: "1. Responder perguntas frequentes sobre produtos/serviços.\n2. Ajudar a solucionar problemas básicos de utilização.\n3. Direcionar para documentação relevante ou FAQs.\n4. Escalar problemas complexos para um atendente humano quando necessário.",
      agentPersonality: "Empático e Compreensivo",
      agentRestrictions: "Nunca fornecer informações financeiras pessoais. Não prometer prazos de resolução exatos sem confirmação.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.5,
      agentVersion: "1.0.0",
      agentTools: ["knowledgeBase", "webSearch"],
    },
  },
  {
    id: "recommendation",
    name: "Modelo: Agente de Recomendações",
    config: {
      agentName: "Agente de Recomendações de Produtos",
      agentDescription: "Um agente para ajudar usuários a descobrir e escolher produtos ou serviços.",
      agentGoal: "Aumentar o engajamento e as vendas sugerindo itens relevantes com base nas necessidades do usuário.",
      agentTasks: "1. Perguntar sobre as preferências e necessidades do usuário.\n2. Sugerir produtos/serviços com base nas respostas.\n3. Comparar até 3 produtos lado a lado.\n4. Fornecer links diretos para as páginas dos produtos/serviços recomendados.",
      agentPersonality: "Amigável e Prestativo",
      agentRestrictions: "Apenas recomendar produtos/serviços do catálogo atual. Não inventar características ou preços.",
      agentModel: "googleai/gemini-1.5-pro-latest",
      agentTemperature: 0.7,
      agentVersion: "1.0.0",
      agentTools: ["knowledgeBase"],
    },
  },
  {
    id: "writer",
    name: "Modelo: Assistente de Escrita Criativa",
    config: {
      agentName: "Assistente de Escrita Criativa",
      agentDescription: "Um agente para ajudar a gerar ideias, esboços e rascunhos de conteúdo.",
      agentGoal: "Auxiliar na criação de conteúdo escrito original e envolvente, como posts de blog, e-mails ou descrições.",
      agentTasks: "1. Brainstorming de tópicos com base em palavras-chave.\n2. Gerar parágrafos introdutórios ou conclusivos.\n3. Sugerir diferentes títulos e subtítulos para um texto.\n4. Resumir textos longos em pontos principais.",
      agentPersonality: "Criativo e Inspirador",
      agentRestrictions: "Evitar plágio. Se usar informações externas, sugerir a necessidade de citação (não pode citar diretamente sem ferramenta de busca ativa).",
      agentModel: "googleai/gemini-1.5-pro-latest",
      agentTemperature: 0.8,
      agentVersion: "1.0.0",
      agentTools: ["webSearch"],
    },
  },
];


export default function AgentBuilderPage() {
  const { toast } = useToast();

  const [selectedAgentTemplateId, setSelectedAgentTemplateId] = React.useState<string>(agentTemplates[0].id);
  
  const [agentName, setAgentName] = React.useState(agentTemplates[0].config.agentName);
  const [agentDescription, setAgentDescription] = React.useState(agentTemplates[0].config.agentDescription);
  const [agentGoal, setAgentGoal] = React.useState(agentTemplates[0].config.agentGoal);
  const [agentTasks, setAgentTasks] = React.useState(agentTemplates[0].config.agentTasks);
  const [agentPersonality, setAgentPersonality] = React.useState(agentTemplates[0].config.agentPersonality);
  const [agentRestrictions, setAgentRestrictions] = React.useState(agentTemplates[0].config.agentRestrictions);
  const [agentModel, setAgentModel] = React.useState(agentTemplates[0].config.agentModel);
  const [agentTemperature, setAgentTemperature] = React.useState([agentTemplates[0].config.agentTemperature]);
  const [agentVersion, setAgentVersion] = React.useState(agentTemplates[0].config.agentVersion);
  const [agentTools, setAgentTools] = React.useState<string[]>(agentTemplates[0].config.agentTools);

  const handleTemplateChange = (templateId: string) => {
    const template = agentTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedAgentTemplateId(templateId);
      setAgentName(template.config.agentName);
      setAgentDescription(template.config.agentDescription);
      setAgentGoal(template.config.agentGoal);
      setAgentTasks(template.config.agentTasks);
      setAgentPersonality(template.config.agentPersonality);
      setAgentRestrictions(template.config.agentRestrictions);
      setAgentModel(template.config.agentModel);
      setAgentTemperature([template.config.agentTemperature]);
      setAgentVersion(template.config.agentVersion);
      setAgentTools(template.config.agentTools);
    }
  };

  const constructSystemPrompt = () => {
    let prompt = "";
    if (agentGoal) prompt += `Objetivo Principal: ${agentGoal}\n\n`;
    if (agentTasks) prompt += `Tarefas Principais:\n${agentTasks}\n\n`;
    if (agentPersonality) prompt += `Personalidade/Tom: ${agentPersonality}\n\n`;
    if (agentRestrictions) prompt += `Restrições Importantes:\n${agentRestrictions}\n\n`;
    
    const selectedToolObjects = agentTools.map(toolId => availableTools.find(t => t.id === toolId)?.label).filter(Boolean);
    if (selectedToolObjects.length > 0) {
        prompt += `Ferramentas Disponíveis: ${selectedToolObjects.join(', ')}\n\n`;
    }

    return prompt.trim() || "Você é um assistente prestativo."; // Fallback
  };

  const handleCreateNewAgent = () => {
    const customTemplate = agentTemplates[0]; // "Personalizado (Começar do Zero)"
    setSelectedAgentTemplateId(customTemplate.id);
    setAgentName(customTemplate.config.agentName);
    setAgentDescription(customTemplate.config.agentDescription);
    setAgentGoal(customTemplate.config.agentGoal);
    setAgentTasks(customTemplate.config.agentTasks);
    setAgentPersonality(customTemplate.config.agentPersonality);
    setAgentRestrictions(customTemplate.config.agentRestrictions);
    setAgentModel(customTemplate.config.agentModel);
    setAgentTemperature([customTemplate.config.agentTemperature]);
    setAgentVersion(customTemplate.config.agentVersion);
    setAgentTools(customTemplate.config.agentTools);
    toast({
      title: "Formulário Limpo",
      description: "Você pode começar a configurar um novo agente personalizado.",
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
      templateId: selectedAgentTemplateId,
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
      tools: agentTools.map(toolId => availableTools.find(t => t.id === toolId)?.label).filter(Boolean), 
    };
    console.log("Configuração do Agente Salva:", agentConfiguration);
    toast({
      title: "Configuração Salva!",
      description: `O agente "${agentName}" foi salvo com sucesso (simulado). O prompt do sistema gerado inclui as ferramentas selecionadas.`,
    });
  };
  
  const handleToolSelectionChange = (toolId: string, checked: boolean) => {
    setAgentTools(prevTools => {
      if (checked) {
        return [...prevTools, toolId];
      } else {
        return prevTools.filter(id => id !== toolId);
      }
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
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Configuração do Agente</CardTitle>
            <CardDescription>Defina as propriedades e configurações principais para o seu agente. Você pode começar com um modelo ou criar um agente personalizado.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="agentTemplate" className="flex items-center gap-1.5"><Layers size={16}/>Modelo de Agente Inicial</Label>
              <Select value={selectedAgentTemplateId} onValueChange={handleTemplateChange}>
                <SelectTrigger id="agentTemplate">
                  <SelectValue placeholder="Selecione um modelo para começar" />
                </SelectTrigger>
                <SelectContent>
                  {agentTemplates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agentName">Nome do Agente</Label>
              <Input 
                id="agentName" 
                placeholder="ex: Agente de Suporte ao Cliente Avançado" 
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
                    placeholder="ex: Ajudar usuários a encontrarem informações sobre nossos produtos e resolver problemas comuns." 
                    value={agentGoal}
                    onChange={(e) => setAgentGoal(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentTasks" className="flex items-center gap-1.5"><ListChecks size={16}/>Quais são as principais tarefas que este agente deve realizar?</Label>
                  <Textarea 
                    id="agentTasks" 
                    placeholder="ex: 1. Responder perguntas sobre especificações. 2. Comparar produtos. 3. Indicar onde comprar. 4. Realizar busca na web por informações atualizadas." 
                    value={agentTasks}
                    onChange={(e) => setAgentTasks(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentPersonality" className="flex items-center gap-1.5"><Smile size={16}/>Qual deve ser a personalidade/tom do agente?</Label>
                  <Select value={agentPersonality} onValueChange={setAgentPersonality}>
                    <SelectTrigger id="agentPersonality">
                      <SelectValue placeholder="Selecione um tom/personalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentToneOptions.map(option => (
                        <SelectItem key={option.id} value={option.label}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentRestrictions" className="flex items-center gap-1.5"><Ban size={16}/>Há alguma informação específica ou restrição importante?</Label>
                  <Textarea 
                    id="agentRestrictions" 
                    placeholder="ex: Nunca fornecer informações de contato direto. Não inventar funcionalidades que não existem. Sempre verificar informações da base de conhecimento antes de buscar na web." 
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
            
            <div className="space-y-4">
              <Label className="text-lg font-medium flex items-center gap-2"><Network className="w-5 h-5 text-primary/80" /> Ferramentas e Integrações (Genkit Tools)</Label>
              <Card className="bg-muted/10">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Selecione as ferramentas pré-configuradas que seu agente poderá utilizar. Cada ferramenta representa uma capacidade que o agente pode decidir usar.
                    Integrações mais complexas ou personalizadas (como interagir com APIs específicas ou usar modelos de outros provedores como o OpenRouter) são configuradas como "Ferramentas Genkit" nos bastidores,
                    geralmente utilizando chaves armazenadas no "Cofre de Chaves API".
                  </p>
                  <div className="space-y-3 pt-2">
                    {availableTools.map((tool) => (
                      <div key={tool.id} className="flex items-start p-3 border rounded-md bg-background hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={`tool-${tool.id}`}
                          checked={agentTools.includes(tool.id)}
                          onCheckedChange={(checked) => handleToolSelectionChange(tool.id, !!checked)}
                          className="mt-1"
                        />
                        <div className="ml-3">
                          <Label htmlFor={`tool-${tool.id}`} className="font-medium flex items-center cursor-pointer">
                            {tool.icon} {tool.label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {agentTools.length > 0 && (
                    <div className="mt-4 pt-3 border-t">
                      <h4 className="text-sm font-medium mb-2">Ferramentas Selecionadas:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {agentTools.map(toolId => {
                            const tool = availableTools.find(t => t.id === toolId);
                            return tool ? <li key={toolId} className="flex items-center">{tool.icon} {tool.label}</li> : null;
                        })}
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
      </div>
    </div>
  );
}
    

    
