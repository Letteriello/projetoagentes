"use client";

// ToolConfigModal: Modal para configurar os parâmetros de uma ferramenta específica.
// Este componente encapsula o formulário de configuração que aparece ao clicar em "Configurar" em uma ferramenta.

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button"; // Keep Button
import { Label } from "@/components/ui/label"; // Keep Label for Auth/MCP sections
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Keep Select for Auth/MCP
// Input, Textarea will be used by sub-forms, not directly here unless for common fields.
import { cn } from "@/lib/utils";
import type { AvailableTool, MCPServerConfig, ToolConfigData } from '@/types/tool-types'; // Adjusted ToolConfigData import
import { ApiKeyEntry } from '../../../services/api-key-service'; // Keep for API Key selection
// import { useToast } from "@/hooks/use-toast"; // May not be needed if errors are handled by RHF in sub-forms

// Import individual tool config forms
import WebSearchConfigForm from "./tool-configs/WebSearchConfigForm";
import DatabaseAccessConfigForm from "./tool-configs/DatabaseAccessConfigForm";
import CustomApiIntegrationConfigForm from "./tool-configs/CustomApiIntegrationConfigForm";
import KnowledgeBaseConfigForm from "./tool-configs/KnowledgeBaseConfigForm";
import CalendarAccessConfigForm from "./tool-configs/CalendarAccessConfigForm";
// Assuming Guardrail fields might be needed by some forms, keep Textarea if so.
import { Textarea } from "@/components/ui/textarea";


interface ToolConfigModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  configuringTool: AvailableTool | null;
  // onSave is removed as RHF handles state updates directly. Modal close is handled by onOpenChange.

  // API Key selection props (remain as they are common)
  currentSelectedApiKeyId?: string;
  onApiKeyIdChange: (toolId: string, apiKeyId?: string) => void;
  availableApiKeys: ApiKeyEntry[];

  // MCP Server selection props (remain as they are common)
  mcpServers?: MCPServerConfig[];
  currentSelectedMcpServerId?: string;
  onMcpServerIdChange: (toolId: string, mcpServerId?: string) => void;

  // InfoIcon might still be used for common sections if any, or passed to sub-forms
  InfoIcon?: React.FC<React.SVGProps<SVGSVGElement>>; // Make optional if not always used
}

const ToolConfigModal: React.FC<ToolConfigModalProps> = ({
  isOpen,
  onOpenChange,
  configuringTool,
  // API Key props
  currentSelectedApiKeyId,
  onApiKeyIdChange,
  availableApiKeys,
  // MCP Server props
  mcpServers = [],
  currentSelectedMcpServerId,
  onMcpServerIdChange,
  InfoIcon, // Destructure, but may not be used directly if sub-forms handle their own info icons
}) => {
  // const { toast } = useToast(); // RHF will handle field validation messages

  // Removed handleSave as individual forms update RHF state directly.
  // The main form in AgentBuilderDialog will persist the toolConfigsApplied.

  const renderToolSpecificForm = () => {
    if (!configuringTool) return null;

    const basePath = `toolConfigsApplied.${configuringTool.id}`; // Base path for RHF fields

    // Generic Guardrail props if they are still managed here and passed down
    // For now, assuming guardrail fields are part of each specific form that needs them.
    // If guardrails are truly generic, a separate component might be better.
    // The previous logic had guardrails inside the specific tool sections.
    // So, they should be part of the specific tool forms.

    switch (configuringTool.id) {
      case "google-search": // ID from available-tools.ts
        return <WebSearchConfigForm basePath={basePath} />;
      case "database-connector": // ID from available-tools.ts
        return <DatabaseAccessConfigForm basePath={basePath} />;
      case "openapi-custom": // ID from available-tools.ts
        return <CustomApiIntegrationConfigForm basePath={basePath} />;
      case "knowledge-base-retrieval": // Assuming this is the ID for KnowledgeBase
        return <KnowledgeBaseConfigForm basePath={basePath} />;
      case "calendar-access": // Assuming this is the ID for CalendarAccess
        return <CalendarAccessConfigForm basePath={basePath} />;
      // TODO: Add cases for other tools that need specific config forms
      // e.g. codeExecutor might need guardrails only.
      default:
        // If a tool has `configFields` in its definition but no specific form,
        // one could dynamically generate a form here, or show a message.
        // For now, if no specific form, nothing more is shown beyond auth/MCP.
        if (configuringTool.configFields && configuringTool.configFields.length > 0) {
            return <p className="text-sm text-muted-foreground">No specific UI for this tool's configuration fields yet. Generic fields might be available.</p>;
        }
        return null;
    }
  };

  if (!configuringTool) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Ferramenta: {configuringTool.name}</DialogTitle>
          <DialogDescription>{configuringTool.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Common Auth Section - Stays here */}
          {configuringTool.requiresAuth && (
            <div className="space-y-2 p-3 border rounded-md bg-muted/20">
              <Label htmlFor="apiKeySelect" className="font-semibold">Autenticação via Cofre API</Label>
              <Select
                value={currentSelectedApiKeyId || ""}
                onValueChange={(value: string) => onApiKeyIdChange(configuringTool.id, value)}
              >
                <SelectTrigger id="apiKeySelect">
                  <SelectValue placeholder={"Selecione uma chave API do cofre"} />
                </SelectTrigger>
                <SelectContent>
                  {availableApiKeys
                    .filter(key => key.serviceType === configuringTool.serviceTypeRequired || key.serviceType === "Generic")
                    .map(key => (
                      <SelectItem key={key.id} value={key.id}>
                        {key.serviceName} ({key.serviceType}) - ID: ...{key.id.slice(-6)}
                      </SelectItem>
                    ))}
                  {availableApiKeys.filter(key => key.serviceType === configuringTool.serviceTypeRequired || key.serviceType === "Generic").length === 0 && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhuma chave compatível ({configuringTool.serviceTypeRequired} ou Genérico).
                      {/* TODO: Add a button/link to navigate to API Key Vault management page */}
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecione uma chave API compatível (Tipo: {configuringTool.serviceTypeRequired} ou Genérico).
              </p>
            </div>
          )}

          {/* MCP Server Selection - Stays here if it's common */}
          {configuringTool.isMCPTool && mcpServers && mcpServers.length > 0 && (
            <div className="space-y-2 p-3 border rounded-md bg-muted/20">
              <Label htmlFor="mcpServerSelect" className="font-semibold">Servidor MCP</Label>
              <Select
                value={currentSelectedMcpServerId || ""}
                onValueChange={(value: string) => onMcpServerIdChange(configuringTool.id, value)}
              >
                <SelectTrigger id="mcpServerSelect">
                  <SelectValue placeholder="Selecione um servidor MCP" />
                </SelectTrigger>
                <SelectContent>
                  {mcpServers.map(server => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name} ({server.url})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecione o servidor MCP para esta ferramenta.
              </p>
            </div>
          )}

          {/* Dynamically rendered tool-specific form */}
          {renderToolSpecificForm()}

          {/* Guardrail fields are now expected to be part of the specific forms if needed */}
        </div>
        <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
           {/* The "Save" button now just closes the modal. RHF handles data updates. */}
           <Button onClick={() => onOpenChange(false)}>Aplicar e Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ToolConfigModal;
