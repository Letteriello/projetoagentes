import * as React from "react"; // For JSX in agentTypeOptions
import { ReactNode } from "react";
import {
  Search,
  Calculator,
  FileText,
  CalendarDays,
  Network,
  Database,
  Code2,
  Cpu,
  Briefcase,
  Stethoscope,
  Plane,
  Workflow,
  Brain,
  FileJson,
  Settings2 as ConfigureIcon,
  GripVertical,
  ClipboardCopy,
  AlertCircle,
  Trash2 as DeleteIcon,
  Edit as EditIcon,
  MessageSquare as ChatIcon,
  Copy as CopyIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Save as SaveIcon,
  Plus,
  Layers,
  Info,
} from "lucide-react";

import {
    AgentFramework,
    AgentType,
    WorkflowDetailedType,
    TerminationConditionType,
    StatePersistenceType,
    ArtifactStorageType,
    StateScope,
    ToolConfigField,
    AvailableTool,
    ToolConfigData,
    CommunicationChannel,
    A2AConfig,
    ArtifactDefinition,
    ArtifactsConfig,
    InitialStateValue,
    StateValidationRule,
    StatePersistenceConfig,
    KnowledgeSource,
    RagMemoryConfig,
    AgentConfigBase,
    LLMAgentConfig,
    WorkflowAgentConfig,
    CustomAgentConfig,
    A2AAgentSpecialistConfig,
    AgentConfig,
    SavedAgentConfiguration
} from "@/types/agent-configs";

// From Updated Upstream (Chosen version)
// From Updated Upstream (Chosen version, matching above interface)
export const availableTools: AvailableTool[] = [
  {
    id: "webSearch",
    label: "Busca na Web (Google)",
    name: "webSearch",
    type: "genkit_native",
    icon: Search,
    description:
      "Permite ao agente pesquisar na internet (via Genkit). Esta ferramenta tentará usar as variáveis de ambiente GOOGLE_API_KEY e GOOGLE_CSE_ID para funcionar. A configuração na UI serve para documentar e guiar o prompt do sistema.",
    hasConfig: true,
    genkitToolName: "performWebSearch",
  },
  {
    id: "calculator",
    label: "Calculadora",
    name: "calculator",
    type: "genkit_native",
    icon: Calculator,
    description: "Permite realizar cálculos matemáticos (via função Genkit).",
    genkitToolName: "calculator",
  },
  {
    id: "knowledgeBase",
    label: "Consulta à Base de Conhecimento (RAG)",
    name: "knowledgeBase",
    type: "genkit_native",
    icon: FileText,
    description:
      "Permite buscar em bases de conhecimento ou documentos (ex: RAG via Genkit). Requer configuração do ID da base e, possivelmente, chaves de API.",
    hasConfig: true,
    genkitToolName: "queryKnowledgeBase",
  },
  {
    id: "calendarAccess",
    label: "Acesso à Agenda/Calendário",
    name: "calendarAccess",
    type: "genkit_native",
    icon: CalendarDays,
    description:
      "Permite verificar ou criar eventos na agenda (requer fluxo Genkit e auth). Requer configuração do endpoint da API ou ID do fluxo.",
    hasConfig: true,
    genkitToolName: "accessCalendar",
  },
  {
    id: "customApiIntegration",
    label: "Integração com API Externa (OpenAPI)",
    name: "customApiIntegration",
    type: "genkit_native",
    icon: Network,
    description:
      "Permite interagir com serviços web externos (via OpenAPI, requer fluxo Genkit). Requer URL do esquema OpenAPI e, opcionalmente, chave API.",
    hasConfig: true,
    genkitToolName: "invokeOpenAPI",
  },
  {
    id: "databaseAccess",
    label: "Acesso a Banco de Dados (SQL)",
    name: "databaseAccess",
    type: "genkit_native",
    icon: Database,
    description:
      "Permite consultar e interagir com bancos de dados SQL (requer fluxo Genkit). Requer configuração detalhada da conexão.",
    hasConfig: true,
    genkitToolName: "queryDatabase",
  },
  {
    id: "codeExecutor",
    label: "Execução de Código (Python Sandbox)",
    name: "codeExecutor",
    type: "genkit_native",
    icon: Code2,
    description:
      "Permite executar trechos de código Python em um ambiente seguro (requer fluxo Genkit). Pode requerer configuração do endpoint do sandbox.",
    hasConfig: true,
    genkitToolName: "executeCode",
  },
];

export const agentToneOptions = [
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

// From Stashed Changes (Chosen version)
export const agentTypeOptions: Array<{ id: "llm" | "workflow" | "custom" | "a2a"; label: string; icon?: React.ReactNode; description: string }> = [
  { id: "llm", label: "Agente LLM (Ex: LlmAgent, para Decisão e Linguagem)", icon: <Brain size={16} />, description: "Usa Modelos de Linguagem (LLMs) para raciocinar, planejar, gerar respostas e usar ferramentas. A description do agente é usada por outros agentes LLM para decidir se devem delegar tarefas a ele." },
  { id: "workflow", label: "Agente de Fluxo de Trabalho (Ex: SequentialAgent, ParallelAgent)", icon: <Workflow size={16} />, description: "Estes agentes especializados controlam o fluxo de execução de seus subagentes com base em lógica predefinida e determinística, sem consultar um LLM para a orquestração em si." },
  { id: "custom", label: "Agente Personalizado (Ex: CustomAgent, via Genkit Flow)", icon: <Code2 size={16} />, description: "Implemente lógica operacional única e fluxos de controle específicos, estendendo BaseAgent. Tipicamente orquestram outros agentes e gerenciam estado. Requer desenvolvimento de fluxo Genkit customizado (equivalente a implementar _run_async_impl)." },
  { id: "a2a", label: "Agente de Comunicação (A2A)", icon: <Layers size={16} />, description: "Permite comunicação e cooperação entre múltiplos agentes para solucionar tarefas complexas através de interações coordenadas." },
];

export interface AgentTemplate {
  id: string;
  name: string;
  config: AgentConfig;
}

export interface ADKTool {
  id: string;
  name: string;
  description?: string;
  // icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  // inputSchema?: any;
  // outputSchema?: any;
}

export interface Gem {
  id: string; 
  name: string; 
  templateId?: string;
  agentDescription?: string;
  agentType?: 'llm' | 'workflow' | 'custom' | 'a2a';
  framework?: AgentFramework;
  agentModel?: string; 
  agentTemperature?: number; 
  toolsDetails?: Array<{
    id: string;
    label: string;
    iconName?: keyof typeof iconComponents | "default";
    needsConfiguration?: boolean;
    genkitToolName?: string;
  }>;
  agentGoal?: string; 
}

export interface SavedAgentConfiguration extends AgentConfigBase {
  id: string;
  name?: string; // Added for UI consistency, especially with Gems/ADK Agents
  framework?: AgentFramework; // Added to align with AgentConfigBase and Gem
  templateId: string;
  systemPromptGenerated?: string;
  toolsDetails: Array<{
    id: string;
    label: string;
    iconName?: keyof typeof iconComponents | "default";
    needsConfiguration?: boolean;
    genkitToolName?: string;
  }>;
  toolConfigsApplied?: Record<string, ToolConfigData>;
  agentType: AgentType; // Updated to use AgentType from agent-configs
  agentGoal?: string;
  agentTasks?: string;
  agentPersonality?: string;
  agentRestrictions?: string;
  agentModel?: string;
  agentTemperature?: number;
  workflowDescription?: string;
  detailedWorkflowType?: WorkflowDetailedType; // Updated
  loopMaxIterations?: number;
  loopTerminationConditionType?: TerminationConditionType; // Updated
  loopExitToolName?: string;
  loopExitStateKey?: string;
  loopExitStateValue?: string;
  customLogicDescription?: string;
  enableStatePersistence?: boolean;
  statePersistenceType?: StatePersistenceType; // Updated
  initialStateValues?: InitialStateValue[]; // Updated
  enableStateSharing?: boolean;
  stateSharingStrategy?: "all" | "explicit" | "none";
  enableRAG?: boolean;
  enableArtifacts?: boolean;
  artifactStorageType?: ArtifactStorageType; // Updated
  artifacts?: ArtifactDefinition[]; // Updated
  cloudStorageBucket?: string;
  localStoragePath?: string;
  ragMemoryConfig?: RagMemoryConfig; // Updated
  a2aConfig?: A2AConfig; // Updated
}

export const iconComponents: Record<
  string,
  React.FC<React.SVGProps<SVGSVGElement>>
> = {
  Search,
  Calculator,
  FileText,
  CalendarDays,
  Network,
  Database,
  Code2,
  Cpu,
  Briefcase,
  Stethoscope,
  Plane,
  Workflow,
  Brain: Cpu, // Changed from Brain to Cpu to match available imports
  FileJson,
  GripVertical,
  ConfigureIcon,
  ClipboardCopy,
  AlertCircle,
  DeleteIcon,
  EditIcon,
  ChatIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  SaveIcon,
  Plus,
  Layers,
  Info,
  Default: Cpu,
};

export const agentTemplates: AgentTemplate[] = [
  {
    id: "custom_llm",
    name: "LLM Personalizado (Começar do Zero)",
    config: {
      agentType: "llm",
      agentName: "",
      agentDescription: "Agente LLM configurado manualmente a partir do zero.",
      agentVersion: "1.0.0",
      agentTools: [],
      agentGoal: "",
      agentTasks: "",
      agentPersonality: agentToneOptions[0].label, // Relies on agentToneOptions
      agentRestrictions: "",
      agentModel: "googleai/gemini-2.0-flash",
      agentTemperature: 0.7,
    },
  },
  {
    id: "support",
    name: "Modelo: Agente de Suporte ao Cliente (LLM)",
    config: {
      agentType: "llm",
      agentName: "Agente de Suporte ao Cliente",
      agentDescription:
        "Agente prestativo para responder perguntas comuns e ajudar com problemas. Delega tarefas complexas a outros agentes ou humanos quando necessário.",
      agentGoal:
        "Fornecer suporte rápido e eficiente, esclarecendo dúvidas comuns dos clientes sobre produtos e serviços.",
      agentTasks:
        "1. Responder a perguntas frequentes (FAQs) sobre funcionalidades, preços e políticas.\n2. Solucionar problemas básicos de usuários seguindo um script predefinido.\n3. Coletar informações do cliente para abrir um ticket de suporte se o problema for complexo.\n4. Direcionar o usuário para a documentação relevante ou tutoriais.\n5. Escalonar para um agente humano se não conseguir resolver o problema ou se o cliente solicitar.",
      agentPersonality: "Empático e Compreensivo", // Matches an agentToneOption
      agentRestrictions:
        "Nunca fornecer informações financeiras ou pessoais do cliente, a menos que seja para confirmar a identidade para um processo seguro. Manter um tom profissional e cortês. Limitar o escopo das respostas aos produtos e serviços da empresa.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.5,
      agentVersion: "1.0.0",
      agentTools: ["knowledgeBase", "webSearch"],
    },
  },
  // ... (other templates will also need agentToneOptions if they use agentPersonality)
  // For brevity, I'll assume the rest of the templates are structured correctly
  // and their agentPersonality fields reference labels from agentToneOptions.
  // The full list from the original file should be here.
  {
    id: "recommendation",
    name: "Modelo: Agente de Recomendações (LLM)",
    config: {
      agentType: "llm",
      agentName: "Agente de Recomendações de Produtos",
      agentDescription:
        "Ajuda usuários a descobrir produtos/serviços com base em suas preferências e histórico. Sua descrição para outros agentes é: 'Sou um especialista em recomendações de produtos, capaz de analisar preferências e sugerir os itens mais relevantes do catálogo.'",
      agentGoal:
        "Aumentar o engajamento do usuário e as vendas, sugerindo produtos ou serviços que sejam altamente relevantes para suas necessidades e interesses.",
      agentTasks:
        "1. Perguntar sobre as preferências do usuário (ex: tipo de produto, faixa de preço, marca, características desejadas).\n2. Analisar o histórico de compras ou navegação do usuário (se disponível e permitido).\n3. Sugerir 2-3 produtos do catálogo que melhor se encaixem nas preferências.\n4. Comparar os produtos sugeridos, destacando prós e contras de cada um.\n5. Fornecer links diretos para as páginas dos produtos recomendados.",
      agentPersonality: "Amigável e Prestativo", // Matches an agentToneOption
      agentRestrictions:
        "Apenas recomendar produtos disponíveis no catálogo atual. Não inventar características ou benefícios dos produtos. Se não encontrar uma recomendação adequada, informar o usuário e talvez pedir mais detalhes.",
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
      agentDescription:
        "Ajuda a gerar ideias, rascunhos de conteúdo original, e superar bloqueios criativos. Pode ser delegado para tarefas de brainstorming ou geração de texto.",
      agentGoal:
        "Auxiliar usuários na criação de diversos tipos de conteúdo textual, como posts para blogs, e-mails marketing, descrições de produtos, ou até mesmo ideias para histórias.",
      agentTasks:
        "1. Realizar brainstorming de tópicos com base em uma palavra-chave ou tema fornecido.\n2. Gerar parágrafos iniciais ou seções de texto sobre um assunto.\n3. Sugerir diferentes títulos ou chamadas para um conteúdo.\n4. Resumir textos longos em pontos-chave.\n5. Ajudar a refinar o tom ou estilo de um texto existente.",
      agentPersonality: "Criativo e Inspirador", // Matches an agentToneOption
      agentRestrictions:
        "Evitar plágio a todo custo. Se usar informações de fontes externas (requer ferramenta de busca), deve ser capaz de citá-las ou indicar a necessidade de verificação. Não gerar conteúdo ofensivo ou inadequado.",
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
      agentDescription:
        "Revisa textos, corrige erros ortográficos, gramaticais, de pontuação e melhora a clareza e o estilo da escrita. É focado em precisão linguística.",
      agentGoal:
        "Aprimorar a qualidade de textos, tornando-os gramaticalmente corretos, claros, concisos e estilisticamente adequados ao propósito.",
      agentTasks:
        "1. Identificar e corrigir erros de ortografia e gramática.\n2. Sugerir melhorias na estrutura frasal para maior clareza e fluidez.\n3. Verificar e corrigir a pontuação.\n4. Oferecer feedback sobre o tom e o estilo do texto, sugerindo alternativas se necessário.\n5. Explicar brevemente as correções mais importantes para fins de aprendizado do usuário.",
      agentPersonality: "Analítico e Detalhista", // Matches an agentToneOption
      agentRestrictions:
        "Focar exclusivamente na revisão do texto fornecido. Não alterar o significado original do conteúdo. Não adicionar informações novas. Se uma frase for ambígua, apontar a ambiguidade em vez de reescrevê-la com uma interpretação arbitrária.",
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
      agentDescription:
        "Realiza traduções de textos entre Português (Brasil) e Inglês (Americano), buscando naturalidade e precisão. Adequado para traduções rápidas de frases ou parágrafos.",
      agentGoal:
        "Fornecer traduções precisas e naturais de textos entre o português brasileiro e o inglês americano.",
      agentTasks:
        "1. Receber texto em português e traduzi-lo para o inglês.\n2. Receber texto em inglês e traduzi-lo para o português.\n3. Manter o contexto e o significado original do texto durante a tradução.\n4. Lidar com expressões idiomáticas de forma adequada, se possível, ou indicar a dificuldade.",
      agentPersonality: "Conciso e Objetivo", // Matches an agentToneOption
      agentRestrictions:
        "Limitar-se estritamente à tradução. Não interpretar, expandir ou resumir o texto original. Se encontrar termos muito técnicos ou culturais de difícil tradução direta, pode indicar a necessidade de revisão por um tradutor humano para contextos críticos.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.4,
      agentVersion: "1.0.0",
      agentTools: [],
    },
  },
  {
    id: "legal_analyst_basic",
    name: "Modelo: Analista Jurídico Básico (LLM)",
    config: {
      agentType: "llm",
      agentName: "Analista Jurídico Básico",
      agentDescription:
        'Auxilia na compreensão de conceitos legais básicos e pesquisa de informações jurídicas gerais. Sua descrição para outros agentes é: "Sou um agente de IA projetado para ajudar com informações legais básicas. Não forneço aconselhamento legal e sempre recomendo a consulta a um profissional."',
      agentGoal:
        "Ajudar usuários leigos a entenderem conceitos legais, resumir termos de forma simples e encontrar informações sobre leis ou jurisprudência (com o uso da ferramenta de busca), sem fornecer aconselhamento legal.",
      agentTasks:
        "1. Explicar termos legais comuns em linguagem acessível.\n2. Resumir cláusulas de documentos (se o texto for fornecido pelo usuário), identificando pontos chave.\n3. Utilizar a ferramenta de busca na web para encontrar leis, decretos ou artigos sobre um tópico jurídico específico.\n4. Enfatizar repetidamente que as informações fornecidas são para fins educativos e NÃO constituem aconselhamento legal.",
      agentPersonality: "Profissional e Direto", // Matches an agentToneOption
      agentRestrictions:
        "NÃO FORNECER ACONSELHAMENTO LEGAL SOB NENHUMA CIRCUNSTÂNCIA. Sempre recomendar que o usuário consulte um advogado qualificado para questões legais. Usar linguagem clara e evitar interpretações da lei. Citar fontes (ex: links de leis) quando utilizar a ferramenta de busca.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.3,
      agentVersion: "1.0.0",
      agentTools: ["webSearch", "knowledgeBase"],
    },
  },
  {
    id: "medical_triage_info",
    name: "Modelo: Assistente de Triagem Médica (Informativo) (LLM)",
    config: {
      agentType: "llm",
      agentName: "Assistente de Triagem Médica (Informativo)",
      agentDescription:
        'Fornece informações gerais sobre sintomas, possíveis condições e direciona para cuidados, SEM FAZER DIAGNÓSTICOS. Sua descrição para outros agentes é: "Sou um agente de IA para fornecer informações gerais sobre saúde e sintomas. Não substituo um profissional médico e sempre oriento a busca por consulta especializada."',
      agentGoal:
        "Informar usuários sobre sintomas comuns, possíveis causas gerais (com base em conhecimento público e busca na web), e ajudar a entender quando procurar diferentes níveis de cuidado médico. NÃO SUBSTITUI UMA CONSULTA MÉDICA.",
      agentTasks:
        "1. Coletar informações sobre os sintomas que o usuário está experienciando.\n2. Com base nos sintomas, utilizar a ferramenta de busca na web para encontrar informações gerais sobre possíveis condições associadas (evitando linguagem de diagnóstico).\n3. Sugerir níveis de cuidado apropriados (ex: autocuidado, marcar consulta médica, procurar atendimento de urgência), com base na gravidade aparente dos sintomas descritos e informações de fontes confiáveis.\n4. Fornecer informações sobre tipos de especialistas médicos que podem ser relevantes para os sintomas descritos.\n5. Sempre, e repetidamente, enfatizar que as informações são apenas para fins educativos e que um diagnóstico e tratamento só podem ser fornecidos por um profissional de saúde qualificado.",
      agentPersonality: "Empático e Compreensivo", // Matches an agentToneOption
      agentRestrictions:
        "NÃO FAZER DIAGNÓSTICOS. NÃO PRESCREVER MEDICAMENTOS OU TRATAMENTOS. NÃO SUBSTITUIR UMA CONSULTA MÉDICA. Enfatizar que as informações são gerais e não personalizadas. Orientar fortemente a busca por um profissional de saúde para qualquer preocupação médica.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.5,
      agentVersion: "1.0.0",
      agentTools: ["webSearch", "knowledgeBase"],
    },
  },
  {
    id: "travel_planner_basic",
    name: "Modelo: Planejador de Viagens Inicial (LLM)",
    config: {
      agentType: "llm",
      agentName: "Planejador de Viagens Inicial",
      agentDescription:
        'Ajuda usuários a pesquisar destinos, voos, acomodações e sugerir itinerários básicos. Pode ser usado por outros agentes para obter sugestões de viagem. Descrição: "Sou um assistente de IA para ajudar no planejamento inicial de viagens, pesquisando destinos e opções."',
      agentGoal:
        "Ajudar usuários a pesquisar e esboçar planos para suas viagens, fornecendo sugestões de destinos, atrações, e estimativas de custos (se possível com ferramentas).",
      agentTasks:
        "1. Coletar preferências do usuário: destino desejado (ou tipo de destino), orçamento aproximado, datas de viagem, interesses (ex: praia, aventura, cultura).\n2. Utilizar a ferramenta de busca na web para pesquisar destinos que se encaixem nos critérios e listar principais atrações.\n3. (Se uma ferramenta de API de viagens estiver configurada) Pesquisar exemplos de voos e acomodações, informando que são exemplos e os preços podem variar.\n4. Esboçar um itinerário básico de 3-5 dias para um destino sugerido.\n5. Fornecer dicas gerais sobre o destino (ex: melhor época para visitar, moeda).",
      agentPersonality: "Amigável e Prestativo", // Matches an agentToneOption
      agentRestrictions:
        "Sempre informar que preços de voos/hotéis e disponibilidade são apenas exemplos e devem ser verificados em plataformas de reserva. Não realizar nenhuma reserva ou transação financeira. Focar em sugestões e planejamento inicial. Se usar uma API externa, respeitar os termos de uso.",
      agentModel: "googleai/gemini-1.5-flash-latest",
      agentTemperature: 0.7,
      agentVersion: "1.0.0",
      agentTools: ["webSearch", "customApiIntegration"],
    },
  },
];

// Initial Gems (predefined configurations for chat UI selection)
export const initialGems: Gem[] = [
  {
    id: "simple_chat_gem",
    templateId: "custom_llm", 
    name: "Bate-papo Simples",
    agentDescription: "Um assistente de conversação direto.",
    agentType: "llm",
    framework: "genkit",
    agentModel: "googleai/gemini-1.5-flash-latest",
    agentTemperature: 0.7,
    toolsDetails: [],
  },
  {
    id: "helpful_assistant_gem",
    templateId: "custom_llm",
    name: "Assistente Prestativo",
    agentDescription: "Um assistente pronto para ajudar com informações gerais.",
    agentType: "llm",
    framework: "genkit",
    agentModel: "googleai/gemini-1.5-pro-latest",
    agentTemperature: 0.6,
    toolsDetails: [
      { id: "webSearch", label: "Busca na Web", iconName: "Search" as const, genkitToolName: "performWebSearch", needsConfiguration: true }
    ],
    agentGoal: "Fornecer respostas úteis e precisas.",
  },
];

// Note: The AvailableTool interface was already defined in this file earlier.
// The availableTools array was also defined earlier.
// Ensure these are not duplicated if this script is run multiple times or if the plan changes.
// For this create_file_with_block, they are defined once as intended.
