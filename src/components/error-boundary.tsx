"use client";

import { Component, ErrorInfo, ReactNode } from 'react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by error boundary:', error, errorInfo);
    
    // Handle chunk loading errors specifically
    if (error.name === 'ChunkLoadError') {
      console.warn('Chunk load error detected. Attempting to recover...');
      // Force reload the page
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>An error occurred while loading the page.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Reload Page
          </button>
          {this.state.error && (
            <details style={{ marginTop: '20px', textAlign: 'left' }}>
              <summary>Error details</summary>
              <pre style={{ 
                background: '#f5f5f5', 
                padding: '10px', 
                borderRadius: '4px',
                overflowX: 'auto',
                marginTop: '10px'
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Global error handler for uncaught errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.error && event.error.name === 'ChunkLoadError') {
      console.warn('Chunk load error detected. Reloading page...');
      window.location.reload();
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error && error.message && error.message.includes('Loading chunk') && error.name === 'ChunkLoadError') {
      console.warn('Chunk load error in promise. Reloading page...');
      window.location.reload();
    }
  });
}

export default ErrorBoundary;
