"use server";

import { commerce } from "@/lib/commerce";

const { predictiveSearch } = commerce.search;
import type { PredictiveSearchResult } from "@/lib/types";

export async function predictiveSearchAction(
  query: string,
  locale: string,
): Promise<PredictiveSearchResult> {
  if (!query.trim()) {
    return { products: [], collections: [], queries: [] };
  }

  return predictiveSearch(query.trim(), locale, 4);
}
