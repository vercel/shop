import { Container } from "@/components/layout/container";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductPageLoading() {
  return (
    <Container className="bg-background">
      <div className="space-y-8">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 space-y-8 lg:space-y-0">
          <div className="space-y-2">
            <Skeleton className="aspect-square w-full rounded-xl" />
          </div>
          <div className="space-y-8 lg:sticky lg:top-20">
            <div>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-24 mt-3" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <div className="grid grid-cols-5 gap-3">
                {["a", "b", "c", "d"].map((k) => (
                  <Skeleton key={k} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-11 flex-1 rounded-lg" />
              <Skeleton className="h-11 flex-1 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}
