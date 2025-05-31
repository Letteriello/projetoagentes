// StateMemoryTab: Componente para a aba 'Estado & Memória', configurando a persistência de estado.
// Permite habilitar, definir o tipo e os valores iniciais da persistência de estado do agente.

import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs"; // Needed for the root element

// Props para o componente StateMemoryTab.
interface StateMemoryTabProps {
  enableStatePersistence: boolean;
  setEnableStatePersistence: (enabled: boolean) => void;
  statePersistenceType: string;
  setStatePersistenceType: (type: string) => void;
  initialStateValues: Array<{ key: string; value: any }>;
  setInitialStateValues: (values: Array<{ key: string; value: any }>) => void;
  toast: (options: { title: string; description?: string; variant?: "default" | "destructive" | "success" }) => void;
  DatabaseIcon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const StateMemoryTab: React.FC<StateMemoryTabProps> = ({
  enableStatePersistence,
  setEnableStatePersistence,
  statePersistenceType,
  setStatePersistenceType,
  initialStateValues,
  setInitialStateValues,
  toast,
  DatabaseIcon,
}) => {
  const handleInitialStateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const val = e.target.value.trim();
      if (!val) {
        setInitialStateValues([]);
        return;
      }
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && 'key' in item && 'value' in item)) {
        setInitialStateValues(parsed);
      } else {
        console.warn("Formato JSON inválido para valores iniciais do estado.");
        toast({ variant: "destructive", title: "JSON Inválido", description: "O formato para Valores Iniciais deve ser um array de objetos, cada um com 'key' e 'value'." });
      }
    } catch (error) {
      console.error("Erro ao parsear JSON dos valores iniciais:", error);
      toast({ variant: "destructive", title: "Erro no JSON", description: "Verifique a sintaxe do JSON para Valores Iniciais. Deve ser um array de objetos." });
    }
  };

  return (
    <TabsContent value="memory" className="space-y-6 mt-4">
      <Alert>
        <DatabaseIcon className="h-4 w-4" />
        <AlertTitle>Estado e Memória do Agente</AlertTitle>
        <AlertDescription>
          Configure como o agente deve persistir seu estado interno e gerenciar a memória de curto e longo prazo.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Persistência de Estado</CardTitle>
          <CardDescription>Controla se e como o agente salva seu estado entre execuções ou sessões.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="enableStatePersistence"
              checked={enableStatePersistence}
              onCheckedChange={setEnableStatePersistence}
            />
            <Label htmlFor="enableStatePersistence" className="text-base">Habilitar Persistência de Estado</Label>
          </div>

          {enableStatePersistence && (
            <>
              <div className="space-y-2">
                <Label htmlFor="statePersistenceType">Tipo de Persistência</Label>
                <Select value={statePersistenceType} onValueChange={setStatePersistenceType}>
                  <SelectTrigger id="statePersistenceType">
                    <SelectValue placeholder="Selecione o tipo de persistência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session">Sessão (Temporária, por aba/conexão)</SelectItem>
                    <SelectItem value="memory">Memória (Durante a vida do processo)</SelectItem>
                    <SelectItem value="database">Banco de Dados (Persistente)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {statePersistenceType === 'session' && "O estado é perdido quando a sessão do usuário termina."}
                  {statePersistenceType === 'memory' && "O estado persiste enquanto o agente/aplicação está em execução, mas é perdido ao reiniciar."}
                  {statePersistenceType === 'database' && "Requer configuração de um banco de dados para persistência robusta entre sessões e reinícios."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initialStateValues">Valores Iniciais do Estado (JSON)</Label>
                <Textarea
                  id="initialStateValues"
                  placeholder='[{"key": "exemploChave", "value": "exemploValor"}, {"key": "outraChave", "value": 123}]'
                  value={JSON.stringify(initialStateValues, null, 2)}
                  onChange={handleInitialStateChange}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Defina um array de objetos JSON, cada um com "key" (string) e "value" (qualquer valor JSON válido), para o estado inicial do agente.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default StateMemoryTab;
