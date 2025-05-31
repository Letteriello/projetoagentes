"use client";

import * as React from "react";
import {
  AlertCircle,
  Book,
  ChevronDown,
  ChevronRight,
  Cloud,
  Database,
  FileText,
  Folder,
  Globe,
  Info,
  Link,
  Plus,
  Settings,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Tipos de fontes de conhecimento para RAG
export type KnowledgeSourceType =
  | "document"
  | "website"
  | "api"
  | "database"
  | "custom";

// Interface para uma fonte de conhecimento RAG
export interface KnowledgeSource {
  id: string;
  name: string;
  type: KnowledgeSourceType;
  description: string;
  location: string;
  credentials?: string;
  format?: string;
  updateFrequency?: "static" | "daily" | "weekly" | "monthly" | "custom";
  enabled: boolean;
}

// Tipos de serviços de memória/RAG suportados
export type MemoryServiceType = "in-memory" | "vertex-ai-rag" | "custom";

// Configuração do serviço de memória/RAG
export interface RagMemoryConfig {
  enabled: boolean;
  serviceType: MemoryServiceType;
  projectId?: string;
  location?: string;
  ragCorpusName?: string;
  similarityTopK: number;
  vectorDistanceThreshold: number;
  embeddingModel?: string;
  knowledgeSources: KnowledgeSource[];
  includeConversationContext: boolean;
  persistentMemory: boolean;
}

// Interface para o componente
interface MemoryKnowledgeTabProps {
  // Configuração principal de RAG
  ragMemoryConfig: RagMemoryConfig;
  setRagMemoryConfig: React.Dispatch<React.SetStateAction<RagMemoryConfig>>;

  // Estado e persistência
  enableStatePersistence: boolean;
  setEnableStatePersistence: (enabled: boolean) => void;
  statePersistenceType: "session" | "memory" | "database";
  setStatePersistenceType: (type: "session" | "memory" | "database") => void;
  initialStateValues: Array<{
    key: string;
    value: string;
    scope: "global" | "agent" | "temporary";
    description: string;
  }>;
  setInitialStateValues: (
    values: Array<{
      key: string;
      value: string;
      scope: "global" | "agent" | "temporary";
      description: string;
    }>,
  ) => void;

  // Compartilhamento de estado
  enableStateSharing: boolean;
  setEnableStateSharing: (enabled: boolean) => void;
  stateSharingStrategy: "all" | "explicit" | "none";
  setStateSharingStrategy: (strategy: "all" | "explicit" | "none") => void;

  // Configuração de RAG básica
  enableRAG: boolean;
  setEnableRAG: (enabled: boolean) => void;
}

export const MemoryKnowledgeTab: React.FC<MemoryKnowledgeTabProps> = ({
  // Propriedades RAG
  ragMemoryConfig,
  setRagMemoryConfig,

  // Propriedades de Estado
  enableStatePersistence,
  setEnableStatePersistence,
  statePersistenceType,
  setStatePersistenceType,
  initialStateValues,
  setInitialStateValues,
  enableStateSharing,
  setEnableStateSharing,
  stateSharingStrategy,
  setStateSharingStrategy,
  enableRAG,
<<<<<<< Updated upstream
  setEnableRAG,
}: MemoryKnowledgeTabProps) {
  const [activeMemoryTab, setActiveMemoryTab] = React.useState("estado"); // Aba padrão

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          Nota sobre Configurações de Memória e Conhecimento
        </AlertTitle>
        <AlertDescription>
          Esta seção permite configurar como o agente gerencia sua memória de
          curto e longo prazo, e como ele acessa fontes de conhecimento para
          enriquecer suas respostas (RAG).
=======
  setEnableRAG
}) => {
  // Estado para controlar a aba ativa
  const [activeMemoryTab, setActiveMemoryTab] = React.useState<string>("rag");
  // Estado para o componente de adição de fonte de conhecimento
  const [showNewSourceForm, setShowNewSourceForm] = React.useState(false);
  const [newSource, setNewSource] = React.useState<Partial<KnowledgeSource>>({
    id: `source-${Date.now()}`,
    name: '',
    type: 'document',
    description: '',
    location: '',
    enabled: true
  });
  
  // Estado para adição de novos valores iniciais
  const [showNewStateForm, setShowNewStateForm] = React.useState(false);
  const [newStateValue, setNewStateValue] = React.useState<{
    key: string;
    value: string;
    scope: 'global' | 'agent' | 'temporary';
    description: string;
  }>({
    key: '',
    value: '',
    scope: 'agent',
    description: ''
  });

  // O estado para seleção de aba já foi definido na linha 140
  
  // Função auxiliar para obter o ícone com base no tipo de fonte
  const getSourceIcon = (type: KnowledgeSourceType) => {
    switch (type) {
      case 'document': return <Book className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      case 'api': return <Cloud className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'custom': return <Settings className="h-4 w-4" />;
      default: return <Book className="h-4 w-4" />;
    }
  };

  // Handler para alteração de configuração RAG
  const updateRagConfig = (updates: Partial<RagMemoryConfig>) => {
    setRagMemoryConfig({
      ...ragMemoryConfig,
      ...updates
    });
  };

  // Adicionar uma nova fonte de conhecimento
  const handleAddSource = () => {
    if (!newSource.name || !newSource.location) return;

    const completeSource: KnowledgeSource = {
      id: newSource.id || `source-${Date.now()}`,
      name: newSource.name,
      type: newSource.type || 'document',
      description: newSource.description || '',
      location: newSource.location,
      credentials: newSource.credentials,
      format: newSource.format,
      updateFrequency: newSource.updateFrequency,
      enabled: newSource.enabled !== undefined ? newSource.enabled : true
    };

    updateRagConfig({
      knowledgeSources: [...ragMemoryConfig.knowledgeSources, completeSource]
    });
    
    // Resetar o formulário
    setNewSource({
      id: `source-${Date.now() + 1}`,
      name: '',
      type: 'document',
      description: '',
      location: '',
      enabled: true
    });
    
    setShowNewSourceForm(false);
  };

  // Remover uma fonte de conhecimento
  const handleRemoveSource = (id: string) => {
    updateRagConfig({
      knowledgeSources: ragMemoryConfig.knowledgeSources.filter(source => source.id !== id)
    });
  };

  // Alternar o estado de habilitado/desabilitado de uma fonte
  const toggleSourceEnabled = (id: string) => {
    updateRagConfig({
      knowledgeSources: ragMemoryConfig.knowledgeSources.map(source => 
        source.id === id 
          ? { ...source, enabled: !source.enabled } 
          : source
      )
    });
  };

  // Adicionar novo valor de estado inicial
  const handleAddStateValue = () => {
    if (!newStateValue.key) return;
    
    setInitialStateValues([...initialStateValues, { 
      key: newStateValue.key,
      value: newStateValue.value,
      scope: newStateValue.scope,
      description: newStateValue.description
    }]);
    
    setNewStateValue({
      key: '',
      value: '',
      scope: 'agent',
      description: ''
    });
    
    setShowNewStateForm(false);
  };
  
  // Remover valor de estado
  const handleRemoveStateValue = (index: number) => {
    setInitialStateValues(initialStateValues.filter((_, i) => i !== index));
  };
  
  return (
    <>
      <h3 className="text-lg font-medium mb-3">
        Memória e Conhecimento
      </h3>
      
      <Alert className="mb-4 bg-card border-border/70" variant="default">
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <AlertTitle className="text-sm font-medium">Configuração de Memória e Conhecimento</AlertTitle>
        <AlertDescription className="text-xs">
          Configure como o agente gerencia seu estado, memória e acessa conhecimento externo.
          Isso permite que o agente mantenha contexto entre interações e responda com base em dados específicos.
>>>>>>> Stashed changes
        </AlertDescription>
      </Alert>

      <Tabs
        value={activeMemoryTab}
        onValueChange={setActiveMemoryTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="estado" className="py-2 px-4">
            Estado e Persistência
          </TabsTrigger>
          <TabsTrigger value="rag" className="py-2 px-4">
            Configuração RAG
          </TabsTrigger>
          <TabsTrigger value="fontes" className="py-2 px-4">
            Fontes de Conhecimento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estado">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Estado e Persistência</CardTitle>
              <CardDescription>
                Configure como o estado do agente é mantido entre interações e
                sessões.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-state-persistence"
                  checked={enableStatePersistence}
                  onCheckedChange={setEnableStatePersistence}
                />
                <Label htmlFor="enable-state-persistence">
                  Habilitar Persistência de Estado
                </Label>
              </div>
              {enableStatePersistence && (
<<<<<<< Updated upstream
                <div className="space-y-2">
                  <Label htmlFor="state-persistence-type">
                    Tipo de Persistência
                  </Label>
                  <Select
                    value={statePersistenceType}
                    onValueChange={
                      setStatePersistenceType as (
                        value: "session" | "memory" | "database",
                      ) => void
                    }
                  >
                    <SelectTrigger id="state-persistence-type">
                      <SelectValue placeholder="Selecione o tipo de persistência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">
                        Sessão do Navegador (Temporário)
                      </SelectItem>
                      <SelectItem value="memory">
                        Memória Interna do Agente
                      </SelectItem>
                      <SelectItem value="database">
                        Banco de Dados (Ex: Firestore)
                      </SelectItem>
                    </SelectContent>
                  </Select>
=======
                <div className="mt-4 space-y-4 pl-6">
                  <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                    <Label htmlFor="statePersistenceType" className="flex items-center">
                        Tipo de Persistência
                        <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>Define onde o estado do agente será armazenado:</p>
                                <ul className="list-disc pl-4 mt-1 text-xs">
                                    <li><strong>Sessão (Navegador):</strong> O estado é salvo no armazenamento da sessão do navegador e persiste enquanto a aba estiver aberta.</li>
                                    <li><strong>Memória (Curto Prazo):</strong> O estado é mantido na memória do servidor do agente, útil para contextos de interações rápidas, mas não sobrevive a reinícios do servidor.</li>
                                    <li><strong>Banco de Dados (Longo Prazo):</strong> O estado é salvo em um banco de dados configurado (ex: Firestore, PostgreSQL), garantindo persistência robusta e recuperação entre reinícios e diferentes instâncias do agente (ADK State).</li>
                                </ul>
                            </TooltipContent>
                        </Tooltip>
                    </Label>
                    <Select value={statePersistenceType} onValueChange={(value) => setStatePersistenceType(value as 'session' | 'memory' | 'database')}>
                        <SelectTrigger id="statePersistenceType"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="session">Sessão (Navegador)</SelectItem>
                            <SelectItem value="memory">Memória (Curto Prazo)</SelectItem>
                            <SelectItem value="database">Banco de Dados (Longo Prazo - ADK State)</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center">Valores Iniciais do Estado
                        <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                            <TooltipContent className="max-w-xs"><p>Define variáveis de estado e seus valores iniciais quando o agente é carregado. Útil para pré-configurar o agente com informações padrão ou contextos específicos.</p></TooltipContent>
                        </Tooltip>
                    </Label>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Chave
                                    <Tooltip>
                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Info size={12}/></Button></TooltipTrigger>
                                        <TooltipContent><p>O nome único (identificador) para esta variável de estado. Ex: `userPreferences`, `lastOrderDetails`.</p></TooltipContent>
                                    </Tooltip>
                                </TableHead>
                                <TableHead>Valor Inicial
                                    <Tooltip>
                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Info size={12}/></Button></TooltipTrigger>
                                        <TooltipContent><p>O valor inicial para esta variável de estado. Deve ser um valor JSON válido (ex: "algum texto", 123, true, {"{"}"subChave":"subValor"{"}"},  [1,2,3]).</p></TooltipContent>
                                    </Tooltip>
                                </TableHead>
                                <TableHead>Escopo
                                    <Tooltip>
                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Info size={12}/></Button></TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p>Define a visibilidade e o ciclo de vida da variável de estado no contexto ADK:</p>
                                            <ul className="list-disc pl-4 mt-1 text-xs">
                                                <li><strong>Global:</strong> O estado é compartilhado por todas as instâncias de todos os agentes no sistema.</li>
                                                <li><strong>Agente:</strong> O estado é específico para esta configuração de agente. Diferentes instâncias deste agente podem ter seus próprios valores se não usarem um ID de persistência compartilhado.</li>
                                                <li><strong>Temporário:</strong> O estado tem uma vida útil curta, tipicamente associado a uma interação ou sessão específica, gerenciado pelos escopos do ADK.</li>
                                            </ul>
                                        </TooltipContent>
                                    </Tooltip>
                                </TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialStateValues.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>{item.key}</TableCell>
                                    <TableCell><Badge variant="outline" className="font-mono">{item.value}</Badge></TableCell>
                                    <TableCell>{item.scope}</TableCell>
                                    <TableCell className="text-xs">{item.description}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveStateValue(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {initialStateValues.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhum valor inicial definido.</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                    <Button variant="outline" size="sm" onClick={() => setShowNewStateForm(true)} className="mt-2"><Plus className="mr-2 h-4 w-4" /> Adicionar Valor de Estado</Button>
                    {showNewStateForm && (
                        <Card className="mt-2 p-4 space-y-3 bg-muted/50">
                            <Input placeholder="Chave (ex: userRole)" value={newStateValue.key} onChange={(e) => setNewStateValue(prev => ({...prev, key: e.target.value}))} />
                            <Textarea placeholder='Valor (JSON válido, ex: "admin" ou {"theme":"dark"})' value={newStateValue.value} onChange={(e) => setNewStateValue(prev => ({...prev, value: e.target.value}))} rows={2}/>
                            <Select value={newStateValue.scope} onValueChange={(v) => setNewStateValue(prev => ({...prev, scope: v as any}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="agent">Agente</SelectItem>
                                    <SelectItem value="global">Global</SelectItem>
                                    <SelectItem value="temporary">Temporário</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input placeholder="Descrição (opcional)" value={newStateValue.description} onChange={(e) => setNewStateValue(prev => ({...prev, description: e.target.value}))} />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setShowNewStateForm(false)}>Cancelar</Button>
                                <Button size="sm" onClick={handleAddStateValue}>Adicionar</Button>
                            </div>
                        </Card>
                    )}
                  </div>
>>>>>>> Stashed changes
                </div>
              )}
              {/* TODO: Adicionar controles para initialStateValues e stateSharing */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rag">
          <Card>
            <CardHeader>
              <CardTitle>
                Configuração RAG (Retrieval Augmented Generation)
              </CardTitle>
              <CardDescription>
                Ajustes para enriquecer o agente com conhecimento de fontes
                externas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enable-rag"
                  checked={enableRAG}
                  onCheckedChange={setEnableRAG}
                />
                <Label htmlFor="enable-rag">Habilitar RAG</Label>
              </div>
              {enableRAG && (
                <>
                  {/* Exemplo de campos de ragMemoryConfig */}
                  <div className="space-y-2">
                    <Label htmlFor="similarity-top-k">
                      Top K (Similaridade)
                    </Label>
                    <Input
                      id="similarity-top-k"
                      type="number"
                      value={ragMemoryConfig.similarityTopK}
                      onChange={(e) =>
                        setRagMemoryConfig((prev) => ({
                          ...prev,
                          similarityTopK: parseInt(e.target.value, 10) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vector-distance-threshold">
                      Limite de Distância Vetorial
                    </Label>
                    <Input
                      id="vector-distance-threshold"
                      type="number"
                      step="0.01"
                      value={ragMemoryConfig.vectorDistanceThreshold}
                      onChange={(e) =>
                        setRagMemoryConfig((prev) => ({
                          ...prev,
                          vectorDistanceThreshold:
                            parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-conversation-context"
                      checked={ragMemoryConfig.includeConversationContext}
                      onCheckedChange={(checked) =>
                        setRagMemoryConfig((prev) => ({
                          ...prev,
                          includeConversationContext: checked,
                        }))
                      }
                    />
                    <Label htmlFor="include-conversation-context">
                      Incluir Contexto da Conversa no RAG
                    </Label>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fontes">
          <Card>
            <CardHeader>
              <CardTitle>Fontes de Conhecimento para RAG</CardTitle>
              <CardDescription>
                Gerencie as fontes de dados (documentos, websites, APIs) que o
                RAG utilizará.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
<<<<<<< Updated upstream
              {/* TODO: Implementar UI para gerenciar ragMemoryConfig.knowledgeSources */}
              <p>
                Lista de fontes de conhecimento e opções para
                adicionar/remover/configurar cada uma.
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Fonte
              </Button>
=======
              <div className="flex items-center space-x-2">
                <Switch
                    id="enableStateSharing"
                    checked={enableStateSharing}
                    onCheckedChange={setEnableStateSharing}
                />
                <Label htmlFor="enableStateSharing" className="flex items-center">
                    Habilitar Compartilhamento de Estado
                    <Tooltip>
                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                        <TooltipContent className="max-w-xs"><p>Permite que este agente compartilhe seu estado (variáveis de estado definidas) com outros agentes dentro de um sistema ADK (Agent Development Kit), facilitando a colaboração e a passagem de contexto.</p></TooltipContent>
                    </Tooltip>
                </Label>
              </div>
              {enableStateSharing && (
                <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 pl-6">
                    <Label htmlFor="stateSharingStrategy" className="flex items-center">
                        Estratégia de Compartilhamento
                        <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                                <p>Define quais partes do estado do agente são compartilhadas:</p>
                                <ul className="list-disc pl-4 mt-1 text-xs">
                                    <li><strong>Todos:</strong> Todas as variáveis de estado do agente são compartilhadas.</li>
                                    <li><strong>Explícito:</strong> Apenas as variáveis de estado explicitamente marcadas para compartilhamento (não implementado nesta UI) são compartilhadas.</li>
                                    <li><strong>Nenhum:</strong> Nenhum estado é compartilhado, mesmo que o compartilhamento esteja habilitado (útil para desabilitar temporariamente).</li>
                                </ul>
                            </TooltipContent>
                        </Tooltip>
                    </Label>
                    <Select value={stateSharingStrategy} onValueChange={(v) => setStateSharingStrategy(v as 'all' | 'explicit' | 'none')}>
                        <SelectTrigger id="stateSharingStrategy"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Estados</SelectItem>
                            <SelectItem value="explicit">Apenas Estados Explícitos</SelectItem>
                            <SelectItem value="none">Nenhum (Desabilitado Temporariamente)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              )}
>>>>>>> Stashed changes
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
