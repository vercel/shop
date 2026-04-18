"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "best-matches", key: "bestMatches" },
  { value: "price-low-to-high", key: "priceLowToHigh" },
  { value: "price-high-to-low", key: "priceHighToLow" },
  { value: "product-name-ascending", key: "nameAscending" },
  { value: "product-name-descending", key: "nameDescending" },
] as const;

export function CollectionsSortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("search.sort");
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort") || "best-matches";

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "best-matches") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <Select value={currentSort} onValueChange={handleSortChange} disabled={isPending}>
      <SelectTrigger className="border-0 shadow-none bg-transparent px-0">
        <SelectValue placeholder={t("bestMatches")} />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {t(option.key)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
