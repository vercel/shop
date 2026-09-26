"use client";

import { useCollection } from "@shopify/hydrogen/react";
import { LoaderCircleIcon } from "lucide-react";
import { type ReactNode, useEffect, useEffectEvent, useRef, useState } from "react";

import { ProductCard } from "@/components/product-card/product-card";
import { getBrowseSearch } from "@/lib/collections";
import { loadMoreBrowseProductsAction } from "@/lib/collections/action";
import type { BrowseSource } from "@/lib/collections/types";
import type { PageInfo } from "@/lib/pagination/types";
import type { ProductCard as ProductCardType } from "@/lib/product/types";

interface InfiniteProductGridProps {
  children: ReactNode;
  initialPageInfo: PageInfo;
  initialProductIds: string[];
  source: BrowseSource;
}

export function InfiniteProductGrid({
  children,
  initialPageInfo,
  initialProductIds,
  source,
}: InfiniteProductGridProps) {
  // The store, not a server snapshot, is the single source of truth for filters and sort mid-scroll.
  const search = useCollection(getBrowseSearch);
  const isPending = useCollection((state) => state.status === "loading");
  const [additionalProducts, setAdditionalProducts] = useState<ProductCardType[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const loadMorePage = useEffectEvent(async () => {
    // This grid's cursor belongs to the settled browse state; the next state remounts the grid.
    if (isPending || loadingRef.current || !pageInfo.hasNextPage || !pageInfo.endCursor) return;
    loadingRef.current = true;
    setIsLoading(true);

    try {
      const result = await loadMoreBrowseProductsAction({
        cursor: pageInfo.endCursor,
        search,
        source,
      });
      // Live cursor pages can re-emit a boundary product if the ranking shifts mid-scroll; skip ids already shown.
      setAdditionalProducts((prev) => {
        const seen = new Set([...initialProductIds, ...prev.map((product) => product.id)]);
        return [...prev, ...result.products.filter((product) => !seen.has(product.id))];
      });
      setPageInfo(result.pageInfo);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  });

  // Re-arm the observer per cursor so a sentinel still in view after a page lands triggers the next load.
  const { endCursor, hasNextPage } = pageInfo;
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || !endCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMorePage();
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [endCursor, hasNextPage]);
  return (
    <div
      className="transition-opacity duration-200 data-[pending=true]:pointer-events-none data-[pending=true]:opacity-50"
      data-pending={isPending}
    >
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {children}
        {additionalProducts.map((product) => (
          <ProductCard key={product.id} product={product} outOfStockText="Out of Stock" />
        ))}
      </div>

      {pageInfo.hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-10">
          {isLoading && <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />}
        </div>
      )}
    </div>
  );
}
