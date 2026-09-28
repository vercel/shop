import { isFilterInputActive, type ProductFilter } from "@shopify/hydrogen";

import type { ActiveFilterBadge, Filter } from "@/lib/filters/types";

export function getActiveFilterBadges(
  filters: Filter[],
  activeFilters: ProductFilter[],
): ActiveFilterBadge[] {
  const badges: ActiveFilterBadge[] = [];

  for (const filter of filters) {
    for (const value of filter.values) {
      if (!isFilterInputActive(activeFilters, value.input)) continue;
      badges.push({
        filterLabel: filter.label,
        label: value.label,
        paramKey: filter.paramKey,
        value: value.value,
      });
    }
  }

  return badges;
}
