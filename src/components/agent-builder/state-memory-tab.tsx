"use client";

import * as React from "react";
import { Database, Plus, Info, Trash2, HardDrive, Brain } from "lucide-react";
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

// Tipos de persistência de estado
type StatePersistenceType = 'session' | 'memory' | 'database';

// Interface para um par chave-valor do estado inicial
interface InitialStateKeyValue {
  key: string;
  value: string;
  scope: 'global' | 'agent' | 'temporary';
  description: string;
}

interface StateMemoryTabProps {
  // Propriedades de controle de estado
  enableStatePersistence: boolean;
  setEnableStatePersistence: (value: boolean) => void;
  statePersistenceType: StatePersistenceType;
  setStatePersistenceType: (value: StatePersistenceType) => void;
  initialStateValues: InitialStateKeyValue[];
  setInitialStateValues: (values: InitialStateKeyValue[]) => void;
  
  // Propriedades de compartilhamento de estado (multi-agente)
  enableStateSharing: boolean;
  setEnableStateSharing: (value: boolean) => void;
  stateSharingStrategy: 'all' | 'explicit' | 'none';
  setStateSharingStrategy: (value: 'all' | 'explicit' | 'none') => void;
  
  // Propriedades para suporte a RAG (futura expansão)
  enableRAG: boolean;
  setEnableRAG: (value: boolean) => void;
}

export function StateMemoryTab({
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
}: StateMemoryTabProps) {
  const [newStateKey, setNewStateKey] = React.useState("");
  const [newStateValue, setNewStateValue] = React.useState("");
  const [newStateScope, setNewStateScope] = React.useState<'global' | 'agent' | 'temporary'>('agent');
  const [newStateDescription, setNewStateDescription] = React.useState("");

  // Adicionar um novo par chave-valor ao estado inicial
  const handleAddInitialState = () => {
    if (!newStateKey.trim()) return;
    
    const newEntry: InitialStateKeyValue = {
      key: newStateKey.trim(),
      value: newStateValue.trim(),
      scope: newStateScope,
      description: newStateDescription.trim()
    };
    
    setInitialStateValues([...initialStateValues, newEntry]);
    
    // Limpar os campos
    setNewStateKey("");
    setNewStateValue("");
    setNewStateDescription("");
  };

  // Remover um par chave-valor do estado inicial
  const handleRemoveInitialState = (index: number) => {
    const newValues = [...initialStateValues];
    newValues.splice(index, 1);
    setInitialStateValues(newValues);
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
        <Database className="w-5 h-5 text-primary/80" /> Gerenciamento de Estado e Memória
      </h3>
      
      <Alert variant="default" className="mb-4 bg-card border-border/70">
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <AlertTitle className="text-sm font-medium">Estado e Persistência</AlertTitle>
        <AlertDescription className="text-xs">
          Configure como o agente gerencia o estado da sessão, incluindo valores iniciais, persistência 
          e compartilhamento entre agentes. O estado permite que o agente lembre informações entre interações.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {/* Seção de Persistência de Estado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive size={16} className="text-primary/80" />
              Persistência de Estado
            </CardTitle>
            <CardDescription>
              Configure como o estado do agente será persistido entre sessões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Switch 
                id="enable-persistence" 
                checked={enableStatePersistence} 
                onCheckedChange={setEnableStatePersistence}
              />
              <Label htmlFor="enable-persistence" className="flex items-center gap-1">
                Habilitar persistência de estado
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground">
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Quando habilitado, o estado do agente será persistido entre sessões, permitindo que ele lembre informações mesmo após reiniciar.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>
            
            {enableStatePersistence && (
              <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                <Label htmlFor="persistence-type" className="text-left">Tipo de Persistência</Label>
                <Select 
                  value={statePersistenceType} 
                  onValueChange={(value: StatePersistenceType) => setStatePersistenceType(value)}
                >
                  <SelectTrigger id="persistence-type" className="h-9">
                    <SelectValue placeholder="Selecione o tipo de persistência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="memory">Em Memória (apenas durante execução)</SelectItem>
                    <SelectItem value="session">Sessão (por usuário)</SelectItem>
                    <SelectItem value="database">Banco de Dados (persistente)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção de Estado Inicial */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database size={16} className="text-primary/80" />
              Estado Inicial
            </CardTitle>
            <CardDescription>
              Defina valores iniciais de estado que serão disponibilizados para o agente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {initialStateValues.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Chave</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="w-[100px]">Escopo</TableHead>
                      <TableHead className="w-[80px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {initialStateValues.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>{entry.key}</TableCell>
                        <TableCell>{entry.value}</TableCell>
                        <TableCell>
                          <Badge variant={
                            entry.scope === 'global' ? "secondary" : 
                            entry.scope === 'agent' ? "outline" : 
                            "default"
                          }>
                            {entry.scope === 'global' ? "Global" : 
                            entry.scope === 'agent' ? "Agente" : 
                            "Temporário"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveInitialState(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Remover</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="grid grid-cols-[1fr_1fr_120px] gap-2 mb-2">
                <div className="space-y-1">
                  <Label htmlFor="state-key" className="text-xs">Chave</Label>
                  <Input 
                    id="state-key" 
                    value={newStateKey} 
                    onChange={(e) => setNewStateKey(e.target.value)} 
                    placeholder="ex: user_preference"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state-value" className="text-xs">Valor</Label>
                  <Input 
                    id="state-value" 
                    value={newStateValue} 
                    onChange={(e) => setNewStateValue(e.target.value)} 
                    placeholder="ex: dark_mode"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="state-scope" className="text-xs">Escopo</Label>
                  <Select 
                    value={newStateScope} 
                    onValueChange={(value: 'global' | 'agent' | 'temporary') => setNewStateScope(value)}
                  >
                    <SelectTrigger id="state-scope" className="h-9">
                      <SelectValue placeholder="Escopo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="agent">Agente</SelectItem>
                      <SelectItem value="temporary">Temporário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="state-description" className="text-xs">Descrição (opcional)</Label>
                <Textarea 
                  id="state-description" 
                  value={newStateDescription} 
                  onChange={(e) => setNewStateDescription(e.target.value)} 
                  placeholder="Descrição opcional para este valor de estado"
                  className="h-16 resize-none"
                />
              </div>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={handleAddInitialState}
                disabled={!newStateKey.trim()}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Valor de Estado
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Seção de Compartilhamento de Estado (Multi-Agente) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain size={16} className="text-primary/80" />
              Compartilhamento de Estado (Multi-Agente)
            </CardTitle>
            <CardDescription>
              Configure como o estado será compartilhado em sistemas multi-agente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Switch 
                id="enable-sharing" 
                checked={enableStateSharing} 
                onCheckedChange={setEnableStateSharing}
              />
              <Label htmlFor="enable-sharing" className="flex items-center gap-1">
                Habilitar compartilhamento de estado entre agentes
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground">
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Quando habilitado, permite que sub-agentes em um sistema multi-agente acessem e modifiquem o estado compartilhado.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>
            
            {enableStateSharing && (
              <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                <Label htmlFor="sharing-strategy" className="text-left">Estratégia de Compartilhamento</Label>
                <Select 
                  value={stateSharingStrategy} 
                  onValueChange={(value: 'all' | 'explicit' | 'none') => setStateSharingStrategy(value)}
                >
                  <SelectTrigger id="sharing-strategy" className="h-9">
                    <SelectValue placeholder="Selecione a estratégia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Compartilhar Tudo (acesso total)</SelectItem>
                    <SelectItem value="explicit">Apenas Valores Explícitos (prefixo "shared:")</SelectItem>
                    <SelectItem value="none">Sem Compartilhamento (isolado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção de RAG (Expandir no futuro) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain size={16} className="text-primary/80" />
              Retrieval-Augmented Generation (RAG)
            </CardTitle>
            <CardDescription>
              Configuração básica para habilitar suporte a RAG (será expandido no futuro)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Switch 
                id="enable-rag" 
                checked={enableRAG} 
                onCheckedChange={setEnableRAG}
              />
              <Label htmlFor="enable-rag" className="flex items-center gap-1">
                Habilitar suporte a RAG
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground">
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Habilitar suporte para Retrieval-Augmented Generation (RAG), permitindo que o agente acesse e utilize conhecimento externo.</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>
            
            {enableRAG && (
              <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/20">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-sm text-amber-800 dark:text-amber-300">Funcionalidade em Desenvolvimento</AlertTitle>
                <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
                  A configuração completa de RAG será implementada em uma atualização futura. Por enquanto, apenas sinaliza que o agente utilizará RAG.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}