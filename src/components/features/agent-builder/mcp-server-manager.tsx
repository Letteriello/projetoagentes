"use client";

import * as React from "react";
import { useState } from "react";
import { Cpu, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [newServer, setNewServer] = useState<Omit<MCPServerConfig, "id">>({
    name: "",
    url: "",
    description: "",
  });

  return (
    <div className="rounded-md border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Servidores MCP Conectados</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
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
                  onClick={() => onUpdate(server)}
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

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Servidor MCP</DialogTitle>
            <DialogDescription>
              Conecte-se a um servidor MCP para habilitar ferramentas avançadas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="server-name">Nome do Servidor</Label>
              <Input
                id="server-name"
                value={newServer.name}
                onChange={(e) =>
                  setNewServer((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ex: Servidor MCP Local"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="server-url">URL do Servidor</Label>
              <Input
                id="server-url"
                value={newServer.url}
                onChange={(e) =>
                  setNewServer((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="Ex: http://localhost:8000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="server-description">Descrição (opcional)</Label>
              <Textarea
                id="server-description"
                value={newServer.description}
                onChange={(e) =>
                  setNewServer((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Descreva o propósito deste servidor MCP"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onAdd({
                  id: crypto.randomUUID(),
                  ...newServer,
                  status: "connected",
                });
                setIsAddModalOpen(false);
                setNewServer({ name: "", url: "", description: "" });
              }}
              className="button-live-glow"
            >
              Adicionar Servidor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
