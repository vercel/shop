import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { ProductDetails } from "@/lib/types";

import { AddToCartClient } from "./client";

function Fallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full rounded-md" />
    </div>
  );
}

async function Render({ productPromise }: { productPromise: Promise<ProductDetails> }) {
  const product = await productPromise;

  return (
    <div className="space-y-6">
      <AddToCartClient product={product} />
    </div>
  );
}

export function AddToCart({ productPromise }: { productPromise: Promise<ProductDetails> }) {
  return (
    <Suspense fallback={<Fallback />}>
      <Render productPromise={productPromise} />
    </Suspense>
  );
}
