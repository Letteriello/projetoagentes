// Componente WelcomeScreen
import { Bot, Sparkles, Lightbulb, Code, Search, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon?: React.ElementType;
  actionText?: string;
}

interface WelcomeScreenProps {
  onSuggestionClick: (suggestionText: string) => void;
  suggestions?: Suggestion[];
  userName?: string;
}

const defaultSuggestions: Suggestion[] = [
  {
    id: "ask_anything",
    title: "Faça uma pergunta",
    description: "Sobre qualquer tópico que desejar.",
    icon: Search,
    actionText: "Como calcular a área de um círculo?",
  },
  {
    id: "explain_code",
    title: "Me ajude a programar",
    description: "Peça para explicar um trecho de código ou gerar um novo.",
    icon: Code,
    actionText: 'Explique este código Python: print("Olá")',
  },
  {
    id: "draft_text",
    title: "Escreva um texto",
    description: "Para um email, postagem, ou qualquer outra necessidade.",
    icon: Pencil,
    actionText: "Escreva um email de agradecimento",
  },
  {
    id: "brainstorm_ideas",
    title: "Sugira ideias",
    description: "Para um projeto, nome, ou solução criativa.",
    icon: Lightbulb,
    actionText: "Sugira nomes para um novo app de música",
  },
];

export default function WelcomeScreen({
  onSuggestionClick,
  suggestions = defaultSuggestions,
  userName,
}: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <div className="mb-8">
        <Sparkles className="w-20 h-20 text-primary mx-auto animate-pulse opacity-80" />
      </div>
      <h2 className="text-3xl font-semibold text-foreground mb-2">
        Olá{userName ? `, ${userName}` : ""}! Como posso ajudar hoje?
      </h2>
      <p className="text-muted-foreground mb-10 max-w-md">
        Você pode começar com uma das sugestões abaixo ou digitar sua própria
        pergunta.
      </p>

      {suggestions && suggestions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
          {suggestions.map((suggestion) => (
            <Card
              key={suggestion.id}
              className="hover:shadow-lg transition-shadow cursor-pointer bg-card/80 hover:bg-card border-border/70"
              onClick={() =>
                onSuggestionClick(suggestion.actionText || suggestion.title)
              }
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  {suggestion.icon && (
                    <suggestion.icon className="w-6 h-6 text-primary flex-shrink-0" />
                  )}
                  <CardTitle className="text-base font-medium text-left text-foreground">
                    {suggestion.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-left leading-relaxed">
                  {suggestion.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
