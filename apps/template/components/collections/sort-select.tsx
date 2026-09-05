"use client";

import { useCollection, useCollectionActions } from "@shopify/hydrogen/react";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { getCollectionSortByValue, getCollectionSortFromState } from "@/lib/collections";

const SORT_OPTIONS = [
  { value: "best-matches", label: "Best Matches" },
  { value: "best-selling", label: "Best Selling" },
  { value: "product-name-ascending", label: "Name: A-Z" },
  { value: "product-name-descending", label: "Name: Z-A" },
  { value: "price-low-to-high", label: "Price: Low to High" },
  { value: "price-high-to-low", label: "Price: High to Low" },
  { value: "date-old-to-new", label: "Date: Old to New" },
  { value: "date-new-to-old", label: "Date: New to Old" },
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
        <span>Sort</span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
