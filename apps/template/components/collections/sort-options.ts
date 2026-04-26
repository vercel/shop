import type { NamespaceMessages } from "@/lib/i18n";

import type { SortOption } from "./sort-select";

const SORT_KEYS = [
  { value: "best-matches", key: "bestMatches" },
  { value: "best-selling", key: "bestSelling" },
  { value: "product-name-ascending", key: "nameAscending" },
  { value: "product-name-descending", key: "nameDescending" },
  { value: "price-low-to-high", key: "priceLowToHigh" },
  { value: "price-high-to-low", key: "priceHighToLow" },
  { value: "date-old-to-new", key: "dateOldToNew" },
  { value: "date-new-to-old", key: "dateNewToOld" },
] as const;

export function buildSortOptions(
  searchLabels: NamespaceMessages<"search">,
  exclude?: readonly string[],
): SortOption[] {
  const sortLabels = searchLabels.sort;
  return SORT_KEYS.filter((o) => !exclude?.includes(o.value)).map((o) => ({
    value: o.value,
    label: sortLabels[o.key],
  }));
}
