"use client";

import { useEffect, useState } from "react";
import { firestore } from "@/lib/firebaseClient";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export function FirebaseTest() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [testData, setTestData] = useState<any[]>([]);

  // Test Firebase connection
  const testConnection = async () => {
    setStatus('loading');
    setErrorMessage(null);
    
    try {
      // Create a test collection reference
      const testCollectionRef = collection(firestore, "firebase_test");
      
      // Add a test document
      const testDoc = {
        message: "Firebase connection test",
        timestamp: new Date().toISOString()
      };
      
      await addDoc(testCollectionRef, testDoc);
      
      // Fetch documents to verify write succeeded
      const querySnapshot = await getDocs(testCollectionRef);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setTestData(docs);
      setStatus('success');
    } catch (error) {
      console.error("Firebase test failed:", error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Firebase Connection Test</CardTitle>
        <CardDescription>
          Test your Firebase configuration and Firestore connection
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'error' && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {errorMessage || "An unknown error occurred"}
            </AlertDescription>
          </Alert>
        )}
        
        {status === 'success' && (
          <Alert className="mb-4">
            <AlertDescription>
              Successfully connected to Firebase Firestore!
              {testData.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Test Documents:</p>
                  <ul className="list-disc pl-5 text-sm">
                    {testData.map(doc => (
                      <li key={doc.id}>{doc.message} - {doc.timestamp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={testConnection} 
          disabled={status === 'loading'}
          className="w-full"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : "Test Firebase Connection"}
        </Button>
      </CardFooter>
    </Card>
  );
}
