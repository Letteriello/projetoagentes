// src/app/api-key-vault/page.tsx
"use client";

import * as React from "react";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { KeyRound, PlusCircle, Trash2, Edit3 } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from '@/components/shared/EmptyState';
import withAuth from '@/components/auth/withAuth';

import {
  registerApiKeyFormSchema, RegisterApiKeyFormData,
  updateApiKeyMetadataFormSchema, UpdateApiKeyMetadataFormData,
} from "@/lib/zod-schemas"; // Updated Zod schemas

import {
  ApiKeyMetadata,
  RegisterApiKeyPayload,
  UpdateApiKeyMetadataPayload,
} from "@/types/apiKeyVaultTypes";
import {
  saveApiKey,
  listApiKeyMetas,
  deleteApiKey,
  updateApiKeyMeta,
} from "@/services/api-key-service"; // Updated service functions

const SERVICE_TYPE_OPTIONS = [
  "OpenAI", "Google Gemini", "Google Search", "OpenRouter", "Generic", "Custom API", "Database", "Other",
];

function ApiKeyVaultPage() {
  const [apiKeyMetas, setApiKeyMetas] = React.useState<ApiKeyMetadata[]>([]);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = React.useState(true);
  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = React.useState(false);
  const [isEditKeyDialogOpen, setIsEditKeyDialogOpen] = React.useState(false);
  const [editingApiKey, setEditingApiKey] = React.useState<ApiKeyMetadata | null>(null);
  const [isConfirmDeleteApiKeyOpen, setIsConfirmDeleteApiKeyOpen] = React.useState(false);
  const [apiKeyToDelete, setApiKeyToDelete] = React.useState<ApiKeyMetadata | null>(null);

  const { toast } = useToast();

  // Form for Adding New Key
  const addKeyMethods = useForm<RegisterApiKeyFormData>({
    resolver: zodResolver(registerApiKeyFormSchema),
    defaultValues: {
      serviceName: "",
      apiKey: "",
      selectedServiceType: undefined,
      customServiceType: "",
      displayFragment: "",
      associatedAgentsInput: "",
    },
  });
  const { watch: watchAddKeyForm, reset: resetAddKeyForm } = addKeyMethods;

  // Form for Editing Key
  const editKeyMethods = useForm<UpdateApiKeyMetadataFormData>({
    resolver: zodResolver(updateApiKeyMetadataFormSchema),
  });
  const { watch: watchEditKeyForm, reset: resetEditKeyForm, setValue: setEditValue } = editKeyMethods;

  const fetchApiKeyMetas = React.useCallback(async () => {
    setIsLoadingApiKeys(true);
    try {
      const fetchedMetas = await listApiKeyMetas();
      setApiKeyMetas(fetchedMetas);
    } catch (error: any) {
      console.error("Failed to load API key metadata:", error);
      setApiKeyMetas([]);
      toast({ title: "Erro ao Carregar", description: error.message || "Não foi possível carregar as chaves API.", variant: "destructive" });
    } finally {
      setIsLoadingApiKeys(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchApiKeyMetas();
  }, [fetchApiKeyMetas]);

  const handleAddNewKeySubmit: SubmitHandler<RegisterApiKeyFormData> = async (data) => {
    let finalServiceType = data.selectedServiceType;
    if (data.selectedServiceType === "Other") {
      finalServiceType = data.customServiceType!;
    }

    const associatedAgents = data.associatedAgentsInput
      ? data.associatedAgentsInput.split(",").map(s => s.trim()).filter(s => s)
      : [];

    const payload: RegisterApiKeyPayload = {
      serviceName: data.serviceName,
      apiKey: data.apiKey,
      serviceType: finalServiceType,
      displayFragment: data.displayFragment || undefined,
      associatedAgents,
    };

    try {
      const newMeta = await saveApiKey(payload);
      setApiKeyMetas(prev => [...prev, newMeta]);
      setIsAddKeyDialogOpen(false);
      resetAddKeyForm();
      toast({ title: "Sucesso!", description: `Configuração para "${newMeta.serviceName}" registrada.` });
    } catch (error: any) {
      console.error("Error registering API key:", error);
      toast({ title: "Erro ao Registrar", description: error.message || "Não foi possível registrar a configuração.", variant: "destructive" });
    }
  };

  const handleOpenEditDialog = (meta: ApiKeyMetadata) => {
    setEditingApiKey(meta);
    resetEditKeyForm({ // Use reset to populate form
        serviceName: meta.serviceName,
        selectedServiceType: SERVICE_TYPE_OPTIONS.includes(meta.serviceType) ? meta.serviceType : "Other",
        customServiceType: SERVICE_TYPE_OPTIONS.includes(meta.serviceType) ? "" : meta.serviceType,
        displayFragment: meta.displayFragment,
        associatedAgentsInput: (meta.associatedAgents || []).join(", "),
    });
    setIsEditKeyDialogOpen(true);
  };

  const handleUpdateApiKeySubmit: SubmitHandler<UpdateApiKeyMetadataFormData> = async (data) => {
    if (!editingApiKey) return;

    let finalServiceType = data.selectedServiceType;
    if (data.selectedServiceType === "Other") {
      finalServiceType = data.customServiceType!;
    }

    const associatedAgents = data.associatedAgentsInput
      ? data.associatedAgentsInput.split(",").map(s => s.trim()).filter(s => s)
      : [];

    const payload: UpdateApiKeyMetadataPayload = {
      serviceName: data.serviceName,
      serviceType: finalServiceType,
      displayFragment: data.displayFragment || undefined,
      associatedAgents,
    };

    try {
      const updatedMeta = await updateApiKeyMeta(editingApiKey.id, payload);
      setApiKeyMetas(prev => prev.map(m => m.id === updatedMeta.id ? updatedMeta : m));
      setIsEditKeyDialogOpen(false);
      toast({ title: "Sucesso!", description: `Configuração "${updatedMeta.serviceName}" atualizada.` });
    } catch (error: any) {
      console.error("Error updating API key metadata:", error);
      toast({ title: "Erro ao Atualizar", description: error.message || "Não foi possível atualizar.", variant: "destructive" });
    }
  };

  const handleTriggerDeleteDialog = (meta: ApiKeyMetadata) => {
    setApiKeyToDelete(meta);
    setIsConfirmDeleteApiKeyOpen(true);
  };

  const onConfirmDeleteApiKey = async () => {
    if (apiKeyToDelete) {
      try {
        await deleteApiKey(apiKeyToDelete.id);
        setApiKeyMetas(prev => prev.filter(m => m.id !== apiKeyToDelete.id));
        toast({ title: "Configuração Excluída", description: `A configuração para "${apiKeyToDelete.serviceName}" foi excluída.` });
      } catch (error: any) {
        console.error("Error deleting API key metadata:", error);
        toast({ title: "Erro na Exclusão", description: error.message || "Não foi possível excluir.", variant: "destructive" });
      } finally {
        setIsConfirmDeleteApiKeyOpen(false);
        setApiKeyToDelete(null);
      }
    }
  };

  return (
    <div className="space-y-6 p-4">
      <header className="flex items-center justify-between">
        {/* Header content (Title, Add button) */}
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
            <Button className="button-live-glow" onClick={() => resetAddKeyForm()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Chave API
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Configuração de Chave API</DialogTitle>
              <DialogDescription>
                Configure um novo serviço e sua chave API. A chave será armazenada de forma segura.
              </DialogDescription>
            </DialogHeader>
            <FormProvider {...addKeyMethods}>
              <form onSubmit={addKeyMethods.handleSubmit(handleAddNewKeySubmit)} className="grid gap-4 py-4">
                <FormField control={addKeyMethods.control} name="serviceName" render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Nome do Serviço</FormLabel>
                    <FormControl><Input {...field} placeholder="Ex: Minha Chave OpenAI" className="col-span-3" /></FormControl>
                    <FormMessage className="col-span-4 text-right -mt-2" />
                  </FormItem>
                )} />
                <FormField control={addKeyMethods.control} name="apiKey" render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Chave API</FormLabel>
                    <FormControl><Input type="password" {...field} placeholder="Cole sua chave API aqui" className="col-span-3" /></FormControl>
                    <FormMessage className="col-span-4 text-right -mt-2" />
                  </FormItem>
                )} />
                <FormField control={addKeyMethods.control} name="selectedServiceType" render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Tipo de Serviço</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="col-span-3"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                      <SelectContent>{SERVICE_TYPE_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
                    </Select>
                    <FormMessage className="col-span-4 text-right -mt-2" />
                  </FormItem>
                )} />
                {watchAddKeyForm("selectedServiceType") === "Other" && (
                  <FormField control={addKeyMethods.control} name="customServiceType" render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Tipo Personalizado</FormLabel>
                      <FormControl><Input {...field} placeholder="Especifique o tipo" className="col-span-3" /></FormControl>
                      <FormMessage className="col-span-4 text-right -mt-2" />
                    </FormItem>
                  )} />
                )}
                <FormField control={addKeyMethods.control} name="displayFragment" render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Apelido/Fragmento</FormLabel>
                    <FormControl><Input {...field} placeholder="Ex: ...1234 (opcional)" className="col-span-3" /></FormControl>
                    <FormMessage className="col-span-4 text-right -mt-2" />
                  </FormItem>
                )} />
                <FormField control={addKeyMethods.control} name="associatedAgentsInput" render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Agentes (IDs)</FormLabel>
                    <FormControl><Input {...field} placeholder="agente1, agente2 (opcional)" className="col-span-3" /></FormControl>
                    <FormMessage className="col-span-4 text-right -mt-2" />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddKeyDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="button-live-glow">Registrar Chave</Button>
                </DialogFooter>
              </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </header>
      <p className="text-muted-foreground">
        Gerencie as configurações para chaves API. As chaves são criptografadas e armazenadas de forma segura no backend.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Configurações de Chave API Registradas</CardTitle>
          <CardDescription>Lista de metadados de chaves API configuradas.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingApiKeys ? (
            <Table> {/* Skeleton Table */}
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Fragmento</TableHead><TableHead>Criação</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>{Array.from({ length: 3 }).map((_, i) => (<TableRow key={`skel-${i}`}><TableCell><Skeleton className="h-5 w-3/4" /></TableCell><TableCell><Skeleton className="h-5 w-1/2" /></TableCell><TableCell><Skeleton className="h-5 w-1/2" /></TableCell><TableCell><Skeleton className="h-5 w-1/4" /></TableCell><TableCell className="text-right"><div className="flex justify-end space-x-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell></TableRow>))}</TableBody>
            </Table>
          ) : apiKeyMetas.length === 0 ? (
            <EmptyState title="Nenhuma Chave API Configurada" description="Adicione suas chaves de API para conectar seus agentes a serviços externos." icon={<KeyRound className="h-16 w-16 text-muted-foreground" />} actionButton={{ text: "Adicionar Nova Chave API", onClick: () => { resetAddKeyForm(); setIsAddKeyDialogOpen(true); }, icon: <PlusCircle className="mr-2 h-4 w-4" /> }} />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Nome do Serviço</TableHead><TableHead>Tipo</TableHead><TableHead>Apelido/Fragmento</TableHead><TableHead>Criação</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {apiKeyMetas.map((meta) => (
                  <TableRow key={meta.id}>
                    <TableCell className="font-medium">{meta.serviceName}</TableCell>
                    <TableCell>{meta.serviceType}</TableCell>
                    <TableCell>{meta.displayFragment}</TableCell>
                    <TableCell>{new Date(meta.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => handleOpenEditDialog(meta)}><Edit3 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Excluir" onClick={() => handleTriggerDeleteDialog(meta)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">As chaves API reais são criptografadas e gerenciadas de forma segura no backend.</p>
        </CardFooter>
      </Card>

      {/* Edit Key Dialog */}
      {editingApiKey && (
        <Dialog open={isEditKeyDialogOpen} onOpenChange={(isOpen) => { setIsEditKeyDialogOpen(isOpen); if (!isOpen) setEditingApiKey(null); }}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Editar Configuração de Chave API</DialogTitle>
              <DialogDescription>Atualize os metadados para {editingApiKey.serviceName}. A chave API em si não pode ser alterada aqui.</DialogDescription>
            </DialogHeader>
            <FormProvider {...editKeyMethods}>
              <form onSubmit={editKeyMethods.handleSubmit(handleUpdateApiKeySubmit)} className="grid gap-4 py-4">
                 <FormField control={editKeyMethods.control} name="serviceName" render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Nome do Serviço</FormLabel>
                    <FormControl><Input {...field} className="col-span-3" /></FormControl>
                    <FormMessage className="col-span-4 text-right -mt-2" />
                  </FormItem>
                )} />
                <FormField control={editKeyMethods.control} name="selectedServiceType" render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Tipo de Serviço</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="col-span-3"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                      <SelectContent>{SERVICE_TYPE_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
                    </Select>
                    <FormMessage className="col-span-4 text-right -mt-2" />
                  </FormItem>
                )} />
                {watchEditKeyForm("selectedServiceType") === "Other" && (
                  <FormField control={editKeyMethods.control} name="customServiceType" render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Tipo Personalizado</FormLabel>
                      <FormControl><Input {...field} placeholder="Especifique o tipo" className="col-span-3" /></FormControl>
                      <FormMessage className="col-span-4 text-right -mt-2" />
                    </FormItem>
                  )} />
                )}
                <FormField control={editKeyMethods.control} name="displayFragment" render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Apelido/Fragmento</FormLabel>
                    <FormControl><Input {...field} className="col-span-3" /></FormControl>
                    <FormMessage className="col-span-4 text-right -mt-2" />
                  </FormItem>
                )} />
                <FormField control={editKeyMethods.control} name="associatedAgentsInput" render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Agentes (IDs)</FormLabel>
                    <FormControl><Input {...field} className="col-span-3" /></FormControl>
                    <FormMessage className="col-span-4 text-right -mt-2" />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditKeyDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" className="button-live-glow">Salvar Alterações</Button>
                </DialogFooter>
              </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {apiKeyToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteApiKeyOpen}
          onOpenChange={(isOpen) => { setIsConfirmDeleteApiKeyOpen(isOpen); if (!isOpen) setApiKeyToDelete(null); }}
          title="Confirmar Exclusão"
          description={<>Tem certeza que deseja excluir a configuração para <strong>{apiKeyToDelete.serviceName}</strong>? Esta ação não pode ser desfeita.</>}
          onConfirm={onConfirmDeleteApiKey}
          confirmButtonVariant="destructive"
          confirmText="Excluir Configuração"
        />
      )}
    </div>
  );
}

export default withAuth(ApiKeyVaultPage);
