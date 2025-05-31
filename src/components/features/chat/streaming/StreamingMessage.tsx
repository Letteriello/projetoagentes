"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, User, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface StreamingMessageProps {
  content: string;
  role: "user" | "model" | "system" | "tool";
  isPartial?: boolean;
  timestamp?: number;
}

export function StreamingMessage({
  content,
  role,
  isPartial = false,
  timestamp,
}: StreamingMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null);
  const [showTypingIndicator, setShowTypingIndicator] = useState(isPartial);

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

  return (
    <motion.div
      ref={messageRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-lg",
        role === "user" ? "bg-muted/50" : "bg-background",
        isPartial && "border-l-4 border-primary animate-pulse",
      )}
    >
      <div className="shrink-0 mt-1">{renderIcon()}</div>

      <div className="flex-1 message-content">
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
      </div>

      {messageTime && (
        <div className="text-xs text-muted-foreground mt-1 shrink-0">
          {messageTime}
        </div>
      )}
    </motion.div>
  );
}
