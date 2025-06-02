'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

type SavedAgentConfiguration = {
  id: string;
  agentName: string;
  description?: string;
  config?: Record<string, unknown>;
};

interface SubAgentSelectorProps {
  selectedAgents: string[];
  availableAgents: SavedAgentConfiguration[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  maxSelection?: number;
}

export function SubAgentSelector({
  selectedAgents,
  availableAgents,
  onChange,
  disabled = false,
  maxSelection,
}: SubAgentSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (agentId: string) => {
    if (disabled) return;
    
    const newSelection = selectedAgents.includes(agentId)
      ? selectedAgents.filter((id) => id !== agentId)
      : maxSelection && selectedAgents.length >= maxSelection
        ? [...selectedAgents.slice(1), agentId]
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
                {agent?.agentName || 'Agente não encontrado'}
                <Button
                  variant="ghost"
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
            disabled={disabled || (typeof maxSelection === 'number' && selectedAgents.length >= maxSelection)}
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
                    onSelect={() => { if (!disabled) { handleSelect(agent.id); } }}
                    aria-disabled={disabled}
                    className={cn(disabled && "opacity-50 cursor-not-allowed")}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedAgents.includes(agent.id)
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                    {agent.agentName}
                    {agent.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {agent.description}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {maxSelection && (
        <div className="text-xs text-muted-foreground">
          Máximo de {maxSelection} sub-agente(s) permitido(s)
        </div>
      )}
    </div>
  );
}
