"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { Cpu, Wand2, Info, AlertCircle, ChevronLeft } from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AvailableTool, MCPServerConfig } from "@/types/tool-types";
import { ToolCard } from "./tool-card";
import { ToolSearch, ToolFilters } from "./tool-search";
import { MCPServerManager } from "./mcp-server-manager";

interface ToolsTabProps {
  availableTools: AvailableTool[];
  selectedToolIds: string[];
  onToolSelectionChange: (toolId: string, checked: boolean) => void;
  onConfigureTool: (tool: AvailableTool) => void;
  toolConfigsApplied?: Record<string, any>;
}

export const ToolsTab: React.FC<ToolsTabProps> = ({
  availableTools,
  selectedToolIds,
  onToolSelectionChange,
  onConfigureTool,
  toolConfigsApplied = {},
}) => {
  // CONCEPTUAL TODO for API Key Vault integration:
  // When a tool `needsConfiguration` (e.g., requires an API key):
  // 1. The `onConfigureTool` function or a similar mechanism would be triggered.
  // 2. Instead of prompting the user for the raw API key directly in this UI,
  //    the configuration dialog for the tool should allow the user to select
  //    from a list of "registered" services/API keys fetched from the `/api/apikeys` endpoint (API Key Vault).
  // 3. The `ToolConfigData` (or equivalent state managed by the agent builder)
  //    would then store a reference to the selected key, such as its `id` or `serviceName`
  //    (e.g., `{ "apiKeyId": "key_123_openai" }` or `{ "apiKeyServiceName": "OpenAI" }`).
  // 4. This reference, not the actual key, would be saved as part of the agent's configuration.
  // 5. The `toolConfigsApplied` prop might then reflect this, e.g. by showing "OpenAI Key Configured"
  //    instead of the key itself or a fragment.

  // Estado para ferramentas filtradas e pesquisadas
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ToolFilters>({
    configurable: false,
    requiresAuth: false,
  });
  
  // Estado para visualização detalhada de ferramenta
  const [detailViewToolId, setDetailViewToolId] = useState<string | null>(null);
  
  // Estado para servidores MCP
  const [mcpServers, setMcpServers] = useState<MCPServerConfig[]>([
    {
      id: "local-mcp",
      name: "Servidor Local MCP",
      url: "http://localhost:8000",
      description: "Servidor MCP local para desenvolvimento e testes",
      status: "connected"
    }
  ]);
  
  // Separar as ferramentas em regulares e MCP
  const { regularTools, mcpTools } = useMemo(() => {
    return {
      regularTools: availableTools.filter(tool => !tool.isMCPTool),
      mcpTools: availableTools.filter(tool => tool.isMCPTool)
    };
  }, [availableTools]);
  
  // Filtrar e pesquisar ferramentas
  const getFilteredTools = (tools: AvailableTool[]) => {
    return tools.filter(tool => {
      // Filtro de pesquisa
      if (searchQuery && !tool.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !tool.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filtro de configurável
      if (filters.configurable && !tool.hasConfig) {
        return false;
      }
      
      // Filtro de autenticação
      if (filters.requiresAuth && !tool.requiresAuth) {
        return false;
      }
      
      return true;
    });
  };
  
  const filteredRegularTools = useMemo(() => getFilteredTools(regularTools), 
    [regularTools, searchQuery, filters]);
  
  const filteredMcpTools = useMemo(() => getFilteredTools(mcpTools), 
    [mcpTools, searchQuery, filters]);
  
  // Manipuladores de eventos
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleFilterChange = (filterKey: keyof ToolFilters | 'reset', value?: boolean) => {
    if (filterKey === 'reset') {
      setFilters({
        configurable: false,
        requiresAuth: false,
      });
    } else {
      setFilters(prev => ({
        ...prev,
        [filterKey]: value
      }));
    }
  };
  
  const handleToolSelection = (toolId: string) => {
    onToolSelectionChange(toolId, !selectedToolIds.includes(toolId));
  };
  
  const handleAddMcpServer = (server: MCPServerConfig) => {
    setMcpServers(prev => [...prev, server]);
  };
  
  const handleRemoveMcpServer = (serverId: string) => {
    setMcpServers(prev => prev.filter(server => server.id !== serverId));
  };
  
  const handleUpdateMcpServer = (server: MCPServerConfig) => {
    setMcpServers(prev => prev.map(s => s.id === server.id ? server : s));
  };
  
  // Ferramenta para visualização detalhada
  const detailViewTool = useMemo(() => {
    if (!detailViewToolId) return null;
    return availableTools.find(tool => tool.id === detailViewToolId) || null;
  }, [detailViewToolId, availableTools]);
  
  // Renderizar visualização detalhada da ferramenta
  const renderDetailView = () => {
    if (!detailViewTool) return null;
    
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-2"
          onClick={() => setDetailViewToolId(null)}
        >
          <ChevronLeft size={16} className="mr-1" />
          Voltar para Lista
        </Button>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-md", 
              detailViewTool.isMCPTool 
                ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20" 
                : "bg-primary/10"
            )}>
              {detailViewTool.icon && <detailViewTool.icon width={32} height={32} className="text-primary" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {detailViewTool.name}
                {detailViewTool.isMCPTool && (
                  <Badge variant="outline" className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-xs border-blue-400/30">
                    MCP
                  </Badge>
                )}
              </h2>
              <p className="text-sm text-muted-foreground">{detailViewTool.description}</p>
            </div>
          </div>
          
          <Button
            variant={selectedToolIds.includes(detailViewTool.id) ? "default" : "outline"}
            onClick={() => handleToolSelection(detailViewTool.id)}
            className={selectedToolIds.includes(detailViewTool.id) ? "button-live-glow" : ""}
          >
            {selectedToolIds.includes(detailViewTool.id) ? "Selecionada" : "Selecionar"}
          </Button>
        </div>
        
        {detailViewTool.isMCPTool && detailViewTool.mcpServerName && (
          <Alert className="bg-blue-500/5 border-blue-400/30">
            <Cpu size={16} className="text-blue-500" />
            <AlertTitle>Ferramenta MCP</AlertTitle>
            <AlertDescription className="text-sm">
              Conectada ao servidor MCP: <span className="font-medium">{detailViewTool.mcpServerName}</span>
            </AlertDescription>
          </Alert>
        )}
        
        {detailViewTool.parameters && detailViewTool.parameters.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Parâmetros</h3>
            <div className="rounded-md border border-border">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/4">Nome</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/6">Tipo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/6">Obrigatório</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {detailViewTool.parameters.map(param => (
                    <tr key={param.name}>
                      <td className="px-4 py-2 whitespace-nowrap font-mono text-xs">{param.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <Badge variant="outline">{param.type}</Badge>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{param.required ? "Sim" : "Não"}</td>
                      <td className="px-4 py-2 text-sm">{param.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {detailViewTool.examples && detailViewTool.examples.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Exemplos de Uso</h3>
            <div className="space-y-4">
              {detailViewTool.examples.map((example, idx) => (
                <div key={idx} className="rounded-md border border-border overflow-hidden">
                  <div className="bg-muted p-3">
                    <h4 className="font-medium">{example.title}</h4>
                    <p className="text-sm text-muted-foreground">{example.description}</p>
                  </div>
                  <div className="p-3 bg-black text-white overflow-x-auto">
                    <pre><code>{example.code}</code></pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {detailViewTool.documentation && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Documentação</h3>
            <div className="rounded-md border border-border p-4 prose prose-sm max-w-none">
              {detailViewTool.documentation}
            </div>
          </div>
        )}
        
        {detailViewTool.hasConfig && (
          <div className="mt-6 flex justify-end">
            <Button 
              variant="outline"
              onClick={() => onConfigureTool(detailViewTool)}
              className="flex items-center gap-2"
            >
              <Info size={16} />
              Configurar Ferramenta
            </Button>
          </div>
        )}
      </div>
    );
  };
  
  // Renderizar lista de ferramentas (regular ou MCP)
  const renderToolList = (tools: AvailableTool[], emptyMessage: string) => {
    if (detailViewToolId) return null;
    
    return (
      <>
        <ToolSearch 
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          filters={filters}
        />
        
        {tools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool}
                isSelected={selectedToolIds.includes(tool.id)}
                onSelect={handleToolSelection}
                onConfigure={() => onConfigureTool(tool)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-border rounded-md">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </>
    );
  };
  
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-1 flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-primary/80" />
        Ferramentas do Agente
        <Tooltip>
            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-0 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
            <TooltipContent className="max-w-xs"><p>Ferramentas são capacidades (implementadas como fluxos Genkit) que permitem ao agente interagir com sistemas externos, APIs, bancos de dados ou executar ações específicas (ex: busca na web, acesso a calendário).</p></TooltipContent>
        </Tooltip>
      </h3>
      {!detailViewToolId ? (
        <Tabs defaultValue="regular-tools" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="regular-tools" className="py-2 px-4">
              <span>Ferramentas Padrão</span>
              {selectedToolIds.filter(id => 
                regularTools.some(tool => tool.id === id)
              ).length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedToolIds.filter(id => 
                    regularTools.some(tool => tool.id === id)
                  ).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="mcp-tools" className="py-2 px-4">
              <span>MCP Tools</span>
              {selectedToolIds.filter(id => 
                mcpTools.some(tool => tool.id === id)
              ).length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedToolIds.filter(id => 
                    mcpTools.some(tool => tool.id === id)
                  ).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="regular-tools" className="pt-4">
            {renderToolList(
              filteredRegularTools, 
              searchQuery || filters.configurable || filters.requiresAuth
                ? "Nenhuma ferramenta padrão encontrada com os filtros atuais"
                : "Nenhuma ferramenta padrão disponível"
            )}
          </TabsContent>
          
          <TabsContent value="mcp-tools" className="pt-4 space-y-6">
            {renderToolList(
              filteredMcpTools,
              searchQuery || filters.configurable || filters.requiresAuth
                ? "Nenhuma MCP Tool encontrada com os filtros atuais"
                : "Nenhuma MCP Tool disponível"
            )}
            
            <MCPServerManager 
              servers={mcpServers}
              onAdd={handleAddMcpServer}
              onRemove={handleRemoveMcpServer}
              onUpdate={handleUpdateMcpServer}
            />
            
            <Alert className="bg-blue-500/5 border-blue-400/30">
              <AlertCircle size={16} className="text-blue-500" />
              <AlertTitle>Sobre MCP Tools</AlertTitle>
              <AlertDescription>
                <p className="text-sm">
                  Model Context Protocol (MCP) é um padrão que conecta sistemas de IA com ferramentas e fontes de dados externas.
                  MCP Tools permitem que seu agente tenha acesso a funcionalidades avançadas e integrações com serviços externos.
                </p>
                <p className="text-sm mt-2">
                  Para usar MCP Tools, você precisa configurar um servidor MCP que forneça as ferramentas desejadas.
                </p>
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      ) : (
        renderDetailView()
      )}
    </div>
  );
};
