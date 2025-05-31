"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Code,
  XCircle,
  ChevronRight,
  ChevronDown,
  Bug,
  Activity,
  History,
  Tool,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EventDebugPanelProps {
  events: any[];
  sessionState: Record<string, any>;
  isVisible: boolean;
  onClose: () => void;
}

export function EventDebugPanel({
  events = [],
  sessionState = {},
  isVisible,
  onClose,
}: EventDebugPanelProps) {
  const [activeTab, setActiveTab] = useState("events");

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-0 left-0 right-0 h-64 md:h-96 z-50 shadow-xl border-t-2 border-primary">
      <div className="flex items-center justify-between bg-muted p-2">
        <div className="flex items-center space-x-2">
          <Bug className="h-4 w-4" />
          <h3 className="font-medium text-sm">Debug Panel</h3>
          <Badge variant="outline" className="text-xs">
            Genkit
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XCircle className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="px-4 pt-2">
          <TabsTrigger value="events" className="flex items-center gap-1">
            <Activity className="h-3.5 w-3.5" />
            <span>Eventos</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {events.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="state" className="flex items-center gap-1">
            <History className="h-3.5 w-3.5" />
            <span>Estado</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-1">
            <Tool className="h-3.5 w-3.5" />
            <span>Ferramentas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="events"
          className="overflow-hidden h-[calc(100%-80px)]"
        >
          <ScrollArea className="h-full p-4">
            <div className="space-y-2">
              {events.length > 0 ? (
                events.map((event, index) => (
                  <EventItem
                    key={index}
                    event={event}
                    index={events.length - index}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Nenhum evento registrado
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="state"
          className="overflow-hidden h-[calc(100%-80px)]"
        >
          <ScrollArea className="h-full p-4">
            <pre className="text-xs whitespace-pre-wrap bg-muted p-4 rounded-md">
              {JSON.stringify(sessionState, null, 2)}
            </pre>
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="tools"
          className="overflow-hidden h-[calc(100%-80px)]"
        >
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              <h4 className="font-medium">Ferramentas Ativas</h4>
              {sessionState.tools && sessionState.tools.length > 0 ? (
                sessionState.tools.map((tool: any, index: number) => (
                  <Collapsible key={index} className="border rounded-md">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-sm">
                      <div className="flex items-center">
                        <Code className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          {tool.name || `Ferramenta ${index + 1}`}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 transition-transform ui-expanded:rotate-90" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="p-3 pt-0 text-xs bg-muted/50">
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(tool, null, 2)}
                        </pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
              ) : (
                <div className="text-muted-foreground">
                  Nenhuma ferramenta ativa
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

interface EventItemProps {
  event: any;
  index: number;
}

function EventItem({ event, index }: EventItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Determinar a cor com base no tipo de evento
  const getEventColor = () => {
    switch (event.type) {
      case "error":
        return "bg-red-500";
      case "tool":
        return "bg-blue-500";
      case "model":
        return "bg-purple-500";
      case "user":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Formato simplificado do timestamp
  const formattedTime = event.timestamp
    ? new Date(event.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "";

  return (
    <div className="border rounded-md overflow-hidden">
      <div
        className="flex items-center cursor-pointer p-2 bg-muted/50 hover:bg-muted"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={cn("w-3 h-3 rounded-full mr-2", getEventColor())} />
        <div className="text-xs text-muted-foreground mr-2">#{index}</div>
        <div className="flex-1 font-medium text-sm truncate">
          {event.type} {event.id && `(${event.id.substring(0, 8)})`}
        </div>
        {formattedTime && (
          <div className="text-xs text-muted-foreground mx-2">
            {formattedTime}
          </div>
        )}
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </div>

      {isExpanded && (
        <div className="p-3 text-xs bg-muted/30">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(event, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
