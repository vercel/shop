import type { Filter, PageInfo, PriceRange, ProductCard } from "@/lib/types";

export interface SearchResultsData {
  collection?: string;
  dataSearch: string;
  pageInfo: PageInfo;
  products: ProductCard[];
  query?: string;
  total: number;
  transformedFilters: { filters: Filter[]; priceRange?: PriceRange };
}
