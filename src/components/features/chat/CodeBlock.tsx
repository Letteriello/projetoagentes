import { useState, useEffect } from 'react';
// Use PrismLight for smaller bundle size and explicit language registration
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
// Using CommonJS import for better compatibility
import { okaidia } from 'react-syntax-highlighter/dist/cjs/styles/prism';
// Import languages using CommonJS syntax for better compatibility
import clike from 'react-syntax-highlighter/dist/cjs/languages/prism/clike';
import javascript from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/cjs/languages/prism/python';
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css';
import jsx from 'react-syntax-highlighter/dist/cjs/languages/prism/jsx';
import typescript from 'react-syntax-highlighter/dist/cjs/languages/prism/typescript';
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json';
import java from 'react-syntax-highlighter/dist/cjs/languages/prism/java';
import csharp from 'react-syntax-highlighter/dist/cjs/languages/prism/csharp';
import cpp from 'react-syntax-highlighter/dist/cjs/languages/prism/cpp';
import go from 'react-syntax-highlighter/dist/cjs/languages/prism/go';
import php from 'react-syntax-highlighter/dist/cjs/languages/prism/php';
import ruby from 'react-syntax-highlighter/dist/cjs/languages/prism/ruby';
import rust from 'react-syntax-highlighter/dist/cjs/languages/prism/rust';
import swift from 'react-syntax-highlighter/dist/cjs/languages/prism/swift';
import kotlin from 'react-syntax-highlighter/dist/cjs/languages/prism/kotlin';
import bash from 'react-syntax-highlighter/dist/cjs/languages/prism/bash';
import sql from 'react-syntax-highlighter/dist/cjs/languages/prism/sql';
import yaml from 'react-syntax-highlighter/dist/cjs/languages/prism/yaml';
import markup from 'react-syntax-highlighter/dist/cjs/languages/prism/markup'; // For HTML, XML etc.

import { cn } from '@/lib/utils';

// Register the languages
const registeredLanguages = new Set<string>();

const registerLanguage = (name: string, lang: any) => {
  if (!registeredLanguages.has(name)) {
    SyntaxHighlighter.registerLanguage(name, lang);
    registeredLanguages.add(name);
  }
};

// Register languages with type safety
registerLanguage('clike', clike);
registerLanguage('javascript', javascript);
registerLanguage('python', python);
registerLanguage('css', css);
registerLanguage('jsx', jsx);
registerLanguage('typescript', typescript);
registerLanguage('json', json);
registerLanguage('java', java);
registerLanguage('csharp', csharp);
registerLanguage('cpp', cpp);
registerLanguage('go', go);
registerLanguage('php', php);
registerLanguage('ruby', ruby);
registerLanguage('rust', rust);
registerLanguage('swift', swift);
registerLanguage('kotlin', kotlin);
registerLanguage('bash', bash);
registerLanguage('sql', sql);
registerLanguage('yaml', yaml);
registerLanguage('markup', markup);
registerLanguage('html', markup); // Alias for markup
registerLanguage('xml', markup);  // Alias for markup

interface CodeBlockProps {
  /** The programming language for syntax highlighting */
  language?: string;
  /** The code content to be displayed */
  value: string;
  /** Additional CSS classes */
  className?: string;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Enable line wrapping */
  wrapLines?: boolean;
  /** Enable long line wrapping */
  wrapLongLines?: boolean;
  /** Custom style for the code block */
  style?: React.CSSProperties;
}

/**
 * A code block component with syntax highlighting using Prism.js
 */
export function CodeBlock({
  language = 'text',
  value,
  className = '',
  showLineNumbers = false,
  wrapLines = true,
  wrapLongLines = true,
  style,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're in the browser before rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Sanitize language to ensure it's registered
  const safeLanguage = (() => {
    const lang = (language || 'text').toLowerCase();
    // Check if the language is registered, fallback to 'text' if not
    return registeredLanguages.has(lang) ? lang : 'text';
  })();

  const handleCopy = async () => {
    if (!value) return;
    
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      
      // Reset the copied status after 2 seconds
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  // Don't render on the server to avoid hydration issues
  if (!isClient) {
    return (
      <div className={cn('bg-gray-100 dark:bg-gray-800 p-4 rounded-md', className)}>
        <pre className="m-0 p-0 overflow-hidden">
          <code className={`language-${safeLanguage}`}>{value}</code>
        </pre>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        'relative my-4 bg-gray-900 rounded-lg overflow-hidden',
        'border border-gray-700',
        className
      )}
      style={style}
      {...props}
    >
      <div className="flex justify-between items-center bg-gray-800/80 px-4 py-2 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">
          {safeLanguage}
        </span>
        <button
          onClick={handleCopy}
          disabled={copied}
          className={cn(
            'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
            'flex items-center gap-1.5',
            'text-gray-300 hover:text-white',
            'bg-gray-700/50 hover:bg-gray-600/50',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
            'disabled:opacity-70 disabled:cursor-not-allowed',
            copied ? 'text-green-400' : ''
          )}
          aria-label={copied ? 'Copiado!' : 'Copiar código'}
          title="Copiar para a área de transferência"
        >
          {copied ? (
            <>
              <span className="text-green-400">✓</span>
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
        <SyntaxHighlighter
          style={okaidia}
          language={safeLanguage}
          PreTag="div"
          className="!m-0 !p-4 !bg-transparent !bg-gray-900 text-sm leading-relaxed"
          showLineNumbers={showLineNumbers}
          wrapLines={wrapLines}
          wrapLongLines={wrapLongLines}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5',
          }}
          codeTagProps={{
            className: `language-${safeLanguage} block`,
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            },
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
