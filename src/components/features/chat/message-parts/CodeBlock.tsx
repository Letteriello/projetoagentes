import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
// REMOVED: import { okaidia } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { minimalistLight, minimalistDark } from './codeblockThemes';
import { useTheme } from '../../../../contexts/ThemeContext'; // Adjusted path
// Import languages using CommonJS syntax
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import ruby from 'react-syntax-highlighter/dist/esm/languages/prism/ruby';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import swift from 'react-syntax-highlighter/dist/esm/languages/prism/swift';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup'; // markup geralmente é html/xml
import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

const registeredLanguages = new Set<string>();

const registerLanguage = (name: string, lang: any) => {
  if (!registeredLanguages.has(name)) {
    SyntaxHighlighter.registerLanguage(name, lang);
    registeredLanguages.add(name);
  }
};

// Register languages
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

type CopyState = 'idle' | 'loading' | 'success' | 'error';

/**
 * A code block component with syntax highlighting using Prism.js
 */
export function CodeBlock({
  language = 'text',
  value,
  className = '',
  showLineNumbers = false,
  wrapLines = true, // Defaulting to true as per one of the versions
  wrapLongLines = true, // Defaulting to true as per one of the versions
  style,
  ...props
}: CodeBlockProps) {
  const { theme: appTheme } = useTheme();
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [isClient, setIsClient] = useState(false);

  // Ensure we're in the browser before rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  const syntaxTheme = appTheme === 'dark' ? minimalistDark : minimalistLight;

  // Sanitize language to ensure it's registered
  const safeLanguage = (() => {
    const lang = (language || 'text').toLowerCase();
    return registeredLanguages.has(lang) ? lang : 'text';
  })();

  const handleCopy = async () => {
    if (!value || copyState !== 'idle') return; // Prevent multiple copies
    setCopyState('loading');
    try {
      await navigator.clipboard.writeText(value);
      setCopyState('success');
    } catch (err) {
      console.error('Failed to copy code: ', err);
      setCopyState('error');
    } finally {
      setTimeout(() => setCopyState('idle'), 2000); // Reset after 2 seconds
    }
  };

  // Don't render on the server to avoid hydration issues
  if (!isClient) {
    return (
      <div className={cn(
        'relative my-4 bg-gray-900 rounded-lg overflow-hidden',
        'border border-gray-700', // Consistent with preferred styling
        className
      )}>
        <div className="flex justify-between items-center bg-gray-800/80 px-4 py-2 border-b border-gray-700">
          <span className="text-xs text-gray-400 font-mono">
            {safeLanguage}
          </span>
        </div>
        <div className="overflow-x-auto p-4">
          <pre className="m-0">
            <code className={`language-${safeLanguage} text-sm`}>{value}</code>
          </pre>
        </div>
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
      style={style} // Keep custom style prop if provided
      {...props}
    >
      <div className="flex justify-between items-center bg-gray-800/80 px-4 py-2 border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">
          {safeLanguage}
        </span>
        <button
          onClick={handleCopy}
          disabled={copyState !== 'idle'}
          className={cn(
            'px-2.5 py-1 text-xs rounded-md font-medium transition-colors',
            'flex items-center gap-1.5',
            'text-gray-300 hover:text-white',
            'bg-gray-700/50 hover:bg-gray-600/50',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500', // Using a generic primary color for focus
            'disabled:opacity-70 disabled:cursor-not-allowed',
            copyState === 'success' ? 'text-green-400' : '',
            copyState === 'error' ? 'text-red-400' : ''
          )}
          aria-label={copyState === 'success' ? 'Copiado!' : (copyState === 'error' ? 'Erro ao copiar' : 'Copiar código')}
          title="Copiar para a área de transferência"
        >
          {copyState === 'success' ? (
            <>
              <span className="text-green-400">✓</span>
              <span>Copiado!</span>
            </>
          ) : copyState === 'error' ? (
            <>
              <span className="text-red-400">✗</span>
              <span>Erro</span>
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
          style={syntaxTheme}
          language={safeLanguage}
          PreTag="div"
          className="!m-0 !p-4 !bg-transparent text-sm leading-relaxed custom-scrollbar" // Use Tailwind for padding, bg, text size, leading. Added custom-scrollbar.
          showLineNumbers={showLineNumbers}
          wrapLines={wrapLines}
          wrapLongLines={wrapLongLines}
          // Removed redundant customStyle properties that are covered by Tailwind classes above
          // background: 'transparent' -> !bg-transparent
          // fontSize: '0.875rem' -> text-sm
          // padding: '1rem' -> !p-4
          // margin: 0 -> !m-0
          // lineHeight: '1.5' -> leading-relaxed (close enough, can be adjusted if specific value is critical)
          customStyle={{
            // Keep only styles not easily achievable or specific overrides for SyntaxHighlighter
            // Example: If SyntaxHighlighter needs specific background even with parent bg-gray-900
            // For now, assuming !bg-transparent on className is enough.
            // If `!bg-gray-900` was intended for SyntaxHighlighter itself, it can be added to className.
          }}
          codeTagProps={{
            className: `language-${safeLanguage} block`, // `block` is good practice
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            },
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
       {/* Custom scrollbar styles - can be moved to a global CSS file if preferred */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; /* Track is part of the CodeBlock bg */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563; /* gray-600 */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280; /* gray-500 */
        }
        /* For Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 transparent;
        }
      `}</style>
    </div>
  );
}
