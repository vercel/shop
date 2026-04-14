export function ItemsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-border p-4 lg:p-6 animate-pulse">
          <div className="flex gap-4 lg:gap-6">
            <div className="w-20 lg:w-24 h-20 lg:h-24 bg-muted rounded-md shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-1/2 mb-4" />
              <div className="h-4 bg-muted rounded w-1/4" />
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="h-8 bg-muted rounded w-20" />
              <div className="h-4 bg-muted rounded w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SummarySkeleton() {
  return (
    <div className="border border-border p-6 animate-pulse sticky top-8">
      <div className="space-y-3 mb-6 pb-6 border-b border-border">
        {[1, 2].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
        ))}
      </div>

      <div className="flex justify-between mb-6">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-1/4" />
      </div>

      <div className="h-12 bg-muted rounded w-full" />

      <div className="mt-6 pt-6 border-t border-border">
        <div className="h-4 bg-muted rounded w-1/2 mb-3" />
        <div className="h-32 bg-muted rounded" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <>
      <div className="h-5 bg-muted rounded w-32 mb-6 animate-pulse" />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ItemsSkeleton />
        </div>

        <div className="lg:col-span-1">
          <SummarySkeleton />
        </div>
      </div>
    </>
  );
}
