"use client";
import { useEffect } from 'react';

const TestErrorComponent = () => {
  useEffect(() => {
    // throw new Error("Test error from TestErrorComponent!");
  }, []);
  return <div>This component will throw an error.</div>;
};
export default TestErrorComponent;
