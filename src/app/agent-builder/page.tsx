
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Cpu, PlusCircle, Save, Info, Workflow, Settings, Brain, Target, ListChecks, Smile, Ban, Search, Calculator, FileText, CalendarDays, Network, Layers, Trash2, Edit, MessageSquare, Share2, FileJson, Database, Code2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AvailableTool {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const availableTools: AvailableTool[] = [
  { id: "webSearch", label: "Busca na Web (Google)", icon: <Search size={16} className="mr-2"/>, description: "Permite ao agente pesquisar informações na internet via Genkit." },
  { id: "calculator", label: "Calculadora", icon: <Calculator size={16} className="mr-2"/>, description: "Permite ao agente realizar cálculos matemáticos (via função Genkit)." },
  { id: "knowledgeBase", label: "Consulta à Base de Conhecimento (RAG)", icon: <FileText size={16} className="mr-2"/>, description: "Permite ao agente buscar informações em bases de conhecimento ou documentos (ex: RAG via Genkit)." },
  { id: "calendarAccess", label: "Acesso à Agenda/Calendário", icon: <CalendarDays size={16} className="mr-2"/>, description: "Permite ao agente verificar ou criar eventos na agenda (requer fluxo Genkit)." },
  { id: "customApiIntegration", label: "Integração com API Externa (OpenAPI)", icon: <Network size={16} className="mr-2"/>, description: "Permite ao agente interagir com serviços web externos (ex: via OpenAPI, requer fluxo Genkit)." },
  { id: "databaseAccess", label: "Acesso a Banco de Dados (SQL)", icon: <Database size={16} className="mr-2"/>, description: "Permite ao agente consultar e interagir com bancos de dados SQL (requer fluxo Genkit e configuração de conexão)." },
  { id: "codeExecutor", label: "Execução de Código (Python Sandbox)", icon: <Code2 size={16} className="mr-2"/>, description: "Permite ao agente executar trechos de código Python em um ambiente seguro (requer fluxo Genkit)." },
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

const agentTypeOptions = [
  { id: "llm", label: "Agente LLM (Foco em Linguagem e Decisão)" },
  { id: "workflow", label: "Agente de Fluxo de Trabalho (Workflow)" },
  { id: "custom", label: "Agente Personalizado (Lógica Customizada via Genkit)" },
];

interface AgentConfigBase {
  agentName: string;
  agentDescription: string;
  agentVersion: string;
  agentTools: string[];
}

interface LLMAgentConfig extends AgentConfigBase {
  agentType: "llm";
  agentGoal: string;
  agentTasks: string;
  agentPersonality: string;
  agentRestrictions: string;
  agentModel: string;
  agentTemperature: number;
}

interface WorkflowAgentConfig extends AgentConfigBase {
  agentType: "workflow";
  workflowDescription: string;
   // LLM fields that might be irrelevant for a pure workflow agent
  agentGoal?: string;
  agentTasks?: string;
  agentPersonality?: string;
  agentRestrictions?: string;
  agentModel?: string;
  agentTemperature?: number;
}

interface CustomAgentConfig extends AgentConfigBase {
  agentType: "custom";
  customLogicDescription: string;
  // LLM fields that might be irrelevant for a custom agent
  agentGoal?: string;
  agentTasks?: string;
  agentPersonality?: string;
  agentRestrictions?: string;
  agentModel?: string;
  agentTemperature?: number;
}

type AgentConfig = LLMAgentConfig | WorkflowAgentConfig | CustomAgentConfig;

interface AgentTemplate {
  id: string;
  name: string;
  config: AgentConfig; // Can be any of the specific config types
}

interface SavedAgentConfiguration extends AgentConfig {
  id: string; // Unique ID for the saved agent instance
  templateId: string; // ID of the template used, if any
  systemPromptGenerated?: string; // Only for LLM agents
  toolsLabels: string[];
}

const defaultLLMConfig: Omit<LLMAgentConfig, keyof AgentConfigBase | 'agentType'> = {
  agentGoal: "",
  agentTasks: "",
  agentPersonality: agentToneOptions[0].label,
  agentRestrictions: "",
  agentModel: "googleai/gemini-2.0-flash",
  agentTemperature: 0.7,
};

const agentTemplates: AgentTemplate[] = [
  {
    id: "custom_llm",
    name: "LLM Personalizado (Começar do Zero)",
    config: {
      agentType: "llm",
      agentName: "",
      agentDescription: "",
      agentVersion: "1.0.0",
      agentTools: [],
      ...defaultLLMConfig,
    },
  },
  {
    id: "support",
    name: "Modelo: Agente de Suporte ao Cliente (LLM)",
    config: {
      agentType: "llm",
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
    name: "Modelo: Agente de Recomendações (LLM)",
    config: {
      agentType: "llm",
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
    name: "Modelo: Assistente de Escrita Criativa (LLM)",
    config: {
      agentType: "llm",
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
  const [agentType, setAgentType] = React.useState<AgentConfig["agentType"]>(agentTemplates[0].config.agentType);
  
  const [agentName, setAgentName] = React.useState(agentTemplates[0].config.agentName);
  const [agentDescription, setAgentDescription] = React.useState(agentTemplates[0].config.agentDescription);
  const [agentVersion, setAgentVersion] = React.useState(agentTemplates[0].config.agentVersion);
  const [agentTools, setAgentTools] = React.useState<string[]>(agentTemplates[0].config.agentTools);

  // LLM Specific State
  const [agentGoal, setAgentGoal] = React.useState( (agentTemplates[0].config as LLMAgentConfig).agentGoal || "" );
  const [agentTasks, setAgentTasks] = React.useState( (agentTemplates[0].config as LLMAgentConfig).agentTasks || "" );
  const [agentPersonality, setAgentPersonality] = React.useState( (agentTemplates[0].config as LLMAgentConfig).agentPersonality || agentToneOptions[0].label );
  const [agentRestrictions, setAgentRestrictions] = React.useState( (agentTemplates[0].config as LLMAgentConfig).agentRestrictions || "" );
  const [agentModel, setAgentModel] = React.useState( (agentTemplates[0].config as LLMAgentConfig).agentModel || "googleai/gemini-2.0-flash" );
  const [agentTemperature, setAgentTemperature] = React.useState( [(agentTemplates[0].config as LLMAgentConfig).agentTemperature || 0.7] );
  
  // Workflow Specific State
  const [workflowDescription, setWorkflowDescription] = React.useState("");

  // Custom Specific State
  const [customLogicDescription, setCustomLogicDescription] = React.useState("");

  const [savedAgents, setSavedAgents] = React.useState<SavedAgentConfiguration[]>([]);

  const resetLLMFields = (config: Partial<LLMAgentConfig>) => {
    setAgentGoal(config.agentGoal || defaultLLMConfig.agentGoal);
    setAgentTasks(config.agentTasks || defaultLLMConfig.agentTasks);
    setAgentPersonality(config.agentPersonality || defaultLLMConfig.agentPersonality);
    setAgentRestrictions(config.agentRestrictions || defaultLLMConfig.agentRestrictions);
    setAgentModel(config.agentModel || defaultLLMConfig.agentModel);
    setAgentTemperature([config.agentTemperature === undefined ? defaultLLMConfig.agentTemperature : config.agentTemperature]);
  };
  
  const resetWorkflowFields = () => {
    setWorkflowDescription("");
  }
  const resetCustomLogicFields = () => {
    setCustomLogicDescription("");
  }

  const handleTemplateChange = (templateId: string) => {
    const template = agentTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedAgentTemplateId(templateId);
      setAgentType(template.config.agentType); // Set agent type from template
      setAgentName(template.config.agentName);
      setAgentDescription(template.config.agentDescription);
      setAgentVersion(template.config.agentVersion);
      setAgentTools(template.config.agentTools);

      if (template.config.agentType === 'llm') {
        const llmConfig = template.config as LLMAgentConfig;
        resetLLMFields(llmConfig);
        resetWorkflowFields();
        resetCustomLogicFields();
      } else if (template.config.agentType === 'workflow') {
        // For now, templates are LLM based. If we add workflow templates, handle here.
        resetLLMFields({}); // Reset to default LLM fields or clear them
        setWorkflowDescription((template.config as WorkflowAgentConfig).workflowDescription || "");
        resetCustomLogicFields();
      } else if (template.config.agentType === 'custom') {
        // For now, templates are LLM based. If we add custom templates, handle here.
        resetLLMFields({});
        resetWorkflowFields();
        setCustomLogicDescription((template.config as CustomAgentConfig).customLogicDescription || "");
      }
    }
  };

  const handleAgentTypeChange = (newAgentType: AgentConfig["agentType"]) => {
    setAgentType(newAgentType);
    // When type changes, we might want to reset fields of other types
    // For simplicity now, it doesn't auto-clear, user can use "Criar Novo Agente"
    // or select a template which will reset fields.
    // Or we can reset specific fields:
    if (newAgentType === 'llm') {
        resetWorkflowFields();
        resetCustomLogicFields();
        // Optionally, re-apply default LLM config if coming from another type without a template change
        if (selectedAgentTemplateId === agentTemplates[0].id) { // "Personalizado (Começar do Zero)"
            resetLLMFields(defaultLLMConfig);
        }
    } else if (newAgentType === 'workflow') {
        resetLLMFields({}); // Clear or default LLM fields
        resetCustomLogicFields();
    } else if (newAgentType === 'custom') {
        resetLLMFields({}); // Clear or default LLM fields
        resetWorkflowFields();
    }
  };

  const constructSystemPrompt = () => {
    if (agentType !== 'llm') return "";
    let prompt = "";
    if (agentGoal) prompt += `Objetivo Principal: ${agentGoal}\n\n`;
    if (agentTasks) prompt += `Tarefas Principais:\n${agentTasks}\n\n`;
    if (agentPersonality) prompt += `Personalidade/Tom: ${agentPersonality}\n\n`;
    if (agentRestrictions) prompt += `Restrições Importantes:\n${agentRestrictions}\n\n`;
    
    const selectedToolObjects = agentTools.map(toolId => availableTools.find(t => t.id === toolId)?.label).filter(Boolean);
    if (selectedToolObjects.length > 0) {
        prompt += `Ferramentas Disponíveis para uso (o agente deve decidir quando usá-las com base na conversa e nos objetivos):\n- ${selectedToolObjects.join('\n- ')}\n\n`;
    }
    prompt += "Responda de forma concisa e direta ao ponto, a menos que o tom da personalidade peça o contrário.\n";
    prompt += "Se precisar usar uma ferramenta, indique qual ferramenta usaria e porquê antes de pedir para o usuário aguardar a execução.\n";


    return prompt.trim() || "Você é um assistente prestativo."; // Fallback
  };

  const handleCreateNewAgent = () => {
    const customTemplate = agentTemplates[0]; // "LLM Personalizado (Começar do Zero)"
    setSelectedAgentTemplateId(customTemplate.id);
    setAgentType(customTemplate.config.agentType); // Default to LLM for new
    setAgentName(customTemplate.config.agentName);
    setAgentDescription(customTemplate.config.agentDescription);
    setAgentVersion(customTemplate.config.agentVersion);
    setAgentTools(customTemplate.config.agentTools);
    
    resetLLMFields(defaultLLMConfig);
    resetWorkflowFields();
    resetCustomLogicFields();

    toast({
      title: "Formulário Limpo",
      description: "Você pode começar a configurar um novo agente.",
      action: <Info className="text-blue-500" />,
    });
  };

  const handleSaveConfiguration = () => {
    if (!agentName) {
      toast({
        title: "Campo Obrigatório",
        description: "Nome do Agente é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    if (agentType === 'llm' && !agentModel) {
       toast({
        title: "Campo Obrigatório para Agente LLM",
        description: "Modelo de IA é obrigatório para Agentes LLM.",
        variant: "destructive",
      });
      return;
    }


    const systemPrompt = agentType === 'llm' ? constructSystemPrompt() : undefined;
    const selectedToolLabels = agentTools.map(toolId => availableTools.find(t => t.id === toolId)?.label).filter(Boolean) as string[];

    let newAgentConfiguration: SavedAgentConfiguration;

    const baseSavedConfig = {
        id: `agent-${Date.now()}`,
        templateId: selectedAgentTemplateId,
        agentName,
        agentDescription,
        agentVersion,
        agentTools,
        toolsLabels: selectedToolLabels,
    };

    if (agentType === 'llm') {
      newAgentConfiguration = {
        ...baseSavedConfig,
        agentType: 'llm',
        agentGoal,
        agentTasks,
        agentPersonality,
        agentRestrictions,
        agentModel,
        agentTemperature: agentTemperature[0],
        systemPromptGenerated: systemPrompt,
      };
    } else if (agentType === 'workflow') {
      newAgentConfiguration = {
        ...baseSavedConfig,
        agentType: 'workflow',
        workflowDescription,
      };
    } else { // custom
      newAgentConfiguration = {
        ...baseSavedConfig,
        agentType: 'custom',
        customLogicDescription,
      };
    }
    
    setSavedAgents(prevAgents => [...prevAgents, newAgentConfiguration]);

    console.log("Configuração do Agente Salva:", newAgentConfiguration);
    toast({
      title: "Configuração Salva!",
      description: `O agente "${agentName}" (${agentTypeOptions.find(opt => opt.id === agentType)?.label}) foi adicionado à lista.`,
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
    <div className="space-y-8">
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
        Projete, configure e implante seus agentes de IA personalizados. Use a interface visual abaixo para definir o tipo, capacidades, ferramentas e comportamento do seu agente.
        A plataforma visa permitir a criação de diversos tipos de agentes, incluindo aqueles baseados em LLMs, fluxos de trabalho estruturados e lógicas customizadas, com o objetivo futuro de suportar sistemas multiagentes complexos.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Agente</CardTitle>
          <CardDescription>Defina as propriedades e configurações principais para o seu agente. Você pode começar com um modelo ou criar um agente personalizado escolhendo seu tipo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <p className="text-xs text-muted-foreground">Modelos pré-configuram o tipo de agente e seus campos.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agentType" className="flex items-center gap-1.5"><Share2 size={16}/>Tipo de Agente</Label>
              <Select value={agentType} onValueChange={(value) => handleAgentTypeChange(value as AgentConfig["agentType"])}>
                <SelectTrigger id="agentType">
                  <SelectValue placeholder="Selecione o tipo de agente" />
                </SelectTrigger>
                <SelectContent>
                  {agentTypeOptions.map(option => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Define a arquitetura e o comportamento fundamental do agente.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agentName">Nome do Agente</Label>
            <Input 
              id="agentName" 
              placeholder="ex: Agente de Suporte Avançado" 
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agentDescription">Descrição Geral do Agente</Label>
            <Textarea 
              id="agentDescription" 
              placeholder="Descreva a função principal e o objetivo geral deste agente, independente do tipo..." 
              value={agentDescription}
              onChange={(e) => setAgentDescription(e.target.value)}
            />
          </div>
          
          <Separator />

          {/* Conditional Fields based on Agent Type */}
          {agentType === 'llm' && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-primary/80" /> Comportamento e Instruções (Agente LLM)</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Forneça instruções claras para guiar o comportamento do seu agente LLM. As respostas abaixo ajudarão a construir o "Prompt do Sistema" ideal.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="agentGoal" className="flex items-center gap-1.5"><Target size={16}/>Qual é o objetivo principal deste agente LLM?</Label>
                    <Input 
                      id="agentGoal" 
                      placeholder="ex: Ajudar usuários a encontrarem informações sobre nossos produtos." 
                      value={agentGoal}
                      onChange={(e) => setAgentGoal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agentTasks" className="flex items-center gap-1.5"><ListChecks size={16}/>Quais são as principais tarefas que este agente LLM deve realizar?</Label>
                    <Textarea 
                      id="agentTasks" 
                      placeholder="ex: 1. Responder perguntas sobre especificações. 2. Comparar produtos." 
                      value={agentTasks}
                      onChange={(e) => setAgentTasks(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agentPersonality" className="flex items-center gap-1.5"><Smile size={16}/>Qual deve ser a personalidade/tom do agente LLM?</Label>
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
                    <Label htmlFor="agentRestrictions" className="flex items-center gap-1.5"><Ban size={16}/>Há alguma restrição ou informação importante para o agente LLM?</Label>
                    <Textarea 
                      id="agentRestrictions" 
                      placeholder="ex: Nunca fornecer informações de contato direto." 
                      value={agentRestrictions}
                      onChange={(e) => setAgentRestrictions(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2"><Brain className="w-5 h-5 text-primary/80" /> Configurações do Modelo (Agente LLM)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="agentModel">Modelo de IA (via Genkit)</Label>
                     <p className="text-xs text-muted-foreground">
                      Escolha o modelo Gemini do Google para o agente LLM. A integração com outros modelos (ex: OpenRouter) ou endpoints mock (ex: Requestly) pode ser feita configurando-os como uma "Ferramenta do Agente" e utilizando o "Cofre de Chaves API".
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
                        <SelectItem value="openrouter/custom">OpenRouter (requer configuração como Ferramenta Genkit)</SelectItem>
                        <SelectItem value="requestly/custom">Requestly Mock (requer configuração como Ferramenta Genkit)</SelectItem>
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
                      Controla a criatividade da resposta. Baixo = focado, Alto = criativo.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {agentType === 'workflow' && (
            <>
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Workflow className="w-5 h-5 text-primary/80" /> Configuração do Fluxo de Trabalho</h3>
                 <Alert className="mb-4">
                  <Workflow className="h-4 w-4" />
                  <AlertTitle>Agente de Fluxo de Trabalho</AlertTitle>
                  <AlertDescription>
                    Agentes de fluxo de trabalho controlam a execução de outros agentes ou tarefas em padrões predefinidos (Sequencial, Paralelo, Loop).
                    Uma interface visual dedicada para desenhar esses fluxos é um recurso planejado para o futuro. Por enquanto, descreva o fluxo abaixo.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="workflowDescription">Descrição do Fluxo de Trabalho</Label>
                  <Textarea 
                    id="workflowDescription" 
                    placeholder="Descreva as etapas, a ordem e a lógica do seu fluxo de trabalho. Ex: 'Etapa 1: Agente A (LLM). Etapa 2 (Paralelo): Agente B (LLM com ferramenta de busca) e Agente C (Custom para API interna). Etapa 3: Agente D (LLM para resumo) se resultado de B for X.'" 
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
            </>
          )}

          {agentType === 'custom' && (
            <>
               <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><FileJson className="w-5 h-5 text-primary/80" /> Configuração do Agente Personalizado</h3>
                <Alert className="mb-4">
                  <FileJson className="h-4 w-4" />
                  <AlertTitle>Agente Personalizado (Lógica via Genkit Flow)</AlertTitle>
                  <AlertDescription>
                    Agentes personalizados são criados estendendo a lógica base com fluxos Genkit customizados.
                    Isto permite implementar lógicas operacionais únicas, integrações especializadas ou comportamentos complexos que não são cobertos pelos tipos padrão. Requer desenvolvimento de código para o fluxo Genkit.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="customLogicDescription">Descrição da Lógica Personalizada (Genkit Flow)</Label>
                  <Textarea 
                    id="customLogicDescription" 
                    placeholder="Descreva a funcionalidade principal e a lógica que seu fluxo Genkit personalizado implementará. Ex: 'Este agente se conectará a uma API interna de CRM para buscar dados de clientes e então usará um LLM para resumir o histórico do cliente, utilizando uma ferramenta de análise de sentimento no resumo.'" 
                    value={customLogicDescription}
                    onChange={(e) => setCustomLogicDescription(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
            </>
          )}


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
            <Label className="text-lg font-medium flex items-center gap-2"><Network className="w-5 h-5 text-primary/80" /> Ferramentas do Agente (Capacidades via Genkit)</Label>
            <Card className="bg-muted/10">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Capacite seu agente com diversas ferramentas. Estas são funcionalidades que o agente (especialmente Agentes LLM) pode decidir usar para interagir com o mundo exterior, buscar informações ou realizar tarefas. A implementação real de cada ferramenta geralmente requer a criação de um fluxo Genkit correspondente e, para serviços externos, chaves API gerenciadas no "Cofre de Chaves API".
                </p>
                <div className="space-y-3 pt-2">
                  {availableTools.map((tool) => (
                    <div key={tool.id} className="flex items-start p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors">
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

      {savedAgents.length > 0 && (
        <div className="space-y-6">
          <Separator />
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-7 h-7 text-primary" /> Meus Agentes Criados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedAgents.map((agent) => (
                <Card key={agent.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center gap-2">
                        <Cpu size={20} className="text-primary" /> 
                        {agent.agentName || "Agente Sem Nome"}
                        </CardTitle>
                        <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-1 rounded-full">
                            {agentTypeOptions.find(opt => opt.id === agent.agentType)?.label.split('(')[0].trim() || agent.agentType}
                        </span>
                    </div>
                    <CardDescription className="line-clamp-2 h-[2.5em] pt-1">
                      {agent.agentDescription || "Sem descrição."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-grow">
                    {agent.agentType === 'llm' && (
                        <>
                            <div>
                                <h4 className="text-sm font-medium mb-1">Objetivo (LLM):</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2 h-[2.25em]">
                                    {(agent as LLMAgentConfig).agentGoal || "Não definido."}
                                </p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium mb-1">Modelo de IA:</h4>
                                <p className="text-xs text-muted-foreground">{(agent as LLMAgentConfig).agentModel}</p>
                            </div>
                        </>
                    )}
                    {agent.agentType === 'workflow' && (
                        <div>
                            <h4 className="text-sm font-medium mb-1">Descrição do Fluxo:</h4>
                            <p className="text-xs text-muted-foreground line-clamp-3 h-[3.375em]">
                                {(agent as WorkflowAgentConfig).workflowDescription || "Não definida."}
                            </p>
                        </div>
                    )}
                    {agent.agentType === 'custom' && (
                        <div>
                            <h4 className="text-sm font-medium mb-1">Lógica Personalizada:</h4>
                            <p className="text-xs text-muted-foreground line-clamp-3 h-[3.375em]">
                                {(agent as CustomAgentConfig).customLogicDescription || "Não definida."}
                            </p>
                        </div>
                    )}
                     {agent.toolsLabels.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium mb-1">Ferramentas:</h4>
                            <div className="flex flex-wrap gap-1">
                                {agent.toolsLabels.map(toolLabel => {
                                    const toolDetail = availableTools.find(t => t.label === toolLabel);
                                    return (
                                        <span key={toolLabel} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                                            {toolDetail?.icon && React.cloneElement(toolDetail.icon as React.ReactElement, { size: 12, className: "mr-0.5"})}
                                            {toolLabel}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                  </CardContent>
                  <CardFooter className="gap-2 mt-auto pt-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "Em breve!", description: "Funcionalidade de edição de agente."})}>
                      <Edit size={16} className="mr-1.5" /> Editar
                    </Button>
                     <Button variant="outline" size="sm" onClick={() => toast({ title: "Em breve!", description: "Funcionalidade de teste no chat."})}>
                      <MessageSquare size={16} className="mr-1.5" /> Testar
                    </Button>
                    <Button variant="destructive" size="sm" className="ml-auto" onClick={() => toast({ title: "Em breve!", description: "Funcionalidade de exclusão de agente."})}>
                      <Trash2 size={16} className="mr-1.5" /> Excluir
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
    

    