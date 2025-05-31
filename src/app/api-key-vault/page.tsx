"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  KeyRound,
  PlusCircle,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils"; // Import cn

interface ApiKeyEntry {
  id: string;
  serviceName: string;
  dateAdded: string;
  // Removed apiKeyFragment, apiKeyFull, isKeyVisible
  // Added status (optional, for now just serviceName and id are primary)
  status?: string;
}

const initialApiKeys: ApiKeyEntry[] = []; // Start with an empty array

export default function ApiKeyVaultPage() {
  const [apiKeys, setApiKeys] = React.useState<ApiKeyEntry[]>(initialApiKeys);
  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = React.useState(false);
  const [selectedProvider, setSelectedProvider] = React.useState<string>("");
  const [customServiceName, setCustomServiceName] = React.useState<string>("");
  // Removed apiKeyInputValue state
  const { toast } = useToast();

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] =
    React.useState(false);
  const [deletingApiKey, setDeletingApiKey] =
    React.useState<ApiKeyEntry | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");

  // Removed toggleKeyVisibility function

  const handleAddApiKey = async () => {
    let serviceName = selectedProvider;
    if (selectedProvider === "other" && customServiceName) {
      serviceName = customServiceName.trim();
    } else if (selectedProvider === "other" && !customServiceName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome de serviço personalizado.",
        variant: "destructive",
      });
      return;
    }

    if (!serviceName || (selectedProvider === "other" && !serviceName)) {
      toast({
        title: "Erro",
        description:
          "Por favor, selecione um provedor ou forneça um nome de serviço personalizado.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to register service: ${response.statusText}`,
        );
      }

      const newKey = await response.json(); // Expecting { id, serviceName, dateAdded }
      setApiKeys([...apiKeys, newKey]);
      setIsAddKeyDialogOpen(false);
      resetAddKeyForm();
      toast({
        title: "Sucesso!",
        description: `Serviço "${serviceName}" registrado para gerenciamento de chave API.`,
      });
    } catch (error: any) {
      console.error("Error adding API key reference:", error);
      toast({
        title: "Erro ao Registrar",
        description: error.message || "Não foi possível registrar o serviço.",
        variant: "destructive",
      });
    }
  };

  const handleTriggerDeleteDialog = (key: ApiKeyEntry) => {
    setDeletingApiKey(key);
    setIsConfirmDeleteDialogOpen(true);
    setDeleteConfirmText("");
  };

  const confirmDeleteApiKey = async () => {
    if (deletingApiKey && deleteConfirmText.toLowerCase() === "deletar") {
      try {
        const response = await fetch(`/api/apikeys/${deletingApiKey.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `Failed to delete service: ${response.statusText}`,
          );
        }

        setApiKeys(apiKeys.filter((key) => key.id !== deletingApiKey.id));
        toast({
          title: "Serviço Excluído",
          description: `O registro para "${deletingApiKey.serviceName}" foi excluído.`,
          variant: "default",
        });
        setIsConfirmDeleteDialogOpen(false);
        setDeletingApiKey(null);
      } catch (error: any) {
        console.error("Error deleting API key reference:", error);
        toast({
          title: "Erro na Exclusão",
          description: error.message || "Não foi possível excluir o serviço.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Erro na Exclusão",
        description: "Texto de confirmação inválido.",
        variant: "destructive",
      });
    }
  };

  const resetAddKeyForm = () => {
    setSelectedProvider("");
    setCustomServiceName("");
    // Removed setApiKeyInputValue("");
  };

  // Optional: Fetch keys on component mount
  React.useEffect(() => {
    const fetchKeys = async () => {
      try {
        const response = await fetch("/api/apikeys");
        if (!response.ok) {
          throw new Error("Failed to fetch API key configurations");
        }
        const data = await response.json();
        setApiKeys(data);
      } catch (error) {
        console.error("Failed to fetch API keys:", error);
        // toast({ title: "Erro", description: "Não foi possível carregar as configurações de chave API.", variant: "destructive" });
        // Allowing the page to load with empty keys for now if API is not ready
      }
    };
    fetchKeys();
  }, []);

  return (
    <div className="space-y-6 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KeyRound className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Cofre de Chaves API</h1>
        </div>
        <Dialog
          open={isAddKeyDialogOpen}
          onOpenChange={(isOpen) => {
            setIsAddKeyDialogOpen(isOpen);
            if (!isOpen) resetAddKeyForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => setIsAddKeyDialogOpen(true)}
              className="button-live-glow"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Chave API
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[475px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Chave API</DialogTitle>
              <DialogDescription>
                Armazene com segurança uma nova chave API. Certifique-se de ter
                as permissões corretas para esta chave.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiProvider" className="text-right">
                  Provedor
                </Label>
                <Select
                  value={selectedProvider}
                  onValueChange={setSelectedProvider}
                >
                  <SelectTrigger id="apiProvider" className="col-span-3">
                    <SelectValue placeholder="Selecione um provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OpenAI">OpenAI</SelectItem>
                    <SelectItem value="Google Gemini">Google Gemini</SelectItem>
                    <SelectItem value="OpenRouter">OpenRouter</SelectItem>
                    <SelectItem value="Requestly">
                      Requestly (Mock Endpoint)
                    </SelectItem>
                    <SelectItem value="other">Outro (Personalizado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedProvider === "other" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="customServiceName" className="text-right">
                    Nome do Serviço
                  </Label>
                  <Input
                    id="customServiceName"
                    placeholder="ex: Meu Serviço Customizado"
                    className="col-span-3"
                    value={customServiceName}
                    onChange={(e) => setCustomServiceName(e.target.value)}
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                {/* Removed API Key Input Field */}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddKeyDialogOpen(false);
                  resetAddKeyForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                onClick={handleAddApiKey}
                className="button-live-glow"
              >
                Registrar Serviço
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>
      <p className="text-muted-foreground">
        Gerencie suas chaves API para vários serviços usados por seus agentes.
        As chaves armazenadas aqui são criptografadas (visualmente) para
        segurança.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Chaves API Armazenadas</CardTitle>
          <CardDescription>
            Lista de chaves API atualmente armazenadas. Por segurança, as chaves
            completas não são exibidas por padrão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Serviço</TableHead>
                <TableHead>Data de Registro</TableHead>
                {/* Removed Key Column */}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground py-8"
                  >
                    Nenhum serviço de API registrado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">
                      {key.serviceName}
                    </TableCell>
                    <TableCell>{key.dateAdded}</TableCell>
                    {/* Removed Key Cell */}
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar Serviço API"
                        onClick={() =>
                          toast({
                            title: "Em breve",
                            description:
                              "Funcionalidade de edição de serviço API.",
                          })
                        }
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      {/* Removed Toggle Visibility Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        aria-label="Excluir Registro de Serviço API"
                        onClick={() => handleTriggerDeleteDialog(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            Observação: As chaves API reais devem ser configuradas de forma
            segura no backend (ex: variáveis de ambiente). Este cofre gerencia
            quais serviços estão registrados para uso.
          </p>
        </CardFooter>
      </Card>

      {deletingApiKey && (
        <AlertDialog
          open={isConfirmDeleteDialogOpen}
          onOpenChange={setIsConfirmDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription>
                Você tem certeza que deseja excluir o registro do serviço API
                para <strong>{deletingApiKey.serviceName}</strong>? Esta ação
                não pode ser desfeita e apenas remove a referência do sistema. A
                chave real deve ser gerenciada no backend. Para confirmar,
                digite "<strong>deletar</strong>" no campo abaixo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder='Digite "deletar" para confirmar'
                className="border-destructive focus-visible:ring-destructive"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setIsConfirmDeleteDialogOpen(false)}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteApiKey}
                disabled={deleteConfirmText.toLowerCase() !== "deletar"}
                className={cn(
                  "bg-destructive hover:bg-destructive/90",
                  deleteConfirmText.toLowerCase() !== "deletar" &&
                    "opacity-50 cursor-not-allowed",
                )}
              >
                Confirmar Exclusão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
