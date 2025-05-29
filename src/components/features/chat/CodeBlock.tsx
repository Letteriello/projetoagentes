import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  language: string | undefined;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const [copyStatus, setCopyStatus] = useState('Copy');

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus('Copied!');
    } catch (err) {
      console.error('Failed to copy code: ', err);
      setCopyStatus('Error!');
    } finally {
      setTimeout(() => setCopyStatus('Copy'), 2000); // Reset after 2 seconds
    }
  };

  return (
    <div className="relative my-2 bg-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={handleCopy}
        disabled={copyStatus !== 'Copy'}
        className={cn(
          "absolute top-2 right-2 px-2 py-1 text-xs rounded",
          copyStatus === 'Copy' ? "bg-gray-600 hover:bg-gray-500 text-white" : "",
          copyStatus === 'Copied!' ? "bg-green-600 text-white" : "",
          copyStatus === 'Error!' ? "bg-red-600 text-white" : ""
        )}
      >
        {copyStatus}
      </button>
      <SyntaxHighlighter
        style={okaidia}
        language={language}
        PreTag="div"
        className="!p-4 !text-sm custom-scrollbar" // Apply padding here and custom scrollbar class if needed
        showLineNumbers={false} // Optional: set to true to show line numbers
        wrapLines={true} // Optional: enable line wrapping
        wrapLongLines={true} // Optional: enable long line wrapping (might need custom styling)
      >
        {value}
      </SyntaxHighlighter>
      {/* Add a style tag for scrollbar if needed, or handle via global CSS */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563; /* gray-600 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280; /* gray-500 */
        }
      `}</style>
    </div>
  );
}
