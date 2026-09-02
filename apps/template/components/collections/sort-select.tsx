"use client";

import { useCollection, useCollectionActions } from "@shopify/hydrogen/react";
import { useTranslations } from "next-intl";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { getCollectionSortByValue, getCollectionSortFromState } from "@/lib/collections";

const SORT_OPTIONS = [
  { value: "best-matches", key: "bestMatches" },
  { value: "best-selling", key: "bestSelling" },
  { value: "product-name-ascending", key: "nameAscending" },
  { value: "product-name-descending", key: "nameDescending" },
  { value: "price-low-to-high", key: "priceLowToHigh" },
  { value: "price-high-to-low", key: "priceHighToLow" },
  { value: "date-old-to-new", key: "dateOldToNew" },
  { value: "date-new-to-old", key: "dateNewToOld" },
] as const;

// Storefront `search` only sorts by RELEVANCE and PRICE.
export const SEARCH_SORT_EXCLUDE: string[] = [
  "best-selling",
  "date-new-to-old",
  "date-old-to-new",
  "product-name-ascending",
  "product-name-descending",
];

export function CollectionsSortSelect({ exclude }: { exclude?: string[] } = {}) {
  const { reverse, sortKey, status } = useCollection();
  const { setSortByValue } = useCollectionActions();
  const tSort = useTranslations("search.sort");
  const tSearch = useTranslations("search");
  const options = exclude
    ? SORT_OPTIONS.filter((option) => !exclude.includes(option.value))
    : SORT_OPTIONS;

  return (
    <Select
      value={getCollectionSortFromState(sortKey, reverse)}
      onValueChange={(value) => setSortByValue(getCollectionSortByValue(value ?? "") ?? "manual")}
      disabled={status === "loading"}
    >
      <SelectTrigger className="border-0 shadow-none bg-transparent px-0">
        <span>{tSearch("sortBy")}</span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {tSort(option.key)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
