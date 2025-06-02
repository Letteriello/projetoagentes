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
  // Eye, // Removed as per previous subtask
  // EyeOff, // Removed as per previous subtask
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
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ApiKeyVaultEntry } from "@/types/apiKeyVaultTypes"; // Import the main type

// Use ApiKeyVaultEntry directly
const initialApiKeys: ApiKeyVaultEntry[] = [];

// Define service type options
const SERVICE_TYPE_OPTIONS = [
  "OpenAI",
  "Google Gemini",
  "Google Search",
  "OpenRouter",
  "Generic",
  "Custom API",
  "Database",
  "Other",
];

export default function ApiKeyVaultPage() {
  const [apiKeys, setApiKeys] = React.useState<ApiKeyVaultEntry[]>(initialApiKeys);
  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = React.useState(false);

  // State for "Add New Key" Dialog
  const [addServiceName, setAddServiceName] = React.useState<string>(""); // New: for service name in add dialog
  const [selectedServiceType, setSelectedServiceType] = React.useState<string>("");
  const [customServiceType, setCustomServiceType] = React.useState<string>("");
  const [associatedAgentsInput, setAssociatedAgentsInput] = React.useState<string>("");

  const { toast } = useToast();

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = React.useState(false);
  const [deletingApiKey, setDeletingApiKey] = React.useState<ApiKeyVaultEntry | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("");

  // State for "Edit Key" Dialog
  const [editingApiKey, setEditingApiKey] = React.useState<ApiKeyVaultEntry | null>(null);
  const [isEditKeyDialogOpen, setIsEditKeyDialogOpen] = React.useState(false);
  const [editServiceName, setEditServiceName] = React.useState<string>("");
  const [editSelectedServiceType, setEditSelectedServiceType] = React.useState<string>("");
  const [editCustomServiceType, setEditCustomServiceType] = React.useState<string>("");
  const [editAssociatedAgentsInput, setEditAssociatedAgentsInput] = React.useState<string>("");
  const [editLastUsed, setEditLastUsed] = React.useState<string>(""); // For potentially editing lastUsed

  const resetAddKeyForm = () => {
    setAddServiceName(""); // Reset service name
    setSelectedServiceType("");
    setCustomServiceType("");
    setAssociatedAgentsInput("");
  };

  const resetEditKeyForm = () => {
    setEditingApiKey(null);
    setEditServiceName("");
    setEditSelectedServiceType("");
    setEditCustomServiceType("");
    setEditAssociatedAgentsInput("");
    setEditLastUsed("");
  };

  const handleAddApiKey = async () => {
    if (!addServiceName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome para o serviço.",
        variant: "destructive",
      });
      return;
    }

    let finalServiceType = selectedServiceType;
    if (selectedServiceType === "Other" && customServiceType.trim()) {
      finalServiceType = customServiceType.trim();
    } else if (selectedServiceType === "Other" && !customServiceType.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um tipo de serviço personalizado.",
        variant: "destructive",
      });
      return;
    }

    if (!finalServiceType) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um tipo de serviço.",
        variant: "destructive",
      });
      return;
    }

    const associatedAgents = associatedAgentsInput.split(",").map(s => s.trim()).filter(s => s);

    try {
      const response = await fetch("/api/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: addServiceName.trim(),
          serviceType: finalServiceType,
          associatedAgents,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to register service: ${response.statusText}`);
      }

      const newKey = await response.json();
      setApiKeys([...apiKeys, newKey]);
      setIsAddKeyDialogOpen(false);
      resetAddKeyForm();
      toast({
        title: "Sucesso!",
        description: `Serviço "${newKey.serviceName}" (Tipo: ${newKey.serviceType}) registrado.`,
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

  const handleTriggerDeleteDialog = (key: ApiKeyVaultEntry) => {
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
          throw new Error(errorData.error || `Failed to delete service: ${response.statusText}`);
        }

        setApiKeys(apiKeys.filter((key) => key.id !== deletingApiKey.id));
        toast({
          title: "Serviço Excluído",
          description: `O registro para "${deletingApiKey.serviceName}" foi excluído.`,
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

  const handleOpenEditDialog = (key: ApiKeyVaultEntry) => {
    setEditingApiKey(key);
    setEditServiceName(key.serviceName);

    if (SERVICE_TYPE_OPTIONS.includes(key.serviceType)) {
      setEditSelectedServiceType(key.serviceType);
      setEditCustomServiceType("");
    } else {
      setEditSelectedServiceType("Other");
      setEditCustomServiceType(key.serviceType);
    }
    setEditAssociatedAgentsInput((key.associatedAgents || []).join(", "));
    setEditLastUsed(key.lastUsed || ""); // Assuming lastUsed can be an empty string if not set
    setIsEditKeyDialogOpen(true);
  };

  const handleUpdateApiKey = async () => {
    if (!editingApiKey) return;

    if (!editServiceName.trim()) {
      toast({ title: "Erro", description: "Nome do serviço não pode ser vazio.", variant: "destructive" });
      return;
    }

    let finalServiceType = editSelectedServiceType;
    if (editSelectedServiceType === "Other" && editCustomServiceType.trim()) {
      finalServiceType = editCustomServiceType.trim();
    } else if (editSelectedServiceType === "Other" && !editCustomServiceType.trim()) {
      toast({ title: "Erro", description: "Tipo de serviço personalizado não pode ser vazio.", variant: "destructive" });
      return;
    }
     if (!finalServiceType) {
      toast({ title: "Erro", description: "Tipo de serviço não pode ser vazio.", variant: "destructive" });
      return;
    }

    const associatedAgents = editAssociatedAgentsInput.split(",").map(s => s.trim()).filter(s => s);

    const payload: Partial<ApiKeyVaultEntry> = {
      serviceName: editServiceName.trim(),
      serviceType: finalServiceType,
      associatedAgents,
    };
    // Optionally include lastUsed if you want to allow manual editing of it
    // if (editLastUsed) payload.lastUsed = editLastUsed;


    try {
      const response = await fetch(`/api/apikeys/${editingApiKey.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update service: ${response.statusText}`);
      }

      const updatedKey = await response.json();
      setApiKeys(apiKeys.map(key => key.id === updatedKey.id ? updatedKey : key));
      setIsEditKeyDialogOpen(false);
      resetEditKeyForm();
      toast({
        title: "Sucesso!",
        description: `Serviço "${updatedKey.serviceName}" atualizado.`,
      });
    } catch (error: any) {
      console.error("Error updating API key reference:", error);
      toast({
        title: "Erro ao Atualizar",
        description: error.message || "Não foi possível atualizar o serviço.",
        variant: "destructive",
      });
    }
  };


  React.useEffect(() => {
    const fetchKeys = async () => {
      try {
        const response = await fetch("/api/apikeys");
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error fetching API keys:", errorData);
          // throw new Error(errorData.message || "Failed to fetch API key configurations");
          // Don't throw, allow empty state
          setApiKeys([]); // Ensure it's an empty array on error
          return;
        }
        const data = await response.json();
        setApiKeys(Array.isArray(data) ? data : []); // Ensure data is an array
      } catch (error) {
        console.error("Failed to fetch API keys:", error);
        setApiKeys([]); // Ensure it's an empty array on error
        // toast({ title: "Erro ao Carregar", description: "Não foi possível carregar as configurações de chave API.", variant: "destructive" });
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
            <Button className="button-live-glow">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Chave API
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]"> {/* Increased width slightly */}
            <DialogHeader>
              <DialogTitle>Adicionar Nova Configuração de Chave API</DialogTitle>
              <DialogDescription>
                Configure um novo serviço para gerenciamento de chave API.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="addServiceName" className="text-right">
                  Nome do Serviço
                </Label>
                <Input
                  id="addServiceName"
                  placeholder="Ex: Minha Chave OpenAI Pessoal"
                  className="col-span-3"
                  value={addServiceName}
                  onChange={(e) => setAddServiceName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="addServiceType" className="text-right">
                  Tipo de Serviço
                </Label>
                <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                  <SelectTrigger id="addServiceType" className="col-span-3">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedServiceType === "Other" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="addCustomServiceType" className="text-right">
                    Tipo Personalizado
                  </Label>
                  <Input
                    id="addCustomServiceType"
                    placeholder="Especifique o tipo"
                    className="col-span-3"
                    value={customServiceType}
                    onChange={(e) => setCustomServiceType(e.target.value)}
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="addAssociatedAgents" className="text-right">
                  Agentes (IDs)
                </Label>
                <Input
                  id="addAssociatedAgents"
                  placeholder="agente1, agente2 (opcional)"
                  className="col-span-3"
                  value={associatedAgentsInput}
                  onChange={(e) => setAssociatedAgentsInput(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddKeyDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" onClick={handleAddApiKey} className="button-live-glow">
                Registrar Serviço
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>
      <p className="text-muted-foreground">
        Gerencie as configurações para chaves API de vários serviços usados por seus agentes.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Chave API</CardTitle>
          <CardDescription>
            Lista de serviços configurados para uso de chave API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Serviço</TableHead>
                <TableHead>Tipo de Serviço</TableHead>
                <TableHead>Data de Registro</TableHead>
                <TableHead>Último Uso</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhuma configuração de chave API registrada ainda.
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.serviceName}</TableCell>
                    <TableCell>{key.serviceType}</TableCell>
                    <TableCell>{new Date(key.dateAdded).toLocaleDateString()}</TableCell>
                    <TableCell>{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "Nunca"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Editar Configuração"
                        onClick={() => handleOpenEditDialog(key)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        aria-label="Excluir Configuração"
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
            As chaves API reais devem ser gerenciadas de forma segura no backend (ex: variáveis de ambiente).
          </p>
        </CardFooter>
      </Card>

      {/* Edit Key Dialog */}
      {editingApiKey && (
        <Dialog
          open={isEditKeyDialogOpen}
          onOpenChange={(isOpen) => {
            setIsEditKeyDialogOpen(isOpen);
            if (!isOpen) resetEditKeyForm();
          }}
        >
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Editar Configuração de Chave API</DialogTitle>
              <DialogDescription>
                Atualize os detalhes para {editingApiKey.serviceName}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editServiceName" className="text-right">
                  Nome do Serviço
                </Label>
                <Input
                  id="editServiceName"
                  className="col-span-3"
                  value={editServiceName}
                  onChange={(e) => setEditServiceName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editServiceType" className="text-right">
                  Tipo de Serviço
                </Label>
                <Select value={editSelectedServiceType} onValueChange={setEditSelectedServiceType}>
                  <SelectTrigger id="editServiceType" className="col-span-3">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editSelectedServiceType === "Other" && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editCustomServiceType" className="text-right">
                    Tipo Personalizado
                  </Label>
                  <Input
                    id="editCustomServiceType"
                    className="col-span-3"
                    value={editCustomServiceType}
                    onChange={(e) => setEditCustomServiceType(e.target.value)}
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editAssociatedAgents" className="text-right">
                  Agentes (IDs)
                </Label>
                <Input
                  id="editAssociatedAgents"
                  className="col-span-3"
                  value={editAssociatedAgentsInput}
                  onChange={(e) => setEditAssociatedAgentsInput(e.target.value)}
                />
              </div>
              {/* Optionally, allow editing lastUsed - though typically this is system-set
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="editLastUsed" className="text-right">
                  Último Uso (ISO)
                </Label>
                <Input
                  id="editLastUsed"
                  className="col-span-3"
                  value={editLastUsed}
                  onChange={(e) => setEditLastUsed(e.target.value)}
                  type="datetime-local" // Or text for ISO string
                />
              </div>
              */}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditKeyDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" onClick={handleUpdateApiKey} className="button-live-glow">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
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
                Você tem certeza que deseja excluir a configuração para
                <strong> {deletingApiKey.serviceName}</strong> (Tipo: {deletingApiKey.serviceType})?
                Esta ação não pode ser desfeita. Para confirmar, digite "<strong>deletar</strong>" abaixo.
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
              <AlertDialogCancel onClick={() => setIsConfirmDeleteDialogOpen(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteApiKey}
                disabled={deleteConfirmText.toLowerCase() !== "deletar"}
                className={cn(
                  "bg-destructive hover:bg-destructive/90",
                  deleteConfirmText.toLowerCase() !== "deletar" && "opacity-50 cursor-not-allowed"
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
