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
    console.warn("Chunk load error detected. Attempting to recover...");
    // Force reload the page
    window.location.reload();
    return null;
  }

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Something went wrong</h2>
      <p>An error occurred while loading the page.</p>
      <button
        onClick={resetErrorBoundary}
        style={{
          padding: "8px 16px",
          fontSize: "16px",
          cursor: "pointer",
          backgroundColor: "#0070f3",
          color: "white",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Try again
      </button>
      <details style={{ marginTop: "20px", textAlign: "left" }}>
        <summary>Error details</summary>
        <pre
          style={{
            background: "#f5f5f5",
            padding: "10px",
            borderRadius: "4px",
            overflowX: "auto",
            marginTop: "10px",
          }}
        >
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
        console.error("Error caught by error boundary:", error, info);
        winstonLogger.error('Error caught by ErrorBoundaryClient:', {
          error: error.toString(),
          componentStack: info.componentStack,
        });

        // Handle chunk loading errors globally
        if (typeof window !== "undefined" && error.name === "ChunkLoadError") {
          console.warn("Chunk load error detected. Reloading page...");
          window.location.reload();
        }
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}

// Also export as default to support import without curly braces
export default ErrorBoundaryClient;
