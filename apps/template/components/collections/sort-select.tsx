"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export interface SortOption {
  value: string;
  label: string;
}

interface CollectionsSortSelectProps {
  options: SortOption[];
  sortByLabel: string;
}

export function CollectionsSortSelect({ options, sortByLabel }: CollectionsSortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
        <span>{sortByLabel}</span>
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
