"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { logger } from '@/lib/logger'; // MODIFIED: Import new client logger

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // MODIFIED: Use new logger
    logger.error("Error caught by ErrorBoundary componentDidCatch:", {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      errorInfo
    });

    // Handle chunk loading errors specifically
    if (error.name === "ChunkLoadError") {
      logger.warn("Chunk load error detected in ErrorBoundary. Attempting to recover..."); // MODIFIED: Use new logger
      // Force reload the page
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <h2>Algo deu errado</h2>
            <p>Por favor, tente recarregar a página ou entre em contato com o suporte se o problema persistir.</p>
            <button
              onClick={() => typeof window !== "undefined" && window.location.reload()}
              style={{
                padding: "8px 16px",
                fontSize: "16px",
                cursor: "pointer",
                backgroundColor: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                marginTop: "20px",
              }}
            >
              Recarregar Página
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Global error handler for uncaught errors
if (typeof window !== "undefined") {
  window.addEventListener("error", (event: ErrorEvent) => { // Added type for event
    // Check if it's a ChunkLoadError, which is already handled by the new client logger's global error handler
    // However, the specific reload logic is here.
    // The new client logger (src/lib/logger/index.ts) already logs these errors.
    // We might want to avoid double logging if the message is identical.
    // For now, keeping the specific reload for chunk load errors here,
    // but the logger in src/lib/logger/index.ts will also fire.
    if (event.error && event.error.name === "ChunkLoadError") {
      logger.warn("Chunk load error detected by global error listener in ErrorBoundary.tsx. Reloading page..."); // MODIFIED: Use new logger
      window.location.reload();
    }
    // Other errors are logged by the global handler in src/lib/logger/index.ts
  });

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => { // Added type for event
    const error = event.reason;
    // Similar to above, the new client logger also handles unhandled rejections.
    // Keeping the specific reload logic for chunk load errors here.
    if (
      error &&
      error.message &&
      error.message.includes("Loading chunk") && // error.name might not be 'ChunkLoadError' for promise rejections
      (error.name === "ChunkLoadError" || error.message.includes("ChunkLoadError")) // Be more flexible
    ) {
      logger.warn("Chunk load error in promise detected by global unhandledrejection listener in ErrorBoundary.tsx. Reloading page..."); // MODIFIED: Use new logger
      window.location.reload();
    }
    // Other unhandled rejections are logged by the global handler in src/lib/logger/index.ts
  });
}

export default ErrorBoundary;
