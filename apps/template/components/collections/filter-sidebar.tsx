"use client";

import {
  type CollectionState,
  filterEquals,
  getFilterRemovalUrl,
  isFilterInputActive,
  serializeCollectionParams,
} from "@shopify/hydrogen";
import { useCollection, useCollectionActions } from "@shopify/hydrogen/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { Swatch } from "@/components/ui/swatch";
import { getActiveFilters, parseFilterInput } from "@/lib/collections";
import { formatPrice } from "@/lib/money";
import { getActiveFilterBadges } from "@/lib/shopify/transforms/filters";
import type { Filter, PriceRange } from "@/lib/types";

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
  filters: Filter[];
  priceRange?: PriceRange;
}

export function CollectionFilterSidebarClient({
  filters,
  priceRange,
}: CollectionFilterSidebarClientProps) {
  const state = useCollection();
  const actions = useCollectionActions();
  const locale = useLocale();
  const tSearch = useTranslations("search");
  const tCategory = useTranslations("category");

  const activeFilters = getActiveFilters(state.filters);
  const priceFilter = state.filters.find((filter) => filter.price)?.price;
  const priceMin = priceFilter?.min ?? null;
  const priceMax = priceFilter?.max ?? null;
  const priceKey = `${priceMin ?? ""}:${priceMax ?? ""}`;
  const [priceInputs, setPriceInputs] = useState({
    key: priceKey,
    max: priceMax?.toString() ?? "",
    min: priceMin?.toString() ?? "",
  });
  // Applied price changed (URL/back-forward), so discard unsubmitted input.
  if (priceInputs.key !== priceKey) {
    setPriceInputs({
      key: priceKey,
      max: priceMax?.toString() ?? "",
      min: priceMin?.toString() ?? "",
    });
  }
  const minInput = priceInputs.key === priceKey ? priceInputs.min : (priceMin?.toString() ?? "");
  const maxInput = priceInputs.key === priceKey ? priceInputs.max : (priceMax?.toString() ?? "");
  const setMinInput = (min: string) => setPriceInputs((prev) => ({ ...prev, min }));
  const setMaxInput = (max: string) => setPriceInputs((prev) => ({ ...prev, max }));

  const currentParams = serializeCollectionParams(state);
  const isPending = state.status === "loading";
  const activeBadges = getActiveFilterBadges(filters, activeFilters);
  const hasPriceFilter = priceFilter !== undefined;
  const totalActiveCount = activeBadges.length + (hasPriceFilter ? 1 : 0);

  const applyPrice = (min: number | null, max: number | null) => {
    const next = state.filters.filter((filter) => !filter.price);
    if (min !== null || max !== null) {
      next.push({
        price: {
          ...(max !== null ? { max } : {}),
          ...(min !== null ? { min } : {}),
        },
      });
    }
    actions.setFilters(next);
  };

  return (
    <FilterSidebar>
      <div className="flex flex-col gap-5 pb-41.5">
        <FilterSidebarHeader
          activeCount={totalActiveCount > 0 ? totalActiveCount : undefined}
          onReset={totalActiveCount > 0 ? actions.reset : undefined}
          resetLabel={tSearch("reset")}
          title={tSearch("filters")}
        />

        {totalActiveCount > 0 && (
          <FilterSidebarActiveFilters>
            {activeBadges.map((badge) => {
              const filter = parseFilterInput(
                findFilterInput(filters, badge.paramKey, badge.value) ?? "",
              );
              return (
                <FilterBadge
                  key={`${badge.paramKey}-${badge.value}`}
                  href={filter ? getFilterRemovalUrl(currentParams, filter) : undefined}
                  onRemove={() => filter && actions.toggleFilter(filter)}
                  variant="primary"
                >
                  {badge.label}
                </FilterBadge>
              );
            })}
            {priceFilter && (
              <FilterBadge
                href={getFilterRemovalUrl(currentParams, { price: priceFilter })}
                onRemove={() => applyPrice(null, null)}
                variant="primary"
              >
                {formatPriceRangeLabel({
                  currencyCode: priceRange?.currencyCode,
                  labels: {
                    from: tCategory("priceRangeFrom"),
                    upTo: tCategory("priceRangeUpTo"),
                  },
                  locale,
                  max: priceMax,
                  min: priceMin,
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
                onApply={(min, max) => applyPrice(parsePriceValue(min), parsePriceValue(max))}
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
                      const isSelected = isFilterInputActive(state.filters, value.input);
                      return (
                        <Link
                          key={value.id}
                          aria-label={tSearch("selectFilterValue", {
                            name: filter.label,
                            value: value.label,
                          })}
                          aria-pressed={isSelected}
                          className="block cursor-pointer"
                          href={buildToggleHref(state, value.input)}
                          scroll={false}
                          onClick={(event) => {
                            event.preventDefault();
                            actions.toggleFilterInput(value.input);
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
                    {filter.values.map((value) => {
                      const isSelected = isFilterInputActive(state.filters, value.input);
                      return (
                        <FilterOption
                          key={value.id}
                          count={value.count}
                          href={buildToggleHref(state, value.input)}
                          label={value.label}
                          pending={isPending && isSelected}
                          selected={isSelected}
                          onClick={(event) => {
                            event.preventDefault();
                            actions.toggleFilterInput(value.input);
                          }}
                        />
                      );
                    })}
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

function buildToggleHref(
  state: Pick<CollectionState, "filters" | "reverse" | "sortKey">,
  input: string,
): string {
  const filter = parseFilterInput(input);
  if (!filter) return "?";
  const params = serializeCollectionParams(state);
  if (state.filters.some((current) => filterEquals(current, filter))) {
    return getFilterRemovalUrl(params, filter);
  }
  const next = serializeCollectionParams({ ...state, filters: [...state.filters, filter] });
  const query = next.toString();
  return query ? `?${query}` : "?";
}

function findFilterInput(filters: Filter[], key: string, value: string): string | undefined {
  return filters
    .find((filter) => filter.paramKey === key)
    ?.values.find((item) => item.value === value)?.input;
}

function formatPriceRangeLabel({
  currencyCode,
  labels,
  locale,
  max,
  min,
}: {
  currencyCode?: string;
  labels: { from: string; upTo: string };
  locale: string;
  max: number | null;
  min: number | null;
}): string {
  const format = (value: number) =>
    currencyCode
      ? formatPrice({ amount: value, currencyCode }, locale)
      : new Intl.NumberFormat(locale).format(value);
  if (min !== null && max !== null) return `${format(min)} - ${format(max)}`;
  if (min !== null) return `${labels.from} ${format(min)}`;
  return `${labels.upTo} ${format(max ?? 0)}`;
}

function parsePriceValue(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
}
