import { cn } from '@/lib/utils';

interface ChatMessageProps {
  isUser: boolean;
  content: string;
  timestamp: Date;
}

export function ChatMessage({ isUser, content, timestamp }: ChatMessageProps) {
  return (
    <div className={cn(
      'flex mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-3',
        isUser ? 'bg-blue-600' : 'bg-gray-700'
      )}>
        <p className="text-white">{content}</p>
        <p className="text-xs mt-1 opacity-70">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
