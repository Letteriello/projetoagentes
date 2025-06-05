import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select
import { SavedAgentConfiguration, CommunicationChannel } from '@/types/agent-configs-new'; // Adjust path as needed
// Assuming A2AMessageEvent is available for emitting, though not fully implemented in this step
// import { A2AMessageEvent } from '@/types/monitor-events';

interface A2ATestChannelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  channel: CommunicationChannel | null;
  currentAgent: Pick<SavedAgentConfiguration, 'id' | 'name'>;
  targetAgent: SavedAgentConfiguration | null;
  // Optional: onEmitTestEvent: (event: A2AMessageEvent) => void;
}

type SimulationScenario = "success" | "timeout" | "invalid_format" | "schema_mismatch";

const A2ATestChannelDialog: React.FC<A2ATestChannelDialogProps> = ({
  isOpen,
  onOpenChange,
  channel,
  currentAgent,
  targetAgent,
  // onEmitTestEvent
}) => {
  const [testMessage, setTestMessage] = useState<string>('');
  const [simulatedResponse, setSimulatedResponse] = useState<string>('');
  const [simulationScenario, setSimulationScenario] = useState<SimulationScenario>("success");
  const [isSimulating, setIsSimulating] = useState<boolean>(false); // For timeout simulation

  if (!channel) {
    return null;
  }

  const resetDialogState = () => {
    setTestMessage('');
    setSimulatedResponse('');
    setSimulationScenario("success");
    setIsSimulating(false);
  };

  const handleSendMessage = async () => {
    setIsSimulating(true);
    setSimulatedResponse(''); // Clear previous response
    let responseText = '';
    let eventStatus: 'simulated_success' | 'simulated_failed' = 'simulated_success';
    let errorDetails: { message: string; stack?: string } | undefined = undefined;

    switch (simulationScenario) {
      case 'timeout':
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second delay
        responseText = `Erro: Timeout - A resposta do agente alvo (${targetAgent?.name || 'desconhecido'}) demorou muito.`;
        eventStatus = 'simulated_failed';
        errorDetails = { message: responseText };
        break;
      case 'invalid_format':
        responseText = `Erro: Formato de Mensagem Inválido - O agente alvo (${targetAgent?.name || 'desconhecido'}) não pôde processar a mensagem. Formato esperado pelo canal: ${channel.messageFormat}.`;
        eventStatus = 'simulated_failed';
        errorDetails = { message: responseText };
        break;
      case 'schema_mismatch':
        if (channel.messageFormat === 'json' && channel.schema) {
          responseText = `Erro: Schema Não Correspondente - A mensagem não corresponde ao schema JSON esperado pelo canal ${channel.name}.`;
          // Optional: actual schema validation logic could go here
        } else {
          responseText = "Info: Cenário de 'Schema Mismatch' não aplicável ou schema não definido para este canal.";
          // eventStatus remains success as it's an info, not a processing failure by target
        }
        eventStatus = 'simulated_failed'; // Still a failure in terms of expectation
        errorDetails = { message: responseText };
        break;
      case 'success':
      default:
        responseText = `Simulated response from ${currentAgent.name} (ID: ${currentAgent.id}) to your message: "${testMessage}"\n`;
        responseText += `Channel: ${channel.name} (Direction: ${channel.direction})\n`;
        if (channel.direction === 'outbound' && targetAgent) {
          responseText += `Target Agent: ${targetAgent.name} (ID: ${targetAgent.id})\n`;
          responseText += `Note: This is a simulation. In a real scenario, the message would be sent to ${targetAgent.name}.\n`;
          responseText += `Simulated reply from ${targetAgent.name}: "Acknowledged: ${testMessage}"`;
        } else if (channel.direction === 'inbound') {
          responseText += `Source Agent (simulated): SomeExternalAgent (ID: external_agent_id)\n`;
          responseText += `Note: This is a simulation of an inbound message to ${currentAgent.name}.\n`;
          responseText += `Simulated processing by ${currentAgent.name}: "Received and processed: ${testMessage}"`;
        } else {
          responseText += `This is a bi-directional channel. Simulation is generic.\n`;
        }
        eventStatus = 'simulated_success';
        break;
    }
    setSimulatedResponse(responseText);
    setIsSimulating(false);

    // Optional: Emit A2AMessageEvent
    // if (onEmitTestEvent) {
    //   const eventToEmit: A2AMessageEvent = {
    //     id: `test-${Date.now()}`,
    //     timestamp: new Date().toISOString(),
    //     agentId: currentAgent.id, // Or a system ID if preferred for test events
    //     eventType: 'a2a_message',
    //     fromAgentId: channel.direction === 'inbound' ? (targetAgent?.id || 'external_simulated') : currentAgent.id,
    //     toAgentId: channel.direction === 'outbound' ? (targetAgent?.id || 'unknown_target') : currentAgent.id,
    //     messageContent: testMessage,
    //     status: eventStatus,
    //     channelId: channel.id,
    //     errorDetails: errorDetails,
    //   };
    //   onEmitTestEvent(eventToEmit);
    // }
  };

  const getChannelInfo = () => {
    let info = `Canal: ${channel.name} (Direção: ${channel.direction})`;
    if (channel.direction === 'outbound') {
      info += targetAgent ? ` | Destino: ${targetAgent.name}` : ' | Destino: Não especificado ou não encontrado';
    } else if (channel.direction === 'inbound') {
      info += ` | Origem: (Externa/Qualquer)`;
    }
    return info;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Testar Canal de Comunicação A2A</DialogTitle>
          <DialogDescription>
            Envie uma mensagem de teste para simular a comunicação através do canal selecionado.
            <br />
            <strong>{getChannelInfo()}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="simulation-scenario">Cenário de Simulação</Label>
            <Select value={simulationScenario} onValueChange={(value) => setSimulationScenario(value as SimulationScenario)}>
              <SelectTrigger id="simulation-scenario">
                <SelectValue placeholder="Selecione o cenário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="timeout">Timeout</SelectItem>
                <SelectItem value="invalid_format">Formato de Mensagem Inválido</SelectItem>
                {channel.messageFormat === 'json' && channel.schema && (
                  <SelectItem value="schema_mismatch">Schema Não Correspondente</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="test-message">Mensagem de Teste</Label>
            <Textarea
              id="test-message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Digite sua mensagem de teste aqui..."
              rows={4}
              disabled={isSimulating}
            />
          </div>

          <Button onClick={handleSendMessage} disabled={!testMessage.trim() || isSimulating} className="w-full">
            {isSimulating ? 'Simulando...' : 'Enviar Mensagem de Teste'}
          </Button>

          {simulatedResponse && (
            <div>
              <Label htmlFor="simulated-response">
                Simulação de Resposta
              </Label>
              <Textarea
                id="simulated-response"
                value={simulatedResponse}
                readOnly
                rows={6}
                className={`bg-muted/50 ${
                  simulatedResponse.startsWith("Erro:") ? "text-red-700 dark:text-red-400 border-red-500" :
                  simulatedResponse.startsWith("Info:") ? "text-blue-700 dark:text-blue-400 border-blue-500" : ""
                }`}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={resetDialogState} disabled={isSimulating}>
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default A2ATestChannelDialog;
