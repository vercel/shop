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
