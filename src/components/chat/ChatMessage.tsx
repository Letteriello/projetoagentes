import { cn } from '@/lib/utils';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { CodeBlock } from './CodeBlock'; // Import the new CodeBlock component

interface ChatMessageProps {
  isUser: boolean;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
}

export function ChatMessage({ isUser, content, timestamp, isLoading, isError }: ChatMessageProps) {
  const showLoader = !isUser && isLoading && !content && !isError;
  const [copyStatus, setCopyStatus] = useState('Copy');

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopyStatus('Copied!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      setCopyStatus('Error!');
    } finally {
      setTimeout(() => setCopyStatus('Copy'), 1500);
    }
  };

  return (
    <>
      {/* Simple CSS-based loader */}
      <style>
        {`
          .dot-flashing {
            position: relative;
            width: 8px;
            height: 8px;
            border-radius: 5px;
            background-color: #a8a29e; /* gray-400 */
            color: #a8a29e; /* gray-400 */
            animation: dotFlashing 1s infinite linear alternate;
            animation-delay: .5s;
            display: inline-block;
            margin: 0 1px;
          }
          .dot-flashing::before, .dot-flashing::after {
            content: '';
            display: inline-block;
            position: absolute;
            top: 0;
            width: 8px;
            height: 8px;
            border-radius: 5px;
            background-color: #a8a29e; /* gray-400 */
            color: #a8a29e; /* gray-400 */
            animation: dotFlashing 1s infinite alternate;
          }
          .dot-flashing::before {
            left: -12px;
            animation-delay: 0s;
          }
          .dot-flashing::after {
            left: 12px;
            animation-delay: 1s;
          }
          @keyframes dotFlashing {
            0% { background-color: #a8a29e; } /* gray-400 */
            50%, 100% { background-color: rgba(168, 162, 158, 0.3); } /* gray-400 with opacity */
          }
        `}
      </style>
      <div className={cn(
        'flex mb-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-2', // Reduced vertical padding
        isUser ? 'bg-blue-600' : (isError ? 'bg-red-700' : 'bg-gray-700') // Error styling for AI messages
      )}>
        {showLoader ? (
          <div className="flex items-center h-5"> {/* Ensure loader is vertically centered like text */}
            <div className="dot-flashing"></div>
          </div>
        ) : isUser ? (
          <p className="text-white whitespace-pre-wrap">{content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm prose-invert max-w-none"
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const codeContent = String(children).replace(/\n$/, '');

                if (inline) {
                  // Inline code: e.g., `variableName`
                  return <code className="bg-gray-600 px-1 py-0.5 rounded text-sm font-mono">{children}</code>;
                }

                if (match) {
                  // Fenced code block: e.g., ```javascript ... ```
                  return <CodeBlock language={match[1]} value={codeContent} />;
                }

                // Fallback for code elements not matching (e.g., if remark-gfm is not perfectly handling all cases)
                // or for code blocks without a language specified.
                // Render as a preformatted block without syntax highlighting but with CodeBlock styling.
                return <CodeBlock language={undefined} value={codeContent} />;
              }
            }}
          >
            {content}
          </ReactMarkdown>
        )}
        <p className="text-xs mt-1 opacity-70">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        {/* Show copy button if not loading, and there's content (even if it's an error message) */}
        {!showLoader && content && ( 
          <button
            onClick={handleCopy}
            disabled={copyStatus !== 'Copy'}
            className={cn(
              "text-xs mt-2 px-2 py-1 rounded hover:opacity-80 disabled:opacity-50",
              isUser ? "text-blue-200 hover:text-blue-100" : (isError ? "text-red-200 hover:text-red-100" : "text-gray-300 hover:text-gray-100"),
              copyStatus === 'Copied!' ? (isUser ? "bg-blue-500" : (isError ? "bg-red-600" : "bg-gray-600")) : "",
              copyStatus === 'Error!' ? "bg-red-500" : "" // Universal error color for copy button feedback itself
            )}
          >
            {copyStatus}
          </button>
        )}
      </div>
    </div>
    </>
  );
}
