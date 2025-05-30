"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Info, PlusCircle, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  AgentConfig,
  StateMemoryConfig,
  InitialStateValue,
  StateValidationRule,
  StateScope,
} from "@/types/new_agent_types"; // Adjust path as necessary

interface NewStateMemoryTabProps {
  config: AgentConfig;
  updateConfig: (newConfig: AgentConfig) => void;
}

export const NewStateMemoryTab: React.FC<NewStateMemoryTabProps> = ({
  config,
  updateConfig,
}) => {
  const stateMemory = config.stateMemory || {};

  const handleStateMemoryChange = (
    fieldName: keyof StateMemoryConfig,
    value: any,
  ) => {
    updateConfig({
      ...config,
      stateMemory: {
        ...stateMemory,
        [fieldName]: value,
      },
    });
  };

  // Initial State Values Management
  const [newInitialValue, setNewInitialValue] = React.useState<
    Omit<InitialStateValue, "key"> & { key?: string }
  >({ value: "", scope: stateMemory.defaultScope || "AGENT", description: "" });
  const [editingInitialValueIndex, setEditingInitialValueIndex] =
    React.useState<number | null>(null);

  const handleAddOrUpdateInitialValue = () => {
    if (!newInitialValue.key) return; // Key is mandatory
    const currentValues = stateMemory.initialStateValues || [];
    const valueToAdd: InitialStateValue = {
      key: newInitialValue.key,
      value: newInitialValue.value,
      scope: newInitialValue.scope || stateMemory.defaultScope || "AGENT",
      description: newInitialValue.description || "",
    };

    if (editingInitialValueIndex !== null) {
      const updatedValues = currentValues.map((item, index) =>
        index === editingInitialValueIndex ? valueToAdd : item,
      );
      handleStateMemoryChange("initialStateValues", updatedValues);
      setEditingInitialValueIndex(null);
    } else {
      handleStateMemoryChange("initialStateValues", [
        ...currentValues,
        valueToAdd,
      ]);
    }
    setNewInitialValue({
      value: "",
      scope: stateMemory.defaultScope || "AGENT",
      description: "",
    });
  };

  const handleEditInitialValue = (index: number) => {
    const valueToEdit = (stateMemory.initialStateValues || [])[index];
    setNewInitialValue(valueToEdit);
    setEditingInitialValueIndex(index);
  };

  const handleRemoveInitialValue = (index: number) => {
    const updatedValues = (stateMemory.initialStateValues || []).filter(
      (_, i) => i !== index,
    );
    handleStateMemoryChange("initialStateValues", updatedValues);
  };

  // State Validation Rules Management
  const [newValidationRule, setNewValidationRule] = React.useState<
    Omit<StateValidationRule, "id">
  >({ name: "", type: "JSON_SCHEMA", rule: "" });
  const [editingValidationRuleIndex, setEditingValidationRuleIndex] =
    React.useState<number | null>(null);

  const handleAddOrUpdateValidationRule = () => {
    if (!newValidationRule.name || !newValidationRule.rule) return; // Name and rule are mandatory
    const currentRules = stateMemory.validationRules || [];
    const ruleToAdd: StateValidationRule = {
      id:
        editingValidationRuleIndex !== null
          ? currentRules[editingValidationRuleIndex].id
          : `rule-${Date.now()}`,
      ...newValidationRule,
    } as StateValidationRule;

    if (editingValidationRuleIndex !== null) {
      const updatedRules = currentRules.map((item, index) =>
        index === editingValidationRuleIndex ? ruleToAdd : item,
      );
      handleStateMemoryChange("validationRules", updatedRules);
      setEditingValidationRuleIndex(null);
    } else {
      handleStateMemoryChange("validationRules", [...currentRules, ruleToAdd]);
    }
    setNewValidationRule({ name: "", type: "JSON_SCHEMA", rule: "" });
  };

  const handleEditValidationRule = (index: number) => {
    const ruleToEdit = (stateMemory.validationRules || [])[index];
    setNewValidationRule(ruleToEdit);
    setEditingValidationRuleIndex(index);
  };

  const handleRemoveValidationRule = (index: number) => {
    const updatedRules = (stateMemory.validationRules || []).filter(
      (_, i) => i !== index,
    );
    handleStateMemoryChange("validationRules", updatedRules);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Estado e Memória</CardTitle>
            <CardDescription>
              Defina como o agente gerencia seu estado, persistência e regras de
              validação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enable State Persistence */}
            <div className="flex items-center space-x-2">
              <Switch
                id="enableStatePersistence"
                checked={stateMemory.enableStatePersistence || false}
                onCheckedChange={(checked) =>
                  handleStateMemoryChange("enableStatePersistence", checked)
                }
              />
              <Label
                htmlFor="enableStatePersistence"
                className="flex items-center"
              >
                Habilitar Persistência de Estado
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1 p-0"
                    >
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Permite que o agente armazene e recupere seu estado entre
                      sessões ou execuções.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>

            {stateMemory.enableStatePersistence && (
              <div className="pl-6 space-y-4">
                {/* State Persistence Type */}
                <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                  <Label htmlFor="statePersistenceType">
                    Tipo de Persistência
                  </Label>
                  <Select
                    value={stateMemory.statePersistenceType || "memory"}
                    onValueChange={(value) =>
                      handleStateMemoryChange("statePersistenceType", value)
                    }
                  >
                    <SelectTrigger id="statePersistenceType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">
                        Sessão (Navegador)
                      </SelectItem>
                      <SelectItem value="memory">
                        Memória (Curto Prazo Servidor)
                      </SelectItem>
                      <SelectItem value="database">
                        Banco de Dados (Longo Prazo)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Default State Scope */}
                <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                  <Label htmlFor="defaultStateScope">
                    Escopo Padrão do Estado
                  </Label>
                  <Select
                    value={stateMemory.defaultScope || "AGENT"}
                    onValueChange={(value: StateScope) =>
                      handleStateMemoryChange("defaultScope", value)
                    }
                  >
                    <SelectTrigger id="defaultStateScope">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GLOBAL">
                        Global (Compartilhado entre todos os agentes)
                      </SelectItem>
                      <SelectItem value="AGENT">
                        Agente (Específico para esta instância)
                      </SelectItem>
                      <SelectItem value="TEMPORARY">
                        Temporário (Vida útil limitada)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time To Live (TTL) */}
                {stateMemory.defaultScope === "TEMPORARY" && (
                  <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                    <Label htmlFor="ttlSeconds">
                      TTL para Escopo Temporário (segundos)
                    </Label>
                    <Input
                      id="ttlSeconds"
                      type="number"
                      value={stateMemory.timeToLiveSeconds || ""}
                      onChange={(e) =>
                        handleStateMemoryChange(
                          "timeToLiveSeconds",
                          e.target.value ? parseInt(e.target.value) : undefined,
                        )
                      }
                      placeholder="Ex: 3600 (1 hora)"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Initial State Values */}
            {stateMemory.enableStatePersistence && (
              <div className="space-y-2 pt-4">
                <Label className="text-base">Valores Iniciais do Estado</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Chave</TableHead>
                      <TableHead>Valor (JSON)</TableHead>
                      <TableHead>Escopo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(stateMemory.initialStateValues || []).map(
                      (val, index) => (
                        <TableRow key={index}>
                          <TableCell>{val.key}</TableCell>
                          <TableCell>
                            <Textarea
                              value={val.value}
                              readOnly
                              rows={1}
                              className="text-xs min-h-[20px] resize-none bg-muted/50"
                            />
                          </TableCell>
                          <TableCell>
                            {val.scope || stateMemory.defaultScope || "AGENT"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {val.description}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditInitialValue(index)}
                              className="mr-1"
                            >
                              <Info size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveInitialValue(index)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
                <div className="p-4 border rounded-md space-y-3">
                  <h4 className="text-sm font-medium">
                    {editingInitialValueIndex !== null
                      ? "Editar Valor Inicial"
                      : "Adicionar Novo Valor Inicial"}
                  </h4>
                  <Input
                    placeholder="Chave (ex: userRole)"
                    value={newInitialValue.key || ""}
                    onChange={(e) =>
                      setNewInitialValue({
                        ...newInitialValue,
                        key: e.target.value,
                      })
                    }
                  />
                  <Textarea
                    placeholder='Valor (JSON string, ex: "admin" ou {"theme":"dark"})'
                    value={newInitialValue.value}
                    onChange={(e) =>
                      setNewInitialValue({
                        ...newInitialValue,
                        value: e.target.value,
                      })
                    }
                    rows={2}
                  />
                  <Select
                    value={
                      newInitialValue.scope ||
                      stateMemory.defaultScope ||
                      "AGENT"
                    }
                    onValueChange={(v: StateScope) =>
                      setNewInitialValue({ ...newInitialValue, scope: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AGENT">Agente (Padrão)</SelectItem>
                      <SelectItem value="GLOBAL">Global</SelectItem>
                      <SelectItem value="TEMPORARY">Temporário</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Descrição (opcional)"
                    value={newInitialValue.description || ""}
                    onChange={(e) =>
                      setNewInitialValue({
                        ...newInitialValue,
                        description: e.target.value,
                      })
                    }
                  />
                  <Button onClick={handleAddOrUpdateInitialValue} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {editingInitialValueIndex !== null
                      ? "Atualizar Valor"
                      : "Adicionar Valor"}
                  </Button>
                  {editingInitialValueIndex !== null && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingInitialValueIndex(null);
                        setNewInitialValue({
                          value: "",
                          scope: stateMemory.defaultScope || "AGENT",
                          description: "",
                        });
                      }}
                    >
                      Cancelar Edição
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* State Validation Rules */}
            {stateMemory.enableStatePersistence && (
              <div className="space-y-2 pt-4">
                <Label className="text-base">
                  Regras de Validação de Estado
                </Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Regra</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Definição da Regra</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(stateMemory.validationRules || []).map((rule, index) => (
                      <TableRow key={rule.id}>
                        <TableCell>{rule.name}</TableCell>
                        <TableCell>{rule.type}</TableCell>
                        <TableCell>
                          <Textarea
                            value={rule.rule}
                            readOnly
                            rows={1}
                            className="text-xs min-h-[20px] resize-none bg-muted/50"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditValidationRule(index)}
                            className="mr-1"
                          >
                            <Info size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveValidationRule(index)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-4 border rounded-md space-y-3">
                  <h4 className="text-sm font-medium">
                    {editingValidationRuleIndex !== null
                      ? "Editar Regra"
                      : "Adicionar Nova Regra de Validação"}
                  </h4>
                  <Input
                    placeholder="Nome da Regra (ex: UserInputSchema)"
                    value={newValidationRule.name}
                    onChange={(e) =>
                      setNewValidationRule({
                        ...newValidationRule,
                        name: e.target.value,
                      })
                    }
                  />
                  <Select
                    value={newValidationRule.type}
                    onValueChange={(v: "JSON_SCHEMA" | "REGEX") =>
                      setNewValidationRule({ ...newValidationRule, type: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JSON_SCHEMA">JSON Schema</SelectItem>
                      <SelectItem value="REGEX">
                        Expressão Regular (REGEX)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder={
                      newValidationRule.type === "JSON_SCHEMA"
                        ? "Cole seu JSON Schema aqui..."
                        : "Insira sua expressão regular aqui..."
                    }
                    value={newValidationRule.rule}
                    onChange={(e) =>
                      setNewValidationRule({
                        ...newValidationRule,
                        rule: e.target.value,
                      })
                    }
                    rows={3}
                  />
                  <Button onClick={handleAddOrUpdateValidationRule} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {editingValidationRuleIndex !== null
                      ? "Atualizar Regra"
                      : "Adicionar Regra"}
                  </Button>
                  {editingValidationRuleIndex !== null && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingValidationRuleIndex(null);
                        setNewValidationRule({
                          name: "",
                          type: "JSON_SCHEMA",
                          rule: "",
                        });
                      }}
                    >
                      Cancelar Edição
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Enable State Sharing */}
            <div className="flex items-center space-x-2 pt-4">
              <Switch
                id="enableStateSharing"
                checked={stateMemory.enableStateSharing || false}
                onCheckedChange={(checked) =>
                  handleStateMemoryChange("enableStateSharing", checked)
                }
              />
              <Label htmlFor="enableStateSharing" className="flex items-center">
                Habilitar Compartilhamento de Estado (ADK)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1 p-0"
                    >
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Permite que o estado deste agente seja compartilhado com
                      outros agentes em um sistema ADK.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>

            {stateMemory.enableStateSharing && (
              <div className="pl-6 space-y-4">
                {/* State Sharing Strategy */}
                <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
                  <Label htmlFor="stateSharingStrategy">
                    Estratégia de Compartilhamento
                  </Label>
                  <Select
                    value={stateMemory.stateSharingStrategy || "explicit"}
                    onValueChange={(value) =>
                      handleStateMemoryChange("stateSharingStrategy", value)
                    }
                  >
                    <SelectTrigger id="stateSharingStrategy">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Estados</SelectItem>
                      <SelectItem value="explicit">
                        Apenas Estados Explícitos (requer marcação)
                      </SelectItem>
                      <SelectItem value="none">
                        Nenhum (Desabilitado Temporariamente)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};
