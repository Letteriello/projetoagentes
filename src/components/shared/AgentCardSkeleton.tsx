import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';

interface AgentCardSkeletonProps {
  className?: string;
  viewMode?: 'grid' | 'list'; // To allow for potential list view skeleton later
}

const AgentCardSkeleton: React.FC<AgentCardSkeletonProps> = ({ className, viewMode = 'grid' }) => {
  if (viewMode === 'list') {
    // Simplified skeleton for list view
    return (
      <Card className={cn("flex flex-row items-center p-3 space-x-3 h-auto w-full", className)}>
        <Skeleton className="h-6 w-6 rounded-sm flex-shrink-0" /> {/* Drag Handle Placeholder */}
        <Skeleton className="h-10 w-10 rounded-md flex-shrink-0" /> {/* Icon Placeholder */}
        <div className="flex-grow space-y-1.5">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-2/5 rounded" /> {/* Title Placeholder */}
            <Skeleton className="h-4 w-1/5 rounded" /> {/* Badge Placeholder */}
          </div>
          <Skeleton className="h-3 w-4/5 rounded" /> {/* Description Placeholder */}
        </div>
        <div className="flex flex-col items-end space-y-1.5 ml-auto flex-shrink-0">
            <Skeleton className="h-5 w-12 rounded" />
            <Skeleton className="h-5 w-12 rounded" />
        </div>
      </Card>
    );
  }

  // Grid View Skeleton (default)
  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start">
          <Skeleton className="h-10 w-10 mr-4 rounded-md self-start mt-1" /> {/* Icon Placeholder */}
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between items-start mb-1">
              <Skeleton className="h-5 w-3/5 rounded" /> {/* Title Placeholder */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" /> {/* Favorite Star */}
                <Skeleton className="h-5 w-16 rounded" /> {/* Type Badge */}
              </div>
            </div>
            <Skeleton className="h-4 w-full rounded" /> {/* Description Line 1 */}
            <Skeleton className="h-4 w-4/5 rounded" /> {/* Description Line 2 */}
            <Skeleton className="h-4 w-3/5 rounded" /> {/* Description Line 3 (optional, for min-height) */}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow pt-0">
        <div className="space-y-1">
          <Skeleton className="h-4 w-1/4 rounded" /> {/* Section Title (e.g., Objetivo) */}
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-5/6 rounded" />
        </div>
        <div className="pt-2 space-y-1">
          <Skeleton className="h-4 w-1/3 rounded" /> {/* Section Title (e.g., Ferramentas) */}
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto pt-4 border-t gap-2">
        <Skeleton className="h-8 w-20 rounded" />
        <Skeleton className="h-8 w-24 rounded" />
        <Skeleton className="h-8 w-20 rounded ml-auto" />
      </CardFooter>
    </Card>
  );
};

export default AgentCardSkeleton;
