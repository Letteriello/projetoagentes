"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { ToolsTab } from "./tools-tab";
import { allTools } from "@/app/agent-builder/available-tools";
import { AvailableTool } from "@/types/tool-types";

// Tipos e importações adicionais necessários para a integração
// Estes serão utilizados para adaptar o componente ToolsTab à estrutura existente
export interface ToolTabIntegrationProps {
  availableTools: AvailableTool[];
  selectedToolIds: string[];
  onToolSelectionChange: (toolId: string, checked: boolean) => void;
  onConfigureTool: (tool: AvailableTool) => void;
  toolConfigsApplied?: Record<string, any>;
}

/**
 * Componente de integração para a Tab de Ferramentas
 * Este componente serve como adaptador entre o componente ToolsTab e o AgentBuilderDialog
 */
export const ToolTabIntegration: React.FC<ToolTabIntegrationProps> = ({
  availableTools,
  selectedToolIds,
  onToolSelectionChange,
  onConfigureTool,
  toolConfigsApplied = {},
}) => {
  return (
    <div className="space-y-4">
      <ToolsTab
        availableTools={availableTools}
        selectedToolIds={selectedToolIds}
        onToolSelectionChange={onToolSelectionChange}
        onConfigureTool={onConfigureTool}
        toolConfigsApplied={toolConfigsApplied}
      />
    </div>
  );
};
