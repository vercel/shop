"use client";

import { LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ProductCardContent,
  ProductCardImage,
  ProductCardImageContainer,
  ProductCardPrice,
  ProductCardTitle,
  ProductCard as ProductCardRoot,
} from "@/components/product-card/components";
import type { PageInfo, ProductCard } from "@/lib/types";

interface InfiniteProductGridProps<TParams> {
  initialProducts: ProductCard[];
  initialPageInfo: PageInfo;
  locale: string;
  outOfStockText: string;
  // Top-level "use server" action; passed by reference, no closure encryption.
  loadMore: (
    params: TParams & { cursor: string },
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
  const [additionalProducts, setAdditionalProducts] = useState<ProductCard[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>(initialPageInfo);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Reset when initial data changes (filter/sort navigation)
  useEffect(() => {
    setAdditionalProducts([]);
    setPageInfo(initialPageInfo);
    setIsLoading(false);
    loadingRef.current = false;
  }, [initialProducts, initialPageInfo]);

  const handleLoadMore = useCallback(async () => {
    if (loadingRef.current || !pageInfo.hasNextPage || !pageInfo.endCursor) return;
    loadingRef.current = true;
    setIsLoading(true);

    try {
      const result = await loadMore({ ...loadMoreParams, cursor: pageInfo.endCursor });
      setAdditionalProducts((prev) => [...prev, ...result.products]);
      setPageInfo(result.pageInfo);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [pageInfo, loadMore, loadMoreParams]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore]);

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
  const href = product.defaultVariantNumericId
    ? `/products/${product.handle}?variant=${product.defaultVariantNumericId}`
    : `/products/${product.handle}`;

  return (
    <Link href={href}>
      <ProductCardRoot>
        <ProductCardImageContainer>
          <ProductCardImage
            src={product.featuredImage?.url}
            alt={product.featuredImage?.altText || product.title}
            images={product.images}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            outOfStock={!product.availableForSale}
            outOfStockText={outOfStockText}
            fallbackTitle={product.title}
          />
          <ProductCardContent>
            <ProductCardTitle>{product.title}</ProductCardTitle>
            <ProductCardPrice
              amount={product.price.amount}
              currencyCode={product.price.currencyCode}
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
