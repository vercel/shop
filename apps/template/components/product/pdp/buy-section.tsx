import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDetails } from "@/lib/types";

import { BuySectionClient } from "./buy-section-client";
import type { SelectedOptions } from "./variants";

function Fallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function BuySection({
  productPromise,
  selectedOptions,
}: {
  productPromise: Promise<ProductDetails>;
  selectedOptions: SelectedOptions;
}) {
  return (
    <Suspense fallback={<Fallback />}>
      <BuySectionClient productPromise={productPromise} selectedOptions={selectedOptions} />
    </Suspense>
  );
}
