import * as React from 'react';
import { useFormContext, Controller, FormField } from 'react-hook-form'; // Added FormField
import { z } from 'zod';
import { getAiConfigurationSuggestionsAction } from '@/app/agent-builder/actions';
import { llmModels } from '@/data/llm-models'; // Import llmModels
import type { LLMModelDetails } from '@/types/agent-configs-new'; // Import LLMModelDetails for type safety
// Importação de tipos removida para evitar duplicação
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Wand2 as SparklesIcon, CheckCircle2, Settings, Check, PlusCircle, Trash2, AlertTriangle, Cpu, Edit3 } from "lucide-react";

// Definindo aliases para os ícones para evitar conflitos
const PlusCircleIcon = PlusCircle;
const Trash2Icon = Trash2;
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { SavedAgentConfiguration } from '@/types/agent-configs-fixed';
import type { AvailableTool } from '@/types/tool-types';
import CustomToolDialog, { CustomToolData } from '../custom-tool-dialog'; 
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Label } from '@/components/ui/label'; // Keep for direct use if any
import { Switch } from '@/components/ui/switch';
import { FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"; // Import Form components for forceToolUsage

// Assuming InfoIcon is a standard component, if it's conflicting, it might need aliasing or checking usage.
// For now, assuming InfoIconComponent prop handles the specific InfoIcon from props.
import ToolConfigModal from '../ToolConfigModal'; // Added import
import type { ToolConfigData } from '@/types/agent-types'; // Added import
import { ApiKeyEntry } from '../../../../services/api-key-service';

interface ToolsTabProps {
  availableTools: AvailableTool[];
  availableApiKeys: ApiKeyEntry[]; // NEW
  // Props for icons and help modal, passed from AgentBuilderDialog
  iconComponents: Record<string, React.ComponentType<{ className?: string }>>;
  InfoIconComponent: React.ElementType; // Renamed to avoid conflict with local InfoIcon
  SettingsIcon: React.ElementType;
  CheckIcon: React.ElementType;
  PlusCircleIcon: React.ElementType;
  Trash2Icon: React.ElementType;
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
  // onToolConfigure: (toolId: string) => void; // REMOVED: Function to open configuration modal for a tool
}

// Definindo o tipo para o contexto do formulário
// Using SavedAgentConfiguration directly with useFormContext as it's the root form type
// type FormContextType = {
//   tools?: string[];
//   toolConfigsApplied?: Record<string, ToolConfigData>; // Changed 'any' to 'ToolConfigData'
//   chatHistory?: Array<{role: string; content: string}>;
//   userInput?: string;
//   [key: string]: any;
// };

// Definindo o tipo para as ferramentas sugeridas
type SuggestedToolType = {
  id: string;
  name: string;
  description: string;
};

export default function ToolsTab({
  availableTools,
  availableApiKeys, // NEW
  iconComponents,
  InfoIconComponent,
  SettingsIcon,
  CheckIcon,
  showHelpModal,
  // onToolConfigure, // REMOVED
}: ToolsTabProps) {
  const { control, watch, setValue, getValues } = useFormContext<SavedAgentConfiguration>(); // Changed FormContextType to SavedAgentConfiguration
  const { toast } = useToast();
  const currentSelectedTools = watch('tools') || [];
  const agentModelId = watch('config.agentModel'); // Watch the agentModel ID
  const toolConfigsApplied = watch('toolConfigsApplied') || {} as Record<string, ToolConfigData>; // Ensure type

  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [isToolConfigModalOpen, setIsToolConfigModalOpen] = React.useState(false); // Added state
  const [configuringTool, setConfiguringTool] = React.useState<AvailableTool | null>(null); // Added state
  const [aiSuggestedTools, setAiSuggestedTools] = React.useState<SuggestedToolType[]>([]);
  const [isSuggestionsDialogOpen, setIsSuggestionsDialogOpen] = React.useState(false);
  const [isCustomToolDialogOpen, setIsCustomToolDialogOpen] = React.useState(false);
  const [editingCustomToolData, setEditingCustomToolData] = React.useState<CustomToolData | undefined>(undefined);
  const [toolToDelete, setToolToDelete] = React.useState<string | null>(null); // For delete confirmation

  // Usando o tipo definido acima

  const fetchToolSuggestions = async () => {
    setIsLoadingSuggestions(true);
    // const currentConfig = getValues(); // Get the complete current agent configuration
    // For suggestions, we might only need high-level goals or descriptions, not the whole config.
    // For now, let's assume getValues() is okay, but this could be refined.
    const agentGoal = getValues('config.agentGoal'); // Example of specific field
    const agentDescription = getValues('agentDescription'); // Example of specific field

    try {
      const result = await getAiConfigurationSuggestionsAction(
        { agentGoal, agentDescription, currentTools: currentSelectedTools } as any, // Pass relevant info
        "tools"
      ); 
      
      if (result.success && result.suggestions && Array.isArray(result.suggestions) && result.suggestions.length > 0) {
        const suggestedTools: SuggestedToolType[] = result.suggestions.map((tool: any) => ({
          id: tool.id || '',
          name: tool.name || 'Ferramenta sem nome',
          description: tool.description || 'Sem descrição disponível'
        }));
        
        setAiSuggestedTools(suggestedTools);
        setIsSuggestionsDialogOpen(true);
        toast({ title: "Sugestões de Ferramentas Carregadas" });
      } else if (result.success) {
           setAiSuggestedTools([] as SuggestedToolType[]);
           setIsSuggestionsDialogOpen(true); 
           toast({ title: "Nenhuma nova sugestão de ferramenta encontrada.", description: "Seu conjunto de ferramentas atual parece adequado." });
      } else {
        toast({ title: "Falha ao Carregar Sugestões de Ferramentas", description: result.error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro ao Buscar Sugestões", description: e.message, variant: "destructive" });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleToolSelectionChange = (toolId: string, isSelected: boolean) => {
    const currentToolIds = getValues('tools') || [];
    let newToolIds: string[];
    if (isSelected) {
      if (!currentToolIds.includes(toolId)) {
        newToolIds = [...currentToolIds, toolId];
      } else {
        newToolIds = currentToolIds;
      }
    } else {
      newToolIds = currentToolIds.filter(id => id !== toolId);
      // Optionally remove configuration when a tool is deselected
      const currentConfigs = getValues('toolConfigsApplied') || {};
      if (currentConfigs[toolId]) {
        const { [toolId]: _, ...remainingConfigs } = currentConfigs;
        setValue('toolConfigsApplied', remainingConfigs);
      }
    }
    setValue('tools', newToolIds, { shouldDirty: true, shouldValidate: true });
  };

  const handleSaveCustomTool = (data: CustomToolData, toolId?: string) => {
    const currentConfigs = getValues('toolConfigsApplied') || {};
    const currentTools = getValues('tools') || [];

    if (toolId) { // Editing existing tool
      setValue('toolConfigsApplied', {
        ...currentConfigs,
        [toolId]: {
          name: data.name, // Ensure name/description are part of stored config for custom tools
          description: data.description,
          inputSchema: data.inputSchema,
          outputSchema: data.outputSchema,
        }
      }, { shouldDirty: true, shouldValidate: true });

      // If the name (which is used as label) changed, the UI might need an update.
      // This is tricky if availableTools is a prop. For now, we assume the ID remains the primary key.
      // The label in the UI for this tool might become stale if not refreshed from a source that sees this update.
      // However, `availableTools` prop is typically static definitions. Custom tool display names
      // might need to be sourced from `toolConfigsApplied[toolId].name` if they are to be dynamic.

      toast({
        title: "Ferramenta Customizada Atualizada",
        description: `A ferramenta "${data.name}" foi atualizada.`,
      });
    } else { // Creating new tool
      const newToolId = `custom_${uuidv4()}`;
      // Create a minimal AvailableTool object for the form context.
      // The full AvailableTool object might be managed elsewhere if needed.
      // For the purpose of selection and configuration, this is what's needed in form context.
      setValue('tools', [...currentTools, newToolId], { shouldDirty: true, shouldValidate: true });
      setValue('toolConfigsApplied', {
        ...currentConfigs,
        [newToolId]: {
          name: data.name,
          description: data.description,
          inputSchema: data.inputSchema,
          outputSchema: data.outputSchema,
        }
      }, { shouldDirty: true, shouldValidate: true });

      toast({
        title: "Ferramenta Customizada Criada",
        description: `A ferramenta "${data.name}" foi adicionada e selecionada.`,
      });
    }
    setIsCustomToolDialogOpen(false);
    setEditingCustomToolData(undefined);
  };
  
  const handleDeleteCustomTool = (toolId: string) => {
    const currentSelected = getValues('tools') || [];
    setValue('tools', currentSelected.filter(id => id !== toolId), { shouldDirty: true, shouldValidate: true });

    const currentConfigs = getValues('toolConfigsApplied') || {};
    const { [toolId]: _, ...remainingConfigs } = currentConfigs;
    setValue('toolConfigsApplied', remainingConfigs, { shouldDirty: true, shouldValidate: true });

    toast({
      title: "Ferramenta Customizada Excluída",
      description: "A ferramenta foi removida da sua configuração.",
    });
    setToolToDelete(null);
  };

  const getToolIcon = (tool: AvailableTool) => {
    // For custom tools, if icon is not set, use a default like SettingsIcon or Cpu
    if (tool.type === 'custom' && !tool.icon) {
      const CustomIcon = SettingsIcon || Settings; // Fallback to direct import if prop not there
      return <CustomIcon className="w-5 h-5 mr-3 text-muted-foreground" />;
    }
    
    // Handle both string and LucideIcon cases
    const iconKey = typeof tool.icon === 'string' ? tool.icon : tool.id;
    const IconComponent = iconComponents[iconKey] || iconComponents.default || Settings;
    return <IconComponent className="w-5 h-5 mr-3 text-muted-foreground" />;
  };

  const handleSaveToolConfiguration = (toolId: string, configData: ToolConfigData) => {
    const currentConfigs = getValues('toolConfigsApplied') || {};
    setValue('toolConfigsApplied', { ...currentConfigs, [toolId]: configData }, { shouldDirty: true, shouldValidate: true });
    setIsToolConfigModalOpen(false);
    setConfiguringTool(null);
    const toolName = availableTools.find(t => t.id === toolId)?.name || toolId;
    toast({ title: "Configuração da Ferramenta Salva", description: `Configuração salva para ${toolName}.` });
  };

  return (
    <div className="space-y-6">
      {/* Alert for models that don't support tools */}
      {(() => {
        if (agentModelId) {
          const selectedModel = llmModels.find(model => model.id === agentModelId);
          if (selectedModel && selectedModel.capabilities?.tools === false) {
            return (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Model Tool Capability</AlertTitle>
                <AlertDescription>
                  The selected model ({selectedModel.name}) may not fully support tools or function calling.
                  Tool configurations might not have the intended effect or work as expected.
                </AlertDescription>
              </Alert>
            );
          }
        }
        return null;
      })()}

      {configuringTool && (
        <ToolConfigModal
          isOpen={isToolConfigModalOpen}
          onOpenChange={setIsToolConfigModalOpen}
          tool={configuringTool}
          // Assuming allTools might be needed if the modal needs to reference other tool definitions
          // For now, passing only the specific tool. If modal needs more, this can be adjusted.
          // allTools={availableTools}
          onSave={(configData) => handleSaveToolConfiguration(configuringTool.id, configData)}
          existingConfig={toolConfigsApplied[configuringTool.id]}
          availableApiKeys={availableApiKeys} // Pass availableApiKeys
        />
      )}
      <CustomToolDialog
        isOpen={isCustomToolDialogOpen}
        onOpenChange={(open) => {
          setIsCustomToolDialogOpen(open);
          if (!open) setEditingCustomToolData(undefined); // Clear editing data when dialog closes
        }}
        onSave={handleSaveCustomTool}
        initialData={editingCustomToolData}
        availableApiKeys={availableApiKeys} // Pass availableApiKeys
      />
      <AlertDialog open={!!toolToDelete} onOpenChange={() => setToolToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ferramenta customizada? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setToolToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toolToDelete && handleDeleteCustomTool(toolToDelete)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isSuggestionsDialogOpen} onOpenChange={setIsSuggestionsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Sugestões de Ferramentas por IA</DialogTitle>
            <DialogDescription>
              Com base na configuração atual do seu agente, estas ferramentas podem ser úteis.
            </DialogDescription>
          </DialogHeader>
          {isLoadingSuggestions ? (
            <div className="flex justify-center items-center h-32"> {/* Increased height for loader */}
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : aiSuggestedTools.length > 0 ? (
            <ScrollArea className="max-h-[300px] p-1">
              <div className="space-y-3 pr-2">
                {aiSuggestedTools.map((tool) => {
                  const isAlreadySelected = currentSelectedTools.includes(tool.id);
                  return (
                    <div key={tool.id} className="p-3 border rounded-md flex items-center justify-between hover:bg-muted/50">
                      <div>
                        <h4 className="font-semibold">{tool.name}</h4>
                        <p className="text-xs text-muted-foreground break-words">{tool.description}</p> {/* Added break-words */}
                      </div>
                      <Button
                        size="sm"
                        variant={isAlreadySelected ? "ghost" : "default"}
                        onClick={() => {
                          if (!isAlreadySelected) {
                            // Use setValue from useFormContext to update the 'tools' array
                            setValue("tools", [...currentSelectedTools, tool.id], { shouldValidate: true, shouldDirty: true });
                            toast({ title: `${tool.name} adicionada.` });
                          } else {
                             toast({ title: `${tool.name} já está selecionada.`, variant: "default"});
                          }
                        }}
                        disabled={isAlreadySelected}
                        className="ml-4 flex-shrink-0 px-3 py-1 h-auto" // Adjusted padding and height
                      >
                        {isAlreadySelected ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : "Adicionar"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <Alert className="mt-4"> {/* Added margin top */}
              <SparklesIcon className="h-4 w-4" />
              <AlertTitle>Tudo Certo!</AlertTitle>
              <AlertDescription>
                Nenhuma sugestão de ferramenta adicional no momento, ou as sugestões já estão selecionadas.
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter className="mt-4"> {/* Added margin top */}
            <DialogClose asChild>
              <Button type="button" variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Manage Agent Tools</CardTitle>
              <CardDescription className="flex items-center">
                Select and configure the tools this agent can use.
                <InfoIconComponent
                    tooltipText={agentBuilderHelpContent.toolsTab.main.tooltip}
                    onClick={() => showHelpModal({ tab: 'toolsTab', field: 'main' })}
                    className="ml-2" // Ensure InfoIconComponent accepts className
                />
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={fetchToolSuggestions} disabled={isLoadingSuggestions} variant="outline" size="sm" className="flex-grow sm:flex-grow-0">
                {isLoadingSuggestions ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SparklesIcon className="mr-2 h-4 w-4 text-yellow-500" />}
                Sugerir Ferramentas
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setEditingCustomToolData(undefined);
                  setIsCustomToolDialogOpen(true);
                }}
                className="flex-grow sm:flex-grow-0"
              >
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Criar Ferramenta Customizada
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Force Tool Usage Field */}
          <Controller
            name="config.forceToolUsage"
            control={control}
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mb-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Force Tool Usage
                  </FormLabel>
                  <FormDescription>
                    If enabled, the agent will be forced to use a tool in its response if possible.
                    This may not be supported by all models or may lead to unexpected behavior if no suitable tool is found.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <ScrollArea className="h-[350px] pr-4"> {/* Adjusted height due to new field */}
            <div className="space-y-4">
              {availableTools.map((tool, index) => {
                const isSelected = currentSelectedTools.includes(tool.id);
                const hasConfig = tool.hasConfig; // From AvailableTool definition
                const isConfigured = hasConfig && toolConfigsApplied[tool.id] && Object.keys(toolConfigsApplied[tool.id]).length > 0;

                // For custom tools, name and description might be in toolConfigsApplied
                const toolDisplayName = (tool.type === 'custom' && toolConfigsApplied[tool.id]?.name) 
                  ? toolConfigsApplied[tool.id].name 
                  : tool.name; // Changed from tool.label to tool.name
                const toolDisplayDescription = (tool.type === 'custom' && toolConfigsApplied[tool.id]?.description) 
                  ? toolConfigsApplied[tool.id].description 
                  : tool.description;

                return (
                  <Card key={tool.id} className="p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-grow min-w-0"> 
                        {getToolIcon(tool)}
                        <div className="flex-grow min-w-0"> 
                          <Label htmlFor={`tool-select-${tool.id}`} className="text-base font-semibold truncate" title={toolDisplayName}> 
                            {toolDisplayName}
                          </Label>
                          <p className="text-sm text-muted-foreground truncate" title={toolDisplayDescription}>{toolDisplayDescription}</p> 
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0"> {/* Reduced space-x-3 to space-x-2 */}
                        {(hasConfig || tool.type === 'custom') && isSelected && (
                          <Button
                            variant="outline"
                            size="icon" // Changed to icon button
                            onClick={() => {
                              if (tool.type === 'custom') {
                                const config = toolConfigsApplied[tool.id] || {}; // Get current config
                                // For custom tools, populate initialData for editing
                                setEditingCustomToolData({
                                  id: tool.id, // Important: pass ID for editing
                                  name: config.name || tool.name, // Prefer name from config if available
                                  description: config.description || tool.description, // Prefer desc from config
                                  inputSchema: config.inputSchema || tool.inputSchema || '{}',
                                  outputSchema: config.outputSchema || tool.outputSchema || '{}',
                                });
                                setIsCustomToolDialogOpen(true);
                              } else if (hasConfig) { // Non-custom tool with config
                                setConfiguringTool(tool);
                                setIsToolConfigModalOpen(true);
                              }
                            }}
                            className="h-8 w-8" // Adjusted size for icon button
                            title={tool.type === 'custom' ? "Editar Ferramenta Customizada" : "Configurar Ferramenta"}
                          >
                            {tool.type === 'custom' ? <Edit3 className="h-4 w-4" /> : <SettingsIcon className={`h-4 w-4 ${isConfigured ? 'text-green-500' : 'text-orange-500'}`} />}
                            {/* Display configuration status for non-custom tools */}
                            {tool.type !== 'custom' && isConfigured && <CheckIcon className="absolute top-0 right-0 h-3 w-3 text-green-500 transform translate-x-1/2 -translate-y-1/2" />}
                            {tool.type !== 'custom' && !isConfigured && <AlertTriangle className="absolute top-0 right-0 h-3 w-3 text-orange-500 transform translate-x-1/2 -translate-y-1/2" />}
                          </Button>
                        )}
                        {tool.type === 'custom' && (
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setToolToDelete(tool.id)}
                            className="h-8 w-8"
                            title="Excluir Ferramenta Customizada"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        )}
                        <Controller
                          name="tools"
                          control={control}
                          render={() => (
                            <Switch
                              id={`tool-select-${tool.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => handleToolSelectionChange(tool.id, checked)}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
