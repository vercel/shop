import type * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface MobileFilterSortBarProps {
  filterSheet: React.ReactNode;
  sortSelect: React.ReactNode;
}

export function MobileFilterSortBar({
  filterSheet,
  sortSelect,
}: MobileFilterSortBarProps) {
  return (
    <div className="md:hidden -mx-4 lg:-mx-8 px-4 lg:px-8 py-2 bg-accent/50 border-y border-border/50">
      <div className="flex items-center justify-between">
        {filterSheet}
        {sortSelect}
      </div>
    </div>
  );
}

export function MobileFilterSortBarSkeleton() {
  return (
    <div className="md:hidden -mx-4 lg:-mx-8 px-4 lg:px-8 py-2 bg-accent/50 border-y border-border/50">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}
