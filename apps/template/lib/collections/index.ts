import {
  type CollectionState,
  getSortByValue,
  type ProductFilter,
  serializeCollectionParams,
} from "@shopify/hydrogen";

import type { Collection, SortValue } from "@/lib/collections/types";
import { shopConfig } from "@/lib/config";
import { summarizeText } from "@/lib/content";

export const PRODUCTS_PER_PAGE = 40;

export function describeCollection(collection: Collection): string {
  return (
    summarizeText(collection.seo.description) ||
    summarizeText(collection.description) ||
    `Shop ${collection.title} at ${shopConfig.site.name}: browse products, compare prices, and check availability.`
  );
}

// Storefront `search` only sorts by RELEVANCE and PRICE.
// Shopify `sort_by` values; "manual" means the collection's own order.
export const SORT_VALUES = [
  "manual",
  "best-selling",
  "title-ascending",
  "title-descending",
  "price-ascending",
  "price-descending",
  "created-ascending",
  "created-descending",
] as const;

export const SEARCH_SORT_EXCLUDE: SortValue[] = [
  "best-selling",
  "created-ascending",
  "created-descending",
  "title-ascending",
  "title-descending",
];

export function getBrowseSort(
  state: Pick<CollectionState, "reverse" | "sortKey">,
): string | undefined {
  return state.sortKey ? getSortByValue(state.sortKey, state.reverse) : undefined;
}

export function getBrowseSearch(
  state: Pick<CollectionState, "filters" | "reverse" | "sortKey">,
): string {
  return serializeCollectionParams(state).toString();
}

export function parseFilterInput(input: string): ProductFilter | undefined {
  try {
    return JSON.parse(input) as ProductFilter;
  } catch {
    return undefined;
  }
}
