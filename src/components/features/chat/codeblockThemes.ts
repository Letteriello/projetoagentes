// src/components/features/chat/codeblockThemes.ts
export const minimalistLight = {
  'code[class*="language-"]': {
    color: '#212529', // Default text
    background: '#f8f9fa', // Light background
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: '0.875rem',
    lineHeight: '1.5',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    tabSize: 4,
    hyphens: 'none',
    padding: '1rem',
    margin: '0',
    overflow: 'auto',
    borderRadius: '0.375rem', // rounded-md
  },
  'pre[class*="language-"]': {
    color: '#212529',
    background: '#f8f9fa',
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: '0.875rem',
    lineHeight: '1.5',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    tabSize: 4,
    hyphens: 'none',
    padding: '1rem',
    margin: '0',
    overflow: 'auto',
    borderRadius: '0.375rem',
  },
  'comment': { color: '#6c757d' },
  'prolog': { color: '#6c757d' },
  'doctype': { color: '#6c757d' },
  'cdata': { color: '#6c757d' },
  'punctuation': { color: '#343a40' },
  'namespace': { opacity: 0.7 },
  'property': { color: '#e65100' }, // Orange
  'tag': { color: '#007bff' },       // Blue
  'boolean': { color: '#dc3545' },   // Red
  'number': { color: '#dc3545' },    // Red
  'constant': { color: '#dc3545' },  // Red
  'symbol': { color: '#dc3545' },    // Red
  'deleted': { color: '#dc3545' },   // Red
  'selector': { color: '#6f42c1' },  // Purple
  'attr-name': { color: '#6f42c1' }, // Purple
  'string': { color: '#28a745' },    // Green
  'char': { color: '#28a745' },      // Green
  'builtin': { color: '#28a745' },   // Green
  'inserted': { color: '#28a745' },  // Green
  'operator': { color: '#343a40' },
  'entity': { color: '#343a40', cursor: 'help' },
  'url': { color: '#007bff' },
  '.language-css .token.string': { color: '#28a745' },
  '.style .token.string': { color: '#28a745' },
  'variable': { color: '#e65100' }, // Orange
  'atrule': { color: '#007bff' },
  'attr-value': { color: '#28a745' }, // Green
  'function': { color: '#6f42c1' },   // Purple
  'class-name': { color: '#6f42c1' }, // Purple
  'keyword': { color: '#007bff' },     // Blue
  'regex': { color: '#e65100' },    // Orange
  'important': { color: '#dc3545', fontWeight: 'bold' },
  'bold': { fontWeight: 'bold' },
  'italic': { fontStyle: 'italic' },
};

// src/components/features/chat/codeblockThemes.ts (continued)
export const minimalistDark = {
  'code[class*="language-"]': {
    color: '#f8f9fa', // Light text
    background: '#212529', // Dark background
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: '0.875rem',
    lineHeight: '1.5',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    tabSize: 4,
    hyphens: 'none',
    padding: '1rem',
    margin: '0',
    overflow: 'auto',
    borderRadius: '0.375rem',
  },
  'pre[class*="language-"]': {
    color: '#f8f9fa',
    background: '#212529',
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: '0.875rem',
    lineHeight: '1.5',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    tabSize: 4,
    hyphens: 'none',
    padding: '1rem',
    margin: '0',
    overflow: 'auto',
    borderRadius: '0.375rem',
  },
  'comment': { color: '#8b949e' },  // Medium Gray
  'prolog': { color: '#8b949e' },
  'doctype': { color: '#8b949e' },
  'cdata': { color: '#8b949e' },
  'punctuation': { color: '#ced4da' }, // Light Gray
  'namespace': { opacity: 0.7 },
  'property': { color: '#ffcc80' }, // Light Orange
  'tag': { color: '#58a6ff' },       // Light Blue
  'boolean': { color: '#ff7b72' },   // Light Red/Coral
  'number': { color: '#ff7b72' },    // Light Red/Coral
  'constant': { color: '#ff7b72' },  // Light Red/Coral
  'symbol': { color: '#ff7b72' },    // Light Red/Coral
  'deleted': { color: '#ff7b72' },   // Light Red/Coral
  'selector': { color: '#d2a8ff' },  // Light Purple
  'attr-name': { color: '#d2a8ff' }, // Light Purple
  'string': { color: '#7ee787' },    // Light Green
  'char': { color: '#7ee787' },      // Light Green
  'builtin': { color: '#7ee787' },   // Light Green
  'inserted': { color: '#7ee787' },  // Light Green
  'operator': { color: '#ced4da' },
  'entity': { color: '#ced4da', cursor: 'help' },
  'url': { color: '#58a6ff' },
  '.language-css .token.string': { color: '#7ee787' },
  '.style .token.string': { color: '#7ee787' },
  'variable': { color: '#ffcc80' }, // Light Orange
  'atrule': { color: '#58a6ff' },
  'attr-value': { color: '#7ee787' }, // Light Green
  'function': { color: '#d2a8ff' },   // Light Purple
  'class-name': { color: '#d2a8ff' }, // Light Purple
  'keyword': { color: '#58a6ff' },     // Light Blue
  'regex': { color: '#ffcc80' },    // Light Orange
  'important': { color: '#ff7b72', fontWeight: 'bold' },
  'bold': { fontWeight: 'bold' },
  'italic': { fontStyle: 'italic' },
};
