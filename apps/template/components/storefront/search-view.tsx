import type { Locale } from "@/lib/i18n";
import type { SearchResultsData } from "@/lib/search/server";

import { StorefrontCanvas } from "./canvas";

interface SearchViewProps {
  locale: Locale;
  searchResultsDataPromise: Promise<SearchResultsData>;
}

export async function SearchView({ locale, searchResultsDataPromise }: SearchViewProps) {
  const data = await searchResultsDataPromise;

  return (
    <StorefrontCanvas
      route="search"
      data-active-filter-count={Object.keys(data.activeFilters).length}
      data-locale={locale}
      data-product-count={data.products.length}
      data-query={data.query}
      data-total={data.total}
    />
  );
}

export function SearchViewFallback({ locale }: { locale: Locale }) {
  return <StorefrontCanvas route="search" data-locale={locale} data-loading />;
}
