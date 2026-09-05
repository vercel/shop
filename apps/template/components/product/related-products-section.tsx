import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRelatedProducts } from "@/lib/shopify/operations/products";

function RelatedProductsSectionSkeleton({ limit, title }: { limit: number; title?: string }) {
  return (
    <div className="grid gap-4">
      {title ? (
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
      ) : (
        <Skeleton className="h-9 w-48" />
      )}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {Array.from({ length: limit }, (_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

async function Render({ handle, limit }: { handle: string | Promise<string>; limit: number }) {
  const resolvedHandle = await handle;
  const related = await getRelatedProducts({
    handle: resolvedHandle,
  });
  if (related.length === 0) return null;
  return (
    <div className="grid gap-4">
      <h2 className="text-2xl sm:text-3xl">You May Also Like</h2>
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {related.slice(0, limit).map((product) => (
          <ProductCard key={product.id} product={product} outOfStockText="Out of Stock" />
        ))}
      </div>
    </div>
  );
}

export function RelatedProductsSection({
  handle,
  limit,
}: {
  handle: string | Promise<string>;
  limit: number;
}) {
  return (
    <Suspense fallback={<RelatedProductsSectionSkeleton limit={limit} title="You May Also Like" />}>
      <Render handle={handle} limit={limit} />
    </Suspense>
  );
}
