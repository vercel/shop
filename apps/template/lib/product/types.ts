import type { ProductInput } from "@shopify/hydrogen";

import type { Image, Money, OptionValueSwatch, ProductVariant, SelectedOption } from "@/lib/types";

export type SelectedOptions = Record<string, string>;

export type ProductFormVariant = Pick<
  ProductVariant,
  "availableForSale" | "compareAtPrice" | "id" | "image" | "price" | "selectedOptions" | "title"
> & {
  product: { handle: string; title: string };
  requiresBundleConfiguration: boolean;
};

// The store only forwards `swatch` per value, so the variant thumbnail rides along with it.
export interface ProductFormSwatch extends OptionValueSwatch {
  variantImage?: string;
}

export type ProductFormInput = ProductInput<ProductFormVariant> & {
  options: Array<{
    name: string;
    optionValues: Array<{
      firstSelectableVariant: ProductFormVariant | null;
      name: string;
      swatch?: ProductFormSwatch;
    }>;
  }>;
};

export interface OptionValueState {
  available: boolean;
  crossProduct: boolean;
  exists: boolean;
  href: string;
  image?: string;
  name: string;
  selected: boolean;
  swatch?: OptionValueSwatch;
}

export interface OptionGroupState {
  name: string;
  values: OptionValueState[];
}

export type OptimisticProductInfo = {
  image: Image;
  price: Money;
  productHandle: string;
  productTitle: string;
  selectedOptions: SelectedOption[];
  variantTitle: string;
};
