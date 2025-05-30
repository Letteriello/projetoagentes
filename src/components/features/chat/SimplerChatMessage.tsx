import { Bot, User, Paperclip as PaperclipIcon, Download } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChatMessageUI } from '@/types/chat';
import SimpleCodeBlock from './SimpleCodeBlock';

interface ChatMessageDisplayProps {
  message: ChatMessageUI;
}

// Simple CSS for blinking cursor
const BlinkingCursor = () => (
  <span className="inline-block w-0.5 h-4 bg-current animate-blink" />
);

function SimplerChatMessage({ message }: ChatMessageDisplayProps) {
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

  // Simple markdown rendering for code blocks
  const renderMarkdown = (text: string) => {
    // Simple regex to detect code blocks
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
    
    // Split text into parts, alternating between regular text and code blocks
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before the code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index)
        });
      }
      
      // Add the code block
      const [_, language, code] = match;
      parts.push({
        type: 'code',
        language: language || 'text',
        content: code
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text after the last code block
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex)
      });
    }
    
    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <div key={index} className="my-2">
            <SimpleCodeBlock 
              language={part.language} 
              value={part.content} 
            />
          </div>
        );
      }
      
      // Simple line breaks for paragraphs
      const paragraphs = part.content.split('\n\n');
      return paragraphs.map((paragraph, pIndex) => (
        <p key={`${index}-${pIndex}`} className="my-2">
          {paragraph}
          {pIndex === paragraphs.length - 1 && isAgent && message.isStreaming && <BlinkingCursor />}
        </p>
      ));
    });
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
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            {renderMarkdown(message.text)}
          </div>
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

export default SimplerChatMessage;
