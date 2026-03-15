"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { type FilterTab, OrderFilters } from "./order-filters";

interface OrderFiltersComposedProps {
  className?: string;
  debounceMs?: number;
}

export function OrderFiltersComposed({
  className = "",
  debounceMs = 300,
}: OrderFiltersComposedProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Read state from URL
  const statusParam = searchParams.get("status");
  const activeTab: FilterTab =
    statusParam === "in_progress" ||
    statusParam === "completed" ||
    statusParam === "cancelled"
      ? statusParam
      : "all";

  const queryParam = searchParams.get("q") || "";
  const [searchValue, setSearchValue] = useState(queryParam);

  // Sync search input with URL on mount and when URL changes externally
  useEffect(() => {
    setSearchValue(queryParam);
  }, [queryParam]);

  // Update URL params - useEffectEvent keeps this out of effect deps
  // while always reading the latest router/pathname/searchParams
  const updateParams = useEffectEvent(
    (updates: { status?: FilterTab; q?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.status !== undefined) {
        if (updates.status === "all") {
          params.delete("status");
        } else {
          params.set("status", updates.status);
        }
      }

      if (updates.q !== undefined) {
        if (updates.q === "") {
          params.delete("q");
        } else {
          params.set("q", updates.q);
        }
      }

      const queryString = params.toString();
      startTransition(() => {
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
      });
    },
  );

  // Handle tab change - immediate
  const handleTabChange = (tab: FilterTab) => {
    updateParams({ status: tab });
  };

  // Handle search change - debounced
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== queryParam) {
        updateParams({ q: searchValue });
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchValue, queryParam, debounceMs]);

  return (
    <OrderFilters
      activeTab={activeTab}
      onTabChange={handleTabChange}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      className={className}
    />
  );
}
