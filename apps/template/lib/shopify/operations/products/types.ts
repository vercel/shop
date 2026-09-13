import type { ProductFilter } from "@shopify/hydrogen";

import type { CommerceLocale } from "@/lib/config/types";
import type { Filter, PriceRange } from "@/lib/filters/types";
import type { PageInfo } from "@/lib/pagination/types";
import type { ProductCard } from "@/lib/product/types";

export type SearchIndexProductsParams = {
  collection?: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: CommerceLocale;
  query?: string;
  sortKey?: string;
};

export type SearchIndexProductsResult = {
  pageInfo: PageInfo;
  products: ProductCard[];
  total: number;
};

export type CollectionProductsParams = {
  collection: string;
  cursor?: string;
  filters?: ProductFilter[];
  limit?: number;
  locale?: CommerceLocale;
  sortKey?: string;
};

export type CollectionProductsResult = {
  filters: Filter[];
  pageInfo: PageInfo;
  priceRange?: PriceRange;
  products: ProductCard[];
};

export type ProductOptionValues = Map<string, Map<string, Set<string>>>;

export type ProductsResult = {
  pageInfo: PageInfo;
  products: ProductCard[];
};

export type ProductsParams = {
  limit?: number;
  locale?: CommerceLocale;
};

export type FilteredProductsParams = ProductsParams & {
  collection?: string;
  cursor?: string;
  filters?: ProductFilter[];
  query?: string;
  sortKey?: string;
};

export type SearchFacetsParams = {
  collection?: string;
  filters?: ProductFilter[];
  locale?: CommerceLocale;
  query?: string;
};

export type SearchFacetsResult = { filters: Filter[]; priceRange?: PriceRange; total: number };
