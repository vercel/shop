import { getTranslations } from "next-intl/server";

import type { Locale } from "@/lib/i18n";
import {
  buildProductFiltersFromParams,
  getCollectionProducts,
  getSearchFacets,
  searchIndexProducts,
} from "@/lib/shopify/operations/products";
import type { ProductFilter } from "@/lib/shopify/types/filters";
import type { Collection, Filter, PriceRange } from "@/lib/types";
import { RESULTS_PER_PAGE, parseFiltersFromSearchParams } from "@/lib/utils";

// Shopify's /collections/all is a Liquid-storefront convention with no Storefront API
// equivalent — the "all" virtual collection is owned entirely by this module and the
// dedicated app/collections/all/page.tsx route. The data layer (lib/shopify/operations)
// stays unaware of it.
export const ALL_PRODUCTS_HANDLE = "all";

export interface CollectionSearchState {
  activeFilters: Record<string, string | string[] | undefined>;
  sort?: string;
}

export interface CollectionResultsData {
  activeFilters: Record<string, string | string[] | undefined>;
  collection: string;
  sort?: string;
  filters: ProductFilter[];
  result: Awaited<ReturnType<typeof getCollectionProducts>>;
  transformedFilters: { filters: Filter[]; priceRange?: PriceRange };
}

export async function getCollectionSearchState(
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>,
): Promise<CollectionSearchState> {
  const searchParams = await searchParamsPromise;

  return {
    activeFilters: parseFiltersFromSearchParams(searchParams),
    sort: getSingleSearchParam(searchParams.sort),
  };
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
  const { activeFilters, sort } = await searchStatePromise;
  const shopifyFilters = buildProductFiltersFromParams(activeFilters);
  const result = await getCollectionProducts({
    activeFilters,
    collection: handle,
    sortKey: sort,
    limit: RESULTS_PER_PAGE,
    filters: shopifyFilters,
    locale,
  });

  return {
    activeFilters,
    collection: handle,
    sort,
    filters: shopifyFilters,
    result,
    transformedFilters: { filters: result.filters, priceRange: result.priceRange },
  };
}

export function getExactCollectionResultCount({
  result,
}: {
  result: Awaited<ReturnType<typeof getCollectionProducts>>;
}): number | undefined {
  if (result.pageInfo.hasNextPage) {
    return undefined;
  }

  return result.products.length;
}

function getSingleSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
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
  const { activeFilters, sort } = await searchStatePromise;
  const shopifyFilters = buildProductFiltersFromParams(activeFilters);
  const [products, facets] = await Promise.all([
    searchIndexProducts({
      sortKey: sort,
      limit: RESULTS_PER_PAGE,
      filters: shopifyFilters,
      locale,
    }),
    getSearchFacets({ activeFilters, filters: shopifyFilters, locale }),
  ]);

  return {
    activeFilters,
    collection: ALL_PRODUCTS_HANDLE,
    sort,
    filters: shopifyFilters,
    result: {
      products: products.products,
      pageInfo: products.pageInfo,
      filters: facets.filters,
      priceRange: facets.priceRange,
    },
    transformedFilters: { filters: facets.filters, priceRange: facets.priceRange },
  };
}
