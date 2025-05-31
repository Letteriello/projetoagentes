// BehaviorTab: Componente para a aba 'Comportamento' do diálogo de criação de agentes.
// Inclui a instrução global e renderiza condicionalmente formulários específicos
// para cada tipo de agente (LLM, Workflow, Customizado) ou uma mensagem para A2A.

import *_React from "react"; // Renamed to avoid conflict with React namespace
import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TabsContent } from "@/components/ui/tabs"; // Needed for the root element
import { Waypoints } from "lucide-react"; // Icon for A2A alert

import LLMBehaviorForm from "./LLMBehaviorForm";
import WorkflowBehaviorForm from "./WorkflowBehaviorForm";
import CustomBehaviorForm from "./CustomBehaviorForm";

// Props para o componente BehaviorTab.
interface BehaviorTabProps {
  globalInstruction: string;
  setGlobalInstruction: (instruction: string) => void;
  selectedAgentType: "llm" | "workflow" | "custom" | "a2a";

  // Props para LLMBehaviorForm
  agentGoal: string;
  setAgentGoal: (goal: string) => void;
  agentTasks: string[];
  setAgentTasks: (tasks: string[]) => void;
  agentPersonality: string;
  setAgentPersonality: (personality: string) => void;
  agentRestrictions: string[];
  setAgentRestrictions: (restrictions: string[]) => void;
  agentModel: string;
  setAgentModel: (model: string) => void;
  agentTemperature: number;
  setAgentTemperature: (temperature: number) => void;
  systemPromptGenerated: string;
  agentToneOptions: Array<{ id: string; label: string; }>;

  // Props para WorkflowBehaviorForm
  detailedWorkflowType: string;
  setDetailedWorkflowType: (type: "sequential" | "graph" | "stateMachine") => void;
  workflowDescription: string;
  setWorkflowDescription: (description: string) => void;
  loopMaxIterations: number | undefined;
  setLoopMaxIterations: (iterations: number | undefined) => void;

  // Props para CustomBehaviorForm
  customLogicDescription: string;
  setCustomLogicDescription: (description: string) => void;

  // Props for A2A alert (already available in main dialog, passed down)
  // No specific props needed other than selectedAgentType for the alert itself.
  // Icons and Alert component are imported directly here.
}

const BehaviorTab: React.FC<BehaviorTabProps> = ({
  globalInstruction,
  setGlobalInstruction,
  selectedAgentType,
  // LLM Props
  agentGoal, setAgentGoal,
  agentTasks, setAgentTasks,
  agentPersonality, setAgentPersonality,
  agentRestrictions, setAgentRestrictions,
  agentModel, setAgentModel,
  agentTemperature, setAgentTemperature,
  systemPromptGenerated, agentToneOptions,
  // Workflow Props
  detailedWorkflowType, setDetailedWorkflowType,
  workflowDescription, setWorkflowDescription,
  loopMaxIterations, setLoopMaxIterations,
  // Custom Props
  customLogicDescription, setCustomLogicDescription,
}) => {
  return (
    <TabsContent value="behavior" className="space-y-6 mt-4">
      {/* Instrução Global / Prompt de Sistema Primário */}
      <div className="space-y-2">
        <Label htmlFor="globalInstructionBehaviorTab">Instrução Global / Prompt do Sistema Primário</Label>
        <Textarea
          id="globalInstructionBehaviorTab" // Changed ID to avoid conflict if original is still mounted briefly
          placeholder="Defina o comportamento central, persona ou prompt de sistema principal para o agente. Isso se aplica a todos os tipos de agente como uma instrução de alto nível."
          value={globalInstruction}
          onChange={(e) => setGlobalInstruction(e.target.value)}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Para agentes LLM, isso pode ser o início do prompt do sistema. Para outros tipos de agente (Workflow, Customizado), serve como uma diretriz de alto nível ou descrição do propósito geral.
        </p>
      </div>
      <Separator />

      {/* Campos específicos para agentes do tipo LLM. */}
      {selectedAgentType === 'llm' && (
        <LLMBehaviorForm
          agentGoal={agentGoal}
          setAgentGoal={setAgentGoal}
          agentTasks={agentTasks}
          setAgentTasks={setAgentTasks}
          agentPersonality={agentPersonality}
          setAgentPersonality={setAgentPersonality}
          agentRestrictions={agentRestrictions}
          setAgentRestrictions={setAgentRestrictions}
          agentModel={agentModel}
          setAgentModel={setAgentModel}
          agentTemperature={agentTemperature}
          setAgentTemperature={setAgentTemperature}
          systemPromptGenerated={systemPromptGenerated}
          agentToneOptions={agentToneOptions}
        />
      )}

      {/* Campos específicos para agentes do tipo Workflow. */}
      {selectedAgentType === 'workflow' && (
        <WorkflowBehaviorForm
          detailedWorkflowType={detailedWorkflowType}
          setDetailedWorkflowType={setDetailedWorkflowType}
          workflowDescription={workflowDescription}
          setWorkflowDescription={setWorkflowDescription}
          loopMaxIterations={loopMaxIterations}
          setLoopMaxIterations={setLoopMaxIterations}
        />
      )}

      {/* Campos específicos para agentes do tipo Customizado. */}
      {selectedAgentType === 'custom' && (
        <CustomBehaviorForm
          customLogicDescription={customLogicDescription}
          setCustomLogicDescription={setCustomLogicDescription}
        />
      )}
       {/* Mensagem informativa para agentes do tipo A2A. */}
       {selectedAgentType === 'a2a' && (
        <Alert>
          <Waypoints className="h-4 w-4" />
          <AlertTitle>Agente de Comunicação (A2A)</AlertTitle>
          <AlertDescription>
            Este tipo de agente é especializado em facilitar a comunicação e coordenação entre outros agentes ou sistemas.
            As configurações específicas para A2A, como canais de comunicação e protocolos, são definidas na aba 'Avançado/A2A'.
          </AlertDescription>
        </Alert>
      )}
    </TabsContent>
  );
};

export default BehaviorTab;
