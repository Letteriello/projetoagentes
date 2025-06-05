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
import { FormFieldWithTooltip } from "./FormFieldWithTooltip";
import { SubAgentSelector } from "@/components/features/agent-builder/sub-agent-selector";
import { useFormContext } from "react-hook-form";
import {
  A2AConfig as A2AConfigType,
  CommunicationChannel,
} from '@/types/agent-configs-fixed';
import { SavedAgentConfiguration } from "@/types/agent-types";
import {
  handleAddCommunicationChannel,
  handleDeleteChannel,
  handleUpdateChannelName,
  handleUpdateChannelDirection,
  handleUpdateChannelMessageFormat,
  handleUpdateChannelSyncMode,
  handleUpdateChannelRetryPolicy,
  handleUpdateChannelSchema,
  handleUpdateChannelTargetAgentId,
} from "./a2a-channel-handlers";

interface A2AConfigProps {
  savedAgents?: SavedAgentConfiguration[];
}

export function A2AConfig({ savedAgents = [] }: A2AConfigProps) {
  const methods = useFormContext<SavedAgentConfiguration>();
  const a2aConfig = methods.watch("config.a2a") || {
    enabled: false,
    communicationChannels: [],
    defaultResponseFormat: "json",
    maxMessageSize: 1024 * 1024,
    loggingEnabled: false,
  };

  // Ensure a2aConfig and its nested properties are defined before rendering
  if (!a2aConfig) {
    // This can happen briefly if the form context is not yet updated
    // Or if the default value for config.a2a is not set in the form
    // You might want to render a loader or null here
    return null;
  }

  const currentCommunicationChannels = a2aConfig.communicationChannels || [];


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
            onClick={() => handleAddCommunicationChannel(methods, a2aConfig)}
          >
            Adicionar Canal
          </Button>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-4 space-y-4">
            {currentCommunicationChannels.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Nenhum canal definido. Adicione canais para permitir comunicação
                com outros agentes.
              </div>
            ) : (
              currentCommunicationChannels.map((channel, index) => (
                <div key={channel.id || index} className="border rounded-md p-3 space-y-3"> {/* Ensure key is stable */}
                  <div className="flex justify-between items-center">
                    <Input
                      value={channel.name}
                      onChange={(e) =>
                        handleUpdateChannelName(methods, a2aConfig, index, e.target.value)
                      }
                      className="h-7 w-60 text-sm"
                      placeholder="Nome do canal"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteChannel(methods, a2aConfig, index)}
                    >
                      <AlertCircle className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <FormFieldWithTooltip
                      label="Direção"
                      tooltipText="Define se o canal é para receber mensagens (Inbound), enviar mensagens (Outbound), ou ambos (Bidirectional). Relevante para o fluxo de comunicação A2A."
                      htmlFor={`channel-direction-${channel.id}`}
                    >
                      <Select
                        value={channel.direction}
                        onValueChange={(direction) =>
                          handleUpdateChannelDirection(methods, a2aConfig, index, direction as "inbound" | "outbound" | "bidirectional")
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
                    </FormFieldWithTooltip>
                    <FormFieldWithTooltip
                      label="Formato da Mensagem"
                      tooltipText="Formato da mensagem trocada pelo canal. JSON para dados estruturados, Text para texto simples, Binary para formatos customizados. Crucial para a serialização/deserialização no protocolo A2A."
                      htmlFor={`channel-format-${channel.id}`}
                    >
                      <Select
                        value={channel.messageFormat}
                        onValueChange={(messageFormat) =>
                          handleUpdateChannelMessageFormat(methods, a2aConfig, index, messageFormat as "json" | "text" | "binary")
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
                    </FormFieldWithTooltip>
                    <FormFieldWithTooltip
                      label="Modo de Sincronização"
                      tooltipText="Modo de sincronização do canal. 'Sync' para operações bloqueantes onde uma resposta é esperada. 'Async' para operações não bloqueantes. Afeta como o agente lida com o envio/recebimento."
                      htmlFor={`channel-syncmode-${channel.id}`}
                    >
                      <Select
                        value={channel.syncMode}
                        onValueChange={(syncMode) =>
                          handleUpdateChannelSyncMode(methods, a2aConfig, index, syncMode as "sync" | "async")
                        }
                      >
                        <SelectTrigger
                          id={`channel-syncmode-${channel.id}`}
                          className="h-8"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sync">Síncrono (Sync)</SelectItem>
                          <SelectItem value="async">Assíncrono (Async)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormFieldWithTooltip>
                  </div>

                  {channel.syncMode === "sync" && (
                    <div className="grid grid-cols-2 gap-3 mt-3 border-t pt-3">
                      <FormFieldWithTooltip
                        label="Max Retries"
                        tooltipText="Configura a política de novas tentativas para canais síncronos. Define o número máximo de tentativas. Importante para a robustez da comunicação A2A."
                        htmlFor={`channel-retries-${channel.id}`}
                      >
                        <Input
                          id={`channel-retries-${channel.id}`}
                          type="number"
                          placeholder="Ex: 3"
                          value={channel.retryPolicy?.maxRetries ?? ""}
                          onChange={(e) => {
                            const maxRetries = parseInt(e.target.value);
                            handleUpdateChannelRetryPolicy(methods, a2aConfig, index, {
                              ...(channel.retryPolicy || { delayMs: 1000 }),
                              maxRetries: isNaN(maxRetries) ? 0 : maxRetries,
                            });
                          }}
                          className="h-8"
                        />
                      </FormFieldWithTooltip>
                      <FormFieldWithTooltip
                        label="Retry Interval (ms)"
                        tooltipText="Configura a política de novas tentativas para canais síncronos. Define o intervalo entre elas em milissegundos. Importante para a robustez da comunicação A2A."
                        htmlFor={`channel-interval-${channel.id}`}
                      >
                        <Input
                          id={`channel-interval-${channel.id}`}
                          type="number"
                          placeholder="Ex: 1000"
                          value={channel.retryPolicy?.delayMs ?? ""}
                          onChange={(e) => {
                            const delayMs = parseInt(e.target.value);
                            handleUpdateChannelRetryPolicy(methods, a2aConfig, index, {
                              ...(channel.retryPolicy || { maxRetries: 3 }),
                              delayMs: isNaN(delayMs) ? 0 : delayMs,
                            });
                          }}
                          className="h-8"
                        />
                      </FormFieldWithTooltip>
                    </div>
                  )}

                  {channel.messageFormat === "json" && (
                    <div className="mt-3 border-t pt-3">
                      {/* The "Validar JSON" button requires a custom layout not fitting simple FormFieldWithTooltip */}
                      <div className="flex justify-between items-center mb-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Label
                                htmlFor={`channel-schema-${channel.id}`}
                                className="text-xs"
                              >
                                Schema JSON
                              </Label>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Define o esquema JSON para validação de mensagens quando o formato é JSON. Ajuda a garantir a integridade dos dados na comunicação A2A.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => window.open('https://jsonlint.com/', '_blank')}
                        >
                          Validar JSON
                        </Button>
                      </div>
                      <Input // Using Input, but could be Textarea for larger schemas
                        id={`channel-schema-${channel.id}`}
                        placeholder='{"type": "object", "properties": {...}}'
                        value={channel.schema || ""}
                        onChange={(e) =>
                          handleUpdateChannelSchema(methods, a2aConfig, index, e.target.value)
                        }
                        className="h-8 text-xs" // Might want a Textarea for better UX with schemas
                      />
                    </div>
                  )}

                  {(channel.direction === "outbound" ||
                    channel.direction === "bidirectional") && (
                    <div className="mt-3 border-t pt-3">
                      <FormFieldWithTooltip
                        label="Agente Alvo"
                        tooltipText="Seleciona o agente de destino para canais de saída ou bidirecionais. Fundamental para o roteamento de mensagens no A2A."
                        // No htmlFor as SubAgentSelector is a complex component
                      >
                      <SubAgentSelector
                        selectedAgents={
                          channel.targetAgentId ? [channel.targetAgentId] : []
                        }
                        availableAgents={savedAgents}
                        onChange={(selectedIds) => {
                          handleUpdateChannelTargetAgentId(methods, a2aConfig, index, selectedIds[0] || undefined)
                        }}
                      />
                      </FormFieldWithTooltip>
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
              {/* This h4 might also not fit FormFieldWithTooltip, similar to the "Canais de Comunicação" label */}
              <h4 className="text-sm font-medium">Políticas de Comunicação</h4>
            </TooltipTrigger>
            <TooltipContent>
              <p>General rules governing A2A interactions for this agent.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="grid grid-cols-2 gap-4">
          <FormFieldWithTooltip
            label="Formato de Resposta Padrão"
            tooltipText="Default message format this agent uses when responding, if not specified by the channel."
            htmlFor="defaultResponseFormat"
            labelClassName="text-xs"
          >
            <Select
              value={a2aConfig.defaultResponseFormat || "json"}
              onValueChange={(value) =>
                methods.setValue("config.a2a.defaultResponseFormat", value as "json" | "text", { shouldValidate: true, shouldDirty: true })
              }
            >
              <SelectTrigger id="defaultResponseFormat" className="h-8">
                <SelectValue />
              </Trigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="text">Texto</SelectItem>
              </SelectContent>
            </Select>
          </FormFieldWithTooltip>

          <FormFieldWithTooltip
            label="Tamanho Máximo de Mensagem (bytes)"
            tooltipText="Maximum allowed size for a single message to prevent overload."
            htmlFor="maxMessageSize"
            labelClassName="text-xs"
          >
            <Input
              id="maxMessageSize"
              type="number"
              value={a2aConfig.maxMessageSize ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                methods.setValue("config.a2a.maxMessageSize", val ? parseInt(val) : 0, { shouldValidate: true, shouldDirty: true });
              }}
              className="h-8"
            />
          </FormFieldWithTooltip>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="loggingEnabled"
            checked={!!a2aConfig.loggingEnabled}
            onCheckedChange={(checked) =>
              methods.setValue("config.a2a.loggingEnabled", checked, { shouldValidate: true, shouldDirty: true })
            }
          />
          {/* Tooltip for a Switch is a bit different, Label is usually after the Switch. FormFieldWithTooltip expects label first. */}
          {/* Keeping this custom for now. */}
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
