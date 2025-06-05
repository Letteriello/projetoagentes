// RagTab: Componente para a aba 'RAG' (Retrieval Augmented Generation).
// Permite configurar as opções de RAG para o agente, incluindo tipo de serviço,
// configurações específicas do provedor, fontes de conhecimento e outros parâmetros.

import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox"; // Checkbox is used here
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { TabsContent } from "@/components/ui/tabs"; // Needed for the root element
import type { RagMemoryConfig } from '@/types/agent-configs-fixed';
import type { MemoryServiceType } from "./memory-knowledge-tab"; // Local type, or import from actual source
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Props para o componente RagTab.
interface RagTabProps {
  enableRAG: boolean;
  setEnableRAG: (enabled: boolean) => void;
  ragMemoryConfig: RagMemoryConfig;
  setRagMemoryConfig: React.Dispatch<React.SetStateAction<RagMemoryConfig>>;
  initialRagMemoryConfig: RagMemoryConfig; // Used for resetting or providing defaults
  toast: (options: { title: string; description?: string; variant?: "default" | "destructive" | "success" }) => void;
  FileJsonIcon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const RagTab: React.FC<RagTabProps> = ({
  enableRAG,
  setEnableRAG,
  ragMemoryConfig,
  setRagMemoryConfig,
  initialRagMemoryConfig, // Not directly used in handlers here, but good for context or future resets
  toast,
  FileJsonIcon,
}) => {

  const handleKnowledgeSourcesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const val = e.target.value.trim();
      if (!val) {
        setRagMemoryConfig((prev) => ({ ...prev, knowledgeSources: [] }));
        return;
      }
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && 'type' in item && 'content' in item && 'name' in item)) {
        setRagMemoryConfig(prev => ({ ...prev, knowledgeSources: parsed }));
      } else {
        toast({ variant: "destructive", title: "JSON Inválido", description: "Fontes de Conhecimento devem ser um array de objetos com 'type', 'content' e 'name'." });
      }
    } catch (error) {
      console.error("Erro ao parsear JSON das fontes de conhecimento:", error);
      toast({ variant: "destructive", title: "Erro no JSON", description: "Verifique a sintaxe do JSON para Fontes de Conhecimento." });
    }
  };

  return (
    <TabsContent value="rag" className="space-y-6 mt-4">
      <Alert>
        <FileJsonIcon className="h-4 w-4" />
        <AlertTitle>RAG - Retrieval Augmented Generation</AlertTitle>
        <AlertDescription>
          Habilite e configure o RAG para permitir que o agente consulte bases de conhecimento externas para enriquecer suas respostas.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do RAG</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="enableRAGSwitch" // Changed ID to avoid conflict
              checked={enableRAG}
              onCheckedChange={setEnableRAG}
            />
            <Label htmlFor="enableRAGSwitch" className="text-base">Habilitar RAG</Label>
          </div>

          {enableRAG && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ragServiceType">Serviço de Busca/Vetorização</Label>
                  <Select
                    value={ragMemoryConfig.serviceType || "vertexAISearch"}
                    onValueChange={(value) => setRagMemoryConfig(prev => ({ ...prev, serviceType: value as MemoryServiceType }))}
                  >
                    <SelectTrigger id="ragServiceType">
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vertexAISearch">Vertex AI Search & Conversation</SelectItem>
                      <SelectItem value="pinecone">Pinecone</SelectItem>
                      <SelectItem value="localFaiss">FAISS Local</SelectItem>
                      <SelectItem value="googleSearch">Google Custom Search (para RAG simples)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Escolha o backend para busca e recuperação de informações.</p>
                </div>

                {ragMemoryConfig.serviceType === "vertexAISearch" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="ragProjectIdVertex">ID do Projeto Cloud (Vertex AI)</Label>
                      <Input
                        id="ragProjectIdVertex"
                        placeholder="Seu ID do projeto GCP"
                        value={ragMemoryConfig.vertexAISearchConfig?.projectId || ""}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setRagMemoryConfig((prev) => ({
                            ...prev,
                            vertexAISearchConfig: {
                              ...(prev.vertexAISearchConfig || { location: "", dataStoreId: "" }), // Ensure object exists
                              projectId: newValue,
                            },
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ragLocationVertex">Localização (Região Vertex AI)</Label>
                      <Input
                        id="ragLocationVertex"
                        placeholder="Ex: us-central1"
                        value={ragMemoryConfig.vertexAISearchConfig?.location || ""}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setRagMemoryConfig((prev) => ({
                            ...prev,
                            vertexAISearchConfig: {
                              ...(prev.vertexAISearchConfig || { projectId: "", dataStoreId: "" }), // Ensure object exists
                              location: newValue,
                            },
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vertexDataStoreId">ID do DataStore (Vertex AI)</Label>
                      <Input
                        id="vertexDataStoreId"
                        placeholder="ID do seu DataStore no Vertex AI Search"
                        value={ragMemoryConfig.vertexAISearchConfig?.dataStoreId || ""}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setRagMemoryConfig((prev) => ({
                            ...prev,
                            vertexAISearchConfig: {
                              ...(prev.vertexAISearchConfig || { projectId: "", location: "" }), // Ensure object exists
                              dataStoreId: newValue,
                            },
                          }));
                        }}
                      />
                       <p className="text-xs text-muted-foreground">Identificador da sua coleção de dados no Vertex AI Search.</p>
                    </div>
                  </>
                )}

                {ragMemoryConfig.serviceType === 'pinecone' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="pineconeIndexName">Nome do Índice (Pinecone)</Label>
                      <Input
                        id="pineconeIndexName"
                        placeholder="Nome do seu índice no Pinecone"
                        value={ragMemoryConfig.pineconeConfig?.indexName || ""}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setRagMemoryConfig((prev) => ({
                            ...prev,
                            pineconeConfig: {
                              ...(prev.pineconeConfig || { environment: "", apiKey: "" }), // Ensure object exists
                              indexName: newValue
                            },
                          }));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pineconeEnv">Ambiente (Pinecone)</Label>
                      <Input
                        id="pineconeEnv"
                        placeholder="Ex: us-west1-gcp"
                        value={ragMemoryConfig.pineconeConfig?.environment || ""}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setRagMemoryConfig((prev) => ({
                            ...prev,
                            pineconeConfig: {
                              ...(prev.pineconeConfig || { indexName: "", apiKey: "" }), // Ensure object exists
                              environment: newValue
                            },
                          }));
                        }}
                      />
                    </div>
                     <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="pineconeApiKey">Chave API (Pinecone)</Label>
                      <Input
                        id="pineconeApiKey"
                        type="password"
                        placeholder="Sua chave API do Pinecone"
                        value={ragMemoryConfig.pineconeConfig?.apiKey || ""}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setRagMemoryConfig((prev) => ({
                            ...prev,
                            pineconeConfig: {
                              ...(prev.pineconeConfig || { indexName: "", environment: "" }), // Ensure object exists
                              apiKey: newValue
                            },
                          }));
                        }}
                      />
                       <p className="text-xs text-muted-foreground">Recomendado configurar via variáveis de ambiente no backend para produção.</p>
                    </div>
                  </>
                )}
                 <div className="space-y-2">
                    <Label htmlFor="ragEmbeddingModel">Modelo de Embedding</Label>
                    <Input
                        id="ragEmbeddingModel"
                        placeholder="Ex: text-embedding-004 (Opcional)"
                        value={ragMemoryConfig.embeddingModel || ""}
                        onChange={(e) => setRagMemoryConfig(prev => ({ ...prev, embeddingModel: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">Modelo usado para gerar embeddings. Deixe em branco para usar o padrão do serviço.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ragSimilarityTopK">Top K (Similaridade)</Label>
                  <Input
                    id="ragSimilarityTopK"
                    type="number"
                    value={String(ragMemoryConfig.similarityTopK || 5)}
                    onChange={(e) => setRagMemoryConfig(prev => ({ ...prev, similarityTopK: parseInt(e.target.value, 10) || 5 }))}
                  />
                  <p className="text-xs text-muted-foreground">Número de resultados mais similares a serem recuperados.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ragVectorDistanceThreshold">Limiar de Distância Vetorial - <Badge variant="outline" className="text-xs">{(ragMemoryConfig.vectorDistanceThreshold || 0.5).toFixed(2)}</Badge></Label>
                  <Slider
                    id="ragVectorDistanceThreshold"
                    min={0} max={1} step={0.05}
                    value={[ragMemoryConfig.vectorDistanceThreshold || 0.5]}
                    onValueChange={(value) => setRagMemoryConfig(prev => ({ ...prev, vectorDistanceThreshold: value[0] }))}
                  />
                  <p className="text-xs text-muted-foreground">Distância máxima para considerar um resultado relevante (0 a 1). Menor = mais estrito.</p>
                </div>
              </div>

              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="ragKnowledgeSources" className="cursor-help">Fontes de Conhecimento (JSON)</Label>
                    </TooltipTrigger>
                    <TooltipContent className="w-[450px]"> {/* Increased width for better readability */}
                      <p>Forneça um array JSON de objetos. Cada objeto deve ter:</p>
                      <ul className="list-disc space-y-1 pl-4 my-1">
                        <li><strong>name:</strong> (string) Um nome descritivo para a fonte.</li>
                        <li><strong>type:</strong> (string) O tipo da fonte (ex: 'web_url', 'gcs_uri', 'text', 'file_upload').</li>
                        <li><strong>content:</strong> (string) A URL, URI do GCS, o texto direto, ou o nome do arquivo (para 'file_upload').</li>
                      </ul>
                      <p className="mt-1"><strong>Exemplo:</strong></p>
                      <pre className="text-xs bg-muted p-1 rounded-sm mt-1"><code>{`[
  {"name": "FAQ Site", "type": "web_url", "content": "https://example.com/faq"},
  {"name": "Documento PDF", "type": "gcs_uri", "content": "gs://meu-bucket/documento.pdf"},
  {"name": "Nota Rápida", "type": "text", "content": "Lembrar de verificar as configurações X."}
]`}</code></pre>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Textarea
                  id="ragKnowledgeSources"
                  placeholder='[{"name": "FAQ Site", "type": "web_url", "content": "https://example.com/faq"}, ...]'
                  value={JSON.stringify(ragMemoryConfig.knowledgeSources || [], null, 2)}
                  onChange={handleKnowledgeSourcesChange}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Defina as fontes de dados para o RAG. A UI para upload direto e gerenciamento individual será melhorada.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ragIncludeConversationContext"
                  checked={ragMemoryConfig.includeConversationContext === undefined ? true : ragMemoryConfig.includeConversationContext}
                  onCheckedChange={(checked) => setRagMemoryConfig(prev => ({ ...prev, includeConversationContext: Boolean(checked) }))}
                />
                <Label htmlFor="ragIncludeConversationContext">Incluir Contexto da Conversa na Busca RAG</Label>
              </div>
              <p className="text-xs text-muted-foreground -mt-3 pl-6">
                Se marcado, o histórico da conversa atual será usado para refinar a busca RAG, tornando os resultados mais contextuais.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default RagTab;
