export function searchParamsToRecord(
  searchParams: URLSearchParams,
): Record<string, string | string[] | undefined> {
  const record: Record<string, string | string[] | undefined> = {};

  for (const key of new Set(searchParams.keys())) {
    const values = searchParams.getAll(key);

    if (values.length === 0) {
      continue;
    }

    record[key] = values.length === 1 ? values[0] : values;
  }

  return record;
}
