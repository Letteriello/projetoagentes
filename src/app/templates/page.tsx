"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SavedAgentConfiguration } from "@/types/agent-configs";
import {
  getUserAgentTemplates,
  getCommunityAgentTemplates,
} from "@/lib/agentServices";
// import { useAuth } from "@/contexts/AuthContext"; // Optional for now

export default function TemplatesPage() {
  const router = useRouter();
  // const { user } = useAuth(); // Optional for now

  const [userTemplates, setUserTemplates] = React.useState<SavedAgentConfiguration[]>([]);
  const [communityTemplates, setCommunityTemplates] = React.useState<SavedAgentConfiguration[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortOption, setSortOption] = React.useState("name-asc");

  React.useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      // const currentUserId = user?.uid; // Use actual user ID when auth is integrated
      const currentUserId = "test-user-id"; // Placeholder for now

      try {
        if (currentUserId) {
          const uTemplates = await getUserAgentTemplates(currentUserId);
          setUserTemplates(uTemplates);
        }
        const cTemplates = await getCommunityAgentTemplates();
        setCommunityTemplates(cTemplates);
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        // Handle error (e.g., show toast)
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [/* user */]); // Add user to dependency array if using actual user

  const processedTemplates = React.useMemo(() => {
    let filteredUserTemplates = [...userTemplates];
    let filteredCommunityTemplates = [...communityTemplates];

    // Filtering
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filterFn = (template: SavedAgentConfiguration) =>
        template.agentName.toLowerCase().includes(lowerSearchTerm) ||
        (template.agentDescription && template.agentDescription.toLowerCase().includes(lowerSearchTerm)) ||
        (template.tags && template.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)));

      filteredUserTemplates = filteredUserTemplates.filter(filterFn);
      filteredCommunityTemplates = filteredCommunityTemplates.filter(filterFn);
    }

    // Sorting
    const sortFn = (a: SavedAgentConfiguration, b: SavedAgentConfiguration) => {
      switch (sortOption) {
        case "name-asc":
          return a.agentName.localeCompare(b.agentName);
        case "name-desc":
          return b.agentName.localeCompare(a.agentName);
        case "date-newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "date-oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    };

    filteredUserTemplates.sort(sortFn);
    filteredCommunityTemplates.sort(sortFn);

    return { filteredUserTemplates, filteredCommunityTemplates };
  }, [userTemplates, communityTemplates, searchTerm, sortOption]);

  const handleUseTemplate = (templateId: string) => {
    router.push(`/agent-builder?templateId=${templateId}`);
  };

  if (isLoading) {
    return <div className="p-4">Carregando templates...</div>;
  }

  return (
    <div className="space-y-8 p-4">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Templates de Agentes</h1>
      </header>

      <div className="flex space-x-4 mb-6">
        <Input
          placeholder="Buscar templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
            <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
            <SelectItem value="date-newest">Data (Mais Recentes)</SelectItem>
            <SelectItem value="date-oldest">Data (Mais Antigos)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Meus Templates</h2>
        {processedTemplates.filteredUserTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedTemplates.filteredUserTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle>{template.agentName}</CardTitle>
                  <CardDescription>{template.agentDescription || "Sem descrição."}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Versão: {template.agentVersion}</p>
                  {template.useCases && template.useCases.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold mb-1">Casos de Uso:</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.useCases.map((useCase, index) => (
                          <Badge key={index} variant="outline">{useCase}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {template.templateDetailsPreview && (
                    <div>
                      <h4 className="text-xs font-semibold mb-1">Preview:</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {template.templateDetailsPreview}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleUseTemplate(template.id)}>Usar Template</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p>{searchTerm ? "Nenhum template encontrado com os termos da busca." : "Você ainda não salvou nenhum template."}</p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Templates da Comunidade</h2>
        {processedTemplates.filteredCommunityTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processedTemplates.filteredCommunityTemplates.map((template) => (
              // Avoid rendering user's own templates again if they appear in community list
              // This logic can be refined if community templates are strictly not user's own.
              (processedTemplates.filteredUserTemplates.find(ut => ut.id === template.id)) ? null : (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle>{template.agentName}</CardTitle>
                    <CardDescription>{template.agentDescription || "Sem descrição."}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">Versão: {template.agentVersion}</p>
                    {template.useCases && template.useCases.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold mb-1">Casos de Uso:</h4>
                        <div className="flex flex-wrap gap-1">
                          {template.useCases.map((useCase, index) => (
                            <Badge key={index} variant="outline">{useCase}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {template.templateDetailsPreview && (
                      <div>
                        <h4 className="text-xs font-semibold mb-1">Preview:</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {template.templateDetailsPreview}
                        </p>
                      </div>
                    )}
                    {/* Optionally display author/source for community templates */}
                  </CardContent>
                  <CardFooter>
                    <Button onClick={() => handleUseTemplate(template.id)}>Usar Template</Button>
                  </CardFooter>
                </Card>
              )
            ))}
          </div>
        ) : (
          <p>{searchTerm ? "Nenhum template da comunidade encontrado com os termos da busca." : "Nenhum template da comunidade disponível no momento."}</p>
        )}
      </section>
    </div>
  );
}
