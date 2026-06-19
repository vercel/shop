import "server-only";
import type { Locale } from "@/lib/i18n";
import {
  buildProductFiltersFromParams,
  getSearchFacets,
  searchIndexProducts,
} from "@/lib/shopify/operations/products";
import type { ProductFilter } from "@/lib/shopify/types/filters";
import type { Filter, PageInfo, PriceRange, ProductCard } from "@/lib/types";
import { RESULTS_PER_PAGE } from "@/lib/utils";

export interface SearchResultsData {
  activeFilters: Record<string, string | string[] | undefined>;
  collection?: string;
  filters: ProductFilter[];
  pageInfo: PageInfo;
  products: ProductCard[];
  query?: string;
  sort?: string;
  total: number;
  transformedFilters: { filters: Filter[]; priceRange?: PriceRange };
}

export async function getSearchResultsData({
  activeFilters,
  collection,
  locale,
  query,
  sort,
}: {
  activeFilters: Record<string, string | string[] | undefined>;
  collection?: string;
  locale: Locale;
  query?: string;
  sort?: string;
}): Promise<SearchResultsData> {
  const shopifyFilters = buildProductFiltersFromParams(activeFilters);
  const [results, facets] = await Promise.all([
    searchIndexProducts({
      query,
      collection,
      sortKey: sort,
      limit: RESULTS_PER_PAGE,
      filters: shopifyFilters,
      locale,
    }),
    getSearchFacets({ activeFilters, query, collection, filters: shopifyFilters, locale }),
  ]);

  return {
    activeFilters,
    collection,
    filters: shopifyFilters,
    pageInfo: results.pageInfo,
    products: results.products,
    query,
    sort,
    total: facets.total,
    transformedFilters: { filters: facets.filters, priceRange: facets.priceRange },
  };
}
