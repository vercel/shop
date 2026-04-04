import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductDetailSkeleton() {
  return (
    <Container className="bg-background">
      {/* Desktop Layout */}
      <div className="hidden lg:block space-y-8">
        <Skeleton className="h-4 w-48" />

        <div className="grid grid-cols-2 items-start gap-4">
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-24" />
            </div>

            <div className="space-y-3">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="size-10 rounded-full" />
              </div>
            </div>

            <Skeleton className="h-12 w-full rounded-lg" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden space-y-8">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="aspect-square w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />

        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-24" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-16" />
          <div className="flex gap-2">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="size-10 rounded-full" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </Container>
  );
}
