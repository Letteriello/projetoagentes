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
import type { AvailableTool } from "@/types/agent-types";
import type { ToolConfigData } from "@/types/agent-configs"; // Import ToolConfigData

// Props para o componente ToolConfigModal.
interface ToolConfigModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void; // Handles closing the modal
  configuringTool: AvailableTool | null;
  onSave: (toolId: string, configData: ToolConfigData) => void; // This will be handleSaveToolConfiguration from the parent

  modalGoogleApiKey: string; setModalGoogleApiKey: (value: string) => void;
  modalGoogleCseId: string; setModalGoogleCseId: (value: string) => void;
  modalOpenapiSpecUrl: string; setModalOpenapiSpecUrl: (value: string) => void;
  modalOpenapiApiKey: string; setModalOpenapiApiKey: (value: string) => void;
  modalDbType: string; setModalDbType: (value: string) => void;
  modalDbHost: string; setModalDbHost: (value: string) => void;
  modalDbPort: number; setModalDbPort: (value: number) => void;
  modalDbName: string; setModalDbName: (value: string) => void;
  modalDbUser: string; setModalDbUser: (value: string) => void;
  modalDbPassword: string; setModalDbPassword: (value: string) => void;
  modalDbConnectionString: string; setModalDbConnectionString: (value: string) => void;
  modalDbDescription: string; setModalDbDescription: (value: string) => void;
  modalKnowledgeBaseId: string; setModalKnowledgeBaseId: (value: string) => void;
  modalCalendarApiEndpoint: string; setModalCalendarApiEndpoint: (value: string) => void;

  modalAllowedPatterns: string; setModalAllowedPatterns: (value: string) => void;
  modalDeniedPatterns: string; setModalDeniedPatterns: (value: string) => void;
  modalCustomRules: string; setModalCustomRules: (value: string) => void;
  InfoIcon: React.FC<React.SVGProps<SVGSVGElement>>;
}

// Define a mapping for tool-specific configuration keys
const toolConfigKeys: Record<string, (keyof ToolConfigData)[]> = {
  googleSearch: ["googleApiKey", "googleCseId"],
  openapiTool: ["openapiSpecUrl", "openapiApiKey"],
  databaseConnector: [
    "dbType",
    "dbHost",
    "dbPort",
    "dbName",
    "dbUser",
    "dbPassword",
    "dbConnectionString",
    "dbDescription",
  ],
  knowledgeBase: ["knowledgeBaseId"],
  calendarAccess: ["calendarApiEndpoint"],
};

const ToolConfigModal: React.FC<ToolConfigModalProps> = ({
  isOpen,
  onOpenChange,
  configuringTool,
  onSave,
  modalGoogleApiKey, setModalGoogleApiKey,
  modalGoogleCseId, setModalGoogleCseId,
  modalOpenapiSpecUrl, setModalOpenapiSpecUrl,
  modalOpenapiApiKey, setModalOpenapiApiKey,
  modalDbType, setModalDbType,
  modalDbHost, setModalDbHost,
  modalDbPort, setModalDbPort,
  modalDbName, setModalDbName,
  modalDbUser, setModalDbUser,
  modalDbPassword, setModalDbPassword,
  modalDbConnectionString, setModalDbConnectionString,
  modalDbDescription, setModalDbDescription,
  modalKnowledgeBaseId, setModalKnowledgeBaseId,
  modalCalendarApiEndpoint, setModalCalendarApiEndpoint,
  modalAllowedPatterns, setModalAllowedPatterns,
  modalDeniedPatterns, setModalDeniedPatterns,
  modalCustomRules, setModalCustomRules,
  InfoIcon,
}) => {
  const handleInternalSave = () => {
    if (!configuringTool) return;

    const configData: Partial<ToolConfigData> = {};
    const toolId = configuringTool.id;

    // Populate configData based on the tool type and its defined keys
    switch (toolId) {
      case "googleSearch":
        configData.googleApiKey = modalGoogleApiKey;
        configData.googleCseId = modalGoogleCseId;
        break;
      case "openapiTool":
        configData.openapiSpecUrl = modalOpenapiSpecUrl;
        configData.openapiApiKey = modalOpenapiApiKey;
        break;
      case "databaseConnector":
        configData.dbType = modalDbType as ToolConfigData['dbType']; // Cast if modalDbType is broader
        configData.dbHost = modalDbHost;
        configData.dbPort = modalDbPort;
        configData.dbName = modalDbName;
        configData.dbUser = modalDbUser;
        configData.dbPassword = modalDbPassword;
        configData.dbConnectionString = modalDbConnectionString;
        configData.dbDescription = modalDbDescription;
        break;
      case "knowledgeBase":
        configData.knowledgeBaseId = modalKnowledgeBaseId;
        break;
      case "calendarAccess":
        configData.calendarApiEndpoint = modalCalendarApiEndpoint;
        break;
      default:
        // Handle other tools or throw an error if unexpected toolId
        console.warn(`Unknown toolId for configuration: ${toolId}`);
        break;
    }

    // Add guardrail data for relevant tools
    if (configuringTool && ["databaseConnector", "openapiTool", "codeExecutor"].includes(configuringTool.id)) {
      configData.allowedPatterns = modalAllowedPatterns;
      configData.deniedPatterns = modalDeniedPatterns;
      configData.customRules = modalCustomRules;
    }

    onSave(toolId, configData as ToolConfigData); // Call the parent's onSave with all data
  };

  if (!configuringTool) {
    return null; // Não renderiza nada se não houver ferramenta para configurar
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Ferramenta: {configuringTool.name}</DialogTitle>
          <DialogDescription>{configuringTool.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Renderização condicional dos campos de configuração baseado no ID da ferramenta. */}
          {configuringTool.id === "webSearch" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="modalGoogleApiKey">Chave API Google</Label>
              <Input id="modalGoogleApiKey" value={modalGoogleApiKey} onChange={(e) => setModalGoogleApiKey(e.target.value)} placeholder="ex: AIzaSy..."/>
              <p className="text-xs text-muted-foreground">Chave de API do Google (Custom Search API) para busca na web.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modalGoogleCseId">ID do Mecanismo de Busca</Label>
              <Input id="modalGoogleCseId" value={modalGoogleCseId} onChange={(e) => setModalGoogleCseId(e.target.value)} placeholder="ex: 0123456789abcdefg"/>
              <p className="text-xs text-muted-foreground">ID do Mecanismo de Busca Personalizado (CSE ID) do Google.</p>
            </div>
          </>
        )}
        {configuringTool.id === "customApiIntegration" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="modalOpenapiSpecUrl">URL Esquema OpenAPI (JSON/YAML)</Label>
              <Input id="modalOpenapiSpecUrl" value={modalOpenapiSpecUrl} onChange={(e) => setModalOpenapiSpecUrl(e.target.value)} placeholder="ex: https://petstore.swagger.io/v2/swagger.json"/>
              <p className="text-xs text-muted-foreground">Link para a especificação OpenAPI (v2 ou v3) da API externa.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="modalOpenapiApiKey">Chave API Externa (Opcional)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="max-w-xs">Atenção: Inserir segredos diretamente na UI pode ser arriscado. Considere usar um gerenciador de segredos ou configuração de backend para produção.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input id="modalOpenapiApiKey" value={modalOpenapiApiKey} onChange={(e) => setModalOpenapiApiKey(e.target.value)} placeholder="Se a API requer autenticação por chave" type="password"/>
              <p className="text-xs text-muted-foreground">Chave de API para autenticação no serviço externo, se necessário.</p>
            </div>
          </>
        )}
        {configuringTool.id === "databaseAccess" && (
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
            {(modalDbType && modalDbType !== 'other' && modalDbType !== 'sqlite') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modalDbHost">Host</Label>
                    <Input id="modalDbHost" value={modalDbHost} onChange={(e) => setModalDbHost(e.target.value)} placeholder="ex: localhost"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modalDbPort">Porta</Label>
                    <Input id="modalDbPort" type="number" value={String(modalDbPort)} onChange={(e) => setModalDbPort(Number(e.target.value))} placeholder="ex: 5432"/>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modalDbName">Nome do Banco</Label>
                  <Input id="modalDbName" value={modalDbName} onChange={(e) => setModalDbName(e.target.value)} placeholder="ex: meu_banco_de_dados"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modalDbUser">Usuário</Label>
                    <Input id="modalDbUser" value={modalDbUser} onChange={(e) => setModalDbUser(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="modalDbPassword">Senha</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                           <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p className="max-w-xs">Atenção: Inserir segredos diretamente na UI pode ser arriscado. Considere usar um gerenciador de segredos ou configuração de backend para produção.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Input id="modalDbPassword" type="password" value={modalDbPassword} onChange={(e) => setModalDbPassword(e.target.value)} />
                  </div>
                </div>
              </>
            )}
            {(modalDbType === 'other' || modalDbType === 'sqlite') && (
              <div className="space-y-2">
                <Label htmlFor="modalDbConnectionString">String de Conexão / Caminho do Arquivo</Label>
                <Input id="modalDbConnectionString" value={modalDbConnectionString} onChange={(e) => setModalDbConnectionString(e.target.value)} placeholder={modalDbType === 'sqlite' ? "ex: /caminho/para/seu/banco.sqlite" : "driver://usuario:senha@host:porta/banco"}/>
                <p className="text-xs text-muted-foreground">{modalDbType === 'sqlite' ? 'Caminho completo para o arquivo do banco de dados SQLite.' : 'String de conexão JDBC/ODBC completa.'}</p>
              </div>
            )}
             <div className="space-y-2">
              <Label htmlFor="modalDbDescription">Descrição do Banco/Tabelas (Opcional)</Label>
              <Textarea id="modalDbDescription" value={modalDbDescription} onChange={(e) => setModalDbDescription(e.target.value)} placeholder="Ex: Tabela 'usuarios' (id, nome, email), Tabela 'pedidos' (id, usuario_id, produto, qtd, data)" rows={3}/>
              <p className="text-xs text-muted-foreground">Ajuda o agente a entender o esquema do banco de dados e a formular queries SQL mais precisas.</p>
            </div>
          </>
        )}
        {configuringTool.id === "knowledgeBase" && (
          <div className="space-y-2">
            <Label htmlFor="modalKnowledgeBaseId">ID/Nome da Base de Conhecimento</Label>
            <Input id="modalKnowledgeBaseId" value={modalKnowledgeBaseId} onChange={(e) => setModalKnowledgeBaseId(e.target.value)} placeholder="ex: documentos_produto_v2"/>
            <p className="text-xs text-muted-foreground">Identificador único para a base de conhecimento que será utilizada (geralmente associado a um sistema RAG).</p>
          </div>
        )}
        {configuringTool.id === "calendarAccess" && (
          <div className="space-y-2">
            <Label htmlFor="modalCalendarApiEndpoint">Endpoint da API de Calendário / ID do Fluxo Genkit</Label>
            <Input id="modalCalendarApiEndpoint" value={modalCalendarApiEndpoint} onChange={(e) => setModalCalendarApiEndpoint(e.target.value)} placeholder="ex: https://api.example.com/calendar ou meuFluxoGenkitCalendario"/>
            <p className="text-xs text-muted-foreground">URL do endpoint da API de calendário ou o identificador de um fluxo Genkit que encapsula o acesso à agenda.</p>
          </div>
        )}

        {/* Guardrail UI fields */}
        {configuringTool && ["databaseConnector", "openapiTool", "codeExecutor"].includes(configuringTool.id) && (
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
