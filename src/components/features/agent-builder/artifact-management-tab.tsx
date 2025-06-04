"use client";

import * as React from "react";
import {
  FileText,
  Image,
  Database,
  Plus,
  Info,
  Trash2,
  Film,
  Music,
  File,
  FileJson,
  Shield,
  FolderKey,
  Eye,
  Edit3, // Added for Edit button
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUploader } from "@/components/ui/file-uploader"; // Added
import { useToast } from "@/hooks/use-toast"; // Added

// Tipos de artefatos suportados pelo Google ADK
export type ArtifactType =
  | "document"
  | "image"
  | "video"
  | "audio"
  | "json"
  | "binary"
  | "reference"; // Referência a um artefato externo (URI/caminho)

export type ArtifactMimeType =
  | "text/plain"
  | "text/html"
  | "text/csv"
  | "text/markdown"
  | "application/pdf"
  | "application/json"
  | "image/png"
  | "image/jpeg"
  | "image/gif"
  | "image/webp"
  | "video/mp4"
  | "audio/mp3"
  | "audio/wav"
  | "application/octet-stream"
  | string; // Para tipos personalizados

// Interface for a single version of an artifact
export interface ArtifactVersion {
  versionId: string;
  name: string;
  description: string;
  mimeType: ArtifactMimeType;
  timestamp: string; // ISO string for when this version was created
  // Potentially other metadata like author, notes, etc.
}
export interface ArtifactDefinition {
  id: string;
  name: string;
  description: string;
  type: ArtifactType;
  mimeType: ArtifactMimeType;
  accessRoles: ("user" | "agent" | "sub-agent")[];
  persist: boolean;
  versioning: boolean;
  maxSizeKb?: number;
  allowedSourcePatterns?: string[]; // Para artefatos de referência, padrões de URI permitidos
  versions?: ArtifactVersion[]; // Array to store historical versions
  currentVersionId?: string; // ID of the currently active/displayed version (optional)
}

interface ArtifactManagementTabProps {
  enableArtifacts: boolean;
  setEnableArtifacts: (value: boolean) => void;
  artifactStorageType: "memory" | "filesystem" | "cloud";
  setArtifactStorageType: (value: "memory" | "filesystem" | "cloud") => void;
  artifacts: ArtifactDefinition[];
  setArtifacts: (artifacts: ArtifactDefinition[]) => void;
  cloudStorageBucket?: string;
  setCloudStorageBucket?: (value: string) => void;
  localStoragePath?: string;
  setLocalStoragePath?: (value: string) => void;
}

export function ArtifactManagementTab({
  enableArtifacts,
  setEnableArtifacts,
  artifactStorageType,
  setArtifactStorageType,
  artifacts,
  setArtifacts,
  cloudStorageBucket,
  setCloudStorageBucket,
  localStoragePath,
  setLocalStoragePath,
}: ArtifactManagementTabProps) {
  const { toast } = useToast(); // Added
  const [isUploading, setIsUploading] = React.useState(false); // Added
  const [showNewArtifactForm, setShowNewArtifactForm] = React.useState(false);

  // Estado para o novo artefato
  const [newArtifact, setNewArtifact] = React.useState<
    Partial<ArtifactDefinition>
  >({
    id: `artifact-${Date.now()}`,
    name: "",
    description: "",
    type: "document",
    mimeType: "text/plain",
    accessRoles: ["agent"],
    persist: true,
    versioning: false,
    versions: [], // Initialize versions
    currentVersionId: undefined, // Initialize currentVersionId
  });

  const MAX_VERSIONS_TO_STORE = 5; // Max number of mock versions to keep

  // Função auxiliar para obter o ícone com base no tipo de artefato
  const getArtifactIcon = (type: ArtifactType) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4" />;
      case "image":
        return <Image className="h-4 w-4" />;
      case "video":
        return <Film className="h-4 w-4" />;
      case "audio":
        return <Music className="h-4 w-4" />;
      case "json":
        return <FileJson className="h-4 w-4" />;
      case "binary":
        return <File className="h-4 w-4" />;
      case "reference":
        return <FolderKey className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  // Função auxiliar para obter o tipo MIME padrão com base no tipo de artefato
  const getDefaultMimeType = (type: ArtifactType): ArtifactMimeType => {
    switch (type) {
      case "document":
        return "text/plain";
      case "image":
        return "image/png";
      case "video":
        return "video/mp4";
      case "audio":
        return "audio/mp3";
      case "json":
        return "application/json";
      case "binary":
        return "application/octet-stream";
      case "reference":
        return "text/plain"; // Para referências, é o caminho/URI
      default:
        return "text/plain";
    }
  };

  // Opções de tipo MIME com base no tipo de artefato selecionado
  const getMimeTypeOptions = (type: ArtifactType) => {
    switch (type) {
      case "document":
        return [
          { value: "text/plain", label: "Texto Simples (text/plain)" },
          { value: "text/html", label: "HTML (text/html)" },
          { value: "text/markdown", label: "Markdown (text/markdown)" },
          { value: "text/csv", label: "CSV (text/csv)" },
          { value: "application/pdf", label: "PDF (application/pdf)" },
        ];
      case "image":
        return [
          { value: "image/png", label: "PNG (image/png)" },
          { value: "image/jpeg", label: "JPEG (image/jpeg)" },
          { value: "image/gif", label: "GIF (image/gif)" },
          { value: "image/webp", label: "WebP (image/webp)" },
        ];
      case "video":
        return [{ value: "video/mp4", label: "MP4 (video/mp4)" }];
      case "audio":
        return [
          { value: "audio/mp3", label: "MP3 (audio/mp3)" },
          { value: "audio/wav", label: "WAV (audio/wav)" },
        ];
      case "json":
        return [
          { value: "application/json", label: "JSON (application/json)" },
        ];
      case "binary":
        return [
          {
            value: "application/octet-stream",
            label: "Binário (application/octet-stream)",
          },
        ];
      case "reference":
        return [
          {
            value: "text/plain",
            label: "Referência de Caminho/URI (text/plain)",
          },
        ];
      default:
        return [{ value: "text/plain", label: "Texto Simples (text/plain)" }];
    }
  };

  // Handler para alteração de tipo de artefato
  const handleArtifactTypeChange = (type: ArtifactType) => {
    setNewArtifact({
      ...newArtifact,
      type,
      mimeType: getDefaultMimeType(type),
    });
  };

  // Handler para alteração de roles de acesso
  const handleAccessRoleChange = (
    role: "user" | "agent" | "sub-agent",
    checked: boolean,
  ) => {
    const currentRoles = newArtifact.accessRoles || [];
    if (checked) {
      setNewArtifact({
        ...newArtifact,
        accessRoles: [...currentRoles, role].filter(
          (v, i, a) => a.indexOf(v) === i,
        ), // Remove duplicados
      });
    } else {
      setNewArtifact({
        ...newArtifact,
        accessRoles: currentRoles.filter((r) => r !== role),
      });
    }
  };

  // Adicionar um novo artefato
  const handleAddArtifact = () => {
    if (!newArtifact.name || !newArtifact.id) return;

    const existingArtifactIndex = artifacts.findIndex(art => art.id === newArtifact.id);

    let updatedArtifacts = [...artifacts];

    if (existingArtifactIndex !== -1) { // Editing existing artifact
      const originalArtifact = artifacts[existingArtifactIndex];
      let newVersions = originalArtifact.versions ? [...originalArtifact.versions] : [];

      if (newArtifact.versioning) {
        // Create a version entry from the originalArtifact's current state (before update)
        const versionEntry: ArtifactVersion = {
          versionId: `v${Date.now()}`, // Simple version ID
          name: originalArtifact.name,
          description: originalArtifact.description,
          mimeType: originalArtifact.mimeType,
          timestamp: new Date().toISOString(),
        };
        newVersions.unshift(versionEntry); // Add to the beginning
        if (newVersions.length > MAX_VERSIONS_TO_STORE) {
          newVersions = newVersions.slice(0, MAX_VERSIONS_TO_STORE); // Keep only the last N versions
        }
      }

      const updatedArtifactData: ArtifactDefinition = {
        ...originalArtifact, // Preserve other fields not in the form if any
        ...newArtifact, // Apply changes from the form
        id: originalArtifact.id, // Ensure ID is not changed from newArtifact state if it was different
        versions: newVersions,
        // currentVersionId could be set here if a "latest" version is always active after edit
      };
      updatedArtifacts[existingArtifactIndex] = updatedArtifactData;
      toast({ title: "Artefato Atualizado", description: `"${newArtifact.name}" foi atualizado.`, variant: "success" });

    } else { // Adding new artifact
      const completeNewArtifact: ArtifactDefinition = {
        id: newArtifact.id, // Use ID from newArtifact (already has Date.now() or from edit)
        name: newArtifact.name,
        description: newArtifact.description || "",
        type: newArtifact.type || "document",
        mimeType: newArtifact.mimeType || "text/plain",
        accessRoles: newArtifact.accessRoles || ["agent"],
        persist: newArtifact.persist !== undefined ? newArtifact.persist : true,
        versioning: newArtifact.versioning || false,
        maxSizeKb: newArtifact.maxSizeKb,
        allowedSourcePatterns: newArtifact.allowedSourcePatterns,
        versions: [], // Initialize with empty versions
        currentVersionId: undefined,
      };
      updatedArtifacts.push(completeNewArtifact);
      toast({ title: "Artefato Adicionado", description: `"${newArtifact.name}" foi adicionado.`, variant: "success" });
    }

    setArtifacts(updatedArtifacts);

    // Resetar o formulário
    setNewArtifact({
      id: `artifact-${Date.now()}`, // New ID for next potential new artifact
      name: "",
      description: "",
      type: "document",
      mimeType: "text/plain",
      accessRoles: ["agent"],
      persist: true,
      versioning: false,
      versions: [],
      currentVersionId: undefined,
    });
    setShowNewArtifactForm(false);
  };

  // Remover um artefato
  const handleRemoveArtifact = (id: string) => {
    setArtifacts(artifacts.filter((artifact) => artifact.id !== id));
  };

  // Handler para iniciar a "edição" de um artefato (preenche o formulário)
  const handleStartEditArtifact = (artifactToEdit: ArtifactDefinition) => {
    console.log("Editing artifact (loading into form):", artifactToEdit.id, artifactToEdit);
    // Deep copy to avoid direct state mutation if artifactToEdit is from state's artifacts array
    setNewArtifact(JSON.parse(JSON.stringify(artifactToEdit)));
    setShowNewArtifactForm(true);
    const formCard = document.getElementById('new-artifact-form-card');
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handler para visualizar uma versão específica (mock)
  const handleViewVersion = (artifactId: string, versionId: string) => {
    const artifact = artifacts.find(art => art.id === artifactId);
    if (artifact && artifact.versions) {
      const version = artifact.versions.find(v => v.versionId === versionId);
      if (version) {
        console.log(`Viewing version ${versionId} for artifact ${artifactId}:`, version);
        toast({
          title: `Visualizando Versão ${versionId.substring(0, 6)}...`,
          description: `Nome: ${version.name}, Descrição: ${version.description}, MIME: ${version.mimeType}, Data: ${new Date(version.timestamp).toLocaleString()}`,
        });
        // Optional: Pre-fill form with this version's data (read-only or marked)
        // setNewArtifact({ ...artifact, ...version, id: artifact.id, currentVersionId: versionId }); // Spread version over artifact base
        // setShowNewArtifactForm(true);
      }
    }
  };

  // Handler para arquivos selecionados no FileUploader
  const handleFilesSelected = async (files: File[]) => {
    if (!enableArtifacts || (artifactStorageType !== "filesystem" && artifactStorageType !== "cloud")) {
      toast({
        title: "Upload não permitido",
        description: "O upload de artefatos só é permitido quando o armazenamento está configurado para 'Sistema de Arquivos' ou 'Nuvem'.",
        variant: "warning",
      });
      return;
    }

    if (files.length === 0) {
      return;
    }

    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const response = await fetch("/api/artifacts/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erro desconhecido", details: response.statusText }));
        throw new Error(errorData.details || errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Artifact URI:", data.uri); // Log para o console como solicitado
      toast({
        title: "Upload Concluído",
        description: `Arquivo ${file.name} carregado. URI: ${data.uri}`,
        variant: "success",
      });
      // Aqui você pode querer associar o URI a um artefato existente ou ao novo artefato
      // Por exemplo, se 'newArtifact' estiver sendo editado e for do tipo 'reference',
      // você poderia setar newArtifact.sourceUri = data.uri (ou similar)
      // No entanto, a tarefa atual não especifica essa integração, apenas o upload.

    } catch (error) {
      console.error("Falha no upload do artefato:", error);
      toast({
        title: "Falha no Upload",
        description: error instanceof Error ? error.message : "Ocorreu um erro desconhecido durante o upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
        <Database className="w-5 h-5 text-primary/80" /> Gerenciamento de
        Artefatos
      </h3>

      <Alert variant="default" className="mb-4 bg-card border-border/70">
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <AlertTitle className="text-sm font-medium">
          Manipulação de Conteúdo
        </AlertTitle>
        <AlertDescription className="text-xs">
          Configure como o agente pode criar, modificar e acessar artefatos como
          documentos, imagens e outros tipos de conteúdo. Os artefatos são
          objetos gerados ou consumidos durante a execução do agente.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        {/* Seção de Configuração Geral de Artefatos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database size={16} className="text-primary/80" />
              Configuração de Artefatos
            </CardTitle>
            <CardDescription>
              Configure o armazenamento e o gerenciamento de artefatos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Switch
                id="enableArtifacts"
                checked={enableArtifacts}
                onCheckedChange={setEnableArtifacts}
              />
              <Label htmlFor="enableArtifacts" className="flex items-center">
                Habilitar Gerenciamento de Artefatos
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Info size={14} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      Permite que o agente crie, leia, atualize e exclua
                      artefatos (arquivos, dados estruturados, etc.) durante sua
                      execução. Essencial para tarefas que envolvem manipulação
                      de dados ou geração de resultados complexos.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
            </div>

            {enableArtifacts && (
              <div className="space-y-4">
                <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                  <Label
                    htmlFor="artifact-storage-type"
                    className="text-left flex items-center"
                  >
                    Tipo de Armazenamento
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Info size={14} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>
                          Define onde os artefatos gerados ou utilizados pelo
                          agente serão armazenados (ADK Storage Options):
                        </p>
                        <ul className="list-disc pl-4 mt-1 text-xs">
                          <li>
                            <strong>Memória:</strong> Armazenamento temporário
                            na memória do agente, perdido ao reiniciar.
                          </li>
                          <li>
                            <strong>Sistema de Arquivos:</strong> Salva os
                            artefatos no sistema de arquivos local do servidor
                            onde o agente está rodando.
                          </li>
                          <li>
                            <strong>Nuvem (Cloud):</strong> Utiliza um serviço
                            de armazenamento em nuvem (ex: Google Cloud Storage)
                            para persistência robusta e escalável.
                          </li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Select
                    value={artifactStorageType}
                    onValueChange={(value: "memory" | "filesystem" | "cloud") =>
                      setArtifactStorageType(value)
                    }
                  >
                    <SelectTrigger id="artifact-storage-type" className="h-9">
                      <SelectValue placeholder="Selecione o tipo de armazenamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="memory">
                        Em Memória (apenas durante execução)
                      </SelectItem>
                      <SelectItem value="filesystem">
                        Sistema de Arquivos Local
                      </SelectItem>
                      <SelectItem value="cloud">
                        Armazenamento em Nuvem (ex: Google Cloud Storage)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {artifactStorageType === "filesystem" &&
                  setLocalStoragePath && (
                    <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                      <Label
                        htmlFor="local-storage-path"
                        className="text-left flex items-center"
                      >
                        Caminho Local
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <Info size={14} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>
                              Se o tipo de armazenamento for "Sistema de
                              Arquivos", especifique o caminho absoluto no
                              servidor onde os artefatos devem ser salvos.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="local-storage-path"
                        value={localStoragePath || ""}
                        onChange={(e) => setLocalStoragePath(e.target.value)}
                        placeholder="ex: /data/artifacts ou C:\artifacts"
                        className="h-9"
                      />
                    </div>
                  )}

                {artifactStorageType === "cloud" && setCloudStorageBucket && (
                  <div className="grid grid-cols-[200px_1fr] items-center gap-x-4 gap-y-3">
                    <Label
                      htmlFor="cloud-storage-bucket"
                      className="text-left flex items-center"
                    >
                      Bucket de Armazenamento
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <Info size={14} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            Se o tipo de armazenamento for "Nuvem", especifique
                            o nome do bucket no seu provedor de nuvem (ex: um
                            bucket no Google Cloud Storage) onde os artefatos
                            serão armazenados.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="cloud-storage-bucket"
                      value={cloudStorageBucket || ""}
                      onChange={(e) => setCloudStorageBucket(e.target.value)}
                      placeholder="ex: my-artifacts-bucket"
                      className="h-9"
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seção de Definição de Artefatos */}
        {enableArtifacts && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <File size={16} className="text-primary/80" />
                Definição de Artefatos
              </CardTitle>
              <CardDescription>
                Defina os tipos de artefatos que o agente pode criar ou consumir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {artifacts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          Tipo
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0"
                              >
                                <Info size={12} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                O tipo geral do artefato (ADK Artifact Types):
                              </p>
                              <ul className="list-disc pl-4 mt-1 text-xs">
                                <li>
                                  <strong>Documento:</strong> Arquivos textuais,
                                  planilhas, PDFs, etc.
                                </li>
                                <li>
                                  <strong>Imagem:</strong> Arquivos de imagem
                                  (PNG, JPG, etc.).
                                </li>
                                <li>
                                  <strong>Vídeo/Áudio:</strong> Arquivos
                                  multimídia.
                                </li>
                                <li>
                                  <strong>JSON:</strong> Dados estruturados em
                                  formato JSON.
                                </li>
                                <li>
                                  <strong>Binário:</strong> Qualquer outro tipo
                                  de arquivo.
                                </li>
                                <li>
                                  <strong>Referência:</strong> Um ponteiro para
                                  um artefato maior ou um recurso externo.
                                </li>
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="w-[150px]">
                          Nome
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0"
                              >
                                <Info size={12} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                O nome identificador para este tipo de artefato
                                que o agente manipulará. Ex: `relatorio_mensal`,
                                `imagem_processada`.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="w-[120px]">
                          MIME Type
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0"
                              >
                                <Info size={12} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                O tipo de conteúdo padrão do artefato, conforme
                                o padrão MIME. Ex: `application/pdf`,
                                `image/png`, `text/csv`.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="w-[120px]">
                          Acesso
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0"
                              >
                                <Info size={12} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                Define quem pode ler ou escrever neste tipo de
                                artefato (ADK Roles):
                              </p>
                              <ul className="list-disc pl-4 mt-1 text-xs">
                                <li>
                                  <strong>Usuário:</strong> O usuário final
                                  interagindo com o agente.
                                </li>
                                <li>
                                  <strong>Agente:</strong> O próprio agente.
                                </li>
                                <li>
                                  <strong>Sub-Agente:</strong> Outros agentes
                                  que são subordinados a este.
                                </li>
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="w-[90px]">
                          Persistente
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0"
                              >
                                <Info size={12} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Indica se os artefatos deste tipo devem ser
                                salvos de forma persistente (além da sessão
                                atual de execução do agente).
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="w-[90px]">
                          Versões
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 p-0"
                              >
                                <Info size={12} />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Indica se múltiplas versões do artefato devem
                                ser mantidas, permitindo rastrear o histórico de
                                alterações.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead className="w-[150px]"> {/* Increased width for version selector */}
                          Histórico de Versões
                        </TableHead>
                        <TableHead className="w-[120px] text-right">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {artifacts.map((artifact) => (
                        <TableRow key={artifact.id}>
                          <TableCell>
                            {getArtifactIcon(artifact.type)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {artifact.name}
                          </TableCell>
                          <TableCell
                            className="max-w-[200px] truncate"
                            title={artifact.description}
                          >
                            {artifact.description || "-"}
                          </TableCell>
                          <TableCell>{artifact.mimeType}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {artifact.accessRoles.map((role) => (
                                <Badge
                                  key={role}
                                  variant="outline"
                                  className="text-xs px-1"
                                >
                                  {role === "user"
                                    ? "Usuário"
                                    : role === "agent"
                                      ? "Agente"
                                      : "Sub-Agente"}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {artifact.persist ? "Sim" : "Não"}
                          </TableCell>
                          <TableCell>
                            {artifact.versioning ? "Sim" : "Não"}
                          </TableCell>
                          <TableCell> {/* Cell for Version Selector */}
                            {artifact.versioning && artifact.versions && artifact.versions.length > 0 ? (
                              <Select
                                onValueChange={(versionId) => handleViewVersion(artifact.id, versionId)}
                                // value={artifact.currentVersionId || artifact.versions[0]?.versionId} // Optional: control current selection
                              >
                                <SelectTrigger className="h-8 text-xs w-full">
                                  <SelectValue placeholder="Ver versões" />
                                </SelectTrigger>
                                <SelectContent>
                                  {artifact.versions.map(v => (
                                    <SelectItem key={v.versionId} value={v.versionId} className="text-xs">
                                      {`Ver ${v.versionId.substring(0,6)}... (${new Date(v.timestamp).toLocaleDateString()})`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : artifact.versioning ? (
                              <span className="text-xs text-muted-foreground">Nenhuma versão</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleStartEditArtifact(artifact)}
                                    >
                                      <Edit3 className="h-4 w-4" />
                                      <span className="sr-only">Editar</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar Definição do Artefato</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveArtifact(artifact.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      <span className="sr-only">Remover</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remover Definição do Artefato</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center p-4 bg-muted/20 rounded-md">
                    <p className="text-muted-foreground">
                      Nenhum artefato definido. Adicione um novo artefato
                      abaixo.
                    </p>
                  </div>
                )}

                {/* Seção de Upload de Arquivos de Artefato */}
                {artifactStorageType !== "memory" && (
                  <div className="my-6">
                    <Label className="text-sm font-medium block mb-2">
                      Carregar Arquivo de Artefato
                    </Label>
                    <FileUploader
                      onFilesSelected={handleFilesSelected}
                      maxFiles={1}
                      label="Arraste e solte um arquivo aqui, ou clique para selecionar."
                      disabled={isUploading || (artifactStorageType !== "filesystem" && artifactStorageType !== "cloud")}
                      loading={isUploading}
                    />
                    {(artifactStorageType !== "filesystem" && artifactStorageType !== "cloud") && (
                       <p className="text-xs text-muted-foreground mt-1">
                         Para habilitar o upload, configure o "Tipo de Armazenamento" para "Sistema de Arquivos" ou "Nuvem" na seção de "Configuração de Artefatos".
                       </p>
                    )}
                     {isUploading && <p className="text-xs text-muted-foreground mt-1">Enviando arquivo...</p>}
                  </div>
                )}

                <Separator className="my-6" />

                {showNewArtifactForm ? (
                  <Card className="border border-dashed p-4" id="new-artifact-form-card"> {/* Added id for potential scroll target */}
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-sm">
                        {newArtifact.id && artifacts.find(art => art.id === newArtifact.id) ? "Editar Artefato" : "Novo Artefato"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="artifact-name" className="text-xs">
                            Nome do Artefato
                          </Label>
                          <Input
                            id="artifact-name"
                            value={newArtifact.name}
                            onChange={(e) =>
                              setNewArtifact({
                                ...newArtifact,
                                name: e.target.value,
                              })
                            }
                            placeholder="ex: documento_resumo"
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="artifact-type" className="text-xs">
                            Tipo de Artefato
                          </Label>
                          <Select
                            value={newArtifact.type}
                            onValueChange={(value: ArtifactType) =>
                              handleArtifactTypeChange(value)
                            }
                          >
                            <SelectTrigger id="artifact-type" className="h-8">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="document">
                                Documento
                              </SelectItem>
                              <SelectItem value="image">Imagem</SelectItem>
                              <SelectItem value="video">Vídeo</SelectItem>
                              <SelectItem value="audio">Áudio</SelectItem>
                              <SelectItem value="json">JSON</SelectItem>
                              <SelectItem value="binary">Binário</SelectItem>
                              <SelectItem value="reference">
                                Referência (URI/Caminho)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="artifact-description"
                          className="text-xs"
                        >
                          Descrição (opcional)
                        </Label>
                        <Textarea
                          id="artifact-description"
                          value={newArtifact.description}
                          onChange={(e) =>
                            setNewArtifact({
                              ...newArtifact,
                              description: e.target.value,
                            })
                          }
                          placeholder="Descrição do propósito deste artefato"
                          className="h-16 resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="artifact-mime-type"
                            className="text-xs"
                          >
                            Tipo MIME
                          </Label>
                          <Select
                            value={newArtifact.mimeType}
                            onValueChange={(value: ArtifactMimeType) =>
                              setNewArtifact({
                                ...newArtifact,
                                mimeType: value,
                              })
                            }
                          >
                            <SelectTrigger
                              id="artifact-mime-type"
                              className="h-8"
                            >
                              <SelectValue placeholder="Selecione o tipo MIME" />
                            </SelectTrigger>
                            <SelectContent>
                              {getMimeTypeOptions(
                                newArtifact.type || "document",
                              ).map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">
                            Tamanho Máximo (KB, opcional)
                          </Label>
                          <Input
                            type="number"
                            value={newArtifact.maxSizeKb || ""}
                            onChange={(e) =>
                              setNewArtifact({
                                ...newArtifact,
                                maxSizeKb: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              })
                            }
                            placeholder="ex: 1024 (1MB)"
                            className="h-8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Permissões de Acesso</Label>
                        <div className="flex space-x-4">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="user-access"
                                    checked={newArtifact.accessRoles?.includes(
                                      "user",
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleAccessRoleChange("user", !!checked)
                                    }
                                  />
                                  <Label
                                    htmlFor="user-access"
                                    className="text-xs"
                                  >
                                    Usuário
                                  </Label>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p className="max-w-xs">
                                    Permite que o usuário final (humano interagindo com o agente) leia ou escreva este tipo de artefato, dependendo das operações permitidas pelo agente.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="agent-access"
                                    checked={newArtifact.accessRoles?.includes(
                                      "agent",
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleAccessRoleChange("agent", !!checked)
                                    }
                                  />
                                  <Label
                                    htmlFor="agent-access"
                                    className="text-xs"
                                  >
                                    Agente
                                  </Label>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p className="max-w-xs">
                                    Permite que o próprio agente principal leia ou escreva este tipo de artefato.
                                  </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="sub-agent-access"
                                    checked={newArtifact.accessRoles?.includes(
                                      "sub-agent",
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleAccessRoleChange(
                                        "sub-agent",
                                        !!checked,
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor="sub-agent-access"
                                    className="text-xs"
                                  >
                                    Sub-Agentes
                                  </Label>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p className="max-w-xs">
                                    Permite que sub-agentes (agentes orquestrados por este agente principal) leiam ou escrevam este tipo de artefato.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="persist-artifact"
                            checked={newArtifact.persist}
                            onCheckedChange={(checked) =>
                              setNewArtifact({
                                ...newArtifact,
                                persist: !!checked,
                              })
                            }
                          />
                          <Label htmlFor="persist-artifact" className="text-xs">
                            Persistir entre sessões
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="versioning-artifact"
                            checked={newArtifact.versioning}
                            onCheckedChange={(checked) =>
                              setNewArtifact({
                                ...newArtifact,
                                versioning: !!checked,
                              })
                            }
                          />
                          <Label
                            htmlFor="versioning-artifact"
                            className="text-xs"
                          >
                            Habilitar versionamento
                          </Label>
                        </div>
                      </div>

                      {newArtifact.type === "reference" && (
                        <div className="space-y-2">
                          <Label htmlFor="allowed-patterns" className="text-xs">
                            Padrões de URI/Caminhos Permitidos para Referências
                          </Label>
                          <Textarea
                            id="allowed-patterns"
                            value={
                              newArtifact.allowedSourcePatterns?.join("\n") ||
                              ""
                            }
                            onChange={(e) =>
                              setNewArtifact({
                                ...newArtifact,
                                allowedSourcePatterns: e.target.value
                                  .split("\n")
                                  .filter(Boolean),
                              })
                            }
                            placeholder={`gs://bucket-name/path/**.pdf
https://meusite.com/documentos/**
/diretorio/local/dados/*.csv`}
                            className="h-20 resize-none font-mono text-xs"
                          />
                          <p className="text-xs text-muted-foreground">
                            Especifique os padrões de URI ou caminhos de sistema
                            de arquivos permitidos para artefatos do tipo 'referência'. <br />
                            Use um padrão por linha. <br />
                            - <code>*</code> corresponde a qualquer caractere
                            exceto <code>/</code> em um segmento de caminho. <br />
                            - <code>**</code> corresponde a qualquer caractere,
                            incluindo <code>/</code>, abrangendo múltiplos
                            diretórios. <br />
                            Exemplos: <br />
                            -{" "}
                            <code>
                              gs://meu-bucket/objetos/*
                            </code>: Permite qualquer objeto direto dentro de
                            'objetos' no bucket 'meu-bucket'. <br />
                            -{" "}
                            <code>
                              https://exemplo.com/arquivos/**.docx
                            </code>: Permite qualquer arquivo .docx em qualquer
                            subdiretório de 'arquivos'. <br />
                            - <code>/dados/relatorios/*.csv</code>: Permite
                            qualquer arquivo .csv diretamente dentro de
                            '/dados/relatorios/'.
                          </p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="p-0 pt-4 flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewArtifactForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAddArtifact}
                        disabled={
                          !newArtifact.name || !newArtifact.accessRoles?.length
                        }
                      >
                        Adicionar Artefato
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewArtifactForm(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Novo Artefato
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Seção de Visualização de Artefatos */}
        {enableArtifacts && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Visualização de Artefatos
              </CardTitle>
              <CardDescription>
                Configure como os artefatos serão visualizados durante a
                execução
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert
                variant="default"
                className="bg-amber-50 dark:bg-amber-950/20"
              >
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-sm text-amber-800 dark:text-amber-300">
                  Funcionalidade em Desenvolvimento
                </AlertTitle>
                <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
                  A visualização de artefatos será implementada em uma
                  atualização futura. Esta seção permite configurar
                  antecipadamente como os artefatos serão visualizados na
                  interface durante a execução do agente.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
