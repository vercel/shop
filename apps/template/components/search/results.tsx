import { Suspense } from "react";

import {
  FilterPendingScope,
  ProductGridPendingOverlay,
} from "@/components/collections/filter-pending-context";
import { InfiniteProductGrid } from "@/components/collections/infinite-product-grid";
import { CollectionToolbarSkeleton } from "@/components/collections/toolbar";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card/product-card";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n/server";
import { loadMoreSearchProducts } from "@/lib/search/action";
import { buildProductFiltersFromParams, getProducts } from "@/lib/shopify/operations/products";
import { transformShopifyFilters } from "@/lib/shopify/transforms/filters";
import type { TransformedFilters } from "@/lib/shopify/transforms/filters";
import type { ProductFilter } from "@/lib/shopify/types/filters";
import type { PageInfo, ProductCard as ProductCardType } from "@/lib/types";
import { RESULTS_PER_PAGE } from "@/lib/utils";

const RESULTS_SKELETON_KEYS = Array.from(
  { length: 15 },
  (_, index) => `search-results-skeleton-${index}`,
);

export function ResultsSkeleton() {
  return (
    <>
      <CollectionToolbarSkeleton />
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {RESULTS_SKELETON_KEYS.map((key) => (
          <ProductCardSkeleton key={key} />
        ))}
      </div>
    </>
  );
}

export interface SearchResultsData {
  products: ProductCardType[];
  total: number;
  pageInfo: PageInfo;
  transformedFilters: TransformedFilters;
  activeFilters: Record<string, string | string[] | undefined>;
  filters: ProductFilter[];
  query?: string;
  collection?: string;
  sort?: string;
}

export async function getSearchResultsData({
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
}): Promise<SearchResultsData> {
  const shopifyFilters = buildProductFiltersFromParams(activeFilters);
  const result = await getProducts({
    query,
    collection,
    sortKey: sort,
    limit: RESULTS_PER_PAGE,
    filters: shopifyFilters,
    locale,
  });

  return {
    products: result.products,
    total: result.total,
    pageInfo: result.pageInfo,
    transformedFilters: transformShopifyFilters(result.filters, { activeFilters }),
    activeFilters,
    filters: shopifyFilters,
    query,
    collection,
    sort,
  };
}

export async function SearchResultsGrid({
  locale,
  searchResultsDataPromise,
}: {
  locale: Locale;
  searchResultsDataPromise: Promise<SearchResultsData>;
}) {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {RESULTS_SKELETON_KEYS.map((key) => (
            <ProductCardSkeleton key={key} />
          ))}
        </div>
      }
    >
      <SearchResultsGridRender
        locale={locale}
        searchResultsDataPromise={searchResultsDataPromise}
      />
    </Suspense>
  );
}

async function SearchResultsGridRender({
  locale,
  searchResultsDataPromise,
}: {
  locale: Locale;
  searchResultsDataPromise: Promise<SearchResultsData>;
}) {
  const data = await searchResultsDataPromise;
  const { products, query } = data;

  const [noResultsLabel, noResultsBodyLabel, outOfStockText, addToCartLabel] = await Promise.all([
    t("search.noResults"),
    query ? t("search.noResultsQuery", { query }) : t("search.noResultsAvailable"),
    t("product.outOfStock"),
    t("product.addToCart"),
  ]);

  if (products.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-2">{noResultsLabel}</h2>
        <p className="text-muted-foreground">{noResultsBodyLabel}</p>
      </div>
    );
  }

  const boundLoadMore = async (cursor: string) => {
    "use server";
    return loadMoreSearchProducts({
      query: data.query,
      collection: data.collection,
      cursor,
      sortKey: data.sort,
      filters: data.filters,
      locale,
    });
  };

  return (
    <FilterPendingScope>
      <ProductGridPendingOverlay>
        <InfiniteProductGrid
          addToCartLabel={addToCartLabel}
          initialProducts={products}
          initialPageInfo={data.pageInfo}
          locale={locale}
          outOfStockText={outOfStockText}
          loadMore={boundLoadMore}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              outOfStockText={outOfStockText}
            />
          ))}
        </InfiniteProductGrid>
      </ProductGridPendingOverlay>
    </FilterPendingScope>
  );
}
