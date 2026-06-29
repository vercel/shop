import type {
  Filter,
  FilterPresentation,
  FilterType,
  FilterValue,
  OptionValueSwatch,
  PriceRange,
} from "@/lib/types";

import type {
  ProductFilter,
  ShopifyFilter,
  ShopifyFilterPresentation,
  ShopifyFilterType,
  ShopifyFilterValue,
} from "../types/filters";

export interface TransformFiltersOptions {
  hideZeroCount?: boolean;
  activeFilters?: Record<string, string | string[] | undefined>;
}

export interface TransformedFilters {
  filters: Filter[];
  priceRange?: PriceRange;
}

export interface ActiveFilterBadge {
  paramKey: string;
  value: string;
  label: string;
  filterLabel: string;
}

export function getParamKeyFromShopifyId(filterId: string): string {
  // Shopify filter IDs already use the standard format (e.g. "filter.v.option.color",
  // "filter.p.vendor", "filter.v.availability"). Return them as-is for URL params.
  return filterId.toLowerCase();
}

function parseShopifyFilterValue(inputJson: string): string | null {
  try {
    const input = JSON.parse(inputJson) as ProductFilter;
    if (input.variantOption) return input.variantOption.value;
    if (input.productVendor) return input.productVendor;
    if (input.productType) return input.productType;
    if (input.available !== undefined) {
      return input.available ? "1" : "0";
    }
    if (input.tag) return input.tag;
    if (input.productMetafield) return input.productMetafield.value;
    if (input.taxonomyMetafield) return input.taxonomyMetafield.value;
    return null;
  } catch {
    return null;
  }
}

function mapShopifyFilterType(type: ShopifyFilterType): FilterType {
  switch (type) {
    case "PRICE_RANGE":
      return "price";
    case "BOOLEAN":
      return "boolean";
    default:
      return "list";
  }
}

function mapShopifyFilterPresentation(
  presentation: ShopifyFilterPresentation | null | undefined,
): FilterPresentation | undefined {
  switch (presentation) {
    case "IMAGE":
      return "image";
    case "SWATCH":
      return "swatch";
    case "TEXT":
      return "text";
    default:
      return undefined;
  }
}

function transformFilterSwatch(
  swatch: ShopifyFilterValue["swatch"],
): OptionValueSwatch | undefined {
  if (!swatch) return undefined;
  const result: OptionValueSwatch = {};
  if (swatch.color) result.color = swatch.color;
  if (swatch.image?.previewImage?.url) result.image = swatch.image.previewImage.url;
  if (!result.color && !result.image) return undefined;
  return result;
}

function transformFilterValue(value: ShopifyFilterValue): FilterValue | null {
  const parsedValue = parseShopifyFilterValue(value.input);
  if (!parsedValue) return null;

  const swatch = transformFilterSwatch(value.swatch);

  return {
    count: value.count,
    id: value.id,
    label: value.label,
    ...(swatch ? { swatch } : {}),
    value: parsedValue,
  };
}

function transformFilter(filter: ShopifyFilter): Filter {
  const values = filter.values
    .map(transformFilterValue)
    .filter((v): v is FilterValue => v !== null);

  const presentation = mapShopifyFilterPresentation(filter.presentation);

  return {
    id: filter.id,
    label: filter.label,
    paramKey: getParamKeyFromShopifyId(filter.id),
    ...(presentation ? { presentation } : {}),
    type: mapShopifyFilterType(filter.type),
    values,
  };
}

function extractPriceRange(priceFilter: ShopifyFilter): PriceRange {
  for (const value of priceFilter.values) {
    try {
      const input = JSON.parse(value.input) as ProductFilter;
      if (input.price) {
        return {
          min: input.price.min ?? 0,
          max: input.price.max ?? 1000,
        };
      }
    } catch {
      // Ignore malformed filter input.
    }
  }

  return { min: 0, max: 1000 };
}

function isFilterValueSelected(
  activeFilters: Record<string, string | string[] | undefined>,
  paramKey: string,
  value: string,
): boolean {
  const current = activeFilters[paramKey];
  return Array.isArray(current) ? current.includes(value) : current === value;
}

export function transformShopifyFilters(
  shopifyFilters: ShopifyFilter[],
  options: TransformFiltersOptions = {},
): TransformedFilters {
  const { hideZeroCount = true, activeFilters = {} } = options;

  const priceFilter = shopifyFilters.find((f) => f.type === "PRICE_RANGE");
  const listFilters = shopifyFilters.filter((f) => f.type === "LIST");

  let filters = listFilters
    .map(transformFilter)
    .filter(
      (filter) => !filter.paramKey.includes("category") && !filter.paramKey.includes("price"),
    );

  if (hideZeroCount) {
    filters = filters
      .map((filter) => ({
        ...filter,
        values: filter.values.filter(
          (value) =>
            value.count > 0 || isFilterValueSelected(activeFilters, filter.paramKey, value.value),
        ),
      }))
      .filter((filter) => filter.values.length > 0);
  }

  // Drop facet groups that resolve to a single choice — unless that lone value is
  // active, so a selected filter never silently vanishes from the UI.
  filters = filters.filter(
    (filter) =>
      filter.values.length > 1 ||
      filter.values.some((value) =>
        isFilterValueSelected(activeFilters, filter.paramKey, value.value),
      ),
  );

  return {
    filters,
    priceRange: priceFilter ? extractPriceRange(priceFilter) : undefined,
  };
}

export function getActiveFilterBadges(
  filters: Filter[],
  activeFilters: Record<string, string | string[] | undefined>,
): ActiveFilterBadge[] {
  const badges: ActiveFilterBadge[] = [];

  for (const filter of filters) {
    const currentValue = activeFilters[filter.paramKey];
    if (!currentValue) continue;

    const values = Array.isArray(currentValue) ? currentValue : [currentValue];

    for (const value of values) {
      const filterValue = filter.values.find((v) => v.value === value);
      if (!filterValue) continue;

      badges.push({
        paramKey: filter.paramKey,
        value,
        label: filterValue.label,
        filterLabel: filter.label,
      });
    }
  }

  return badges;
}
