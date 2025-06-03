"use client";
import TestErrorComponent from '@/components/TestErrorComponent';
import ErrorBoundaryClient from '@/components/error-boundary-client'; // Assuming this is the correct path

export default function TestErrorPage() {
  return (
    <div>
      <h1>Test Page for Error Boundary</h1>
      <ErrorBoundaryClient>
        <TestErrorComponent />
      </ErrorBoundaryClient>
    </div>
  );
}
