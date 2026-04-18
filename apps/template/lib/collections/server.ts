import type { Locale } from "@/lib/i18n";
import {
  buildProductFiltersFromParams,
  getCollectionProducts,
} from "@/lib/shopify/operations/products";
import { type TransformedFilters, transformShopifyFilters } from "@/lib/shopify/transforms/filters";
import { RESULTS_PER_PAGE, parseFiltersFromSearchParams } from "@/lib/utils";

export interface CollectionSearchState {
  activeFilters: Record<string, string | string[] | undefined>;
  sort?: string;
}

export interface CollectionResultsData {
  activeFilters: Record<string, string | string[] | undefined>;
  collection: string;
  sort?: string;
  filtersJson?: string;
  result: Awaited<ReturnType<typeof getCollectionProducts>>;
  transformedFilters: TransformedFilters;
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
  handlePromise,
  locale,
  searchStatePromise,
}: {
  handlePromise: Promise<string>;
  locale: Locale;
  searchStatePromise: Promise<CollectionSearchState>;
}): Promise<CollectionResultsData> {
  const [handle, { activeFilters, sort }] = await Promise.all([handlePromise, searchStatePromise]);
  const shopifyFilters = buildProductFiltersFromParams(activeFilters);
  const filtersJson = shopifyFilters.length > 0 ? JSON.stringify(shopifyFilters) : undefined;
  const result = await getCollectionProducts({
    collection: handle,
    sortKey: sort,
    limit: RESULTS_PER_PAGE,
    filtersJson,
    locale,
  });

  return {
    activeFilters,
    collection: handle,
    sort,
    filtersJson,
    result,
    transformedFilters: transformShopifyFilters(result.filters, {
      activeFilters,
    }),
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
