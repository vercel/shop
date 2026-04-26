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
    <div className="flex items-center gap-5">
      {filterSheet}
      <div className="flex items-center gap-5 ml-auto">
        {resultCount && (
          <span className="text-sm text-muted-foreground hidden sm:inline">{resultCount}</span>
        )}
        {sortSelect}
      </div>
    </div>
  );
}

export function CollectionToolbarSkeleton() {
  return (
    <div className="flex items-center gap-5">
      <Skeleton className="h-9 w-24" />
      <div className="flex items-center gap-5 ml-auto">
        <Skeleton className="h-4 w-32 hidden sm:block" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}
