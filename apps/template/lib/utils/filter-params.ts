export function parseFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): Record<string, string | string[] | undefined> {
  const filters: Record<string, string | string[] | undefined> = {};

  for (const [key, value] of Object.entries(searchParams)) {
    if (!key.startsWith("filter.") || value === undefined) {
      continue;
    }
    filters[key] = value;
  }

  return filters;
}
