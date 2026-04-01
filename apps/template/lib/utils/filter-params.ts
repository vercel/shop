import type { Filter } from "@/lib/types";

const RESERVED_PARAMS = new Set(["cursor", "sort", "page", "q", "collection"]);

export function parseFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): Record<string, string | string[] | undefined> {
  const filters: Record<string, string | string[] | undefined> = {};

  for (const [key, value] of Object.entries(searchParams)) {
    if (RESERVED_PARAMS.has(key) || value === undefined) {
      continue;
    }
    filters[key] = value;
  }

  return filters;
}

export interface ActiveFilterBadge {
  paramKey: string;
  value: string;
  label: string;
  filterLabel: string;
}

export function getActiveFilterBadges(
  filters: Filter[],
  activeFilters: Record<string, string | string[] | undefined>,
): ActiveFilterBadge[] {
  const badges: ActiveFilterBadge[] = [];

  for (const filter of filters) {
    const currentValue = activeFilters[filter.paramKey];
    if (!currentValue) continue;

    const values = Array.isArray(currentValue) ? currentValue : [currentValue];

    for (const value of values) {
      const filterValue = filter.values.find((v) => v.value === value);
      if (!filterValue) continue;

      badges.push({
        paramKey: filter.paramKey,
        value,
        label: filterValue.label,
        filterLabel: filter.label,
      });
    }
  }

  return badges;
}
