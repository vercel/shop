import type { FILTER_FRAGMENT } from "@/lib/shopify/fragments/filters";
import type { ResultOf } from "@/lib/shopify/types";
import type { Filter, PriceRange } from "@/lib/types";

export interface TransformFiltersOptions {
  activeFilters?: Record<string, string | string[] | undefined>;
  currencyCode?: string;
  hideZeroCount?: boolean;
}

export interface TransformedFilters {
  filters: Filter[];
  priceRange?: PriceRange;
}

export interface ActiveFilterBadge {
  paramKey: string;
  value: string;
  label: string;
  filterLabel: string;
}

export type ShopifyFilter = ResultOf<typeof FILTER_FRAGMENT>;
export type ShopifyFilterValue = ShopifyFilter["values"][number];
export type ShopifyFilterType = ShopifyFilter["type"];
export type ShopifyFilterPresentation = NonNullable<ShopifyFilter["presentation"]>;

// App-owned subset of Shopify's ProductFilter input; the gql() variables check enforces schema compatibility.
export interface ProductFilter {
  available?: boolean;
  price?: {
    min?: number;
    max?: number;
  };
  productMetafield?: {
    namespace: string;
    key: string;
    value: string;
  };
  productType?: string;
  productVendor?: string;
  tag?: string;
  taxonomyMetafield?: {
    namespace: string;
    key: string;
    value: string;
  };
  variantOption?: {
    name: string;
    value: string;
  };
}
