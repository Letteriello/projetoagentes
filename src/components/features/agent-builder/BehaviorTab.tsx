// BehaviorTab: Componente para a aba 'Comportamento' do diálogo de criação de agentes.
// Inclui a instrução global e renderiza condicionalmente formulários específicos
// para cada tipo de agente (LLM, Workflow, Customizado) ou uma mensagem para A2A.

// import *_React from "react"; // Renamed to avoid conflict with React namespace - No longer needed
import * as React from "react";
import { useFormContext, Controller } from "react-hook-form"; // MODIFIED
// import { Label } from "@/components/ui/label"; // No longer directly used if FormLabel is used consistently
import { Textarea } from "@/components/ui/textarea";
// import { Separator } from "@/components/ui/separator"; // Separator might be used between cards if needed.
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TabsContent } from "@/components/ui/tabs";
import { Waypoints } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card components
import LLMBehaviorForm from "./LLMBehaviorForm";
import WorkflowBehaviorForm from "./WorkflowBehaviorForm";
import CustomBehaviorForm from "./CustomBehaviorForm";
import { SavedAgentConfiguration } from '@/types/agent-configs-fixed'; // MODIFIED
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"; // MODIFIED

// MODIFIED: Simplified props
interface BehaviorTabProps {
  agentToneOptions: Array<{ id: string; label: string; }>; // Still needed for LLMBehaviorForm
  showHelpModal: (args: { tab: string; field: string; contentKey?: string }) => void;
  // Add any other static options if sub-forms need them
}

const BehaviorTab: React.FC<BehaviorTabProps> = ({ agentToneOptions, showHelpModal }) => {
  // MODIFIED: Get RHF methods from context
  const { control, watch, formState: { errors } } = useFormContext<SavedAgentConfiguration>();
  const selectedAgentType = watch("config.type");

  return (
    <TabsContent value="behavior" className="mt-0"> {/* Adjusted mt-0 as Card will provide spacing */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Primary Directive</CardTitle>
            <CardDescription>
              Define the core behavior, persona, or main system prompt for the agent. This instruction guides the agent's actions and responses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={control}
              name="config.globalInstruction"
              render={({ field }) => (
                <FormItem> {/* Removed space-y-2, relying on CardContent padding */}
                  <FormLabel htmlFor="config.globalInstruction" className="sr-only">Global Instruction / Primary System Prompt</FormLabel> {/* Label can be sr-only if CardTitle is descriptive enough */}
                  <FormControl>
                    <Textarea
                      id="config.globalInstruction"
                      placeholder="Define the core behavior, persona, or main system prompt for the agent..."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription className="pt-2">
                    For LLM agents, this can be the start of the system prompt. For other agent types (Workflow, Custom), it serves as a high-level guideline or general purpose description.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Specific behavior forms will be direct children of space-y-6, allowing them to be wrapped in their own Cards if needed internally */}
        {selectedAgentType === 'llm' && (
          <LLMBehaviorForm agentToneOptions={agentToneOptions} showHelpModal={showHelpModal} />
      )}
      {selectedAgentType === 'workflow' && (
        <WorkflowBehaviorForm showHelpModal={showHelpModal} />
      )}
      {selectedAgentType === 'custom' && (
        <CustomBehaviorForm showHelpModal={showHelpModal} />
      )}
      {selectedAgentType === 'a2a' && (
        <Alert>
          <Waypoints className="h-4 w-4" />
          <AlertTitle>Agente de Comunicação (A2A)</AlertTitle>
          <AlertDescription>
            Este tipo de agente é especializado em facilitar a comunicação e coordenação entre outros agentes ou sistemas.
            As configurações específicas para A2A, como canais de comunicação e protocolos, são definidas na aba 'Comunicação A2A'.
          </AlertDescription>
        </Alert>
      )}
      </div> {/* Closing tag for the div started at line 34 */}
    </TabsContent>
  );
};
export default BehaviorTab;
