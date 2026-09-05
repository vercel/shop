import { cn } from "cn";
import Link from "next/link";
import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import { searchIndexProducts } from "@/lib/shopify/operations/products";

interface ProductsGridSkeletonProps {
  count: number;
  className?: string;
}

export function ProductsGridSkeleton({ count, className }: ProductsGridSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-5 lg:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

interface ProductsGridProps {
  collectionUrl?: string;
  limit: number;
  title: string;
}

export function ProductsGrid({ collectionUrl, limit, title }: ProductsGridProps) {
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        {collectionUrl && (
          <Link
            href={collectionUrl}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            View All
          </Link>
        )}
      </div>
      <Suspense fallback={<ProductsGridSkeleton count={limit} />}>
        <ProductsGridContent limit={limit} outOfStockText="Out of Stock" />
      </Suspense>
    </div>
  );
}

async function ProductsGridContent({
  limit,
  outOfStockText,
}: {
  limit: number;
  outOfStockText: string;
}) {
  // Use the search index (not the products connection) so these match the first items on /collections/all.
  const { products } = await searchIndexProducts({
    limit,
  });
  if (products.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} outOfStockText={outOfStockText} />
      ))}
    </div>
  );
}
