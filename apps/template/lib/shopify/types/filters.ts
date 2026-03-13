export type ShopifyFilterType = "LIST" | "PRICE_RANGE" | "BOOLEAN";

export interface ShopifyFilterValue {
  id: string;
  label: string;
  count: number;
  input: string;
}

export interface ShopifyFilter {
  id: string;
  label: string;
  type: ShopifyFilterType;
  values: ShopifyFilterValue[];
}

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
  variantOption?: {
    name: string;
    value: string;
  };
}
