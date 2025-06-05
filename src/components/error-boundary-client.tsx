"use client";

import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import { logger } from '@/lib/logger'; // MODIFIED: Import new client logger

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  // Handle chunk loading errors specifically
  if (typeof window !== "undefined" && error.name === "ChunkLoadError") {
    logger.warn("Chunk load error detected. Attempting to recover..."); // MODIFIED: Use new logger
    // Force reload the page
    window.location.reload();
    return null;
  }

  // Log the error
  React.useEffect(() => {
    logger.error('Error boundary caught an error in ErrorFallback useEffect', { // MODIFIED: Use new logger
      error: error.message,
      stack: error.stack,
      name: error.name,
    });
  }, [error]);

  return (
    <div className="p-5 text-center">
      <h2 className="text-xl font-bold mb-2">Ocorreu um erro</h2>
      <p className="mb-4">Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Tentar novamente
      </button>
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
        logger.error('Error boundary caught an error in onError callback', { // MODIFIED: Use new logger
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