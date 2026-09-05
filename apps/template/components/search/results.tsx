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
  query,
  searchStatePromise,
}: {
  collection?: string;
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
    }),
    fetchSearchFacets({
      activeFilters,
      query,
      collection,
      filters,
    }),
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
  searchResultsDataPromise,
}: {
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
      <SearchResultsGridRender searchResultsDataPromise={searchResultsDataPromise} />
    </Suspense>
  );
}

async function SearchResultsGridRender({
  searchResultsDataPromise,
}: {
  searchResultsDataPromise: Promise<SearchResultsData>;
}) {
  const data = await searchResultsDataPromise;
  const { collection, dataSearch, products, query } = data;
  if (products.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl mb-2">No products found</h2>
        <p className="text-muted-foreground">
          {query ? `We couldn't find any products matching "${query}"` : "No products available"}
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
          outOfStockText="Out of Stock"
          loadMore={loadMoreSearchProductsAction}
          loadMoreParams={{
            collection,
            query,
          }}
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} outOfStockText="Out of Stock" />
          ))}
        </InfiniteProductGrid>
      </ProductGridPendingOverlay>
    </FilterPendingScope>
  );
}
