import type { ProductFilter } from "@shopify/hydrogen";

import type { CommerceLocale } from "@/lib/config/types";
import type { Facets } from "@/lib/filters/types";
import type { ProductPage } from "@/lib/product/types";

export type SearchIndexProductsParams = {
  collection?: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: CommerceLocale;
  query?: string;
  sortKey?: string;
};

export type CollectionProductsParams = {
  collection: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: CommerceLocale;
  sortKey?: string;
};

export interface CollectionProductsResult extends ProductPage {
  facets: Facets;
}

export type ProductOptionValues = Map<string, Map<string, Set<string>>>;

export type SearchFacetsParams = {
  collection?: string;
  filters?: ProductFilter[];
  locale?: CommerceLocale;
  query?: string;
};

export type SearchFacetsResult = { facets: Facets; total: number };
