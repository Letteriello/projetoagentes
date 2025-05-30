"use client";

import * as React from "react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Ban,
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Cpu,
  FileJson,
  Info,
  Layers,
  ListChecks,
  Loader2,
  Network,
  Plus,
  Save,
  Search,
  Settings,
  Settings2,
  Smile,
  Target,
  Trash2,
  Users,
  Wand2,
  Workflow,
  X,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Importe o componente ToolsTab para a integração
import { ToolsTab } from "./tools-tab";
import { allTools } from "@/app/agent-builder/available-tools";
import { AvailableTool } from "@/types/tool-types";

/**
 * Componente que integra a nova Tab de Ferramentas ao AgentBuilderDialog
 *
 * Esta implementação substitui a seção existente de ferramentas no diálogo
 * do construtor de agentes pela nova interface que separa Tools e MCP Tools.
 */
export const ToolsTabIntegrationFinal: React.FC<{
  availableTools: AvailableTool[];
  currentAgentTools: string[];
  setCurrentAgentTools: React.Dispatch<React.SetStateAction<string[]>>;
  toolConfigurations: Record<string, any>;
  setToolConfigurations: React.Dispatch<
    React.SetStateAction<Record<string, any>>
  >;
  openToolConfigModal: (tool: AvailableTool) => void;
}> = ({
  availableTools,
  currentAgentTools,
  setCurrentAgentTools,
  toolConfigurations,
  setToolConfigurations,
  openToolConfigModal,
}) => {
  // Handler para quando uma ferramenta é selecionada ou deselecionada
  const handleToolSelectionChange = (toolId: string, checked: boolean) => {
    if (checked) {
      if (!currentAgentTools.includes(toolId)) {
        setCurrentAgentTools((prev) => [...prev, toolId]);
      }
    } else {
      setCurrentAgentTools((prev) => prev.filter((id) => id !== toolId));
    }
  };

  // Handler para quando uma ferramenta precisa ser configurada
  const handleConfigureTool = (tool: AvailableTool) => {
    openToolConfigModal(tool);
  };

  return (
    <Card className="border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Wand2 className="mr-2 h-5 w-5 text-primary" />
          Ferramentas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ToolsTab
          availableTools={availableTools || allTools}
          selectedToolIds={currentAgentTools}
          onToolSelectionChange={handleToolSelectionChange}
          onConfigureTool={handleConfigureTool}
          toolConfigsApplied={toolConfigurations}
        />
      </CardContent>
    </Card>
  );
};
