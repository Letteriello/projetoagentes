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
// ScrollArea might be removed or used differently
// import { ScrollArea } from '@/components/ui/scroll-area';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Ensure this type matches the one used in AgentBuilderDialog or relevant parent components
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
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSelect = (agentId: string) => {
    if (disabled) return;

    const newSelection = selectedAgents.includes(agentId)
      ? selectedAgents.filter((id) => id !== agentId)
      : maxSelection === 1
        ? [agentId] // Replace if maxSelection is 1
        : (maxSelection && selectedAgents.length >= maxSelection)
          ? [...selectedAgents.slice(selectedAgents.length - maxSelection + 1), agentId] // Keep last (maxSelection - 1) items and add new one
          : [...selectedAgents, agentId];
    onChange(newSelection);
    // Optionally close popover on select if not multi-selecting rapidly
    // if (maxSelection === 1) setOpen(false);
  };

  const filteredAgents = React.useMemo(() =>
    availableAgents.filter(agent =>
      agent.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.description && agent.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [availableAgents, searchTerm]);

  // Row component for react-window
  const Row = ({ index, style, data }: { index: number; style: React.CSSProperties; data: SavedAgentConfiguration[] }) => {
    const agent = data[index];
    const isSelected = selectedAgents.includes(agent.id);
    const isItemDisabled = disabled || (maxSelection === 1 && selectedAgents.length >=1 && !isSelected) || (maxSelection && selectedAgents.length >= maxSelection && !isSelected && maxSelection > 1) ;


    return (
      <CommandItem
        key={agent.id}
        value={agent.id} // Keep value for Command's internal mechanisms if any, though filtering is manual
        style={style} // Apply the style from react-window
        onSelect={() => { if (!isItemDisabled) { handleSelect(agent.id); } }}
        aria-disabled={isItemDisabled}
        className={cn(
          "flex items-center justify-between w-full", // Ensure full width for proper styling
          isItemDisabled && "opacity-50 cursor-not-allowed",
          isSelected && "font-medium" // Example: highlight selected items
        )}
      >
        <div className="flex items-center">
          <Check
            className={cn(
              'mr-2 h-4 w-4',
              isSelected ? 'opacity-100' : 'opacity-0',
            )}
          />
          <span className="truncate" title={agent.agentName}>{agent.agentName}</span>
        </div>
        {agent.description && (
          <span className="text-xs text-muted-foreground ml-2 truncate" title={agent.description}>
            {agent.description}
          </span>
        )}
      </CommandItem>
    );
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
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" style={{minWidth: '300px'}}>
          {/* Ensure PopoverContent can get a decent width */}
          <Command shouldFilter={false}> {/* Disable Command's internal filtering */}
            <CommandInput
              placeholder="Buscar agente..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandEmpty>{availableAgents.length === 0 ? "Nenhum agente disponível." : "Nenhum agente corresponde à busca."}</CommandEmpty>
            {/*
              The CommandGroup itself might not be strictly necessary if AutoSizer and List are the only children,
              but keeping it for structure or if other Command elements were to be added.
              The height for AutoSizer needs to be explicitly set on a parent or CommandGroup.
            */}
            <CommandGroup style={{ height: '300px', overflow: 'hidden' }}>
              {filteredAgents.length > 0 ? (
                <AutoSizer>
                  {({ height, width }) => (
                    <List
                      height={height}
                      itemCount={filteredAgents.length}
                      itemSize={40} // Adjusted itemSize, measure your CommandItem's actual height
                      width={width}
                      itemData={filteredAgents}
                      overscanCount={5} // Optional: render a few items outside the viewport
                    >
                      {Row}
                    </List>
                  )}
                </AutoSizer>
              ) : (
                !searchTerm && availableAgents.length > 0 && ( // Show this only if no search term and agents are available but filtered list is empty (should not happen with current filter logic)
                     <p className="p-4 text-sm text-muted-foreground">Carregando agentes...</p>
                )
              )}
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
