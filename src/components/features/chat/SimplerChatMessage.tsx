import {
  Bot,
  User,
  Paperclip as PaperclipIcon,
  Download,
  ClipboardCopy,
  Check,
  Wrench,
  AlertTriangle,
  RefreshCw, // Added RefreshCw
  ThumbsUp, // Added ThumbsUp
  ThumbsDown, // Added ThumbsDown
} from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect } from 'react'; // Added useEffect
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast'; // Added useToast
import { Spinner } from '@/components/ui/spinner'; // Added Spinner
import { cn } from '@/lib/utils';
import { ChatMessageUI } from '@/types/chat';
import SimpleCodeBlock from './SimpleCodeBlock';

interface ChatMessageDisplayProps {
  message: ChatMessageUI;
  onRegenerate?: (messageId: string) => void;
  onFeedback?: (messageId: string, feedback: 'liked' | 'disliked' | null) => void; // Added onFeedback
}

// Simple CSS for blinking cursor
const BlinkingCursor = () => (
  <span className="inline-block w-0.5 h-4 bg-current animate-blink" />
);

function SimplerChatMessage({ message, onRegenerate, onFeedback }: ChatMessageDisplayProps) { // Added onFeedback
  const isUser = message.sender === 'user';
  const isAgent = message.sender === 'agent';
  const [copied, setCopied] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(message.feedback || null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentFeedback(message.feedback || null);
  }, [message.feedback]);

  const handleFeedbackClick = (feedbackType: 'liked' | 'disliked') => {
    const newFeedbackState = currentFeedback === feedbackType ? null : feedbackType;
    setCurrentFeedback(newFeedbackState);
    if (onFeedback) {
      onFeedback(message.id, newFeedbackState);
    }
  };

  const handleCopy = async () => {
    if (!message.text) return;
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Message content copied to clipboard.',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        title: 'Error',
        description: 'Failed to copy message to clipboard.',
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

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
          'p-3 rounded-lg max-w-[70%] shadow-sm relative group',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-card text-card-foreground border border-border/50 rounded-bl-none'
        )}
      >
        {isAgent && message.text && ( // Buttons container
          <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-1 text-muted-foreground hover:text-foreground"
                onClick={() => onRegenerate(message.id)}
                aria-label="Regenerate response"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-1 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              aria-label="Copy message"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
            </Button>
            {onFeedback && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 p-1 hover:text-foreground",
                    currentFeedback === 'liked' ? "text-blue-500 hover:text-blue-600" : "text-muted-foreground"
                  )}
                  onClick={() => handleFeedbackClick('liked')}
                  aria-label="Like message"
                >
                  <ThumbsUp className={cn("h-3.5 w-3.5", currentFeedback === 'liked' ? "fill-blue-500/20" : "")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 p-1 hover:text-foreground",
                    currentFeedback === 'disliked' ? "text-red-500 hover:text-red-600" : "text-muted-foreground"
                  )}
                  onClick={() => handleFeedbackClick('disliked')}
                  aria-label="Dislike message"
                >
                  <ThumbsDown className={cn("h-3.5 w-3.5", currentFeedback === 'disliked' ? "fill-red-500/20" : "")} />
                </Button>
              </>
            )}
          </div>
        )}
        {message.text && (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words pt-1"> {/* Added pt-1 to avoid overlap with buttons */}
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
        {/* Tool Usage Indicator */}
        {isAgent && message.toolUsed && (
          <div className="tool-usage-indicator mt-2 pt-2 border-t border-border/30">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wrench className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">Tool Called:</span>
              <span className="font-semibold text-card-foreground">
                {message.toolUsed.name}
              </span>
              {message.toolUsed.status === 'pending' && (
                <Spinner className="h-3.5 w-3.5 animate-spin" />
              )}
              {message.toolUsed.status === 'error' && (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              )}
            </div>
            {message.toolUsed.status === 'error' && message.toolUsed.output && (
              <div className="mt-1 ml-5 text-xs text-destructive bg-destructive/10 p-1.5 rounded-sm overflow-x-auto custom-scrollbar">
                <pre className="whitespace-pre-wrap break-words text-[0.7rem] leading-snug">
                  {typeof message.toolUsed.output === 'string'
                    ? message.toolUsed.output
                    : JSON.stringify(message.toolUsed.output, null, 2)}
                </pre>
              </div>
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
