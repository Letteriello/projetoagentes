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
} from "@/components/ui/dialog"

const apiKeys = [
  { id: "key_001", serviceName: "OpenAI GPT-4", apiKeyFragment: "sk- জুড়ে..._gH7d", dateAdded: "2023-10-26" },
  { id: "key_002", serviceName: "Google Maps API", apiKeyFragment: "AIzaS..._zX9o", dateAdded: "2023-11-15" },
  { id: "key_003", serviceName: "Shopify Admin API", apiKeyFragment: "shpat..._yU8n", dateAdded: "2024-01-05" },
];

// This is a placeholder page. In a real application, API keys would be stored securely,
// likely encrypted, and handled with extreme care.
// The UI below is for illustrative purposes only.

export default function ApiKeyVaultPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <KeyRound className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Cofre de Chaves API</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova Chave API
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Chave API</DialogTitle>
              <DialogDescription>
                Armazene com segurança uma nova chave API. Certifique-se de ter as permissões corretas para esta chave.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serviceName" className="text-right">
                  Nome do Serviço
                </Label>
                <Input id="serviceName" placeholder="ex: OpenAI" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiKey" className="text-right">
                  Chave API
                </Label>
                <Input id="apiKey" type="password" placeholder="Digite sua chave API" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar Chave</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>
      <p className="text-muted-foreground">
        Gerencie suas chaves API para vários serviços usados por seus agentes. As chaves armazenadas aqui são criptografadas para segurança.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Chaves API Armazenadas</CardTitle>
          <CardDescription>
            Lista de chaves API atualmente armazenadas. Por segurança, as chaves completas não são exibidas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Serviço</TableHead>
                <TableHead>Fragmento da Chave API</TableHead>
                <TableHead>Data de Adição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.serviceName}</TableCell>
                  <TableCell className="font-mono">{key.apiKeyFragment}</TableCell>
                  <TableCell>{key.dateAdded}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" aria-label="Editar Chave API">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Alternar Visibilidade da Chave API">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Excluir Chave API">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter>
          <p className="text-xs text-muted-foreground">
            Observação: O gerenciamento de chaves API é uma função de segurança crítica. Garanta que controles de acesso adequados e logs de auditoria estejam implementados para sistemas de produção.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
