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
// import { MemoryServiceType } from "./memory-knowledge-tab"; // Moved to RagTab or its sub-components
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
  // Database, // Now passed as a prop to StateMemoryTab
  Share2,
  UploadCloud,
  Binary,
  Palette
  // Waypoints, // Moved to BehaviorTab
  // Wand2,     // Already listed above
  // Settings,  // Already listed above
  // Check,     // Already listed above
  // Info,      // Already listed above
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
// import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Tooltip components are no longer directly used in this file.
// They are used within ToolConfigModal.tsx.
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SubAgentSelector } from "@/components/features/agent-builder/sub-agent-selector";
import { cn } from "@/lib/utils";
import type { ClassValue } from 'clsx';
import GeneralTab from "./GeneralTab";
import BehaviorTab from "./BehaviorTab";
import ToolsTab from "./ToolsTab";
import ToolConfigModal from "./ToolConfigModal";
import StateMemoryTab from "./StateMemoryTab";
import RagTab from "./RagTab";
import ArtifactsTab from "./ArtifactsTab";
import MultiAgentTab from "./MultiAgentTab"; // Import the new MultiAgentTab component

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
  // const [modalGoogleApiKey, setModalGoogleApiKey] = React.useState<string>(''); // Duplicated
  // const [modalGoogleCseId, setModalGoogleCseId] = React.useState<string>(''); // Duplicated
  // const [modalOpenapiSpecUrl, setModalOpenapiSpecUrl] = React.useState<string>(''); // Duplicated
  // const [modalOpenapiApiKey, setModalOpenapiApiKey] = React.useState<string>(''); // Duplicated
  // const [modalDbType, setModalDbType] = React.useState<string>(''); // Duplicated
  // const [modalDbHost, setModalDbHost] = React.useState<string>(''); // Duplicated
  // const [modalDbPort, setModalDbPort] = React.useState<number>(0); // Duplicated
  // const [modalDbName, setModalDbName] = React.useState<string>(''); // Duplicated
  // const [modalDbUser, setModalDbUser] = React.useState<string>(''); // Duplicated
  // const [modalDbPassword, setModalDbPassword] = React.useState<string>(''); // Duplicated
  // const [modalDbConnectionString, setModalDbConnectionString] = React.useState<string>(''); // Duplicated
  // const [modalDbDescription, setModalDbDescription] = React.useState<string>(''); // Duplicated
  // const [modalKnowledgeBaseId, setModalKnowledgeBaseId] = React.useState<string>(''); // Duplicated
  // const [modalCalendarApiEndpoint, setModalCalendarApiEndpoint] = React.useState<string>(''); // Duplicated

  // const { savedAgents: allSavedAgents } = useAgents(); // For SubAgentSelector // Already declared above

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
  // Este hook é responsável por carregar os dados de um agente existente no formulário
  // ou limpar o formulário ao criar um novo agente.
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
  // Esta função prepara e exibe o modal de configuração para uma ferramenta específica,
  // carregando quaisquer configurações previamente salvas para essa ferramenta.
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
      if (!open) {
        // Se o diálogo principal está sendo fechado, garanta que o modal de configuração de ferramenta também seja fechado
        // e o estado de 'ferramenta em configuração' seja limpo.
        setIsToolConfigModalOpen(false);
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
            <GeneralTab
              agentName={agentName}
              setAgentName={setAgentName}
              agentVersion={agentVersion}
              setAgentVersion={setAgentVersion}
              agentDescription={agentDescription}
              setAgentDescription={setAgentDescription}
              selectedAgentType={selectedAgentType}
              setSelectedAgentType={setSelectedAgentType}
              agentFramework={agentFramework}
              setAgentFramework={setAgentFramework}
              agentTypeOptions={agentTypeOptions}
              agentFrameworkOptions={agentFrameworkOptions}
            />

            {/* Aba Comportamento: Define como o agente atua, incluindo instruções globais e configurações específicas por tipo (LLM, Workflow, etc.). */}
            <BehaviorTab
              globalInstruction={globalInstruction}
              setGlobalInstruction={setGlobalInstruction}
              selectedAgentType={selectedAgentType}
              // LLM Props
              agentGoal={agentGoal}
              setAgentGoal={setAgentGoal}
              agentTasks={agentTasks}
              setAgentTasks={setAgentTasks}
              agentPersonality={agentPersonality}
              setAgentPersonality={setAgentPersonality}
              agentRestrictions={agentRestrictions}
              setAgentRestrictions={setAgentRestrictions}
              agentModel={agentModel}
              setAgentModel={setAgentModel}
              agentTemperature={agentTemperature}
              setAgentTemperature={setAgentTemperature}
              systemPromptGenerated={systemPromptGenerated}
              agentToneOptions={agentToneOptions}
              // Workflow Props
              detailedWorkflowType={detailedWorkflowType}
              setDetailedWorkflowType={setDetailedWorkflowType}
              workflowDescription={workflowDescription}
              setWorkflowDescription={setWorkflowDescription}
              loopMaxIterations={loopMaxIterations}
              setLoopMaxIterations={setLoopMaxIterations}
              // Custom Props
              customLogicDescription={customLogicDescription}
              setCustomLogicDescription={setCustomLogicDescription}
            />

            {/* Aba Ferramentas: Permite ao usuário selecionar e configurar as ferramentas (capabilities) que o agente poderá utilizar. */}
            <ToolsTab
              availableTools={availableTools}
              selectedTools={selectedTools}
              setSelectedTools={setSelectedTools}
              toolConfigurations={toolConfigurations}
              handleToolConfigure={handleToolConfigure}
              iconComponents={iconComponents}
              Wand2Icon={Wand2}
              SettingsIcon={Settings}
              CheckIcon={Check}
              AlertIcon={Wand2} // Using Wand2 for the alert icon as in the original code
            />

            {/* Aba Estado & Memória: Configurações relacionadas à persistência de estado do agente e seus valores iniciais. */}
            <StateMemoryTab
              enableStatePersistence={enableStatePersistence}
              setEnableStatePersistence={setEnableStatePersistence}
              statePersistenceType={statePersistenceType}
              setStatePersistenceType={setStatePersistenceType}
              initialStateValues={initialStateValues}
              setInitialStateValues={setInitialStateValues}
              toast={toast}
              DatabaseIcon={Database}
            />

            {/* Aba RAG: Configurações para Retrieval Augmented Generation, permitindo ao agente consultar conhecimento externo. */}
            <RagTab
              enableRAG={enableRAG}
              setEnableRAG={setEnableRAG}
              ragMemoryConfig={ragMemoryConfig}
              setRagMemoryConfig={setRagMemoryConfig}
              initialRagMemoryConfig={initialRagMemoryConfig}
              toast={toast}
              FileJsonIcon={FileJson}
            />

            {/* Aba Artefatos: Configuração do armazenamento e gerenciamento de arquivos e outros artefatos que o agente pode criar ou utilizar. */}
            <ArtifactsTab
              enableArtifacts={enableArtifacts}
              setEnableArtifacts={setEnableArtifacts}
              artifactStorageType={artifactStorageType}
              setArtifactStorageType={setArtifactStorageType}
              localStoragePath={localStoragePath}
              setLocalStoragePath={setLocalStoragePath}
              cloudStorageBucket={cloudStorageBucket}
              setCloudStorageBucket={setCloudStorageBucket}
              artifacts={artifacts}
              setArtifacts={setArtifacts}
              UploadCloudIcon={UploadCloud}
            />

            {/* Aba Multi-Agente: Define o papel do agente em sistemas com múltiplos agentes e suas relações. */}
            <MultiAgentTab
              isRootAgent={isRootAgent}
              setIsRootAgent={setIsRootAgent}
              subAgentIds={subAgentIds}
              setSubAgentIds={setSubAgentIds}
              availableAgentsForSubSelector={availableAgentsForSubSelector}
              UsersIcon={Users}
              SubAgentSelectorComponent={SubAgentSelector}
            />

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

        {/* O Modal de Configuração de Ferramenta foi movido para seu próprio componente: ToolConfigModal */}
      </DialogContent>
      <ToolConfigModal
        isOpen={isToolConfigModalOpen}
        onOpenChange={(open) => {
          setIsToolConfigModalOpen(open);
          if (!open) {
            setConfiguringTool(null); // Limpa a ferramenta em configuração se o modal for fechado
          }
        }}
        configuringTool={configuringTool}
        onSave={handleSaveToolConfiguration}
        modalGoogleApiKey={modalGoogleApiKey} setModalGoogleApiKey={setModalGoogleApiKey}
        modalGoogleCseId={modalGoogleCseId} setModalGoogleCseId={setModalGoogleCseId}
        modalOpenapiSpecUrl={modalOpenapiSpecUrl} setModalOpenapiSpecUrl={setModalOpenapiSpecUrl}
        modalOpenapiApiKey={modalOpenapiApiKey} setModalOpenapiApiKey={setModalOpenapiApiKey}
        modalDbType={modalDbType} setModalDbType={setModalDbType}
        modalDbHost={modalDbHost} setModalDbHost={setModalDbHost}
        modalDbPort={modalDbPort} setModalDbPort={setModalDbPort}
        modalDbName={modalDbName} setModalDbName={setModalDbName}
        modalDbUser={modalDbUser} setModalDbUser={setModalDbUser}
        modalDbPassword={modalDbPassword} setModalDbPassword={setModalDbPassword}
        modalDbConnectionString={modalDbConnectionString} setModalDbConnectionString={setModalDbConnectionString}
        modalDbDescription={modalDbDescription} setModalDbDescription={setModalDbDescription}
        modalKnowledgeBaseId={modalKnowledgeBaseId} setModalKnowledgeBaseId={setModalKnowledgeBaseId}
        modalCalendarApiEndpoint={modalCalendarApiEndpoint} setModalCalendarApiEndpoint={setModalCalendarApiEndpoint}
        InfoIcon={Info}
      />
    </Dialog>
  );
};

export default AgentBuilderDialog;
