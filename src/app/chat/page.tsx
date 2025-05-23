
import { BotMessageSquare } from "lucide-react";
import { ChatUI } from "./chat-ui";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.24))]">
      <header className="flex items-center gap-3 p-4 border-b">
        <BotMessageSquare className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Chat com Agentes</h1>
      </header>
      <ChatUI />
    </div>
  );
}
