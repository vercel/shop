import { Skeleton } from "@/components/ui/skeleton";

// Shell fallback for the PDP while `params`/`searchParams` resolve on navigation. Mirrors the
// ProductDetailSection grid (6/4 columns, sticky info) so the resolved content lands without CLS.
// Image cells are plain canvases rather than pulsing skeletons: they're the LCP slot and a pulse
// reads as a harder flash than an empty surface.
export function ProductDetailSkeleton() {
  return (
    <div aria-busy="true" className="grid gap-10 lg:grid-cols-10 lg:items-start lg:gap-5">
      <div className="lg:col-span-6">
        <div className="aspect-square w-full bg-accent lg:hidden" />
        <div className="hidden grid-cols-2 gap-2.5 lg:grid">
          <div className="aspect-square w-full bg-accent" />
          <div className="aspect-square w-full bg-accent" />
          <div className="aspect-square w-full bg-accent" />
          <div className="aspect-square w-full bg-accent" />
        </div>
      </div>
      <div className="grid gap-10 lg:sticky lg:top-20 lg:col-span-4">
        <div className="grid gap-5">
          <div className="grid gap-2.5">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-7 w-24" />
          </div>
          <div className="grid gap-2.5">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-2.5">
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-10 w-16" />
            </div>
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}
