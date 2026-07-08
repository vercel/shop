import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import type { Locale } from "@/lib/i18n";
import {
  getCollectionProducts,
  getFilteredCatalogProducts,
  searchIndexProducts,
} from "@/lib/shopify/operations/products";
import type { SearchParamsPromise } from "@/lib/types";
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

// A ?utm_campaign= value selects a collection only when it's in the caller's allowlist;
// anything else (missing, unknown, multi-valued) falls through to the regular resolution.
function resolveCampaignCollection(
  params: Record<string, string | string[] | undefined> | undefined,
  allowed: readonly string[] | undefined,
): string | undefined {
  if (!params || !allowed?.length) return undefined;
  const value = params.utm_campaign;
  const campaign = Array.isArray(value) ? value[0] : value;
  return campaign && allowed.includes(campaign) ? campaign : undefined;
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
  campaignCollections?: readonly string[];
  collection?: string;
  collectionUrl?: string;
  columns?: ProductsGridColumns;
  fallbackSortKey?: string;
  limit: number;
  locale: Locale;
  searchParams?: SearchParamsPromise;
  title: string;
}

export async function ProductsGrid({
  campaignCollections,
  collection,
  collectionUrl,
  columns,
  fallbackSortKey,
  limit,
  locale,
  searchParams,
  title,
}: ProductsGridProps) {
  const t = await getTranslations("product");

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
      <Suspense fallback={<ProductsGridSkeleton columns={columns} count={limit} />}>
        <ProductsGridContent
          campaignCollections={campaignCollections}
          collection={collection}
          columns={columns}
          fallbackSortKey={fallbackSortKey}
          limit={limit}
          locale={locale}
          outOfStockText={t("outOfStock")}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}

async function ProductsGridContent({
  campaignCollections,
  collection,
  columns,
  fallbackSortKey,
  limit,
  locale,
  outOfStockText,
  searchParams,
}: {
  campaignCollections?: readonly string[];
  collection?: string;
  columns?: ProductsGridColumns;
  fallbackSortKey?: string;
  limit: number;
  locale: Locale;
  outOfStockText: string;
  searchParams?: SearchParamsPromise;
}) {
  // Reading searchParams (when passed) opts this grid into PPR's dynamic hole so it
  // streams in behind the skeleton.
  const params = searchParams ? await searchParams : undefined;

  // A ?utm_campaign= match swaps in that collection; otherwise use the configured
  // collection, or the fallback vector (catalog sort key, else the relevance search index).
  const collectionHandle = resolveCampaignCollection(params, campaignCollections) ?? collection;

  const { products } = collectionHandle
    ? await getCollectionProducts({ collection: collectionHandle, limit, locale })
    : await fetchFallbackProducts({ fallbackSortKey, limit, locale });

  if (products.length === 0) return null;

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
