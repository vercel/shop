"use client";

import { useCollection, useCollectionActions } from "@shopify/hydrogen/react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

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

type SortOption = (typeof SORT_OPTIONS)[number];

export function CollectionsSortSelect({
  collection = false,
  exclude,
}: {
  collection?: boolean;
  exclude?: string[];
} = {}) {
  return collection ? (
    <HydrogenCollectionSortSelect exclude={exclude} />
  ) : (
    <SearchSortSelect exclude={exclude} />
  );
}

function HydrogenCollectionSortSelect({ exclude }: { exclude?: string[] }) {
  const { reverse, sortKey, status } = useCollection();
  const { setSortByValue } = useCollectionActions();
  const options = getOptions(exclude);
  const tSort = useTranslations("search.sort");
  const tSearch = useTranslations("search");

  return (
    <SortSelect
      currentSort={getCollectionSortFromState(sortKey, reverse)}
      disabled={status === "loading"}
      onChange={(value) => {
        const sortBy = getCollectionSortByValue(value);
        setSortByValue(sortBy ?? "manual");
      }}
      options={options}
      sortByLabel={tSearch("sortBy")}
      translate={(key) => tSort(key)}
    />
  );
}

function SearchSortSelect({ exclude }: { exclude?: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tSort = useTranslations("search.sort");
  const tSearch = useTranslations("search");
  const [isPending, startTransition] = useTransition();
  const options = getOptions(exclude);
  const currentSort = searchParams.get("sort") || "best-matches";

  return (
    <SortSelect
      currentSort={currentSort}
      disabled={isPending}
      onChange={(value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "best-matches") params.delete("sort");
        else params.set("sort", value);
        startTransition(() => router.push(`?${params.toString()}`));
      }}
      options={options}
      sortByLabel={tSearch("sortBy")}
      translate={(key) => tSort(key)}
    />
  );
}

function SortSelect({
  currentSort,
  disabled,
  onChange,
  options,
  sortByLabel,
  translate,
}: {
  currentSort: string;
  disabled: boolean;
  onChange: (value: string) => void;
  options: SortOption[];
  sortByLabel: string;
  translate: (key: SortOption["key"]) => string;
}) {
  return (
    <Select
      value={currentSort}
      onValueChange={(value) => onChange(value ?? "best-matches")}
      disabled={disabled}
    >
      <SelectTrigger className="border-0 shadow-none bg-transparent px-0">
        <span>{sortByLabel}</span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {translate(option.key)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function getOptions(exclude?: string[]): SortOption[] {
  return exclude
    ? SORT_OPTIONS.filter((option) => !exclude.includes(option.value))
    : [...SORT_OPTIONS];
}
