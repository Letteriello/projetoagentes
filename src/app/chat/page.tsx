
import { BotMessageSquare } from "lucide-react";
import { ChatUI } from "./chat-ui";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,theme(spacing.16)))] md:h-[calc(100vh-theme(spacing.20))]">
      {/* O cabeçalho do chat agora está dentro de ChatUI */}
      <ChatUI />
    </div>
  );
}

    