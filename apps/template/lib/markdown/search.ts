import type { Filter, PageInfo, PriceRange, ProductCard } from "@/lib/types";

import {
  appendAppliedFiltersSection,
  appendAvailableFiltersSection,
  appendPaginationSection,
  appendProductsSection,
  formatSortLabel,
} from "./catalog";
import { escapeMarkdown } from "./utils";

export function searchResultsToMarkdown({
  query,
  collection,
  products,
  total,
  filters,
  priceRange,
  currencyCode,
  activeFilters,
  pageInfo,
  locale,
  sort,
}: {
  query?: string;
  collection?: string;
  products: ProductCard[];
  total: number;
  filters: Filter[];
  priceRange?: PriceRange;
  currencyCode: string;
  activeFilters: Record<string, string | string[] | undefined>;
  pageInfo: PageInfo;
  locale: string;
  sort?: string;
}): string {
  const sections: string[] = [];

  const title = query ? `Search Results for "${escapeMarkdown(query)}"` : "Search Results";
  sections.push(`# ${title}`);
  sections.push("");

  sections.push("## Search Information");
  sections.push("");
  sections.push(`- **Query**: ${query ? escapeMarkdown(query) : "None"}`);
  if (collection) {
    sections.push(`- **Collection Filter**: ${escapeMarkdown(collection)}`);
  }
  sections.push(`- **Sort**: ${escapeMarkdown(formatSortLabel(sort))}`);
  sections.push(`- **Total Matching Products**: ${total}`);
  sections.push(`- **Products In This Page**: ${products.length}`);
  sections.push("");

  appendAppliedFiltersSection(sections, { activeFilters, filters });
  appendAvailableFiltersSection(sections, { filters, priceRange, currencyCode, locale });
  appendProductsSection(sections, { products, locale });
  appendPaginationSection(sections, pageInfo);

  sections.push("---");
  sections.push("");
  sections.push(`*Locale: ${locale}*`);

  return sections.join("\n");
}
