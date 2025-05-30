import { useState } from "react";
// Use PrismLight for smaller bundle size and explicit language registration
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
// Corrected import path for okaidia style (ESM)
import { okaidia } from "react-syntax-highlighter/dist/esm/styles/prism";
// Import languages you want to support, e.g., clike for basic C-like syntax, javascript, python, etc.
import clike from "react-syntax-highlighter/dist/esm/languages/prism/clike";
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import csharp from "react-syntax-highlighter/dist/esm/languages/prism/csharp";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import php from "react-syntax-highlighter/dist/esm/languages/prism/php";
import ruby from "react-syntax-highlighter/dist/esm/languages/prism/ruby";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import swift from "react-syntax-highlighter/dist/esm/languages/prism/swift";
import kotlin from "react-syntax-highlighter/dist/esm/languages/prism/kotlin";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import markup from "react-syntax-highlighter/dist/esm/languages/prism/markup"; // For HTML, XML etc.

import { cn } from "@/lib/utils";

// Register the languages
SyntaxHighlighter.registerLanguage("clike", clike);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("csharp", csharp);
SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("go", go);
SyntaxHighlighter.registerLanguage("php", php);
SyntaxHighlighter.registerLanguage("ruby", ruby);
SyntaxHighlighter.registerLanguage("rust", rust);
SyntaxHighlighter.registerLanguage("swift", swift);
SyntaxHighlighter.registerLanguage("kotlin", kotlin);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("yaml", yaml);
SyntaxHighlighter.registerLanguage("markup", markup);
SyntaxHighlighter.registerLanguage("html", markup); // Alias for markup
SyntaxHighlighter.registerLanguage("xml", markup); // Alias for markup

interface CodeBlockProps {
  language: string | undefined;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const [copyStatus, setCopyStatus] = useState("Copy");

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus("Copied!");
    } catch (err) {
      console.error("Failed to copy code: ", err);
      setCopyStatus("Error!");
    } finally {
      setTimeout(() => setCopyStatus("Copy"), 2000); // Reset after 2 seconds
    }
  };

  return (
    <div className="relative my-2 bg-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={handleCopy}
        disabled={copyStatus !== "Copy"}
        className={cn(
          "absolute top-2 right-2 px-2 py-1 text-xs rounded z-10", // Added z-index
          copyStatus === "Copy"
            ? "bg-gray-600 hover:bg-gray-500 text-white"
            : "",
          copyStatus === "Copied!" ? "bg-green-600 text-white" : "",
          copyStatus === "Error!" ? "bg-red-600 text-white" : "",
        )}
      >
        {copyStatus}
      </button>
      <SyntaxHighlighter
        style={okaidia} // Reinstate okaidia style
        language={language || "clike"} // Default to 'clike' or 'text' if no language provided
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
