import { PRODUCTS_PER_PAGE } from "@/lib/collections";
import type { BrowseResults, BrowseState } from "@/lib/collections/types";
import {
  fetchSearchFacets,
  fetchSearchIndexProducts,
} from "@/lib/shopify/operations/products/server";

export async function fetchSearchResults({
  query,
  statePromise,
}: {
  query?: string;
  statePromise: Promise<BrowseState>;
}): Promise<BrowseResults> {
  const { dataSearch, filters, sort } = await statePromise;
  const [{ pageInfo, products }, { facets, total }] = await Promise.all([
    fetchSearchIndexProducts({
      filters,
      limit: PRODUCTS_PER_PAGE,
      query,
      sortKey: sort,
    }),
    fetchSearchFacets({
      filters,
      query,
    }),
  ]);
  return {
    dataSearch,
    facets,
    pageInfo,
    products,
    source: { query, type: "search" },
    total,
  };
}
