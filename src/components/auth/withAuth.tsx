"use client";

import React, { ComponentType, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const withAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const WithAuthComponent: React.FC<P> = (props) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/login');
      }
    }, [isLoading, user, router]);

    if (isLoading) {
      // You can replace this with a more sophisticated loading spinner or component
      return <div>Loading...</div>;
    }

    if (!user) {
      // This case should ideally be handled by the redirect,
      // but as a fallback or if redirect hasn't occurred yet.
      return null; // Or a minimal loading/message, redirect should handle it.
    }

    return <WrappedComponent {...props} />;
  };

  // Set a display name for easier debugging in React DevTools
  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;
