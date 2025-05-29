import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GoogleADK, sendMessageToAgent } from '@/lib/google-adk';
import { Cpu, Info, Plus, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AgentData {
  id: string;
  displayName: string;
  description?: string;
  model: string;
  tools?: any[];
  capabilities?: string[];
}

interface AgentSelectorProps {
  onAgentSelected: (agentId: string) => void;
  selectedAgentId?: string;
  savedAgents: any[]; // Adjust the type as needed
  showLabel?: boolean;
  triggerClassName?: string;
}

export function AgentSelector({ 
  onAgentSelected, 
  selectedAgentId, 
  savedAgents, 
  showLabel = false, 
  triggerClassName = '' 
}: AgentSelectorProps) {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const googleADK = new GoogleADK();

  // Carrega os agentes disponíveis
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = () => {
    // Em um cenário real, isso buscaria da API do Google ADK
    // Por enquanto, carregamos do localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedAgents = JSON.parse(localStorage.getItem('ADK_AGENTS') || '{}');
        const agentsList = Object.entries(savedAgents).map(([id, data]) => ({
          id,
          ...(data as any)
        }));
        
        setAgents(agentsList);
      } catch (error) {
        console.error('Erro ao carregar agentes:', error);
        setAgents([]);
      }
    }
  };

  const handleApiKeySave = () => {
    if (apiKey.trim()) {
      googleADK.setApiKey(apiKey.trim());
      setIsConfiguring(false);
      // Recarrega os agentes após configurar a API
      loadAgents();
    }
  };

  const handleAgentSelect = (agentId: string) => {
    onAgentSelected(agentId);
  };

  // Agentes de exemplo pré-configurados
  const createDefaultAgents = async () => {
    try {
      const defaultAgents = [
        {
          name: "Assistente de Pesquisa",
          description: "Um agente especializado em buscar e resumir informações",
          tools: ["web_search"],
          systemPrompt: "Você é um assistente de pesquisa focado em encontrar informações precisas e resumir conteúdo de forma clara e concisa."
        },
        {
          name: "Analista de Dados",
          description: "Um agente para análise e visualização de dados",
          tools: ["calculator", "web_search"],
          systemPrompt: "Você é um analista de dados especializado. Ajude a interpretar dados, realizar cálculos e oferecer insights baseados em informações numéricas."
        }
      ];

      for (const agent of defaultAgents) {
        await import('@/lib/google-adk').then(module => {
          module.createCustomAgent(
            agent.name,
            agent.description,
            agent.tools,
            agent.systemPrompt
          );
        });
      }

      // Recarrega os agentes após criar os padrões
      loadAgents();
    } catch (error) {
      console.error('Erro ao criar agentes padrão:', error);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Agentes ADK</h3>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setIsConfiguring(true)}
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Configurar API do Google ADK</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={createDefaultAgents}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Criar agentes exemplo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Seletor de Agentes */}
      {agents.length > 0 ? (
        <Select 
          value={selectedAgentId} 
          onValueChange={handleAgentSelect}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um agente ADK" />
          </SelectTrigger>
          <SelectContent>
            {agents.map(agent => (
              <SelectItem key={agent.id} value={agent.id}>
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span>{agent.displayName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="text-xs text-muted-foreground p-2 rounded-md bg-accent/10 border border-border">
          {googleADK.hasApiKey() ? (
            <div className="flex flex-col gap-2">
              <p>Nenhum agente ADK configurado.</p>
              <Button size="sm" variant="outline" onClick={createDefaultAgents}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Criar agentes exemplo
              </Button>
            </div>
          ) : (
            <p>Configure a API key do Google ADK para usar agentes.</p>
          )}
        </div>
      )}
      
      {/* Detalhes do Agente Selecionado */}
      {selectedAgentId && agents.length > 0 && (
        <div className="mt-2">
          {agents.filter(a => a.id === selectedAgentId).map(agent => (
            <Card key={agent.id} className="bg-accent/5 border-accent/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  {agent.displayName}
                </CardTitle>
                {agent.description && (
                  <CardDescription className="text-xs">
                    {agent.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-1 mb-2">
                  {agent.capabilities?.map(cap => (
                    <Badge key={cap} variant="outline" className="text-[10px] bg-primary/10">
                      {cap}
                    </Badge>
                  ))}
                </div>
                
                {agent.tools && agent.tools.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">Ferramentas:</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.tools.map(tool => (
                        <Badge key={tool.name} className="text-[10px] bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                          {tool.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Modal de Configuração da API */}
      <Popover open={isConfiguring} onOpenChange={setIsConfiguring}>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Configurar Google ADK</h4>
                <p className="text-xs text-muted-foreground">
                  Insira sua API Key do Google ADK para usar recursos avançados de agentes.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="api-key" className="text-xs font-medium">
                API Key
              </label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:border-primary focus:outline-none"
                placeholder="Insira sua API key do Google ADK"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsConfiguring(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleApiKeySave}>
                Salvar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
