"use client";
// AgentBuilderDialog: Utiliza classes responsivas do Tailwind (ex: md:grid-cols-2, sm:grid-cols-2, lg:grid-cols-3)
// e overflow-y-auto para garantir a usabilidade em diferentes tamanhos de tela, apesar da densidade de informações.
// O conteúdo das abas é rolável, e o diálogo em si pode ter altura máxima controlada (max-h-[90vh]).

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
// Componente principal para criar e editar configurações de agentes.
// Permite definir nome, tipo, comportamento, ferramentas, memória, RAG, artefatos e configurações multi-agente/A2A.
import { CommunicationChannelItem } from "./a2a-communication-channel";
import { MemoryServiceType } from "./memory-knowledge-tab"; // Ensure this matches the type used in RagMemoryConfig definition
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertCircle, 
  Ban, 
  Brain, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp, 
  Cpu, 
  FileJson, 
  Info, 
  Layers, 
  ListChecks, 
  Loader2, 
  Network, 
  Plus, 
  Save, 
  Search, 
  Settings, 
  Settings2, 
  Smile, 
  Target, 
  Trash2, 
  Users, 
  Wand2, 
  Workflow, 
  X,
  Copy,
  ChevronsUpDown,
  PlusCircle,
  FileText,
  Database,
  Waypoints,
  Share2,
  UploadCloud,
  Binary,
  Palette
} from "lucide-react";

import { v4 as uuidv4 } from "uuid";
import { zodResolver } from "@hookform/resolvers/zod";
// Consolidated imports:
import {
  AgentFramework,
  AgentConfig,
  SavedAgentConfiguration,
  A2AConfig,
  RagMemoryConfig,
  ArtifactDefinition,
  ToolConfigData,
  LLMAgentConfig,
  WorkflowAgentConfig,
  CustomAgentConfig
} from "@/types/agent-configs";
import type { KnowledgeSource } from "@/components/features/agent-builder/memory-knowledge-tab"; // Correct import for KnowledgeSource
import { availableTools as availableToolsList } from "@/data/available-tools"; 
import { useAgents } from "@/contexts/AgentsContext";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubAgentSelector } from "@/components/features/agent-builder/sub-agent-selector";
import { cn } from "@/lib/utils";
import type { ClassValue } from 'clsx';

// agent-types imports:
import {
  AvailableTool,
  TerminationConditionType
  // A2AConfigType is removed in favor of A2AConfig from agent-configs
  // ArtifactDefinition and RagMemoryConfig are taken from agent-configs
} from "@/types/agent-types";
// Removed redundant local type definitions for TerminationConditionType and A2AConfigType

import { AgentTemplate } from "@/data/agentBuilderConfig";

interface AgentBuilderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingAgent: SavedAgentConfiguration | null;
  onSave: (agentConfig: SavedAgentConfiguration) => void;
  availableTools: AvailableTool[];
  agentTypeOptions: Array<{ id: "llm" | "workflow" | "custom" | "a2a"; label: string; icon?: React.ReactNode; description: string; }>;
  agentToneOptions: { id: string; label: string; }[];
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>; // Mapeamento de nomes de ícones para componentes React, usado na aba Ferramentas.
  agentTemplates: AgentTemplate[];
}

const AgentBuilderDialog: React.FC<AgentBuilderDialogProps> = ({
  isOpen,
  onOpenChange,
  editingAgent,
  onSave,
  availableTools,
  agentTypeOptions,
  agentToneOptions,
  iconComponents,
}) => {
  // --- Estados para Propriedades Gerais do Agente ---
  const [agentName, setAgentName] = React.useState<string>(""); // Nome do agente.
  const [agentDescription, setAgentDescription] = React.useState<string>(""); // Descrição do agente.
  const [agentVersion, setAgentVersion] = React.useState<string>("1.0.0"); // Versão do agente.
  const [agentFramework, setAgentFramework] = React.useState<string>("genkit"); // Framework utilizado pelo agente (ex: Genkit, CrewAI).
  const [selectedAgentType, setSelectedAgentType] = React.useState<"llm" | "workflow" | "custom" | "a2a">("llm"); // Tipo do agente (LLM, Workflow, Customizado, A2A).

  // --- Estados para Propriedades Multi-Agente ---
  const [isRootAgent, setIsRootAgent] = React.useState<boolean>(true); // Indica se o agente é o agente raiz/orquestrador.
  const [subAgentIds, setSubAgentIds] = React.useState<string[]>([]); // Lista de IDs de sub-agentes ou colaboradores.

  // --- Estados para Comportamento e Prompting (Comum a todos os tipos) ---
  const [globalInstruction, setGlobalInstruction] = React.useState<string>(""); // Instrução global ou prompt de sistema primário.
  const [systemPromptGenerated, setSystemPromptGenerated] = React.useState<string>(""); // Preview do prompt de sistema gerado (para agentes LLM).

  // --- Estados para Comportamento e Prompting (Específico para LLM) ---
  const [agentGoal, setAgentGoal] = React.useState<string>(""); // Objetivo principal do agente LLM.
  const [agentTasks, setAgentTasks] = React.useState<string[]>([]); // Lista de tarefas principais do agente LLM.
  const [agentPersonality, setAgentPersonality] = React.useState<string>(agentToneOptions[0]?.id || ""); // Personalidade ou tom do agente LLM.
  const [agentRestrictions, setAgentRestrictions] = React.useState<string[]>([]); // Lista de restrições ou comportamentos a evitar.
  const [agentModel, setAgentModel] = React.useState<string>("gemini-1.5-flash"); // Modelo de linguagem a ser usado.
  const [agentTemperature, setAgentTemperature] = React.useState<number>(0.7); // Temperatura para controlar a criatividade do LLM.

  // --- Estados para Comportamento e Prompting (Específico para Workflow) ---
  const [detailedWorkflowType, setDetailedWorkflowType] = React.useState<string>("sequential"); // Tipo detalhado de workflow (sequencial, grafo, máquina de estados).
  const [workflowDescription, setWorkflowDescription] = React.useState<string>(""); // Descrição do workflow.
  const [loopMaxIterations, setLoopMaxIterations] = React.useState<number | undefined>(undefined); // Número máximo de iterações para workflows com loops.

  // --- Estados para Gerenciamento de Artefatos ---
  const [enableArtifacts, setEnableArtifacts] = React.useState<boolean>(false); // Controla se o armazenamento de artefatos está habilitado.
  const [artifactStorageType, setArtifactStorageType] = React.useState<'memory' | 'local' | 'cloud'>('memory'); // Tipo de armazenamento para artefatos (memória, sistema de arquivos local, nuvem). Aligned with AgentConfig type.
  const [artifacts, setArtifacts] = React.useState<ArtifactDefinition[]>([]); // Lista de definições de artefatos que o agente pode produzir ou consumir.
  const [cloudStorageBucket, setCloudStorageBucket] = React.useState<string>(""); // Nome do bucket na nuvem para armazenamento de artefatos.
  const [localStoragePath, setLocalStoragePath] = React.useState<string>(""); // Caminho no sistema de arquivos local para armazenamento de artefatos, usado se `artifactStorageType` for 'filesystem'.

  // --- Estado para Ferramentas Selecionadas ---
  const [selectedTools, setSelectedTools] = React.useState<string[]>([]); // Lista de IDs das ferramentas que o agente está configurado para usar.

  // --- Estados para RAG (Retrieval Augmented Generation) ---
  const initialRagMemoryConfig: RagMemoryConfig = { // Configuração inicial/padrão para RAG. Usada ao criar um novo agente ou se nenhuma configuração RAG existir.
      enabled: false, // Chave interna da configuração RAG, indica se esta configuração específica está ativa (pode ser diferente de `enableRAG` que controla a UI).
      serviceType: 'vertexAISearch', // Tipo de serviço backend para RAG (ex: Vertex AI Search, Pinecone).
      projectId: '', // ID do projeto cloud (GCP) para serviços como Vertex AI Search.
      location: '', // Localização (região) do serviço RAG na nuvem.
      ragCorpusName: '', // Nome do corpus, índice ou datastore usado pelo serviço RAG.
      similarityTopK: 5, // Número de resultados mais similares a serem recuperados pelo RAG.
      vectorDistanceThreshold: 0.5, // Limiar de distância vetorial para considerar um resultado relevante.
      embeddingModel: '', // Modelo de embedding a ser usado para vetorizar o conteúdo para RAG.
      knowledgeSources: [], // Lista de fontes de conhecimento (documentos, URLs, etc.) para o RAG.
      includeConversationContext: true, // Se o contexto da conversa atual deve ser usado para enriquecer a query RAG.
      persistentMemory: false, // Se a memória de conhecimento do RAG deve ser persistente.
  };
  const [ragMemoryConfig, setRagMemoryConfig] = React.useState<RagMemoryConfig>(initialRagMemoryConfig); // Objeto que armazena a configuração detalhada do RAG.
  const [enableRAG, setEnableRAG] = React.useState<boolean>(false); // Chave booleana geral para habilitar/desabilitar a seção RAG na UI.

  // --- Estado para Configuração A2A (Agent-to-Agent Communication) ---
  const initialA2AConfig: A2AConfig = { // Configuração inicial/padrão para A2A using imported A2AConfig type.
      enabled: false, // Indica se a comunicação A2A está habilitada para o agente.
      communicationChannels: [], // Lista de canais de comunicação (ex: direct, message_queue) configurados para A2A.
      defaultResponseFormat: 'text', // Formato padrão das respostas nas comunicações A2A.
      maxMessageSize: 1024 * 1024, // Tamanho máximo (em bytes) para mensagens trocadas via A2A.
      loggingEnabled: false, // Se o logging detalhado deve ser habilitado para a comunicação A2A.
  };
  const [a2aConfig, setA2AConfig] = React.useState<A2AConfig>(initialA2AConfig); // Objeto que armazena a configuração detalhada para comunicação A2A.

  // --- Estados para Campos de Workflow (relevante se `selectedAgentType` for 'workflow') ---
  const [loopTerminationConditionType, setLoopTerminationConditionType] = React.useState<TerminationConditionType>("none"); // Define como um loop em um workflow pode ser terminado (ex: 'none', 'tool_success', 'state_change').
  const [loopExitToolName, setLoopExitToolName] = React.useState<string | undefined>(undefined); // Nome da ferramenta cuja execução bem-sucedida pode indicar a saída de um loop.
  const [loopExitStateKey, setLoopExitStateKey] = React.useState<string | undefined>(undefined); // Chave no estado do agente que, ao mudar para `loopExitStateValue`, pode indicar a saída de um loop.
  const [loopExitStateValue, setLoopExitStateValue] = React.useState<string | undefined>(undefined); // Valor específico da `loopExitStateKey` que indica a saída de um loop.

  // --- Estado para Descrição de Lógica Customizada (relevante se `selectedAgentType` for 'custom') ---
  const [customLogicDescription, setCustomLogicDescription] = React.useState<string>(""); // Descrição textual da lógica customizada que o agente deve executar.

  // --- Estados para Configuração de Ferramentas e Modal de Configuração ---
  const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, ToolConfigData>>({}); // Mapeamento (dicionário) de ID de ferramenta para sua configuração de dados específica.
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false); // Controla a visibilidade do modal de configuração de ferramenta.
  const [configuringTool, setConfiguringTool] = React.useState<AvailableTool | null>(null); // Armazena o objeto da ferramenta que está sendo configurada no modal.

  // --- Estados para Persistência de Estado e Memória ---
  const [enableStatePersistence, setEnableStatePersistence] = React.useState<boolean>(false); // Chave booleana para habilitar/desabilitar a persistência de estado do agente.
  const [statePersistenceType, setStatePersistenceType] = React.useState<string>("session"); // Define o tipo de persistência de estado (ex: 'session' para temporário, 'memory' para vida do processo, 'database' para persistente).
  const [initialStateValues, setInitialStateValues] = React.useState<Array<{key: string, value: string}>>([]); // Lista de pares chave-valor que definem o estado inicial do agente.

  // --- Estados para Campos do Modal de Configuração de Ferramentas ---
  // Estes estados armazenam temporariamente os valores dos campos de configuração de uma ferramenta específica enquanto o usuário os edita no modal.
  const [modalGoogleApiKey, setModalGoogleApiKey] = React.useState<string>(''); // Chave API Google para a ferramenta WebSearch.
  const [modalGoogleCseId, setModalGoogleCseId] = React.useState<string>(''); // ID do Mecanismo de Busca Personalizado Google para WebSearch.
  const [modalOpenapiSpecUrl, setModalOpenapiSpecUrl] = React.useState<string>(''); // URL da especificação OpenAPI para a ferramenta Custom API Integration.
  // Chave de API para a integração de API customizada.
  // ATENÇÃO: Armazenar segredos diretamente na configuração do agente na UI é arriscado.
  // Considere o uso de um gerenciador de segredos ou configuração via backend para produção.
  const [modalOpenapiApiKey, setModalOpenapiApiKey] = React.useState<string>(''); // Chave de API (opcional) para a ferramenta Custom API Integration.
  const [modalDbType, setModalDbType] = React.useState<string>(''); // Tipo de banco de dados para a ferramenta Database Access (ex: 'postgresql', 'mysql').
  const [modalDbHost, setModalDbHost] = React.useState<string>(''); // Host do banco de dados.
  const [modalDbPort, setModalDbPort] = React.useState<number>(0); // Porta do banco de dados.
  const [modalDbName, setModalDbName] = React.useState<string>(''); // Nome do banco de dados.
  const [modalDbUser, setModalDbUser] = React.useState<string>(''); // Nome de usuário para acesso ao banco de dados.
  // Senha para acesso ao banco de dados.
  // ATENÇÃO: Armazenar segredos diretamente na configuração do agente na UI é arriscado.
  // Considere o uso de um gerenciador de segredos ou configuração via backend para produção.
  const [modalDbPassword, setModalDbPassword] = React.useState<string>(''); // Senha para acesso ao banco de dados.
  const [modalDbConnectionString, setModalDbConnectionString] = React.useState<string>(''); // String de conexão completa para o banco de dados (alternativa aos campos individuais).
  const [modalDbDescription, setModalDbDescription] = React.useState<string>(''); // Descrição do esquema do banco ou tabelas relevantes, para ajudar o agente a formular queries.
  const [modalKnowledgeBaseId, setModalKnowledgeBaseId] = React.useState<string>(''); // ID da base de conhecimento para a ferramenta Knowledge Base (RAG).
  const [modalCalendarApiEndpoint, setModalCalendarApiEndpoint] = React.useState<string>(''); // Endpoint da API de Calendário ou ID de fluxo Genkit para a ferramenta Calendar Access.

  const { toast } = useToast(); // Hook para exibir notificações (toasts).
  const { savedAgents: allSavedAgents } = useAgents(); // Para popular o seletor de sub-agentes.

  // Memoiza a lista de agentes disponíveis para seleção como sub-agentes, excluindo o agente atualmente em edição.
  // (Removido: bloco de declarações duplicadas de useState)
  // (Removido: Função handleFieldChange que não estava sendo utilizada consistentemente e causava problemas com estados duplicados)
  // (Removido: duplicidades de estados para gerenciamento de estado, memória e RAG)
  // (Removido: bloco de declarações duplicadas de useState para artifacts, selectedTools, RAG, A2A, workflow, customLogic, toolConfigurations, state/memory)
  // Modal specific states for tool configuration
  // Os estados do modal (modalGoogleApiKey, etc.) são declarados uma vez no início e mantidos.
  const [modalGoogleApiKey, setModalGoogleApiKey] = React.useState<string>('');
  const [modalGoogleCseId, setModalGoogleCseId] = React.useState<string>('');
  const [modalOpenapiSpecUrl, setModalOpenapiSpecUrl] = React.useState<string>('');
  const [modalOpenapiApiKey, setModalOpenapiApiKey] = React.useState<string>('');
  const [modalDbType, setModalDbType] = React.useState<string>('');
  const [modalDbHost, setModalDbHost] = React.useState<string>('');
  const [modalDbPort, setModalDbPort] = React.useState<number>(0);
  const [modalDbName, setModalDbName] = React.useState<string>('');
  const [modalDbUser, setModalDbUser] = React.useState<string>('');
  const [modalDbPassword, setModalDbPassword] = React.useState<string>('');
  const [modalDbConnectionString, setModalDbConnectionString] = React.useState<string>('');
  const [modalDbDescription, setModalDbDescription] = React.useState<string>('');
  const [modalKnowledgeBaseId, setModalKnowledgeBaseId] = React.useState<string>('');
  const [modalCalendarApiEndpoint, setModalCalendarApiEndpoint] = React.useState<string>('');

  const { savedAgents: allSavedAgents } = useAgents(); // For SubAgentSelector

  const availableAgentsForSubSelector = React.useMemo(() =>
    allSavedAgents.filter(agent => agent.id !== editingAgent?.id),
    [allSavedAgents, editingAgent?.id]
  );

  // Opções fixas para o seletor de framework do agente.
  const agentFrameworkOptions = [
    { id: "genkit", label: "Genkit" },
    { id: "crewai", label: "CrewAI" },
    { id: "custom", label: "Custom Framework" },
  ];

  // Efeito para inicializar ou resetar o estado do formulário quando o diálogo é aberto ou o agente em edição muda.
  // Popula os campos com os dados do `editingAgent` se estiver editando, ou reseta para valores padrão se for um novo agente.
  React.useEffect(() => {
    if (isOpen) {
      if (editingAgent) {
        // Preenche o formulário com os dados de um agente existente.
        // Populate with editingAgent data
        setAgentName(editingAgent.agentName || "Novo Agente");
        setAgentDescription(editingAgent.description || ""); // Uses editingAgent.description
        setAgentVersion(editingAgent.version || "1.0.0"); // Uses editingAgent.version

        const agentConfig = editingAgent.config; // Acessa a configuração central do agente.

        setSelectedAgentType(agentConfig.type || "llm");
        setAgentFramework(agentConfig.framework || "genkit");
        setIsRootAgent(agentConfig.isRootAgent !== undefined ? agentConfig.isRootAgent : true);
        setSubAgentIds(agentConfig.subAgentIds || []);
        setGlobalInstruction(agentConfig.globalInstruction || "");

        // Preenche campos específicos do tipo LLM.
        if (agentConfig.type === "llm") {
          const llmConfig = agentConfig as LLMAgentConfig;
          setAgentGoal(llmConfig.agentGoal || "");
          setAgentTasks(llmConfig.agentTasks || []);
          setAgentPersonality(llmConfig.agentPersonality || agentToneOptions[0]?.id || "");
          setAgentRestrictions(llmConfig.agentRestrictions || []);
          setAgentModel(llmConfig.agentModel || "gemini-1.5-flash");
          setAgentTemperature(llmConfig.agentTemperature !== undefined ? llmConfig.agentTemperature : 0.7);
          setSystemPromptGenerated(llmConfig.systemPromptGenerated || "");
        } else { // Reseta campos LLM se o tipo não for LLM.
          setAgentGoal(""); setAgentTasks([]); setAgentPersonality(agentToneOptions[0]?.id || ""); setAgentRestrictions([]);
          setAgentModel("gemini-1.5-flash"); setAgentTemperature(0.7); setSystemPromptGenerated("");
        }

        // Preenche campos específicos do tipo Workflow.
        if (agentConfig.type === "workflow") {
          const workflowConfig = agentConfig as WorkflowAgentConfig;
          setDetailedWorkflowType(workflowConfig.detailedWorkflowType || "sequential");
          setWorkflowDescription(workflowConfig.workflowDescription || "");
          setLoopMaxIterations(workflowConfig.loopMaxIterations);
          setLoopTerminationConditionType(workflowConfig.loopTerminationConditionType || "none");
          setLoopExitToolName(workflowConfig.loopExitToolName);
          setLoopExitStateKey(workflowConfig.loopExitStateKey);
          setLoopExitStateValue(workflowConfig.loopExitStateValue);
        } else { // Reseta campos de Workflow.
            setDetailedWorkflowType("sequential"); setWorkflowDescription(""); setLoopMaxIterations(undefined);
            setLoopTerminationConditionType("none"); setLoopExitToolName(undefined);
            setLoopExitStateKey(undefined); setLoopExitStateValue(undefined);
        }

        // Preenche campos específicos do tipo Custom.
        if (agentConfig.type === "custom") {
            const customConfig = agentConfig as CustomAgentConfig;
            setCustomLogicDescription(customConfig.customLogicDescription || "");
        } else { // Reseta campos Custom.
            setCustomLogicDescription("");
        }

        setSelectedTools(editingAgent.tools || []);
        setToolConfigurations(editingAgent.toolConfigsApplied || {});

        // Configurações de persistência de estado.
        setEnableStatePersistence(agentConfig.statePersistence?.enabled || false);
        setStatePersistenceType(agentConfig.statePersistence?.type || "session");
        setInitialStateValues(agentConfig.statePersistence?.initialState || []);

        // Configurações de RAG.
        setEnableRAG(agentConfig.rag?.enabled || false);
        // Uses initialRagMemoryConfig defined at the top of the component
        setRagMemoryConfig(agentConfig.rag?.config ? {...initialRagMemoryConfig, ...agentConfig.rag.config} : initialRagMemoryConfig);

        // Configurações de Artefatos.
        setEnableArtifacts(agentConfig.artifacts?.enabled || false);
        const artifactStorageTypeValue = agentConfig.artifacts?.storageType;
        // Ensures artifactStorageType is one of the valid literals from AgentConfig.
        let validArtifactStorageType: 'memory' | 'local' | 'cloud' = 'memory';
        if (artifactStorageTypeValue === 'memory' || artifactStorageTypeValue === 'local' || artifactStorageTypeValue === 'cloud') {
            validArtifactStorageType = artifactStorageTypeValue;
        } else if (artifactStorageTypeValue === 'filesystem') { // Handle UI 'filesystem' as 'local' for config
            validArtifactStorageType = 'local';
        }
        setArtifactStorageType(validArtifactStorageType);
        setCloudStorageBucket(agentConfig.artifacts?.cloudStorageBucket || "");
        setLocalStoragePath(agentConfig.artifacts?.localStoragePath || "./artifacts"); // Default to ./artifacts
        setArtifacts(agentConfig.artifacts?.definitions || []);

        // Configurações A2A.
        // Uses initialA2AConfig (now typed with imported A2AConfig)
        setA2AConfig(agentConfig.a2a ? {
            ...initialA2AConfig, // Start with defaults to ensure all keys are present
            ...agentConfig.a2a, // Override with saved data
            maxMessageSize: agentConfig.a2a.maxMessageSize ?? initialA2AConfig.maxMessageSize,
            defaultResponseFormat: agentConfig.a2a.defaultResponseFormat || initialA2AConfig.defaultResponseFormat,
            communicationChannels: Array.isArray(agentConfig.a2a.communicationChannels)
                ? agentConfig.a2a.communicationChannels
                : initialA2AConfig.communicationChannels,
        } : initialA2AConfig);

      } else {
        // Reseta todos os campos para valores padrão ao criar um novo agente.
        // agentName, agentDescription, agentVersion are reset using their setters
        setAgentName(""); setAgentDescription(""); setAgentVersion("1.0.0"); // Standard defaults
        setSelectedAgentType("llm"); setAgentFramework("genkit"); // Standard defaults
        setIsRootAgent(true); setSubAgentIds([]); // Standard defaults
        setGlobalInstruction(""); setSystemPromptGenerated(""); // Standard defaults
        setAgentGoal(""); setAgentTasks([]); setAgentPersonality(agentToneOptions[0]?.id || ""); setAgentRestrictions([]); // Standard LLM defaults
        setAgentModel("gemini-1.5-flash"); setAgentTemperature(0.7); // Standard LLM defaults

        setDetailedWorkflowType("sequential"); setWorkflowDescription(""); setLoopMaxIterations(undefined); // Standard Workflow defaults
        setLoopTerminationConditionType("none"); setLoopExitToolName(undefined); // Standard Workflow defaults
        setLoopExitStateKey(undefined); setLoopExitStateValue(undefined); // Standard Workflow defaults

        setCustomLogicDescription(""); // Standard Custom default
        setSelectedTools([]); setToolConfigurations({}); // Standard Tool defaults
        setEnableStatePersistence(false); setStatePersistenceType("session"); setInitialStateValues([]); // Standard State Persistence defaults
        setEnableRAG(false); // Standard RAG default
        setRagMemoryConfig(initialRagMemoryConfig); // Resets to initialRagMemoryConfig
        setEnableArtifacts(false); setArtifactStorageType('memory'); setCloudStorageBucket(""); setLocalStoragePath("./artifacts"); setArtifacts([]); // Standard Artifact defaults, storage type is 'memory'
        setA2AConfig(initialA2AConfig); // Resets to initialA2AConfig
      }
    }
    // Limpa o estado do modal de configuração de ferramenta se o diálogo principal for fechado.
    if (!isOpen) {
        setIsToolConfigModalOpen(false);
        setConfiguringTool(null);
    }
  }, [isOpen, editingAgent, agentToneOptions]); // Dependências do efeito.

  // Manipulador para abrir o modal de configuração de uma ferramenta específica.
  // Popula os campos do modal com a configuração existente da ferramenta, se houver.
  const handleToolConfigure = (tool: AvailableTool) => {
    setConfiguringTool(tool);
    const existingConfig = toolConfigurations[tool.id] || {};

    // Reseta todos os estados do modal para garantir que não haja dados de configurações anteriores.
    setModalGoogleApiKey(''); setModalGoogleCseId('');
    setModalOpenapiSpecUrl(''); setModalOpenapiApiKey('');
    setModalDbType(''); setModalDbHost(''); setModalDbPort(0); setModalDbName('');
    setModalDbUser(''); setModalDbPassword(''); setModalDbConnectionString(''); setModalDbDescription('');
    setModalKnowledgeBaseId(''); setModalCalendarApiEndpoint('');

    // Preenche os estados do modal com base na configuração existente da ferramenta selecionada.
    if (tool.id === "webSearch") {
      setModalGoogleApiKey(existingConfig.googleApiKey || '');
      setModalGoogleCseId(existingConfig.googleCseId || '');
    } else if (tool.id === "customApiIntegration") {
      setModalOpenapiSpecUrl(existingConfig.openapiSpecUrl || '');
      setModalOpenapiApiKey(existingConfig.openapiApiKey || '');
    } else if (tool.id === "databaseAccess") {
      setModalDbType(existingConfig.dbType || '');
      setModalDbHost(existingConfig.dbHost || '');
      setModalDbPort(Number(existingConfig.dbPort) || 0);
      setModalDbName(existingConfig.dbName || '');
      setModalDbUser(existingConfig.dbUser || '');
      setModalDbPassword(existingConfig.dbPassword || '');
      setModalDbConnectionString(existingConfig.dbConnectionString || '');
      setModalDbDescription(existingConfig.dbDescription || '');
    } else if (tool.id === "knowledgeBase") {
      setModalKnowledgeBaseId(existingConfig.knowledgeBaseId || '');
    } else if (tool.id === "calendarAccess") {
      setModalCalendarApiEndpoint(existingConfig.calendarApiEndpoint || '');
    }
    setIsToolConfigModalOpen(true); // Abre o modal.
  };

  // Salva a configuração da ferramenta que estava sendo editada no modal.
  const handleSaveToolConfiguration = () => {
    if (!configuringTool) return;

    const newConfig: ToolConfigData = {};

    // Coleta os dados dos estados do modal para a ferramenta específica.
    if (configuringTool.id === "webSearch") {
      newConfig.googleApiKey = modalGoogleApiKey;
      newConfig.googleCseId = modalGoogleCseId;
    } else if (configuringTool.id === "customApiIntegration") {
      newConfig.openapiSpecUrl = modalOpenapiSpecUrl;
      newConfig.openapiApiKey = modalOpenapiApiKey; // Risco de segurança: Chave API armazenada.
    } else if (configuringTool.id === "databaseAccess") {
      newConfig.dbType = modalDbType;
      newConfig.dbHost = modalDbHost;
      newConfig.dbPort = String(modalDbPort);
      newConfig.dbName = modalDbName;
      newConfig.dbUser = modalDbUser;
      newConfig.dbPassword = modalDbPassword; // Risco de segurança: Senha armazenada.
      newConfig.dbConnectionString = modalDbConnectionString;
      newConfig.dbDescription = modalDbDescription;
    } else if (configuringTool.id === "knowledgeBase") {
      newConfig.knowledgeBaseId = modalKnowledgeBaseId;
    } else if (configuringTool.id === "calendarAccess") {
      newConfig.calendarApiEndpoint = modalCalendarApiEndpoint;
    }

    // Atualiza o estado `toolConfigurations` com a nova configuração para a ferramenta.
    setToolConfigurations((prev: Record<string, ToolConfigData>) => ({ ...prev, [configuringTool.id!]: newConfig }));
    setIsToolConfigModalOpen(false); // Fecha o modal.
    setConfiguringTool(null); // Limpa a ferramenta em configuração.

    const toolDisplayName = configuringTool.name || configuringTool.id;
    toast({ title: `Configuração salva para ${toolDisplayName}` });
  };

  // Manipulador para construir o objeto de configuração do agente e salvá-lo.
  // Reúne todos os estados do formulário, constrói o objeto `AgentConfig` aninhado
  // e, em seguida, o objeto `SavedAgentConfiguration` completo para ser passado à função `onSave`.
  const handleSaveAgent = () => {
    if (!agentName.trim()) {
      toast({ title: "Erro de Validação", description: "O nome do agente é obrigatório.", variant: "destructive" });
      return;
    }

    // Constrói o objeto `coreConfig` com base no tipo de agente selecionado.
    // Este objeto representa a configuração central do agente.
    let coreConfig: AgentConfig;

    // Mapeamento de estados da UI para a estrutura de `coreConfig` para agente LLM.
    if (selectedAgentType === "llm") {
      coreConfig = {
        type: "llm", // Tipo do agente.
        framework: agentFramework, // Framework (Genkit, CrewAI, etc.).
        isRootAgent, // Se é agente raiz.
        subAgentIds, // IDs de sub-agentes.
        globalInstruction, // Instrução global/prompt de sistema.
        statePersistence: { enabled: enableStatePersistence, type: statePersistenceType, initialState: initialStateValues }, // Configuração de persistência de estado.
        rag: { enabled: enableRAG, config: ragMemoryConfig }, // Configuração RAG.
        artifacts: { // Configuração de artefatos.
          enabled: enableArtifacts, storageType: artifactStorageType,
          cloudStorageBucket: artifactStorageType === 'cloud' ? cloudStorageBucket : undefined,
          localStoragePath: artifactStorageType === 'local' ? localStoragePath : undefined, // Save path if 'local' (formerly 'filesystem' in UI state)
        type: "llm",
        framework: agentFramework as AgentFramework,
        isRootAgent, subAgentIds, globalInstruction,
        statePersistence: { enabled: enableStatePersistence, type: statePersistenceType, initialState: initialStateValues },
        rag: { enabled: enableRAG, config: ragMemoryConfig },
        artifacts: {
          enabled: enableArtifacts, storageType: artifactStorageType,
          cloudStorageBucket: artifactStorageType === 'cloud' ? cloudStorageBucket : undefined,
          localStoragePath: artifactStorageType === 'local' ? localStoragePath : undefined,
          definitions: artifacts
        },
        a2a: a2aConfig, // Configuração A2A.
        // Campos específicos do LLMAgentConfig:
        agentGoal, // Mapeado de `agentGoal` (estado).
        agentTasks, // Mapeado de `agentTasks` (estado).
        agentPersonality, // Mapeado de `agentPersonality` (estado).
        agentRestrictions, // Mapeado de `agentRestrictions` (estado).
        agentModel, // Mapeado de `agentModel` (estado).
        agentTemperature, // Mapeado de `agentTemperature` (estado).
        systemPromptGenerated, // Mapeado de `systemPromptGenerated` (estado).
      };
    }
    // Mapeamento para agente Workflow.
    else if (selectedAgentType === "workflow") {
      coreConfig = {
        type: "workflow",
        framework: agentFramework as AgentFramework,
        isRootAgent, subAgentIds, globalInstruction,
        statePersistence: { enabled: enableStatePersistence, type: statePersistenceType, initialState: initialStateValues },
        rag: { enabled: enableRAG, config: ragMemoryConfig },
        artifacts: {
          enabled: enableArtifacts, storageType: artifactStorageType,
          cloudStorageBucket: artifactStorageType === 'cloud' ? cloudStorageBucket : undefined,
          localStoragePath: artifactStorageType === 'local' ? localStoragePath : undefined,
          definitions: artifacts
        },
        a2a: a2aConfig,
        // Campos específicos do WorkflowAgentConfig:
        detailedWorkflowType, // Mapeado de `detailedWorkflowType` (estado).
        workflowDescription, // Mapeado de `workflowDescription` (estado).
        loopMaxIterations, // Mapeado de `loopMaxIterations` (estado).
        loopTerminationConditionType, // Mapeado de `loopTerminationConditionType` (estado).
        loopExitToolName, // Mapeado de `loopExitToolName` (estado).
        loopExitStateKey, // Mapeado de `loopExitStateKey` (estado).
        loopExitStateValue, // Mapeado de `loopExitStateValue` (estado).
      };
    }
    // Mapeamento para agente Customizado.
    else if (selectedAgentType === "custom") {
      coreConfig = {
        type: "custom",
        framework: agentFramework as AgentFramework,
        isRootAgent, subAgentIds, globalInstruction,
        statePersistence: { enabled: enableStatePersistence, type: statePersistenceType, initialState: initialStateValues },
        rag: { enabled: enableRAG, config: ragMemoryConfig },
        artifacts: {
          enabled: enableArtifacts, storageType: artifactStorageType,
          cloudStorageBucket: artifactStorageType === 'cloud' ? cloudStorageBucket : undefined,
          localStoragePath: artifactStorageType === 'local' ? localStoragePath : undefined,
          definitions: artifacts
        },
        a2a: a2aConfig,
        // Campos específicos do CustomAgentConfig:
        customLogicDescription, // Mapeado de `customLogicDescription` (estado).
      };
    }
    // Mapeamento para agente A2A.
    else if (selectedAgentType === "a2a") {
      coreConfig = {
        type: "a2a",
        framework: agentFramework as AgentFramework,
        isRootAgent, subAgentIds, globalInstruction,
        statePersistence: { enabled: enableStatePersistence, type: statePersistenceType, initialState: initialStateValues },
        rag: { enabled: enableRAG, config: ragMemoryConfig },
        artifacts: {
          enabled: enableArtifacts, storageType: artifactStorageType,
          cloudStorageBucket: artifactStorageType === 'cloud' ? cloudStorageBucket : undefined,
          localStoragePath: artifactStorageType === 'local' ? localStoragePath : undefined,
          definitions: artifacts
        },
        a2a: a2aConfig, // Configuração A2A é a principal para este tipo, mapeada de `a2aConfig` (estado).
      };
    } else {
      // Este caso não deve ocorrer se a UI estiver correta.
      toast({ title: "Erro Interno", description: "Tipo de agente desconhecido ao salvar.", variant: "destructive" });
      return;
    }

    // Constrói o objeto final `SavedAgentConfiguration` que será salvo.
    const agentDataToSave: SavedAgentConfiguration = {
      id: editingAgent?.id || uuidv4(),
      templateId: editingAgent?.templateId || 'custom_manual_dialog',
      agentName: agentName, // Renamed from 'name' in new SavedAgentConfiguration
      description: agentDescription, // Corrected from agentDescription
      version: agentVersion, // Corrected from agentVersion
      icon: editingAgent?.icon || `${selectedAgentType}-agent-icon.svg`, // Default icon if new
      config: coreConfig, // The fully constructed core configuration
      tools: selectedTools, // Renamed from agentTools to match SavedAgentConfiguration type
      toolConfigsApplied: toolConfigurations,
      toolsDetails: selectedTools
        .map(toolId => {
            const toolDetail = availableTools.find(t => t.id === toolId);
            return toolDetail ? {
                id: toolDetail.id,
                name: toolDetail.name,
                label: toolDetail.label, // AvailableTool has label
                description: toolDetail.description,
                iconName: typeof toolDetail.icon === 'string' && iconComponents[toolDetail.icon]
                    ? toolDetail.icon
                    : (typeof toolDetail.icon === 'string' ? toolDetail.icon : "Settings"), // Use string icon key directly, or default
                hasConfig: toolDetail.hasConfig,
                genkitToolName: toolDetail.genkitToolName
            } : null;
        })
        .filter(Boolean) as SavedAgentConfiguration['toolsDetails'],
      createdAt: editingAgent?.createdAt || new Date().toISOString(), // Data de criação ou mantém a original.
      updatedAt: new Date().toISOString(), // Data da última atualização.
    };

    onSave(agentDataToSave); // Chama a função de callback para salvar.
    toast({ title: "Agente Salvo", description: `${agentName} foi salvo com sucesso.` });
    onOpenChange(false); // Fecha o diálogo.
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Garante que o modal de configuração de ferramenta seja fechado se o diálogo principal for fechado.
      if (!open && configuringTool) {
        setIsToolConfigModalOpen(false);
        setConfiguringTool(null);
      } else if (!open) {
        setConfiguringTool(null);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{editingAgent ? "Editar Agente" : "Criar Novo Agente"}</DialogTitle>
          <DialogDescription>
            {editingAgent ? `Modifique os detalhes do agente ${editingAgent.agentName}.` : "Configure um novo agente para suas tarefas."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto"> {/* Área de conteúdo principal com scroll */}
          <Tabs defaultValue="general" className="w-full p-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 mb-4 sticky top-0 bg-background z-10">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="behavior">Comportamento</TabsTrigger>
              <TabsTrigger value="tools">Ferramentas</TabsTrigger>
              <TabsTrigger value="memory">Estado & Memória</TabsTrigger>
              <TabsTrigger value="rag">RAG</TabsTrigger>
              <TabsTrigger value="artifacts">Artefatos</TabsTrigger>
              <TabsTrigger value="multiAgent">Multi-Agente</TabsTrigger>
              <TabsTrigger value="advanced">Avançado/A2A</TabsTrigger>
            </TabsList>

            {/* Aba Geral: Contém as configurações fundamentais do agente, como nome, descrição, tipo e o framework subjacente. */}
            <TabsContent value="general" className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="agentName">Nome do Agente</Label>
                  <Input id="agentName" placeholder="Ex: Agente de Pesquisa Avançada" value={agentName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgentName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentVersion">Versão</Label>
                  <Input id="agentVersion" placeholder="Ex: 1.0.1" value={agentVersion} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgentVersion(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentDescription">Descrição do Agente</Label>
                <Textarea id="agentDescription" placeholder="Descreva o propósito principal, capacidades e limitações do agente." value={agentDescription} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAgentDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="selectedAgentType">Tipo de Agente</Label>
                  <Select value={selectedAgentType} onValueChange={(value: "llm" | "workflow" | "custom" | "a2a") => setSelectedAgentType(value)}>
                    <SelectTrigger id="selectedAgentType">
                      <SelectValue placeholder="Selecione o tipo de agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Mapeia as opções de tipo de agente (LLM, Workflow, etc.) para seleção. */}
                      {agentTypeOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.icon && React.cloneElement(option.icon as React.ReactElement, { className: "inline-block mr-2 h-4 w-4" })}
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                   {/* Exibe a descrição correspondente ao tipo de agente selecionado. */}
                   <p className="text-xs text-muted-foreground">{agentTypeOptions.find(opt => opt.id === selectedAgentType)?.description || "Selecione um tipo para ver a descrição detalhada."}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agentFramework">Framework do Agente</Label>
                  <Select value={agentFramework} onValueChange={(value) => setAgentFramework(value as AgentFramework)}>
                    <SelectTrigger id="agentFramework">
                      <SelectValue placeholder="Selecione o framework" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentFrameworkOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Define a biblioteca ou sistema base para a execução do agente.</p>
                </div>
              </div>
            </TabsContent>

            {/* Aba Comportamento: Define como o agente atua, incluindo instruções globais e configurações específicas por tipo (LLM, Workflow, etc.). */}
            <TabsContent value="behavior" className="space-y-6 mt-4">
              {/* Instrução Global / Prompt de Sistema Primário */}
              <div className="space-y-2">
                <Label htmlFor="globalInstruction">Instrução Global / Prompt do Sistema Primário</Label>
                <Textarea
                  id="globalInstruction"
                  placeholder="Defina o comportamento central, persona ou prompt de sistema principal para o agente. Isso se aplica a todos os tipos de agente como uma instrução de alto nível."
                  value={globalInstruction}
                  onChange={(e) => setGlobalInstruction(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Para agentes LLM, isso pode ser o início do prompt do sistema. Para outros tipos de agente (Workflow, Customizado), serve como uma diretriz de alto nível ou descrição do propósito geral.
                </p>
              </div>
              <Separator />

              {/* Campos específicos para agentes do tipo LLM. Renderizado condicionalmente se selectedAgentType === 'llm'. */}
              {selectedAgentType === 'llm' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="agentGoal">Objetivo do Agente (LLM)</Label>
                      <Textarea id="agentGoal" placeholder="Descreva o objetivo principal que o agente LLM deve alcançar. Ex: 'Responder perguntas sobre o produto X com base na documentação fornecida.'" value={agentGoal} onChange={(e) => setAgentGoal(e.target.value)} rows={3}/>
                      <p className="text-xs text-muted-foreground">Qual o propósito central deste agente LLM?</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agentPersonality">Personalidade/Tom (LLM)</Label>
                      <Select value={agentPersonality} onValueChange={setAgentPersonality}>
                        <SelectTrigger id="agentPersonality">
                          <SelectValue placeholder="Selecione a personalidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Mapeia as opções de tom/personalidade disponíveis. */}
                          {agentToneOptions.map(option => (
                            <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                       <p className="text-xs text-muted-foreground">Define o estilo de comunicação do agente (ex: formal, amigável, conciso).</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agentTasks">Tarefas Principais (LLM)</Label>
                    <Textarea
                      id="agentTasks"
                      placeholder="Liste as tarefas principais que o agente deve executar para alcançar seu objetivo. Uma tarefa por linha. Ex: 'Coletar informações sobre X.', 'Analisar Y.', 'Resumir Z.'"
                      value={agentTasks.join("\n")}
                      onChange={(e) => setAgentTasks(e.target.value.split("\n"))}
                      rows={4}
                    />
                     <p className="text-xs text-muted-foreground">Detalhe os passos ou sub-objetivos que o agente deve completar.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agentRestrictions">Restrições (LLM)</Label>
                    <Textarea
                      id="agentRestrictions"
                      placeholder="Liste quaisquer restrições, limitações ou comportamentos que o agente deve evitar. Uma restrição por linha. Ex: 'Não fornecer aconselhamento financeiro.', 'Manter respostas concisas.'"
                      value={agentRestrictions.join("\n")}
                      onChange={(e) => setAgentRestrictions(e.target.value.split("\n"))}
                      rows={3}
                    />
                     <p className="text-xs text-muted-foreground">Define limites e regras para o comportamento do agente.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="agentModel">Modelo de Linguagem (LLM)</Label>
                      <Input id="agentModel" placeholder="Ex: gemini-1.5-pro-latest, gpt-4" value={agentModel} onChange={(e) => setAgentModel(e.target.value)} />
                       <p className="text-xs text-muted-foreground">Especifique o identificador do modelo LLM a ser usado (ex: 'gemini-1.5-flash', 'gpt-3.5-turbo').</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agentTemperature">Temperatura (LLM) - <Badge variant="outline" className="text-xs">{agentTemperature.toFixed(1)}</Badge></Label>
                      <Slider
                        id="agentTemperature"
                        min={0} max={1} step={0.1}
                        value={[agentTemperature]}
                        onValueChange={(value) => setAgentTemperature(value[0])}
                      />
                      <p className="text-xs text-muted-foreground">Controla a criatividade/aleatoriedade das respostas (0=mais determinístico, 1=mais criativo).</p>
                      <p className="text-xs text-muted-foreground">
                        Controla a criatividade/aleatoriedade das respostas (0=determinístico, 1=máximo).
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="systemPromptGenerated">Prompt do Sistema Gerado (LLM Preview)</Label>
                    <Textarea
                      id="systemPromptGenerated"
                      readOnly
                      value={systemPromptGenerated || "O prompt do sistema será gerado/mostrado aqui com base nas configurações acima (funcionalidade de preview pendente)."}
                      rows={5}
                      className="bg-muted/40"
                    />
                     <p className="text-xs text-muted-foreground">Este é um preview de como o prompt do sistema pode ser construído. (Funcionalidade de geração/atualização automática pendente).</p>
                  </div>
                </>
              )}

              {/* Campos específicos para agentes do tipo Workflow. Renderizado condicionalmente se selectedAgentType === 'workflow'. */}
              {selectedAgentType === 'workflow' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="detailedWorkflowType">Tipo de Workflow</Label>
                    <Select 
                      value={detailedWorkflowType} 
                      onValueChange={(value: "sequential" | "graph" | "stateMachine") => setDetailedWorkflowType(value)}
                    >
                      <SelectTrigger id="detailedWorkflowType">
                        <SelectValue placeholder="Selecione o tipo de workflow" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequential">Sequencial (Passos executados em ordem)</SelectItem>
                        <SelectItem value="graph">Grafo de Tarefas (Passos com dependências complexas)</SelectItem>
                        <SelectItem value="stateMachine">Máquina de Estados (Transições baseadas em estados)</SelectItem>
                      </SelectContent>
                    </Select>
                     <p className="text-xs text-muted-foreground">Define a estrutura de execução do workflow.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workflowDescription">Descrição do Workflow</Label>
                    <Textarea id="workflowDescription" placeholder="Descreva o objetivo e os passos gerais do workflow. Ex: 'Processar pedido: validar, verificar estoque, enviar email.'" value={workflowDescription} onChange={(e) => setWorkflowDescription(e.target.value)} rows={3}/>
                     <p className="text-xs text-muted-foreground">Uma visão geral do que o workflow realiza.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loopMaxIterations">Máximo de Iterações (para workflows com loops)</Label>
                    <Input id="loopMaxIterations" type="number" value={loopMaxIterations === undefined ? "" : String(loopMaxIterations)} onChange={(e) => setLoopMaxIterations(e.target.value === "" ? undefined : Number(e.target.value))} placeholder="Opcional. Ex: 10"/>
                     <p className="text-xs text-muted-foreground">Se o workflow contiver loops, defina um limite máximo de iterações para evitar loops infinitos.</p>
                  </div>
                  {/* TODO: Adicionar mais campos específicos para workflow aqui, como definição de passos/tarefas do workflow, condições de transição, etc. */}
                </>
              )}

              {/* Campos específicos para agentes do tipo Customizado. Renderizado condicionalmente se selectedAgentType === 'custom'. */}
              {selectedAgentType === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customLogicDescription">Descrição da Lógica Customizada</Label>
                  <Textarea id="customLogicDescription" placeholder="Descreva a lógica customizada que este agente irá executar. Pode incluir referências a scripts, módulos externos ou endpoints específicos." value={customLogicDescription} onChange={(e) => setCustomLogicDescription(e.target.value)} rows={5}/>
                   <p className="text-xs text-muted-foreground">Detalhe o comportamento específico implementado por este agente.</p>
                </div>
              )}
               {/* Mensagem informativa para agentes do tipo A2A. Renderizado condicionalmente se selectedAgentType === 'a2a'. */}
               {selectedAgentType === 'a2a' && (
                <Alert>
                  <Waypoints className="h-4 w-4" />
                  <AlertTitle>Agente de Comunicação (A2A)</AlertTitle>
                  <AlertDescription>
                    Este tipo de agente é especializado em facilitar a comunicação e coordenação entre outros agentes ou sistemas.
                    As configurações específicas para A2A, como canais de comunicação e protocolos, são definidas na aba 'Avançado/A2A'.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Aba Ferramentas: Permite ao usuário selecionar e configurar as ferramentas (capabilities) que o agente poderá utilizar. */}
            <TabsContent value="tools" className="space-y-6 mt-4">
              <Alert>
                <Wand2 className="h-4 w-4" />
                <AlertTitle>Gerenciamento de Ferramentas</AlertTitle>
                <AlertDescription>
                  Selecione as ferramentas que este agente poderá utilizar. Algumas ferramentas podem requerer configuração adicional clicando em 'Configurar'.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Mapeia as ferramentas disponíveis (`availableTools`), permitindo seleção e configuração para cada uma. */}
                {/* A prop `iconComponents` é um Record que mapeia o nome do ícone (string) para o componente React do ícone. */}
                {/* Ex: iconComponents['webSearchIcon'] retornaria o componente do ícone de busca na web. */}
                {availableTools.map((tool) => (
                  <Card key={tool.id} className={cn("flex flex-col justify-between", selectedTools.includes(tool.id) ? "border-primary" : "")}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        {tool.name} {/* Nome da ferramenta */}
                        <Checkbox
                          id={`tool-${tool.id}`}
                          checked={selectedTools.includes(tool.id)} // Controla se a ferramenta está selecionada.
                          onCheckedChange={(checked) => { // Atualiza a lista de ferramentas selecionadas.
                            setSelectedTools(prev: string[] =>
                          checked={selectedTools.includes(tool.id)}
                          onCheckedChange={(checked) => {
                            setSelectedTools((prev: string[]) =>
                              checked ? [...prev, tool.id] : prev.filter(id => id !== tool.id)
                            );
                          }}
                        />
                      </CardTitle>
                      {/* Renderiza o ícone da ferramenta dinamicamente, usando o nome do ícone fornecido na `tool.icon` e o mapeamento `iconComponents`. */}
                      {tool.icon && React.cloneElement(iconComponents[tool.icon as string] || <Wand2 className="h-5 w-5 text-muted-foreground" />, { className: "h-6 w-6 mb-2 text-primary" })}
                      <CardDescription className="text-xs">{tool.description}</CardDescription> {/* Descrição da ferramenta. */}
                      {tool.icon ? 
                        (() => {
                          const IconComponent = iconComponents[tool.icon as string] || Wand2;
                          return <IconComponent className="h-6 w-6 mb-2 text-primary" />;
                        })() : 
                        <Wand2 className="h-5 w-5 text-muted-foreground" />
                      }
                      <CardDescription className="text-xs">{tool.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      {/* Se a ferramenta requer configuração (`tool.hasConfig`), exibe o botão 'Configurar'. */}
                      {tool.hasConfig ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToolConfigure(tool)} // Abre o modal de configuração para esta ferramenta.
                          disabled={!selectedTools.includes(tool.id)} // Habilita o botão apenas se a ferramenta estiver selecionada.
                          className="w-full"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Configurar
                          {/* Indica visualmente com um ícone de 'check' se a ferramenta já foi configurada. */}
                          {toolConfigurations[tool.id] && Object.keys(toolConfigurations[tool.id]).length > 0 && (
                             <Check className="ml-2 h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Não requer configuração.</p> // Mensagem para ferramentas sem configuração.
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {/* Mensagem exibida se não houver ferramentas disponíveis. */}
              {availableTools.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">Nenhuma ferramenta disponível no momento.</p>
              )}
            </TabsContent>

            {/* Aba Estado & Memória: Configurações relacionadas à persistência de estado do agente e seus valores iniciais. */}
            <TabsContent value="memory" className="space-y-6 mt-4">
              <Alert>
                <Database className="h-4 w-4" />
                <AlertTitle>Estado e Memória do Agente</AlertTitle>
                <AlertDescription>
                  Configure como o agente deve persistir seu estado interno e gerenciar a memória de curto e longo prazo.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Persistência de Estado</CardTitle>
                  <CardDescription>Controla se e como o agente salva seu estado entre execuções ou sessões.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableStatePersistence"
                      checked={enableStatePersistence}
                      onCheckedChange={setEnableStatePersistence}
                    />
                    <Label htmlFor="enableStatePersistence" className="text-base">Habilitar Persistência de Estado</Label>
                  </div>

                  {/* Campos de configuração de persistência de estado, renderizados se `enableStatePersistence` for true. */}
                  {enableStatePersistence && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="statePersistenceType">Tipo de Persistência</Label>
                        <Select value={statePersistenceType} onValueChange={setStatePersistenceType}>
                          <SelectTrigger id="statePersistenceType">
                            <SelectValue placeholder="Selecione o tipo de persistência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="session">Sessão (Temporária, por aba/conexão)</SelectItem>
                            <SelectItem value="memory">Memória (Durante a vida do processo)</SelectItem>
                            <SelectItem value="database">Banco de Dados (Persistente)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {statePersistenceType === 'session' && "O estado é perdido quando a sessão do usuário termina."}
                          {statePersistenceType === 'memory' && "O estado persiste enquanto o agente/aplicação está em execução, mas é perdido ao reiniciar."}
                          {statePersistenceType === 'database' && "Requer configuração de um banco de dados para persistência robusta entre sessões e reinícios."}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="initialStateValues">Valores Iniciais do Estado (JSON)</Label>
                        <Textarea
                          id="initialStateValues"
                          placeholder='[{"key": "exemploChave", "value": "exemploValor"}, {"key": "outraChave", "value": 123}]'
                          value={JSON.stringify(initialStateValues, null, 2)}
                          onChange={(e) => {
                            try {
                              const val = e.target.value.trim();
                              if (!val) { setInitialStateValues([]); return; }
                              const parsed = JSON.parse(val);
                              // Validação básica da estrutura do JSON.
                              if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && 'key' in item && 'value' in item)) {
                                setInitialStateValues(parsed);
                              } else {
                                console.warn("Formato JSON inválido para valores iniciais do estado.");
                                toast({variant: "destructive", title: "JSON Inválido", description: "O formato para Valores Iniciais deve ser um array de objetos, cada um com 'key' e 'value'."})
                              }
                            } catch (error) {
                              console.error("Erro ao parsear JSON dos valores iniciais:", error);
                               toast({variant: "destructive", title: "Erro no JSON", description: "Verifique a sintaxe do JSON para Valores Iniciais. Deve ser um array de objetos."})
                            }
                          }}
                          rows={4}
                        />
                        <p className="text-xs text-muted-foreground">
                          Defina um array de objetos JSON, cada um com "key" (string) e "value" (qualquer valor JSON válido), para o estado inicial do agente.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba RAG: Configurações para Retrieval Augmented Generation, permitindo ao agente consultar conhecimento externo. */}
            <TabsContent value="rag" className="space-y-6 mt-4">
              <Alert>
                <FileJson className="h-4 w-4" />
                <AlertTitle>RAG - Retrieval Augmented Generation</AlertTitle>
                <AlertDescription>
                  Habilite e configure o RAG para permitir que o agente consulte bases de conhecimento externas para enriquecer suas respostas.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Configuração do RAG</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableRAG"
                      checked={enableRAG}
                      onCheckedChange={setEnableRAG}
                    />
                    <Label htmlFor="enableRAG" className="text-base">Habilitar RAG</Label>
                  </div>

                  {/* Campos de configuração RAG, renderizados se `enableRAG` for true. */}
                  {enableRAG && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="ragServiceType">Serviço de Busca/Vetorização</Label>
                          <Select
                            value={ragMemoryConfig.serviceType || "vertexAISearch" as MemoryServiceType}
                            onValueChange={(value) => setRagMemoryConfig((prev: RagMemoryConfig) => ({...prev, serviceType: value as MemoryServiceType}))}
                          >
                            <SelectTrigger id="ragServiceType">
                              <SelectValue placeholder="Selecione o serviço" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vertexAISearch">Vertex AI Search & Conversation</SelectItem>
                              <SelectItem value="pinecone">Pinecone</SelectItem>
                              <SelectItem value="localFaiss">FAISS Local</SelectItem>
                              <SelectItem value="googleSearch">Google Custom Search (para RAG simples)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">Escolha o backend para busca e recuperação de informações.</p>
                        </div>
                        {/* Campos condicionais para serviços que requerem ID de projeto e localização. */}
                        { (ragMemoryConfig.serviceType === "vertexAISearch" || ragMemoryConfig.serviceType === "pinecone") &&
                        { (ragMemoryConfig.serviceType === "vertexAISearch") && // Condition updated to be Vertex AI Search specific
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="ragProjectId">ID do Projeto Cloud (Vertex AI)</Label> {/* Label updated for clarity */}
                              <Input
                                id="ragProjectId"
                                placeholder="Seu ID do projeto GCP ou similar"
                                value={ragMemoryConfig.vertexAISearchConfig?.projectId || ""}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  setRagMemoryConfig((prev) => ({
                                    ...prev,
                                    vertexAISearchConfig: {
                                      ...(prev.vertexAISearchConfig || {}),
                                      projectId: newValue,
                                    },
                                  }));
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="ragLocation">Localização (Região)</Label>
                              <Input
                                id="ragLocation"
                                placeholder="Ex: us-central1"
                                value={ragMemoryConfig.vertexAISearchConfig?.location || ""}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  setRagMemoryConfig((prev) => ({
                                    ...prev,
                                    vertexAISearchConfig: {
                                      ...(prev.vertexAISearchConfig || {}),
                                      location: newValue,
                                    },
                                  }));
                          <Input
                            id="ragCorpusName"
                            placeholder="Ex: meu-datastore-de-documentos"
                            value={ragMemoryConfig.ragCorpusName || ""}
                            onChange={(e) => setRagMemoryConfig(prev => ({...prev, ragCorpusName: e.target.value}))}
                            id="vertexDataStoreId"
                            placeholder="ID do seu DataStore no Vertex AI Search"
                            value={ragMemoryConfig.vertexAISearchConfig?.dataStoreId || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setRagMemoryConfig((prev) => ({
                                ...prev,
                                vertexAISearchConfig: { ...(prev.vertexAISearchConfig || {}), dataStoreId: newValue },
                              }));
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Identificador da sua coleção de dados no serviço RAG.</p>
                        </div>
                         <div className="space-y-2">
                          <Label htmlFor="ragEmbeddingModel">Modelo de Embedding</Label>
                          <Input
                            id="ragEmbeddingModel"
                            placeholder="Ex: text-embedding-004 (Opcional)"
                            value={ragMemoryConfig.embeddingModel || ""}
                            onChange={(e) => setRagMemoryConfig(prev => ({...prev, embeddingModel: e.target.value}))}
                          />
                           <p className="text-xs text-muted-foreground">Modelo usado para gerar embeddings (vetores) dos seus dados. Deixe em branco para usar o padrão do serviço.</p>
                        </div>
                      )}
                      {ragMemoryConfig.serviceType === 'pinecone' && (
                        <div className="space-y-2">
                          <Label htmlFor="pineconeIndexName">Nome do Índice (Pinecone)</Label>
                          <Input
                            id="pineconeIndexName"
                            placeholder="Nome do seu índice no Pinecone"
                            value={ragMemoryConfig.pineconeConfig?.indexName || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setRagMemoryConfig((prev) => ({
                                ...prev,
                                pineconeConfig: { ...(prev.pineconeConfig || {}), indexName: newValue },
                              }));
                            }}
                            id="ragSimilarityTopK"
                            type="number"
                            value={String(ragMemoryConfig.similarityTopK || 5)}
                            onChange={(e) => setRagMemoryConfig((prev: RagMemoryConfig) => ({...prev, similarityTopK: parseInt(e.target.value, 10) || 5}))}
                          />
                          <p className="text-xs text-muted-foreground">Número de resultados mais similares a serem recuperados.</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ragVectorDistanceThreshold">Limiar de Distância Vetorial - <Badge variant="outline" className="text-xs">{(ragMemoryConfig.vectorDistanceThreshold || 0.5).toFixed(2)}</Badge></Label>
                           <Slider
                            id="ragVectorDistanceThreshold"
                            min={0} max={1} step={0.05}
                            value={[ragMemoryConfig.vectorDistanceThreshold || 0.5]}
                            onValueChange={(value) => setRagMemoryConfig((prev: RagMemoryConfig) => ({...prev, vectorDistanceThreshold: value[0]}))}
                          />
                          <p className="text-xs text-muted-foreground">Distância máxima para considerar um resultado relevante (0 a 1). Menor = mais estrito.</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ragKnowledgeSources">Fontes de Conhecimento (JSON)</Label>
                        <Textarea
                          id="ragKnowledgeSources"
                          placeholder='[{"type": "web_url", "content": "https://example.com/faq", "name": "FAQ Site"}, {"type": "gcs_uri", "content": "gs://bucket/doc.pdf", "name": "Documento PDF"}]'
                          value={JSON.stringify(ragMemoryConfig.knowledgeSources || [], null, 2)}
                          onChange={(e) => {
                            try {
                              const val = e.target.value.trim();
                              if(!val) { setRagMemoryConfig((prev: RagMemoryConfig) => ({...prev, knowledgeSources: []})); return; }
                              const parsed = JSON.parse(val);
                              // Validação básica da estrutura do JSON para fontes de conhecimento.
                              if(Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && 'type' in item && 'content' in item && 'name' in item)) {
                                setRagMemoryConfig(prev => ({...prev, knowledgeSources: parsed}));
                              } else {
                                toast({variant: "destructive", title: "JSON Inválido", description: "Fontes de Conhecimento devem ser um array de objetos com 'type', 'content' e 'name'."})
                              }
                              setRagMemoryConfig((prev: RagMemoryConfig) => ({...prev, knowledgeSources: parsed}));
                            } catch (error) {
                              console.error("Erro ao parsear JSON das fontes de conhecimento:", error);
                              toast({variant: "destructive", title: "Erro no JSON", description: "Verifique a sintaxe do JSON para Fontes de Conhecimento."})
                            }
                          }}
                          rows={5}
                        />
                        <p className="text-xs text-muted-foreground">
                          Array de objetos JSON, cada um com "name" (string, nome da fonte), "type" (string, ex: "web_url", "gcs_uri") e "content" (string, URL/URI).
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ragIncludeConversationContext"
                          checked={ragMemoryConfig.includeConversationContext === undefined ? true : ragMemoryConfig.includeConversationContext}
                          onCheckedChange={(checked) => setRagMemoryConfig(prev => ({...prev, includeConversationContext: Boolean(checked)}))}
                        />
                        <Label htmlFor="ragIncludeConversationContext">Incluir Contexto da Conversa na Busca RAG</Label>
                      </div>
                       <p className="text-xs text-muted-foreground -mt-3 pl-6">
                          Se marcado, o histórico da conversa atual será usado para refinar a busca RAG, tornando os resultados mais contextuais.
                        </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Artefatos: Configuração do armazenamento e gerenciamento de arquivos e outros artefatos que o agente pode criar ou utilizar. */}
            <TabsContent value="artifacts" className="space-y-6 mt-4">
              <Alert>
                <UploadCloud className="h-4 w-4" />
                <AlertTitle>Gerenciamento de Artefatos</AlertTitle>
                <AlertDescription>
                  Configure como o agente irá armazenar e gerenciar arquivos e outros artefatos que ele pode criar ou utilizar durante sua execução.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Armazenamento de Artefatos</CardTitle>
                  <CardDescription>Define se e onde os artefatos gerados ou utilizados pelo agente são armazenados.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enableArtifacts"
                      checked={enableArtifacts}
                      onCheckedChange={setEnableArtifacts}
                    />
                    <Label htmlFor="enableArtifacts" className="text-base">Habilitar Armazenamento de Artefatos</Label>
                  </div>

                  {/* Campos de configuração de armazenamento de artefatos, renderizados se `enableArtifacts` for true. */}
                  {enableArtifacts && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="artifactStorageType">Tipo de Armazenamento</Label>
                        <Select value={artifactStorageType} onValueChange={(value: 'memory' | 'local' | 'cloud') => setArtifactStorageType(value)}>
                          <SelectTrigger id="artifactStorageType">
                            <SelectValue placeholder="Selecione o tipo de armazenamento" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="memory">Memória (Temporário)</SelectItem>
                            <SelectItem value="local">Sistema de Arquivos Local</SelectItem> {/* Value changed to 'local' */}
                            <SelectItem value="cloud">Nuvem (Ex: Google Cloud Storage)</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Define onde os artefatos serão guardados.</p>
                      </div>

                      {/* Campo para caminho local, renderizado se o tipo de armazenamento for 'local'. */}
                      {artifactStorageType === 'local' && (
                        <div className="space-y-2">
                          <Label htmlFor="localStoragePath">Caminho de Armazenamento Local</Label>
                          <Input
                            id="localStoragePath"
                            placeholder="./agent_artifacts"
                            value={localStoragePath}
                            onChange={(e) => setLocalStoragePath(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Caminho no sistema de arquivos do servidor onde os artefatos serão salvos. Ex: "./artefatos_agente_X".
                          </p>
                        </div>
                      )}

                      {/* Campo para nome do bucket na nuvem, renderizado se o tipo de armazenamento for 'cloud'. */}
                      {artifactStorageType === 'cloud' && (
                        <div className="space-y-2">
                          <Label htmlFor="cloudStorageBucket">Nome do Bucket de Armazenamento na Nuvem</Label>
                          <Input
                            id="cloudStorageBucket"
                            placeholder="Ex: meu-bucket-de-artefatos-agente"
                            value={cloudStorageBucket}
                            onChange={(e) => setCloudStorageBucket(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Nome do bucket no seu provedor de nuvem (ex: GCS, S3) para armazenar os artefatos.
                          </p>
                        </div>
                      )}
                      {/* TODO: Adicionar UI para gerenciar ArtifactDefinition[] (lista de artefatos esperados/produzidos) */}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Multi-Agente: Define o papel do agente em sistemas com múltiplos agentes e suas relações. */}
            <TabsContent value="multiAgent" className="space-y-6 mt-4">
              <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>Configurações Multi-Agente</AlertTitle>
                <AlertDescription>
                  Defina o papel deste agente em um sistema com múltiplos agentes (equipes de agentes) e suas relações com outros agentes.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Hierarquia e Colaboração</CardTitle>
                  <CardDescription>Configure como este agente interage e se posiciona dentro de uma arquitetura multi-agente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isRootAgent"
                      checked={isRootAgent}
                      onCheckedChange={setIsRootAgent}
                    />
                    <Label htmlFor="isRootAgent" className="text-base">Agente Raiz / Orquestrador Principal</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Marque se este agente é o principal ponto de entrada ou o orquestrador em uma equipe de agentes.
                    Agentes não-raiz (sub-agentes) são tipicamente especialistas invocados por um agente raiz ou por outros agentes.
                  </p>
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="subAgentIds">IDs dos Sub-Agentes / Colaboradores</Label>
                    {/* Seletor de sub-agentes ou input manual se não houver outros agentes. */}
                    { availableAgentsForSubSelector && availableAgentsForSubSelector.length > 0 ? (
                       <SubAgentSelector
                        availableAgents={availableAgentsForSubSelector}
                        selectedAgents={subAgentIds}
                        onChange={setSubAgentIds}
                        disabled={false}
                      />
                    ) : (
                      <Textarea
                        id="subAgentIds"
                        placeholder="Insira IDs de sub-agentes, separados por vírgula. Nenhum outro agente salvo disponível para seleção no momento."
                        value={subAgentIds.join(",")}
                        onChange={(e) => setSubAgentIds(e.target.value.split(",").map(id => id.trim()).filter(id => id))}
                        rows={3}
                        disabled={!(availableAgentsForSubSelector && availableAgentsForSubSelector.length > 0)}
                      />
                    )}
                     <p className="text-xs text-muted-foreground">
                      Liste os IDs dos agentes que este agente pode invocar, delegar tarefas ou com os quais colabora.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Avançado/A2A: Configurações de baixo nível, comunicação entre agentes (A2A) e outros parâmetros avançados. */}
            <TabsContent value="advanced" className="space-y-6 mt-4">
              <Alert>
                <Settings2 className="h-4 w-4" />
                <AlertTitle>Configurações Avançadas e A2A</AlertTitle>
                <AlertDescription>
                  Defina configurações de baixo nível, como comunicação entre agentes (A2A), e outros parâmetros avançados do sistema.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle>Comunicação Agente-Agente (A2A)</CardTitle>
                  <CardDescription>Define como este agente se comunica com outros agentes no sistema.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="a2aEnabled"
                      checked={a2aConfig.enabled || false}
                            onCheckedChange={(checked) => setA2AConfig((prev: A2AConfig) => ({...prev, enabled: !!checked}))}
                    />
                    <Label htmlFor="a2aEnabled" className="text-base">Habilitar Comunicação A2A</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Permite que este agente envie e receba mensagens de outros agentes diretamente, usando os canais configurados.
                  </p>

                  {/* Campos de configuração A2A, renderizados se `a2aConfig.enabled` for true. */}
                  {a2aConfig.enabled && (
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="a2aCommunicationChannels">Canais de Comunicação A2A (JSON)</Label>
                      <Textarea
                        id="a2aCommunicationChannels"
                        placeholder={`Exemplo de formato JSON:
[
  {"type": "direct", "targetAgentId": "agente_destino_1", "protocol": "http", "endpoint": "https://api.exemplo.com/agente1"},
  {"type": "message_queue", "topic": "fila_de_tarefas_comum", "brokerUrl": "amqp://usuario:senha@host:porta/vhost"}
]`}
                        value={JSON.stringify(a2aConfig.communicationChannels || [], null, 2)}
                        onChange={(e) => {
                          try {
                            const val = e.target.value.trim();
                            if(!val) { setA2AConfig((prev: A2AConfig) => ({...prev, communicationChannels: []})); return; }
                            const parsedChannels = JSON.parse(val);
                            // Adicionar validação mais robusta da estrutura `CommunicationChannelItem` se necessário.
                            setA2AConfig((prev: A2AConfig) => ({...prev, communicationChannels: parsedChannels}));
                          } catch (error) {
                            console.error("Erro ao parsear JSON dos canais A2A:", error);
                            toast({variant: "destructive", title: "Erro no JSON", description: "Formato inválido para Canais de Comunicação A2A. Verifique o console para mais detalhes."})
                          }
                        }}
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Defina os canais, protocolos e configurações para comunicação com outros agentes (formato JSON). Cada objeto no array deve representar um canal.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-muted-foreground/70">Outras Configurações Avançadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configurações adicionais como timeouts específicos para ferramentas, políticas de retry para chamadas externas,
                    ou configurações de logging detalhado poderão ser adicionadas aqui em futuras versões.
                  </p>
                </CardContent>
              </Card>

            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSaveAgent}><Save className="mr-2 h-4 w-4" /> Salvar Agente</Button>
        </DialogFooter>

        {/* Modal para configurar ferramentas específicas que requerem parâmetros adicionais. */}
        {/* Renderizado condicionalmente quando `isToolConfigModalOpen` é true e `configuringTool` (a ferramenta a ser configurada) está definida. */}
        {isToolConfigModalOpen && configuringTool && (
           <Dialog open={isToolConfigModalOpen} onOpenChange={(open) => { if (!open) { setIsToolConfigModalOpen(false); setConfiguringTool(null); }}}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configurar Ferramenta: {configuringTool.name}</DialogTitle>
                <DialogDescription>{configuringTool.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                {/* Renderização condicional dos campos de configuração baseado no ID da ferramenta. */}
                {configuringTool.id === "webSearch" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="modalGoogleApiKey">Chave API Google</Label>
                    <Input id="modalGoogleApiKey" value={modalGoogleApiKey} onChange={(e) => setModalGoogleApiKey(e.target.value)} placeholder="ex: AIzaSy..."/>
                    <p className="text-xs text-muted-foreground">Chave de API do Google (Custom Search API) para busca na web.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modalGoogleCseId">ID do Mecanismo de Busca</Label>
                    <Input id="modalGoogleCseId" value={modalGoogleCseId} onChange={(e) => setModalGoogleCseId(e.target.value)} placeholder="ex: 0123456789abcdefg"/>
                    <p className="text-xs text-muted-foreground">ID do Mecanismo de Busca Personalizado (CSE ID) do Google.</p>
                  </div>
                </>
              )}
              {configuringTool.id === "customApiIntegration" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="modalOpenapiSpecUrl">URL Esquema OpenAPI (JSON/YAML)</Label>
                    <Input id="modalOpenapiSpecUrl" value={modalOpenapiSpecUrl} onChange={(e) => setModalOpenapiSpecUrl(e.target.value)} placeholder="ex: https://petstore.swagger.io/v2/swagger.json"/>
                    <p className="text-xs text-muted-foreground">Link para a especificação OpenAPI (v2 ou v3) da API externa.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="modalOpenapiApiKey">Chave API Externa (Opcional)</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p className="max-w-xs">Atenção: Inserir segredos diretamente na UI pode ser arriscado. Considere usar um gerenciador de segredos ou configuração de backend para produção.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input id="modalOpenapiApiKey" value={modalOpenapiApiKey} onChange={(e) => setModalOpenapiApiKey(e.target.value)} placeholder="Se a API requer autenticação por chave" type="password"/>
                    <p className="text-xs text-muted-foreground">Chave de API para autenticação no serviço externo, se necessário.</p>
                  </div>
                </>
              )}
              {configuringTool.id === "databaseAccess" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="modalDbType">Tipo de Banco de Dados</Label>
                    <Select value={modalDbType} onValueChange={setModalDbType}>
                      <SelectTrigger id="modalDbType">
                        <SelectValue placeholder="Selecione o tipo de banco" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="sqlserver">SQL Server</SelectItem>
                        <SelectItem value="sqlite">SQLite</SelectItem>
                        <SelectItem value="other">Outro (usar string de conexão)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Campos condicionais para tipos de banco que usam host, porta, etc. */}
                  {(modalDbType && modalDbType !== 'other' && modalDbType !== 'sqlite') && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="modalDbHost">Host</Label>
                          <Input id="modalDbHost" value={modalDbHost} onChange={(e) => setModalDbHost(e.target.value)} placeholder="ex: localhost"/>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="modalDbPort">Porta</Label>
                          <Input id="modalDbPort" type="number" value={String(modalDbPort)} onChange={(e) => setModalDbPort(Number(e.target.value))} placeholder="ex: 5432"/>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modalDbName">Nome do Banco</Label>
                        <Input id="modalDbName" value={modalDbName} onChange={(e) => setModalDbName(e.target.value)} placeholder="ex: meu_banco_de_dados"/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="modalDbUser">Usuário</Label>
                          <Input id="modalDbUser" value={modalDbUser} onChange={(e) => setModalDbUser(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="modalDbPassword">Senha</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p className="max-w-xs">Atenção: Inserir segredos diretamente na UI pode ser arriscado. Considere usar um gerenciador de segredos ou configuração de backend para produção.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <Input id="modalDbPassword" type="password" value={modalDbPassword} onChange={(e) => setModalDbPassword(e.target.value)} />
                        </div>
                      </div>
                    </>
                  )}
                  {/* Campo para string de conexão, para SQLite ou 'Outro'. */}
                  {(modalDbType === 'other' || modalDbType === 'sqlite') && (
                    <div className="space-y-2">
                      <Label htmlFor="modalDbConnectionString">String de Conexão / Caminho do Arquivo</Label>
                      <Input id="modalDbConnectionString" value={modalDbConnectionString} onChange={(e) => setModalDbConnectionString(e.target.value)} placeholder={modalDbType === 'sqlite' ? "ex: /caminho/para/seu/banco.sqlite" : "driver://usuario:senha@host:porta/banco"}/>
                      <p className="text-xs text-muted-foreground">{modalDbType === 'sqlite' ? 'Caminho completo para o arquivo do banco de dados SQLite.' : 'String de conexão JDBC/ODBC completa.'}</p>
                    </div>
                  )}
                   <div className="space-y-2">
                    <Label htmlFor="modalDbDescription">Descrição do Banco/Tabelas (Opcional)</Label>
                    <Textarea id="modalDbDescription" value={modalDbDescription} onChange={(e) => setModalDbDescription(e.target.value)} placeholder="Ex: Tabela 'usuarios' (id, nome, email), Tabela 'pedidos' (id, usuario_id, produto, qtd, data)" rows={3}/>
                    <p className="text-xs text-muted-foreground">Ajuda o agente a entender o esquema do banco de dados e a formular queries SQL mais precisas.</p>
                  </div>
                </>
              )}
              {configuringTool.id === "knowledgeBase" && (
                <div className="space-y-2">
                  <Label htmlFor="modalKnowledgeBaseId">ID/Nome da Base de Conhecimento</Label>
                  <Input id="modalKnowledgeBaseId" value={modalKnowledgeBaseId} onChange={(e) => setModalKnowledgeBaseId(e.target.value)} placeholder="ex: documentos_produto_v2"/>
                  <p className="text-xs text-muted-foreground">Identificador único para a base de conhecimento que será utilizada (geralmente associado a um sistema RAG).</p>
                </div>
              )}
              {configuringTool.id === "calendarAccess" && (
                <div className="space-y-2">
                  <Label htmlFor="modalCalendarApiEndpoint">Endpoint da API de Calendário / ID do Fluxo Genkit</Label>
                  <Input id="modalCalendarApiEndpoint" value={modalCalendarApiEndpoint} onChange={(e) => setModalCalendarApiEndpoint(e.target.value)} placeholder="ex: https://api.example.com/calendar ou meuFluxoGenkitCalendario"/>
                  <p className="text-xs text-muted-foreground">URL do endpoint da API de calendário ou o identificador de um fluxo Genkit que encapsula o acesso à agenda.</p>
                </div>
              )}
              </div>
              <DialogFooter>
                 <Button variant="outline" onClick={() => { setIsToolConfigModalOpen(false); setConfiguringTool(null);}}>Cancelar</Button>
                {/* ATENÇÃO: Os valores modalDbPassword e modalOpenapiApiKey são manipulados aqui.
                    Estes são segredos e armazená-los diretamente na configuração do agente que é salva
                    em um local potencialmente inseguro (como localStorage ou um banco de dados não criptografado)
                    é um risco de segurança.
                    Para ambientes de produção, é fortemente recomendado que segredos sejam gerenciados
                    por um sistema de gerenciamento de segredos dedicado (ex: HashiCorp Vault, Google Secret Manager)
                    ou configurados de forma segura no backend, e não expostos ou armazenados na UI.
                    As ferramentas que utilizam estas chaves no backend devem carregá-las de variáveis de ambiente
                    ou de um serviço de configuração seguro.
                */}
                 <Button onClick={handleSaveToolConfiguration}>Salvar Configuração da Ferramenta</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AgentBuilderDialog;
