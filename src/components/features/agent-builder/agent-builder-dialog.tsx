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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && configuringTool) { 
        setIsToolConfigModalOpen(false); 
        setConfiguringTool(null);
      } else if (!open) {
        setConfiguringTool(null); 
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
  <DialogHeader>
    <DialogTitle>Configurar Agente</DialogTitle>
  </DialogHeader>
        {isToolConfigModalOpen && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configuração de Ferramenta</DialogTitle>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => { setIsToolConfigModalOpen(false); setConfiguringTool(null);}}>Cancelar</Button>
              </DialogClose>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              {configuringTool && configuringTool.id === "webSearch" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="modalGoogleApiKey">Chave API Google Custom Search</Label>
                    <Input id="modalGoogleApiKey" value={modalGoogleApiKey} onChange={(e) => setModalGoogleApiKey(e.target.value)} placeholder="Cole sua chave API" type="password"/>
                    <p className="text-xs text-muted-foreground">Necessária para autenticar.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modalGoogleCseId">ID Mecanismo de Busca (CSE ID)</Label>
                    <Input id="modalGoogleCseId" value={modalGoogleCseId} onChange={(e) => setModalGoogleCseId(e.target.value)} placeholder="Cole seu CSE ID"/>
                    <p className="text-xs text-muted-foreground">Identifica seu mecanismo.</p>
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
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => { setIsToolConfigModalOpen(false); setConfiguringTool(null);}}>Cancelar</Button>
              </DialogClose>
              <Button onClick={handleSaveToolConfiguration} className="button-live-glow">Salvar Configuração</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default AgentBuilderDialog;
