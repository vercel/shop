"use client";

import {
  filterEquals,
  isFilterInputActive,
  serializeCollectionParams,
  type CollectionState,
  type ProductFilter,
} from "@shopify/hydrogen";
import { useCollection, useCollectionActions } from "@shopify/hydrogen/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
  useFilterPending,
  useFilterTransition,
} from "@/components/collections/filter-pending-context";
import { Swatch } from "@/components/ui/swatch";
import { getActiveFilterBadges } from "@/lib/shopify/transforms/filters";
import type { Filter, PriceRange } from "@/lib/types";
import { parseFiltersFromSearchParams, searchParamsToRecord } from "@/lib/utils";

import {
  FilterBadge,
  FilterOption,
  FilterOptionList,
  FilterPriceRange,
  FilterSection,
  FilterSectionContent,
  FilterSectionHeader,
  FilterSidebar,
  FilterSidebarActiveFilters,
  FilterSidebarHeader,
  FilterSidebarScrollFade,
  FilterSwatchGrid,
} from "./filter-primitives";

interface CollectionFilterSidebarClientProps {
  activeFilters: Record<string, string | string[] | undefined>;
  collection?: boolean;
  filters: Filter[];
  priceRange?: PriceRange;
}

export function CollectionFilterSidebarClient(props: CollectionFilterSidebarClientProps) {
  return props.collection ? (
    <HydrogenCollectionFilterSidebar {...props} />
  ) : (
    <SearchFilterSidebar {...props} />
  );
}

function HydrogenCollectionFilterSidebar(props: CollectionFilterSidebarClientProps) {
  const state = useCollection();
  const actions = useCollectionActions();
  const params = serializeCollectionParams(state);
  const activeFilters = parseFiltersFromSearchParams(searchParamsToRecord(params));

  return (
    <FilterSidebarContent
      {...props}
      activeFilters={activeFilters}
      buildFilterHref={(input) => buildHydrogenFilterHref(state, input)}
      isPending={state.status === "loading"}
      onApplyPrice={(min, max) => {
        const filters = state.filters.filter((filter) => !filter.price);
        if (min !== null || max !== null) {
          filters.push({
            price: {
              ...(max !== null ? { max } : {}),
              ...(min !== null ? { min } : {}),
            },
          });
        }
        actions.setFilters(filters);
      }}
      onClear={actions.reset}
      onToggle={(input) => actions.toggleFilterInput(input)}
      selected={(input) => isFilterInputActive(state.filters, input)}
    />
  );
}

function SearchFilterSidebar(props: CollectionFilterSidebarClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPending = useFilterPending();
  const startTransition = useFilterTransition();

  const navigate = (params: URLSearchParams) => {
    startTransition(() => router.push(buildHref(pathname, params)));
  };

  return (
    <FilterSidebarContent
      {...props}
      buildFilterHref={(_, key, value) => {
        const params = new URLSearchParams(searchParams.toString());
        toggleFilterParam(params, key, value);
        return buildHref(pathname, params);
      }}
      isPending={isPending}
      onApplyPrice={(min, max) => {
        const params = new URLSearchParams(searchParams.toString());
        applyPriceParams(params, min, max);
        navigate(params);
      }}
      onClear={() => {
        const params = new URLSearchParams(searchParams.toString());
        for (const key of [...params.keys()]) if (key.startsWith("filter.")) params.delete(key);
        navigate(params);
      }}
      onToggle={(_, key, value) => {
        const params = new URLSearchParams(searchParams.toString());
        toggleFilterParam(params, key, value);
        navigate(params);
      }}
      selected={(_, key, value) => getFilterValues(props.activeFilters[key]).includes(value)}
    />
  );
}

function FilterSidebarContent({
  activeFilters,
  buildFilterHref,
  filters,
  isPending,
  onApplyPrice,
  onClear,
  onToggle,
  priceRange,
  selected,
}: CollectionFilterSidebarClientProps & {
  buildFilterHref: (input: string, key: string, value: string) => string;
  isPending: boolean;
  onApplyPrice: (min: number | null, max: number | null) => void;
  onClear: () => void;
  onToggle: (input: string, key: string, value: string) => void;
  selected: (input: string, key: string, value: string) => boolean;
}) {
  const locale = useLocale();
  const tSearch = useTranslations("search");
  const tCategory = useTranslations("category");
  const priceFilter = getPriceFilter(activeFilters);
  const [minInput, setMinInput] = useState(priceFilter.min?.toString() ?? "");
  const [maxInput, setMaxInput] = useState(priceFilter.max?.toString() ?? "");

  useEffect(() => {
    setMinInput(priceFilter.min?.toString() ?? "");
    setMaxInput(priceFilter.max?.toString() ?? "");
  }, [priceFilter.max, priceFilter.min]);

  const activeBadges = getActiveFilterBadges(filters, activeFilters);
  const hasPriceFilter = priceFilter.min !== null || priceFilter.max !== null;
  const totalActiveCount = activeBadges.length + (hasPriceFilter ? 1 : 0);

  return (
    <FilterSidebar>
      <div className="flex flex-col gap-5 pb-41.5">
        <FilterSidebarHeader
          activeCount={totalActiveCount > 0 ? totalActiveCount : undefined}
          onReset={totalActiveCount > 0 ? onClear : undefined}
          resetLabel={tSearch("reset")}
          title={tSearch("filters")}
        />

        {(activeBadges.length > 0 || hasPriceFilter) && (
          <FilterSidebarActiveFilters>
            {activeBadges.map((badge) => {
              const input = findFilterInput(filters, badge.paramKey, badge.value);
              return (
                <FilterBadge
                  key={`${badge.paramKey}-${badge.value}`}
                  onRemove={() => input && onToggle(input, badge.paramKey, badge.value)}
                  variant="primary"
                >
                  {badge.label}
                </FilterBadge>
              );
            })}
            {hasPriceFilter && (
              <FilterBadge variant="primary" onRemove={() => onApplyPrice(null, null)}>
                {formatPriceRangeLabel({
                  currencyCode: priceRange?.currencyCode,
                  locale,
                  max: priceFilter.max,
                  min: priceFilter.min,
                })}
              </FilterBadge>
            )}
          </FilterSidebarActiveFilters>
        )}

        {priceRange && (
          <FilterSection>
            <FilterSectionHeader title={tCategory("price")} />
            <FilterSectionContent>
              <FilterPriceRange
                fromPlaceholder={tCategory("priceFrom")}
                maxValue={maxInput}
                minValue={minInput}
                onApply={(min, max) => onApplyPrice(parsePriceValue(min), parsePriceValue(max))}
                onMaxChange={setMaxInput}
                onMinChange={setMinInput}
                toPlaceholder={tCategory("priceTo")}
              />
            </FilterSectionContent>
          </FilterSection>
        )}

        {filters.map((filter) =>
          filter.values.length === 0 ? null : (
            <FilterSection key={filter.id}>
              <FilterSectionHeader title={filter.label} />
              <FilterSectionContent>
                {filter.presentation === "swatch" ? (
                  <FilterSwatchGrid>
                    {filter.values.map((value) => {
                      const isSelected = selected(value.input, filter.paramKey, value.value);
                      return (
                        <Link
                          key={value.id}
                          aria-label={tSearch("selectFilterValue", {
                            name: filter.label,
                            value: value.label,
                          })}
                          aria-pressed={isSelected}
                          className="block cursor-pointer"
                          href={buildFilterHref(value.input, filter.paramKey, value.value)}
                          scroll={false}
                          onClick={(event) => {
                            event.preventDefault();
                            onToggle(value.input, filter.paramKey, value.value);
                          }}
                        >
                          <Swatch
                            color={value.swatch?.color}
                            image={value.swatch?.image}
                            label={value.label}
                            selected={isSelected}
                          />
                        </Link>
                      );
                    })}
                  </FilterSwatchGrid>
                ) : (
                  <FilterOptionList>
                    {filter.values.map((value) => (
                      <FilterOption
                        key={value.id}
                        count={value.count}
                        href={buildFilterHref(value.input, filter.paramKey, value.value)}
                        label={value.label}
                        pending={isPending && selected(value.input, filter.paramKey, value.value)}
                        selected={selected(value.input, filter.paramKey, value.value)}
                        onClick={(event) => {
                          event.preventDefault();
                          onToggle(value.input, filter.paramKey, value.value);
                        }}
                      />
                    ))}
                  </FilterOptionList>
                )}
              </FilterSectionContent>
            </FilterSection>
          ),
        )}
      </div>
      <FilterSidebarScrollFade />
    </FilterSidebar>
  );
}

function buildHydrogenFilterHref(
  state: Pick<CollectionState, "filters" | "reverse" | "sortKey">,
  input: string,
): string {
  try {
    const filter = JSON.parse(input) as ProductFilter;
    const next = state.filters.some((current) => filterEquals(current, filter))
      ? state.filters.filter((current) => !filterEquals(current, filter))
      : [...state.filters, filter];
    const params = serializeCollectionParams({ ...state, filters: next });
    const query = params.toString();
    return query ? `?${query}` : "?";
  } catch {
    return "?";
  }
}

function applyPriceParams(params: URLSearchParams, min: number | null, max: number | null) {
  if (min === null) params.delete("filter.v.price.gte");
  else params.set("filter.v.price.gte", min.toString());
  if (max === null) params.delete("filter.v.price.lte");
  else params.set("filter.v.price.lte", max.toString());
}

function buildHref(pathname: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function findFilterInput(filters: Filter[], key: string, value: string): string | undefined {
  return filters
    .find((filter) => filter.paramKey === key)
    ?.values.find((item) => item.value === value)?.input;
}

function formatPriceRangeLabel({
  currencyCode,
  locale,
  max,
  min,
}: {
  currencyCode?: string;
  locale: string;
  max: number | null;
  min: number | null;
}): string {
  const format = (value: number) =>
    currencyCode
      ? new Intl.NumberFormat(locale, { currency: currencyCode, style: "currency" }).format(value)
      : new Intl.NumberFormat(locale).format(value);
  if (min !== null && max !== null) return `${format(min)} - ${format(max)}`;
  if (min !== null) return `From ${format(min)}`;
  return `Up to ${format(max ?? 0)}`;
}

function getFilterValues(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getPriceFilter(activeFilters: Record<string, string | string[] | undefined>) {
  return {
    max: parsePriceValue(getFilterValues(activeFilters["filter.v.price.lte"])[0] ?? ""),
    min: parsePriceValue(getFilterValues(activeFilters["filter.v.price.gte"])[0] ?? ""),
  };
}

function parsePriceValue(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
}

function toggleFilterParam(params: URLSearchParams, key: string, value: string) {
  const current = params.getAll(key).flatMap((item) => item.split(","));
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  params.delete(key);
  for (const item of next) params.append(key, item);
}
