import type * as React from "react";

interface CollectionToolbarProps {
  filterSheet: React.ReactNode;
  sortSelect: React.ReactNode;
  // Omit on pages without a count so the slot doesn't reserve space.
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
      <div className="ml-auto flex items-center gap-5">
        {resultCount !== undefined && (
          <div className="hidden items-center text-sm text-muted-foreground sm:flex">
            {resultCount}
          </div>
        )}
        {sortSelect}
      </div>
    </div>
  );
}
