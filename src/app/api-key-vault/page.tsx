
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { KeyRound, PlusCircle, Trash2, Edit3, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast"; // Import useToast

interface ApiKeyEntry {
  id: string;
  serviceName: string;
  apiKeyFragment: string;
  apiKeyFull?: string; 
  dateAdded: string;
  isKeyVisible: boolean;
}

const initialApiKeys: ApiKeyEntry[] = [
  { id: "key_001", serviceName: "OpenAI GPT-4", apiKeyFragment: "sk- জুড়ে..._gH7d", apiKeyFull: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx_gH7d", dateAdded: "2023-10-26", isKeyVisible: false },
  { id: "key_002", serviceName: "Google Maps API", apiKeyFragment: "AIzaS..._zX9o", apiKeyFull: "AIzaSyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy_zX9o", dateAdded: "2023-11-15", isKeyVisible: false },
  { id: "key_003", serviceName: "Shopify Admin API", apiKeyFragment: "shpat..._yU8n", apiKeyFull: "shpatzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_yU8n", dateAdded: "2024-01-05", isKeyVisible: false },
];

export default function ApiKeyVaultPage() {
  const [apiKeys, setApiKeys] = React.useState<ApiKeyEntry[]>(initialApiKeys);
  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = React.useState(false);
  const [selectedProvider, setSelectedProvider] = React.useState<string>("");
  const [customServiceName, setCustomServiceName] = React.useState<string>("");
  const [apiKeyInputValue, setApiKeyInputValue] = React.useState<string>("");
  const { toast } = useToast(); // Initialize useToast

  const toggleKeyVisibility = (keyId: string) => {
    setApiKeys(
      apiKeys.map((key) =>
        key.id === keyId ? { ...key, isKeyVisible: !key.isKeyVisible } : key
      )
    );
  };

  const handleAddApiKey = () => {
    if (!apiKeyInputValue) {
      toast({ title: "Erro", description: "Por favor, insira uma chave API.", variant: "destructive" });
      return;
    }
    
    let serviceName = selectedProvider;
    if (selectedProvider === "other" && customServiceName) {
      serviceName = customServiceName;
    } else if (selectedProvider === "other" && !customServiceName) {
      toast({ title: "Erro", description: "Por favor, insira um nome de serviço personalizado.", variant: "destructive" });
      return;
    }

    if (!serviceName || serviceName === "other") {
        toast({ title: "Erro", description: "Por favor, selecione um provedor ou forneça um nome de serviço personalizado.", variant: "destructive" });
        return;
    }

    const newKey: ApiKeyEntry = {
      id: `key_${Date.now()}`,
      serviceName: serviceName,
      apiKeyFragment: `${apiKeyInputValue.substring(0, 5)}...${apiKeyInputValue.substring(apiKeyInputValue.length - 4)}`,
      apiKeyFull: apiKeyInputValue,
      dateAdded: new Date().toISOString().split("T")[0],
      isKeyVisible: false,
    };
    setApiKeys([...apiKeys, newKey]);
    setIsAddKeyDialogOpen(false);
    setSelectedProvider("");
    setCustomServiceName("");
    setApiKeyInputValue("");
    toast({ title: "Sucesso!", description: `Chave API para "${serviceName}" adicionada.` });
  };

  const handleDeleteApiKey = (keyId: string, keyName: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== keyId));
    toast({ title: "Chave Excluída", description: `A chave API "${keyName}" foi excluída.`, variant: "destructive" });
  };

  const resetAddKeyForm = () => {
    setSelectedProvider("");
    setCustomServiceName("");
    setApiKeyInputValue("");
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KeyRound className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Cofre de Chaves API</h1>
        </div>
        <Dialog open={isAddKeyDialogOpen} onOpenChange={(isOpen) => {
          setIsAddKeyDialogOpen(isOpen);
          if (!isOpen) resetAddKeyForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddKeyDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Chave API
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[475px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Chave API</DialogTitle>
              <DialogDescription>
                Armazene com segurança uma nova chave API. Certifique-se de ter as permissões corretas para esta chave.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiProvider" className="text-right">
                  Provedor
                </Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger id="apiProvider" className="col-span-3">
                    <SelectValue placeholder="Selecione um provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OpenAI">OpenAI</SelectItem>
                    <SelectItem value="Google Gemini">Google Gemini</SelectItem>
                    <SelectItem value="OpenRouter">OpenRouter</SelectItem>
                    <SelectItem value="Requestly">Requestly (Mock Endpoint)</SelectItem>
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
                <Label htmlFor="apiKey" className="text-right">
                  Chave API
                </Label>
                <Input 
                  id="apiKey" 
                  type="password" 
                  placeholder="Cole sua chave API aqui" 
                  className="col-span-3" 
                  value={apiKeyInputValue}
                  onChange={(e) => setApiKeyInputValue(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddKeyDialogOpen(false);
                resetAddKeyForm();
              }}>Cancelar</Button>
              <Button type="submit" onClick={handleAddApiKey}>Salvar Chave</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>
      <p className="text-muted-foreground">
        Gerencie suas chaves API para vários serviços usados por seus agentes. As chaves armazenadas aqui são criptografadas (visualmente) para segurança.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Chaves API Armazenadas</CardTitle>
          <CardDescription>
            Lista de chaves API atualmente armazenadas. Por segurança, as chaves completas não são exibidas por padrão.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Serviço</TableHead>
                <TableHead>Chave API</TableHead>
                <TableHead>Data de Adição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhuma chave API adicionada ainda.
                  </TableCell>
                </TableRow>
              ) : (
                apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.serviceName}</TableCell>
                    <TableCell className="font-mono">
                      {key.isKeyVisible ? key.apiKeyFull : key.apiKeyFragment}
                    </TableCell>
                    <TableCell>{key.dateAdded}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" aria-label="Editar Chave API" onClick={() => toast({title: "Em breve", description: "Funcionalidade de edição de chave API."})}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleKeyVisibility(key.id)}
                        aria-label="Alternar Visibilidade da Chave API"
                      >
                        {key.isKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive" 
                        aria-label="Excluir Chave API"
                        onClick={() => handleDeleteApiKey(key.id, key.serviceName)} // Updated onClick
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
            Observação: O gerenciamento de chaves API é uma função de segurança crítica. Garanta que controles de acesso adequados e logs de auditoria estejam implementados para sistemas de produção. Esta é uma simulação visual.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
