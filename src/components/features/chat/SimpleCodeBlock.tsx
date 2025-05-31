import React, { useState } from 'react';

interface SimpleCodeBlockProps {
  /** The programming language for syntax highlighting */
  language?: string;
  /** The code content to be displayed */
  value: string;
  /** Additional CSS classes */
  className?: string;
  /** Additional props for the root div element */
  [key: string]: unknown;
}

/**
 * A simple code block component with syntax highlighting and copy functionality
 */
function SimpleCodeBlock({ 
  language = 'javascript', 
  value, 
  className = '', 
  ...props 
}: SimpleCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Limit the language to a safe string for CSS classes
  const safeLanguage = (language || 'text').replace(/[^a-zA-Z0-9-_]/g, '');

  return (
    <div 
      className={cn(
        'relative bg-gray-50 dark:bg-gray-800 rounded-md p-4 my-2 overflow-hidden',
        'border border-gray-200 dark:border-gray-700',
        className
      )}
      {...props}
    >
      <div className="flex justify-between items-center mb-2 text-xs">
        <span className="text-gray-500 dark:text-gray-400 font-mono">
          {safeLanguage || 'text'}
        </span>
        <button 
          onClick={handleCopy}
          className={cn(
            'px-2 py-1 rounded text-xs font-medium transition-colors',
            'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white',
            'hover:bg-gray-100 dark:hover:bg-gray-700',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
            'flex items-center gap-1'
          )}
          aria-label={copied ? 'Copiado!' : 'Copiar código'}
          title="Copiar para a área de transferência"
        >
          {copied ? (
            <>
              <span className="text-green-600 dark:text-green-400">✓</span>
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto">
        <pre className="text-sm leading-relaxed">
          <code className={`language-${safeLanguage} block`}>
            {value}
          </code>
        </pre>
      </div>
    </div>
  );
}

/**
 * Helper function to merge class names
 */
function cn(...classes: Array<string | undefined | boolean>): string {
  return classes.filter(Boolean).join(' ');
}

export default SimpleCodeBlock;
