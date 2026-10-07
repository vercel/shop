import { isFilterInputActive, type ProductFilter } from "@shopify/hydrogen";

import type {
  Facets,
  Filter,
  FilterPresentation,
  FilterType,
  FilterValue,
  PriceRange,
} from "@/lib/filters/types";
import type { OptionValueSwatch } from "@/lib/product/types";
import type {
  ShopifyFilter,
  ShopifyFilterPresentation,
  ShopifyFilterType,
  ShopifyFilterValue,
  TransformFiltersOptions,
} from "@/lib/shopify/transforms/filters/types";

function isColorKey(value: string): boolean {
  return value.toLowerCase().includes("colo");
}

export function getSelectedColorFilterLabel(
  filters: ProductFilter[],
  shopifyFilters: Array<{
    values: Array<Pick<ShopifyFilterValue, "input" | "label">>;
  }>,
): string | undefined {
  const selectedValues = new Set(
    filters.flatMap((filter) => {
      if (filter.variantOption && isColorKey(filter.variantOption.name)) {
        return [filter.variantOption.value];
      }
      if (filter.taxonomyMetafield && isColorKey(filter.taxonomyMetafield.key)) {
        return [filter.taxonomyMetafield.value];
      }
      return [];
    }),
  );

  if (selectedValues.size !== 1) return undefined;
  const selectedValue = selectedValues.values().next().value;
  if (!selectedValue) return undefined;

  for (const filter of shopifyFilters) {
    for (const value of filter.values) {
      if (parseShopifyFilterValue(value.input) === selectedValue) return value.label;
    }
  }

  return selectedValue;
}

function getParamKeyFromShopifyId(filterId: string): string {
  return filterId.toLowerCase();
}

// Hydrogen's ProductFilter folds the taxonomy namespace into `key`; Shopify's filter input keeps them apart.
function normalizeShopifyFilterInput(inputJson: string): string {
  try {
    const input = JSON.parse(inputJson) as {
      taxonomyMetafield?: { key: string; namespace?: string; value: string };
    };
    if (input.taxonomyMetafield?.namespace) {
      return JSON.stringify({
        taxonomyMetafield: {
          key: `${input.taxonomyMetafield.namespace}.${input.taxonomyMetafield.key}`,
          value: input.taxonomyMetafield.value,
        },
      });
    }
    return inputJson;
  } catch {
    return inputJson;
  }
}

function parseShopifyFilterValue(inputJson: string): string | null {
  try {
    const input = JSON.parse(inputJson) as ProductFilter;
    if (input.variantOption) return input.variantOption.value ?? null;
    if (input.productVendor) return input.productVendor;
    if (input.productType) return input.productType;
    if (input.available !== undefined) {
      return input.available ? "1" : "0";
    }
    if (input.tag) return input.tag;
    if (input.productMetafield) return input.productMetafield.value ?? null;
    if (input.taxonomyMetafield) return input.taxonomyMetafield.value ?? null;
    return null;
  } catch {
    return null;
  }
}

function parseAvailable(inputJson: string): boolean | undefined {
  try {
    return (JSON.parse(inputJson) as ProductFilter).available;
  } catch {
    return undefined;
  }
}

function isAvailabilityFilter(filter: Filter): boolean {
  return filter.values.some((value) => parseAvailable(value.input) !== undefined);
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
    input: normalizeShopifyFilterInput(value.input),
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

function extractPriceRange(priceFilter: ShopifyFilter, currencyCode?: string): PriceRange {
  for (const value of priceFilter.values) {
    try {
      const input = JSON.parse(value.input) as ProductFilter;
      if (input.price) {
        return {
          ...(currencyCode ? { currencyCode } : {}),
          max: input.price.max ?? 1000,
          min: input.price.min ?? 0,
        };
      }
    } catch {}
  }

  return { ...(currencyCode ? { currencyCode } : {}), max: 1000, min: 0 };
}

function pruneEmptyValues(filter: Filter, activeFilters: ProductFilter[]): Filter {
  return {
    ...filter,
    values: filter.values.filter(
      (value) => (value.count ?? 0) > 0 || isFilterInputActive(activeFilters, value.input),
    ),
  };
}

// Shoppers filter for what they can buy, never for what they cannot, so only the in-stock value
// is offered. Its count is dropped because Shopify reports 0 for it under a market context even
// when the same filter returns products.
function toInStockFilter(filter: Filter): Filter {
  return {
    ...filter,
    values: filter.values
      .filter((value) => parseAvailable(value.input) === true)
      .map(({ count: _count, ...value }) => value),
  };
}

export function transformShopifyFilters(
  shopifyFilters: ShopifyFilter[],
  options: TransformFiltersOptions = {},
): Facets {
  const { activeFilters = [], currencyCode } = options;

  const priceFilter = shopifyFilters.find((f) => f.type === "PRICE_RANGE");
  const selectableFilters = shopifyFilters.filter((f) => f.type === "LIST" || f.type === "BOOLEAN");

  let filters = selectableFilters
    .map(transformFilter)
    .filter((filter) => !filter.paramKey.includes("category") && !filter.paramKey.includes("price"))
    .map((filter) =>
      isAvailabilityFilter(filter)
        ? toInStockFilter(filter)
        : pruneEmptyValues(filter, activeFilters),
    )
    .filter((filter) => filter.values.length > 0);

  // Keep an active singleton facet so the shopper can still clear it.
  filters = filters.filter(
    (filter) =>
      filter.values.length > 1 ||
      isAvailabilityFilter(filter) ||
      filter.values.some((value) => isFilterInputActive(activeFilters, value.input)),
  );

  return {
    filters,
    priceRange: priceFilter ? extractPriceRange(priceFilter, currencyCode) : undefined,
  };
}
