// ArtifactsTab: Componente para a aba 'Artefatos'.
// Permite configurar o armazenamento e gerenciamento de artefatos que o agente
// pode criar ou utilizar durante sua execução.

import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent } from "@/components/ui/tabs"; // Needed for the root element
import type { ArtifactDefinition } from "@/types/agent-configs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Props para o componente ArtifactsTab.
interface ArtifactsTabProps {
  enableArtifacts: boolean;
  setEnableArtifacts: (enabled: boolean) => void;
  artifactStorageType: 'memory' | 'local' | 'cloud';
  setArtifactStorageType: (type: 'memory' | 'local' | 'cloud') => void;
  localStoragePath: string;
  setLocalStoragePath: (path: string) => void;
  cloudStorageBucket: string;
  setCloudStorageBucket: (bucket: string) => void;
  artifacts: ArtifactDefinition[];
  setArtifacts: React.Dispatch<React.SetStateAction<ArtifactDefinition[]>>;
  UploadCloudIcon: React.FC<React.SVGProps<SVGSVGElement>>;
  // Consider adding toast prop if error handling for JSON parse needs notifications
  // toast?: (options: { title: string; description?: string; variant?: string }) => void;
}

const ArtifactsTab: React.FC<ArtifactsTabProps> = ({
  enableArtifacts,
  setEnableArtifacts,
  artifactStorageType,
  setArtifactStorageType,
  localStoragePath,
  setLocalStoragePath,
  cloudStorageBucket,
  setCloudStorageBucket,
  artifacts,
  setArtifacts,
  UploadCloudIcon,
}) => {

  const handleArtifactsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const val = e.target.value.trim();
      if (!val) {
        setArtifacts([]);
        return;
      }
      const parsed = JSON.parse(val);
      // Basic validation: check if it's an array. More specific validation can be added.
      if (Array.isArray(parsed)) {
        setArtifacts(parsed as ArtifactDefinition[]); // Add type assertion
      } else {
        console.error("Formato JSON inválido para definições de artefatos: não é um array.");
        // if (toast) toast({ variant: "destructive", title: "JSON Inválido", description: "Definições de Artefatos devem ser um array." });
      }
    } catch (error) {
      console.error("Erro ao parsear JSON de definições de artefatos:", error);
      // if (toast) toast({ variant: "destructive", title: "Erro no JSON", description: "Verifique a sintaxe do JSON para Definições de Artefatos." });
    }
  };

  return (
    <TabsContent value="artifacts" className="space-y-6 mt-4">
      <Alert>
        <UploadCloudIcon className="h-4 w-4" />
        <AlertTitle>Gerenciamento de Artefatos</AlertTitle>
        <AlertDescription>
          Configure como o agente irá armazenar e gerenciar arquivos e outros artefatos que ele pode criar ou utilizar durante sua execução.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Armazenamento de Artefatos</CardTitle>
          <CardDescription>Define se e onde os artefatos gerados ou utilizados pelo agente são armazenados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="enableArtifactsSwitch" // Unique ID
              checked={enableArtifacts}
              onCheckedChange={setEnableArtifacts}
            />
            <Label htmlFor="enableArtifactsSwitch" className="text-base">Habilitar Armazenamento de Artefatos</Label>
          </div>

          {enableArtifacts && (
            <>
              <div className="space-y-2">
                <Label htmlFor="artifactStorageType">Tipo de Armazenamento</Label>
                <Select value={artifactStorageType} onValueChange={(value: 'memory' | 'local' | 'cloud') => setArtifactStorageType(value)}>
                  <SelectTrigger id="artifactStorageType">
                    <SelectValue placeholder="Selecione o tipo de armazenamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="memory">Memória (Temporário)</SelectItem>
                    <SelectItem value="local">Sistema de Arquivos Local</SelectItem>
                    <SelectItem value="cloud">Nuvem (Ex: Google Cloud Storage)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Define onde os artefatos serão guardados.</p>
              </div>

              {artifactStorageType === 'local' && (
                <div className="space-y-2">
                  <Label htmlFor="localStoragePath">Caminho de Armazenamento Local</Label>
                  <Input
                    id="localStoragePath"
                    placeholder="./agent_artifacts"
                    value={localStoragePath}
                    onChange={(e) => setLocalStoragePath(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Caminho no sistema de arquivos do servidor onde os artefatos serão salvos. Ex: "./artefatos_agente_X".
                  </p>
                </div>
              )}

              {artifactStorageType === 'cloud' && (
                <div className="space-y-2">
                  <Label htmlFor="cloudStorageBucket">Nome do Bucket de Armazenamento na Nuvem</Label>
                  <Input
                    id="cloudStorageBucket"
                    placeholder="Ex: meu-bucket-de-artefatos-agente"
                    value={cloudStorageBucket}
                    onChange={(e) => setCloudStorageBucket(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome do bucket no seu provedor de nuvem (ex: GCS, S3) para armazenar os artefatos.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="artifactsDefinitions" className="cursor-help">Definições de Artefatos (JSON)</Label>
                    </TooltipTrigger>
                    <TooltipContent className="w-[450px]"> {/* Increased width */}
                      <p>Forneça um array JSON de objetos. Cada objeto deve ter:</p>
                      <ul className="list-disc space-y-1 pl-4 my-1">
                        <li><strong>name:</strong> (string) Nome do artefato (ex: 'relatorio.pdf').</li>
                        <li><strong>description:</strong> (string) Breve descrição do artefato.</li>
                        <li><strong>type:</strong> (string) Tipo do artefato (ex: 'file', 'url', 'text_snippet', 'image', 'json_data').</li>
                      </ul>
                      <p>Chaves opcionais podem incluir 'mimeType', 'permissions', 'persisted', 'schema' (para json_data).</p>
                      <p className="mt-1"><strong>Exemplo:</strong></p>
                      <pre className="text-xs bg-muted p-1 rounded-sm mt-1"><code>{`[
  {"name": "relatorio_final.pdf", "description": "Relatório detalhado da análise.", "type": "file", "mimeType": "application/pdf"},
  {"name": "dados_processados.json", "description": "Resultado do processamento em JSON.", "type": "json_data"}
]`}</code></pre>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Textarea
                  id="artifactsDefinitions"
                  placeholder='[{"name": "relatorio.pdf", "description": "Relatório final", "type": "file"}, ...]'
                  value={JSON.stringify(artifacts, null, 2)}
                  onChange={handleArtifactsChange}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Defina os artefatos que o agente pode produzir ou consumir. A UI para gerenciamento individual de artefatos será melhorada futuramente.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default ArtifactsTab;
