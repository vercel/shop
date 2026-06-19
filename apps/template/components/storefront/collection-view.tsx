import type { CollectionResultsData, CollectionSearchState } from "@/lib/collections/server";
import type { Locale } from "@/lib/i18n";
import type { Collection } from "@/lib/types";

import { StorefrontCanvas } from "./canvas";

interface CollectionViewProps {
  collection: Collection;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
  locale: Locale;
  searchStatePromise: Promise<CollectionSearchState>;
  sortExclude?: string[];
}

export async function CollectionView({
  collection,
  collectionResultsDataPromise,
  locale,
  searchStatePromise,
  sortExclude = [],
}: CollectionViewProps) {
  const [data, searchState] = await Promise.all([collectionResultsDataPromise, searchStatePromise]);

  return (
    <StorefrontCanvas
      route="collection"
      data-active-filter-count={Object.keys(searchState.activeFilters).length}
      data-handle={collection.handle}
      data-locale={locale}
      data-product-count={data.result.products.length}
      data-sort-exclude={sortExclude.join(",")}
    />
  );
}

export function CollectionViewFallback({ handle, locale }: { handle: string; locale: Locale }) {
  return (
    <StorefrontCanvas route="collection" data-handle={handle} data-locale={locale} data-loading />
  );
}
