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
          <h1 className="text-3xl font-bold">API Key Vault</h1>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New API Key</DialogTitle>
              <DialogDescription>
                Securely store a new API key. Make sure you have the correct permissions for this key.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serviceName" className="text-right">
                  Service Name
                </Label>
                <Input id="serviceName" placeholder="e.g., OpenAI" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="apiKey" className="text-right">
                  API Key
                </Label>
                <Input id="apiKey" type="password" placeholder="Enter your API key" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>
      <p className="text-muted-foreground">
        Manage your API keys for various services used by your agents. Keys stored here are encrypted for security.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Stored API Keys</CardTitle>
          <CardDescription>
            List of currently stored API keys. For security, full keys are not displayed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>API Key Fragment</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.serviceName}</TableCell>
                  <TableCell className="font-mono">{key.apiKeyFragment}</TableCell>
                  <TableCell>{key.dateAdded}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" aria-label="Edit API Key">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Toggle API Key Visibility">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Delete API Key">
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
            Note: API key management is a critical security function. Ensure proper access controls and audit logs are in place for production systems.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
