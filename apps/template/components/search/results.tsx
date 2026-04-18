import { getTranslations } from "next-intl/server";

import {
  FilterPendingScope,
  ProductGridPendingOverlay,
} from "@/components/collections/filter-pending-context";
import { InfiniteProductGrid } from "@/components/collections/infinite-product-grid";
import { CollectionToolbarSkeleton } from "@/components/collections/toolbar";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { loadMoreSearchProducts } from "@/lib/collections/actions";
import type { Locale } from "@/lib/i18n";
import { buildProductFiltersFromParams, getProducts } from "@/lib/shopify/operations/products";
import { transformShopifyFilters } from "@/lib/shopify/transforms/filters";
import { RESULTS_PER_PAGE } from "@/lib/utils";

const RESULTS_SKELETON_KEYS = Array.from(
  { length: 15 },
  (_, index) => `search-results-skeleton-${index}`,
);

export function ResultsSkeleton({ title }: { title: string }) {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">{title}</h1>
      </div>
      <CollectionToolbarSkeleton />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {RESULTS_SKELETON_KEYS.map((key) => (
          <ProductCardSkeleton key={key} />
        ))}
      </div>
    </>
  );
}

export async function Results({
  query,
  sort,
  collection,
  locale,
  activeFilters,
}: {
  query?: string;
  sort?: string;
  collection?: string;
  locale: Locale;
  activeFilters: Record<string, string | string[] | undefined>;
}) {
  const [t, tProduct] = await Promise.all([getTranslations("search"), getTranslations("product")]);

  const shopifyFilters = buildProductFiltersFromParams(activeFilters);
  const filtersJson = shopifyFilters.length > 0 ? JSON.stringify(shopifyFilters) : undefined;
  const result = await getProducts({
    query,
    collection,
    sortKey: sort,
    limit: RESULTS_PER_PAGE,
    filtersJson,
    locale,
  });

  const products = result.products;

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">{t("noResults")}</h2>
        <p className="text-muted-foreground">
          {query ? t("noResultsQuery", { query }) : t("noResultsAvailable")}
        </p>
      </div>
    );
  }

  const boundLoadMore = async (cursor: string) => {
    "use server";
    return loadMoreSearchProducts({
      query,
      collection,
      cursor,
      sortKey: sort,
      filtersJson,
      locale,
    });
  };

  return (
    <FilterPendingScope>
      <p className="text-sm text-muted-foreground mb-4">
        {t("resultCount", { count: result.total })}
      </p>
      <ProductGridPendingOverlay>
        <InfiniteProductGrid
          initialProducts={products}
          initialPageInfo={result.pageInfo}
          locale={locale}
          outOfStockText={tProduct("outOfStock")}
          loadMore={boundLoadMore}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              outOfStockText={tProduct("outOfStock")}
            />
          ))}
        </InfiniteProductGrid>
      </ProductGridPendingOverlay>
    </FilterPendingScope>
  );
}
