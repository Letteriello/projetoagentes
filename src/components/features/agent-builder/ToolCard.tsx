// ToolCard: Componente para exibir um card individual de ferramenta na aba 'Ferramentas'.
// Responsável por apresentar informações da ferramenta, permitir seleção e acesso à configuração.

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AvailableTool } from "@/types/agent-types";
import type { ToolConfigData } from "@/types/agent-configs";

// Props para o componente ToolCard.
interface ToolCardProps {
  tool: AvailableTool;
  isSelected: boolean;
  onSelectTool: (toolId: string, checked: boolean) => void;
  onConfigureTool: (tool: AvailableTool) => void;
  toolConfig: ToolConfigData | undefined;
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>;
  Wand2IconComponent: React.FC<React.SVGProps<SVGSVGElement>>; // Pass Wand2 component itself
  SettingsIconComponent: React.FC<React.SVGProps<SVGSVGElement>>; // Pass Settings component itself
  CheckIconComponent: React.FC<React.SVGProps<SVGSVGElement>>; // Pass Check component itself
}

const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  isSelected,
  onSelectTool,
  onConfigureTool,
  toolConfig,
  iconComponents,
  Wand2IconComponent,
  SettingsIconComponent,
  CheckIconComponent,
}) => {
  const IconToRender = tool.icon ? (iconComponents[tool.icon as string] || Wand2IconComponent) : Wand2IconComponent;
  const hasBeenConfigured = toolConfig && Object.keys(toolConfig).length > 0;

  return (
    <Card className={cn("flex flex-col justify-between", isSelected ? "border-primary" : "")}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          {tool.name}
          <Checkbox
            id={`tool-${tool.id}`}
            checked={isSelected}
            onCheckedChange={(checked) => {
              onSelectTool(tool.id, Boolean(checked));
            }}
          />
        </CardTitle>
        <IconToRender className="h-6 w-6 mb-2 text-primary" />
        <CardDescription className="text-xs">{tool.description}</CardDescription>
      </CardHeader>
      <CardFooter>
        {tool.hasConfig ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onConfigureTool(tool)}
            disabled={!isSelected}
            className="w-full"
          >
            <SettingsIconComponent className="mr-2 h-4 w-4" />
            Configurar
            {hasBeenConfigured && (
               <CheckIconComponent className="ml-2 h-4 w-4 text-green-500" />
            )}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground italic">Não requer configuração.</p>
        )}
      </CardFooter>
    </Card>
  );
};

export default ToolCard;
