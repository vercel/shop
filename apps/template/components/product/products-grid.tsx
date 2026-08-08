import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import type { Locale } from "@/lib/i18n";
import {
  getCollectionProducts,
  getFilteredCatalogProducts,
  searchIndexProducts,
} from "@/lib/shopify/operations/products";
import type { ProductCard as ProductCardData } from "@/lib/types";
import { cn } from "@/lib/utils";

export type ProductsGridColumns = 4 | 5;

export function productsGridColumnsClass(columns: ProductsGridColumns = 4): string {
  return columns === 5
    ? "grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    : "grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4";
}

interface ProductsGridSkeletonProps {
  className?: string;
  columns?: ProductsGridColumns;
  count: number;
}

export function ProductsGridSkeleton({ className, columns, count }: ProductsGridSkeletonProps) {
  return (
    <div className={cn(productsGridColumnsClass(columns), className)}>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

interface ProductsGridSectionProps {
  columns?: ProductsGridColumns;
  locale: Locale;
  outOfStockText: string;
  products: ProductCardData[];
}

// Presentational grid shared by the static ProductsGrid and dynamic wrappers like
// picked-for-you, which resolve their own product list and render this directly.
export function ProductsGridSection({
  columns,
  locale,
  outOfStockText,
  products,
}: ProductsGridSectionProps) {
  return (
    <div className={productsGridColumnsClass(columns)}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          outOfStockText={outOfStockText}
        />
      ))}
    </div>
  );
}

// No campaign or collection: pull the fallback vector. A catalog sort key (e.g. best-selling)
// gives this grid a distinct ordering from new arrivals; without one, match /collections/all.
function fetchFallbackProducts({
  fallbackSortKey,
  limit,
  locale,
}: {
  fallbackSortKey?: string;
  limit: number;
  locale: Locale;
}) {
  return fallbackSortKey
    ? getFilteredCatalogProducts({ limit, locale, sortKey: fallbackSortKey })
    : searchIndexProducts({ limit, locale });
}

interface ProductsGridProps {
  collection?: string;
  collectionUrl?: string;
  columns?: ProductsGridColumns;
  fallbackSortKey?: string;
  limit: number;
  locale: Locale;
  title: string;
}

// Static grid: resolves a fixed collection or fallback vector at prerender time.
// Request-time variants (campaign params, remembered-collection cookies) belong in
// a dedicated wrapper like picked-for-you.tsx, not here.
export async function ProductsGrid({
  collection,
  collectionUrl,
  columns,
  fallbackSortKey,
  limit,
  locale,
  title,
}: ProductsGridProps) {
  const t = await getTranslations("product");

  const { products } = collection
    ? await getCollectionProducts({ collection, limit, locale })
    : await fetchFallbackProducts({ fallbackSortKey, limit, locale });

  if (products.length === 0) return null;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        {collectionUrl && (
          <Link
            href={collectionUrl}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("viewAll")}
          </Link>
        )}
      </div>
      <ProductsGridSection
        columns={columns}
        locale={locale}
        outOfStockText={t("outOfStock")}
        products={products}
      />
    </div>
  );
}
