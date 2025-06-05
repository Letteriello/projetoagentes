"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AvailableTool, MCPServerConfig, ApiKeyEntry, ToolConfigData } from "@/types/tool-types";

interface ToolConfigModalProps {
  name: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  configuringTool: AvailableTool;
  onSave: (toolId: string, configData: ToolConfigData) => void;
  availableApiKeys: ApiKeyEntry[];
  mcpServers: MCPServerConfig[];
  selectedApiKeyId?: string;
}

export default function ToolConfigModal({
  name,
  isOpen,
  onOpenChange,
  configuringTool,
  onSave,
  availableApiKeys,
  mcpServers,
  selectedApiKeyId
}: ToolConfigModalProps) {
  // Estado para armazenar os dados de configuração
  const [configData, setConfigData] = React.useState<ToolConfigData>({
    selectedApiKeyId: selectedApiKeyId || "",
    selectedMcpServerId: "",
    config: {}
  });

  // Efeito para atualizar o estado quando a ferramenta ou chave selecionada mudar
  React.useEffect(() => {
    if (selectedApiKeyId) {
      setConfigData(prev => ({
        ...prev,
        selectedApiKeyId
      }));
    }
  }, [selectedApiKeyId, configuringTool]);

  // Handler para salvar a configuração
  const handleSave = () => {
    onSave(configuringTool.id, configData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configuração de {configuringTool.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {configuringTool.needsApiKey && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">Selecione uma API Key</Label>
              <Select
                value={configData.selectedApiKeyId}
                onValueChange={(value) =>
                  setConfigData({ ...configData, selectedApiKeyId: value })
                }
              >
                <SelectTrigger id="apiKey">
                  <SelectValue placeholder="Selecione uma API Key" />
                </SelectTrigger>
                <SelectContent>
                  {availableApiKeys.map((key) => (
                    <SelectItem key={key.id} value={key.id}>
                      {key.name} ({key.service})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {configuringTool.needsMcpServer && (
            <div className="space-y-2">
              <Label htmlFor="mcpServer">Selecione um Servidor MCP</Label>
              <Select
                value={configData.selectedMcpServerId || ""}
                onValueChange={(value) =>
                  setConfigData({ ...configData, selectedMcpServerId: value })
                }
              >
                <SelectTrigger id="mcpServer">
                  <SelectValue placeholder="Selecione um Servidor MCP" />
                </SelectTrigger>
                <SelectContent>
                  {mcpServers.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar Configuração</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}