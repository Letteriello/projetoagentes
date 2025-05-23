
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Cpu, PlusCircle, Save, Info, Workflow, Settings, Brain, Target, ListChecks, Smile, Ban, Search, Calculator, FileText, CalendarDays, Network, Layers, Trash2, Edit, MessageSquare, Share2, FileJson, Database, Code2, BookText, Languages, Settings2 as ConfigureIcon } from "lucide-react";
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
  needsConfiguration?: boolean; // Nova propriedade
}

const availableTools: AvailableTool[] = [
  { id: "webSearch", label: "Busca na Web (Google)", icon: <Search size={16} className="mr-2"/>, description: "Permite ao agente pesquisar informações na internet via Genkit.", needsConfiguration: true },
  { id: "calculator", label: "Calculadora", icon: <Calculator size={16} className="mr-2"/>, description: "Permite ao agente realizar cálculos matemáticos (via função Genkit)." },
  { id: "knowledgeBase", label: "Consulta à Base de Conhecimento (RAG)", icon: <FileText size={16} className="mr-2"/>, description: "Permite ao agente buscar informações em bases de conhecimento ou documentos (ex: RAG via Genkit).", needsConfiguration: true },
  { id: "calendarAccess", label: "Acesso à Agenda/Calendário", icon: <CalendarDays size={16} className="mr-2"/>, description: "Permite ao agente verificar ou criar eventos na agenda (requer fluxo Genkit).", needsConfiguration: true },
  { id: "customApiIntegration", label: "Integração com API Externa (OpenAPI)", icon: <Network size={16} className="mr-2"/>, description: "Permite ao agente interagir com serviços web externos (ex: via OpenAPI, requer fluxo Genkit).", needsConfiguration: true },
  { id: "databaseAccess", label: "Acesso a Banco de Dados (SQL)", icon: <Database size={16} className="mr-2"/>, description: "Permite ao agente consultar e interagir com bancos de dados SQL (requer fluxo Genkit e configuração de conexão).", needsConfiguration: true },
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
  config: AgentConfig;
}

interface SavedAgentConfiguration extends AgentConfig {
  id: string;
  templateId: string;
  systemPromptGenerated?: string;
  toolsDetails: Array<{ id: string; label: string; icon: React.ReactNode; needsConfiguration?: boolean }>;
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
      agentDescription: "Agente LLM configurado manualmente a partir do zero.",
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
      agentGoal: "Fornecer suporte rápido e eficiente aos clientes, esclarecendo dúvidas e direcionando para soluções.",
      agentTasks: "1. Responder perguntas frequentes sobre produtos/serviços (especificações, preços, disponibilidade).\n2. Ajudar a solucionar problemas básicos de utilização.\n3. Direcionar para documentação relevante ou FAQs.\n4. Escalar problemas complexos para um atendente humano quando necessário e a ferramenta de escalonamento estiver disponível.",
      agentPersonality: "Empático e Compreensivo",
      agentRestrictions: "Nunca fornecer informações financeiras pessoais de clientes. Não prometer prazos de resolução exatos sem confirmação. Manter um tom profissional e paciente.",
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
      agentDescription: "Um agente para ajudar usuários a descobrir e escolher produtos ou serviços com base em suas preferências.",
      agentGoal: "Aumentar o engajamento e as vendas sugerindo itens relevantes com base nas necessidades e preferências do usuário.",
      agentTasks: "1. Perguntar sobre as preferências, necessidades e orçamento do usuário.\n2. Sugerir produtos/serviços do catálogo com base nas respostas.\n3. Comparar até 3 produtos lado a lado, destacando prós e contras.\n4. Fornecer links diretos ou informações para as páginas dos produtos/serviços recomendados.",
      agentPersonality: "Amigável e Prestativo",
      agentRestrictions: "Apenas recomendar produtos/serviços do catálogo atual. Não inventar características ou preços. Ser transparente sobre limitações se não encontrar uma combinação perfeita.",
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
      agentDescription: "Um agente para ajudar a gerar ideias, esboços e rascunhos de conteúdo original e envolvente.",
      agentGoal: "Auxiliar na criação de conteúdo escrito, como posts de blog, e-mails, descrições de produtos ou roteiros curtos.",
      agentTasks: "1. Brainstorming de tópicos com base em palavras-chave ou temas fornecidos.\n2. Gerar parágrafos introdutórios, de desenvolvimento ou conclusivos.\n3. Sugerir diferentes títulos e subtítulos para um texto.\n4. Resumir textos longos em pontos principais ou em um formato específico (ex: bullet points).",
      agentPersonality: "Criativo e Inspirador",
      agentRestrictions: "Evitar plágio. Se usar informações externas (com a ferramenta de busca), sugerir a necessidade de citação. Focar na originalidade e na clareza da escrita.",
      agentModel: "googleai/gemini-1.5-pro-latest",
      agentTemperature: 0.8,
      agentVersion: "1.0.0",
      agentTools: ["webSearch"],
    },
  },
  {
    id: "grammar_checker",
    name: "Modelo: Revisor de Gramática e Estilo (LLM)",
    config: {
      agentType: "llm",
      agentName: "Revisor de Gramática e Estilo",
      agentDescription: "Um agente para revisar textos, corrigir erros gramaticais, melhorar o estilo e a clareza.",
      agentGoal: "Ajudar o usuário a aprimorar seus textos, tornando-os gramaticalmente corretos, claros, concisos e estilisticamente adequados.",
      agentTasks: "1. Identificar e corrigir erros de gramática e ortografia.\n2. Sugerir melhorias na estrutura das frases e na escolha de palavras.\n3. Verificar a pontuação.\n4. Oferecer feedback sobre o tom e estilo do texto, se solicitado.",
      agentPersonality: "Analítico e Detalhista",
      agentRestrictions: "Focar apenas na revisão do texto fornecido. Não adicionar novo conteúdo ou alterar o significado original. Explicar as correções se forem complexas.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.3,
      agentVersion: "1.0.0",
      agentTools: [],
    },
  },
  {
    id: "translator_pt_en",
    name: "Modelo: Tradutor Simples (Português-Inglês) (LLM)",
    config: {
      agentType: "llm",
      agentName: "Tradutor Português-Inglês",
      agentDescription: "Um agente para traduzir textos do português para o inglês e vice-versa.",
      agentGoal: "Fornecer traduções precisas e naturais entre português e inglês.",
      agentTasks: "1. Receber texto em português e traduzir para o inglês.\n2. Receber texto em inglês e traduzir para o português.\n3. Manter o contexto e o significado o mais fiel possível.",
      agentPersonality: "Conciso e Objetivo",
      agentRestrictions: "Limitar-se à tradução. Não interpretar ou adicionar informações. Indicar se uma expressão é idiomática e de difícil tradução literal.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.4,
      agentVersion: "1.0.0",
      agentTools: [],
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
      setAgentType(template.config.agentType);
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
        const workflowConfig = template.config as WorkflowAgentConfig;
        resetLLMFields(workflowConfig as Partial<LLMAgentConfig>);
        setWorkflowDescription(workflowConfig.workflowDescription || "");
        resetCustomLogicFields();
      } else if (template.config.agentType === 'custom') {
        const customConfig = template.config as CustomAgentConfig;
        resetLLMFields(customConfig as Partial<LLMAgentConfig>);
        resetWorkflowFields();
        setCustomLogicDescription(customConfig.customLogicDescription || "");
      }
    }
  };

  const handleAgentTypeChange = (newAgentType: AgentConfig["agentType"]) => {
    setAgentType(newAgentType);
    // Se o tipo de agente é alterado manualmente, idealmente desassociamos de um template completo.
    // Por enquanto, se o tipo mudar para algo incompatível com o template selecionado,
    // o comportamento dos campos específicos pode precisar de mais lógica para resetar adequadamente.
    // A maneira mais simples é, se o usuário mudar o tipo, talvez resetar para o "LLM Personalizado".
    // Ou, deixar que os campos preenchidos pelo template anterior permaneçam,
    // e o usuário lide com as inconsistências (menos ideal).

    if (newAgentType === 'llm') {
        resetWorkflowFields();
        resetCustomLogicFields();
        // Se nenhum template LLM estiver ativo ou o template ativo não for LLM, reseta para LLM padrão.
        const currentTemplate = agentTemplates.find(t => t.id === selectedAgentTemplateId);
        if (!currentTemplate || currentTemplate.config.agentType !== 'llm') {
           resetLLMFields(defaultLLMConfig);
        }
    } else if (newAgentType === 'workflow') {
        resetLLMFields({}); // Limpa campos LLM, mas mantém os comuns se houver
        resetCustomLogicFields();
    } else if (newAgentType === 'custom') {
        resetLLMFields({}); // Limpa campos LLM
        resetWorkflowFields();
    }
  };

  const constructSystemPrompt = () => {
    if (agentType !== 'llm') return "";

    let prompt = `Objetivo Principal: ${agentGoal || "Não definido."}\n\n`;
    prompt += `Tarefas Principais:\n${agentTasks || "Nenhuma tarefa específica definida."}\n\n`;
    prompt += `Personalidade/Tom: ${agentPersonality || "Neutro."}\n\n`;
    if (agentRestrictions) {
      prompt += `Restrições Importantes:\n${agentRestrictions}\n\n`;
    }

    const selectedToolObjects = agentTools
      .map(toolId => availableTools.find(t => t.id === toolId))
      .filter(Boolean) as AvailableTool[];

    if (selectedToolObjects.length > 0) {
        prompt += `Ferramentas Disponíveis para uso (o agente deve decidir quando usá-las com base na conversa e nos objetivos):\n`;
        selectedToolObjects.forEach(tool => {
            prompt += `- ${tool.label}${tool.needsConfiguration ? " (requer configuração adicional)" : ""}\n`;
        });
        prompt += "\n";
    } else {
        prompt += `Nenhuma ferramenta externa está configurada para este agente.\n\n`;
    }

    prompt += "Instruções Gerais de Interação:\n";
    prompt += "- Responda de forma concisa e direta ao ponto, a menos que o tom da personalidade solicite o contrário.\n";
    prompt += "- Se precisar usar uma ferramenta, indique claramente qual ferramenta seria usada e porquê ANTES de simular a sua execução ou pedir para o usuário aguardar.\n";
    prompt += "- Seja transparente sobre suas capacidades e limitações. Se não puder realizar uma tarefa, explique o motivo.\n";

    return prompt.trim() || "Você é um assistente prestativo."; // Fallback
  };

  const handleCreateNewAgent = () => {
    const customTemplate = agentTemplates.find(t => t.id === "custom_llm") || agentTemplates[0];
    setSelectedAgentTemplateId(customTemplate.id);
    setAgentType(customTemplate.config.agentType);
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
    const selectedToolsDetails = agentTools
        .map(toolId => {
            const tool = availableTools.find(t => t.id === toolId);
            return tool ? { id: tool.id, label: tool.label, icon: tool.icon, needsConfiguration: tool.needsConfiguration } : null;
        })
        .filter(Boolean) as SavedAgentConfiguration['toolsDetails'];


    let newAgentConfiguration: SavedAgentConfiguration;

    const baseSavedConfig = {
        id: `agent-${Date.now()}`,
        templateId: selectedAgentTemplateId,
        agentName,
        agentDescription,
        agentVersion,
        agentTools, // Mantém os IDs das ferramentas
        toolsDetails: selectedToolsDetails, // Adiciona detalhes das ferramentas para exibição
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
        agentGoal: undefined,
        agentTasks: undefined,
        agentPersonality: undefined,
        agentRestrictions: undefined,
        agentModel: undefined,
        agentTemperature: undefined,
        systemPromptGenerated: undefined,
      };
    } else { // custom
      newAgentConfiguration = {
        ...baseSavedConfig,
        agentType: 'custom',
        customLogicDescription,
        agentGoal: undefined,
        agentTasks: undefined,
        agentPersonality: undefined,
        agentRestrictions: undefined,
        agentModel: undefined,
        agentTemperature: undefined,
        systemPromptGenerated: undefined,
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

  const handleConfigureTool = (toolLabel: string) => {
    toast({
        title: `Configurar ${toolLabel}`,
        description: "Funcionalidade de configuração específica para esta ferramenta será implementada em breve.",
        action: <ConfigureIcon className="text-blue-500" />
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
        A plataforma visa permitir a criação de diversos tipos de agentes, com o objetivo futuro de suportar sistemas multiagentes complexos.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Agente</CardTitle>
          <CardDescription>Defina as propriedades e configurações principais para o seu agente. Você pode começar com um modelo/template que pré-configura o tipo de agente e seus campos, ou criar um agente personalizado do zero.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agentTemplate" className="flex items-center gap-1.5"><Layers size={16}/>Modelo de Agente Inicial (Template)</Label>
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
              <p className="text-xs text-muted-foreground">Modelos pré-configuram o tipo de agente e seus campos, incluindo instruções detalhadas.</p>
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
            <Card className="bg-card">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Capacite seu agente com diversas ferramentas. Estas são funcionalidades que o agente (especialmente Agentes LLM) pode decidir usar para interagir com o mundo exterior, buscar informações ou realizar tarefas. A implementação real de cada ferramenta geralmente requer a criação de um fluxo Genkit correspondente e, para serviços externos, chaves API gerenciadas no "Cofre de Chaves API".
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
                      <div className="ml-3 flex-grow">
                        <Label htmlFor={`tool-${tool.id}`} className="font-medium flex items-center cursor-pointer">
                          {tool.icon} {tool.label}
                          {tool.needsConfiguration && <ConfigureIcon size={14} className="ml-2 text-muted-foreground group-hover:text-primary transition-colors" />}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
                      </div>
                       {tool.needsConfiguration && agentTools.includes(tool.id) && (
                         <Button variant="outline" size="sm" className="ml-auto shrink-0" onClick={() => handleConfigureTool(tool.label)}>
                           <ConfigureIcon size={14} className="mr-1.5" /> Configurar
                         </Button>
                       )}
                    </div>
                  ))}
                </div>

                {agentTools.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <h4 className="text-sm font-medium mb-2">Ferramentas Selecionadas:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {agentTools.map(toolId => {
                          const tool = availableTools.find(t => t.id === toolId);
                          return tool ? (
                            <li key={toolId} className="flex items-center">
                                {React.cloneElement(tool.icon as React.ReactElement, { size: 14, className: "mr-1.5"})}
                                {tool.label}
                                {tool.needsConfiguration && <ConfigureIcon size={12} className="ml-1.5 text-muted-foreground" titleAccess="Requer configuração" />}
                            </li>
                          ) : null;
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
                <Card key={agent.id} className="flex flex-col bg-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="flex items-center gap-2 text-lg">
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
                    {agent.agentType === 'llm' && (agent as LLMAgentConfig).agentGoal && (
                        <div>
                            <h4 className="text-sm font-medium mb-1">Objetivo (LLM):</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 h-[2.25em]">
                                {(agent as LLMAgentConfig).agentGoal}
                            </p>
                        </div>
                    )}
                     {agent.agentType === 'llm' && (agent as LLMAgentConfig).agentModel && (
                        <div>
                            <h4 className="text-sm font-medium mb-1">Modelo de IA:</h4>
                            <p className="text-xs text-muted-foreground">{(agent as LLMAgentConfig).agentModel}</p>
                        </div>
                    )}
                    {agent.agentType === 'workflow' && (agent as WorkflowAgentConfig).workflowDescription && (
                        <div>
                            <h4 className="text-sm font-medium mb-1">Descrição do Fluxo:</h4>
                            <p className="text-xs text-muted-foreground line-clamp-3 h-[3.375em]">
                                {(agent as WorkflowAgentConfig).workflowDescription}
                            </p>
                        </div>
                    )}
                    {agent.agentType === 'custom' && (agent as CustomAgentConfig).customLogicDescription && (
                        <div>
                            <h4 className="text-sm font-medium mb-1">Lógica Personalizada:</h4>
                            <p className="text-xs text-muted-foreground line-clamp-3 h-[3.375em]">
                                {(agent as CustomAgentConfig).customLogicDescription}
                            </p>
                        </div>
                    )}
                     {agent.toolsDetails.length > 0 && (
                        <div className="pt-2">
                            <h4 className="text-sm font-medium mb-1.5">Ferramentas:</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {agent.toolsDetails.map(toolDetail => (
                                    <Button
                                        key={toolDetail.id}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7 px-2 py-0.5 rounded-full flex items-center gap-1 cursor-default hover:bg-muted"
                                        onClick={toolDetail.needsConfiguration ? () => handleConfigureTool(toolDetail.label) : undefined}
                                        aria-disabled={!toolDetail.needsConfiguration}
                                    >
                                        {React.cloneElement(toolDetail.icon as React.ReactElement, { size: 12, className: "mr-0.5"})}
                                        {toolDetail.label}
                                        {toolDetail.needsConfiguration && <ConfigureIcon size={10} className="ml-1 opacity-70 group-hover:opacity-100" />}
                                    </Button>
                                ))}
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
    
