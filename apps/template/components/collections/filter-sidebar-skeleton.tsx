import { FilterSidebar, FilterSidebarScrollFade } from "@/components/ui/filter-sidebar";
import { Skeleton } from "@/components/ui/skeleton";

const FILTER_SECTION_SKELETON_KEYS = Array.from(
  { length: 3 },
  (_, index) => `collection-filter-section-skeleton-${index}`,
);
const FILTER_OPTION_SKELETON_KEYS = Array.from(
  { length: 4 },
  (_, index) => `collection-filter-option-skeleton-${index}`,
);

export function CollectionFilterSidebarSkeleton() {
  return (
    <FilterSidebar>
      <div className="flex flex-col gap-10 pb-[166px]">
        <Skeleton className="h-8 w-28" />
        {FILTER_SECTION_SKELETON_KEYS.map((sectionKey) => (
          <div key={sectionKey} className="space-y-5">
            <Skeleton className="h-6 w-24" />
            <div className="space-y-2.5">
              {FILTER_OPTION_SKELETON_KEYS.map((optionKey) => (
                <Skeleton key={`${sectionKey}-${optionKey}`} className="h-5 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <FilterSidebarScrollFade />
    </FilterSidebar>
  );
}
