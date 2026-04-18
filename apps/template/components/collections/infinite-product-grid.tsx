"use client";

import { LoaderCircleIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  ProductCardBadge,
  ProductCardContent,
  ProductCardImage,
  ProductCardImageContainer,
  ProductCardPrice,
  ProductCard as ProductCardRoot,
  ProductCardTitle,
} from "@/components/ui/product-card";
import { ProductCardQuickAdd } from "@/components/ui/product-card-quick-add";
import { productCardToOptimisticInfo } from "@/lib/product";
import type { PageInfo, ProductCard } from "@/lib/types";

interface InfiniteProductGridProps {
  initialProducts: ProductCard[];
  initialPageInfo: PageInfo;
  locale: string;
  outOfStockText: string;
  loadMore: (cursor: string) => Promise<{ products: ProductCard[]; pageInfo: PageInfo }>;
  children: React.ReactNode;
}

export function InfiniteProductGrid({
  initialProducts,
  initialPageInfo,
  locale,
  outOfStockText,
  loadMore,
  children,
}: InfiniteProductGridProps) {
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
      const result = await loadMore(pageInfo.endCursor);
      setAdditionalProducts((prev) => [...prev, ...result.products]);
      setPageInfo(result.pageInfo);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [pageInfo, loadMore]);

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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
        <div ref={sentinelRef} className="flex justify-center py-8">
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
    ? `/products/${product.handle}?variantId=${product.defaultVariantNumericId}`
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
          >
            {product.availableForSale && product.defaultVariantId && (
              <ProductCardQuickAdd
                variantId={product.defaultVariantId}
                productInfo={productCardToOptimisticInfo(product)}
              />
            )}
          </ProductCardImage>
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
