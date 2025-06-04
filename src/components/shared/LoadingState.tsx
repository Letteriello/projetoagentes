import * as React from 'react';
import { Skeleton, SkeletonProps } from '@/components/ui/skeleton'; // Corrected SkeletonProps import
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export interface LoadingStateProps {
  isLoading: boolean;
  loadingText?: string;
  error?: Error | string | null;
  loadingType?: 'spinner' | 'skeleton';
  skeletonProps?: SkeletonProps; // Use SkeletonProps from the import
  children?: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  loadingText,
  error,
  loadingType = 'spinner',
  skeletonProps,
  children,
}) => {
  if (isLoading) {
    if (loadingType === 'skeleton') {
      return (
        <div className="space-y-2">
          <Skeleton {...skeletonProps} />
          {loadingText && <p className="text-sm text-muted-foreground text-center">{loadingText}</p>}
        </div>
      );
    }
    // Default to spinner
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        <Spinner size="large" /> {/* Assuming Spinner has a size prop, adjust if not */}
        {loadingText && <p className="text-sm text-muted-foreground">{loadingText}</p>}
      </div>
    );
  }

  if (error) {
    const errorMessage = typeof error === 'string' ? error : error?.message || 'An unknown error occurred.';
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default LoadingState;
