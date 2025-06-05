"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

// Importação de componentes UI
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDesc,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

// Importação de ícones
import { 
  Search, 
  Plus, 
  List, 
  LayoutGrid, 
  Users, 
  Wrench, 
  Ghost, 
  Book, 
  MessageSquareText,
  Settings,
  Trash2,
  Info // Added for ContextualHelp
} from "lucide-react";
import { Gauge, RefreshCw } from "lucide-react";
import { TbBuildingStore, TbBarbell } from "react-icons/tb";
import { RiArrowGoBackFill } from "react-icons/ri";

// Importações de hooks
import { useToast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import { useAgentStorage } from "@/hooks/use-agent-storage";
import { useAchievements } from "@/hooks/useAchievements"; // Added useAchievements
import ContextualHelp from "@/components/shared/ContextualHelp"; // Added ContextualHelp
import EmptyState from "@/components/shared/EmptyState"; // Added EmptyState
import Link from "next/link"; // Added Link for ContextualHelp
import AgentBuilderDialog from "@/components/features/agent-builder/agent-builder-dialog";
import AgentCard from "@/components/features/agent-builder/agent-card";

// Importações de tipos
import { 
  SavedAgentConfiguration,
  // Tool, // If 'Tool' was the simple interface from agent-configs-fixed, it's likely replaced by AvailableTool or another specific type.
           // unified-agent-types re-exports AvailableTool from tool-types.
  AvailableTool // Assuming the 'Tool' previously imported was meant to be AvailableTool or similar.
} from '@/types/unified-agent-types';
import {
  SavedAgentConfiguration as AdaptedSavedAgentConfiguration, // Alias to maintain usage if structure is compatible
  AgentFormData as AdaptedAgentFormData, // Alias to maintain usage if structure is compatible
  ToolConfigData // This is re-exported by unified-agent-types from tool-types
} from '@/types/unified-agent-types';
import {
  // AvailableTool, // Already imported above from unified-agent-types
  MCPServerConfig,
  ApiKeyEntry
} from "@/types/tool-types";

// Importações de utilitários
import { toAgentFormData, toSavedAgentConfiguration } from "@/lib/agent-type-utils";

// Componentes dinâmicos com lazy loading
// Removida duplicação: AgentBuilderDialog já foi importado diretamente acima

// Componentes de modal
const ToolConfigModal = React.lazy(() => 
  import("@/components/features/agent-builder/tool-config-modal")
);

const HelpModal = React.lazy(() => 
  import("@/components/ui/help-modal")
);

const FeedbackModal = React.lazy(() => 
  import("@/components/features/agent-builder/feedback-modal")
);

const ConfirmationModal = React.lazy(() => 
  import("@/components/ui/confirmation-modal")
);

const TemplateNameModal = React.lazy(() => 
  import("@/components/features/agent-builder/save-as-template-dialog")
);

const AgentMetricsView = React.lazy(() => 
  import("@/components/features/agent-builder/AgentMetricsView")
);

const AgentLogView = React.lazy(() => 
  import("@/components/features/agent-builder/AgentLogView")
);

// Mock data para compilação
const tutorials = [
  {
    id: 'createAgent',
    title: 'Como criar um agente',
    steps: [
      {
        title: 'Passo 1: Clique em Novo Agente',
        content: 'Comece clicando no botão <b>Novo Agente</b> no topo da página.'
      },
      {
        title: 'Passo 2: Configure seu agente',
        content: 'Preencha os campos obrigatórios, como nome e descrição.'
      }
    ]
  }
];// Mock para ferramentas disponíveis
const builderAvailableTools: AvailableTool[] = [
  {
    id: 'web-search',
    name: 'Pesquisa Web',
    description: 'Permite ao agente buscar informações na internet',
    category: 'knowledge',
    icon: 'search',
    needsApiKey: true
  },
  {
    id: 'code-interpreter',
    name: 'Interpretador de Código',
    description: 'Permite ao agente executar código Python',
    category: 'coding',
    icon: 'code',
    needsMcpServer: true
  }
];

// Mock para servidores MCP
const mockMcpServers: MCPServerConfig[] = [
  {
    id: 'mcp-1',
    name: 'MCP Local',
    description: 'Servidor MCP local para desenvolvimento',
    url: 'http://localhost:3000/api/mcp'
  }
];

// Mock para API Keys
const availableApiKeys: ApiKeyEntry[] = [
  {
    id: 'api-key-1',
    name: 'OpenAI API Key',
    key: '****',
    service: 'openai',
    createdAt: new Date().toISOString()
  }
];

// Interface para props do AgentRow
interface AgentRowProps {
  agent: AdaptedSavedAgentConfiguration;
  index: number;
  style: React.CSSProperties;
  onEdit: (agent: AdaptedSavedAgentConfiguration) => void;
  onDelete: (agent: AdaptedSavedAgentConfiguration) => void;
  onDuplicate: (agent: AdaptedSavedAgentConfiguration) => void;
  onSaveTemplate: (agent: AdaptedSavedAgentConfiguration) => void;
  onGenerateQualityReport: (agent: AdaptedSavedAgentConfiguration) => void; // Added for Task 8.2
}

// Função utilitária para salvar templates
const saveAgentTemplate = async (template: AdaptedSavedAgentConfiguration): Promise<void> => {
  // Implementação temporária para compilar
  console.log("Salvando template:", template);
  return Promise.resolve();
};

// Componente principal da página
export default function AgentBuilderPage() {
  // Estado para agentes
  const [agents, setAgents] = useState<AdaptedSavedAgentConfiguration[]>([]);
  const [selectedAgentForMonitoring, setSelectedAgentForMonitoring] = useState<AdaptedSavedAgentConfiguration | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados para modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = useState(false);
  const [isConfirmDeleteAgentOpen, setIsConfirmDeleteAgentOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [agentToSaveAsTemplate, setAgentToSaveAsTemplate] = useState<AdaptedSavedAgentConfiguration | null>(null);
const [templateName, setTemplateName] = useState<string>("");
const [configuringTool, setConfiguringTool] = useState<AvailableTool | null>(null);
// Estado para edição
const [editingAgent, setEditingAgent] = useState<AdaptedAgentFormData | null>(null);
const [agentToDelete, setAgentToDelete] = useState<AdaptedSavedAgentConfiguration | null>(null);
  const [currentSelectedApiKeyId, setCurrentSelectedApiKeyId] = useState<string | undefined>();
  
  // States for Task 8.2: Quality Report Modal
  const [isQualityReportModalOpen, setIsQualityReportModalOpen] = useState(false);
  const [qualityReportData, setQualityReportData] = useState<{
    agentName: string;
    metrics: Array<{ name: string; value: string | number; description?: string }>;
    suggestions: string[];
  } | null>(null);

  // Estados para tutorial
  // Estado para tutoriais
  const [activeTutorial, setActiveTutorial] = useState<any>(null);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);

  // State for ContextualHelp (Inactivity)
  const [showInactivityHelp, setShowInactivityHelp] = React.useState(false);
  const [userHasInteracted, setUserHasInteracted] = React.useState(false);
  const inactivityTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Hooks
  // const router = useRouter(); // Removido pois useRouter não está disponível nesta versão do Next.js
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { 
    savedAgents, 
    addAgent, 
    updateAgent, 
    deleteAgent, 
    isLoadingAgents 
  } = useAgents();
  const { unlockAchievement } = useAchievements(); // Initialize achievements hook
  const prevAgentCountRef = React.useRef(0); // Ref to store previous agent count

  // State for import confirmation
  const [isImportConfirmationOpen, setIsImportConfirmationOpen] = React.useState(false);
  const [agentToImportData, setAgentToImportData] = React.useState<Partial<SavedAgentConfiguration> | null>(null);
  
  // Efeito para carregar agentes do contexto
  useEffect(() => {
    if (savedAgents) {
      // Convertendo para o formato adaptado esperado pela UI
      const adaptedAgents: AdaptedSavedAgentConfiguration[] = savedAgents.map((agent) => ({
        ...agent,
        createdAt: typeof agent.createdAt === 'string' ? agent.createdAt : agent.createdAt?.toISOString?.() ?? '',
        updatedAt: typeof agent.updatedAt === 'string' ? agent.updatedAt : agent.updatedAt?.toISOString?.() ?? '',
        config: agent.config || {},
      })); // Converte datas para string ISO
      setAgents(adaptedAgents);

      // Achievement logic based on agent count changes
      const currentAgentCount = adaptedAgents.length;
      if (prevAgentCountRef.current !== currentAgentCount) {
        if (currentAgentCount === 1 && prevAgentCountRef.current === 0) {
          unlockAchievement('agent-created');
        }
        if (currentAgentCount === 5 && prevAgentCountRef.current === 4) {
          unlockAchievement('five-agents');
        }
        prevAgentCountRef.current = currentAgentCount;
      }
    } else { // If savedAgents is null or undefined (e.g. initial load or error)
      prevAgentCountRef.current = 0; // Reset if agent list is not available
    }
  }, [savedAgents, unlockAchievement]);

  // Effect to initialize prevAgentCountRef on mount if savedAgents is already populated
  useEffect(() => {
    if (savedAgents) {
      prevAgentCountRef.current = savedAgents.length;
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect for inactivity contextual help
  useEffect(() => {
    // Set a timer only if user hasn't interacted yet
    if (!userHasInteracted) {
      inactivityTimerRef.current = setTimeout(() => {
        if (!userHasInteracted) { // Check again before showing
          setShowInactivityHelp(true);
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [userHasInteracted]);

  const handleUserInteraction = () => {
    setUserHasInteracted(true);
    setShowInactivityHelp(false); // Hide help once user interacts
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  // Efeito para verificar parâmetros URL (tutorial e import de agente)
  useEffect(() => {
    if (searchParams) {
      const tutorialId = searchParams.get('tutorial');
      const importData = searchParams.get('data');

      if (tutorialId) {
        const tutorial = tutorials.find((t) => t.id === tutorialId);
        if (tutorial) {
          setActiveTutorial(tutorial);
          setCurrentTutorialStep(0);
          setIsTutorialModalOpen(true);
        }
      } else if (importData) {
        try {
          const decodedJson = atob(importData);
          const parsedAgentData = JSON.parse(decodedJson) as Partial<SavedAgentConfiguration>;

          if (parsedAgentData && parsedAgentData.agentName && parsedAgentData.config) {
            setAgentToImportData(parsedAgentData);
            setIsImportConfirmationOpen(true);
          } else {
            toast({
              title: "Erro na Importação",
              description: "Os dados do agente a ser importado são inválidos ou estão incompletos.",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Falha ao decodificar ou parsear dados do agente:", error);
          toast({
            title: "Erro na Importação",
            description: "Não foi possível processar os dados do agente para importação. O link pode estar corrompido.",
            variant: "destructive",
          });
        }
        // Clean the URL immediately after attempting to process to avoid re-processing on refresh / navigation issues
        // Using router.replace to avoid adding to history stack
        const currentPath = window.location.pathname;
        const newSearchParams = new URLSearchParams(window.location.search);
        newSearchParams.delete('data');
        window.history.replaceState({}, '', `${currentPath}?${newSearchParams.toString()}`);

      }
    }
  }, [searchParams, toast]); // Added router and toast to dependencies

  // Filtrar agentes com base na busca
  const filteredAgents = agents.filter((agent) => 
    agent.agentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (agent.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );  // Handlers para ações
  const handleCreateNewAgent = () => {
    handleUserInteraction(); // User interacted
    setEditingAgent({
      agentName: "",
      description: "",
      type: "llm",
      tools: [],
      systemPrompt: "",
      model: "gpt-3.5-turbo",
      temperature: 0.7,
      maxTokens: 2048
    });
    setIsCreateModalOpen(true);
  };

  const handleEditAgent = (agent: AdaptedSavedAgentConfiguration) => {
    // Converter de SavedAgentConfiguration para AgentFormData
    setEditingAgent(toAgentFormData(agent));
    setIsEditModalOpen(true);
  };

  const handleDuplicateAgent = (agent: AdaptedSavedAgentConfiguration) => {
    const duplicatedAgentData: AdaptedAgentFormData = {
      ...toAgentFormData(agent),
      id: undefined, // Remover ID para criar um novo
      agentName: `${agent.agentName} (Cópia)`
    };
    
    setEditingAgent(duplicatedAgentData);
    setIsCreateModalOpen(true);
  };

  const handleDeleteAgent = (agent: AdaptedSavedAgentConfiguration) => {
    setAgentToDelete(agent);
    setIsConfirmDeleteAgentOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (agentToDelete) {
      try {
        const success = await deleteAgent(agentToDelete.id);
        if (success) {
          toast({
            title: "Agente excluído",
            description: `O agente "${agentToDelete.agentName}" foi excluído com sucesso.`
          });
        } else {
          toast({
            title: "Erro ao excluir",
            description: "Não foi possível excluir o agente. Tente novamente.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Erro ao excluir agente:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o agente. Tente novamente.",
          variant: "destructive"
        });
      }
      setIsConfirmDeleteAgentOpen(false);
      setAgentToDelete(null);
    }
  };

  const handleSaveAsTemplate = (agent: AdaptedSavedAgentConfiguration) => {
    setAgentToSaveAsTemplate(agent);
    setTemplateName(`${agent.agentName} Template`);
    setIsSaveTemplateModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (agentToSaveAsTemplate && templateName) {
      try {
        // Clone o agente, mas marque como template
        const templateAgent: AdaptedSavedAgentConfiguration = {
          ...agentToSaveAsTemplate,
          id: uuidv4(), // Novo ID para o template
          agentName: templateName,
          isTemplate: true
        };
        
        // Salvar template (implementação temporária)
        await saveAgentTemplate(templateAgent);
        
        toast({
          title: "Template salvo",
          description: `O template "${templateName}" foi salvo com sucesso!`
        });
        
        setIsSaveTemplateModalOpen(false);
        setAgentToSaveAsTemplate(null);
        setTemplateName("");
      } catch (error) {
        console.error("Erro ao salvar template:", error);
        toast({
          title: "Erro ao salvar template",
          description: "Ocorreu um erro ao salvar o template. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };

  // Função para configurar uma ferramenta
  const handleConfigureTool = (tool: AvailableTool) => {
    setConfiguringTool(tool);
    setIsToolConfigModalOpen(true);
  };

  // Função para salvar configuração de ferramenta
  const handleSaveToolConfig = (toolId: string, configData: ToolConfigData) => {
    if (editingAgent) {
      // Adicionando ou atualizando configuração da ferramenta
      setEditingAgent((prevAgent) => {
        if (!prevAgent) return null;
        
        return {
          ...prevAgent,
          toolConfigsApplied: {
            ...(prevAgent.toolConfigsApplied || {}),
            [toolId]: configData
          }
        };
      });
    }
    
    setIsToolConfigModalOpen(false);
    setConfiguringTool(null);
  };  // Handlers para o tutorial
  const handleTutorialNext = () => {
    if (activeTutorial && currentTutorialStep < activeTutorial.steps.length - 1) {
      setCurrentTutorialStep(currentTutorialStep + 1);
    } else {
      closeTutorialModal();
    }
  };

  const handleTutorialPrev = () => {
    if (currentTutorialStep > 0) {
      setCurrentTutorialStep(currentTutorialStep - 1);
    }
  };

  const closeTutorialModal = () => {
    setIsTutorialModalOpen(false);
    setActiveTutorial(null);
    setCurrentTutorialStep(0);
    
    // Remover parâmetro tutorial da URL
    const params = new URLSearchParams(window.location.search);
    params.delete('tutorial');
    const newRelativePathQuery = `${window.location.pathname}?${params.toString()}`;
    router.replace(newRelativePathQuery);
  };

  // Handler para selecionar agente para monitoramento
  const handleSelectAgentForMonitoring = (agent: AdaptedSavedAgentConfiguration) => {
    setSelectedAgentForMonitoring(prev => 
      prev?.id === agent.id ? null : agent
    );
  };

  // Cálculo de estatísticas
  const totalAgents = agents.length;
  const agentsWithTools = agents.filter(agent => 
    agent.config.tools && agent.config.tools.length > 0
  ).length;

  // Handler for Task 8.2: Generate Quality Report
  const handleGenerateQualityReport = (agent: AdaptedSavedAgentConfiguration) => {
    // Simulate report generation
    const mockMetrics = [
      { name: "Exact Match (EM)", value: `${(Math.random() * 30 + 60).toFixed(1)}%`, description: "Percentual de respostas idênticas às esperadas." },
      { name: "ROUGE-L (F1)", value: (Math.random() * 0.2 + 0.7).toFixed(2), description: "Similaridade baseada na maior subsequência comum." },
      { name: "Consistência da Resposta", value: `${(Math.random() * 20 + 75).toFixed(1)}%` },
      { name: "Utilização de Ferramentas (Sucesso)", value: `${(Math.random() * 15 + 80).toFixed(1)}%` },
      { name: "Latência Média (ms)", value: Math.floor(Math.random() * 800 + 200) },
    ];
    const mockSuggestions = [
      "Considere refinar o prompt para cenários de ambiguidade.",
      `Para o agente "${agent.agentName}", adicione a ferramenta 'DatabaseAccess' para consultas diretas.`,
      "Revise os logs de erro para identificar padrões de falha.",
      "Aumente a diversidade do evalset para cobrir mais casos de uso.",
      // Placeholder for AI Configuration Assistant
      "Integrar com 'AI Configuration Assistant' para sugestões de otimização de prompt e configuração de modelo (feature futura)."
    ];

    setQualityReportData({
      agentName: agent.agentName,
      metrics: mockMetrics,
      suggestions: mockSuggestions,
    });
    setIsQualityReportModalOpen(true);
  };

  // Renderização conditional com base no estado de carregamento
  if (isLoadingAgents) {
    return <div className="flex items-center justify-center h-screen">Carregando agentes...</div>;
  }
  // Handler para salvar agente (criação ou edição)
  const handleSaveAgent = async (formData: AdaptedAgentFormData) => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);

    try {
      // Determinar se estamos editando ou criando
      if (formData.id) {
        // Edição de agente existente
        const updatedAgent = await updateAgent(formData.id, {
          agentName: formData.agentName,
          description: formData.description || "",
          config: {
            tools: formData.tools.map(toolId => {
              const tool = builderAvailableTools.find(t => t.id === toolId);
              return {
                id: toolId,
                name: tool?.name || toolId,
                enabled: true,
                config: formData.toolConfigsApplied?.[toolId]?.config || {}
              };
            }),
            systemPrompt: formData.systemPrompt,
            model: formData.model,
            temperature: formData.temperature,
            maxTokens: formData.maxTokens,
            scriptContent: formData.scriptContent,
            scriptPath: formData.scriptPath
          }
          // Removido isPublic para compatibilidade com o tipo
        });

        if (updatedAgent) {
          toast({
            title: "Agente atualizado",
            description: `O agente ${updatedAgent.agentName} foi atualizado com sucesso!`
          });
        } else {
          toast({
            title: "Erro ao atualizar agente",
            description: "Houve um problema ao atualizar o agente. Tente novamente.",
            variant: "destructive"
          });
        }
      } else {
        // Criação de novo agente
        const createdAgent = await addAgent({
          agentName: formData.agentName,
          description: formData.description || "",
          config: {
            tools: formData.tools.map(toolId => {
              const tool = builderAvailableTools.find(t => t.id === toolId);
              return {
                id: toolId,
                name: tool?.name || toolId,
                enabled: true,
                config: formData.toolConfigsApplied?.[toolId]?.config || {}
              };
            }),
            systemPrompt: formData.systemPrompt,
            model: formData.model,
            temperature: formData.temperature,
            maxTokens: formData.maxTokens,
            scriptContent: formData.scriptContent,
            scriptPath: formData.scriptPath
          }
          // Removido isPublic para compatibilidade com o tipo
        });

        if (formData) {
          toast({
            title: "Agente criado",
            description: `O agente ${formData.agentName} foi criado com sucesso!`
          });
        } else {
          toast({
            title: "Erro ao criar agente",
            description: "Houve um problema ao criar o agente. Tente novamente.",
            variant: "destructive"
          });
        }
      }

  // Componente de renderização para cada linha/card de agente
  const RenderAgentRow = ({ agent, index, style, onGenerateQualityReport }: AgentRowProps) => {
    return (
      <div style={style} className="px-1 py-2">
        <AgentCard
          agent={agent}
          onEdit={() => handleEditAgent(agent)}
          onDelete={() => handleDeleteAgent(agent)}
          onDuplicate={() => handleDuplicateAgent(agent)}
          onSaveTemplate={() => handleSaveAsTemplate(agent)}
          onSelectForMonitoring={() => handleSelectAgentForMonitoring(agent)}
          isSelectedForMonitoring={selectedAgentForMonitoring?.id === agent.id}
          onGenerateQualityReport={onGenerateQualityReport} // Pass down the handler
          availableTools={builderAvailableTools}
          agentTypeOptions={[]}
          onToggleFavorite={() => {}}
        />
      </div>
    );
  };

  const handleConfirmImport = async () => {
    if (!agentToImportData) return;

    let agentName = agentToImportData.agentName || "Agente Importado";
    // Checa conflitos de nome
    let nameConflictCount = 0;
    let newName = agentName;
    while (agents.some(a => a.agentName === newName)) {
      nameConflictCount++;
      newName = `${agentName} (${nameConflictCount})`;
    }
    agentName = newName;

    const importedAgent: SavedAgentConfiguration = {
      id: uuidv4(),
      agentName,
      description: agentToImportData.description || "",
      config: agentToImportData.config!,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: agentToImportData.userId || "",
      isTemplate: false
    };

    try {
      await addAgent(importedAgent);
      toast({
        title: "Agente Importado",
        description: `O agente "${importedAgent.agentName}" foi importado com sucesso.`,
      });
      setIsImportConfirmationOpen(false);
    } catch (error) {
      console.error("Erro ao importar agente:", error);
      toast({
        title: "Erro na Importação",
        description: "Não foi possível adicionar o agente importado.",
        variant: "destructive",
      });
    }

    setIsImportConfirmationOpen(false);
    setAgentToImportData(null);
    // URL should have already been cleaned by the useEffect that detected 'data'
  };
  
  // Renderização do componente principal
  return (
    <>
      <div className="container mx-auto py-6 space-y-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Construtor de Agentes</h1>
            <p className="text-gray-500">Crie, gerencie e monitore seus agentes de IA</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleCreateNewAgent}>
              <Plus className="mr-2 h-4 w-4" /> Novo Agente
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsFeedbackModalOpen(true)}
            >
              <MessageSquareText className="mr-2 h-4 w-4" /> Feedback
            </Button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total de Agentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-2xl font-bold">{agents.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Ferramentas Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Wrench className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-2xl font-bold">{builderAvailableTools.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Tutoriais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Book className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-2xl font-bold">{tutorials.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Desempenho Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <Gauge className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-2xl font-bold">98%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controles de visualização */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Pesquisar agentes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleUserInteraction(); // User interacted
                }}
                onFocus={handleUserInteraction} // User interacted
              />
            </div>
          </div>
          <div>
            {isLoadingAgents ? (
              <div className="flex items-center">
                <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                <span>Carregando...</span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">
                {filteredAgents.length} {filteredAgents.length === 1 ? 'agente' : 'agentes'}
              </span>
            )}
          </div>
        </div>        {/* Exibição condicional: Monitoramento de Agente ou Lista de Agentes */}
        {selectedAgentForMonitoring ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Monitorando: {selectedAgentForMonitoring.agentName}</h2>
              <Button "outline" onClick={() => setSelectedAgentForMonitoring(null)} className="mb-4">
                <span className="mr-2 flex items-center">←</span> Voltar para lista
              </Button>
              {selectedAgentForMonitoring && (
                <Suspense fallback={<div>Carregando métricas...</div>}>
                  <AgentMetricsView name="Métricas" agentId={selectedAgentForMonitoring.id} />
                </Suspense>
              )}
            </div>
            <Suspense fallback={<div>Carregando logs...</div>}>
              <AgentLogView name="Logs" agentId={selectedAgentForMonitoring.id} />
            </Suspense>
          </div>
        ) : (
          // Check if there are no agents at all
          agents.length === 0 ? (
            <EmptyState
              title="Nenhum Agente Criado Ainda"
              description="Parece que você não tem nenhum agente. Comece criando seu primeiro agente para automatizar tarefas e interagir com IA."
              icon={<Ghost className="h-16 w-16" />} // Using Ghost as per original, Cpu or Plus could also work
              actionButton={{
                text: "Criar Novo Agente",
                onClick: handleCreateNewAgent,
                icon: <Plus className="mr-2 h-4 w-4" />,
                variant: "default"
              }}
              className="my-12" // Add some margin for better spacing
            />
          ) : // Check if there are agents, but none match the filter
          filteredAgents.length === 0 ? (
            <EmptyState
              title="Nenhum Agente Encontrado"
              description="Nenhum agente corresponde à sua pesquisa. Tente um termo diferente ou limpe a pesquisa."
              icon={<Search className="h-16 w-16" />}
              className="my-12"
              // No action button for "no search results" or a different one like "Clear Search"
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((agent: AdaptedSavedAgentConfiguration, index: number) => (
                <RenderAgentRow
  key={agent.id}
  agent={agent}
  index={index}
  style={{}}
  onEdit={() => handleEditAgent(agent)}
  onDelete={() => handleDeleteAgent(agent)}
  onDuplicate={() => handleDuplicateAgent(agent)}
  onSaveTemplate={() => handleSaveAsTemplate(agent)}
  onGenerateQualityReport={() => handleGenerateQualityReport(agent)}
/>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAgents.map((agent: AdaptedSavedAgentConfiguration, index: number) => (
                <RenderAgentRow
  key={agent.id}
  agent={agent}
  index={index}
  style={{}}
  onEdit={() => handleEditAgent(agent)}
  onDelete={() => handleDeleteAgent(agent)}
  onDuplicate={() => handleDuplicateAgent(agent)}
  onSaveTemplate={() => handleSaveAsTemplate(agent)}
  onGenerateQualityReport={() => handleGenerateQualityReport(agent)}
/>
              ))}
            </div>
          )
        )}

        <ContextualHelp
          type="alert"
          show={showInactivityHelp && !userHasInteracted && agents.length === 0} // Show only if no agents and no interaction
          icon={<Info className="h-4 w-4" />}
          alertTitle="Precisa de Ajuda?"
          content={
            <>
              Parece que você ainda não criou nenhum agente. Precisa de ajuda para começar? Confira nossos{" "}
              <Link href="/tutorials" className="underline hover:text-primary">
                tutoriais
              </Link>{" "}
              ou clique em &quot;Novo Agente&quot; para iniciar.
            </>
          }
        />
      </div> {/* Modais - Carregamento lazy com Suspense */}
      <Suspense fallback={<div>Carregando...</div>}>
        {/* Modal de Criação/Edição */}
        {isCreateModalOpen && editingAgent && (
          <AgentBuilderDialog
            name="Criar Agente"
            isOpen={isCreateModalOpen}
            onOpenChange={(open: boolean) => {
              setIsCreateModalOpen(open);
              if (open) handleUserInteraction(); // Interaction when modal opens
            }}
            initialData={editingAgent}
            onSave={(data: AdaptedAgentFormData) => {
              handleSaveAgent(data);
              handleUserInteraction(); // Interaction on save
            }}
            availableTools={builderAvailableTools}
            onConfigureTool={(tool) => {
              handleConfigureTool(tool);
              handleUserInteraction(); // Interaction on tool config
            }}
          />
        )}
        
        {isEditModalOpen && editingAgent && (
          <AgentBuilderDialog
            name="Editar Agente"
            isOpen={isEditModalOpen}
            onOpenChange={(open: boolean) => {
              setIsEditModalOpen(open);
              if (open) handleUserInteraction(); // Interaction when modal opens
            }}
            initialData={editingAgent}
            onSave={(data: AdaptedAgentFormData) => {
              handleSaveAgent(data);
              handleUserInteraction(); // Interaction on save
            }}
            availableTools={builderAvailableTools}
            onConfigureTool={(tool) => {
              handleConfigureTool(tool);
              handleUserInteraction(); // Interaction on tool config
            }}
          />
        )}
        
        {/* Modais adicionais */}
        {isSaveTemplateModalOpen && agentToSaveAsTemplate && (
          <TemplateNameModal
            name="Salvar como Template"
            isOpen={isSaveTemplateModalOpen}
            onOpenChange={(open: boolean) => setIsSaveTemplateModalOpen(open)}
            templateName={templateName}
            onTemplateNameChange={setTemplateName}
            onSave={handleSaveTemplate}
          />
        )}

        {agentToDelete && (
          <ConfirmationModal
            name="Confirmação"
            isOpen={isConfirmDeleteAgentOpen}
            onOpenChange={(open: boolean) => {
              setIsConfirmDeleteAgentOpen(open);
              if (!open) setAgentToDelete(null);
            }}
            title="Confirmar Exclusão"
            description={`Tem certeza que deseja excluir o agente "${agentToDelete.agentName}"? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            cancelText="Cancelar"
            onAction={handleDeleteConfirm}
          />
        )}
        
        {isToolConfigModalOpen && configuringTool && editingAgent && (
          <ToolConfigModal
            name="Configuração de Ferramentas"
            isOpen={isToolConfigModalOpen}
            onOpenChange={(open: boolean) => setIsToolConfigModalOpen(open)}
            configuringTool={configuringTool}
            onSave={handleSaveToolConfig}
            availableApiKeys={availableApiKeys}
            mcpServers={mockMcpServers}
            selectedApiKeyId={currentSelectedApiKeyId}
          />
        )}
        
        {isTutorialModalOpen && activeTutorial && (
          <HelpModal
            name="Ajuda"
            onClose={closeTutorialModal}
            title={activeTutorial?.steps?.[currentTutorialStep]?.title || 'Tutorial'}
            isTutorial={true}
            currentStep={currentTutorialStep}
            totalSteps={activeTutorial?.steps?.length || 0}
            onNextStep={handleTutorialNext}
            onPrevStep={handleTutorialPrev}
            size="lg"
          >
            <div dangerouslySetInnerHTML={{ __html: (activeTutorial?.steps?.[currentTutorialStep]?.content as string) || '' }} />
          </HelpModal>
        )}

        {isFeedbackModalOpen && (
          <FeedbackModal
            name="Feedback"
            isOpen={isFeedbackModalOpen}
            onOpenChange={(open: boolean) => setIsFeedbackModalOpen(open)}
          />
        )}

        {/* Quality Report Modal (Task 8.2) */}
        {isQualityReportModalOpen && qualityReportData && (
          <Dialog open={isQualityReportModalOpen} onOpenChange={setIsQualityReportModalOpen}>
            <DialogContent className="sm:max-w-2xl"> {/* Wider modal */}
              <DialogHeader>
                <DialogTitle>Relatório de Qualidade do Agente: {qualityReportData.agentName}</DialogTitle>
                <DialogDesc> {/* Using DialogDesc to avoid conflict */}
                  Uma análise simulada da performance e sugestões de melhoria para o agente.
                </DialogDesc>
              </DialogHeader>
              <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2"> {/* Scrollable content */}
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Métricas de Avaliação (Simuladas)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {qualityReportData.metrics.map(metric => (
                      <Card key={metric.name} className="bg-muted/30">
                        <CardHeader className="pb-2 pt-3 px-4">
                          <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3 px-4">
                          <p className="text-2xl font-bold text-primary">{String(metric.value)}</p>
                          {metric.description && <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Sugestões de Melhoria</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {qualityReportData.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsQualityReportModalOpen(false)}>Fechar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Import Confirmation Modal */}
        {agentToImportData && (
          <ConfirmationModal
            name="Confirmar Importação de Agente"
            isOpen={isImportConfirmationOpen}
            onOpenChange={(open: boolean) => {
              setIsImportConfirmationOpen(open);
              if (!open) setAgentToImportData(null); // Clear data if modal is closed without confirming
            }}
            title={`Importar Agente: ${agentToImportData.agentName || 'Desconhecido'}?`}
            description={
              `Você está prestes a importar o agente "${agentToImportData.agentName || 'Desconhecido'}".
              Descrição: ${agentToImportData.description || 'N/A'}.
              Uma nova cópia será criada em sua lista de agentes.`
            }
            confirmText="Importar"
            cancelText="Cancelar"
            onAction={handleConfirmImport}
          />
        )}
      </Suspense>
    </>
  );
}