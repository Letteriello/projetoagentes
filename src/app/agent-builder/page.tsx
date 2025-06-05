// src/app/agent-builder/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Suspense } from 'react';
import { MdOutlineSpeed } from 'react-icons/md';
import { IoMdRefresh } from 'react-icons/io';
import { TbBuildingStore, TbBarbell } from 'react-icons/tb';
import { RiArrowGoBackFill } from 'react-icons/ri';
import {
  Cpu,
  Plus,
  Layers,
  Info,
  MessageSquareText,
  Edit3,
  Ghost,
  Users,
  Wrench,
  Route,
  Book,
  Search,
  List,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { saveAgentTemplate, getAgentTemplate } from "@/lib/agentServices";
import { useAgents } from "@/contexts/AgentsContext";
import { useAgentStorage } from "@/hooks/use-agent-storage";
import { cn } from "@/lib/utils";
import { AgentCard } from "@/components/features/agent-builder/agent-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Criando um tipo adaptador para resolver incompatibilidades
type AdaptedAgentFormData = any;
type AdaptedSavedAgentConfiguration = SavedAgentConfiguration;

// Usando o tipo AgentFormData do arquivo unificado

// Importando corretamente do arquivo agentBuilderConfig
import { 
  builderAvailableTools as defaultAvailableTools,
  iconComponents,
  // Assuming mcpServers might come from a config file or be defined here
  // For now, defining mock data directly in the page component.
} from "@/data/agentBuilderConfig";

// Definindo tipos locais para os componentes dinâmicos
type DynamicComponent = {
  default: React.ComponentType<any>;
};

// Criando wrappers para os componentes dinâmicos para garantir a tipagem correta
const withDefaultExport = <T extends object>(
  component: T
): T & { default: React.ComponentType<any> } => {
  return {
    ...component,
    default: (component as any).default || (() => null)
  } as any;
};

// Definindo agentTypeOptions localmente
const agentTypeOptions = [
  { id: 'llm', label: 'LLM Agent', description: 'Agente baseado em modelo de linguagem' },
  { id: 'workflow', label: 'Workflow Agent', description: 'Agente baseado em fluxo de trabalho' },
  { id: 'custom', label: 'Custom Agent', description: 'Agente personalizado' },
  { id: 'a2a', label: 'A2A Agent', description: 'Agente de aplicativo para aplicativo' }
];

// Definindo agentToneOptions localmente já que não está mais disponível no agentBuilderConfig
export const agentToneOptions = [
  { id: 'professional', label: 'Profissional' },
  { id: 'friendly', label: 'Amigável' },
  { id: 'casual', label: 'Casual' },
  { id: 'formal', label: 'Formal' },
  { id: 'technical', label: 'Técnico' },
];

// Importações de componentes com formas alternativas para garantir compatibilidade
// com as várias formas que os componentes podem estar exportados

// Componentes com carregamento dinâmico
// Usamos um componente placeholder temporário enquanto resolvemos os problemas de importação
const PlaceholderComponent = (props: any) => (
  <div className="p-4 border border-dashed rounded-md">
    <p className="text-center text-gray-400">
      {props.name || "Componente"} (Carregando...)
    </p>
  </div>
);

// Ao invés de tentar carregar dinamicamente os componentes agora, vamos usar componentes placeholder
// Ajustamos os caminhos de importação para nomes que existem no projeto
const AgentBuilderDialog = PlaceholderComponent;
const ToolConfigModal = PlaceholderComponent;
const SaveAsTemplateDialog = PlaceholderComponent;
const AgentCreatorForm = PlaceholderComponent;
const AgentCreatorChatUI = PlaceholderComponent;
const FeedbackModal = PlaceholderComponent;
const HelpModal = PlaceholderComponent;
const AgentTemplatesGallery = PlaceholderComponent;
const ConfirmationModal = PlaceholderComponent;
const AgentLogView = PlaceholderComponent;
const AgentMetricsView = PlaceholderComponent;

const AGENT_CARD_LIST_ITEM_SIZE = 210; // Approximate height of an agent card + padding

// Mock para tutoriais
const tutorials = [
  { id: "1", title: "Introdução", content: "Conteúdo do tutorial de introdução" },
  { id: "2", title: "Primeiros Passos", content: "Conteúdo primeiros passos" }
];

// Mock para ApiKeyEntry
interface ApiKeyEntry {
  name: string;
  key: string;
  isDefault: boolean;
}

// Definição para AgentRowProps
interface AgentRowProps {
  agent: any;
  index: number;
  style: React.CSSProperties;
  onEdit: (agent: any) => void;
  onDelete: (agent: any) => void;
  onDuplicate: (agent: any) => void;
  onSaveTemplate: (agent: any) => void;
}

// Mock para builderAvailableTools
const builderAvailableTools = [
  { id: "1", name: "Ferramenta 1", description: "Descrição ferramenta 1" },
  { id: "2", name: "Ferramenta 2", description: "Descrição ferramenta 2" }
];

interface AgentBuilderPageProps {
  searchParams?: {
    agentId?: string;  // Permitir opções de filtragem nas URLs através de parâmetros
    tab?: string;
    create?: string; // 'true' para abrir o modal de criação
    edit?: string;   // ID do agente para editar
    monitor?: string; // ID do agente para monitorar
  };
}

// Mock MCP Servers data - to be owned by AgentBuilderPage
const mockMcpServers: MCPServerConfig[] = [
  { id: 'mcp-server-page-1', name: 'MCP Server Alpha (from Page)', url: 'https://mcp.page.com/alpha', description: 'Primary MCP processing server from Page context.' },
  { id: 'mcp-server-page-2', name: 'MCP Server Beta (from Page)', url: 'https://mcp.page.com/beta', description: 'Experimental MCP server from Page context.' },
];

export default function AgentBuilderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const {
    savedAgents: agents, 
    addAgent, 
    updateAgent, 
    deleteAgent, 
    isLoadingAgents: isLoading,
    fetchAgents: refreshAgents 
  } = useAgents();
  
  // Usamos uma variável para o erro, já que a propriedade pode não existir no contexto
  const agentsError = null;
  
  // Utilizando hooks de armazenamento de agentes
  const {
    saveAgent: saveAgentConfig,
    loadAgents: loadAgentConfigs,
    deleteAgent: deleteAgentConfig,
  } = useAgentStorage();

  const [isBuilderModalOpen, setIsBuilderModalOpen] = React.useState(false);
  const [editingAgent, setEditingAgent] = React.useState<any>(null);
  const [isConfirmDeleteAgentOpen, setIsConfirmDeleteAgentOpen] = React.useState(false);
  const [agentToDelete, setAgentToDelete] = React.useState<SavedAgentConfiguration | null>(null);
  const [isSaveAsTemplateModalOpen, setIsSaveAsTemplateModalOpen] = React.useState(false);
  const [agentToSaveAsTemplate, setAgentToSaveAsTemplate] = React.useState<SavedAgentConfiguration | null>(null);
  const [buildMode, setBuildMode] = React.useState<'form' | 'chat'>('form'); // Controla o modo de edição
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  // Tutorial State
  const [isTutorialModalOpen, setIsTutorialModalOpen] = React.useState(false);
  const [activeTutorial, setActiveTutorial] = React.useState(tutorials.createAgent); // Default tutorial
  const [currentTutorialStep, setCurrentTutorialStep] = React.useState(0);

  // Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false);

  // Estado para o monitoramento de agentes
  const [selectedAgentForMonitoring, setSelectedAgentForMonitoring] = React.useState<SavedAgentConfiguration | null>(null);

  // State for ToolConfigModal
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false);
  const [configuringTool, setConfiguringTool] = React.useState<AvailableTool | null>(null);
  // API Key related states for ToolConfigModal (assuming these are managed here or passed down)
  // These might need to be lifted from AgentBuilderDialog or managed via context if not already here.
  // For now, let's assume they are available or will be added.
  const [currentSelectedApiKeyId, setCurrentSelectedApiKeyId] = React.useState<string | undefined>(undefined);
  const [availableApiKeys, setAvailableApiKeys] = React.useState<ApiKeyEntry[]>([]); // Define ApiKeyEntry if not already available

  const handleCreateNewAgent = React.useCallback(() => {
    // Function to handle creating a new agent - opens the builder modal with empty form
  const handleCreateNewAgent = React.useCallback(() => {
    const defaultAgent = {
      agentName: "",
      agentDescription: "",
      agentVersion: "1.0",
      config: {
        type: "llm",
        models: ["gpt-3.5-turbo"],
        systemPrompt: "",
      },
      tools: [],
      toolsDetails: [],
      agentType: "support",
      agentTone: "friendly",
      agentIcon: "🤖",
      agentAvatarUrl: "",
      // Other default values for a new agent
    };
    setEditingAgent(defaultAgent as any);
    setBuildMode('form');
    setIsBuilderModalOpen(true);
  }, []);

  React.useEffect(() => {
    // Parâmetro 'create' para criar um novo agente
    if (searchParams.get('create') === 'true') {
      handleCreateNewAgent();
    }

    // Parâmetro 'edit' com ID para editar um agente
    const editId = searchParams.get('edit');
    if (editId) {
      const agentToEdit = agents.find(a => a.id === editId);
      if (agentToEdit) {
        handleEditAgent(agentToEdit);
      }
    }

    // Parâmetro 'monitor' com ID para monitorar um agente
    const monitorId = searchParams.get('monitor');
    if (monitorId) {
      const agentToMonitor = agents.find(a => a.id === monitorId);
      if (agentToMonitor) {
        setSelectedAgentForMonitoring(agentToMonitor);
      }
    }
  }, [searchParams, agents, handleCreateNewAgent]);

  // Este useEffect já estava sendo implementado acima, então removemos a duplicação

  // Adapta um SavedAgentConfiguration para o formulário
  const handleEditAgent = (agent: SavedAgentConfiguration) => {
    try {
      // Converter para AgentFormData antes de passar para edição
      const agentFormData = toAgentFormData(agent);
      // Usamos casting para evitar incompatibilidade de tipos entre módulos
      setEditingAgent(agentFormData as unknown as AdaptedAgentFormData);
      setBuildMode('form');
      setIsBuilderModalOpen(true);
    } catch (error) {
      console.error('Erro ao editar agente:', error);
      toast({
        title: 'Erro ao editar agente',
        description: 'Ocorreu um erro ao preparar o agente para edição',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAgent = (agent: SavedAgentConfiguration) => {
    setAgentToDelete(agent);
    setIsConfirmDeleteAgentOpen(true);
  };

  const onConfirmDeleteAgent = async () => {
    if (agentToDelete) {
      try {
        await deleteAgent(agentToDelete.id);
        toast({
          title: "Agente Excluído",
          description: `O agente "${agentToDelete.agentName}" foi excluído com sucesso.`,
          variant: "success",
        });
        setAgentToDelete(null);
        setIsConfirmDeleteAgentOpen(false);
        if (selectedAgentForMonitoring?.id === agentToDelete.id) {
          setSelectedAgentForMonitoring(null);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Erro ao excluir o agente "${agentToDelete.agentName}":`, error);
        toast({
          title: "Erro ao Excluir Agente",
          description: errorMessage || "Ocorreu um erro desconhecido.",
          variant: "destructive"
        });
      }
    }
  };

  const [isSaving, setIsSaving] = React.useState(false);
  
  const handleFormSubmit = (data: AdaptedAgentFormData) => {
    try {
      // Check if this is an edit (if agent has an ID) or a new addition
      if (editingAgent?.id) {
        // Preserve the ID during edit
        const updatedAgent = { ...data, id: editingAgent.id };
        const finalConfig = toSavedAgentConfiguration(updatedAgent) as SavedAgentConfiguration;
        
        updateAgent(finalConfig);
        toast({
          title: "Agente Atualizado",
          description: `O agente "${data.agentName}" foi atualizado com sucesso.`,
          variant: "default",
        });
      } else {
        // Create a new agent with a UUID
        const newAgentWithId = { ...data, id: uuidv4() };
        const finalConfig = toSavedAgentConfiguration(newAgentWithId) as SavedAgentConfiguration;
        
        addAgent(finalConfig);
        toast({
          title: "Agente Criado",
          description: `O agente "${data.agentName}" foi criado com sucesso.`,
          variant: "default",
        });
      }

      // Close the modal and reset form
      setIsBuilderModalOpen(false);
        setEditingAgent(null); // This is AgentFormData
    } catch (error) {
      console.error("Erro ao processar o formulário:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o agente. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAsTemplate = (agent: SavedAgentConfiguration) => {
    try {
      setAgentToSaveAsTemplate(agent);
      setIsSaveAsTemplateModalOpen(true);
    } catch (error) {
      console.error("Erro ao preparar template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível preparar o agente para salvar como template.",
        variant: "destructive",
      });
    }
  };

  // Função auxiliar para lidar com erros de forma consistente
  const handleError = (error: unknown, defaultMessage: string) => {
    console.error(defaultMessage, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    toast({
      title: 'Erro',
      description: defaultMessage + (errorMessage ? `: ${errorMessage}` : ''),
      variant: 'destructive',
    });
  };

  const onConfirmSaveAsTemplate = async (templateName: string) => {
    if (agentToSaveAsTemplate) {
      try {
        await saveAgentTemplate(agentToSaveAsTemplate, templateName);
        toast({
          title: "Template Salvo",
          description: `O agente "${agentToSaveAsTemplate.agentName}" foi salvo como template "${templateName}"`,
          variant: "default"
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error("Error saving agent as template:", error);
        toast({
          title: "Erro ao Salvar Template",
          description: errorMessage || "Ocorreu um erro desconhecido ao salvar o template.",
          variant: "destructive"
        });
      }
      setIsSaveAsTemplateModalOpen(false);
      setAgentToSaveAsTemplate(null);
    }
  };

  const handleSelectAgentForMonitoring = (agent: SavedAgentConfiguration) => {
    setSelectedAgentForMonitoring(agent);
    // Navega para a URL com o parâmetro monitor para mostrar logs/métricas
    router.push(`/agent-builder?monitor=${agent.id}`, { scroll: false });
  };

  const handleOpenTutorial = (tutorialId: keyof typeof tutorials) => {
    setActiveTutorial(tutorials[tutorialId]);
    setCurrentTutorialStep(0);
    setIsTutorialModalOpen(true);
  };

  const closeTutorialModal = () => setIsTutorialModalOpen(false);
  const handleTutorialNext = () => setCurrentTutorialStep(prev => Math.min(prev + 1, activeTutorial.steps.length - 1));
  const handleTutorialPrev = () => setCurrentTutorialStep(prev => Math.max(prev - 1, 0));

  // Handler to open ToolConfigModal
  const handleConfigureTool = (tool: AvailableTool) => {
    setConfiguringTool(tool);
    // Assuming toolConfigsApplied is part of editingAgent (which is AgentFormData)
    // And editingAgent is correctly typed to include toolConfigsApplied: Record<string, ToolConfigData>
    const currentToolConfig = editingAgent?.toolConfigsApplied?.[tool.id];
    setCurrentSelectedApiKeyId(currentToolConfig?.selectedApiKeyId);
    // setCurrentSelectedMcpServerId(currentToolConfig?.selectedMcpServerId); // This will be handled by ToolConfigModal directly via editingAgent
    setIsToolConfigModalOpen(true);
  };

  // Handler for saving tool configuration from ToolConfigModal
  const handleSaveToolConfig = (toolId: string, configData: ToolConfigData) => {
    setEditingAgent((prevAgent: any) => {
      if (!prevAgent) return null;
      const updatedToolConfigsApplied = {
        ...(prevAgent.toolConfigsApplied || {}),
        [toolId]: {
          ...(prevAgent.toolConfigsApplied?.[toolId] || {}),
          ...configData[toolId], // Merge new config for the specific toolId
        }
      };
      return {
        ...prevAgent,
        toolConfigsApplied: updatedToolConfigsApplied,
      };
    });
    setIsToolConfigModalOpen(false);
    setConfiguringTool(null);
    toast({ title: "Configuração da Ferramenta Salva", description: `Configuração para ${toolId} atualizada.`});
  };

  // Handler for MCP Server ID change in ToolConfigModal
  const handleMcpServerIdChange = (toolId: string, mcpServerId?: string) => {
    setEditingAgent((prevAgent: any) => {
      if (!prevAgent) return null;
      const updatedToolConfigsApplied = {
        ...(prevAgent.toolConfigsApplied || {}),
        [toolId]: {
          ...(prevAgent.toolConfigsApplied?.[toolId] || {}),
          selectedMcpServerId: mcpServerId,
        }
      };
      return {
        ...prevAgent,
        toolConfigsApplied: updatedToolConfigsApplied,
      };
    });
  };

  // Handler for API Key ID change in ToolConfigModal
  const handleApiKeyIdChange = (toolId: string, apiKeyId?: string) => {
     setEditingAgent((prevAgent: any) => {
      if (!prevAgent) return null;
      const updatedToolConfigsApplied = {
        ...(prevAgent.toolConfigsApplied || {}),
        [toolId]: {
          ...(prevAgent.toolConfigsApplied?.[toolId] || {}),
          selectedApiKeyId: apiKeyId,
        }
      };
      return {
        ...prevAgent,
        toolConfigsApplied: updatedToolConfigsApplied,
      };
    });
    // setCurrentSelectedApiKeyId(apiKeyId); // This local state might not be needed if form drives it
  };


  const totalAgents = agents.length;
  const agentsWithTools = agents.filter(agent => agent.tools && agent.tools.length > 0).length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando agentes...</div>;
  }

  // Mostrar mensagem de erro caso exista
  if (agentsError) {
    const errorMessage = typeof agentsError === 'string' ? agentsError : 'Erro desconhecido ao carregar agentes';
    return <div className="flex items-center justify-center h-screen text-red-500">Erro ao carregar agentes: {errorMessage}</div>;
  }

  const RenderAgentRow = ({ agent, index, style, onEdit, onDelete, onDuplicate, onSaveTemplate }: AgentRowProps) => {
    return (
      <div style={style} className="px-1 py-2">
        <AgentCard
          agent={agent}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onSaveTemplate={onSaveTemplate}
          onSelectForMonitoring={() => handleSelectAgentForMonitoring(agent)}
          isSelectedForMonitoring={selectedAgentForMonitoring?.id === agent.id}
        />
      </div>
    );
  };

  return (
    <>
      <div className="container py-4 space-y-4 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start gap-2 md:items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Construtor de Agentes IA

// Handler to open ToolConfigModal
const handleConfigureTool = (tool: AvailableTool) => {
setConfiguringTool(tool);
// Assuming toolConfigsApplied is part of editingAgent (which is AgentFormData)
// And editingAgent is correctly typed to include toolConfigsApplied: Record<string, ToolConfigData>
const currentToolConfig = editingAgent?.toolConfigsApplied?.[tool.id];
setCurrentSelectedApiKeyId(currentToolConfig?.selectedApiKeyId);
// setCurrentSelectedMcpServerId(currentToolConfig?.selectedMcpServerId); // This will be handled by ToolConfigModal directly via editingAgent
setIsToolConfigModalOpen(true);
};

// Handler for saving tool configuration from ToolConfigModal
const handleSaveToolConfig = (toolId: string, configData: ToolConfigData) => {
setEditingAgent((prevAgent: any) => {
  if (!prevAgent) return null;
  const updatedToolConfigsApplied = {
    ...(prevAgent.toolConfigsApplied || {}),
    [toolId]: {
      ...(prevAgent.toolConfigsApplied?.[toolId] || {}),
      ...configData[toolId], // Merge new config for the specific toolId
    }
  };
  return {
    ...prevAgent,
    toolConfigsApplied: updatedToolConfigsApplied,
  };
});
setIsToolConfigModalOpen(false);
setConfiguringTool(null);
toast({ title: "Configuração da Ferramenta Salva", description: `Configuração para ${toolId} atualizada.`});
};

// Handler for MCP Server ID change in ToolConfigModal
const handleMcpServerIdChange = (toolId: string, mcpServerId?: string) => {
setEditingAgent((prevAgent: any) => {
  if (!prevAgent) return null;
  const updatedToolConfigsApplied = {
    ...(prevAgent.toolConfigsApplied || {}),
    [toolId]: {
      ...(prevAgent.toolConfigsApplied?.[toolId] || {}),
      selectedMcpServerId: mcpServerId,
    }
  };
  return {
    ...prevAgent,
    toolConfigsApplied: updatedToolConfigsApplied,
  };
});
};

// Handler for API Key ID change in ToolConfigModal
const handleApiKeyIdChange = (toolId: string, apiKeyId?: string) => {
 setEditingAgent((prevAgent: any) => {
  if (!prevAgent) return null;
  const updatedToolConfigsApplied = {
    ...(prevAgent.toolConfigsApplied || {}),
    [toolId]: {
      ...(prevAgent.toolConfigsApplied?.[toolId] || {}),
      selectedApiKeyId: apiKeyId,
    }
  };
  return {
    ...prevAgent,
    toolConfigsApplied: updatedToolConfigsApplied,
  };
});
// setCurrentSelectedApiKeyId(apiKeyId); // This local state might not be needed if form drives it
};


const totalAgents = agents.length;
const agentsWithTools = agents.filter(agent => agent.tools && agent.tools.length > 0).length;

if (isLoading) {
return <div className="flex items-center justify-center h-screen">Carregando agentes...</div>;
}

// Mostrar mensagem de erro caso exista
if (agentsError) {
const errorMessage = typeof agentsError === 'string' ? agentsError : 'Erro desconhecido ao carregar agentes';
return <div className="flex items-center justify-center h-screen text-red-500">Erro ao carregar agentes: {errorMessage}</div>;
}

const RenderAgentRow = ({ agent, index, style, onEdit, onDelete, onDuplicate, onSaveTemplate }: AgentRowProps) => {
return (
  <div style={style} className="px-1 py-2">
    <AgentCard
      agent={agent}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onSaveTemplate={onSaveTemplate}
      onSelectForMonitoring={() => handleSelectAgentForMonitoring(agent)}
      isSelectedForMonitoring={selectedAgentForMonitoring?.id === agent.id}
    />
  </div>
);
};

return (
  <>
    <div className="container py-4 space-y-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start gap-2 md:items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Construtor de Agentes IA
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
            Crie, configure e gerencie seus agentes de inteligência artificial.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsTutorialModalOpen(true)} variant="outline">
            <Book className="mr-2" /> Tutorial
          </Button>
          <Button onClick={() => setIsFeedbackModalOpen(true)} variant="outline">
            <MessageSquareText className="mr-2" /> Feedback
          </Button>
          <Button onClick={handleCreateNewAgent} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2" /> Novo Agente
          </Button>
        </div>
      </div>
      <div className="mb-4">
        <div className="relative w-full max-w-sm ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Pesquisar agentes..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {selectedAgentForMonitoring ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Monitorando: {selectedAgentForMonitoring.agentName}</h2>
            <Button onClick={() => setSelectedAgentForMonitoring(null)} variant="outline" className="mb-4">
              Voltar para Lista de Agentes
            </Button>
            {selectedAgentForMonitoring && (
              <Suspense fallback={<div>Carregando métricas...</div>}>
                <AgentMetricsView
                  name="Métricas" agentId={selectedAgentForMonitoring.id} />
              </Suspense>
            )}
          </div>
          <Suspense fallback={<div>Carregando logs...</div>}>
            <AgentLogView
              name="Logs" agentId={selectedAgentForMonitoring.id} />
          </Suspense>
        </div>
      ) : (
        agents.length === 0 ? (
          <EmptyState
            icon={<Ghost className="mx-auto h-12 w-12 text-gray-400" />}
            title="Nenhum agente encontrado"
            description="Comece criando um novo agente para vê-lo aqui."
            actionButton={{
              text: "Criar Primeiro Agente",
              onClick: handleCreateNewAgent,
              icon: <Plus className="mr-2 h-4 w-4" />, // lucide-react icons usually take size via className
              className: "bg-blue-600 hover:bg-blue-700", // Or use variant="default" if style matches
            }}
            className="py-12" // Keep original padding
          />
        ) : (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={() => handleEditAgent(agent)}
                  onDelete={() => handleDeleteAgent(agent)} // Passa o agente para a função
                  onSaveAsTemplate={() => handleSaveAsTemplate(agent)}
                  onSelectForMonitoring={() => handleSelectAgentForMonitoring(agent)}
                  isSelectedForMonitoring={selectedAgentForMonitoring?.id === agent.id}
                />
              ))}
            </div>
          ) : (
            // List View using react-window
            <div>
          {/* Substituído FixedSizeList que não é compatível com JSX */}
          <div className="agent-list">
            {agents.map((agent, i) => (
              <RenderAgentRow
                key={agent.id}
                agent={agent}
                index={i}
                style={{ height: AGENT_CARD_LIST_ITEM_SIZE }}
                onEdit={() => handleEditAgent(agent)}
                onDelete={() => handleDeleteAgent(agent)}
                onDuplicate={() => {}}
                onSaveTemplate={() => handleSaveAsTemplate(agent)}
              />
            ))}
              </div>
            </div>
          )
        )
      )}

      <Suspense fallback={<div>Carregando...</div>}>
        {isBuilderModalOpen && (
          buildMode === 'form' ? (
            <AgentBuilderDialog
              name="Construtor de Agentes"
              isOpen={isBuilderModalOpen}
              onClose={() => {
                setIsBuilderModalOpen(false);
                setEditingAgent(null);
                router.push('/agent-builder'); // Clear URL parameters
              }}
              onSave={handleFormSubmit}
              agent={editingAgent as any} // This is AdaptedAgentFormData / AgentFormData
              availableTools={builderAvailableTools}
              agentToneOptions={agentToneOptions.map(option => option.id)}
              agentTypeOptions={agentTypeOptions.map(option => option.id)}
              iconComponents={iconComponents}
              mcpServers={mockMcpServers}
              onConfigureToolInDialog={handleConfigureTool} // Pass the handler to AgentBuilderDialog
            />
          ) : (
            <AgentCreatorChatUI
              name="Chat UI"
              isOpen={isBuilderModalOpen} // This might need to be a different state if chat UI is a separate modal
              onClose={() => {
                setIsBuilderModalOpen(false);
                setEditingAgent(null);
                router.push('/agent-builder'); // Clear URL parameters
              }}
              onSave={handleFormSubmit}
              agent={editingAgent as any}
            />
          )
        )}

        {isSaveAsTemplateModalOpen && (
          <SaveAsTemplateDialog
            name="Salvar como Template"
            isOpen={isSaveAsTemplateModalOpen}
            agentName={agentToSaveAsTemplate?.agentName || ''}
            onClose={() => setIsSaveAsTemplateModalOpen(false)}
            onSaveTemplate={(templateName: string) => onConfirmSaveAsTemplate(templateName)}
          />
        )}

        {agentToDelete && (
          <ConfirmationModal
            name="Confirmação"
            isOpen={isConfirmDeleteAgentOpen}
            onOpenChange={(isOpen) => {
              setIsConfirmDeleteAgentOpen(isOpen);
              if (!isOpen) setAgentToDelete(null);
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
            onOpenChange={setIsToolConfigModalOpen}
            configuringTool={configuringTool}
            onSave={handleSaveToolConfig}
            // Props do modal simplificadas para fins de compilação
            availableApiKeys={availableApiKeys || []}
            mcpServers={mockMcpServers}
          />
        )}
        
        {isTutorialModalOpen && (
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
            onOpenChange={setIsFeedbackModalOpen}
          />
        )}
      </Suspense>
    </>
  );
}
