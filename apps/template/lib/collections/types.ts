import type { fetchCollectionProducts } from "@/lib/shopify/operations/products/server";
import type { ProductFilter } from "@/lib/shopify/transforms/filters/types";
import type { Filter, PriceRange } from "@/lib/types";

export type ActiveFilters = Record<string, string | string[] | undefined>;

export interface BrowseParams {
  activeFilters: ActiveFilters;
  filters: ProductFilter[];
  sort?: string;
}

export interface CollectionSearchState extends BrowseParams {
  dataSearch: string;
}

export interface CollectionResultsData extends BrowseParams {
  collection: string;
  dataSearch: string;
  result: Awaited<ReturnType<typeof fetchCollectionProducts>>;
  transformedFilters: { filters: Filter[]; priceRange?: PriceRange };
}
