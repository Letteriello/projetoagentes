// ToolCard: Componente para exibir um card individual de ferramenta na aba 'Ferramentas'.
// Responsável por apresentar informações da ferramenta, permitir seleção e acesso à configuração.

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AvailableTool } from '@/types/agent-configs-fixed'; // Corrected path
import type { ToolConfigData } from '@/types/agent-configs-fixed';
import { ArrowUpIcon, ArrowDownIcon, AlertTriangle } from "lucide-react"; // Added AlertTriangle

// Props para o componente ToolCard.
interface ToolCardProps {
  tool: AvailableTool;
  isSelected: boolean;
  onSelectTool: (toolId: string, checked: boolean) => void;
  onConfigureTool: (tool: AvailableTool) => void;
  toolConfig: ToolConfigData | undefined;
  apiKeyRequiredButMissing?: boolean; // New prop
  iconComponents: Record<string, React.FC<React.SVGProps<SVGSVGElement>>>;
  Wand2IconComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  SettingsIconComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  CheckIconComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  isSequentialWorkflow?: boolean;
  onMoveToolUp?: (toolId: string) => void;
  onMoveToolDown?: (toolId: string) => void;
  isFirstTool?: boolean;
  isLastTool?: boolean;
}

const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  isSelected,
  onSelectTool,
  onConfigureTool,
  toolConfig,
  apiKeyRequiredButMissing,
  iconComponents,
  Wand2IconComponent,
  SettingsIconComponent,
  CheckIconComponent,
  isSequentialWorkflow,
  onMoveToolUp,
  onMoveToolDown,
  isFirstTool,
  isLastTool,
}) => {
  const IconToRender = tool.icon ? (iconComponents[tool.icon as string] || Wand2IconComponent) : Wand2IconComponent;
  // hasBeenConfigured should also check if selectedApiKeyId is present if tool requiresAuth
  const hasBeenConfigured = toolConfig && Object.keys(toolConfig).length > 0 && (!tool.requiresAuth || (tool.requiresAuth && toolConfig.selectedApiKeyId));


  return (
    <Card className={cn("flex flex-col justify-between",
                       isSelected ? "border-primary" : "",
                       apiKeyRequiredButMissing && isSelected ? "border-destructive shadow-md shadow-destructive/30" : "")}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center">
            {apiKeyRequiredButMissing && isSelected && <AlertTriangle className="h-4 w-4 text-destructive mr-2" />}
            {tool.label} {/* Use label for display */}
          </span>
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
      <CardFooter className="flex flex-col items-stretch space-y-2">
        {tool.hasConfig ? (
          <Button
            variant={apiKeyRequiredButMissing && isSelected ? "destructive" : "outline"}
            size="sm"
            onClick={() => onConfigureTool(tool)}
            disabled={!isSelected}
            className="w-full"
          >
            {apiKeyRequiredButMissing && isSelected ? <AlertTriangle className="mr-2 h-4 w-4" /> : <SettingsIconComponent className="mr-2 h-4 w-4" />}
            {apiKeyRequiredButMissing && isSelected ? "Chave API Pendente" : "Configurar"}
            {hasBeenConfigured && !apiKeyRequiredButMissing && (
               <CheckIconComponent className="ml-2 h-4 w-4 text-green-500" />
            )}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground italic text-center pb-2">
            {tool.requiresAuth && !isSelected ? "Requer chave API (selecione para configurar)" : "Não requer configuração."}
          </p>
        )}
        {isSequentialWorkflow && onMoveToolUp && onMoveToolDown && isSelected && (
          <div className="flex justify-between space-x-2 pt-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMoveToolUp(tool.id)}
              disabled={isFirstTool}
              aria-label="Mover para cima"
            >
              <ArrowUpIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMoveToolDown(tool.id)}
              disabled={isLastTool}
              aria-label="Mover para baixo"
            >
              <ArrowDownIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ToolCard;
