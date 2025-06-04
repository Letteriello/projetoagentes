"use client";

import * as React from "react";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form"; // Added RHF
import { zodResolver } from "@hookform/resolvers/zod"; // Added Zod resolver
import { z } from "zod"; // Added Zod
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
// Label will be replaced by FormLabel
import { Label } from "@/components/ui/label"; // Keep for existing direct uses if any outside the form
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"; // Added Form components
import { apiKeyFormSchema, ApiKeyFormData } from "@/lib/zod-schemas"; // Added Zod schema
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
} from "@/components/ui/alert-dialog"; // Keep AlertDialog imports if other parts of the app use it, or remove if unused.
// For this specific task, AlertDialog components (Action, Cancel, Content, Description, Footer, Header, Title) are replaced by ConfirmationModal.
import { ConfirmationModal } from "@/components/ui/confirmation-modal"; // Import ConfirmationModal
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
// ApiKeyVaultEntry will be replaced by ApiKeyEntry from the service
import { ApiKeyEntry } from "@/services/api-key-service"; // Import the service type
import { listApiKeys } from "@/services/api-key-service"; // Import the function
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import withAuth from '@/components/auth/withAuth';

const initialApiKeys: ApiKeyEntry[] = [];

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

function ApiKeyVaultPage() { // Renamed to start with uppercase for HOC convention
  const [apiKeys, setApiKeys] = React.useState<ApiKeyEntry[]>(initialApiKeys);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = React.useState(true); // Added loading state
  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = React.useState(false);

  // RHF for "Add New Key" Dialog
  const addKeyMethods = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      serviceName: "",
      selectedServiceType: undefined,
      customServiceType: "",
      associatedAgentsInput: "",
    },
  });
  const { watch: watchAddKeyForm } = addKeyMethods; // For conditional rendering

  // Remove old local state for "Add New Key" Dialog
  // const [addServiceName, setAddServiceName] = React.useState<string>("");
  // const [selectedServiceType, setSelectedServiceType] = React.useState<string>("");
  // const [customServiceType, setCustomServiceType] = React.useState<string>("");
  // const [associatedAgentsInput, setAssociatedAgentsInput] = React.useState<string>("");

  const { toast } = useToast();

  // Renaming for clarity, though ConfirmationModal doesn't mandate this.
  const [isConfirmDeleteApiKeyOpen, setIsConfirmDeleteApiKeyOpen] = React.useState(false);
  const [apiKeyToDelete, setApiKeyToDelete] = React.useState<ApiKeyEntry | null>(null);
  // deleteConfirmText is no longer needed with ConfirmationModal

  // State for "Edit Key" Dialog
  const [editingApiKey, setEditingApiKey] = React.useState<ApiKeyEntry | null>(null);
  const [isEditKeyDialogOpen, setIsEditKeyDialogOpen] = React.useState(false);
  const [editServiceName, setEditServiceName] = React.useState<string>("");
  const [editSelectedServiceType, setEditSelectedServiceType] = React.useState<string>("");
  const [editCustomServiceType, setEditCustomServiceType] = React.useState<string>("");
  const [editAssociatedAgentsInput, setEditAssociatedAgentsInput] = React.useState<string>("");
  const [editLastUsed, setEditLastUsed] = React.useState<string>("");

  // resetAddKeyForm is replaced by addKeyMethods.reset()
  // const resetAddKeyForm = () => {
  //   setAddServiceName("");
  //   setSelectedServiceType("");
  //   setCustomServiceType("");
  //   setAssociatedAgentsInput("");
  // };

  const resetEditKeyForm = () => {
    setEditingApiKey(null);
    setEditServiceName("");
    setEditSelectedServiceType("");
    setEditCustomServiceType("");
    setEditAssociatedAgentsInput("");
    setEditLastUsed("");
  };

  const handleAddNewKeySubmit: SubmitHandler<ApiKeyFormData> = async (data) => {
    // Manual validations for serviceName, selectedServiceType, customServiceType
    // are now handled by Zod.

    let finalServiceType = data.selectedServiceType;
    // The superRefine in Zod schema already ensures customServiceType is present if 'Other' is selected.
    if (data.selectedServiceType === "Other") {
      finalServiceType = data.customServiceType!;
    }

    const associatedAgents = data.associatedAgentsInput
      ? data.associatedAgentsInput.split(",").map(s => s.trim()).filter(s => s)
      : [];

    try {
      const response = await fetch("/api/apikeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: data.serviceName, // Zod ensures min(1)
          serviceType: finalServiceType,
          associatedAgents,
          // apiKey: data.apiKeyInputValue // Would be added here if the field existed
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to register service: ${response.statusText}`);
      }

      const newKeyEntry = await response.json(); // Assuming API returns full ApiKeyVaultEntry
      setApiKeys(prevKeys => [...prevKeys, newKeyEntry]);
      setIsAddKeyDialogOpen(false);
      // addKeyMethods.reset(); // Reset is handled by onOpenChange or DialogTrigger
      toast({
        title: "Sucesso!",
        description: `Serviço "${newKeyEntry.serviceName}" (Tipo: ${newKeyEntry.serviceType}) registrado.`,
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
    setApiKeyToDelete(key); // Use renamed state setter
    setIsConfirmDeleteApiKeyOpen(true); // Use renamed state setter
    // setDeleteConfirmText(""); // Not needed anymore
  };

  const onConfirmDeleteApiKey = async () => { // Renamed and simplified
    if (apiKeyToDelete) {
      try {
        const response = await fetch(`/api/apikeys/${apiKeyToDelete.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to delete service: ${response.statusText}`);
        }

        setApiKeys(apiKeys.filter((key) => key.id !== apiKeyToDelete.id));
        toast({
          title: "Serviço Excluído",
          description: `O registro para "${apiKeyToDelete.serviceName}" foi excluído.`,
        });
      } catch (error: any) {
        console.error("Error deleting API key reference:", error);
        toast({
          title: "Erro na Exclusão",
          description: error.message || "Não foi possível excluir o serviço.",
          variant: "destructive",
        });
      } finally {
        setIsConfirmDeleteApiKeyOpen(false); // Close modal
        setApiKeyToDelete(null); // Clear the key
      }
    }
    // No 'else' part for invalid confirm text, as it's removed.
  };

  const handleOpenEditDialog = (key: ApiKeyEntry) => {
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
    // setEditLastUsed(key.lastUsed || ""); // lastUsed is not in ApiKeyEntry from service
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

    const payload: Partial<ApiKeyEntry> = { // Changed to Partial<ApiKeyEntry>
      serviceName: editServiceName.trim(),
      serviceType: finalServiceType,
      associatedAgents,
    };
    // lastUsed is not part of ApiKeyEntry from service, so cannot be part of payload directly


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
      setIsLoadingApiKeys(true);
      try {
        const fetchedKeys = await listApiKeys(); // Use service function
        setApiKeys(fetchedKeys);
      } catch (error) {
        console.error("Failed to load API keys:", error);
        setApiKeys([]); // Ensure it's an empty array on error
        toast({ title: "Error", description: "Could not load API keys.", variant: "destructive" });
      } finally {
        setIsLoadingApiKeys(false);
      }
    };
    fetchKeys();
  }, [toast]); // Added toast to dependencies as it's used in catch

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
            if (!isOpen) addKeyMethods.reset(); // Reset form on close
          }}
        >
          <DialogTrigger asChild>
            <Button className="button-live-glow" onClick={() => addKeyMethods.reset()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Chave API
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Configuração de Chave API</DialogTitle>
              <DialogDescription>
                Configure um novo serviço para gerenciamento de chave API.
              </DialogDescription>
            </DialogHeader>
            <FormProvider {...addKeyMethods}>
              <form onSubmit={addKeyMethods.handleSubmit(handleAddNewKeySubmit)} className="grid gap-4 py-4">
                <FormField
                  control={addKeyMethods.control}
                  name="serviceName"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Nome do Serviço</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Minha Chave OpenAI Pessoal" className="col-span-3" />
                      </FormControl>
                      <FormMessage className="col-span-4 text-right -mt-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addKeyMethods.control}
                  name="selectedServiceType"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Tipo de Serviço</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SERVICE_TYPE_OPTIONS.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="col-span-4 text-right -mt-2" />
                    </FormItem>
                  )}
                />
                {watchAddKeyForm("selectedServiceType") === "Other" && (
                  <FormField
                    control={addKeyMethods.control}
                    name="customServiceType"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-4 items-center gap-4">
                        <FormLabel className="text-right">Tipo Personalizado</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Especifique o tipo" className="col-span-3" />
                        </FormControl>
                        <FormMessage className="col-span-4 text-right -mt-2" />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={addKeyMethods.control}
                  name="associatedAgentsInput"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Agentes (IDs)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="agente1, agente2 (opcional)" className="col-span-3" />
                      </FormControl>
                      <FormMessage className="col-span-4 text-right -mt-2" />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddKeyDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="button-live-glow">
                    Registrar Serviço
                  </Button>
                </DialogFooter>
              </form>
            </FormProvider>
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
                <TableHead>Data de Criação</TableHead> {/* Changed from Data de Registro */}
                {/* <TableHead>Último Uso</TableHead> // Removed as not in service's ApiKeyEntry */}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingApiKeys ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-1/2" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-1/4" /></TableCell>
                    {/* <TableCell><Skeleton className="h-5 w-1/4" /></TableCell> // Skeleton for LastUsed removed */}
                    <TableCell className="text-right space-x-1">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 md:py-16">
                    <div className="flex flex-col items-center justify-center space-y-3 text-center">
                      <KeyRound className="h-16 w-16 text-muted-foreground/70" />
                      <h2 className="text-xl font-medium text-foreground">
                        Nenhuma Chave API Configurada
                      </h2>
                      <p className="text-sm text-muted-foreground max-w-md">
                        As chaves API permitem que seus agentes se conectem e interajam com serviços externos. Adicione sua primeira chave para começar.
                      </p>
                      <Button onClick={() => {
                        addKeyMethods.reset(); // Ensure form is reset
                        setIsAddKeyDialogOpen(true);
                      }} className="mt-2">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Chave API
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.serviceName}</TableCell>
                    <TableCell>{key.serviceType}</TableCell>
                    <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell> {/* Changed to createdAt */}
                    {/* <TableCell>{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "Nunca"}</TableCell> // lastUsed removed */}
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

      {/* Delete Confirmation Dialog using ConfirmationModal */}
      {apiKeyToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteApiKeyOpen}
          onOpenChange={(isOpen) => {
            setIsConfirmDeleteApiKeyOpen(isOpen);
            if (!isOpen) {
              setApiKeyToDelete(null);
            }
          }}
          title="Confirmar Exclusão de Chave API"
          description={
            <>
              Tem certeza que deseja excluir a configuração para
              <strong> {apiKeyToDelete.serviceName}</strong> (Tipo: {apiKeyToDelete.serviceType})?
              Esta ação não pode ser desfeita.
            </>
          }
          onConfirm={onConfirmDeleteApiKey}
          confirmButtonVariant="destructive"
          confirmText="Excluir Chave API"
        />
      )}
    </div>
  );
}

export default withAuth(ApiKeyVaultPage);
