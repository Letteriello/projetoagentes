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

  const handleUseTemplate = (templateId: string) => {
    router.push(`/agent-builder?templateId=${templateId}`);
  };

  if (isLoading) {
    return <div className="p-4">Carregando templates...</div>;
  }

  return (
    <div className="space-y-8 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Templates de Agentes</h1>
      </header>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Meus Templates</h2>
        {userTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle>{template.agentName}</CardTitle>
                  <CardDescription>{template.agentDescription || "Sem descrição."}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Display other template info if needed */}
                  <p className="text-sm text-muted-foreground">Versão: {template.agentVersion}</p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => handleUseTemplate(template.id)}>Usar Template</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p>Você ainda não salvou nenhum template.</p>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Templates da Comunidade</h2>
        {communityTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communityTemplates.map((template) => (
              // Avoid rendering user's own templates again if they appear in community list
              // This logic can be refined if community templates are strictly not user's own.
              (userTemplates.find(ut => ut.id === template.id)) ? null : (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle>{template.agentName}</CardTitle>
                    <CardDescription>{template.agentDescription || "Sem descrição."}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Versão: {template.agentVersion}</p>
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
          <p>Nenhum template da comunidade disponível no momento.</p>
        )}
      </section>
    </div>
  );
}
