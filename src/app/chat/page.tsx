import { ChatUI } from "./chat-ui";

export default function ChatPage() {
  return (
    // The parent <main> in AppLayout now handles flex growth and scrolling
    // p-4 can remain if padding is desired directly on this page container
    // ChatUI itself is flex h-full, so it will expand to this parent
    <div className="flex flex-col h-full p-4">
      <ChatUI />
    </div>
  );
}
