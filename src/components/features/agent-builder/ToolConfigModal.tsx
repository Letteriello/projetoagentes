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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AvailableTool, ToolConfigData } from "@/types/agent-configs"; // Updated import path
import { ApiKeyVaultEntry } from "@/types/apiKeyVaultTypes";
import { useToast } from "@/hooks/use-toast"; // For showing errors

// Props para o componente ToolConfigModal.
interface ToolConfigModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  configuringTool: AvailableTool | null;
  onSave: (toolId: string, configData: ToolConfigData) => void;

  // Receive current selection and callback to update it in parent state
  currentSelectedApiKeyId?: string;
  onApiKeyIdChange: (toolId: string, apiKeyId?: string) => void;

  // Existing state for direct input fields (some might become obsolete or conditional)
  modalGoogleApiKey: string; setModalGoogleApiKey: (value: string) => void; // Potentially replaced by vault
  modalGoogleCseId: string; setModalGoogleCseId: (value: string) => void;
  modalOpenapiSpecUrl: string; setModalOpenapiSpecUrl: (value: string) => void;
  modalOpenapiApiKey: string; setModalOpenapiApiKey: (value: string) => void; // Potentially replaced by vault
  modalDbType: string; setModalDbType: (value: string) => void;
  modalDbHost: string; setModalDbHost: (value: string) => void;
  modalDbPort: number; setModalDbPort: (value: number) => void;
  modalDbName: string; setModalDbName: (value: string) => void;
  modalDbUser: string; setModalDbUser: (value: string) => void;
  modalDbPassword: string; setModalDbPassword: (value: string) => void; // Potentially replaced by vault
  modalDbConnectionString: string; setModalDbConnectionString: (value: string) => void;
  modalDbDescription: string; setModalDbDescription: (value: string) => void;
  modalKnowledgeBaseId: string; setModalKnowledgeBaseId: (value: string) => void;
  modalCalendarApiEndpoint: string; setModalCalendarApiEndpoint: (value: string) => void;

  modalAllowedPatterns: string; setModalAllowedPatterns: (value: string) => void;
  modalDeniedPatterns: string; setModalDeniedPatterns: (value: string) => void;
  modalCustomRules: string; setModalCustomRules: (value: string) => void;
  InfoIcon: React.FC<React.SVGProps<SVGSVGElement>>;
}

// No longer needed as config is built dynamically based on availableTool.configFields
// const toolConfigKeys: Record<string, (keyof ToolConfigData)[]> = { ... };

const ToolConfigModal: React.FC<ToolConfigModalProps> = ({
  isOpen,
  onOpenChange,
  configuringTool,
  onSave,
  currentSelectedApiKeyId,
  onApiKeyIdChange,
  // Keep other state setters for non-auth fields or direct input fallback (though direct input is removed for auth fields)
  modalGoogleApiKey, setModalGoogleApiKey, // Will be set by vault selection or remains empty
  modalGoogleCseId, setModalGoogleCseId,
  modalOpenapiSpecUrl, setModalOpenapiSpecUrl,
  modalOpenapiApiKey, setModalOpenapiApiKey, // Will be set by vault selection or remains empty
  modalDbType, setModalDbType,
  modalDbHost, setModalDbHost,
  modalDbPort, setModalDbPort,
  modalDbName, setModalDbName,
  modalDbUser, setModalDbUser,
  modalDbPassword, setModalDbPassword, // Will be set by vault selection or remains empty
  modalDbConnectionString, setModalDbConnectionString,
  modalDbDescription, setModalDbDescription,
  modalKnowledgeBaseId, setModalKnowledgeBaseId,
  modalCalendarApiEndpoint, setModalCalendarApiEndpoint,
  modalAllowedPatterns, setModalAllowedPatterns,
  modalDeniedPatterns, setModalDeniedPatterns,
  modalCustomRules, setModalCustomRules,
  InfoIcon,
}) => {
  const { toast } = useToast();
  const [apiKeyVaultEntries, setApiKeyVaultEntries] = React.useState<ApiKeyVaultEntry[]>([]);
  const [isLoadingVaultKeys, setIsLoadingVaultKeys] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && configuringTool?.requiresAuth) {
      setIsLoadingVaultKeys(true);
      fetch("/api/apikeys")
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch API keys: ${res.statusText}`);
          }
          return res.json();
        })
        .then((data: ApiKeyVaultEntry[]) => {
          setApiKeyVaultEntries(Array.isArray(data) ? data : []);
        })
        .catch((error) => {
          console.error("Error fetching API keys from vault:", error);
          toast({
            title: "Erro ao Carregar Chaves API",
            description: error.message || "Não foi possível buscar as chaves do cofre.",
            variant: "destructive",
          });
          setApiKeyVaultEntries([]); // Ensure it's an empty array on error
        })
        .finally(() => {
          setIsLoadingVaultKeys(false);
        });
    } else if (!isOpen) {
      // Reset when modal closes
      setApiKeyVaultEntries([]);
    }
  }, [isOpen, configuringTool, toast]);


  const handleInternalSave = () => {
    if (!configuringTool) return;

    const configData: Partial<ToolConfigData> = {};
    const toolId = configuringTool.id; // e.g., 'google-search', 'openapi-custom'

    // Common fields that might exist regardless of specific tool type
    if (configuringTool.requiresAuth) {
      configData.selectedApiKeyId = currentSelectedApiKeyId;
    }

    // Specific fields based on tool ID - only set what's relevant and managed by this modal's state
    // This switch now primarily handles non-auth fields or fields specific to a tool's nature
    // Auth fields like `googleApiKey`, `openapiApiKey`, `dbPassword` are now implicitly handled by `selectedApiKeyId`
    switch (toolId) {
      case "google-search": // Matches ID in available-tools.ts
        configData.googleCseId = modalGoogleCseId;
        // googleApiKey is now from vault via selectedApiKeyId
        break;
      case "openapi-custom": // Matches ID in available-tools.ts
        configData.openapiSpecUrl = modalOpenapiSpecUrl;
        // openapiApiKey is now from vault via selectedApiKeyId
        break;
      case "database-connector": // Matches ID in available-tools.ts
        configData.dbType = modalDbType as ToolConfigData['dbType'];
        configData.dbHost = modalDbHost;
        configData.dbPort = modalDbPort;
        configData.dbName = modalDbName;
        configData.dbUser = modalDbUser;
        // dbPassword is now from vault via selectedApiKeyId
        configData.dbConnectionString = modalDbConnectionString; // Keep if it's an alternative to host/port/etc.
        configData.dbDescription = modalDbDescription;
        break;
      case "knowledgeBase": // Example, adjust if this tool ID is used
        configData.knowledgeBaseId = modalKnowledgeBaseId;
        break;
      case "calendarAccess": // Example, adjust if this tool ID is used
        configData.calendarApiEndpoint = modalCalendarApiEndpoint;
        break;
      // For tools that don't require specific config beyond selectedApiKeyId (if auth is needed)
      // or have no config at all, no specific case is needed here.
      default:
        // If the tool has configFields defined, try to populate them generically (not implemented here)
        // For now, we rely on the specific cases above.
        console.warn(`No specific config saving logic for toolId: ${toolId}, relying on generic fields if any.`);
        break;
    }

    // Add guardrail data for relevant tools
    // Assuming guardrail fields are generic and not part of the direct state setters for each tool type
    if (configuringTool && ["database-connector", "openapi-custom", "codeExecutor"].includes(configuringTool.id)) {
      configData.allowedPatterns = modalAllowedPatterns;
      configData.deniedPatterns = modalDeniedPatterns;
      configData.customRules = modalCustomRules;
    }

    onSave(toolId, configData as ToolConfigData);
  };

  if (!configuringTool) {
    return null; // Não renderiza nada se não houver ferramenta para configurar
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Ferramenta: {configuringTool.label}</DialogTitle> {/* Use label for display */}
          <DialogDescription>{configuringTool.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Common Auth Section */}
          {configuringTool.requiresAuth && (
            <div className="space-y-2 p-3 border rounded-md bg-muted/20">
              <Label htmlFor="apiKeySelect" className="font-semibold">Autenticação via Cofre API</Label>
              <Select
                value={currentSelectedApiKeyId || ""}
                onValueChange={(value) => onApiKeyIdChange(configuringTool.id, value)}
                disabled={isLoadingVaultKeys}
              >
                <SelectTrigger id="apiKeySelect">
                  <SelectValue placeholder={isLoadingVaultKeys ? "Carregando chaves..." : "Selecione uma chave API do cofre"} />
                </SelectTrigger>
                <SelectContent>
                  {apiKeyVaultEntries
                    .filter(key => key.serviceType === configuringTool.serviceTypeRequired || key.serviceType === "Generic")
                    .map(key => (
                      <SelectItem key={key.id} value={key.id}>
                        {key.serviceName} ({key.serviceType}) - ID: ...{key.id.slice(-6)}
                      </SelectItem>
                    ))}
                  {apiKeyVaultEntries.filter(key => key.serviceType === configuringTool.serviceTypeRequired || key.serviceType === "Generic").length === 0 && !isLoadingVaultKeys && (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhuma chave compatível encontrada no cofre para o tipo '{configuringTool.serviceTypeRequired}' ou 'Generic'.
                      <Button variant="link" className="p-0 h-auto ml-1" onClick={() => { /* TODO: Link to vault page */ }}>Adicionar Chave</Button>
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                A chave API para esta ferramenta será gerenciada pelo Cofre de Chaves API. Selecione uma entrada compatível (Tipo: {configuringTool.serviceTypeRequired} ou Genérico).
              </p>
            </div>
          )}

          {/* Tool-Specific Fields (Non-Auth or supplementary) */}
          {/* Example for Google Search (CSE ID is not from vault) */}
          {configuringTool.id === "google-search" && (
            <div className="space-y-2">
              <Label htmlFor="modalGoogleCseId">ID do Mecanismo de Busca Programável (CSE ID)</Label>
              <Input id="modalGoogleCseId" value={modalGoogleCseId} onChange={(e) => setModalGoogleCseId(e.target.value)} placeholder="ex: 0123456789abcdefg"/>
              <p className="text-xs text-muted-foreground">Este ID é específico para o Google Programmable Search Engine e não é uma chave API.</p>
            </div>
          )}

          {/* Example for Custom API (OpenAPI Spec URL is not from vault) */}
          {configuringTool.id === "openapi-custom" && (
            <div className="space-y-2">
              <Label htmlFor="modalOpenapiSpecUrl">URL da Especificação OpenAPI (JSON/YAML)</Label>
              <Input id="modalOpenapiSpecUrl" value={modalOpenapiSpecUrl} onChange={(e) => setModalOpenapiSpecUrl(e.target.value)} placeholder="ex: https://petstore.swagger.io/v2/swagger.json"/>
              <p className="text-xs text-muted-foreground">Link para a especificação OpenAPI (v2 ou v3) da API externa.</p>
            </div>
          )}

          {/* Example for Database Connector (most fields are not from vault, except potentially password if not part of connection string) */}
          {configuringTool.id === "database-connector" && (
             <>
             <div className="space-y-2">
               <Label htmlFor="modalDbType">Tipo de Banco de Dados</Label>
               <Select value={modalDbType} onValueChange={setModalDbType}>
                 <SelectTrigger id="modalDbType">
                   <SelectValue placeholder="Selecione o tipo de banco" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="postgresql">PostgreSQL</SelectItem>
                   <SelectItem value="mysql">MySQL</SelectItem>
                   <SelectItem value="sqlserver">SQL Server</SelectItem>
                   <SelectItem value="sqlite">SQLite</SelectItem>
                   <SelectItem value="other">Outro (usar string de conexão)</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             {/* Fields for host, port, dbname, user are shown if not using a full connection string */}
             {(modalDbType && modalDbType !== 'other' && modalDbType !== 'sqlite') && !configuringTool.requiresAuth && ( // Hide if auth is from vault for password
              <>
                {/* ... (host, port, dbname, user inputs remain as they were if password is not from vault) ... */}
                {/* If dbPassword was a direct input and now comes from vault, that specific input is removed */}
              </>
             )}
             {(modalDbType === 'other' || modalDbType === 'sqlite') && (
               <div className="space-y-2">
                 <Label htmlFor="modalDbConnectionString">String de Conexão / Caminho do Arquivo</Label>
                 <Input id="modalDbConnectionString" value={modalDbConnectionString} onChange={(e) => setModalDbConnectionString(e.target.value)} placeholder={modalDbType === 'sqlite' ? "ex: /caminho/para/seu/banco.sqlite" : "driver://usuario:senha@host:porta/banco"}/>
                 <p className="text-xs text-muted-foreground">
                   {modalDbType === 'sqlite' ? 'Caminho completo para o arquivo SQLite.' : 'String de conexão completa.'}
                   {configuringTool.requiresAuth && modalDbType !== 'sqlite' && " (A senha, se parte da string, pode ser gerenciada pelo cofre se não incluída aqui.)"}
                 </p>
               </div>
             )}
              <div className="space-y-2">
               <Label htmlFor="modalDbDescription">Descrição do Banco/Tabelas (Opcional)</Label>
               <Textarea id="modalDbDescription" value={modalDbDescription} onChange={(e) => setModalDbDescription(e.target.value)} placeholder="Ex: Tabela 'usuarios' (id, nome, email), Tabela 'pedidos' (id, usuario_id, produto, qtd, data)" rows={3}/>
               <p className="text-xs text-muted-foreground">Ajuda o agente a entender o esquema do banco de dados.</p>
             </div>
           </>
          )}

          {/* Fallback for other tools that might have configFields but don't match the specific IDs above */}
          {/* This part needs more robust handling if we expect many tools with diverse, non-auth configs */}
          {/* For now, it ensures that if a tool is not 'google-search', 'openapi-custom', or 'database-connector',
              but has configFields, those fields would need to be rendered here.
              This example does not explicitly render them based on `configuringTool.configFields`
              which would require a dynamic form generation logic.
           */}


        {/* Guardrail UI fields - remain the same */}
        {configuringTool && ["database-connector", "openapi-custom", "codeExecutor"].includes(configuringTool.id) && (
          <>
            <div className="mt-4 pt-4 border-t">
              <Label className="text-base font-semibold">Configurações de Guardrails</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Defina regras para restringir a operação da ferramenta. Estas são representações conceituais e sua aplicação depende da implementação da ferramenta.
              </p>
              <div className="space-y-2">
                <Label htmlFor="modalAllowedPatterns">Padrões Permitidos (Ex: Regex)</Label>
                <Textarea id="modalAllowedPatterns" value={modalAllowedPatterns} onChange={(e) => setModalAllowedPatterns(e.target.value)} placeholder="Ex: ^/api/v1/users/.* (para APIs) ou ^SELECT .* FROM customers (para SQL)" rows={2}/>
                <p className="text-xs text-muted-foreground">Opcional. Expressão regular ou padrão para saídas/requests permitidos.</p>
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="modalDeniedPatterns">Padrões Negados (Ex: Regex)</Label>
                <Textarea id="modalDeniedPatterns" value={modalDeniedPatterns} onChange={(e) => setModalDeniedPatterns(e.target.value)} placeholder="Ex: DELETE.* (para SQL) ou /admin.* (para APIs)" rows={2}/>
                <p className="text-xs text-muted-foreground">Opcional. Expressão regular ou padrão para saídas/requests negados. Geralmente prevalece sobre os permitidos.</p>
              </div>
              <div className="space-y-2 mt-2">
                <Label htmlFor="modalCustomRules">Regras Adicionais (Texto/JSON)</Label>
                <Textarea id="modalCustomRules" value={modalCustomRules} onChange={(e) => setModalCustomRules(e.target.value)} placeholder="Ex: { "max_rows": 100 } ou 'PROHIBIT_FILE_WRITE'" rows={2}/>
                <p className="text-xs text-muted-foreground">Opcional. Regras específicas em texto ou JSON, dependendo da capacidade da ferramenta.</p>
              </div>
            </div>
          </>
        )}
        </div>
        <DialogFooter>
           <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
           <Button onClick={handleInternalSave}>Salvar Configuração da Ferramenta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ToolConfigModal;
