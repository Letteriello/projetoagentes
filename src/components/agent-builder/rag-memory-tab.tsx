"use client";

import * as React from "react";
import { Book, Database, Plus, Info, Trash2, FileUp, Search, BrainCircuit, Settings, Cloud, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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
  location: string; // URI, URL, ou caminho de arquivo
  credentials?: string; // Opcional, para fontes que requerem autenticação
  format?: string; // Formato do conteúdo (PDF, HTML, JSON, etc.)
  updateFrequency?: 'static' | 'daily' | 'weekly' | 'monthly' | 'custom'; // Frequência de atualização
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
  projectId?: string; // Para serviços cloud
  location?: string; // Para serviços cloud (região)
  ragCorpusName?: string; // Para Vertex AI RAG
  similarityTopK: number; // Número de resultados similares a recuperar
  vectorDistanceThreshold: number; // Limiar de distância para considerar resultados relevantes (0-1)
  embeddingModel?: string; // Modelo de embeddings a usar
  knowledgeSources: KnowledgeSource[]; // Fontes de conhecimento
  includeConversationContext: boolean; // Incluir contexto da conversa atual
  persistentMemory: boolean; // Manter memória entre sessões
}

interface RagMemoryTabProps {
  // Configuração principal
  ragMemoryConfig: RagMemoryConfig;
  setRagMemoryConfig: (config: RagMemoryConfig) => void;
}

export function RagMemoryTab({
  ragMemoryConfig,
  setRagMemoryConfig
}: RagMemoryTabProps) {
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

  // Função auxiliar para obter o ícone com base no tipo de fonte
  const getSourceIcon = (type: KnowledgeSourceType) => {
    switch (type) {
      case 'document': return <Book className="h-4 w-4" />;
      case 'website': return <Search className="h-4 w-4" />;
      case 'api': return <Cloud className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'custom': return <Settings className="h-4 w-4" />;
      default: return <Book className="h-4 w-4" />;
    }
  };

  // Handler para alteração de configuração principal
  const updateConfig = (updates: Partial<RagMemoryConfig>) => {
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

    updateConfig({
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
    updateConfig({
      knowledgeSources: ragMemoryConfig.knowledgeSources.filter(source => source.id !== id)
    });
  };

  // Alternar o estado de habilitado/desabilitado de uma fonte
  const toggleSourceEnabled = (id: string) => {
    updateConfig({
      knowledgeSources: ragMemoryConfig.knowledgeSources.map(source => 
        source.id === id 
          ? { ...source, enabled: !source.enabled } 
          : source
      )
    });
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">
        Configuração de RAG (Retrieval-Augmented Generation) e Memória
      </h3>
      
      <Alert variant="default" className="mb-4 bg-card border-border/70">
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <AlertTitle className="text-sm font-medium">Acesso a Conhecimento Externo</AlertTitle>
        <AlertDescription className="text-xs">
          Configure como o agente acessa e utiliza conhecimento externo (RAG) e memória persistente.
          Isso permite que o agente responda com base em informações específicas do seu domínio.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {/* Seção de Configuração Geral de RAG/Memória */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings size={16} className="text-primary/80" />
              Configuração de RAG e Memória
            </CardTitle>
            <CardDescription>
              Configure o serviço de RAG e memória do agente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Switch 
                id="enable-rag" 
                checked={ragMemoryConfig.enabled} 
                onCheckedChange={(checked) => updateConfig({ enabled: checked })}
              />
              <Label htmlFor="enable-rag" className="flex items-center gap-1">
                Habilitar RAG e memória persistente
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground">
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Quando habilitado, o agente pode acessar conhecimento externo e manter memória entre interações.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>
            
            {ragMemoryConfig.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                  <Label htmlFor="memory-service-type" className="text-left">Tipo de Serviço</Label>
                  <Select 
                    value={ragMemoryConfig.serviceType} 
                    onValueChange={(value: MemoryServiceType) => updateConfig({ serviceType: value })}
                  >
                    <SelectTrigger id="memory-service-type" className="h-9">
                      <SelectValue placeholder="Selecione o tipo de serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-memory">InMemoryMemoryService (apenas durante execução)</SelectItem>
                      <SelectItem value="vertex-ai-rag">VertexAiRagMemoryService (Google Cloud)</SelectItem>
                      <SelectItem value="custom">Serviço Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {ragMemoryConfig.serviceType === 'vertex-ai-rag' && (
                  <>
                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                      <Label htmlFor="gcp-project-id" className="text-left">ID do Projeto GCP</Label>
                      <Input 
                        id="gcp-project-id" 
                        value={ragMemoryConfig.projectId || ''} 
                        onChange={(e) => updateConfig({ projectId: e.target.value })}
                        placeholder="ex: my-gcp-project-123"
                        className="h-9"
                      />
                    </div>

                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                      <Label htmlFor="gcp-location" className="text-left">Região GCP</Label>
                      <Input 
                        id="gcp-location" 
                        value={ragMemoryConfig.location || ''} 
                        onChange={(e) => updateConfig({ location: e.target.value })}
                        placeholder="ex: us-central1"
                        className="h-9"
                      />
                    </div>

                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                      <Label htmlFor="rag-corpus-name" className="text-left">Nome do Corpus RAG</Label>
                      <Input 
                        id="rag-corpus-name" 
                        value={ragMemoryConfig.ragCorpusName || ''} 
                        onChange={(e) => updateConfig({ ragCorpusName: e.target.value })}
                        placeholder="ex: my-knowledge-corpus"
                        className="h-9"
                      />
                    </div>
                  </>
                )}

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label className="text-left">Parâmetros de Recuperação</Label>
                  
                  <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3 mt-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="similarity-top-k" className="text-left">
                        Número de Resultados (Top K)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0 text-muted-foreground hover:text-foreground">
                              <Info size={12} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Número máximo de resultados similares a recuperar</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                    <div className="flex items-center gap-4">
                      <Slider 
                        id="similarity-top-k"
                        value={[ragMemoryConfig.similarityTopK]} 
                        min={1} 
                        max={20} 
                        step={1} 
                        onValueChange={(value) => updateConfig({ similarityTopK: value[0] })}
                        className="flex-1"
                      />
                      <span className="w-12 text-center">{ragMemoryConfig.similarityTopK}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3 mt-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="vector-distance" className="text-left">
                        Limiar de Distância
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0 text-muted-foreground hover:text-foreground">
                              <Info size={12} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Limiar de distância para considerar resultados relevantes (0-1). Valores menores são mais restritivos.</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </div>
                    <div className="flex items-center gap-4">
                      <Slider 
                        id="vector-distance"
                        value={[ragMemoryConfig.vectorDistanceThreshold]} 
                        min={0.1} 
                        max={1} 
                        step={0.05} 
                        onValueChange={(value) => updateConfig({ vectorDistanceThreshold: value[0] })}
                        className="flex-1"
                      />
                      <span className="w-12 text-center">{ragMemoryConfig.vectorDistanceThreshold.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />

                <div className="flex items-center space-x-2">
                  <Switch 
                    id="include-conversation" 
                    checked={ragMemoryConfig.includeConversationContext} 
                    onCheckedChange={(checked) => updateConfig({ includeConversationContext: checked })}
                  />
                  <Label htmlFor="include-conversation" className="flex items-center gap-1">
                    Incluir contexto da conversa atual
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground">
                          <Info size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Quando habilitado, o contexto da conversa atual será incluído nas consultas de recuperação.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 mt-2">
                  <Switch 
                    id="persistent-memory" 
                    checked={ragMemoryConfig.persistentMemory} 
                    onCheckedChange={(checked) => updateConfig({ persistentMemory: checked })}
                  />
                  <Label htmlFor="persistent-memory" className="flex items-center gap-1">
                    Manter memória entre sessões
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground">
                          <Info size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Quando habilitado, o agente mantém a memória entre diferentes sessões do usuário.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção de Fontes de Conhecimento */}
        {ragMemoryConfig.enabled && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Book size={16} className="text-primary/80" />
                Fontes de Conhecimento
              </CardTitle>
              <CardDescription>
                Defina as fontes de conhecimento que o agente pode acessar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ragMemoryConfig.knowledgeSources.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">Tipo</TableHead>
                        <TableHead className="w-[150px]">Nome</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead className="w-[80px] text-center">Status</TableHead>
                        <TableHead className="w-[80px] text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ragMemoryConfig.knowledgeSources.map((source) => (
                        <TableRow key={source.id}>
                          <TableCell>
                            {getSourceIcon(source.type)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {source.name}
                            {source.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={source.description}>
                                {source.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={source.location}>
                            {source.location}
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch 
                              checked={source.enabled} 
                              onCheckedChange={() => toggleSourceEnabled(source.id)}
                              className="data-[state=checked]:bg-green-500"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSource(source.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remover</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-4 bg-muted/20 rounded-md">
                    <p className="text-muted-foreground">Nenhuma fonte de conhecimento definida. Adicione uma nova fonte abaixo.</p>
                  </div>
                )}

                {showNewSourceForm ? (
                  <Card className="border border-dashed p-4">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-sm">Nova Fonte de Conhecimento</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="source-name" className="text-xs">Nome da Fonte</Label>
                          <Input 
                            id="source-name" 
                            value={newSource.name} 
                            onChange={(e) => setNewSource({...newSource, name: e.target.value})} 
                            placeholder="ex: Documentação do Produto"
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="source-type" className="text-xs">Tipo de Fonte</Label>
                          <Select 
                            value={newSource.type} 
                            onValueChange={(value: KnowledgeSourceType) => setNewSource({...newSource, type: value})}
                          >
                            <SelectTrigger id="source-type" className="h-8">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="document">Documento</SelectItem>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="api">API</SelectItem>
                              <SelectItem value="database">Banco de Dados</SelectItem>
                              <SelectItem value="custom">Personalizado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="source-location" className="text-xs">Localização (URI/URL/Caminho)</Label>
                        <Input 
                          id="source-location" 
                          value={newSource.location} 
                          onChange={(e) => setNewSource({...newSource, location: e.target.value})} 
                          placeholder={
                            newSource.type === 'document' ? "ex: gs://bucket/docs/*.pdf" :
                            newSource.type === 'website' ? "ex: https://exemplo.com/docs" :
                            newSource.type === 'api' ? "ex: https://api.exemplo.com/v1/data" :
                            newSource.type === 'database' ? "ex: mysql://user:pass@localhost:3306/db" :
                            "ex: URI ou caminho para a fonte"
                          }
                          className="h-8"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="source-description" className="text-xs">Descrição (opcional)</Label>
                        <Textarea 
                          id="source-description" 
                          value={newSource.description} 
                          onChange={(e) => setNewSource({...newSource, description: e.target.value})} 
                          placeholder="Descrição do conteúdo desta fonte de conhecimento"
                          className="h-16 resize-none"
                        />
                      </div>
                      
                      {(newSource.type === 'api' || newSource.type === 'database') && (
                        <div className="space-y-2">
                          <Label htmlFor="source-credentials" className="text-xs">Credenciais (opcional)</Label>
                          <Input 
                            id="source-credentials" 
                            type="password"
                            value={newSource.credentials || ''} 
                            onChange={(e) => setNewSource({...newSource, credentials: e.target.value})} 
                            placeholder="ex: chave de API ou string de conexão"
                            className="h-8"
                          />
                          <p className="text-xs text-muted-foreground">Por segurança, credenciais devem ser gerenciadas via variáveis de ambiente em produção.</p>
                        </div>
                      )}
                      
                      {newSource.type === 'document' && (
                        <div className="space-y-2">
                          <Label htmlFor="source-format" className="text-xs">Formato (opcional)</Label>
                          <Select 
                            value={newSource.format} 
                            onValueChange={(value: string) => setNewSource({...newSource, format: value})}
                          >
                            <SelectTrigger id="source-format" className="h-8">
                              <SelectValue placeholder="Selecione o formato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="txt">Texto</SelectItem>
                              <SelectItem value="md">Markdown</SelectItem>
                              <SelectItem value="docx">Word (DOCX)</SelectItem>
                              <SelectItem value="csv">CSV</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-0 pt-4 flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowNewSourceForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        size="sm"
                        onClick={handleAddSource}
                        disabled={!newSource.name || !newSource.location}
                      >
                        Adicionar Fonte
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewSourceForm(true)}
                    className="w-full"
                  >
                    Adicionar Nova Fonte de Conhecimento
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}