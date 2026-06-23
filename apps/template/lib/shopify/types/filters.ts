export type ShopifyFilterPresentation = "IMAGE" | "SWATCH" | "TEXT";

export type ShopifyFilterType = "LIST" | "PRICE_RANGE" | "BOOLEAN";

export interface ShopifyFilterSwatch {
  color: string | null;
  image: { previewImage: { url: string } | null } | null;
}

export interface ShopifyFilterValue {
  id: string;
  label: string;
  count: number;
  input: string;
  swatch?: ShopifyFilterSwatch | null;
}

export interface ShopifyFilter {
  id: string;
  label: string;
  type: ShopifyFilterType;
  presentation?: ShopifyFilterPresentation | null;
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
