"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FilterTab = "all" | "in_progress" | "completed" | "cancelled";

interface OrderFiltersProps {
  activeTab?: FilterTab;
  onTabChange?: (tab: FilterTab) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
}

export function OrderFilters({
  activeTab = "all",
  onTabChange,
  searchValue = "",
  onSearchChange,
  className = "",
}: OrderFiltersProps) {
  return (
    <div
      data-slot="order-filters"
      className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4", className)}
    >
      <OrderFiltersSelect value={activeTab} onChange={onTabChange} />
      <OrderFiltersSearch value={searchValue} onChange={onSearchChange} />
    </div>
  );
}

interface OrderFiltersSelectProps {
  value: FilterTab;
  onChange?: (tab: FilterTab) => void;
}

const selectOptions = [
  { value: "all", labelKey: "allOrders" },
  { value: "in_progress", labelKey: "inProgress" },
  { value: "completed", labelKey: "completed" },
  { value: "cancelled", labelKey: "cancelled" },
] as const satisfies readonly { value: FilterTab; labelKey: string }[];

export function OrderFiltersSelect({
  value,
  onChange,
}: OrderFiltersSelectProps) {
  const t = useTranslations("orders");
  return (
    <Select value={value} onValueChange={(v) => onChange?.(v as FilterTab)}>
      <SelectTrigger className="w-full sm:w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {selectOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {t(option.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface OrderFiltersSearchProps {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export function OrderFiltersSearch({
  value,
  onChange,
  placeholder,
}: OrderFiltersSearchProps) {
  const t = useTranslations("orders");
  return (
    <div data-slot="order-filters-search" className="py-3 sm:py-0">
      <div className="flex flex-row items-center gap-2 rounded-[99px] bg-input px-3 py-2">
        <Search className="h-4 w-4 text-foreground opacity-50" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder ?? t("searchOrders")}
          className="w-full bg-transparent text-base font-normal text-foreground placeholder:text-foreground placeholder:opacity-50 focus:outline-none"
        />
      </div>
    </div>
  );
}

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useState, useTransition } from "react";

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
