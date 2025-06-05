import React, { useState, useEffect, useCallback } from "react";
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
  Wifi,
  WifiOff,
  RefreshCw,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  logA2AMessageEvent,
  logA2AError,
  logA2AStatusChange,
} from "@/lib/logService";

// Extended Channel type for local state, actual type from props remains the same
interface ExtendedCommunicationChannel extends CommunicationChannel {
  // This status would ideally come from parent state / a central store
  // For this exercise, we'll manage a version of it locally
}

type ChannelStatus =
  | "unknown"
  | "connecting"
  | "connected"
  | "unresponsive"
  | "disconnected"
  | "error";

interface CommunicationChannelItemProps {
  channel: ExtendedCommunicationChannel;
  onUpdate: (updated: CommunicationChannel) => void;
  onDelete: () => void;
  availableAgents?: Array<{ id: string; name: string }>;
}

export const CommunicationChannelItem: React.FC<
  CommunicationChannelItemProps
> = ({ channel, onUpdate, onDelete, availableAgents = [] }) => {
  const [status, setStatus] = useState<ChannelStatus>("unknown");
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [unresponsivePings, setUnresponsivePings] = useState(0); // Renamed

  const HEARTBEAT_INTERVAL_MS = 30000; // Renamed
  const PONG_TIMEOUT_MS = 10000; // Renamed
  const MAX_UNRESPONSIVE_PINGS = 3; // Renamed
  const MAX_RECONNECT_ATTEMPTS = 5;

  // --- Heartbeat & Connection Management ---

  const establishConnection = useCallback(() => {
    if (channel.direction === "inbound") {
      setStatus("connected");
      logA2AStatusChange({ channelId: channel.id }, "connected", `Inbound channel ${channel.name} initialized as connected.`);
      return;
    }
    const message = `Attempting initial connection for channel ${channel.name}...`;
    console.log(message);
    logA2AStatusChange({ channelId: channel.id }, "connecting", message);
    setStatus("connecting");

    setTimeout(() => {
      if (Math.random() > 0.2) {
        const successMsg = `Initial connection established for channel ${channel.name}.`;
        console.log(successMsg);
        logA2AStatusChange({ channelId: channel.id }, "connected", successMsg);
        setStatus("connected");
        setReconnectAttempts(0);
        setUnresponsivePings(0);
      } else {
        const failMsg = `Initial connection failed for channel ${channel.name}.`;
        console.warn(failMsg);
        logA2AError('a2a_connection_error', { channelId: channel.id }, failMsg);
        setStatus("disconnected");
      }
    }, 1500);
  }, [channel.name, channel.direction, channel.id]);

  const handlePingTimeout = useCallback(() => {
    const msg = `PONG timeout for channel ${channel.name}. Channel unresponsive.`;
    console.warn(msg);
    // Log error before changing status potentially leading to disconnect
    logA2AError('a2a_connection_error', { channelId: channel.id }, msg, { unresponsivePings: unresponsivePings + 1 });
    setUnresponsivePings((prev) => {
      const newUnresponsiveCount = prev + 1;
      if (newUnresponsiveCount >= MAX_UNRESPONSIVE_PINGS) {
        const errMsg = `Channel ${channel.name} disconnected after ${MAX_UNRESPONSIVE_PINGS} unresponsive pings.`;
        console.error(errMsg);
        logA2AStatusChange({ channelId: channel.id }, "disconnected", errMsg, { finalUnresponsivePings: newUnresponsiveCount });
        setStatus("disconnected");
        return 0;
      } else {
        logA2AStatusChange({ channelId: channel.id }, "unresponsive", `Channel ${channel.name} unresponsive, attempt ${newUnresponsiveCount}/${MAX_UNRESPONSIVE_PINGS}.`);
        setStatus("unresponsive");
        return newUnresponsiveCount;
      }
    });
  }, [channel.name, channel.id, unresponsivePings]); // Added channel.id and unresponsivePings

  const sendPingWithPongDetection = useCallback(() => {
    if (status !== "connected") return;
    const pingMsg = `Sending PING to channel ${channel.name}.`;
    console.log(pingMsg);
    logA2AMessageEvent('a2a_heartbeat_ping', { channelId: channel.id, targetAgentId: channel.targetAgentId }, pingMsg);

    const pongTimer = setTimeout(handlePingTimeout, PONG_TIMEOUT_MS);
    // Store clear function globally for simulation; in real scenario, event driven from comms layer
    (window as any)[`clearPongTimer_${channel.id}`] = () => clearTimeout(pongTimer);

  }, [status, channel.name, channel.id, handlePingTimeout, channel.targetAgentId]); // Added channel.targetAgentId

  const onPongReceived = useCallback(() => {
    const pongMsg = `PONG received from channel ${channel.name}.`;
    console.log(pongMsg);
    logA2AMessageEvent('a2a_heartbeat_pong', { channelId: channel.id, sourceAgentId: channel.targetAgentId }, pongMsg);
    if ((window as any)[`clearPongTimer_${channel.id}`]) {
      (window as any)[`clearPongTimer_${channel.id}`]();
      delete (window as any)[`clearPongTimer_${channel.id}`];
    }
    if (status === "unresponsive" || status === "connected") { // Check if it was unresponsive before
      if(status === "unresponsive"){
         logA2AStatusChange({ channelId: channel.id }, "connected", `Channel ${channel.name} is responsive again.`);
      }
      setStatus("connected");
      setUnresponsivePings(0);
    }
  }, [channel.name, channel.id, status, channel.targetAgentId]); // Added channel.targetAgentId

  const attemptReconnection = useCallback(() => {
    if (channel.direction === "inbound") return;

    const currentAttempt = reconnectAttempts + 1;
    if (currentAttempt > MAX_RECONNECT_ATTEMPTS) {
      const maxAttemptsMsg = `Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached for channel ${channel.name}. Channel in error state.`;
      console.error(maxAttemptsMsg);
      logA2AError('a2a_connection_error', { channelId: channel.id }, maxAttemptsMsg, { reconnectAttempts: MAX_RECONNECT_ATTEMPTS });
      setStatus("error");
      return;
    }

    const reconMsg = `Attempting to reconnect channel ${channel.name} (${currentAttempt}/${MAX_RECONNECT_ATTEMPTS})...`;
    console.log(reconMsg);
    logA2AStatusChange({ channelId: channel.id }, "connecting", reconMsg, { currentAttempt });
    setStatus("connecting");

    setTimeout(() => {
      if (Math.random() > 0.3) {
        const successMsg = `Channel ${channel.name} reconnected successfully on attempt ${currentAttempt}.`;
        console.log(successMsg);
        logA2AStatusChange({ channelId: channel.id }, "connected", successMsg, { attemptsMade: currentAttempt });
        setStatus("connected");
        setReconnectAttempts(0);
        setUnresponsivePings(0);
      } else {
        const failMsg = `Reconnect attempt ${currentAttempt} failed for channel ${channel.name}.`;
        console.warn(failMsg);
        setReconnectAttempts(currentAttempt); // Update before logging error or setting status for next attempt
        if (currentAttempt >= MAX_RECONNECT_ATTEMPTS) {
          const maxAttemptsErrorMsg = `Max reconnection attempts reached for channel ${channel.name} after final attempt failed.`;
          console.error(maxAttemptsErrorMsg);
          logA2AError('a2a_connection_error', { channelId: channel.id }, maxAttemptsErrorMsg, { reconnectAttempts: currentAttempt });
          setStatus("error");
        } else {
          logA2AError('a2a_connection_error', { channelId: channel.id }, failMsg, { currentAttempt });
          setStatus("disconnected");
        }
      }
    }, 2000 + Math.random() * 1000);
  }, [channel.name, reconnectAttempts, channel.direction, channel.id]);

  // Initial connection attempt
  useEffect(() => {
    // For inbound channels, set as connected and do nothing else.
    // For others, attempt to establish connection.
    if (channel.direction === "inbound") {
      setStatus("connected");
    } else {
      establishConnection();
    }
  }, [establishConnection, channel.direction]); // Added channel.direction

  // Heartbeat interval
  useEffect(() => {
    let heartbeatTimerId: NodeJS.Timeout | undefined;
    if (status === "connected" && (channel.direction === "outbound" || channel.direction === "bidirectional")) {
      heartbeatTimerId = setInterval(sendPingWithPongDetection, HEARTBEAT_INTERVAL_MS);
    }
    return () => {
      clearInterval(heartbeatTimerId);
      if ((window as any)[`clearPongTimer_${channel.id}`]) { // Clean up any pending specific pong timer
         (window as any)[`clearPongTimer_${channel.id}`]();
         delete (window as any)[`clearPongTimer_${channel.id}`];
      }
    };
  }, [status, channel.direction, sendPingWithPongDetection, channel.id]);

  // Reconnection logic
  useEffect(() => {
    let reconnectSchedulerTimerId: NodeJS.Timeout | undefined;
    if (status === "disconnected" &&
        (channel.direction === "outbound" || channel.direction === "bidirectional") &&
        reconnectAttempts < MAX_RECONNECT_ATTEMPTS) { // check direction here too
      const backoffDelay = Math.pow(2, reconnectAttempts) * 1000;
      console.log(`[${channel.name}] Scheduling reconnect in ${backoffDelay / 1000}s`);
      reconnectSchedulerTimerId = setTimeout(attemptReconnection, backoffDelay);
    }
    return () => {
      clearTimeout(reconnectSchedulerTimerId);
    };
  }, [status, reconnectAttempts, channel.direction, attemptReconnection, channel.name]);


  // --- UI ---
  const getStatusIndicator = () => {
    switch (status) {
      case "connected":
        return <Wifi className="h-4 w-4 text-green-500" title="Connected" />;
      case "connecting":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" title="Connecting..." />;
      case "unresponsive":
        return <WifiOff className="h-4 w-4 text-yellow-500" title="Unresponsive" />;
      case "disconnected":
        return <WifiOff className="h-4 w-4 text-red-500" title="Disconnected" />;
      case "error":
        return <HelpCircle className="h-4 w-4 text-red-700" title={`Error - Max reconnects reached (${MAX_RECONNECT_ATTEMPTS})`} />;
      default: // unknown
        return <HelpCircle className="h-4 w-4 text-gray-400" title="Unknown status" />;
    }
  };

  const isChannelInteractive = status === "connected" || status === "unknown" || status === "unresponsive";


  return (
    <div className="border rounded-md p-3 space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {getStatusIndicator()}
          {/* Direction icon */}
          {channel.direction === "inbound" && <ArrowDownLeft className="h-4 w-4 text-blue-500" />}
          {channel.direction === "outbound" && <ArrowUpRight className="h-4 w-4 text-green-500" />}
          {channel.direction === "bidirectional" && <ArrowLeftRight className="h-4 w-4 text-purple-500" />}

          <Input
            value={channel.name}
            onChange={(e) => onUpdate({ ...channel, name: e.target.value })}
            className="h-7 w-40 text-sm"
            placeholder="Nome do canal"
            // Disable input if channel is not interactive, unless it's an inbound channel (which is always passive)
            disabled={!isChannelInteractive && channel.direction !== "inbound"}
          />
        </div>
        <div className="flex items-center gap-1">
          {/* Show reconnect button only if disconnected, not maxed out attempts, and not an inbound channel */}
          {status === "disconnected" &&
           reconnectAttempts < MAX_RECONNECT_ATTEMPTS &&
           channel.direction !== "inbound" && (
            <Button variant="outline" size="sm" onClick={attemptReconnection} className="h-7 text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              Reconnect
            </Button>
          )}
          {/* Show error badge if in error state and not an inbound channel */}
           {status === "error" && channel.direction !== "inbound" && (
             <Badge variant="destructive" className="text-xs">Error</Badge>
           )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Delete Channel"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Button to manually simulate Pong for testing */}
      { (status === "connected" || status === "unresponsive") && channel.direction !== "inbound" && (
        <Button size="sm" onClick={onPongReceived} className="my-1 hidden">Simulate Pong for {channel.name}</Button>
      )}


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
              disabled={!isChannelInteractive && channel.direction !== "inbound"}
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
            disabled={!isChannelInteractive && channel.direction !== "inbound"}
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
            disabled={!isChannelInteractive && channel.direction !== "inbound"}
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
              disabled={!isChannelInteractive && channel.direction !== "inbound"}
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
            disabled={!isChannelInteractive && channel.direction !== "inbound"}
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
            disabled={!isChannelInteractive && channel.direction !== "inbound"}
          />
        </div>
      )}
    </div>
  );
};
