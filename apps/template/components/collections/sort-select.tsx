"use client";

import { getSortByValue } from "@shopify/hydrogen";
import { useCollection, useCollectionActions } from "@shopify/hydrogen/react";
import { useTranslations } from "next-intl";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

// Values are Shopify `sort_by` parameters; "manual" means the collection's own order.
const SORT_OPTIONS = [
  { value: "manual", key: "bestMatches" },
  { value: "best-selling", key: "bestSelling" },
  { value: "title-ascending", key: "nameAscending" },
  { value: "title-descending", key: "nameDescending" },
  { value: "price-ascending", key: "priceLowToHigh" },
  { value: "price-descending", key: "priceHighToLow" },
  { value: "created-ascending", key: "dateOldToNew" },
  { value: "created-descending", key: "dateNewToOld" },
] as const;

// Storefront `search` only sorts by RELEVANCE and PRICE.
export const SEARCH_SORT_EXCLUDE: string[] = [
  "best-selling",
  "created-ascending",
  "created-descending",
  "title-ascending",
  "title-descending",
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
      value={sortKey ? getSortByValue(sortKey, reverse) : "manual"}
      onValueChange={(value) => setSortByValue(value ?? "manual")}
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
