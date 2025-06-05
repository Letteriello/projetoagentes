"use client";

import * as React from "react";
import { useState } from "react";
import ToolsTab from "@/components/features/agent-builder/ToolsTab";
import { availableTools as allTools } from "@/data/available-tools";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AvailableTool, ToolConfigData } from '@/types/agent-configs-fixed'; // Import AvailableTool and ToolConfigData
import { Cpu, Wand2, Settings, CheckCircle, AlertTriangle } from "lucide-react"; // Importando ícones necessários
import { toast } from "@/hooks/use-toast";

/**
 * Página de teste para o componente ToolsTab
 */
export default function ToolsTabTestPage() {
  const [selectedTools, setSelectedTools] = useState<string[]>([
    "calculator",
    "webSearch",
  ]);

  const [toolConfigurations, setToolConfigurations] = useState<Record<string, ToolConfigData>>({ // Use ToolConfigData
    webSearch: { // This structure should be compatible with ToolConfigData for webSearch
      googleApiKey: "DEMO_KEY",
      googleCseId: "DEMO_CSE",
    },
    // If other tools were in toolConfigs, their structure should also match ToolConfigData
  });

  // Adaptador de função para compatibilidade com a interface do componente
  const handleToolConfigure = (tool: AvailableTool) => { // Use AvailableTool type
    toast({
      title: `Configurando ferramenta: ${tool.name}`, // tool.name is valid for AvailableTool
      description: "Esta é uma demonstração da funcionalidade de configuração.",
    });
  };
  
  // Criando mock dos componentes de ícones necessários
  const iconComponents = {
    Wand2: (props: React.SVGProps<SVGSVGElement>) => <Wand2 {...props} />,
    Settings: (props: React.SVGProps<SVGSVGElement>) => <Settings {...props} />,
    CheckCircle: (props: React.SVGProps<SVGSVGElement>) => <CheckCircle {...props} />,
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
                selectedTools={selectedTools}
                setSelectedTools={setSelectedTools}
                toolConfigurations={toolConfigurations}
                handleToolConfigure={handleToolConfigure}
                iconComponents={iconComponents}
                Wand2Icon={Wand2}
                SettingsIcon={Settings}
                CheckIcon={CheckCircle}
                AlertIcon={AlertTriangle}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Ferramentas Selecionadas ({selectedTools.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTools.length > 0 ? (
                <div className="space-y-2">
                  {selectedTools.map((toolId) => {
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
                            setSelectedTools((prev) => prev.filter((id) => id !== toolId))
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
