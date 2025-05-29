"use client";

import * as React from "react";
import { 
  Book, 
  Database, 
  Plus, 
  Info, 
  Trash2, 
  Search, 
  BrainCircuit, 
  Settings, 
  Cloud, 
  Server, 
  LayoutGrid, 
  ListFilter, 
  Globe, 
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

// Tipos de fontes de conhecimento para RAG
export type KnowledgeSourceType = 
  | 'document' 
  | 'website'
  | 'api'
  | 'database'
  | 'custom';

// Interface para uma fonte de conhecimento RAG
export interface KnowledgeSource {
  id: string;
  name: string;
  type: KnowledgeSourceType;
  description: string;
  location: string;
  credentials?: string;
  format?: string;
  updateFrequency?: 'static' | 'daily' | 'weekly' | 'monthly' | 'custom';
  enabled: boolean;
}

// Tipos de serviços de memória/RAG suportados
export type MemoryServiceType = 
  | 'in-memory' 
  | 'vertex-ai-rag' 
  | 'custom';

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
  setRagMemoryConfig: (config: RagMemoryConfig) => void;
  
  // Estado e persistência
  enableStatePersistence: boolean;
  setEnableStatePersistence: (enabled: boolean) => void;
  statePersistenceType: 'session' | 'memory' | 'database';
  setStatePersistenceType: (type: 'session' | 'memory' | 'database') => void;
  initialStateValues: Array<{
    key: string;
    value: string;
    scope: 'global' | 'agent' | 'temporary';
    description: string;
  }>;
  setInitialStateValues: (values: Array<{
    key: string;
    value: string;
    scope: 'global' | 'agent' | 'temporary';
    description: string;
  }>) => void;
  
  // Compartilhamento de estado
  enableStateSharing: boolean;
  setEnableStateSharing: (enabled: boolean) => void;
  stateSharingStrategy: 'all' | 'explicit' | 'none';
  setStateSharingStrategy: (strategy: 'all' | 'explicit' | 'none') => void;
  
  // Configuração de RAG básica
  enableRAG: boolean;
  setEnableRAG: (enabled: boolean) => void;
}

export function MemoryKnowledgeTab({

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
  setEnableRAG
}: MemoryKnowledgeTabProps) {
  // Estado para o componente de adição de fonte de conhecimento
  const [showNewSourceForm, setShowNewSourceForm] = React.useState(false);
  const [activeMemoryTab, setActiveMemoryTab] = React.useState<string>("estado");
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

  // Estado para controlar a aba ativa
  // Tab state is already declared above
  
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
  const updateRagConfig = React.useCallback((updates: Partial<RagMemoryConfig>) => {
    setRagMemoryConfig((prev: RagMemoryConfig) => ({...prev, ...updates}));
  }, [setRagMemoryConfig]);

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
    <TooltipProvider>
      <div>
      <Alert variant="default" className="mb-4 bg-card border-border/70">
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <AlertTitle className="text-sm font-medium">Configuração de Memória e Conhecimento</AlertTitle>
        <AlertDescription className="text-xs">
          Configure como o agente gerencia seu estado, memória e acessa conhecimento externo.
          Isso permite que o agente mantenha contexto entre interações e responda com base em dados específicos.
        </AlertDescription>
      </Alert>

      {/* Implementação inicial simplificada - vamos expandir incrementalmente */}
      <Tabs value={activeMemoryTab} onValueChange={setActiveMemoryTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="estado" className="py-2 px-4">
            Estado e Persistência
          </TabsTrigger>
          <TabsTrigger value="rag" className="py-2 px-4">
            RAG e Conhecimento
          </TabsTrigger>
          <TabsTrigger value="compartilhamento" className="py-2 px-4">
            Compartilhamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estado">
          <Card>
            <CardHeader>
              <CardTitle>Estado e Persistência</CardTitle>
              <CardDescription>Configure como o agente mantém seu estado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                    id="enableStatePersistence"
                    checked={enableStatePersistence}
                    onCheckedChange={setEnableStatePersistence}
                />
                <Label htmlFor="enableStatePersistence" className="flex items-center">
                    Habilitar Persistência de Estado
                    <Tooltip>
                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                        <TooltipContent className="max-w-xs"><p>Permite que o agente armazene e recupere informações (estado) entre diferentes sessões de chat ou execuções, possibilitando conversas contínuas e aprendizado ao longo do tempo.</p></TooltipContent>
                    </Tooltip>
                </Label>
              </div>
              {enableStatePersistence && (
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
                                        <TooltipContent><p>O valor inicial para esta variável de estado. Deve ser um valor JSON válido (ex: "algum texto", 123, true, &#123;"subChave":"subValor"&#125;, [1,2,3]).</p></TooltipContent>
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rag">
          <Card>
            <CardHeader>
              <CardTitle>RAG e Conhecimento</CardTitle>
              <CardDescription>Configure as fontes de conhecimento para Retrieval Augmented Generation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                    id="enableRAG"
                    checked={ragMemoryConfig.enabled}
                    onCheckedChange={(checked) => setRagMemoryConfig({...ragMemoryConfig, enabled: checked})}
                />
                <Label htmlFor="enableRAG" className="flex items-center">
                    Habilitar RAG (Retrieval Augmented Generation)
                    <Tooltip>
                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                        <TooltipContent className="max-w-xs"><p>Permite que o agente consulte bases de conhecimento externas (documentos, websites, APIs) para encontrar informações relevantes e usá-las para enriquecer suas respostas, tornando-as mais precisas e contextuais.</p></TooltipContent>
                    </Tooltip>
                </Label>
              </div>

              {ragMemoryConfig.enabled && (
                <div className="space-y-4 pl-6">
                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                        <Label htmlFor="ragServiceType" className="flex items-center">
                            Tipo de Serviço RAG
                            <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p>Define o backend para o serviço RAG:</p>
                                    <ul className="list-disc pl-4 mt-1 text-xs">
                                        <li><strong>Em Memória:</strong> Para prototipagem e pequenos conjuntos de dados, indexados na memória do agente.</li>
                                        <li><strong>Vertex AI RAG Service (Google Cloud):</strong> Serviço gerenciado do Google Cloud para RAG em larga escala, com recursos avançados.</li>
                                        <li><strong>Customizado (Genkit):</strong> Permite integrar seu próprio sistema RAG através de um fluxo Genkit.</li>
                                    </ul>
                                </TooltipContent>
                            </Tooltip>
                        </Label>
                        <Select value={ragMemoryConfig.serviceType} onValueChange={(v) => updateRagConfig({ serviceType: v as MemoryServiceType })}>
                            <SelectTrigger id="ragServiceType"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="in-memory">Em Memória (para teste)</SelectItem>
                                <SelectItem value="vertex-ai-rag">Vertex AI RAG Service (Google Cloud)</SelectItem>
                                <SelectItem value="custom">Customizado (via fluxo Genkit)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {ragMemoryConfig.serviceType === 'vertex-ai-rag' && (
                    <>
                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                            <Label htmlFor="ragProjectId" className="flex items-center">
                                Project ID (Vertex AI)
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                    <TooltipContent className="max-w-xs"><p>O ID do seu projeto no Google Cloud onde o serviço Vertex AI RAG está configurado.</p></TooltipContent>
                                </Tooltip>
                            </Label>
                            <Input id="ragProjectId" value={ragMemoryConfig.projectId} onChange={(e) => updateRagConfig({ projectId: e.target.value })} placeholder="Seu Google Cloud Project ID" />
                        </div>
                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                            <Label htmlFor="ragLocation" className="flex items-center">
                                Location (Vertex AI)
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                    <TooltipContent className="max-w-xs"><p>A região do Google Cloud onde seu serviço Vertex AI RAG e corpus estão localizados (ex: us-central1).</p></TooltipContent>
                                </Tooltip>
                            </Label>
                            <Input id="ragLocation" value={ragMemoryConfig.location} onChange={(e) => updateRagConfig({ location: e.target.value })} placeholder="ex: us-central1" />
                        </div>
                        <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                            <Label htmlFor="ragCorpusName" className="flex items-center">
                                Nome do Corpus RAG (Vertex AI)
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                    <TooltipContent className="max-w-xs"><p>O nome do seu corpus de dados (coleção de documentos) criado dentro do serviço Vertex AI RAG.</p></TooltipContent>
                                </Tooltip>
                            </Label>
                            <Input id="ragCorpusName" value={ragMemoryConfig.ragCorpusName} onChange={(e) => updateRagConfig({ ragCorpusName: e.target.value })} placeholder="Nome do seu corpus no Vertex AI RAG" />
                        </div>
                    </>
                    )}
                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                        <Label htmlFor="ragSimilarityTopK" className="flex items-center">Top K ({ragMemoryConfig.similarityTopK})
                            <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14}/></Button></TooltipTrigger>
                                <TooltipContent><p>O número de "pedaços" (chunks) de informação mais relevantes a serem recuperados da base de conhecimento para cada consulta RAG.</p></TooltipContent>
                            </Tooltip>
                        </Label>
                        <Slider id="ragSimilarityTopK" min={1} max={20} step={1} value={[ragMemoryConfig.similarityTopK]} onValueChange={(value) => updateRagConfig({ similarityTopK: value[0] })} />
                    </div>
                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                        <Label htmlFor="ragVectorDistanceThreshold" className="flex items-center">Limite Dist. Vetorial ({ragMemoryConfig.vectorDistanceThreshold.toFixed(2)})
                            <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14}/></Button></TooltipTrigger>
                                <TooltipContent><p>Controla o quão similar um chunk recuperado deve ser da consulta. Valores entre 0 e 1 (ex: 0.7). Um valor mais baixo exige maior similaridade (mais estrito), enquanto um valor mais alto permite chunks menos similares.</p></TooltipContent>
                            </Tooltip>
                        </Label>
                        <Slider id="ragVectorDistanceThreshold" min={0} max={1} step={0.05} value={[ragMemoryConfig.vectorDistanceThreshold]} onValueChange={(value) => updateRagConfig({ vectorDistanceThreshold: value[0] })} />
                    </div>
                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                        <Label htmlFor="ragEmbeddingModel" className="flex items-center">
                            Modelo de Embedding
                            <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                <TooltipContent className="max-w-xs"><p>O modelo de IA usado para converter o texto das fontes de conhecimento e as consultas do usuário em vetores numéricos (embeddings). Deve ser compatível com o modelo usado para indexar o corpus. Ex: "text-embedding-004" (Google), "openai/text-embedding-ada-002".</p></TooltipContent>
                            </Tooltip>
                        </Label>
                        <Input id="ragEmbeddingModel" value={ragMemoryConfig.embeddingModel} onChange={(e) => updateRagConfig({ embeddingModel: e.target.value })} placeholder="ex: text-embedding-004 (Google)" />
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="flex items-center">Fontes de Conhecimento
                            <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14}/></Button></TooltipTrigger>
                                <TooltipContent><p>Define as fontes de dados (documentos, sites, etc.) que o sistema RAG irá indexar e consultar para encontrar informações relevantes.</p></TooltipContent>
                            </Tooltip>
                        </Label>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome
                                        <Tooltip>
                                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Info size={12}/></Button></TooltipTrigger>
                                            <TooltipContent><p>Nome descritivo para esta fonte de conhecimento. Ex: "Manuais de Produto PDF", "FAQ do Website".</p></TooltipContent>
                                        </Tooltip>
                                    </TableHead>
                                    <TableHead>Tipo
                                        <Tooltip>
                                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Info size={12}/></Button></TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                                <p>O tipo da fonte de dados:</p>
                                                <ul className="list-disc pl-4 mt-1 text-xs">
                                                    <li><strong>Documento:</strong> Arquivos individuais (PDF, TXT, DOCX).</li>
                                                    <li><strong>Website:</strong> URLs de páginas web para scraping.</li>
                                                    <li><strong>API:</strong> Endpoint de API que retorna dados textuais ou estruturados.</li>
                                                    <li><strong>Banco de Dados:</strong> Conexão a um banco para extrair informações textuais.</li>
                                                </ul>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TableHead>
                                    <TableHead>Localização/ID
                                        <Tooltip>
                                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Info size={12}/></Button></TooltipTrigger>
                                            <TooltipContent><p>O caminho do arquivo, URL do website, endpoint da API ou identificador de conexão do banco de dados.</p></TooltipContent>
                                        </Tooltip>
                                    </TableHead>
                                    <TableHead>Frequência de Atualização
                                        <Tooltip>
                                            <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 p-0"><Info size={12}/></Button></TooltipTrigger>
                                            <TooltipContent><p>Com que frequência a fonte de dados deve ser re-indexada para capturar atualizações. Relevante para fontes dinâmicas como websites ou APIs. Ex: "Diariamente", "Semanalmente", "Sob Demanda".</p></TooltipContent>
                                        </Tooltip>
                                    </TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ragMemoryConfig.knowledgeSources.map(source => (
                                    <TableRow key={source.id}>
                                        <TableCell>{source.name}</TableCell>
                                        <TableCell><Badge variant="outline" className="capitalize">{getSourceIcon(source.type)} {source.type}</Badge></TableCell>
                                        <TableCell className="text-xs truncate max-w-xs" title={source.location}>{source.location}</TableCell>
                                        <TableCell className="capitalize">{source.updateFrequency || 'Estático'}</TableCell>
                                        <TableCell className="text-right">
                                            <Switch checked={source.enabled} onCheckedChange={() => toggleSourceEnabled(source.id)} className="mr-2" />
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveSource(source.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {ragMemoryConfig.knowledgeSources.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Nenhuma fonte de conhecimento adicionada.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                        <Button variant="outline" size="sm" onClick={() => setShowNewSourceForm(true)} className="mt-2"><Plus className="mr-2 h-4 w-4" /> Adicionar Fonte</Button>
                        {showNewSourceForm && (
                            <Card className="mt-2 p-4 space-y-3 bg-muted/50">
                                <Input placeholder="Nome da Fonte" value={newSource.name} onChange={(e) => setNewSource(prev => ({...prev, name: e.target.value}))} />
                                <Select value={newSource.type} onValueChange={(v) => setNewSource(prev => ({...prev, type: v as KnowledgeSourceType}))}>
                                    <SelectTrigger><SelectValue placeholder="Tipo de Fonte" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="document">Documento (PDF, TXT, etc.)</SelectItem>
                                        <SelectItem value="website">Website (URL)</SelectItem>
                                        <SelectItem value="api">API (Endpoint)</SelectItem>
                                        <SelectItem value="database">Banco de Dados (String de Conexão)</SelectItem>
                                        <SelectItem value="custom">Customizado (Fluxo Genkit)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input placeholder="Localização (URL, Caminho, ID)" value={newSource.location} onChange={(e) => setNewSource(prev => ({...prev, location: e.target.value}))} />
                                <Textarea placeholder="Descrição (opcional)" value={newSource.description} onChange={(e) => setNewSource(prev => ({...prev, description: e.target.value}))} rows={2}/>
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setShowNewSourceForm(false)}>Cancelar</Button>
                                    <Button size="sm" onClick={handleAddSource}>Adicionar Fonte</Button>
                                </div>
                            </Card>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="ragIncludeConversationContext"
                            checked={ragMemoryConfig.includeConversationContext}
                            onCheckedChange={(checked) => updateRagConfig({ includeConversationContext: checked })}
                        />
                        <Label htmlFor="ragIncludeConversationContext" className="flex items-center">
                            Incluir Contexto da Conversa na Busca RAG
                            <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                <TooltipContent className="max-w-xs"><p>Se habilitado, o histórico da conversa atual será incluído como parte da consulta ao sistema RAG, ajudando a encontrar informações mais relevantes para o diálogo em andamento.</p></TooltipContent>
                            </Tooltip>
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="ragPersistentMemory"
                            checked={ragMemoryConfig.persistentMemory}
                            onCheckedChange={(checked) => updateRagConfig({ persistentMemory: checked })}
                        />
                        <Label htmlFor="ragPersistentMemory" className="flex items-center">
                            Habilitar Memória Persistente para RAG
                            <Tooltip>
                                <TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"><Info size={14} /></Button></TooltipTrigger>
                                <TooltipContent className="max-w-xs"><p>Se habilitado, os resultados de buscas RAG e interações podem ser armazenados de forma persistente (ADK State/Memory), permitindo que o agente "lembre" de informações consultadas anteriormente em conversas futuras ou entre sessões.</p></TooltipContent>
                            </Tooltip>
                        </Label>
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compartilhamento">
          <Card>
            <CardHeader>
              <CardTitle>Compartilhamento de Estado</CardTitle>
              <CardDescription>Configure como o estado do agente é compartilhado com outros agentes (ADK).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  );
}
