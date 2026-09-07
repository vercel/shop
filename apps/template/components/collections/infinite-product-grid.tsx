"use client";

import { useCollection } from "@shopify/hydrogen/react";
import { LoaderCircleIcon } from "lucide-react";
import { type ReactNode, useEffect, useEffectEvent, useRef, useState } from "react";

import { ProductCard } from "@/components/product-card/product-card";
import { getBrowseSearch } from "@/lib/collections";
import type { PageInfo } from "@/lib/pagination/types";
import type { ProductCard as ProductCardType } from "@/lib/product/types";

interface InfiniteProductGridProps<TParams> {
  initialProducts: ProductCardType[];
  initialPageInfo: PageInfo;
  outOfStockText: string;
  // Top-level "use server" action; passed by reference, no closure encryption.
  loadMore: (
    params: TParams & { cursor: string; search: string },
  ) => Promise<{ products: ProductCardType[]; pageInfo: PageInfo }>;
  loadMoreParams: TParams;
  children: ReactNode;
}

export function InfiniteProductGrid<TParams>({
  initialProducts,
  initialPageInfo,
  outOfStockText,
  loadMore,
  loadMoreParams,
  children,
}: InfiniteProductGridProps<TParams>) {
  // The store, not a server snapshot, is the single source of truth for filters and sort mid-scroll.
  const search = useCollection(getBrowseSearch);
  const [additionalProducts, setAdditionalProducts] = useState<ProductCardType[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const loadMorePage = useEffectEvent(async () => {
    if (loadingRef.current || !pageInfo.hasNextPage || !pageInfo.endCursor) return;
    loadingRef.current = true;
    setIsLoading(true);

    try {
      const result = await loadMore({ ...loadMoreParams, cursor: pageInfo.endCursor, search });
      // Live cursor pages can re-emit a boundary product if the ranking shifts mid-scroll; skip ids already shown.
      setAdditionalProducts((prev) => {
        const seen = new Set([...initialProducts, ...prev].map((product) => product.id));
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
    <>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {children}
        {additionalProducts.map((product) => (
          <ProductCard key={product.id} product={product} outOfStockText={outOfStockText} />
        ))}
      </div>

      {pageInfo.hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-10">
          {isLoading && <LoaderCircleIcon className="size-6 animate-spin text-muted-foreground" />}
        </div>
      )}
    </>
  );
}
