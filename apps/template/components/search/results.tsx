import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import {
  FilterPendingScope,
  ProductGridPendingOverlay,
} from "@/components/collections/filter-pending-context";
import { InfiniteProductGrid } from "@/components/collections/infinite-product-grid";
import { ProductCard } from "@/components/product-card/product-card";
import { ProductsGridSkeleton } from "@/components/product/products-grid";
import type { Locale } from "@/lib/i18n";
import { loadMoreSearchProducts } from "@/lib/search/action";
import {
  buildProductFiltersFromParams,
  getSearchProducts,
} from "@/lib/shopify/operations/products";
import { transformShopifyFilters } from "@/lib/shopify/transforms/filters";
import type { TransformedFilters } from "@/lib/shopify/transforms/filters";
import type { ProductFilter } from "@/lib/shopify/types/filters";
import type { PageInfo, ProductCard as ProductCardType } from "@/lib/types";
import { RESULTS_PER_PAGE } from "@/lib/utils";

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
  const result = await getSearchProducts({
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
        <ProductsGridSkeleton
          count={RESULTS_PER_PAGE}
          className="sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        />
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
  const [data, t, tProduct] = await Promise.all([
    searchResultsDataPromise,
    getTranslations("search"),
    getTranslations("product"),
  ]);

  const { products, query } = data;

  if (products.length === 0) {
    return (
      <div className="text-center py-10">
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
          initialProducts={products}
          initialPageInfo={data.pageInfo}
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
