"use client";

import { FirebaseTest } from "@/components/firebase-test";

export default function FirebaseTestPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Firebase Integration Test</h1>
      <FirebaseTest />
    </div>
  );
}
