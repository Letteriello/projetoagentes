import * as React from 'react';
import { useForm, FormProvider, useFormContext, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  UploadCloud,
  Wand2,
  Info,
  Settings,
  Check,
  PlusCircle,
  Trash2,
  Save,
  ListChecks,
  Plus,
  Search,
  FileText,
  FileJson,
  Binary,
  Share2,
  Users,
  Layers,
  ChevronsUpDown,
  Brain,
  Settings2,
  Loader2
} from 'lucide-react';

import GeneralTab from './tabs/general-tab';
import ToolsTab from './tabs/tools-tab';
import BehaviorTab from './tabs/behavior-tab';
import StateMemoryTab from './tabs/state-memory-tab';
import RagTab from './tabs/rag-tab';
import ArtifactsTab from './tabs/artifacts-tab';
import A2AConfig from './tabs/a2a-config';
import MultiAgentTab from './tabs/multi-agent-tab';
import ReviewTab from './tabs/review-tab';
import { SubAgentSelector } from './sub-agent-selector';

type AgentConfig = {
  agentName: string;
  description: string;
  agentTone: string;
  tools: Array<{ id: string; name: string; configured: boolean }>;
  statePersistence: {
    enabled: boolean;
    persistenceType: 'session' | 'local' | 'indexedDB';
    initialStateValues: string;
  };
  rag: {
    enabled: boolean;
    vectorStoreUrl: string;
    collectionName: string;
    queryParams: string;
  };
  artifacts: {
    storageType: 'local' | 'cloud';
    localStoragePath?: string;
    cloudStorageBucket?: string;
    definitions: string[];
  };
  a2a: {
    enabled: boolean;
    subAgentIds: string[];
  };
};

interface AgentBuilderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingAgent?: AgentConfig;
  onSave: (config: AgentConfig) => void;
  availableTools: Array<{ id: string; name: string; description: string }>;
  agentTypeOptions: string[];
  agentToneOptions: string[];
  iconComponents: Record<string, React.ComponentType>;
  availableAgentsForSubSelector: Array<{ id: string; agentName: string }>;
}

const AgentBuilderDialog: React.FC<AgentBuilderDialogProps> = ({
  isOpen,
  onOpenChange,
  editingAgent,
  onSave,
  availableTools,
  agentTypeOptions,
  agentToneOptions,
  iconComponents,
  availableAgentsForSubSelector,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [activeEditTab, setActiveEditTab] = React.useState('general');
  const [currentStep, setCurrentStep] = React.useState(0);
  const tabOrder = ['general', 'behavior', 'tools', 'memory_knowledge', 'artifacts', 'a2a', 'multi_agent_advanced', 'advanced', 'review'];

  const methods = useForm<AgentConfig>({
    defaultValues: editingAgent || {
      agentName: '',
      description: '',
      agentTone: 'professional',
      tools: [],
      config: {
        statePersistence: {
          enabled: false,
          persistenceType: 'session',
          initialStateValues: '{}'
        },
        rag: {
          enabled: false,
          vectorStoreUrl: '',
          collectionName: '',
          queryParams: '{}'
        },
        artifacts: {
          storageType: 'local',
          definitions: []
        },
        a2a: {
          enabled: false,
          subAgentIds: []
        }
      }
    },
    resolver: zodResolver(/* your zod schema */)
  });

  const handleSaveAgent = methods.handleSubmit((data) => {
    onSave(data);
  });

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Process the file
    }
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, tabOrder.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleExport = () => {
    // Handle export logic
  };

  const handleToolConfigure = (toolId: string) => {
    // Handle tool configuration
  };

  const getTabStatusIcon = (tab: string) => {
    // Return appropriate icon based on tab status
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange as (open: boolean) => void}>
      <DialogContent className="max-w-4xl p-0">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSaveAgent)}>
            <DialogHeader className="p-6 pb-4 border-b">
              <DialogTitle>{editingAgent ? "Editar Agente IA" : "Criar Novo Agente IA"}</DialogTitle>
              <DialogDescription>
                {editingAgent ? `Modifique as configurações do agente "${editingAgent.agentName}".` : "Configure um novo agente inteligente para suas tarefas."}
              </DialogDescription>
              <input
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={handleFileImport}
                ref={fileInputRef}
              />
              <Button variant="outline" size="sm" type="button" onClick={() => fileInputRef.current?.click()} className="mt-2 ml-auto"> {/* Added ml-auto to push to right */}
                <UploadCloud className="mr-2 h-4 w-4" /> {/* Or FileInput icon */}
                Importar Configuração
              </Button>
            </DialogHeader>
            <div className="p-6"> {/* This div will contain Tabs and its content, allowing padding */}
              <Tabs
                value={editingAgent === undefined ? tabOrder[currentStep] : activeEditTab}
                // defaultValue="general" // defaultValue might conflict with controlled value
                onValueChange={(value) => {
                  if (editingAgent === undefined) {
                    // In wizard mode, tab navigation is controlled by currentStep and Next/Previous buttons.
                    // Direct tab clicking is disabled by the 'disabled' prop on TabsTrigger.
                  } else {
                    // Edit mode: update activeEditTab when a tab is clicked.
                    setActiveEditTab(value);
                  }
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-9 mb-6"> {/* Adjusted for 9 tabs */}
                  {/* Updated TabsTrigger props */}
                  {tabOrder.map((tab, index) => (
                    <TabsTrigger
                      key={tab}
                      value={tab}
                      disabled={editingAgent === undefined && index > currentStep && tab !== "review"} // Keep review tab accessible if others are disabled
                      // onClick is not needed here as onValueChange on Tabs handles it.
                      // However, if you need specific logic per trigger click beyond what onValueChange provides:
                      // onClick={() => {
                      //   if (editingAgent !== undefined) {
                      //     setActiveEditTab(tab);
                      //   } else {
                      //     // Wizard mode logic if needed, though disabled prop should prevent most clicks
                      //     if (index <= currentStep) {
                      //       // Potentially allow jumping back in wizard
                      //       // setCurrentStep(index); // This would make tabs navigable in wizard
                      //     }
                      //   }
                      // }}
                      statusIcon={getTabStatusIcon(tab)}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/_/g, " ")} {/* Format tab name */}
                    </TabsTrigger>
                  ))}
                  {/* Original TabsTriggers are replaced by the map above */}
                  {/* <TabsTrigger value="general" statusIcon={getTabStatusIcon("general")} disabled={editingAgent === undefined}>Geral</TabsTrigger>
                  <TabsTrigger value="behavior" statusIcon={getTabStatusIcon("behavior")} disabled={editingAgent === undefined}>Comportamento</TabsTrigger>
                  <TabsTrigger value="tools" statusIcon={getTabStatusIcon("tools")} disabled={editingAgent === undefined}>Ferramentas</TabsTrigger>
                  <TabsTrigger value="memory_knowledge" statusIcon={getTabStatusIcon("memory_knowledge")} disabled={editingAgent === undefined}>Memória & Conhecimento</TabsTrigger>
                  <TabsTrigger value="artifacts" statusIcon={getTabStatusIcon("artifacts")} disabled={editingAgent === undefined}>Artefatos</TabsTrigger>
                  <TabsTrigger value="a2a" statusIcon={getTabStatusIcon("a2a")} disabled={editingAgent === undefined}>Comunicação A2A</TabsTrigger>
                  <TabsTrigger value="multi_agent_advanced" statusIcon={getTabStatusIcon("multi_agent_advanced")} disabled={editingAgent === undefined}>Multi-Agente</TabsTrigger>
                  <TabsTrigger value="advanced" statusIcon={getTabStatusIcon("advanced")} disabled={editingAgent === undefined}>Avançado</TabsTrigger>
                  <TabsTrigger value="review" statusIcon={getTabStatusIcon("review")} disabled={editingAgent === undefined}>Revisar</TabsTrigger> */}
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general">
                  <GeneralTab
                    agentTypeOptions={agentTypeOptions}
                    agentFrameworkOptions={agentFrameworkOptions}
                    availableTools={availableTools} // For AI suggestions
                    SparklesIcon={Wand2}
                    // agentToneOptions might still be needed if it populates a selector in GeneralTab directly.
                    // If agentPersonality is a selector in GeneralTab, pass agentToneOptions.
                    // Otherwise, if it's handled in BehaviorTab, it's not needed here.
                    // For now, assuming it's NOT for GeneralTab directly, but for BehaviorTab later.
                  />
                </TabsContent>

                {/* Tools Tab */}
                <TabsContent value="tools">
                  <ToolsTab
                    availableTools={availableTools}
                    selectedTools={methods.watch("tools") || []} // RHF state
                    setSelectedTools={(tools) => methods.setValue("tools", tools, {shouldValidate: true, shouldDirty: true})} // RHF action
                    toolConfigurations={methods.watch("toolConfigsApplied") || {}} // RHF state
                    onToolConfigure={handleToolConfigure} // Still uses local modal state management for now
                    iconComponents={iconComponents}
                    InfoIcon={Info}
                    SettingsIcon={Settings}
                    CheckIcon={Check}
                    PlusCircleIcon={PlusCircle}
                    Trash2Icon={Trash2}
                  />
                </TabsContent>

                {/* Behavior Tab - Now uses RHF context */}
                <TabsContent value="behavior">
                  <BehaviorTab
                    agentToneOptions={agentToneOptions} // Pass only necessary static options
                  />
                </TabsContent>

                {/* Memory & Knowledge Tab */}
                <TabsContent value="memory_knowledge" className="space-y-6 mt-4">
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertTitle>Memória & Conhecimento</AlertTitle>
                    <AlertDescription>
                      Configure a persistência de estado do agente e a capacidade de usar RAG (Retrieval Augmented Generation) para acesso a conhecimento externo.
                    </AlertDescription>
                  </Alert>
                  <StateMemoryTab
                    // Props will be replaced by useFormContext in StateMemoryTab
                    enableStatePersistence={methods.watch("config.statePersistence.enabled") || false}
                    setEnableStatePersistence={(val) => methods.setValue("config.statePersistence.enabled", val)}
                    statePersistenceType={methods.watch("config.statePersistence.persistenceType") || "session"}
                    setStatePersistenceType={(val) => methods.setValue("config.statePersistence.persistenceType", val as 'session' | 'local' | 'indexedDB')}
                    initialStateValues={methods.watch("config.statePersistence.initialStateValues") || []}
                    setInitialStateValues={(val) => methods.setValue("config.statePersistence.initialStateValues", val)}
                    SaveIcon={Save}
                    ListChecksIcon={ListChecks}
                    PlusIcon={Plus}
                    Trash2Icon={Trash2}
                    InfoIcon={Info}
                  />
                  <Separator className="my-6" />
                  <RagTab
                    // Props will be replaced by useFormContext in RagTab
                    enableRAG={methods.watch("config.rag.enabled") || false}
                    setEnableRAG={(val) => methods.setValue("config.rag.enabled", val)}
                    ragMemoryConfig={methods.watch("config.rag") as { enabled: boolean; vectorStoreUrl: string; collectionName: string; queryParams: string } || methods.defaultValues?.config?.rag!}
                    setRagMemoryConfig={(config) => methods.setValue("config.rag", config)}
                    SearchIcon={Search}
                    UploadCloudIcon={UploadCloud}
                    FileTextIcon={FileText}
                    PlusIcon={Plus}
                    Trash2Icon={Trash2}
                    InfoIcon={Info}
                  />
                </TabsContent>

                {/* Artifacts Tab */}
                <TabsContent value="artifacts">
                  <ArtifactsTab
                    // Props will be replaced by useFormContext in ArtifactsTab
                    enableArtifacts={methods.watch("config.artifacts.enabled") || false}
                    setEnableArtifacts={(val) => methods.setValue("config.artifacts.enabled", val)}
                    artifactStorageType={methods.watch("config.artifacts.storageType") || "memory"}
                    setArtifactStorageType={(val) => methods.setValue("config.artifacts.storageType", val as 'local' | 'cloud')}
                    artifacts={methods.watch("config.artifacts.definitions") || []}
                    setArtifacts={(val) => methods.setValue("config.artifacts.definitions", val)}
                    cloudStorageBucket={methods.watch("config.artifacts.cloudStorageBucket") || ""}
                    setCloudStorageBucket={(val) => methods.setValue("config.artifacts.cloudStorageBucket", val)}
                    localStoragePath={methods.watch("config.artifacts.localStoragePath") || ""}
                    setLocalStoragePath={(val) => methods.setValue("config.artifacts.localStoragePath", val)}
                    FileJsonIcon={FileJson}
                    UploadCloudIcon={UploadCloud}
                    BinaryIcon={Binary}
                    PlusIcon={Plus}
                    Trash2Icon={Trash2}
                    InfoIcon={Info}
                  />
                </TabsContent>

                {/* A2A Communication Tab */}
                <TabsContent value="a2a" className="space-y-6 mt-4">
                  <Alert>
                    <Share2 className="h-4 w-4" />
                    <AlertTitle>Comunicação Agente-Agente (A2A)</AlertTitle>
                    <AlertDescription>
                      Configure como este agente se comunica com outros agentes no sistema, incluindo canais e protocolos.
                    </AlertDescription>
                  </Alert>
                  <Card>
                    <CardHeader>
                      {/* Title and Description are now part of A2AConfigComponent */}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* The A2AConfigComponent will have its own internal switch for enabling/disabling */}
                      {/* It will use useFormContext to manage config.a2a directly */}
                      <A2AConfig savedAgents={availableAgentsForSubSelector} />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Multi-Agent & Advanced Tab */}
                <TabsContent value="multi_agent_advanced" className="space-y-6 mt-4">
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertTitle>Multi-Agente & Configurações Avançadas</AlertTitle>
                    <AlertDescription>
                      Defina o papel deste agente em uma colaboração (raiz ou sub-agente), configure sub-agentes e outras configurações avançadas do sistema.
                    </AlertDescription>
                  </Alert>
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Hierarquia e Colaboração Multi-Agente</CardTitle>
                      <CardDescription>
                        Defina o papel do agente (raiz ou sub-agente) e gerencie seus colaboradores.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <MultiAgentTab
                        // Props will be replaced by useFormContext in MultiAgentTab
                        isRootAgent={methods.watch("config.a2a.enabled") || false}
                        setIsRootAgent={(val) => methods.setValue("config.a2a.enabled", val)}
                        subAgentIds={methods.watch("config.a2a.subAgentIds") || []}
                        setSubAgentIds={(val) => methods.setValue("config.a2a.subAgentIds", val)}
                        availableAgentsForSubSelector={availableAgentsForSubSelector}
                        SubAgentSelectorComponent={SubAgentSelector} // Keep passing component
                        UsersIcon={Users}
                        LayersIcon={Layers}
                        InfoIcon={Info}
                        ChevronsUpDownIcon={ChevronsUpDown}
                        PlusCircleIcon={PlusCircle}
                        Trash2Icon={Trash2}
                      />
                      <div className="space-y-2 pt-4">
                        <TooltipProvider>
                          {/* ... Tooltip for global instruction ... */}
                        </TooltipProvider>
                        <Controller
                          name="config.globalInstruction"
                          control={methods.control}
                          render={({ field }) => (
                            <Textarea
                              id="globalSubAgentInstructionRHF"
                              placeholder="Ex: 'Você é um assistente especialista...'"
                              value={field.value || ""}
                              onChange={field.onChange}
                              rows={3}
                            />
                          )}
                        />
                        <p className="text-xs text-muted-foreground">
                          Uma diretiva geral que se aplica a todos os sub-agentes orquestrados por este agente.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-muted-foreground/70">Outras Configurações Avançadas (Não Multi-Agente)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Configurações adicionais...
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Review Tab */}
                <TabsContent value="review">
                  <ReviewTab setActiveEditTab={setActiveEditTab} />
                </TabsContent>

                {/* Advanced Tab (ADK Callbacks) */}
                <TabsContent value="advanced" className="space-y-6 mt-4">
                  <Alert>
                    <Settings2 className="h-4 w-4" />
                    <AlertTitle>Configurações Avançadas</AlertTitle>
                    <AlertDescription>
                      Configure callbacks do ciclo de vida do agente ADK e outras opções avançadas.
                    </AlertDescription>
                  </Alert>
                  <Card>
                    <CardHeader>
                      <CardTitle>Callbacks do Ciclo de Vida ADK</CardTitle>
                      <CardDescription>
                        Especifique nomes de fluxos Genkit ou referências de funções para serem invocadas em pontos chave do ciclo de vida do agente.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { name: "beforeAgent", label: "Callback Before Agent", description: "Invocado antes do agente principal processar a requisição. Útil para configuração, validação inicial ou **verificação de conformidade de segurança da requisição de entrada**." },
                        { name: "afterAgent", label: "Callback After Agent", description: "Invocado após o agente principal concluir. Útil para formatação final, limpeza ou **registro de auditoria seguro da transação completa**." },
                        { name: "beforeModel", label: "Callback Before Model", description: "Invocado antes de uma chamada ao LLM. Permite modificar o prompt ou configurações do modelo, **adicionar contexto de segurança ou verificar o prompt contra políticas de uso aceitável**." },
                        { name: "afterModel", label: "Callback After Model", description: "Invocado após o LLM retornar uma resposta. Permite modificar ou validar a saída do LLM, **verificar conformidade com políticas de conteúdo ou remover informações sensíveis antes de serem usadas por uma ferramenta ou retornadas ao usuário**." },
                        { name: "beforeTool", label: "Callback Before Tool", description: "Invocado antes da execução de uma ferramenta. Permite inspecionar/modificar argumentos, **validar permissões ou cancelar a execução por razões de segurança (ex: usando um fluxo Genkit de validação)**." },
                        { name: "afterTool", label: "Callback After Tool", description: "Invocado após uma ferramenta ser executada. Permite inspecionar/modificar o resultado da ferramenta ou **realizar verificações de segurança nos dados retornados pela ferramenta antes de serem usados em etapas subsequentes**." },
                      ].map(callback => (
                        <div key={callback.name} className="space-y-1">
                          <Label htmlFor={`config.adkCallbacks.${callback.name}`}>{callback.label}</Label>
                          <Controller
                            name={`config.adkCallbacks.${callback.name}` as const}
                            control={methods.control}
                            render={({ field }) => (
                              <Input
                                {...field}
                                id={`config.adkCallbacks.${callback.name}`}
                                placeholder="Nome do fluxo Genkit ou ref da função"
                                value={field.value || ""}
                              />
                            )}
                          />
                          <p className="text-xs text-muted-foreground">{callback.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

              </Tabs>
            </div>

            <DialogFooter className="p-6 pt-4 border-t">
              {editingAgent === undefined ? (
                // New agent wizard flow
                <div className="flex justify-between w-full">
                  <Button variant="outline" type="button" onClick={() => { onOpenChange(false); setCurrentStep(0); }}>Cancelar</Button>
                  <div className="flex gap-2">
                    <Button type="button" onClick={handlePrevious} disabled={currentStep === 0}>
                      Anterior
                    </Button>
                    {/* Show "Next" if not the step before "review" and not the last step overall */}
                    {currentStep < tabOrder.length - 1 && tabOrder[currentStep + 1] !== "review" && (
                      <Button type="button" onClick={handleNext}>
                        Próximo
                      </Button>
                    )}
                    {/* Show "Revisar" if the next step is "review" */}
                    {currentStep < tabOrder.length - 1 && tabOrder[currentStep + 1] === "review" && (
                      <Button type="button" onClick={handleNext}>
                        Revisar
                      </Button>
                    )}
                    {/* Show "Salvar Agente" only on the "review" tab */}
                    {tabOrder[currentStep] === "review" && (
                      <Button type="submit" disabled={!methods.formState.isValid || methods.formState.isSubmitting}>
                        {methods.formState.isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Salvar Agente
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                // Editing existing agent
                <>
                  <Button variant="outline" type="button" onClick={handleExport} className="mr-auto"> {/* Added mr-auto to push to left */}
                    <Share2 className="mr-2 h-4 w-4" /> {/* Or DownloadCloud icon */}
                    Exportar Configuração
                  </Button>
                  <DialogClose asChild>
                    <Button variant="outline" type="button">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" disabled={!methods.formState.isValid || methods.formState.isSubmitting}>
                    {methods.formState.isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar Agente
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default AgentBuilderDialog;
