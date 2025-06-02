import * as React from 'react'; // Ensure React is imported
import { useFormContext } from 'react-hook-form';
import { SavedAgentConfiguration } from '@/types/agent-configs';
import { getAiConfigurationSuggestionsAction } from '@/app/agent-builder/actions';
import { AiConfigurationAssistantOutputSchema } from '@/ai/flows/aiConfigurationAssistantFlow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // For styling
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // For displaying alerts
import { Loader2, Wand2 as SparklesIcon, AlertTriangle, CheckCircle } from 'lucide-react'; // Icons
import { useToast } from "@/hooks/use-toast";
import { z } from 'zod';
import { Badge } from '@/components/ui/badge'; // Existing import

// Assuming ReviewTabProps includes setActiveEditTab and showHelpModal, though not used in this snippet
export interface ReviewTabProps {
  setActiveEditTab?: (tabId: string) => void;
  showHelpModal?: (contentKey: any) => void; // Adjust 'any' to your specific help content key type
}


export default function ReviewTab(props: ReviewTabProps) {
  const { watch, getValues } = useFormContext<SavedAgentConfiguration>();
  const { toast } = useToast();
  // const { setActiveEditTab, showHelpModal } = props; // Assuming props are passed

  const agentName = watch('agentName');
  const description = watch('description');
  const agentTone = watch('config.agentPersonality'); // Corrected path based on LLMBehaviorForm
  const tools = watch('tools') || [];
  const config = watch('config') || {}; // This is the full config object

  const [isLoadingAlerts, setIsLoadingAlerts] = React.useState(false);
  const [inconsistencyAlerts, setInconsistencyAlerts] = React.useState<string[]>([]);
  const [hasFetched, setHasFetched] = React.useState(false); // To track if fetch attempt was made

  const fetchInconsistencyAlerts = async () => {
    setIsLoadingAlerts(true);
    setHasFetched(true); // Mark that a fetch attempt has been made
    const currentConfig = getValues();
    try {
      // Pass "inconsistencyAlerts" context
      const result = await getAiConfigurationSuggestionsAction(currentConfig, "inconsistencyAlerts"); 
      if (result.success && result.suggestions?.inconsistencyAlerts) {
        setInconsistencyAlerts(result.suggestions.inconsistencyAlerts);
        if (result.suggestions.inconsistencyAlerts.length > 0) {
          toast({ title: "Alertas de Inconsistência Encontrados", description: "Por favor, revise os alertas.", variant: "destructive" });
        } else {
          toast({ title: "Verificação de Inconsistência Concluída", description: "Nenhum alerta de inconsistência encontrado." });
        }
      } else if (result.success) { // No inconsistencyAlerts field or it's empty
        setInconsistencyAlerts([]);
        toast({ title: "Verificação de Inconsistência Concluída", description: "Nenhum alerta de inconsistência encontrado." });
      }
      else {
        toast({ title: "Falha ao Verificar Inconsistências", description: result.error, variant: "destructive" });
        setInconsistencyAlerts([]); // Clear previous alerts on error
      }
    } catch (e: any) {
      toast({ title: "Erro ao Verificar Inconsistências", description: e.message, variant: "destructive" });
      setInconsistencyAlerts([]);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  // Helper to get tool names for display - assuming availableTools might be fetched or passed to a higher context
  // For now, this is a placeholder as ReviewTab doesn't have direct access to availableTools details
  const getToolDisplayInfo = (toolId: string) => {
    // In a real scenario, you'd look up tool details from availableTools or a context
    return { id: toolId, name: toolId }; // Placeholder
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agent Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">{agentName || 'Unnamed Agent'}</h4>
            <p className="text-muted-foreground">{description || 'No description provided'}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Tone:</span>
            <Badge variant="outline">{agentTone || 'Not specified'}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium">Tools ({tools.length})</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {tools.map((toolId: string) => {
                const toolInfo = getToolDisplayInfo(toolId); // Use helper
                return (
                  <Badge key={toolInfo.id} variant={'secondary'}> {/* Removed 'configured' variant logic as it's not available here */}
                    {toolInfo.name}
                  </Badge>
                );
              })}
              {tools.length === 0 && <span className="text-sm text-muted-foreground">No tools selected</span>}
            </div>
          </div>

          <div>
            <h4 className="font-medium">Memory Configuration (State Persistence)</h4>
            <pre className="mt-2 p-2 bg-muted rounded text-sm overflow-x-auto">
              {JSON.stringify(config.statePersistence || { type: "none" }, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Verificação de Inconsistências (IA)</CardTitle>
              <CardDescription>
                Análise da configuração do agente para problemas lógicos ou componentes ausentes.
              </CardDescription>
            </div>
            <Button onClick={fetchInconsistencyAlerts} disabled={isLoadingAlerts} variant="outline">
              {isLoadingAlerts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SparklesIcon className="mr-2 h-4 w-4 text-yellow-500" />}
              Verificar Agora
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingAlerts && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2">Verificando inconsistências...</p>
            </div>
          )}
          {!isLoadingAlerts && hasFetched && inconsistencyAlerts.length === 0 && (
            <Alert variant="default" className="border-green-500 text-green-700">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Nenhuma Inconsistência Encontrada</AlertTitle>
              <AlertDescription>
                A verificação automática não detectou problemas lógicos ou de configuração maiores.
              </AlertDescription>
            </Alert>
          )}
          {!isLoadingAlerts && inconsistencyAlerts.length > 0 && (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Alertas de Inconsistência Detectados!</AlertTitle>
              </Alert>
              <ul className="list-disc space-y-2 pl-5 text-sm text-red-700 bg-red-50 p-4 rounded-md">
                {inconsistencyAlerts.map((alert, index) => (
                  <li key={index}>{alert}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                Considere revisar as abas relevantes para corrigir esses problemas antes de salvar o agente.
              </p>
            </div>
          )}
          {!isLoadingAlerts && !hasFetched && (
              <div className="text-sm text-muted-foreground p-4 text-center">
                  Clique em "Verificar Agora" para que a IA analise a configuração do seu agente.
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
