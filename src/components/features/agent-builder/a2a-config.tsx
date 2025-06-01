import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Network, Plus, Terminal } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SubAgentSelector } from "@/components/features/agent-builder/sub-agent-selector";
import {
  A2AConfig as A2AConfigType,
  CommunicationChannel,
} from "@/types/a2a-types";
import { SavedAgentConfiguration } from "@/types/agent-types";

interface A2AConfigProps {
  a2aConfig: A2AConfigType;
  setA2AConfig: (config: A2AConfigType) => void;
  savedAgents?: SavedAgentConfiguration[];
}

export function A2AConfig({
  a2aConfig,
  setA2AConfig,
  savedAgents = [],
}: A2AConfigProps) {
  // Função para adicionar um novo canal
  const handleAddCommunicationChannel = () => {
    const newChannel: CommunicationChannel = {
      id: `channel-${Date.now()}`,
      name: `Canal ${a2aConfig.communicationChannels.length + 1}`,
      direction: "bidirectional",
      messageFormat: "json",
      syncMode: "async",
    };

    setA2AConfig({
      ...a2aConfig,
      communicationChannels: [...a2aConfig.communicationChannels, newChannel],
    });
  };

  // Função para atualizar um canal existente
  const handleUpdateChannel = (
    index: number,
    updated: CommunicationChannel,
  ) => {
    const newChannels = [...a2aConfig.communicationChannels];
    newChannels[index] = updated;
    setA2AConfig({
      ...a2aConfig,
      communicationChannels: newChannels,
    });
  };

  // Função para excluir um canal
  const handleDeleteChannel = (index: number) => {
    const newChannels = [...a2aConfig.communicationChannels];
    newChannels.splice(index, 1);
    setA2AConfig({
      ...a2aConfig,
      communicationChannels: newChannels,
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium mb-3">
        Configuração de Comunicação Agent-to-Agent (A2A)
      </h3>

      <Alert variant="default" className="bg-muted/30 border-border/50">
        <AlertTitle className="text-sm">Protocolo A2A do Google ADK</AlertTitle>
        <AlertDescription className="text-xs">
          Configure como este agente se comunica com outros agentes, definindo
          canais, formatos de mensagem e políticas de comunicação.
        </AlertDescription>
      </Alert>

      <div className="space-y-4 mt-2">
        <div className="flex justify-between items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Label className="text-sm font-medium">Canais de Comunicação</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Define dedicated pathways for information exchange between agents, specifying how they connect and interact.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCommunicationChannel}
          >
            Adicionar Canal
          </Button>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-4 space-y-4">
            {a2aConfig.communicationChannels.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Nenhum canal definido. Adicione canais para permitir comunicação
                com outros agentes.
              </div>
            ) : (
              a2aConfig.communicationChannels.map((channel, index) => (
                <div key={index} className="border rounded-md p-3 space-y-3">
                  <div className="flex justify-between items-center">
                    <Input
                      value={channel.name}
                      onChange={(e) =>
                        handleUpdateChannel(index, {
                          ...channel,
                          name: e.target.value,
                        })
                      }
                      className="h-7 w-60 text-sm"
                      placeholder="Nome do canal"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteChannel(index)}
                    >
                      <AlertCircle className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Label
                              htmlFor={`channel-direction-${channel.id}`}
                              className="text-xs"
                            >
                              Direção
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Inbound: Agent receives messages. Outbound: Agent sends messages. Bidirectional: Agent can send and receive messages.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Select
                        value={channel.direction}
                        onValueChange={(value) =>
                          handleUpdateChannel(index, {
                            ...channel,
                            direction: value as
                              | "inbound"
                              | "outbound"
                              | "bidirectional",
                          })
                        }
                      >
                        <SelectTrigger
                          id={`channel-direction-${channel.id}`}
                          className="h-8"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inbound">
                            Entrada (Recebe)
                          </SelectItem>
                          <SelectItem value="outbound">
                            Saída (Envia)
                          </SelectItem>
                          <SelectItem value="bidirectional">
                            Bidirecional
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Label
                              htmlFor={`channel-format-${channel.id}`}
                              className="text-xs"
                            >
                              Formato
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Defines the data structure for messages (JSON for structured data, Text for plain text, Binary for custom formats).</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Select
                        value={channel.messageFormat}
                        onValueChange={(value) =>
                          handleUpdateChannel(index, {
                            ...channel,
                            messageFormat: value as "json" | "text" | "binary",
                          })
                        }
                      >
                        <SelectTrigger
                          id={`channel-format-${channel.id}`}
                          className="h-8"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="binary">Binário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {(channel.direction === "outbound" ||
                    channel.direction === "bidirectional") && (
                    <div className="mt-3">
                      <Label className="text-xs">Agente Alvo</Label>
                      <SubAgentSelector
                        selectedAgents={
                          channel.targetAgentId ? [channel.targetAgentId] : []
                        }
                        availableAgents={savedAgents}
                        onChange={(selectedIds) => {
                          handleUpdateChannel(index, {
                            ...channel,
                            targetAgentId: selectedIds[0] || undefined,
                          });
                        }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 space-y-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <h4 className="text-sm font-medium">Políticas de Comunicação</h4>
            </TooltipTrigger>
            <TooltipContent>
              <p>General rules governing A2A interactions for this agent.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Label htmlFor="defaultResponseFormat" className="text-xs">
                    Formato de Resposta Padrão
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Default message format this agent uses when responding, if not specified by the channel.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Select
              value={a2aConfig.defaultResponseFormat}
              onValueChange={(value) =>
                setA2AConfig({
                  ...a2aConfig,
                  defaultResponseFormat: value as "json" | "text",
                })
              }
            >
              <SelectTrigger id="defaultResponseFormat" className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Label htmlFor="maxMessageSize" className="text-xs">
                    Tamanho Máximo de Mensagem (bytes)
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Maximum allowed size for a single message to prevent overload.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Input
              id="maxMessageSize"
              type="number"
              value={a2aConfig.maxMessageSize || ""}
              onChange={(e) =>
                setA2AConfig({
                  ...a2aConfig,
                  maxMessageSize: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="h-8"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="loggingEnabled"
            checked={a2aConfig.loggingEnabled}
            onCheckedChange={(checked) =>
              setA2AConfig({ ...a2aConfig, loggingEnabled: checked })
            }
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Label htmlFor="loggingEnabled">Habilitar log de comunicação</Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Enables recording of A2A message exchanges for debugging or auditing.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
