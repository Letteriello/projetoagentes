"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
// Removido import duplicado de tipos já definidos localmente ou importados abaixo para evitar conflito
// Import removido para evitar conflito de tipos já definidos localmente ou importados abaixo.
import { CommunicationChannelItem } from "./a2a-communication-channel";
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

import { useToast } from "@/hooks/use-toast";
import { useAgents } from "@/contexts/AgentsContext";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubAgentSelector } from "@/components/features/agent-builder/sub-agent-selector";
import { cn } from "@/lib/utils";
import type { ClassValue } from 'clsx';

// Types from @/app/agent-builder/page needed for this component
import type {
  SavedAgentConfiguration,
  AgentConfig,
  LLMAgentConfig,
  WorkflowAgentConfig,
  AvailableTool,
  ToolConfigData
} from "@/app/agent-builder/page";
// AgentBuilderDialog functional component
interface AgentBuilderDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingAgent: SavedAgentConfiguration | null;
  onSave: (agentConfig: SavedAgentConfiguration) => void;
  availableTools: AvailableTool[];
  agentTypeOptions: Array<{ id: "llm" | "workflow" | "custom" | "a2a"; label: string; icon?: React.ReactNode; description: string; }>;
  agentToneOptions: { id: string; label: string; }[];
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>;
}

const AgentBuilderDialog: React.FC<AgentBuilderDialogProps> = ({
  isOpen,
  onOpenChange,
  editingAgent,
  onSave,
  availableTools,
  agentTypeOptions,
  agentToneOptions,
  iconComponents
}) => {
  const [selectedAgentType, setSelectedAgentType] = React.useState<string>('llm');
  const [selectedTone, setSelectedTone] = React.useState<string>('professional');
  const [configuringTool, setConfiguringTool] = React.useState<AvailableTool | null>(null);
  const [toolConfigurations, setToolConfigurations] = React.useState<Record<string, ToolConfigData>>(editingAgent?.toolConfigsApplied || {});
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState<boolean>(false);

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

  const { toast } = useToast();

  const handleToolConfigure = (tool: AvailableTool) => {
    setConfiguringTool(tool);
    setIsToolConfigModalOpen(true);
  };

  const handleSaveToolConfiguration = () => {
    if (!configuringTool) return;
    let newConfigData: Partial<ToolConfigData> = { ...toolConfigurations[configuringTool && configuringTool.id] };
    const newConfig: ToolConfigData = {};

    if (configuringTool && configuringTool.id === "webSearch") {
      newConfig.googleApiKey = modalGoogleApiKey;
      newConfig.googleCseId = modalGoogleCseId;
    } else if (configuringTool && configuringTool.id === "customApiIntegration") {
      newConfig.openapiSpecUrl = modalOpenapiSpecUrl;
      newConfig.openapiApiKey = modalOpenapiApiKey;
    } else if (configuringTool && configuringTool.id === "databaseAccess") {
      newConfig.dbType = modalDbType;
      newConfig.dbHost = modalDbHost;
      newConfig.dbPort = String(modalDbPort);
      newConfig.dbName = modalDbName;
      newConfig.dbUser = modalDbUser;
      newConfig.dbPassword = modalDbPassword;
      newConfig.dbConnectionString = modalDbConnectionString;
      newConfig.dbDescription = modalDbDescription;
    } else if (configuringTool && configuringTool.id === "knowledgeBase") {
      newConfig.knowledgeBaseId = modalKnowledgeBaseId;
    } else if (configuringTool && configuringTool.id === "calendarAccess") {
      newConfig.calendarApiEndpoint = modalCalendarApiEndpoint;
    }

    setToolConfigurations((prev: Record<string, ToolConfigData>) => ({ ...prev, [configuringTool && configuringTool.id!]: newConfigData as ToolConfigData }));
    setIsToolConfigModalOpen(false);
    setConfiguringTool(null);

    const toolDisplayName = typeof configuringTool && configuringTool.name === 'string' ? configuringTool && configuringTool.name : configuringTool && configuringTool.id;
    toast({ title: `Configuração salva para ${toolDisplayName}` });
  };

  // Estados para os campos do formulário principal do agente
  const [agentName, setAgentName] = React.useState<string>(editingAgent?.agentName || '');
  const [agentDescription, setAgentDescription] = React.useState<string>(editingAgent?.agentDescription || '');
  const [agentIcon, setAgentIcon] = React.useState<string>(editingAgent?.agentIcon || 'Bot');
  
  // Estados para configuração de agente LLM
  const [agentGoal, setAgentGoal] = React.useState<string>(editingAgent?.agentType === 'llm' ? (editingAgent as any).agentGoal || '' : '');
  const [agentTasks, setAgentTasks] = React.useState<string>(editingAgent?.agentType === 'llm' ? (editingAgent as any).agentTasks || '' : '');
  const [agentPersonality, setAgentPersonality] = React.useState<string>(editingAgent?.agentType === 'llm' ? (editingAgent as any).agentPersonality || '' : '');
  const [agentRestrictions, setAgentRestrictions] = React.useState<string>(editingAgent?.agentType === 'llm' ? (editingAgent as any).agentRestrictions || '' : '');
  const [agentModel, setAgentModel] = React.useState<string>(editingAgent?.agentType === 'llm' ? (editingAgent as any).agentModel || 'googleai/gemini-1.5-flash-latest' : 'googleai/gemini-1.5-flash-latest');
  const [agentTemperature, setAgentTemperature] = React.useState<number>(editingAgent?.agentType === 'llm' ? (editingAgent as any).agentTemperature || 0.7 : 0.7);
  
  // Estado para ferramentas selecionadas
  const [selectedToolIds, setSelectedToolIds] = React.useState<string[]>(editingAgent?.agentTools || []);

  // Manipulador de ferramenta selecionada
  const handleToolSelectionChange = (toolId: string, checked: boolean) => {
    if (checked) {
      setSelectedToolIds(prev => [...prev, toolId]);
    } else {
      setSelectedToolIds(prev => prev.filter(id => id !== toolId));
    }
  };

  // Manipulador para salvar o agente
  const handleSaveAgent = () => {
    // Construir a configuração do agente baseado no tipo selecionado
    let agentConfig: any = {
      agentType: selectedAgentType,
      agentName,
      agentDescription,
      agentIcon,
      agentVersion: editingAgent?.agentVersion || "1.0.0", // Versão padrão ou manter a existente
      agentTools: selectedToolIds,
      toolConfigsApplied: toolConfigurations,
    };

    // Adicionar campos específicos de acordo com o tipo de agente
    if (selectedAgentType === 'llm') {
      agentConfig = {
        ...agentConfig,
        agentGoal,
        agentTasks,
        agentPersonality,
        agentRestrictions,
        agentModel,
        agentTemperature,
      };
    }

    // Gerar ID único se for um novo agente
    const savedAgent: SavedAgentConfiguration = {
      id: editingAgent?.id || `agent_${Date.now()}`,
      ...agentConfig,
    };

    onSave(savedAgent);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && configuringTool) { 
        setIsToolConfigModalOpen(false); 
        setConfiguringTool(null);
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{editingAgent ? 'Editar Agente' : 'Criar Novo Agente'}</DialogTitle>
          <DialogDescription>
            Configure as capacidades e comportamento do seu agente baseado no Agent Development Kit do Google.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto px-6 py-4">
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="mb-4 grid w-full grid-cols-4">
              <TabsTrigger value="basics">
                <Settings2 className="mr-2 h-4 w-4" />
                Básico
              </TabsTrigger>
              <TabsTrigger value="behavior">
                <Brain className="mr-2 h-4 w-4" />
                Comportamento
              </TabsTrigger>
              <TabsTrigger value="tools">
                <Wand2 className="mr-2 h-4 w-4" />
                Ferramentas
              </TabsTrigger>
              <TabsTrigger value="advanced">
                <FileJson className="mr-2 h-4 w-4" />
                Avançado
              </TabsTrigger>
            </TabsList>
            
            {/* Tab de Configurações Básicas */}
            <TabsContent value="basics" className="space-y-4 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agentName">Nome do Agente</Label>
                  <Input 
                    id="agentName" 
                    value={agentName} 
                    onChange={(e) => setAgentName(e.target.value)} 
                    placeholder="Ex: Assistente de Marketing"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="agentIcon">Ícone</Label>
                  <Select value={agentIcon} onValueChange={setAgentIcon}>
                    <SelectTrigger id="agentIcon">
                      <SelectValue placeholder="Selecione um ícone" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(iconComponents).map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          <div className="flex items-center">
                            {React.createElement(iconComponents[icon], { className: "mr-2 h-4 w-4" })}
                            {icon}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agentDescription">
                  Descrição do Agente
                  <span className="ml-1 text-xs text-muted-foreground">(Visível para usuários)</span>
                </Label>
                <Textarea 
                  id="agentDescription" 
                  value={agentDescription} 
                  onChange={(e) => setAgentDescription(e.target.value)} 
                  placeholder="Descreva o que este agente faz e como pode ajudar os usuários."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agentType">Tipo de Agente</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {agentTypeOptions.map((type) => (
                    <Card 
                      key={type.id} 
                      className={cn(
                        "cursor-pointer hover:border-primary transition-colors",
                        selectedAgentType === type.id && "border-primary bg-muted/50"
                      )}
                      onClick={() => setSelectedAgentType(type.id)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {type.icon || <Cpu className="h-4 w-4 mr-2" />}
                            <CardTitle className="text-base">{type.label}</CardTitle>
                          </div>
                          {selectedAgentType === type.id && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4 pt-0">
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* Tab de Comportamento e Personalidade */}
            <TabsContent value="behavior" className="space-y-4 overflow-auto">
              {selectedAgentType === 'llm' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="agentGoal">
                      Objetivo Principal
                      <span className="ml-1 text-xs text-muted-foreground">(O que este agente deve alcançar)</span>
                    </Label>
                    <Textarea 
                      id="agentGoal" 
                      value={agentGoal} 
                      onChange={(e) => setAgentGoal(e.target.value)} 
                      placeholder="Ex: Ajudar usuários a desenvolver estratégias de marketing eficazes para seus negócios."
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="agentTasks">
                      Tarefas/Capacidades
                      <span className="ml-1 text-xs text-muted-foreground">(Liste as tarefas específicas)</span>
                    </Label>
                    <Textarea 
                      id="agentTasks" 
                      value={agentTasks} 
                      onChange={(e) => setAgentTasks(e.target.value)} 
                      placeholder="Ex: 1. Analisar o público-alvo do cliente\n2. Sugerir canais de marketing adequados\n3. Criar esboços de conteúdo..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agentPersonality">
                        Tom/Personalidade
                      </Label>
                      <Select value={selectedTone} onValueChange={setSelectedTone}>
                        <SelectTrigger id="agentPersonality">
                          <SelectValue placeholder="Selecione um tom" />
                        </SelectTrigger>
                        <SelectContent>
                          {agentToneOptions.map((tone) => (
                            <SelectItem key={tone.id} value={tone.id}>
                              {tone.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input 
                        value={agentPersonality} 
                        onChange={(e) => setAgentPersonality(e.target.value)} 
                        placeholder="Personalização adicional..."
                        className="mt-2"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="agentRestrictions">
                        Restrições/Limites
                        <span className="ml-1 text-xs text-muted-foreground">(O que NÃO deve fazer)</span>
                      </Label>
                      <Textarea 
                        id="agentRestrictions" 
                        value={agentRestrictions} 
                        onChange={(e) => setAgentRestrictions(e.target.value)} 
                        placeholder="Ex: Não fornecer conselhos jurídicos, não promover conteúdo antiético..."
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agentModel">
                        Modelo LLM
                      </Label>
                      <Select value={agentModel} onValueChange={setAgentModel}>
                        <SelectTrigger id="agentModel">
                          <SelectValue placeholder="Selecione um modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="googleai/gemini-1.5-flash-latest">Gemini 1.5 Flash</SelectItem>
                          <SelectItem value="googleai/gemini-1.5-pro-latest">Gemini 1.5 Pro</SelectItem>
                          <SelectItem value="anthropic/claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                          <SelectItem value="anthropic/claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="agentTemperature">
                          Temperatura
                          <span className="ml-1 text-xs text-muted-foreground">(Criatividade)</span>
                        </Label>
                        <span className="text-sm">{agentTemperature}</span>
                      </div>
                      <Slider
                        id="agentTemperature"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[agentTemperature]}
                        onValueChange={(values) => setAgentTemperature(values[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Preciso</span>
                        <span>Balanceado</span>
                        <span>Criativo</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {selectedAgentType === 'workflow' && (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <Workflow className="h-12 w-12 text-muted-foreground mx-auto" />
                    <h3 className="mt-4 text-lg font-medium">Configuração de Workflow</h3>
                    <p className="mt-1 text-sm text-muted-foreground max-w-md">
                      Configure um agente que orquestra múltiplos sub-agentes para realizar tarefas complexas.
                      Implemente a sequência, condições e passagem de dados entre agentes.
                    </p>
                  </div>
                </div>
              )}
              
              {selectedAgentType === 'custom' && (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <FileJson className="h-12 w-12 text-muted-foreground mx-auto" />
                    <h3 className="mt-4 text-lg font-medium">Configuração Personalizada</h3>
                    <p className="mt-1 text-sm text-muted-foreground max-w-md">
                      Configure um agente com lógica personalizada e integração com sistemas externos.
                      Suporta fluxos avançados e lógica de negócio específica.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Tab de Ferramentas */}
            <TabsContent value="tools" className="space-y-4 overflow-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Ferramentas Disponíveis</h3>
                  <Badge variant="outline" className="px-2">
                    {selectedToolIds.length} selecionada(s)
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableTools.map((tool) => (
                    <Card 
                      key={tool.id} 
                      className={cn(
                        "cursor-pointer hover:border-primary transition-colors overflow-hidden",
                        selectedToolIds.includes(tool.id) && "border-primary"
                      )}
                    >
                      <div className="flex justify-between items-start p-4">
                        <div className="flex items-start space-x-4">
                          <Checkbox 
                            id={`tool-${tool.id}`} 
                            checked={selectedToolIds.includes(tool.id)}
                            onCheckedChange={(checked) => 
                              handleToolSelectionChange(tool.id, checked as boolean)
                            }
                          />
                          <div>
                            <Label 
                              htmlFor={`tool-${tool.id}`} 
                              className="text-base font-medium cursor-pointer"
                              onClick={() => handleToolSelectionChange(tool.id, !selectedToolIds.includes(tool.id))}
                            >
                              {tool.label}
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              {tool.description.length > 100 
                                ? `${tool.description.substring(0, 100)}...` 
                                : tool.description
                              }
                            </p>
                          </div>
                        </div>
                        
                        {tool.hasConfig && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full" 
                                  onClick={() => handleToolConfigure(tool)}
                                >
                                  <Settings className="h-4 w-4" />
                                  <span className="sr-only">Configurar</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Configurar {tool.label}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      {selectedToolIds.includes(tool.id) && tool.id in toolConfigurations && (
                        <div className="bg-muted/50 px-4 py-2 text-xs border-t">
                          <span className="font-medium">Configurado</span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            {/* Tab Avançado */}
            <TabsContent value="advanced" className="space-y-4 overflow-auto">
              <Alert className="bg-muted">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configurações Avançadas</AlertTitle>
                <AlertDescription>
                  Esta seção contém configurações avançadas para personalizar comportamentos específicos do agente.
                </AlertDescription>
              </Alert>
              
              {selectedAgentType === 'llm' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="enableStreaming" defaultChecked />
                    <Label htmlFor="enableStreaming">Habilitar streaming de resposta</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="enableSources" defaultChecked />
                    <Label htmlFor="enableSources">Incluir fontes nas respostas (quando disponíveis)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="enableMemory" defaultChecked />
                    <Label htmlFor="enableMemory">Habilitar memória de conversas</Label>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSaveAgent} className="button-live-glow">Salvar Agente</Button>
        </DialogFooter>
      </DialogContent>
      {isToolConfigModalOpen && (
        <Dialog open={isToolConfigModalOpen} onOpenChange={(open) => {
          if (!open) { 
            setIsToolConfigModalOpen(false); 
            setConfiguringTool(null);
          }
        }}>
          <DialogContent>
            {configuringTool && configuringTool.id === "webSearch" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="modalGoogleApiKey">Chave API Google</Label>
                  <Input id="modalGoogleApiKey" value={modalGoogleApiKey} onChange={(e) => setModalGoogleApiKey(e.target.value)} placeholder="ex: AIzaSy..." className="h-10"/>
                  <p className="text-xs text-muted-foreground">Chave de API do Google para busca.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modalGoogleCseId">ID do Meu Motor de Busca</Label>
                  <Input id="modalGoogleCseId" value={modalGoogleCseId} onChange={(e) => setModalGoogleCseId(e.target.value)} placeholder="ex: 012345678901234567890" className="h-10"/>
                  <p className="text-xs text-muted-foreground">ID do Meu Motor de Busca do Google.</p>
                </div>
              </>
            )}
            {configuringTool && configuringTool.id === "customApiIntegration" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="modalOpenapiSpecUrl">URL Esquema OpenAPI (JSON/YAML)</Label>
                  <Input id="modalOpenapiSpecUrl" value={modalOpenapiSpecUrl} onChange={(e) => setModalOpenapiSpecUrl(e.target.value)} placeholder="ex: https://petstore.swagger.io/v2/swagger.json"/>
                  <p className="text-xs text-muted-foreground">Link para especificação da API.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modalOpenapiApiKey">Chave API Externa (Opcional)</Label>
                  <Input id="modalOpenapiApiKey" value={modalOpenapiApiKey} onChange={(e) => setModalOpenapiApiKey(e.target.value)} placeholder="Se API requer autenticação" type="password"/>
                  <p className="text-xs text-muted-foreground">Usada para interagir com API externa.</p>
                </div>
              </>
            )}
            {configuringTool && configuringTool.id === "databaseAccess" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="modalDbType">Tipo de Banco</Label>
                  <Select value={modalDbType} onValueChange={setModalDbType}>
                    <SelectTrigger id="modalDbType" className="h-10">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="sqlserver">SQL Server</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(modalDbType !== 'other' && modalDbType !== 'sqlite' && modalDbType !== "") && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="modalDbHost">Host</Label>
                        <Input id="modalDbHost" value={modalDbHost} onChange={(e) => setModalDbHost(e.target.value)} placeholder="ex: localhost" className="h-10"/>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modalDbPort">Porta</Label>
                        <Input id="modalDbPort" type="number" value={String(modalDbPort)} onChange={(e) => setModalDbPort(Number(e.target.value))} placeholder="ex: 5432" className="h-10"/>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modalDbName">Nome Banco</Label>
                      <Input id="modalDbName" value={modalDbName} onChange={(e) => setModalDbName(e.target.value)} placeholder="ex: meu_banco" className="h-10"/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="modalDbUser">Usuário</Label>
                        <Input id="modalDbUser" value={modalDbUser} onChange={(e) => setModalDbUser(e.target.value)} className="h-10"/>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="modalDbPassword">Senha</Label>
                        <Input id="modalDbPassword" type="password" value={modalDbPassword} onChange={(e) => setModalDbPassword(e.target.value)} className="h-10"/>
                      </div>
                    </div>
                  </>
                )}
                {(modalDbType === 'other' || modalDbType === 'sqlite') && (
                  <div className="space-y-2">
                    <Label htmlFor="modalDbConnectionString">String Conexão/Caminho</Label>
                    <Input id="modalDbConnectionString" value={modalDbConnectionString} onChange={(e) => setModalDbConnectionString(e.target.value)} placeholder={modalDbType === 'sqlite' ? "ex: /path/to/db.sqlite" : "driver://user:pass@host/db"} className="h-10"/>
                    <p className="text-xs text-muted-foreground">{modalDbType === 'sqlite' ? 'Caminho SQLite.' : 'String de conexão.'}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="modalDbDescription">Descrição Banco/Tabelas (Opcional)</Label>
                  <Textarea id="modalDbDescription" value={modalDbDescription} onChange={(e) => setModalDbDescription(e.target.value)} placeholder="Ex: Tabela 'usuarios' (id, nome, email)." rows={3}/>
                  <p className="text-xs text-muted-foreground">Ajuda o agente a entender o contexto.</p>
                </div>
              </>
            )}
            {configuringTool && configuringTool.id === "knowledgeBase" && (
              <div className="space-y-2">
                <Label htmlFor="modalKnowledgeBaseId">ID/Nome Base Conhecimento</Label>
                <Input id="modalKnowledgeBaseId" value={modalKnowledgeBaseId} onChange={(e) => setModalKnowledgeBaseId(e.target.value)} placeholder="ex: docs_produto_xyz" className="h-10"/>
                <p className="text-xs text-muted-foreground">Identificador para base (RAG).</p>
              </div>
            )}
            {configuringTool && configuringTool.id === "calendarAccess" && (
              <div className="space-y-2">
                <Label htmlFor="modalCalendarApiEndpoint">Endpoint API/ID Fluxo Genkit</Label>
                <Input id="modalCalendarApiEndpoint" value={modalCalendarApiEndpoint} onChange={(e) => setModalCalendarApiEndpoint(e.target.value)} placeholder="ex: https://api.example.com/calendar" className="h-10"/>
                <p className="text-xs text-muted-foreground">URL ou ID do fluxo Genkit para agenda.</p>
              </div>
            )}
          </DialogContent>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => { setIsToolConfigModalOpen(false); setConfiguringTool(null);}}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveToolConfiguration} className="button-live-glow">Salvar Configuração</Button>
          </DialogFooter>
        </Dialog>
      )}
    </Dialog>
  );
};

export default AgentBuilderDialog;
