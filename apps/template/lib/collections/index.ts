import type { ProductCollectionSortKeys } from "@shopify/hydrogen";

const SORT_TO_SORT_BY: Record<string, string> = {
  "best-selling": "best-selling",
  "date-new-to-old": "created-descending",
  "date-old-to-new": "created-ascending",
  "price-high-to-low": "price-descending",
  "price-low-to-high": "price-ascending",
  "product-name-ascending": "title-ascending",
  "product-name-descending": "title-descending",
};

const SORT_BY_TO_SORT: Record<string, string> = {
  ...Object.fromEntries(Object.entries(SORT_TO_SORT_BY).map(([sort, sortBy]) => [sortBy, sort])),
  manual: "best-matches",
};

export function getCollectionSortByValue(sort: string): string | undefined {
  return SORT_TO_SORT_BY[sort];
}

export function getCollectionSortFromState(
  sortKey: ProductCollectionSortKeys | undefined,
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
  return SORT_BY_TO_SORT[sortBy] ?? "best-matches";
}
