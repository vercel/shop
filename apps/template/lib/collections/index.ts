import { parseCollectionParams, serializeCollectionParams } from "@shopify/hydrogen";

const LEGACY_TO_SORT_BY: Record<string, string> = {
  "best-selling": "best-selling",
  "date-new-to-old": "created-descending",
  "date-old-to-new": "created-ascending",
  "price-high-to-low": "price-descending",
  "price-low-to-high": "price-ascending",
  "product-name-ascending": "title-ascending",
  "product-name-descending": "title-descending",
};

const SORT_BY_TO_LEGACY: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(LEGACY_TO_SORT_BY).map(([legacy, sortBy]) => [sortBy, legacy]),
  ),
  manual: "best-matches",
};

export function normalizeCollectionBrowseParams(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): URLSearchParams {
  const source = input instanceof URLSearchParams ? input : recordToSearchParams(input);
  const normalized = new URLSearchParams();

  for (const [key, value] of source) {
    if (key === "sort") continue;
    if (key.startsWith("filter.") && key !== "filter.v.price.gte" && key !== "filter.v.price.lte") {
      for (const item of value
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean)) {
        normalized.append(key, item);
      }
      continue;
    }
    normalized.append(key, value);
  }

  if (!normalized.has("sort_by")) {
    const legacySort = source.get("sort");
    const sortBy = legacySort ? LEGACY_TO_SORT_BY[legacySort] : undefined;
    if (sortBy) normalized.set("sort_by", sortBy);
  }

  return serializeCollectionParams(parseCollectionParams(normalized));
}

export function getLegacyCollectionSort(params: URLSearchParams): string | undefined {
  const sortBy = params.get("sort_by");
  return sortBy ? SORT_BY_TO_LEGACY[sortBy] : undefined;
}

export function getCollectionSortByValue(legacySort: string): string | undefined {
  return LEGACY_TO_SORT_BY[legacySort];
}

export function getLegacySortFromCollectionState(
  sortKey: string | undefined,
  reverse: boolean,
): string {
  if (!sortKey || sortKey === "COLLECTION_DEFAULT") return "best-matches";
  const base =
    sortKey === "BEST_SELLING"
      ? "best-selling"
      : sortKey === "CREATED"
        ? "created"
        : sortKey === "PRICE"
          ? "price"
          : sortKey === "TITLE"
            ? "title"
            : undefined;
  if (!base) return "best-matches";
  const sortBy = ["created", "price", "title"].includes(base)
    ? `${base}-${reverse ? "descending" : "ascending"}`
    : base;
  return SORT_BY_TO_LEGACY[sortBy] ?? "best-matches";
}

function recordToSearchParams(
  record: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}
