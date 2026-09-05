import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={clsx(
      'bg-border/60 rounded-lg animate-pulse',
      className
    )}
  />
);

// Preset skeletons

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('bg-surface border border-border rounded-2xl p-5 space-y-3', className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-3 w-10" />
    </div>
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-5/6" />
    <div className="pt-2 border-t border-border space-y-2">
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Skeleton className="w-6 h-6 rounded-full" />
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  </div>
);

export const SkeletonRow: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={clsx(
      'flex items-center gap-4 p-4 border-b border-border last:border-0',
      className
    )}
  >
    <Skeleton className="w-4 h-4 rounded shrink-0" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-3.5 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
    <Skeleton className="h-5 w-14 rounded-full" />
    <Skeleton className="h-3 w-20" />
  </div>
);

export const SkeletonKanbanCard: React.FC = () => (
  <div className="bg-surface border border-border rounded-xl p-3 space-y-2.5">
    <Skeleton className="h-4 w-5/6" />
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-12 rounded-full" />
      <Skeleton className="h-4 w-16 rounded-full" />
    </div>
    <div className="flex items-center justify-between pt-1">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="w-5 h-5 rounded-full" />
    </div>
  </div>
);

export const SkeletonKanbanColumn: React.FC = () => (
  <div className="flex-shrink-0 w-72 bg-background rounded-2xl p-3 space-y-2 border border-border">
    <div className="flex items-center justify-between p-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-5 w-5 rounded" />
    </div>
    <SkeletonKanbanCard />
    <SkeletonKanbanCard />
    <SkeletonKanbanCard />
  </div>
);
