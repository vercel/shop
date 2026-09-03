import { parseCollectionParams, serializeCollectionParams } from "@shopify/hydrogen";
import { getTranslations } from "next-intl/server";

import {
  type ActiveFilters,
  getActiveFilters,
  getCollectionSortFromState,
} from "@/lib/collections";
import type { Locale } from "@/lib/i18n";
import {
  buildProductFiltersFromParams,
  fetchCollectionProducts,
  fetchSearchFacets,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products";
import type { ProductFilter } from "@/lib/shopify/types/filters";
import type { Collection, Filter, PriceRange } from "@/lib/types";
import { RESULTS_PER_PAGE } from "@/lib/utils";

// /collections/all is a local virtual collection with no Storefront API equivalent.
export const ALL_PRODUCTS_HANDLE = "all";

export interface BrowseParams {
  activeFilters: ActiveFilters;
  filters: ProductFilter[];
  sort?: string;
}

export interface CollectionSearchState extends BrowseParams {
  dataSearch: string;
}

export interface CollectionResultsData extends BrowseParams {
  collection: string;
  dataSearch: string;
  result: Awaited<ReturnType<typeof fetchCollectionProducts>>;
  transformedFilters: { filters: Filter[]; priceRange?: PriceRange };
}

export function resolveBrowseParams(search: string | URLSearchParams): CollectionSearchState {
  const state = parseCollectionParams(
    typeof search === "string" ? new URLSearchParams(search) : search,
  );
  const activeFilters = getActiveFilters(state.filters);
  const sort = getCollectionSortFromState(state.sortKey, state.reverse);
  return {
    activeFilters,
    dataSearch: serializeCollectionParams(state).toString(),
    filters: buildProductFiltersFromParams(activeFilters),
    sort: sort === "best-matches" ? undefined : sort,
  };
}

export async function getCollectionSearchState(
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>,
): Promise<CollectionSearchState> {
  return resolveBrowseParams(recordToSearchParams(await searchParamsPromise));
}

export function recordToSearchParams(
  record: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}

export async function getCollectionResultsData({
  handle,
  locale,
  searchStatePromise,
}: {
  handle: string;
  locale: Locale;
  searchStatePromise: Promise<CollectionSearchState>;
}): Promise<CollectionResultsData> {
  const { activeFilters, dataSearch, filters, sort } = await searchStatePromise;
  const result = await fetchCollectionProducts({
    activeFilters,
    collection: handle,
    sortKey: sort,
    limit: RESULTS_PER_PAGE,
    filters,
    locale,
  });

  return {
    activeFilters,
    collection: handle,
    dataSearch,
    sort,
    filters,
    result,
    transformedFilters: { filters: result.filters, priceRange: result.priceRange },
  };
}

export async function getAllProductsCollection(): Promise<Collection> {
  const t = await getTranslations("collections.all");
  const title = t("title");
  const description = t("description");
  return {
    handle: ALL_PRODUCTS_HANDLE,
    title,
    description,
    image: null,
    path: `/collections/${ALL_PRODUCTS_HANDLE}`,
    updatedAt: new Date(0).toISOString(),
    seo: { title, description },
  };
}

export async function getAllProductsResultsData({
  locale,
  searchStatePromise,
}: {
  locale: Locale;
  searchStatePromise: Promise<CollectionSearchState>;
}): Promise<CollectionResultsData> {
  const { activeFilters, dataSearch, filters, sort } = await searchStatePromise;
  const [products, facets] = await Promise.all([
    fetchSearchIndexProducts({
      activeFilters,
      sortKey: sort,
      limit: RESULTS_PER_PAGE,
      filters,
      locale,
    }),
    fetchSearchFacets({ activeFilters, filters, locale }),
  ]);

  return {
    activeFilters,
    collection: ALL_PRODUCTS_HANDLE,
    dataSearch,
    sort,
    filters,
    result: {
      products: products.products,
      pageInfo: products.pageInfo,
      filters: facets.filters,
      priceRange: facets.priceRange,
    },
    transformedFilters: { filters: facets.filters, priceRange: facets.priceRange },
  };
}
