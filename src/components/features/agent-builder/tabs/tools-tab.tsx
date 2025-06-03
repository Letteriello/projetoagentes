import * as React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { z } from 'zod';
import { getAiConfigurationSuggestionsAction } from '@/app/agent-builder/actions';
import { AiConfigurationAssistantOutputSchema, SuggestedToolSchema } from '@/ai/flows/aiConfigurationAssistantFlow';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Wand2 as SparklesIcon, CheckCircle2, Settings, Check, PlusCircle, Trash2, AlertTriangle, Cpu, Edit3 } from "lucide-react"; // Added Cpu, Edit3
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Added AlertDialog
import { SavedAgentConfiguration, AvailableTool, ToolConfigData } from '@/types/agent-configs';
import CustomToolDialog, { CustomToolData } from '../custom-tool-dialog'; 
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// Assuming InfoIcon is a standard component, if it's conflicting, it might need aliasing or checking usage.
// For now, assuming InfoIconComponent prop handles the specific InfoIcon from props.

interface ToolsTabProps {
  availableTools: AvailableTool[];
  // Props for icons and help modal, passed from AgentBuilderDialog
  iconComponents: Record<string, React.ComponentType<{ className?: string }>>;
  InfoIconComponent: React.ElementType; // Renamed to avoid conflict with local InfoIcon
  SettingsIcon: React.ElementType;
  CheckIcon: React.ElementType;
  PlusCircleIcon: React.ElementType;
  Trash2Icon: React.ElementType;
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
  onToolConfigure: (toolId: string) => void; // Function to open configuration modal for a tool
}

type FormContextType = SavedAgentConfiguration;

export { SuggestedToolSchema } from '@/ai/flows/aiConfigurationAssistantFlow';

export default function ToolsTab({
  availableTools,
  iconComponents,
  InfoIconComponent,
  SettingsIcon,
  CheckIcon,
  showHelpModal,
  onToolConfigure,
}: ToolsTabProps) {
  const { control, watch, setValue, getValues } = useFormContext<FormContextType>();
  const { toast } = useToast();
  const currentSelectedTools = watch('tools') || [];
  const toolConfigsApplied = watch('toolConfigsApplied') || {};

  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const [aiSuggestedTools, setAiSuggestedTools] = React.useState<SuggestedToolType[]>([]);
  const [isSuggestionsDialogOpen, setIsSuggestionsDialogOpen] = React.useState(false);
  const [isCustomToolDialogOpen, setIsCustomToolDialogOpen] = React.useState(false);
  const [editingCustomToolData, setEditingCustomToolData] = React.useState<CustomToolData | undefined>(undefined);
  const [toolToDelete, setToolToDelete] = React.useState<string | null>(null); // For delete confirmation

  type SuggestedToolType = z.infer<typeof SuggestedToolSchema>;

  const fetchToolSuggestions = async () => {
    setIsLoadingSuggestions(true);
    const currentConfig = getValues(); // Get the complete current agent configuration
    try {
      // MODIFICATION: Pass "tools" context
      const result = await getAiConfigurationSuggestionsAction(currentConfig, "tools"); 
      
      if (result.success && result.suggestions?.suggestedTools && result.suggestions.suggestedTools.length > 0) {
        // Filter out tools that are already selected to avoid suggesting them again if the backend doesn't do this.
        // The backend aiConfigurationAssistantFlow for tools already has logic to avoid suggesting already selected tools.
        // So, this client-side filter might be redundant if the backend is robust.
        // For now, let's assume backend handles it. If not, this is where to filter:
        // const newSuggestedTools = result.suggestions.suggestedTools.filter(st => !currentSelectedTools.includes(st.id));
        // setAiSuggestedTools(newSuggestedTools);
        setAiSuggestedTools(result.suggestions.suggestedTools);
        setIsSuggestionsDialogOpen(true);
        toast({ title: "Sugestões de Ferramentas Carregadas" });
      } else if (result.success) {
           setAiSuggestedTools([]);
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
    const IconComponent = iconComponents[tool.icon as string || tool.id] || iconComponents.default || Settings;
    return <IconComponent className="w-5 h-5 mr-3 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <CustomToolDialog
        isOpen={isCustomToolDialogOpen}
        onOpenChange={(open) => {
          setIsCustomToolDialogOpen(open);
          if (!open) setEditingCustomToolData(undefined); // Clear editing data when dialog closes
        }}
        onSave={handleSaveCustomTool}
        initialData={editingCustomToolData}
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
                <PlusCircleIcon className="mr-2 h-4 w-4" /> {/* Using PlusCircleIcon prop */}
                Criar Ferramenta Customizada
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4"> {/* Added ScrollArea */}
            <div className="space-y-4">
              {availableTools.map((tool, index) => {
                const isSelected = currentSelectedTools.includes(tool.id);
                const hasConfig = tool.hasConfig; // From AvailableTool definition
                const isConfigured = hasConfig && toolConfigsApplied[tool.id] && Object.keys(toolConfigsApplied[tool.id]).length > 0;

                // For custom tools, name and description might be in toolConfigsApplied
                const toolDisplayName = (tool.type === 'custom' && toolConfigsApplied[tool.id]?.name) ? toolConfigsApplied[tool.id].name : tool.label;
                const toolDisplayDescription = (tool.type === 'custom' && toolConfigsApplied[tool.id]?.description) ? toolConfigsApplied[tool.id].description : tool.description;

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
                              } else {
                                onToolConfigure(tool.id); // For non-custom tools with config
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
                            size="icon" // Changed to icon button
                            onClick={() => setToolToDelete(tool.id)} // Set tool to delete for confirmation
                            className="h-8 w-8" // Adjusted size for icon button
                            title="Excluir Ferramenta Customizada"
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        )}
                         <Controller
                            name={`tools`} 
                            control={control}
                            render={({ field }) => ( // field here isn't directly used for array
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
