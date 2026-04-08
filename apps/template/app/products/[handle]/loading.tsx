import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <Container className="bg-background">
      <div className="space-y-8">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 space-y-8 lg:space-y-0">
          {/* Media */}
          <Skeleton className="aspect-square w-full rounded-lg" />

          {/* Info */}
          <div className="space-y-8 lg:sticky lg:top-20">
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
