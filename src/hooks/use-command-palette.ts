import * as React from 'react';

export interface CommandAction {
  id: string;
  label: string;
  onSelect: () => void;
  icon?: React.ElementType;
  shortcut?: string;
  keywords?: string[];
  section?: string; // Para agrupar comandos
}

// Interface para o estado do hook, embora o estado das ações seja global.
// A interface CommandPaletteState mencionada na descrição não é diretamente usada
// para o estado do React.useState, pois 'actions' vem do store global.
// No entanto, é uma boa representação conceitual do que o sistema gerencia.

// Implementação do store global para ações de comando
// Isso garante que os comandos registrados sejam consistentes em toda a aplicação.
let actionsStore: CommandAction[] = [];
const listeners: Array<(actions: CommandAction[]) => void> = []; // Listeners para atualizações na lista de ações

const store = {
  addCommand: (action: CommandAction) => {
    if (!actionsStore.find(a => a.id === action.id)) {
      actionsStore = [...actionsStore, action];
      // Notifica todos os listeners sobre a mudança nas ações
      listeners.forEach(l => l(actionsStore));
    }
  },
  removeCommand: (actionId: string) => {
    actionsStore = actionsStore.filter(a => a.id !== actionId);
    // Notifica todos os listeners
    listeners.forEach(l => l(actionsStore));
  },
  getActions: (): CommandAction[] => actionsStore,
  subscribe: (listener: (actions: CommandAction[]) => void): (() => void) => {
    listeners.push(listener);
    // Retorna uma função de unsubscribe
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }
};

// Hook para interagir com o estado da paleta de comandos
export function useCommandPalette() {
  // isOpen é específico para cada instância do hook que controla um componente de paleta,
  // mas geralmente haverá apenas um componente de paleta global.
  const [isOpen, setIsOpen] = React.useState(false);
  // registeredActions reflete o actionsStore global.
  const [registeredActions, setRegisteredActions] = React.useState<CommandAction[]>(store.getActions());

  React.useEffect(() => {
    // Se inscreve para atualizações no store de ações quando o componente que usa o hook é montado.
    const unsubscribe = store.subscribe(setRegisteredActions);
    // Limpa a inscrição quando o componente é desmontado.
    return unsubscribe;
  }, []); // Array de dependências vazio garante que isso execute apenas na montagem/desmontagem.

  const openPalette = React.useCallback(() => setIsOpen(true), []);
  const closePalette = React.useCallback(() => setIsOpen(false), []);
  const togglePalette = React.useCallback(() => setIsOpen(prev => !prev), []);

  // Funções para registrar/desregistrar comandos que interagem com o store global.
  // Usar React.useCallback aqui é bom, mas como elas interagem com um store fora de React,
  // o benefício principal é manter referências estáveis se passadas como props.
  const registerCommand = React.useCallback((action: CommandAction) => {
    store.addCommand(action);
  }, []);

  const unregisterCommand = React.useCallback((actionId: string) => {
    store.removeCommand(actionId);
  }, []);

  return {
    isOpen,
    openPalette,
    closePalette,
    togglePalette,
    actions: registeredActions, // Ações atualmente registradas globalmente
    registerCommand,
    unregisterCommand,
  };
}
