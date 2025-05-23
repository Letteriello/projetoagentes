import { AiAssistantForm } from "./ai-assistant-form";
import { Sparkles } from "lucide-react";

export default function AiAssistantPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">AI Configuration Assistant</h1>
      </header>
      <p className="text-muted-foreground">
        Need help configuring your agent? Describe its goal, and our AI assistant will suggest an optimal configuration using Google's Agent Development Kit (ADK).
      </p>
      <AiAssistantForm />
    </div>
  );
}
