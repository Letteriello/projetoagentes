"use client";

import * as React from "react";
import { useState } from "react";
import { ToolsTab } from "@/components/features/agent-builder/tools-tab";
import { allTools } from "./available-tools";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu } from "lucide-react";
import { toast } from "@/hooks/use-toast";

/**
 * Página de teste para o componente ToolsTab
 */
export default function ToolsTabTestPage() {
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([
    "calculator",
    "webSearch",
  ]);

  const [toolConfigs, setToolConfigs] = useState<Record<string, any>>({
    webSearch: {
      googleApiKey: "DEMO_KEY",
      googleCseId: "DEMO_CSE",
    },
  });

  const handleToolSelectionChange = (toolId: string, checked: boolean) => {
    if (checked) {
      setSelectedToolIds((prev) => [...prev, toolId]);
    } else {
      setSelectedToolIds((prev) => prev.filter((id) => id !== toolId));
    }
  };

  const handleConfigureTool = (tool: any) => {
    toast({
      title: `Configurando ferramenta: ${tool.name}`,
      description: "Esta é uma demonstração da funcionalidade de configuração.",
    });
  };

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center gap-3">
        <Cpu className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Teste da Tab Ferramentas</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Seleção de Ferramentas</CardTitle>
            </CardHeader>
            <CardContent>
              <ToolsTab
                availableTools={allTools}
                selectedToolIds={selectedToolIds}
                onToolSelectionChange={handleToolSelectionChange}
                onConfigureTool={handleConfigureTool}
                toolConfigsApplied={toolConfigs}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ferramentas Selecionadas</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedToolIds.length > 0 ? (
                <div className="space-y-2">
                  {selectedToolIds.map((toolId) => {
                    const tool = allTools.find((t) => t.id === toolId);
                    return (
                      <div
                        key={toolId}
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          {tool?.icon}
                          <span>{tool?.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToolSelectionChange(toolId, false)
                          }
                        >
                          Remover
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Nenhuma ferramenta selecionada
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
