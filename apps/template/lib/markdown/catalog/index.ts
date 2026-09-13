import { formatMoney } from "@shopify/hydrogen";
import type { ProductFilter } from "@shopify/hydrogen";

import type { Filter, PriceRange } from "@/lib/filters/types";
import { createTable, escapeMarkdown } from "@/lib/markdown";
import type { PageInfo } from "@/lib/pagination/types";
import type { ProductCard } from "@/lib/product/types";
import { getActiveFilterBadges } from "@/lib/shopify/transforms/filters";

// Keys are Shopify `sort_by` parameters.
const SORT_LABELS: Record<string, string> = {
  "best-selling": "Best selling",
  "created-ascending": "Date: old to new",
  "created-descending": "Date: new to old",
  "price-ascending": "Price: low to high",
  "price-descending": "Price: high to low",
  "title-ascending": "Product name: A to Z",
  "title-descending": "Product name: Z to A",
  manual: "Best matches",
  relevance: "Best matches",
};

function formatPriceRange(priceRange: PriceRange, locale: string): string {
  if (!priceRange.currencyCode) {
    const formatter = new Intl.NumberFormat(locale);
    return `${formatter.format(priceRange.min)} - ${formatter.format(priceRange.max)}`;
  }

  return `${
    formatMoney(
      { amount: priceRange.min.toString(), currencyCode: priceRange.currencyCode },
      { locale },
    ).localizedString
  } - ${
    formatMoney(
      { amount: priceRange.max.toString(), currencyCode: priceRange.currencyCode },
      { locale },
    ).localizedString
  }`;
}

export function formatSortLabel(sort?: string): string {
  if (!sort) return SORT_LABELS.manual;
  return SORT_LABELS[sort] ?? sort;
}

export function appendAppliedFiltersSection(
  sections: string[],
  {
    activeFilters,
    filters,
  }: {
    activeFilters: ProductFilter[];
    filters: Filter[];
  },
): void {
  const appliedFilters: string[] = getActiveFilterBadges(filters, activeFilters).map(
    (badge) => `- **${escapeMarkdown(badge.filterLabel)}**: ${escapeMarkdown(badge.label)}`,
  );

  const availability = activeFilters.find((filter) => filter.available !== undefined)?.available;
  if (availability === true) {
    appliedFilters.push("- **Availability**: In stock");
  } else if (availability === false) {
    appliedFilters.push("- **Availability**: Out of stock");
  }

  const price = activeFilters.find((filter) => filter.price)?.price;
  if (price && (price.min !== undefined || price.max !== undefined)) {
    const constraints: string[] = [];
    if (price.min !== undefined) constraints.push(`min ${price.min}`);
    if (price.max !== undefined) constraints.push(`max ${price.max}`);
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
    locale: string;
  },
): void {
  if (filters.length === 0 && !priceRange) {
    return;
  }

  sections.push("## Available Filters");
  sections.push("");

  if (priceRange) {
    sections.push(`- **Price Range**: ${formatPriceRange(priceRange, locale)}`);
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
    formatMoney(product.price, { locale }).localizedString,
    product.compareAtPrice ? formatMoney(product.compareAtPrice, { locale }).localizedString : "-",
    product.availableForSale ? "Yes" : "No",
    escapeMarkdown(product.vendor ?? "-"),
    `/products/${product.handle}`,
  ]);

  sections.push(createTable(headers, rows));
  sections.push("");
}
