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
import { CommunicationChannel } from "@/types/a2a-types";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Trash2,
} from "lucide-react";

interface CommunicationChannelItemProps {
  channel: CommunicationChannel;
  onUpdate: (updated: CommunicationChannel) => void;
  onDelete: () => void;
  availableAgents?: Array<{ id: string; name: string }>;
}

export const CommunicationChannelItem: React.FC<
  CommunicationChannelItemProps
> = ({ channel, onUpdate, onDelete, availableAgents = [] }) => {
  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {channel.direction === "inbound" && (
            <ArrowDownLeft className="h-4 w-4 text-blue-500" />
          )}
          {channel.direction === "outbound" && (
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          )}
          {channel.direction === "bidirectional" && (
            <ArrowLeftRight className="h-4 w-4 text-purple-500" />
          )}
          <Input
            value={channel.name}
            onChange={(e) => onUpdate({ ...channel, name: e.target.value })}
            className="h-7 w-40 text-sm"
            placeholder="Nome do canal"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label
            htmlFor={`channel-direction-${channel.id}`}
            className="text-xs"
          >
            Direção
          </Label>
          <Select
            value={channel.direction}
            onValueChange={(value) =>
              onUpdate({
                ...channel,
                direction: value as "inbound" | "outbound" | "bidirectional",
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
              <SelectItem value="inbound">Entrada (Recebe)</SelectItem>
              <SelectItem value="outbound">Saída (Envia)</SelectItem>
              <SelectItem value="bidirectional">Bidirecional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor={`channel-format-${channel.id}`} className="text-xs">
            Formato
          </Label>
          <Select
            value={channel.messageFormat}
            onValueChange={(value) =>
              onUpdate({
                ...channel,
                messageFormat: value as "json" | "text" | "binary",
              })
            }
          >
            <SelectTrigger id={`channel-format-${channel.id}`} className="h-8">
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`channel-sync-${channel.id}`} className="text-xs">
            Modo de Sincronização
          </Label>
          <Select
            value={channel.syncMode}
            onValueChange={(value) =>
              onUpdate({ ...channel, syncMode: value as "sync" | "async" })
            }
          >
            <SelectTrigger id={`channel-sync-${channel.id}`} className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sync">Síncrono (Espera resposta)</SelectItem>
              <SelectItem value="async">Assíncrono (Não espera)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {channel.syncMode === "sync" && (
          <div>
            <Label
              htmlFor={`channel-timeout-${channel.id}`}
              className="text-xs"
            >
              Timeout (ms)
            </Label>
            <Input
              id={`channel-timeout-${channel.id}`}
              type="number"
              value={channel.timeout || ""}
              onChange={(e) =>
                onUpdate({
                  ...channel,
                  timeout: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="h-8"
              placeholder="ex: 5000"
            />
          </div>
        )}
      </div>

      {(channel.direction === "outbound" ||
        channel.direction === "bidirectional") && (
        <div>
          <Label htmlFor={`channel-target-${channel.id}`} className="text-xs">
            Agente Alvo
          </Label>
          <Select
            value={channel.targetAgentId || ""}
            onValueChange={(value) =>
              onUpdate({ ...channel, targetAgentId: value || undefined })
            }
          >
            <SelectTrigger id={`channel-target-${channel.id}`} className="h-8">
              <SelectValue placeholder="Selecione um agente alvo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Qualquer agente</SelectItem>
              {availableAgents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {channel.messageFormat === "json" && (
        <div>
          <Label htmlFor={`channel-schema-${channel.id}`} className="text-xs">
            Schema JSON (opcional)
          </Label>
          <Input
            id={`channel-schema-${channel.id}`}
            value={channel.schema || ""}
            onChange={(e) =>
              onUpdate({ ...channel, schema: e.target.value || undefined })
            }
            className="h-8"
            placeholder="ex: { 'type': 'object', 'properties': {...} }"
          />
        </div>
      )}
    </div>
  );
};
