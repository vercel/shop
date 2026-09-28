"use client";

import {
  type CollectionState,
  filterEquals,
  getFilterRemovalUrl,
  isFilterInputActive,
  serializeCollectionParams,
} from "@shopify/hydrogen";
import { useCollection, useCollectionActions } from "@shopify/hydrogen/react";
import { CheckIcon, LoaderCircleIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { type MouseEventHandler, type ReactElement, type ReactNode, useState } from "react";

import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Swatch } from "@/components/ui/swatch";
import { parseFilterInput } from "@/lib/collections";
import { shopConfig } from "@/lib/config";
import { getActiveFilterBadges } from "@/lib/filters";
import type { Filter, PriceRange } from "@/lib/filters/types";
import { formatCurrencySymbol, formatPrice } from "@/lib/money";

interface FilterSheetProps {
  children: ReactNode;
  label: string;
  trigger: ReactElement;
}

export function FilterSheet({ children, label, trigger }: FilterSheetProps) {
  return (
    <Sheet>
      <SheetTrigger render={trigger} />
      <SheetContent side="left" className="gap-0 overflow-y-auto px-5 pb-5">
        <div className="flex h-16 shrink-0 items-center gap-2">
          <SheetTitle className="text-lg font-semibold">{label}</SheetTitle>
        </div>
        {children}
      </SheetContent>
    </Sheet>
  );
}

interface CollectionFilterSidebarProps {
  filters: Filter[];
  priceRange?: PriceRange;
}

export function CollectionFilterSidebar({ filters, priceRange }: CollectionFilterSidebarProps) {
  const state = useCollection();
  const actions = useCollectionActions();
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
  const currentParams = serializeCollectionParams(state);
  const isPending = state.status === "loading";
  const activeBadges = getActiveFilterBadges(filters, state.filters);
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
    <div className="flex flex-col gap-5">
      {activeBadges.length > 0 || priceFilter ? (
        <div className="flex flex-wrap gap-1.5">
          {activeBadges.map((badge) => {
            const filter = parseFilterInput(
              findFilterInput(filters, badge.paramKey, badge.value) ?? "",
            );
            return (
              <FilterBadge
                key={`${badge.paramKey}-${badge.value}`}
                href={filter ? getFilterRemovalUrl(currentParams, filter) : undefined}
                onRemove={() => filter && actions.toggleFilter(filter)}
              >
                {badge.label}
              </FilterBadge>
            );
          })}
          {priceFilter ? (
            <FilterBadge
              href={getFilterRemovalUrl(currentParams, { price: priceFilter })}
              onRemove={() => applyPrice(null, null)}
            >
              {formatPriceRangeLabel(priceMin, priceMax, priceRange?.currencyCode)}
            </FilterBadge>
          ) : null}
        </div>
      ) : null}

      {priceRange ? (
        <FilterSection title="Price">
          <div className="flex items-center gap-2">
            <PriceInput
              currencyCode={priceRange.currencyCode}
              onChange={(min) => setPriceInputs((prev) => ({ ...prev, min }))}
              placeholder="From"
              value={minInput}
            />
            <span className="text-muted-foreground">–</span>
            <PriceInput
              currencyCode={priceRange.currencyCode}
              onChange={(max) => setPriceInputs((prev) => ({ ...prev, max }))}
              placeholder="To"
              value={maxInput}
            />
            <button
              aria-label="Apply price"
              className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={() => applyPrice(parsePriceValue(minInput), parsePriceValue(maxInput))}
              type="button"
            >
              <CheckIcon className="size-4" />
            </button>
          </div>
        </FilterSection>
      ) : null}

      {filters.map((filter) =>
        filter.values.length === 0 ? null : (
          <FilterSection key={filter.id} title={filter.label}>
            {filter.presentation === "swatch" ? (
              <div className="flex flex-wrap gap-2.5">
                {filter.values.map((value) => {
                  const isSelected = isFilterInputActive(state.filters, value.input);
                  return (
                    <Link
                      key={value.id}
                      aria-label={`Filter by ${filter.label}: ${value.label}`}
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
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
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
              </div>
            )}
          </FilterSection>
        ),
      )}
    </div>
  );
}

interface FilterSectionProps {
  children: ReactNode;
  title: string;
}

function FilterSection({ children, title }: FilterSectionProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="text-base font-semibold text-muted-foreground">{title}</span>
      {children}
    </div>
  );
}

interface FilterBadgeProps {
  children: ReactNode;
  href?: string;
  onRemove: () => void;
}

function FilterBadge({ children, href, onRemove }: FilterBadgeProps) {
  const className =
    "inline-flex cursor-pointer items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/25";
  const content = (
    <>
      {children}
      <XIcon className="size-3" />
    </>
  );
  if (!href) {
    return (
      <button className={className} onClick={onRemove} type="button">
        {content}
      </button>
    );
  }
  return (
    <Link
      className={className}
      href={href}
      scroll={false}
      onClick={(event) => {
        event.preventDefault();
        onRemove();
      }}
    >
      {content}
    </Link>
  );
}

interface FilterOptionProps {
  count?: number;
  href: string;
  label: string;
  onClick: MouseEventHandler<HTMLAnchorElement>;
  pending: boolean;
  selected: boolean;
}

function FilterOption({ count, href, label, onClick, pending, selected }: FilterOptionProps) {
  return (
    <Link
      href={href}
      data-selected={selected}
      className="flex items-center justify-between text-left text-sm text-muted-foreground transition-colors hover:text-foreground data-[selected=true]:font-medium"
      onClick={onClick}
    >
      <span>
        {label}
        {count !== undefined && <span className="text-muted-foreground"> ({count})</span>}
      </span>
      {pending || selected ? (
        <span className="flex size-3.5 shrink-0 items-center justify-center overflow-hidden">
          {pending ? (
            <LoaderCircleIcon className="size-3.5 animate-spin text-muted-foreground" />
          ) : (
            <CheckIcon className="size-3.5 text-muted-foreground" />
          )}
        </span>
      ) : null}
    </Link>
  );
}

interface PriceInputProps {
  currencyCode?: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}

function PriceInput({ currencyCode, onChange, placeholder, value }: PriceInputProps) {
  return (
    <div className="flex h-8 flex-1 items-center rounded-lg bg-input px-2.5">
      <span className="text-base text-muted-foreground md:text-sm">
        {currencyCode ? formatCurrencySymbol(currencyCode) : null}
      </span>
      <Input
        type="number"
        step="0.01"
        min="0"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-auto border-0 bg-transparent px-1 shadow-none outline-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
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

function formatPriceRangeLabel(
  min: number | null,
  max: number | null,
  currencyCode: string | undefined,
): string {
  const format = (value: number) =>
    currencyCode
      ? formatPrice({ amount: String(value), currencyCode })
      : new Intl.NumberFormat(shopConfig.localization.locale).format(value);
  if (min !== null && max !== null) return `${format(min)} - ${format(max)}`;
  if (min !== null) return `From ${format(min)}`;
  return `Up to ${format(max ?? 0)}`;
}

function parsePriceValue(value: string): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) || parsed < 0 ? null : parsed;
}
