// ToolsTab: Componente para a aba 'Ferramentas' do diálogo de criação de agentes.
// Exibe uma lista de ferramentas disponíveis, permitindo seleção e configuração.

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TabsContent } from "@/components/ui/tabs"; // Needed for the root element
import ToolCard from "./ToolCard";
import type { AvailableTool } from "@/types/agent-types";
import type { ToolConfigData } from '@/types/agent-configs-fixed';
import type { MCPServerConfig } from '@/types/mcp-types'; // Import MCPServerConfig

// Props para o componente ToolsTab.
interface ToolsTabProps {
  availableTools: AvailableTool[];
  mcpServers?: MCPServerConfig[]; // Add mcpServers prop
  selectedTools: string[];
  setSelectedTools: React.Dispatch<React.SetStateAction<string[]>>;
  toolConfigurations: Record<string, ToolConfigData>; // This should now potentially include selectedMcpServerId
  handleToolConfigure: (tool: AvailableTool) => void;
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>;
  Wand2Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  CheckIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  AlertIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  isSequentialWorkflow?: boolean;
}

// Tipos úteis para a funcionalidade expandida
interface ToolFilters {
  configurable: boolean;
  requiresAuth: boolean;
}

const ToolsTab: React.FC<ToolsTabProps> = ({
  availableTools,
  mcpServers = [], // Destructure mcpServers com valor padrão
  selectedTools,
  setSelectedTools,
  toolConfigurations,
  handleToolConfigure,
  iconComponents,
  Wand2Icon,
  SettingsIcon,
  CheckIcon,
  AlertIcon,
  isSequentialWorkflow,
}) => {
  // Estado para pesquisa e filtros (compatibilidade com a implementação expandida)
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ToolFilters>({
    configurable: false,
    requiresAuth: false,
  });
  
  const handleSelectTool = (toolId: string, checked: boolean) => {
    setSelectedTools((prevSelectedTools: string[]) => {
      if (checked) {
        // Add tool to the end of the list if not already present
        return prevSelectedTools.includes(toolId) ? prevSelectedTools : [...prevSelectedTools, toolId];
      } else {
        // Remove tool and its configuration if it exists
        // Note: toolConfigurations are handled in the main form, this just updates the ID list
        return prevSelectedTools.filter(id => id !== toolId);
      }
    });
  };

  const handleMoveToolUp = (toolId: string) => {
    setSelectedTools((prevSelectedTools) => {
      const index = prevSelectedTools.indexOf(toolId);
      if (index > 0) {
        const newSelectedTools = [...prevSelectedTools];
        [newSelectedTools[index - 1], newSelectedTools[index]] = [newSelectedTools[index], newSelectedTools[index - 1]];
        return newSelectedTools;
      }
      return prevSelectedTools;
    });
  };

  const handleMoveToolDown = (toolId: string) => {
    setSelectedTools((prevSelectedTools) => {
      const index = prevSelectedTools.indexOf(toolId);
      if (index < prevSelectedTools.length - 1 && index !== -1) {
        const newSelectedTools = [...prevSelectedTools];
        [newSelectedTools[index + 1], newSelectedTools[index]] = [newSelectedTools[index], newSelectedTools[index + 1]];
        return newSelectedTools;
      }
      return prevSelectedTools;
    });
  };

  // Implementação simplificada para manter compatibilidade com testes
  // Display selected tools first, in their selected order, then unselected tools
  const sortedTools = React.useMemo(() => {
    const selectedToolObjects = selectedTools.map(id => availableTools.find(tool => tool.id === id)).filter(Boolean) as AvailableTool[];
    const unselectedToolObjects = availableTools.filter(tool => !selectedTools.includes(tool.id));
    return [...selectedToolObjects, ...unselectedToolObjects];
  }, [availableTools, selectedTools]);


  return (
    <TabsContent value="tools" className="space-y-6 mt-4">
      <Alert>
        <AlertIcon className="h-4 w-4" />
        <AlertTitle>Gerenciamento de Ferramentas</AlertTitle>
        <AlertDescription>
          Selecione as ferramentas que este agente poderá utilizar. Algumas ferramentas podem requerer configuração adicional clicando em 'Configurar'.
          {isSequentialWorkflow && " Para workflows sequenciais, a ordem das ferramentas selecionadas é importante e pode ser ajustada usando os botões de mover."}
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTools.map((tool) => {
          const isSelected = selectedTools.includes(tool.id);
          // Determine if the tool is the first or last *among selected tools* for enabling/disabling move buttons
          // This only matters if the workflow is sequential and the tool is selected.
          let isFirstSelectedTool = false;
          let isLastSelectedTool = false;

          if (isSequentialWorkflow && isSelected) {
            const selectedToolIndex = selectedTools.indexOf(tool.id);
            isFirstSelectedTool = selectedToolIndex === 0;
            isLastSelectedTool = selectedToolIndex === selectedTools.length - 1;
          }

          const apiKeyRequiredButMissing = tool.requiresAuth && !toolConfigurations[tool.id]?.selectedApiKeyId;

          return (
            <ToolCard
              key={tool.id}
              tool={tool}
              isSelected={isSelected}
              onSelectTool={handleSelectTool}
              onConfigureTool={handleToolConfigure}
              toolConfig={toolConfigurations[tool.id]}
              apiKeyRequiredButMissing={apiKeyRequiredButMissing}
              iconComponents={iconComponents}
              Wand2IconComponent={Wand2Icon}
              SettingsIconComponent={SettingsIcon}
              CheckIconComponent={CheckIcon}
              isSequentialWorkflow={isSequentialWorkflow && isSelected} // Pass only if selected in sequential
              onMoveToolUp={isSequentialWorkflow && isSelected ? handleMoveToolUp : undefined}
              onMoveToolDown={isSequentialWorkflow && isSelected ? handleMoveToolDown : undefined}
              isFirstTool={isFirstSelectedTool}
              isLastTool={isLastSelectedTool}
              data-testid="tool-card" // Adicionando este atributo para facilitar testes
            />
          );
        })}
      </div>
      {availableTools.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">Nenhuma ferramenta disponível no momento.</p>
      )}
    </TabsContent>
  );
};

export default ToolsTab;
