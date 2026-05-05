import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currencyCode: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

// Price keys are scalar (gte/lte) — buildProductFiltersFromParams' parsePrice
// bails on arrays, so don't comma-split them.
const PRICE_FILTER_KEYS = new Set(["filter.v.price.gte", "filter.v.price.lte"]);

export function parseFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): Record<string, string | string[] | undefined> {
  const filters: Record<string, string | string[] | undefined> = {};

  for (const [key, value] of Object.entries(searchParams)) {
    if (!key.startsWith("filter.") || value === undefined) {
      continue;
    }
    if (PRICE_FILTER_KEYS.has(key)) {
      filters[key] = value;
      continue;
    }
    const raw = Array.isArray(value) ? value : [value];
    const split = raw
      .flatMap((v) => v.split(","))
      .map((v) => v.trim())
      .filter(Boolean);
    const deduped = [...new Set(split)];
    if (deduped.length === 0) continue;
    filters[key] = deduped.length === 1 ? deduped[0] : deduped;
  }

  return filters;
}

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

export const RESULTS_PER_PAGE = 24;
