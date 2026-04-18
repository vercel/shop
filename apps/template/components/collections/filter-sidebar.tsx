"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useOptimistic, useRef, useState } from "react";

import {
  useFilterPending,
  useFilterTransition,
} from "@/components/collections/filter-pending-context";
import {
  FilterBadge,
  FilterOption,
  FilterOptionList,
  FilterPricePreset,
  FilterPriceRange,
  FilterSection,
  FilterSectionContent,
  FilterSectionHeader,
  FilterSidebar,
  FilterSidebarActiveFilters,
  FilterSidebarHeader,
  FilterSidebarScrollFade,
} from "@/components/ui/filter-sidebar";
import { getActiveFilterBadges } from "@/lib/shopify/transforms/filters";
import type { Filter, PriceRange } from "@/lib/types";

interface CollectionFilterSidebarClientProps {
  filters: Filter[];
  priceRange?: PriceRange;
  activeFilters: Record<string, string | string[] | undefined>;
}

type FilterState = Record<string, string | string[] | undefined>;

const PRICE_PRESETS = [
  { label: "Under $50", min: 0, max: 50 },
  { label: "$50 - $100", min: 50, max: 100 },
  { label: "$100 - $200", min: 100, max: 200 },
  { label: "Over $200", min: 200, max: undefined },
];

function formatPriceRangeLabel(min: number | null, max: number | null): string {
  if (min !== null && max !== null) {
    return `$${min} - $${max}`;
  }
  if (min !== null) {
    return `From $${min}`;
  }
  return `Up to $${max}`;
}

function getFilterValues(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toFilterStateValue(values: string[]): string | string[] | undefined {
  if (values.length === 0) return undefined;
  if (values.length === 1) return values[0];
  return values;
}

function toggleFilterStateValue(current: FilterState, key: string, value: string): FilterState {
  const values = getFilterValues(current[key]);
  const nextValues = values.includes(value)
    ? values.filter((currentValue) => currentValue !== value)
    : [...values, value];

  return {
    ...current,
    [key]: toFilterStateValue(nextValues),
  };
}

function buildHref(pathname: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function toggleFilterParam(params: URLSearchParams, key: string, value: string): void {
  const nextValues = getFilterValues(params.getAll(key));

  if (nextValues.includes(value)) {
    params.delete(key);
    for (const nextValue of nextValues) {
      if (nextValue !== value) {
        params.append(key, nextValue);
      }
    }
    return;
  }

  params.append(key, value);
}

function parsePriceValue(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
}

function applyPriceParams(params: URLSearchParams, min: number | null, max: number | null): void {
  if (min === null) {
    params.delete("filter.v.price.gte");
  } else {
    params.set("filter.v.price.gte", min.toString());
  }

  if (max === null) {
    params.delete("filter.v.price.lte");
  } else {
    params.set("filter.v.price.lte", max.toString());
  }
}

export function CollectionFilterSidebarClient({
  filters,
  priceRange,
  activeFilters,
}: CollectionFilterSidebarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPending = useFilterPending();
  const startFilterTransition = useFilterTransition();
  const tSearch = useTranslations("search");
  const tCategory = useTranslations("category");

  const [optimisticFilters, setOptimisticFilters] = useOptimistic(
    activeFilters,
    (current, update: { key: string; value: string }) =>
      toggleFilterStateValue(current, update.key, update.value),
  );

  const pendingFilterRef = useRef<string | null>(null);
  const urlPriceMin = parsePriceValue(searchParams.get("filter.v.price.gte"));
  const urlPriceMax = parsePriceValue(searchParams.get("filter.v.price.lte"));
  const hasPriceFilter = urlPriceMin !== null || urlPriceMax !== null;

  const computeFilterHref = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    toggleFilterParam(params, key, value);

    return buildHref(pathname, params);
  };

  const toggleFilter = (key: string, value: string) => {
    const href = computeFilterHref(key, value);
    pendingFilterRef.current = `${key}:${value}`;

    startFilterTransition(() => {
      setOptimisticFilters({ key, value });
      router.push(href);
    });
  };

  const [minInput, setMinInput] = useState(urlPriceMin?.toString() ?? "");
  const [maxInput, setMaxInput] = useState(urlPriceMax?.toString() ?? "");

  useEffect(() => {
    setMinInput(urlPriceMin?.toString() ?? "");
    setMaxInput(urlPriceMax?.toString() ?? "");
  }, [urlPriceMin, urlPriceMax]);

  const applyPriceRange = (min: string, max: string) => {
    const minNum = min ? Number.parseFloat(min) : null;
    const maxNum = max ? Number.parseFloat(max) : null;

    const validMin = minNum !== null && !Number.isNaN(minNum) && minNum >= 0 ? minNum : null;
    const validMax = maxNum !== null && !Number.isNaN(maxNum) && maxNum >= 0 ? maxNum : null;

    const params = new URLSearchParams(searchParams.toString());
    applyPriceParams(params, validMin, validMax);

    startFilterTransition(() => {
      router.push(buildHref(pathname, params));
    });
  };

  const applyPricePreset = (min: number, max: number | undefined) => {
    setMinInput(min.toString());
    setMaxInput(max?.toString() ?? "");
    applyPriceRange(min.toString(), max?.toString() ?? "");
  };

  const removePriceRange = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("filter.v.price.gte");
    params.delete("filter.v.price.lte");

    startFilterTransition(() => {
      router.push(buildHref(pathname, params));
    });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    for (const key of [...params.keys()]) {
      if (key.startsWith("filter.")) params.delete(key);
    }

    startFilterTransition(() => {
      router.push(buildHref(pathname, params));
    });
  };

  const activeBadges = getActiveFilterBadges(filters, activeFilters);
  const totalActiveCount = activeBadges.length + (hasPriceFilter ? 1 : 0);

  return (
    <FilterSidebar>
      <div className="flex flex-col gap-10 pb-[166px]">
        <FilterSidebarHeader
          title={tSearch("filters")}
          resetLabel={tSearch("reset")}
          activeCount={totalActiveCount > 0 ? totalActiveCount : undefined}
          onReset={totalActiveCount > 0 ? clearAllFilters : undefined}
        />

        {(activeBadges.length > 0 || hasPriceFilter) && (
          <FilterSidebarActiveFilters>
            {activeBadges.map((badge) => (
              <FilterBadge
                key={`${badge.paramKey}-${badge.value}`}
                variant="primary"
                onRemove={() => toggleFilter(badge.paramKey, badge.value)}
              >
                {badge.label}
              </FilterBadge>
            ))}
            {hasPriceFilter && (
              <FilterBadge variant="primary" onRemove={removePriceRange}>
                {formatPriceRangeLabel(urlPriceMin, urlPriceMax)}
              </FilterBadge>
            )}
          </FilterSidebarActiveFilters>
        )}

        {priceRange && (
          <FilterSection>
            <FilterSectionHeader title={tCategory("price")} />
            <FilterSectionContent>
              <FilterPriceRange
                minValue={minInput}
                maxValue={maxInput}
                onMinChange={setMinInput}
                onMaxChange={setMaxInput}
                onApply={applyPriceRange}
              >
                <FilterOptionList>
                  {PRICE_PRESETS.map((preset) => {
                    const isSelected =
                      urlPriceMin === preset.min &&
                      (preset.max === undefined
                        ? urlPriceMax === null
                        : urlPriceMax === preset.max);

                    return (
                      <FilterPricePreset
                        key={preset.label}
                        selected={isSelected}
                        onClick={() => applyPricePreset(preset.min, preset.max)}
                      >
                        {preset.label}
                      </FilterPricePreset>
                    );
                  })}
                </FilterOptionList>
              </FilterPriceRange>
            </FilterSectionContent>
          </FilterSection>
        )}

        {filters.map((filter) => {
          if (filter.values.length === 0) return null;

          const currentValues = getFilterValues(optimisticFilters[filter.paramKey]);

          return (
            <FilterSection key={filter.id}>
              <FilterSectionHeader title={filter.label} />
              <FilterSectionContent>
                <FilterOptionList>
                  {filter.values.slice(0, 10).map((value) => (
                    <FilterOption
                      key={value.id}
                      label={value.label}
                      count={value.count}
                      selected={currentValues.includes(value.value)}
                      href={computeFilterHref(filter.paramKey, value.value)}
                      pending={
                        isPending &&
                        pendingFilterRef.current === `${filter.paramKey}:${value.value}`
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFilter(filter.paramKey, value.value);
                      }}
                    />
                  ))}
                </FilterOptionList>
              </FilterSectionContent>
            </FilterSection>
          );
        })}
      </div>

      <FilterSidebarScrollFade />
    </FilterSidebar>
  );
}
