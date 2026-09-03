import type { FILTER_FRAGMENT } from "@/lib/shopify/fragments";
import type { ResultOf } from "@/lib/shopify/storefront";

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
