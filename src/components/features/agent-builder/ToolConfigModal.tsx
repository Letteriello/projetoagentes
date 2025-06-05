"use client";

// ToolConfigModal: Modal para configurar os parâmetros de uma ferramenta específica.
// Este componente encapsula o formulário de configuração que aparece ao clicar em "Configurar" em uma ferramenta.

import * as React from "react";
import { useForm, Controller, FormProvider, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod'; // Keep z for schema type inference if needed
import {
  googleSearchToolConfigSchema,
  openApiToolConfigSchema,
  databaseConnectorToolConfigSchema,
} from '@/lib/zod-schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, type ButtonProps, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Label replaced by FormLabel
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AvailableTool, MCPServerConfig } from '@/types/tool-types';
import { cn } from "@/lib/utils";
import type { ToolConfigData } from '@/types/agent-configs-fixed';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ApiKeyEntry } from '../../../services/api-key-service';
import { useToast } from "@/hooks/use-toast";

// Define a union type for the schemas for convenience
type ToolSpecificSchema =
  | typeof googleSearchToolConfigSchema
  | typeof openApiToolConfigSchema
  | typeof databaseConnectorToolConfigSchema;

// Define a general type for form data based on the schemas
type ToolSpecificFormData =
  | z.infer<typeof googleSearchToolConfigSchema>
  | z.infer<typeof openApiToolConfigSchema>
  | z.infer<typeof databaseConnectorToolConfigSchema>;

interface ToolConfigModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  configuringTool: AvailableTool | null;
  onSave: (toolId: string, configData: ToolConfigData) => void;
  initialToolParams?: Record<string, any>; // For defaultValues

  currentSelectedApiKeyId?: string;
  onApiKeyIdChange: (toolId: string, apiKeyId?: string) => void;
  availableApiKeys: ApiKeyEntry[];

  mcpServers?: MCPServerConfig[];
  currentSelectedMcpServerId?: string;
  onMcpServerIdChange: (toolId: string, mcpServerId?: string) => void;

  // Props for guardrails - keep these as they are not part of the tool-specific Zod schemas
  modalAllowedPatterns: string; setModalAllowedPatterns: (value: string) => void;
  modalDeniedPatterns: string; setModalDeniedPatterns: (value: string) => void;
  modalCustomRules: string; setModalCustomRules: (value: string) => void;
  InfoIcon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const ToolConfigModal: React.FC<ToolConfigModalProps> = ({
  isOpen,
  onOpenChange,
  configuringTool,
  onSave,
  initialToolParams,
  currentSelectedApiKeyId,
  onApiKeyIdChange,
  availableApiKeys,
  mcpServers = [],
  currentSelectedMcpServerId,
  onMcpServerIdChange,
  modalAllowedPatterns, setModalAllowedPatterns, // Keep guardrail props
  modalDeniedPatterns, setModalDeniedPatterns,
  modalCustomRules, setModalCustomRules,
  InfoIcon,
}) => {
  const { toast } = useToast();

  const currentToolId = configuringTool?.id;
  let selectedSchema: ToolSpecificSchema | undefined = undefined;

  if (currentToolId === 'google-search') {
    selectedSchema = googleSearchToolConfigSchema;
  } else if (currentToolId === 'openapi-custom') {
    selectedSchema = openApiToolConfigSchema;
  } else if (currentToolId === 'database-connector') {
    selectedSchema = databaseConnectorToolConfigSchema;
  }

  const methods = useForm<ToolSpecificFormData>({
    resolver: selectedSchema ? zodResolver(selectedSchema) : undefined,
    defaultValues: initialToolParams || {},
    mode: "onChange",
  });

  React.useEffect(() => {
    if (isOpen && configuringTool) {
      // Determine the correct schema based on configuringTool.id
      let schemaToUse;
      if (configuringTool.id === 'google-search') {
        schemaToUse = googleSearchToolConfigSchema;
      } else if (configuringTool.id === 'openapi-custom') {
        schemaToUse = openApiToolConfigSchema;
      } else if (configuringTool.id === 'database-connector') {
        schemaToUse = databaseConnectorToolConfigSchema;
      }
      // Update resolver dynamically - this is tricky, RHF doesn't support dynamic resolver easily.
      // Instead, we might need separate form instances or conditional rendering of forms.
      // For simplicity here, we rely on the initial resolver setting.
      // The key is to reset with appropriate default values.
      methods.reset(initialToolParams || {});
    }
  }, [isOpen, configuringTool, initialToolParams, methods]);


  const onFormSubmit: SubmitHandler<ToolSpecificFormData> = (toolSpecificFormData) => {
    if (!configuringTool) return;
    const toolId = configuringTool.id;

    let finalConfigData: Record<string, any> = { ...toolSpecificFormData };

    if (configuringTool.requiresAuth) {
      finalConfigData.selectedApiKeyId = currentSelectedApiKeyId;
    }
    if (configuringTool.isMCPTool) {
      finalConfigData.selectedMcpServerId = currentSelectedMcpServerId;
      finalConfigData.isMCPTool = true;
    }

    if (["database-connector", "openapi-custom", "codeExecutor"].includes(toolId)) {
      finalConfigData.allowedPatterns = modalAllowedPatterns;
      finalConfigData.deniedPatterns = modalDeniedPatterns;
      finalConfigData.customRules = modalCustomRules;
    }

    // Ensure dbPort is string if it's a number from the form
    if (toolId === 'database-connector' && typeof finalConfigData.dbPort === 'number') {
        finalConfigData.dbPort = String(finalConfigData.dbPort);
    }


    onSave(toolId, { [toolId]: finalConfigData } as ToolConfigData);
  };

  if (!configuringTool) {
    return null;
  }

  const renderToolSpecificFields = () => {
    if (!selectedSchema) return <p className="text-sm text-muted-foreground">No specific configuration fields for this tool type with the new form structure, or tool type not recognized for RHF.</p>;

    switch (configuringTool.id) {
      case "google-search":
        return (
          <FormField
            control={methods.control}
            name="googleCseId"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="googleCseId">ID do Mecanismo de Busca Programável (CSE ID)</FormLabel>
                <FormControl>
                  <Input id="googleCseId" {...field} placeholder="ex: 0123456789abcdefg"/>
                </FormControl>
                <FormDescription className="text-xs">Este ID é específico para o Google Programmable Search Engine e não é uma chave API.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case "openapi-custom":
        return (
          <FormField
            control={methods.control}
            name="openapiSpecUrl"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel htmlFor="openapiSpecUrl">URL da Especificação OpenAPI (JSON/YAML)</FormLabel>
                <FormControl>
                  <Input id="openapiSpecUrl" {...field} placeholder="ex: https://petstore.swagger.io/v2/swagger.json"/>
                </FormControl>
                <FormDescription className="text-xs">Link para a especificação OpenAPI (v2 ou v3) da API externa.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case "database-connector":
        return (
          <>
            <FormField
              control={methods.control}
              name="dbType"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Tipo de Banco de Dados</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo de banco" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="postgresql">PostgreSQL</SelectItem>
                      <SelectItem value="mysql">MySQL</SelectItem>
                      <SelectItem value="sqlserver">SQL Server</SelectItem>
                      <SelectItem value="sqlite">SQLite</SelectItem>
                      <SelectItem value="other">Outro (usar string de conexão)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={methods.control}
              name="dbHost"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Host do Banco</FormLabel>
                  <FormControl><Input {...field} placeholder="ex: localhost ou my.database.server.com" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="dbPort"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Porta</FormLabel>
                  <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || undefined)} placeholder="ex: 5432" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="dbName"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Nome do Banco</FormLabel>
                  <FormControl><Input {...field} placeholder="ex: minha_base_de_dados" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="dbUser"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Usuário</FormLabel>
                  <FormControl><Input {...field} placeholder="ex: admin_user" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="dbConnectionString"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>String de Conexão (Opcional - sobrescreve campos acima)</FormLabel>
                  <FormControl><Input {...field} placeholder="driver://usuario:senha@host:porta/banco"/></FormControl>
                  <FormDescription className="text-xs">Se preenchida, os campos de Host, Porta, Nome e Usuário podem ser ignorados.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={methods.control}
              name="dbDescription"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Descrição do Banco/Tabelas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Ex: Tabela 'usuarios' (id, nome, email), Tabela 'pedidos' (id, usuario_id, produto, qtd, data)" rows={3}/>
                  </FormControl>
                  <FormDescription className="text-xs">Ajuda o agente a entender o esquema do banco de dados.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
      default:
        return <p className="text-sm text-muted-foreground">Este tipo de ferramenta não possui campos de configuração específicos via RHF ainda.</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onFormSubmit)}>
            <DialogHeader>
              <DialogTitle>Configurar Ferramenta: {configuringTool.name}</DialogTitle>
              <DialogDescription>{configuringTool.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Common Auth Section - remains unchanged */}
              {configuringTool.requiresAuth && (
                <div className="space-y-2 p-3 border rounded-md bg-muted/20">
                  <FormLabel htmlFor="apiKeySelect" className="font-semibold">Autenticação via Cofre API</FormLabel>
                  <Select
                    value={currentSelectedApiKeyId || ""}
                    onValueChange={(value: string) => onApiKeyIdChange(configuringTool!.id, value)}
                  >
                    <SelectTrigger id="apiKeySelect">
                      <SelectValue placeholder={"Selecione uma chave API do cofre"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableApiKeys
                        .filter(key => key.serviceType === configuringTool!.serviceTypeRequired || key.serviceType === "Generic")
                        .map(key => (
                          <SelectItem key={key.id} value={key.id}>
                            {key.serviceName} ({key.serviceType}) - ID: ...{key.id.slice(-6)}
                          </SelectItem>
                        ))}
                      {availableApiKeys.filter(key => key.serviceType === configuringTool!.serviceTypeRequired || key.serviceType === "Generic").length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Nenhuma chave compatível encontrada no cofre para o tipo '{configuringTool!.serviceTypeRequired}' ou 'Generic'.
                          <button className={cn(buttonVariants({ variant: "link", className: "p-0 h-auto ml-1" }))} onClick={() => { /* TODO: Link to vault page */ }}>Adicionar Chave</button>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    A chave API para esta ferramenta será gerenciada pelo Cofre de Chaves API. Selecione uma entrada compatível (Tipo: {configuringTool.serviceTypeRequired} ou Genérico).
                  </p>
                </div>
              )}

              {/* Render tool-specific fields using RHF */}
              {renderToolSpecificFields()}

              {/* Guardrail UI fields - remain the same, controlled by existing props */}
              {configuringTool && ["database-connector", "openapi-custom", "codeExecutor"].includes(configuringTool.id) && (
                <>
                  <div className="mt-4 pt-4 border-t">
                    <FormLabel className="text-base font-semibold">Configurações de Guardrails</FormLabel>
                    <p className="text-xs text-muted-foreground mb-3">
                      Defina regras para restringir a operação da ferramenta. Estas são representações conceituais e sua aplicação depende da implementação da ferramenta.
                    </p>
                    <div className="space-y-2">
                      <FormLabel htmlFor="modalAllowedPatterns">Padrões Permitidos (Ex: Regex)</FormLabel>
                      <Textarea id="modalAllowedPatterns" value={modalAllowedPatterns} onChange={(e) => setModalAllowedPatterns(e.target.value)} placeholder="Ex: ^/api/v1/users/.* (para APIs) ou ^SELECT .* FROM customers (para SQL)" rows={2}/>
                      <p className="text-xs text-muted-foreground">Opcional. Expressão regular ou padrão para saídas/requests permitidos.</p>
                    </div>
                    <div className="space-y-2 mt-2">
                      <FormLabel htmlFor="modalDeniedPatterns">Padrões Negados (Ex: Regex)</FormLabel>
                      <Textarea id="modalDeniedPatterns" value={modalDeniedPatterns} onChange={(e) => setModalDeniedPatterns(e.target.value)} placeholder="Ex: DELETE.* (para SQL) ou /admin.* (para APIs)" rows={2}/>
                      <p className="text-xs text-muted-foreground">Opcional. Expressão regular ou padrão para saídas/requests negados. Geralmente prevalece sobre os permitidos.</p>
                    </div>
                    <div className="space-y-2 mt-2">
                      <FormLabel htmlFor="modalCustomRules">Regras Adicionais (Texto/JSON)</FormLabel>
                      <Textarea id="modalCustomRules" value={modalCustomRules} onChange={(e) => setModalCustomRules(e.target.value)} placeholder={"Ex: { \"max_rows\": 100 } ou 'PROHIBIT_FILE_WRITE'"} rows={2}/>
                      <p className="text-xs text-muted-foreground">Opcional. Regras específicas em texto ou JSON, dependendo da capacidade da ferramenta.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={!methods.formState.isValid && !!selectedSchema}>Salvar Configuração da Ferramenta</Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export default ToolConfigModal;
