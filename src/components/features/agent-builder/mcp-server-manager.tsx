"use client";

import * as React from "react";
import { useState } from "react";
import { useForm, FormProvider, SubmitHandler } from "react-hook-form"; // Added RHF imports
import { zodResolver } from "@hookform/resolvers/zod"; // Added Zod resolver
import { z } from "zod"; // Added Zod
import { Cpu, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Label will be replaced by FormLabel
import { Textarea } from "@/components/ui/textarea";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"; // Added Form components
import { mcpServerFormSchema } from "@/lib/zod-schemas"; // Added Zod schema import
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MCPServerConfig } from "@/types/tool-types";

interface MCPServerManagerProps {
  servers: MCPServerConfig[];
  onAdd: (server: MCPServerConfig) => void;
  onRemove: (serverId: string) => void;
  onUpdate: (server: MCPServerConfig) => void;
}

export const MCPServerManager: React.FC<MCPServerManagerProps> = ({
  servers,
  onAdd,
  onRemove,
  onUpdate,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Remove old local state for newServer

  const methods = useForm<z.infer<typeof mcpServerFormSchema>>({
    resolver: zodResolver(mcpServerFormSchema),
    defaultValues: {
      name: "",
      url: "",
      description: "",
    },
  });

  const handleAddServerSubmit: SubmitHandler<z.infer<typeof mcpServerFormSchema>> = (data) => {
    onAdd({
      id: crypto.randomUUID(), // Generate ID here
      ...data,
      status: "connected", // Set default status, or as per your logic
    });
    setIsAddModalOpen(false); // Close modal
    methods.reset(); // Reset form for next time
  };

  const handleOpenDialog = () => {
    methods.reset(); // Reset form when dialog opens
    setIsAddModalOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAddModalOpen(false);
    methods.reset();
  }

  return (
    <div className="rounded-md border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Servidores MCP Conectados</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenDialog}
          className="h-7 text-xs"
        >
          <Plus size={12} className="mr-1" />
          Adicionar Servidor
        </Button>
      </div>

      {servers.length > 0 ? (
        <div className="space-y-2">
          {servers.map((server) => (
            <div
              key={server.id}
              className="flex items-center justify-between rounded-md border border-border p-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Cpu size={14} className="text-primary" />
                  <span className="font-medium text-sm">{server.name}</span>
                  {server.status === "connected" && (
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  )}
                  {server.status === "error" && (
                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {server.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onUpdate(server)} // Assuming onUpdate opens another modal or form
                >
                  <Settings size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => onRemove(server.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Nenhum servidor MCP conectado
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione servidores MCP para habilitar ferramentas MCP avançadas
          </p>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Servidor MCP</DialogTitle>
            <DialogDescription>
              Conecte-se a um servidor MCP para habilitar ferramentas avançadas.
            </DialogDescription>
          </DialogHeader>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(handleAddServerSubmit)} className="space-y-4 my-4">
              <FormField
                control={methods.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="server-name-rhf">Nome do Servidor</FormLabel>
                    <FormControl>
                      <Input id="server-name-rhf" {...field} placeholder="Ex: Servidor MCP Local" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={methods.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="server-url-rhf">URL do Servidor</FormLabel>
                    <FormControl>
                      <Input id="server-url-rhf" {...field} placeholder="Ex: http://localhost:8000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={methods.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="server-description-rhf">Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        id="server-description-rhf"
                        {...field}
                        placeholder="Descreva o propósito deste servidor MCP"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" className="button-live-glow">
                  Adicionar Servidor
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
};
