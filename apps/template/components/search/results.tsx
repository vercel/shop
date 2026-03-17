import { getTranslations } from "next-intl/server";

import {
  FilterPendingScope,
  ProductGridPendingOverlay,
} from "@/components/collections/filter-pending-context";
import { CollectionsPagination } from "@/components/collections/pagination";
import { CollectionFilterSidebarClient } from "@/components/filters/collection-filter-sidebar";
import { CollectionFilterSidebarSkeleton } from "@/components/filters/collection-filter-sidebar-skeleton";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import { buildProductFiltersFromParams, getProducts } from "@/lib/shopify/operations/products";
import { transformShopifyFilters } from "@/lib/shopify/transforms/filters";
import { RESULTS_PER_PAGE, toProductCard } from "@/lib/utils/product-card";

const RESULTS_SKELETON_KEYS = Array.from(
  { length: 10 },
  (_, index) => `search-results-skeleton-${index}`,
);

export function ResultsSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="hidden md:block w-64 shrink-0">
        <CollectionFilterSidebarSkeleton />
      </aside>

      <div className="flex-1">
        <Skeleton className="mb-6 h-4 w-40" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {RESULTS_SKELETON_KEYS.map((key) => (
            <Skeleton key={key} className="h-80 rounded-md" />
          ))}
        </div>
      </div>
    </div>
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
              <div className="mb-6 hidden md:block">
                <p className="text-sm text-muted-foreground">
                  {t("resultCount", { count: result.total })}
                </p>
              </div>

              <ProductGridPendingOverlay>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => {
                    const card = toProductCard(product);
                    return (
                      <ProductCard
                        key={product.id}
                        product={card}
                        locale={locale}
                        outOfStockText={tProduct("outOfStock")}
                      />
                    );
                  })}
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
