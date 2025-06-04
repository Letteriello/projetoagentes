"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  User,
  AlertCircle,
  ClipboardCopy,
  Check,
  Wrench,
  AlertTriangle,
  RefreshCw, // Added RefreshCw
  ThumbsUp, // Added ThumbsUp
  ThumbsDown, // Added ThumbsDown
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface StreamingMessageProps {
  id: string; // Added id
  content: string;
  role: "user" | "model" | "system" | "tool";
  isPartial?: boolean;
  timestamp?: number;
  toolUsed?: {
    name: string;
    status?: "pending" | "success" | "error";
    input?: Record<string, any>;
    output?: any;
  };
  onRegenerate?: (messageId: string) => void;
  feedback?: 'liked' | 'disliked' | null; // Added feedback
  onFeedback?: (messageId: string, feedback: 'liked' | 'disliked' | null) => void; // Added onFeedback
}

export function StreamingMessage({
  id,
  content,
  role,
  isPartial = false,
  timestamp,
  toolUsed,
  onRegenerate,
  feedback, // Added feedback
  onFeedback, // Added onFeedback
}: StreamingMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(isPartial);
  const [copied, setCopied] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(feedback || null);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentFeedback(feedback || null);
  }, [feedback]);

  // Atualizar indicador de digitação quando isPartial mudar
  useEffect(() => {
    setShowTypingIndicator(isPartial);
  }, [isPartial]);

  // Rolar para a mensagem quando ela chegar
  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [content]);

  // Formatar o tempo da mensagem
  const messageTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // Função para renderizar o ícone com base no papel
  const renderIcon = () => {
    switch (role) {
      case "user":
        return <User className="h-6 w-6 text-primary" />;
      case "model":
        return <Bot className="h-6 w-6 text-primary" />;
      case "system":
        return <AlertCircle className="h-6 w-6 text-yellow-500" />;
      case "tool":
        return (
          <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            T
          </div>
        );
      default:
        return <Bot className="h-6 w-6 text-primary" />;
    }
  };

  };

  const handleFeedbackClick = (feedbackType: 'liked' | 'disliked') => {
    const newFeedbackState = currentFeedback === feedbackType ? null : feedbackType;
    setCurrentFeedback(newFeedbackState);
    if (onFeedback) {
      onFeedback(id, newFeedbackState);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Message content copied to clipboard.",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Error",
        description: "Failed to copy message to clipboard.",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <motion.div
      ref={messageRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-lg relative group", // Added relative and group for copy button
        role === "user" ? "bg-muted/50" : "bg-background",
        isPartial && "border-l-4 border-primary animate-pulse",
      )}
    >
      <div className="shrink-0 mt-1">{renderIcon()}</div>

      <div className="flex-1 message-content min-w-0"> {/* Added min-w-0 for better flex handling */}
        {role === "model" && (
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onRegenerate && !isPartial && (
              <button
                onClick={() => onRegenerate(id)}
                className={cn(
                  "p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                )}
                aria-label="Regenerate response"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleCopy}
              className={cn(
                "p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label="Copy message"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
            </button>
            {!isPartial && onFeedback && ( // Feedback buttons only for completed model messages
              <>
                <button
                  onClick={() => handleFeedbackClick('liked')}
                  className={cn(
                    "p-1.5 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    currentFeedback === 'liked' ? "text-blue-500 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Like message"
                >
                  <ThumbsUp className={cn("h-4 w-4", currentFeedback === 'liked' ? "fill-blue-500/20" : "")} />
                </button>
                <button
                  onClick={() => handleFeedbackClick('disliked')}
                  className={cn(
                    "p-1.5 rounded-md hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    currentFeedback === 'disliked' ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Dislike message"
                >
                  <ThumbsDown className={cn("h-4 w-4", currentFeedback === 'disliked' ? "fill-red-500/20" : "")} />
                </button>
              </>
            )}
          </div>
        )}
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");

              if (inline) {
                return (
                  <code
                    className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }

              return !inline && match ? (
                <div className="my-4">
                  <SyntaxHighlighter
                    {...props}
                    language={match[1]}
                    style={vscDarkPlus}
                    className="rounded-md !bg-zinc-900 text-sm"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code
                  className="block bg-muted p-4 rounded-md text-sm my-3 whitespace-pre-wrap"
                  {...props}
                >
                  {children}
                </code>
              );
            },
            ul({ node, ...props }) {
              return (
                <ul className="list-disc pl-6 my-3 space-y-1" {...props} />
              );
            },
            ol({ node, ...props }) {
              return (
                <ol className="list-decimal pl-6 my-3 space-y-1" {...props} />
              );
            },
            li({ node, ...props }) {
              return <li className="py-1" {...props} />;
            },
            h1({ node, ...props }) {
              return <h1 className="text-2xl font-bold mt-6 mb-3" {...props} />;
            },
            h2({ node, ...props }) {
              return <h2 className="text-xl font-bold mt-5 mb-2" {...props} />;
            },
            h3({ node, ...props }) {
              return <h3 className="text-lg font-bold mt-4 mb-2" {...props} />;
            },
            p({ node, ...props }) {
              return <p className="my-3" {...props} />;
            },
          }}
        >
          {content}
        </ReactMarkdown>

        {showTypingIndicator && (
          <motion.div
            className="typing-indicator inline-flex gap-1 mt-1"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <span className="h-2 w-2 bg-primary rounded-full"></span>
            <span className="h-2 w-2 bg-primary rounded-full"></span>
            <span className="h-2 w-2 bg-primary rounded-full"></span>
          </motion.div>
        )}

        {toolUsed && (role === "model" || role === "tool") && (
          <div className="tool-usage-indicator mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wrench className="h-4 w-4 shrink-0" />
              <span className="font-medium">Tool Called:</span>
              <span className="font-semibold text-foreground">
                {toolUsed.name}
              </span>
              {toolUsed.status === "pending" && (
                <Spinner className="h-4 w-4 animate-spin" />
              )}
              {toolUsed.status === "error" && (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
            </div>
            {toolUsed.status === "error" && toolUsed.output && (
              <div className="mt-1.5 ml-6 pl-1 text-xs text-destructive bg-destructive/10 p-2 rounded-md overflow-x-auto custom-scrollbar">
                <pre className="whitespace-pre-wrap break-all">
                  {typeof toolUsed.output === "string"
                    ? toolUsed.output
                    : JSON.stringify(toolUsed.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {messageTime && ! (role === "model" && copied) && ( // Hide time briefly when copy icon changes
         <div className="text-xs text-muted-foreground mt-1 shrink-0 self-end pl-2">
          {messageTime}
        </div>
      )}
       {/* Spacer to prevent action buttons from overlapping time when time is very short, adjust width if more buttons are added */}
       {role === "model" && <div className="w-28 shrink-0"></div>} {/* Increased width for more buttons */}
    </motion.div>
  );
}
