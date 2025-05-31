import TestClientComponent from '../test-client';

export default function ClientTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Client Environment Test</h1>
      <p className="mb-4">
        This page tests the client-side environment to verify that Node.js dependencies are being handled correctly.
      </p>
      
      <div className="mt-8">
        <TestClientComponent />
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded-md">
        <h2 className="text-xl font-bold mb-2">Debug Instructions</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Open browser developer console (F12)</li>
          <li>Check for any errors related to Node.js modules</li>
          <li>Verify that polyfills are loaded correctly</li>
        </ol>
      </div>
    </div>
  );
}
