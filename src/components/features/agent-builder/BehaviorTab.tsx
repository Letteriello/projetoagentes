// BehaviorTab: Componente para a aba 'Comportamento' do diálogo de criação de agentes.
// Inclui a instrução global e renderiza condicionalmente formulários específicos
// para cada tipo de agente (LLM, Workflow, Customizado) ou uma mensagem para A2A.

// import *_React from "react"; // Renamed to avoid conflict with React namespace - No longer needed
import * as React from "react";
import { useFormContext, Controller } from "react-hook-form"; // MODIFIED
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TabsContent } from "@/components/ui/tabs";
import { Waypoints } from "lucide-react";
import LLMBehaviorForm from "./LLMBehaviorForm";
import WorkflowBehaviorForm from "./WorkflowBehaviorForm";
import CustomBehaviorForm from "./CustomBehaviorForm";
import { SavedAgentConfiguration } from "@/types/agent-configs"; // MODIFIED
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"; // MODIFIED

// MODIFIED: Simplified props
interface BehaviorTabProps {
  agentToneOptions: Array<{ id: string; label: string; }>; // Still needed for LLMBehaviorForm
  // Add any other static options if sub-forms need them
}

const BehaviorTab: React.FC<BehaviorTabProps> = ({ agentToneOptions }) => {
  // MODIFIED: Get RHF methods from context
  const { control, watch, formState: { errors } } = useFormContext<SavedAgentConfiguration>();
  const selectedAgentType = watch("config.type");

  return (
    <TabsContent value="behavior" className="space-y-6 mt-4">
      <FormField
        control={control}
        name="config.globalInstruction"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel htmlFor="config.globalInstruction">Instrução Global / Prompt do Sistema Primário</FormLabel>
            <FormControl>
              <Textarea
                id="config.globalInstruction"
                placeholder="Defina o comportamento central, persona ou prompt de sistema principal para o agente..."
                {...field}
                rows={4}
              />
            </FormControl>
            <FormDescription>
              Para agentes LLM, isso pode ser o início do prompt do sistema. Para outros tipos de agente (Workflow, Customizado), serve como uma diretriz de alto nível ou descrição do propósito geral.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <Separator />

      {selectedAgentType === 'llm' && (
        <LLMBehaviorForm agentToneOptions={agentToneOptions} />
      )}
      {selectedAgentType === 'workflow' && (
        <WorkflowBehaviorForm />
      )}
      {selectedAgentType === 'custom' && (
        <CustomBehaviorForm />
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
    </TabsContent>
  );
};
export default BehaviorTab;
