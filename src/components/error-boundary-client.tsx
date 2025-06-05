"use client";

import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { winstonLogger } from '../lib/winston-logger';

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  // Handle chunk loading errors specifically
  if (typeof window !== "undefined" && error.name === "ChunkLoadError") {
    winstonLogger.warn("Chunk load error detected. Attempting to recover...");
    // Force reload the page
    window.location.reload();
    return null;
  }


  // Log the error
  React.useEffect(() => {
    winstonLogger.error('Error boundary caught an error', {
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
  }, [error]);

  return (
    <div className="p-5 text-center">
      <h2 className="text-xl font-bold mb-2">Algo deu errado</h2>
      <p className="mb-4">Ocorreu um erro ao carregar a página.</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Tentar novamente
      </button>
      <details className="mt-5 text-left">
        <summary className="cursor-pointer text-sm text-gray-600">Detalhes do erro</summary>
        <pre className="bg-gray-100 p-3 rounded mt-2 text-xs overflow-x-auto">
          {error.toString()}
        </pre>
      </details>
    </div>
  );
}

// Export as both default and named export for compatibility
export function ErrorBoundaryClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        winstonLogger.error('Error boundary caught an error', {
          error: error.message,
          stack: error.stack,
          componentStack: info.componentStack,
        });
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// Also export as default to support import without curly braces
export default ErrorBoundaryClient;