import type { ProductFilter } from "@shopify/hydrogen";

import type { FILTER_FRAGMENT } from "@/lib/shopify/fragments/filters";
import type { ResultOf } from "@/lib/shopify/types";

export interface TransformFiltersOptions {
  activeFilters?: ProductFilter[];
  currencyCode?: string;
}

export type ShopifyFilter = ResultOf<typeof FILTER_FRAGMENT>;
export type ShopifyFilterValue = ShopifyFilter["values"][number];
export type ShopifyFilterType = ShopifyFilter["type"];
export type ShopifyFilterPresentation = NonNullable<ShopifyFilter["presentation"]>;
