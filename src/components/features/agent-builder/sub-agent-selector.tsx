"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

// Importamos apenas o tipo SavedAgentConfiguration, sem precisar criar uma dependência circular
type SavedAgentConfiguration = {
  id: string;
  agentName: string;
  [key: string]: any;
};

interface SubAgentSelectorProps {
  selectedAgents: string[];
  availableAgents: SavedAgentConfiguration[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function SubAgentSelector({
  selectedAgents,
  availableAgents,
  onChange,
  disabled = false,
}: SubAgentSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (agentId: string) => {
    const newSelection = selectedAgents.includes(agentId)
      ? selectedAgents.filter((id) => id !== agentId)
      : [...selectedAgents, agentId];
    onChange(newSelection);
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedAgents.length > 0 ? (
          selectedAgents.map((agentId) => {
            const agent = availableAgents.find((a) => a.id === agentId);
            return (
              <Badge
                key={agentId}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {agent?.agentName || "Agente não encontrado"}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => handleSelect(agentId)}
                  disabled={disabled}
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="sr-only">Remover</span>
                </Button>
              </Badge>
            );
          })
        ) : (
          <div className="text-sm text-muted-foreground italic">
            Nenhum sub-agente selecionado
          </div>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span>Selecionar sub-agentes</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Buscar agente..." />
            <CommandEmpty>Nenhum agente encontrado.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-[300px]">
                {availableAgents.map((agent) => (
                  <CommandItem
                    key={agent.id}
                    value={agent.id}
                    onSelect={() => handleSelect(agent.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedAgents.includes(agent.id)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {agent.agentName}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
