"use client";

import { useCollection } from "@shopify/hydrogen/react";
import { LoaderCircleIcon } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import {
  ProductCardContent,
  ProductCardImage,
  ProductCardImageContainer,
  ProductCardPrice,
  ProductCardTitle,
  ProductCard as ProductCardRoot,
} from "@/components/product-card/components";
import Link from "@/components/ui/link";
import { getBrowseSearch } from "@/lib/collections";
import { buildProductUrl } from "@/lib/product";
import type { PageInfo, ProductCard } from "@/lib/types";

interface InfiniteProductGridProps<TParams> {
  initialProducts: ProductCard[];
  initialPageInfo: PageInfo;
  locale: string;
  outOfStockText: string;
  // Top-level "use server" action; passed by reference, no closure encryption.
  loadMore: (
    params: TParams & { cursor: string; search: string },
  ) => Promise<{ products: ProductCard[]; pageInfo: PageInfo }>;
  loadMoreParams: TParams;
  children: React.ReactNode;
}

export function InfiniteProductGrid<TParams>({
  initialProducts,
  initialPageInfo,
  locale,
  outOfStockText,
  loadMore,
  loadMoreParams,
  children,
}: InfiniteProductGridProps<TParams>) {
  // The store, not a server snapshot, is the single source of truth for filters and sort mid-scroll.
  const search = useCollection(getBrowseSearch);
  const [additionalProducts, setAdditionalProducts] = useState<ProductCard[]>([]);
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
          <ClientProductCard
            key={product.id}
            product={product}
            locale={locale}
            outOfStockText={outOfStockText}
          />
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

function ClientProductCard({
  product,
  locale,
  outOfStockText,
}: {
  product: ProductCard;
  locale: string;
  outOfStockText: string;
}) {
  const href = buildProductUrl(product.handle, product.defaultVariantSelectedOptions ?? []);

  return (
    <Link href={href}>
      <ProductCardRoot>
        <ProductCardImageContainer>
          <ProductCardImage
            src={product.featuredImage?.url}
            hoverSrc={product.secondaryImage?.url}
            alt={product.featuredImage?.altText || product.title}
            outOfStock={!product.availableForSale}
            outOfStockText={outOfStockText}
          />
          <ProductCardContent>
            <ProductCardTitle>{product.title}</ProductCardTitle>
            <ProductCardPrice
              amount={product.price.amount}
              currencyCode={product.price.currencyCode}
              maxAmount={product.maxPrice.amount}
              compareAtAmount={product.compareAtPrice?.amount}
              compareAtCurrencyCode={product.compareAtPrice?.currencyCode}
              locale={locale}
            />
          </ProductCardContent>
        </ProductCardImageContainer>
      </ProductCardRoot>
    </Link>
  );
}
