import React from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from 'rehype-raw';
import { cn } from "@/lib/utils";
import { CodeBlock } from "./CodeBlock"; // Assuming CodeBlock is in the same directory

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  isAgent?: boolean; // Needed for cursor logic
  // fullText?: string; // if displayedText logic is fully self-contained, might not need fullText
}

// Componente para exibir um cursor piscante, usado para indicar que o agente está digitando.
const BlinkingCursor = () => (
  <span className="inline-block w-0.5 h-4 bg-current animate-blink" />
);

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isStreaming, isAgent }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:my-1 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2"
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <CodeBlock
              language={match[1]}
              value={String(children).replace(/\n$/, "")}
              {...props}
            />
          ) : (
            <code className={cn(className, "text-sm")} {...props}>
              {children}
            </code>
          );
        },
        p: ({ children }) => {
          // The BlinkingCursor should only appear at the very end of the streaming message.
          // This logic assumes `content` is the currently displayed part of a potentially streaming message.
          const showCursor = isAgent && isStreaming;
          return (
            <p>
              {children}
              {showCursor && <BlinkingCursor />}
            </p>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default MarkdownRenderer;
