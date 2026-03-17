import { CollectionFilters } from "./filters";
import type { CollectionResultsData } from "./data";
import { CollectionResultsGrid } from "./results-grid";
import { FilterPendingScope } from "./filter-pending-context";
import type { Locale } from "@/lib/i18n";

export function CollectionResultsSection({
  locale,
  collectionResultsDataPromise,
}: {
  locale: Locale;
  collectionResultsDataPromise: Promise<CollectionResultsData>;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="hidden md:block w-64 shrink-0">
        <FilterPendingScope>
          <CollectionFilters
            collectionResultsDataPromise={collectionResultsDataPromise}
          />
        </FilterPendingScope>
      </aside>

      <div className="flex-1">
        <FilterPendingScope>
          <CollectionResultsGrid
            locale={locale}
            collectionResultsDataPromise={collectionResultsDataPromise}
          />
        </FilterPendingScope>
      </div>
    </div>
  );
}
