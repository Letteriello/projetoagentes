
import { ChatUI } from "./chat-ui";

export default function ChatPage() {
  return (
    // Ajuste de altura:
    // Em mobile, subtrai a altura aproximada do cabeçalho móvel (py-2.5 + border ~1.5rem ou theme(spacing.6)).
    // Em desktop (md), o cabeçalho global é removido, então ChatUI deve ocupar a altura total do seu container.
    // ChatUI já tem h-full, então este div precisa ter a altura correta.
    <div className="flex flex-col h-[calc(100vh-theme(spacing.6))] md:h-full p-4">
      <ChatUI />
    </div>
  );
}
