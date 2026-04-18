import { getTranslations } from "next-intl/server";

import {
  FilterPendingScope,
  ProductGridPendingOverlay,
} from "@/components/collections/filter-pending-context";
import { CollectionsPagination } from "@/components/collections/pagination";
import { CollectionFilterSidebarClient } from "@/components/collections/filter-sidebar";
import { CollectionFilterSidebarSkeleton } from "@/components/collections/filter-sidebar-skeleton";
import { MobileFilterSortBarSkeleton } from "@/components/collections/mobile-filter-sort-bar";
import { CollectionsSortSelect } from "@/components/collections/sort-select";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { buildProductFiltersFromParams, getProducts } from "@/lib/shopify/operations/products";
import { transformShopifyFilters } from "@/lib/shopify/transforms/filters";
import { RESULTS_PER_PAGE } from "@/lib/utils";

const RESULTS_SKELETON_KEYS = Array.from(
  { length: 12 },
  (_, index) => `search-results-skeleton-${index}`,
);

export function ResultsSkeleton({ title }: { title: string }) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
          {title}
        </h1>
      </div>
      <MobileFilterSortBarSkeleton />
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="hidden md:block w-64 shrink-0">
          <CollectionFilterSidebarSkeleton />
        </aside>

        <div className="flex-1">
          <div className="mb-6 hidden md:flex md:items-center md:justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {RESULTS_SKELETON_KEYS.map((key) => (
              <ProductCardSkeleton key={key} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export async function Results({
  query,
  sort,
  collection,
  locale,
  cursor,
  activeFilters,
}: {
  query?: string;
  sort?: string;
  collection?: string;
  locale: Locale;
  cursor?: string;
  activeFilters: Record<string, string | string[] | undefined>;
}) {
  const [t, tProduct] = await Promise.all([getTranslations("search"), getTranslations("product")]);

  const shopifyFilters = buildProductFiltersFromParams(activeFilters);
  const result = await getProducts({
    query,
    collection,
    sortKey: sort,
    limit: RESULTS_PER_PAGE,
    cursor,
    filters: shopifyFilters,
    _filterCacheKey: JSON.stringify(shopifyFilters),
    locale,
  });

  const transformedFilters = transformShopifyFilters(result.filters, {
    activeFilters,
  });
  const products = result.products;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="hidden md:block w-64 shrink-0">
        <FilterPendingScope>
          <CollectionFilterSidebarClient
            filters={transformedFilters.filters}
            priceRange={transformedFilters.priceRange}
            activeFilters={activeFilters}
          />
        </FilterPendingScope>
      </aside>

      <FilterPendingScope>
        <div className="flex-1">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold mb-2">{t("noResults")}</h2>
              <p className="text-muted-foreground">
                {query ? t("noResultsQuery", { query }) : t("noResultsAvailable")}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 hidden md:flex md:items-center md:justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("resultCount", { count: result.total })}
                </p>
                <CollectionsSortSelect />
              </div>

              <ProductGridPendingOverlay>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      locale={locale}
                      outOfStockText={tProduct("outOfStock")}
                    />
                  ))}
                </div>
              </ProductGridPendingOverlay>

              <CollectionsPagination
                hasNextPage={result.pageInfo.hasNextPage}
                endCursor={result.pageInfo.endCursor}
                isFirstPage={!cursor}
              />
            </>
          )}
        </div>
      </FilterPendingScope>
    </div>
  );
}
