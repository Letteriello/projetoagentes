// ToolsTab: Componente para a aba 'Ferramentas' do diálogo de criação de agentes.
// Exibe uma lista de ferramentas disponíveis, permitindo seleção e configuração.

import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TabsContent } from "@/components/ui/tabs"; // Needed for the root element
import ToolCard from "./ToolCard";
import type { AvailableTool } from "@/types/agent-types";
import type { ToolConfigData } from "@/types/agent-configs";

// Props para o componente ToolsTab.
interface ToolsTabProps {
  availableTools: AvailableTool[];
  selectedTools: string[];
  setSelectedTools: React.Dispatch<React.SetStateAction<string[]>>; // Allows direct update of selected tools
  toolConfigurations: Record<string, ToolConfigData>;
  handleToolConfigure: (tool: AvailableTool) => void; // Function to open configuration modal
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>;
  Wand2Icon: React.FC<React.SVGProps<SVGSVGElement>>; // Actual Wand2 component
  SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>>; // Actual Settings component
  CheckIcon: React.FC<React.SVGProps<SVGSVGElement>>; // Actual Check component
  AlertIcon: React.FC<React.SVGProps<SVGSVGElement>>; // Icon for the Alert (e.g., Wand2)
}

const ToolsTab: React.FC<ToolsTabProps> = ({
  availableTools,
  selectedTools,
  setSelectedTools,
  toolConfigurations,
  handleToolConfigure,
  iconComponents,
  Wand2Icon,
  SettingsIcon,
  CheckIcon,
  AlertIcon,
}) => {
  const handleSelectTool = (toolId: string, checked: boolean) => {
    setSelectedTools((prev: string[]) =>
      checked ? [...prev, toolId] : prev.filter(id => id !== toolId)
    );
  };

  return (
    <TabsContent value="tools" className="space-y-6 mt-4">
      <Alert>
        <AlertIcon className="h-4 w-4" />
        <AlertTitle>Gerenciamento de Ferramentas</AlertTitle>
        <AlertDescription>
          Selecione as ferramentas que este agente poderá utilizar. Algumas ferramentas podem requerer configuração adicional clicando em 'Configurar'.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableTools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            isSelected={selectedTools.includes(tool.id)}
            onSelectTool={handleSelectTool}
            onConfigureTool={handleToolConfigure}
            toolConfig={toolConfigurations[tool.id]}
            iconComponents={iconComponents}
            Wand2IconComponent={Wand2Icon} // Pass the component itself
            SettingsIconComponent={SettingsIcon} // Pass the component itself
            CheckIconComponent={CheckIcon} // Pass the component itself
          />
        ))}
      </div>
      {availableTools.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">Nenhuma ferramenta disponível no momento.</p>
      )}
    </TabsContent>
  );
};

export default ToolsTab;
