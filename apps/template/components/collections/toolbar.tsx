import type * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface CollectionToolbarProps {
  filterSheet: React.ReactNode;
  sortSelect: React.ReactNode;
  resultCount?: React.ReactNode;
}

export function CollectionToolbar({
  filterSheet,
  sortSelect,
  resultCount,
}: CollectionToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 mb-4 mb-2">
      <div className="flex items-center gap-4">
        {filterSheet}
        {resultCount && (
          <span className="text-sm text-muted-foreground hidden sm:inline">{resultCount}</span>
        )}
      </div>
      {sortSelect}
    </div>
  );
}

export function CollectionToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 py-3 mb-4 mb-2">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-4 w-32 hidden sm:block" />
      </div>
      <Skeleton className="h-5 w-24" />
    </div>
  );
}
