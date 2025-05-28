import { Bot, User, Paperclip as PaperclipIcon, Download } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './CodeBlock'; // Assuming CodeBlock is for syntax highlighting
import { ChatMessageUI } from '@/types/chat'; // Import shared type

interface ChatMessageDisplayProps {
  message: ChatMessageUI;
  isStreaming?: boolean; // isStreaming is optional, directly from ChatMessageUI
}

// Simple CSS for blinking cursor (can be moved to a global CSS file)
const BlinkingCursor = () => (
  <span className="inline-block w-0.5 h-4 bg-current animate-blink" />
);

export default function ChatMessageDisplay({ message }: ChatMessageDisplayProps) { // Removed isStreaming from direct props as it's on message
  const isUser = message.sender === 'user';
  const isAgent = message.sender === 'agent';

  // Function to handle download if fileDataUri is present
  const handleDownload = () => {
    if (message.fileDataUri && message.fileName) {
      const link = document.createElement('a');
      link.href = message.fileDataUri;
      link.download = message.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      className={cn(
        'flex items-end gap-2.5 w-full',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 p-1.5 rounded-full bg-card border border-border/50 self-start">
          <Bot className="h-5 w-5 text-primary" />
        </div>
      )}
      <div
        className={cn(
          'p-3 rounded-lg max-w-[70%] shadow-sm',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-card text-card-foreground border border-border/50 rounded-bl-none'
        )}
      >
        {message.text && (
          <ReactMarkdown
            className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:my-1 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2"
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} {...props} />
                ) : (
                  <code className={cn(className, 'text-sm')} {...props}>
                    {children}
                  </code>
                );
              },
              // Custom component to render paragraph to allow appending cursor
              p: ({children}) => {
                return <p>{children}{isAgent && message.isStreaming && <BlinkingCursor />}</p>; // Use message.isStreaming
              }
            }}
          >
            {message.text}
          </ReactMarkdown>
        )}
        {message.imageUrl && (
          <div className="mt-2">
            <Image
              src={message.imageUrl}
              alt={message.fileName || 'Imagem anexada'}
              width={300}
              height={200}
              className="rounded-md object-cover max-w-full h-auto"
            />
          </div>
        )}
        {message.fileName && !message.imageUrl && (
          <div className={cn('mt-2 p-2.5 rounded-md flex items-center gap-2.5 text-sm',
            isUser ? 'bg-primary/80' : 'bg-muted/50 border border-border/30'
          )}>
            <PaperclipIcon className={cn('h-4 w-4 flex-shrink-0', isUser ? 'text-primary-foreground/80' : 'text-muted-foreground')} />
            <span className="truncate flex-1" title={message.fileName}>{message.fileName}</span>
            {message.fileDataUri && (
              <Button variant="ghost" size="icon" onClick={handleDownload} className={cn('h-6 w-6 p-0', isUser ? 'text-primary-foreground/80 hover:text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 p-1.5 rounded-full bg-card border border-border/50 self-start">
          <User className="h-5 w-5 text-foreground" />
        </div>
      )}
    </div>
  );
}
