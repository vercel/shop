import {
  type CollectionState,
  type ProductCollectionSortKeys,
  type ProductFilter,
  serializeCollectionParams,
} from "@shopify/hydrogen";

import type { ActiveFilters } from "./types";

export const PRODUCTS_PER_PAGE = 40;

const SORT_TO_SORT_BY: Record<string, string> = {
  "best-selling": "best-selling",
  "date-new-to-old": "created-descending",
  "date-old-to-new": "created-ascending",
  "price-high-to-low": "price-descending",
  "price-low-to-high": "price-ascending",
  "product-name-ascending": "title-ascending",
  "product-name-descending": "title-descending",
};

export function getCollectionSortByValue(sort: string): string | undefined {
  return SORT_TO_SORT_BY[sort];
}

export function getCollectionSortFromState(
  sortKey: ProductCollectionSortKeys | undefined,
  reverse: boolean,
): string {
  switch (sortKey) {
    case "BEST_SELLING":
      return "best-selling";
    case "CREATED":
      return reverse ? "date-new-to-old" : "date-old-to-new";
    case "PRICE":
      return reverse ? "price-high-to-low" : "price-low-to-high";
    case "TITLE":
      return reverse ? "product-name-descending" : "product-name-ascending";
    default:
      return "best-matches";
  }
}

export function getBrowseSearch(
  state: Pick<CollectionState, "filters" | "reverse" | "sortKey">,
): string {
  return serializeCollectionParams(state).toString();
}

// Storefront transforms and markdown renderers still key on Liquid-style `filter.*` records.
export function getActiveFilters(filters: ProductFilter[]): ActiveFilters {
  const params = serializeCollectionParams({ filters, reverse: false, sortKey: undefined });
  const record: ActiveFilters = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    record[key] = values.length === 1 ? values[0] : values;
  }
  return record;
}

export function parseFilterInput(input: string): ProductFilter | undefined {
  try {
    return JSON.parse(input) as ProductFilter;
  } catch {
    return undefined;
  }
}
