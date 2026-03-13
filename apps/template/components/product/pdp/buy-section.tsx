import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDetails } from "@/lib/types";
import { BuySectionClient } from "./buy-section-client";

function Fallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  );
}

export function BuySection({
  productPromise,
}: {
  productPromise: Promise<ProductDetails>;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <BuySectionClient productPromise={productPromise} />
    </Suspense>
  );
}
