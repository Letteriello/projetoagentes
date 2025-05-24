
import { ChatUI } from "./chat-ui";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height,theme(spacing.16)))] md:h-[calc(100vh-var(--header-height-md,theme(spacing.16)))]">
      {/* Ajustar a altura se o header da AppLayout mudar para md */}
      {/* O cabeçalho do chat agora está totalmente dentro de ChatUI e é fixo (sticky) */}
      <ChatUI />
    </div>
  );
}
