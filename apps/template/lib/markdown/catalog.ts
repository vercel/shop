import type { Filter, PageInfo, PriceRange, ProductCard } from "@/lib/types";
import { getActiveFilterBadges } from "@/lib/shopify/transforms/filters";

import { createTable, escapeMarkdown, formatPrice } from "./utils";

const SORT_LABELS: Record<string, string> = {
  "best-matches": "Best matches",
  "price-low-to-high": "Price: low to high",
  "price-high-to-low": "Price: high to low",
  "product-name-ascending": "Product name: A to Z",
  "product-name-descending": "Product name: Z to A",
  BEST_SELLING: "Best selling",
  COLLECTION_DEFAULT: "Collection default",
  CREATED: "Newest first",
  ID: "ID",
  MANUAL: "Manual",
  PRICE: "Price",
  RELEVANCE: "Relevance",
  TITLE: "Title",
};

function getSingleValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatPriceRange(priceRange: PriceRange, locale: string, currencyCode: string): string {
  return `${formatPrice({ amount: priceRange.min.toString(), currencyCode }, locale)} - ${formatPrice(
    { amount: priceRange.max.toString(), currencyCode },
    locale,
  )}`;
}

export function formatSortLabel(sort?: string): string {
  if (!sort) return SORT_LABELS["best-matches"];
  return SORT_LABELS[sort] ?? sort;
}

export function appendAppliedFiltersSection(
  sections: string[],
  {
    activeFilters,
    filters,
  }: {
    activeFilters: Record<string, string | string[] | undefined>;
    filters: Filter[];
  },
): void {
  const appliedFilters: string[] = getActiveFilterBadges(filters, activeFilters).map(
    (badge) => `- **${escapeMarkdown(badge.filterLabel)}**: ${escapeMarkdown(badge.label)}`,
  );

  const availability = getSingleValue(activeFilters["filter.v.availability"]);
  if (availability === "1") {
    appliedFilters.push("- **Availability**: In stock");
  } else if (availability === "0") {
    appliedFilters.push("- **Availability**: Out of stock");
  }

  const minPrice = getSingleValue(activeFilters["filter.v.price.gte"]);
  const maxPrice = getSingleValue(activeFilters["filter.v.price.lte"]);
  if (minPrice || maxPrice) {
    const constraints: string[] = [];
    if (minPrice) constraints.push(`min ${escapeMarkdown(minPrice)}`);
    if (maxPrice) constraints.push(`max ${escapeMarkdown(maxPrice)}`);
    appliedFilters.push(`- **Price**: ${constraints.join(", ")}`);
  }

  if (appliedFilters.length === 0) {
    return;
  }

  sections.push("## Applied Filters");
  sections.push("");
  sections.push(...appliedFilters);
  sections.push("");
}

export function appendAvailableFiltersSection(
  sections: string[],
  {
    filters,
    priceRange,
    locale,
  }: {
    filters: Filter[];
    priceRange?: PriceRange;
    currencyCode: string;
    locale: string;
  },
): void {
  if (filters.length === 0 && !priceRange) {
    return;
  }

  sections.push("## Available Filters");
  sections.push("");

  if (priceRange) {
    sections.push(`- **Price Range**: ${formatPriceRange(priceRange, locale, currencyCode)}`);
  }

  for (const filter of filters) {
    const values = filter.values
      .slice(0, 10)
      .map((value) => `${escapeMarkdown(value.label)} (${value.count})`)
      .join(", ");

    const suffix = filter.values.length > 10 ? ", ..." : "";
    sections.push(`- **${escapeMarkdown(filter.label)}**: ${values}${suffix}`);
  }

  sections.push("");
}

export function appendPaginationSection(sections: string[], pageInfo: PageInfo): void {
  sections.push("## Pagination");
  sections.push("");
  sections.push(`- **Has Previous Page**: ${pageInfo.hasPreviousPage ? "Yes" : "No"}`);
  sections.push(`- **Has Next Page**: ${pageInfo.hasNextPage ? "Yes" : "No"}`);
  if (pageInfo.startCursor) {
    sections.push(`- **Start Cursor**: \`${pageInfo.startCursor}\``);
  }
  if (pageInfo.endCursor) {
    sections.push(`- **End Cursor**: \`${pageInfo.endCursor}\``);
  }
  sections.push("");
}

export function appendProductsSection(
  sections: string[],
  {
    products,
    locale,
  }: {
    products: ProductCard[];
    locale: string;
  },
): void {
  sections.push("## Products");
  sections.push("");

  if (products.length === 0) {
    sections.push("_No products matched the current selection._");
    sections.push("");
    return;
  }

  const headers = ["Title", "Handle", "Price", "Compare At", "Available", "Brand", "URL"];
  const rows = products.map((product) => [
    escapeMarkdown(product.title),
    escapeMarkdown(product.handle),
    formatPrice(product.price, locale),
    product.compareAtPrice ? formatPrice(product.compareAtPrice, locale) : "-",
    product.availableForSale ? "Yes" : "No",
    escapeMarkdown(product.vendor ?? "-"),
    `/products/${product.handle}`,
  ]);

  sections.push(createTable(headers, rows));
  sections.push("");
}
