"use client";

import { getSortByValue } from "@shopify/hydrogen";
import { useCollection, useCollectionActions } from "@shopify/hydrogen/react";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

// Values are Shopify `sort_by` parameters; "manual" means the collection's own order.
const SORT_OPTIONS = [
  { value: "manual", label: "Best Matches" },
  { value: "best-selling", label: "Best Selling" },
  { value: "title-ascending", label: "Name: A-Z" },
  { value: "title-descending", label: "Name: Z-A" },
  { value: "price-ascending", label: "Price: Low to High" },
  { value: "price-descending", label: "Price: High to Low" },
  { value: "created-ascending", label: "Date: Old to New" },
  { value: "created-descending", label: "Date: New to Old" },
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
