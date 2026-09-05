import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import {
  FilterPendingScope,
  ProductGridPendingOverlay,
} from "@/components/collections/filter-pending-context";
import { InfiniteProductGrid } from "@/components/collections/infinite-product-grid";
import { ProductCard } from "@/components/product-card/product-card";
import { ProductsGridSkeleton } from "@/components/product/products-grid";
import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import type { CollectionSearchState } from "@/lib/collections/server";
import type { Locale } from "@/lib/i18n";
import { loadMoreSearchProductsAction } from "@/lib/search/action";
import { fetchSearchFacets, fetchSearchIndexProducts } from "@/lib/shopify/operations/products";
import type { Filter, PageInfo, PriceRange, ProductCard as ProductCardType } from "@/lib/types";

export interface SearchResultsData {
  collection?: string;
  dataSearch: string;
  pageInfo: PageInfo;
  products: ProductCardType[];
  query?: string;
  total: number;
  transformedFilters: { filters: Filter[]; priceRange?: PriceRange };
}

export async function getSearchResultsData({
  collection,
  locale,
  query,
  searchStatePromise,
}: {
  collection?: string;
  locale: Locale;
  query?: string;
  searchStatePromise: Promise<CollectionSearchState>;
}): Promise<SearchResultsData> {
  const { activeFilters, dataSearch, filters, sort } = await searchStatePromise;
  const [results, facets] = await Promise.all([
    fetchSearchIndexProducts({
      activeFilters,
      query,
      collection,
      sortKey: sort,
      limit: PRODUCTS_PER_PAGE,
      filters,
      locale,
    }),
    fetchSearchFacets({ activeFilters, query, collection, filters, locale }),
  ]);

  return {
    collection,
    dataSearch,
    pageInfo: results.pageInfo,
    products: results.products,
    query,
    total: facets.total,
    transformedFilters: { filters: facets.filters, priceRange: facets.priceRange },
  };
}

export function SearchResultsGrid({
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
          count={PRODUCTS_PER_PAGE}
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

  const { collection, dataSearch, products, query } = data;

  if (products.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl mb-2">{t("noResults")}</h2>
        <p className="text-muted-foreground">
          {query ? t("noResultsQuery", { query }) : t("noResultsAvailable")}
        </p>
      </div>
    );
  }

  return (
    <FilterPendingScope>
      <ProductGridPendingOverlay>
        <InfiniteProductGrid
          key={`${query ?? ""}|${collection ?? ""}|${dataSearch}`}
          initialProducts={products}
          initialPageInfo={data.pageInfo}
          locale={locale}
          outOfStockText={tProduct("outOfStock")}
          loadMore={loadMoreSearchProductsAction}
          loadMoreParams={{ collection, locale, query }}
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
