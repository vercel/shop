import type { Collection, Filter, PageInfo, PriceRange, ProductCard } from "@/lib/types";

import {
  appendAppliedFiltersSection,
  appendAvailableFiltersSection,
  appendPaginationSection,
  appendProductsSection,
  formatSortLabel,
} from "./catalog";
import { escapeMarkdown } from "./utils";

export function collectionToMarkdown({
  collection,
  products,
  filters,
  priceRange,
  currencyCode,
  activeFilters,
  pageInfo,
  locale,
  sort,
}: {
  collection: Collection;
  products: ProductCard[];
  filters: Filter[];
  priceRange?: PriceRange;
  currencyCode: string;
  activeFilters: Record<string, string | string[] | undefined>;
  pageInfo: PageInfo;
  locale: string;
  sort?: string;
}): string {
  const sections: string[] = [];

  sections.push(`# ${escapeMarkdown(collection.title)}`);
  sections.push("");

  sections.push("## Collection Information");
  sections.push("");
  sections.push(`- **Handle**: ${collection.handle}`);
  sections.push(`- **Path**: ${collection.path}`);
  sections.push(`- **Sort**: ${escapeMarkdown(formatSortLabel(sort))}`);
  sections.push(`- **Products In This Page**: ${products.length}`);
  sections.push(`- **Has More Results**: ${pageInfo.hasNextPage ? "Yes" : "No"}`);
  sections.push("");

  if (collection.description) {
    sections.push("## Description");
    sections.push("");
    sections.push(escapeMarkdown(collection.description));
    sections.push("");
  }

  appendAppliedFiltersSection(sections, { activeFilters, filters });
  appendAvailableFiltersSection(sections, { filters, priceRange, currencyCode, locale });
  appendProductsSection(sections, { products, locale });
  appendPaginationSection(sections, pageInfo);

  if (collection.image?.url) {
    sections.push("## Image");
    sections.push("");
    sections.push(`- ${collection.image.url}`);
    sections.push("");
  }

  if (collection.seo.title || collection.seo.description) {
    sections.push("## SEO");
    sections.push("");
    if (collection.seo.title) {
      sections.push(`- **Title**: ${escapeMarkdown(collection.seo.title)}`);
    }
    if (collection.seo.description) {
      sections.push(`- **Description**: ${escapeMarkdown(collection.seo.description)}`);
    }
    sections.push("");
  }

  sections.push("---");
  sections.push("");
  sections.push(`*Last updated: ${collection.updatedAt}*`);
  sections.push(`*Locale: ${locale}*`);

  return sections.join("\n");
}
