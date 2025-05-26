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

  // Estado para seleção de aba
  const [activeMemoryTab, setActiveMemoryTab] = React.useState<string>("estado");
  
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
    <div>
      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
        <BrainCircuit className="w-5 h-5 text-primary/80" /> Memória e Conhecimento
      </h3>
      
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
          <TabsTrigger value="estado" className="py-2">
            <Database className="h-4 w-4 mr-2" />
            Estado e Persistência
          </TabsTrigger>
          <TabsTrigger value="rag" className="py-2">
            <Book className="h-4 w-4 mr-2" />
            RAG e Conhecimento
          </TabsTrigger>
          <TabsTrigger value="compartilhamento" className="py-2">
            <ListFilter className="h-4 w-4 mr-2" />
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
                  id="enable-state-persistence" 
                  checked={enableStatePersistence} 
                  onCheckedChange={setEnableStatePersistence}
                />
                <Label htmlFor="enable-state-persistence">Habilitar persistência de estado</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rag">
          <Card>
            <CardHeader>
              <CardTitle>RAG e Conhecimento</CardTitle>
              <CardDescription>Configure as fontes de conhecimento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="enable-rag" 
                  checked={ragMemoryConfig.enabled} 
                  onCheckedChange={(enabled) => updateRagConfig({ enabled })}
                />
                <Label htmlFor="enable-rag">Habilitar RAG</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compartilhamento">
          <Card>
            <CardHeader>
              <CardTitle>Compartilhamento</CardTitle>
              <CardDescription>Configure o compartilhamento de estado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="enable-state-sharing" 
                  checked={enableStateSharing} 
                  onCheckedChange={setEnableStateSharing}
                />
                <Label htmlFor="enable-state-sharing">Habilitar compartilhamento de estado</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}