import type { Filter, PriceRange } from "@/lib/filters/types";
import type { Image } from "@/lib/media/types";
import type { Money } from "@/lib/money/types";
import type { PageInfo } from "@/lib/pagination/types";
import type { ProductCard } from "@/lib/product/types";

export interface SearchResultsData {
  collection?: string;
  dataSearch: string;
  pageInfo: PageInfo;
  products: ProductCard[];
  query?: string;
  total: number;
  transformedFilters: { filters: Filter[]; priceRange?: PriceRange };
}

export interface PredictiveSearchProduct {
  availableForSale: boolean;
  compareAtPrice?: Money;
  featuredImage: Image | null;
  handle: string;
  id: string;
  price: Money;
  title: string;
  vendor?: string;
}

export interface SearchSuggestion {
  styledText: string;
  text: string;
}

interface PredictiveSearchCollection {
  handle: string;
  title: string;
}

export interface PredictiveSearchResult {
  collections: PredictiveSearchCollection[];
  products: PredictiveSearchProduct[];
  queries: SearchSuggestion[];
}
