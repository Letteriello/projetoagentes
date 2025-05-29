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
  X
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  setRagMemoryConfig: React.Dispatch<React.SetStateAction<RagMemoryConfig>>;
  
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
  const [activeMemoryTab, setActiveMemoryTab] = React.useState("estado"); // Aba padrão

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Nota sobre Configurações de Memória e Conhecimento</AlertTitle>
        <AlertDescription>
          Esta seção permite configurar como o agente gerencia sua memória de curto e longo prazo,
          e como ele acessa fontes de conhecimento para enriquecer suas respostas (RAG).
        </AlertDescription>
      </Alert>

      <Tabs value={activeMemoryTab} onValueChange={setActiveMemoryTab} className="space-y-4">
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
                Configure como o estado do agente é mantido entre interações e sessões.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="enable-state-persistence" 
                  checked={enableStatePersistence} 
                  onCheckedChange={setEnableStatePersistence} 
                />
                <Label htmlFor="enable-state-persistence">Habilitar Persistência de Estado</Label>
              </div>
              {enableStatePersistence && (
                <div className="space-y-2">
                  <Label htmlFor="state-persistence-type">Tipo de Persistência</Label>
                  <Select 
                    value={statePersistenceType} 
                    onValueChange={setStatePersistenceType as (value: 'session' | 'memory' | 'database') => void}
                  >
                    <SelectTrigger id="state-persistence-type">
                      <SelectValue placeholder="Selecione o tipo de persistência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">Sessão do Navegador (Temporário)</SelectItem>
                      <SelectItem value="memory">Memória Interna do Agente</SelectItem>
                      <SelectItem value="database">Banco de Dados (Ex: Firestore)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* TODO: Adicionar controles para initialStateValues e stateSharing */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rag">
          <Card>
            <CardHeader>
              <CardTitle>Configuração RAG (Retrieval Augmented Generation)</CardTitle>
              <CardDescription>
                Ajustes para enriquecer o agente com conhecimento de fontes externas.
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
                    <Label htmlFor="similarity-top-k">Top K (Similaridade)</Label>
                    <Input 
                      id="similarity-top-k" 
                      type="number" 
                      value={ragMemoryConfig.similarityTopK} 
                      onChange={(e) => setRagMemoryConfig(prev => ({...prev, similarityTopK: parseInt(e.target.value, 10) || 0}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vector-distance-threshold">Limite de Distância Vetorial</Label>
                    <Input 
                      id="vector-distance-threshold" 
                      type="number" 
                      step="0.01"
                      value={ragMemoryConfig.vectorDistanceThreshold} 
                      onChange={(e) => setRagMemoryConfig(prev => ({...prev, vectorDistanceThreshold: parseFloat(e.target.value) || 0}))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="include-conversation-context" 
                      checked={ragMemoryConfig.includeConversationContext} 
                      onCheckedChange={(checked) => setRagMemoryConfig(prev => ({...prev, includeConversationContext: checked}))} 
                    />
                    <Label htmlFor="include-conversation-context">Incluir Contexto da Conversa no RAG</Label>
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
                Gerencie as fontes de dados (documentos, websites, APIs) que o RAG utilizará.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* TODO: Implementar UI para gerenciar ragMemoryConfig.knowledgeSources */}
              <p>Lista de fontes de conhecimento e opções para adicionar/remover/configurar cada uma.</p>
              <Button><Plus className="mr-2 h-4 w-4" /> Adicionar Fonte</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
