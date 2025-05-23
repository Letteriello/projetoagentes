import { AiAssistantForm } from "./ai-assistant-form";
import { Sparkles } from "lucide-react";

export default function AiAssistantPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Assistente de Configuração IA</h1>
      </header>
      <p className="text-muted-foreground">
        Precisa de ajuda para configurar seu agente? Descreva o objetivo dele, e nosso assistente de IA sugerirá uma configuração ideal usando o Kit de Desenvolvimento de Agentes (ADK) do Google.
      </p>
      <AiAssistantForm />
    </div>
  );
}
