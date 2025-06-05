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
import { Skeleton } from "@/components/ui/skeleton"; // Keep for direct use if any, or if TableLoadingSkeleton doesn't cover all skeleton needs
import { EmptyState } from '@/components/shared/EmptyState'; // Import EmptyState
import { ExternalLink } from 'lucide-react'; // Import ExternalLink for the action button
import withAuth from '@/components/auth/withAuth';
import BaseForm from '@/components/shared/BaseForm'; // Import BaseForm
import TableLoadingSkeleton from '@/components/shared/TableLoadingSkeleton'; // Import TableLoadingSkeleton

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

  // addKeyMethods useForm hook is removed, BaseForm handles form state.
  // const { watch: watchAddKeyForm, control: addKeyControl, handleSubmit: handleAddKeySubmitRHF } = addKeyMethods;

  const addNewKeyDefaultValues: ApiKeyFormData = {
    serviceName: "",
    selectedServiceType: undefined,
    customServiceType: "",
    associatedAgentsInput: "",
  };

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
            // BaseForm will re-initialize with addNewKeyDefaultValues due to its key or if defaultValues prop instance changes.
            // If BaseForm needs an explicit reset, that would be a feature of BaseForm itself.
          }}
        >
          <DialogTrigger asChild>
            <Button className="button-live-glow" onClick={() => setIsAddKeyDialogOpen(true)}>
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
            <BaseForm
              key={isAddKeyDialogOpen ? "add-new-key-open" : "add-new-key-closed"} // Force re-mount on open to ensure fresh state
              onSubmit={handleAddNewKeySubmit}
              defaultValues={addNewKeyDefaultValues}
              validationSchema={apiKeyFormSchema}
              onCancel={() => setIsAddKeyDialogOpen(false)}
              submitButtonText="Registrar Serviço"
              formActionsContainerClassName="pt-4 flex justify-end gap-2"
            >
              {/* FormProvider is no longer needed here; BaseForm provides it. */}
              <div className="grid gap-4 py-4">
                <FormField
                  // control prop removed; will use context from BaseForm
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
                  // control prop removed
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
                {/* CustomServiceTypeField will now use context from BaseForm */}
                <CustomServiceTypeField />
                <FormField
                  // control prop removed
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
              </div>
              {/* DialogFooter with buttons is now handled by BaseForm's own action buttons */}
            </BaseForm>
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
          {isLoadingApiKeys ? (
            <TableLoadingSkeleton
              rowCount={4}
              columnConfigs={[
                { width: "w-1/3" }, // Nome do Serviço
                { width: "w-1/4" }, // Tipo de Serviço
                { width: "w-1/4" }, // Data de Criação
                { width: "w-1/6", className: "flex justify-end space-x-2" } // Ações (align right, might need specific skeleton for buttons)
              ]}
            />
          ) : apiKeys.length === 0 ? (
            <EmptyState
              title="Comece a Configurar suas Chaves API"
              description={
                <>
                  Para que seus agentes possam utilizar serviços de IA poderosos como Google AI Studio ou OpenAI,
                  você precisa adicionar as respectivas chaves API.
                  <br />
                  Veja nossos guias para obter suas chaves e configurá-las aqui.
                </>
              }
              icon={<KeyRound className="h-12 w-12 text-muted-foreground" />}
              actionButton={{
                text: "Guias: Obter Chaves API",
                onClick: () => window.open('https://developers.google.com/studio/docs/get-api-key', '_blank'), // Example real link
                icon: <ExternalLink className="mr-2 h-4 w-4" />,
                variant: 'default',
                className: 'mt-4 bg-blue-600 hover:bg-blue-700 text-white',
              }}
              className="py-10 md:py-16"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Serviço</TableHead>
                  <TableHead>Tipo de Serviço</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.serviceName}</TableCell>
                    <TableCell>{key.serviceType}</TableCell>
                    <TableCell>{new Date(key.createdAt).toLocaleDateString()}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          )}
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
