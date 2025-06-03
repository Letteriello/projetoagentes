// MultiAgentTab: Componente para a aba 'Multi-Agente'.
// Permite configurar o papel do agente em sistemas com múltiplos agentes,
// como definir se é um agente raiz e gerenciar seus sub-agentes.

import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs"; // Needed for the root element
import type { SavedAgentConfiguration } from '@/types/agent-configs-fixed';

// Props para o componente MultiAgentTab.
interface MultiAgentTabProps {
  isRootAgent: boolean;
  setIsRootAgent: (isRoot: boolean) => void;
  subAgentIds: string[];
  setSubAgentIds: React.Dispatch<React.SetStateAction<string[]>>;
  availableAgentsForSubSelector: SavedAgentConfiguration[];
  UsersIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  SubAgentSelectorComponent: React.FC<any>; // Pass the SubAgentSelector component itself. Use 'any' for props for simplicity or define specific SubAgentSelectorProps if available
}

const MultiAgentTab: React.FC<MultiAgentTabProps> = ({
  isRootAgent,
  setIsRootAgent,
  subAgentIds,
  setSubAgentIds,
  availableAgentsForSubSelector,
  UsersIcon,
  SubAgentSelectorComponent,
}) => {
  return (
    <TabsContent value="multiAgent" className="space-y-6 mt-4">
      <Alert>
        <UsersIcon className="h-4 w-4" />
        <AlertTitle>Configurações Multi-Agente</AlertTitle>
        <AlertDescription>
          Defina o papel deste agente em um sistema com múltiplos agentes (equipes de agentes) e suas relações com outros agentes.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Hierarquia e Colaboração</CardTitle>
          <CardDescription>Configure como este agente interage e se posiciona dentro de uma arquitetura multi-agente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="isRootAgentSwitch" // Unique ID
              checked={isRootAgent}
              onCheckedChange={setIsRootAgent}
            />
            <Label htmlFor="isRootAgentSwitch" className="text-base">Agente Raiz / Orquestrador Principal</Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Marque se este agente é o principal ponto de entrada ou o orquestrador em uma equipe de agentes.
            Agentes não-raiz (sub-agentes) são tipicamente especialistas invocados por um agente raiz ou por outros agentes.
          </p>
          <div className="space-y-2 pt-2">
            <Label htmlFor="subAgentIds">IDs dos Sub-Agentes / Colaboradores</Label>
            {availableAgentsForSubSelector && availableAgentsForSubSelector.length > 0 ? (
              <SubAgentSelectorComponent
                availableAgents={availableAgentsForSubSelector}
                selectedAgents={subAgentIds}
                onChange={setSubAgentIds}
                disabled={false} // Assuming it's not disabled by default
              />
            ) : (
              <Textarea
                id="subAgentIdsTextarea" // Unique ID
                placeholder="Insira IDs de sub-agentes, separados por vírgula. Nenhum outro agente salvo disponível para seleção no momento."
                value={subAgentIds.join(",")}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSubAgentIds(e.target.value.split(",").map(id => id.trim()).filter(id => id))}
                rows={3}
                // Ensure Textarea is disabled if SubAgentSelector would have been, though original had this logic inverted.
                // For consistency, if SubAgentSelector is not shown, Textarea is active.
                // disabled={!(availableAgentsForSubSelector && availableAgentsForSubSelector.length > 0)} // This was in original, but makes Textarea disabled when it's the only option
              />
            )}
            <p className="text-xs text-muted-foreground">
              Liste os IDs dos agentes que este agente pode invocar, delegar tarefas ou com os quais colabora.
            </p>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default MultiAgentTab;
