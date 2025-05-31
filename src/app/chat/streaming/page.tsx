"use client";

import { ChatUIStreaming } from "../chat-ui-streaming";

export default function StreamingChatPage() {
  return (
    // Ajuste de altura igual ao da página de chat padrão
    <div className="flex flex-col h-[calc(100vh-theme(spacing.6))] md:h-full p-4">
      <ChatUIStreaming />
    </div>
  );
}
