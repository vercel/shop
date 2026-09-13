import type { ProductInput } from "@shopify/hydrogen";

import type { Image, Video } from "@/lib/media/types";
import type { Money } from "@/lib/money/types";
import type { SEO } from "@/lib/seo/types";

export type SelectedOptions = Record<string, string>;

export type ProductFormVariant = Pick<
  ProductVariant,
  | "availableForSale"
  | "compareAtPrice"
  | "id"
  | "image"
  | "price"
  | "requiresSellingPlan"
  | "selectedOptions"
  | "sellingPlanAllocations"
  | "title"
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

export interface ProductCard {
  availableForSale: boolean;
  compareAtPrice?: Money;
  defaultVariantSelectedOptions?: SelectedOption[];
  featuredImage: Image | null;
  handle: string;
  id: string;
  isGiftCard: boolean;
  maxPrice: Money;
  price: Money;
  title: string;
  vendor?: string;
}

export interface ProductDetails extends ProductCard {
  /** Sparse variant cache around the default variant; feeds Hydrogen's product form store. */
  adjacentVariants: ProductVariant[];
  allVariantsInStock: boolean;
  category?: Category | null;
  categoryId?: string;
  collectionHandles: string[];
  compareAtPriceRange?: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  currencyCode: string;
  defaultVariant?: ProductVariant;
  description: string;
  descriptionHtml: string;
  encodedVariantAvailability?: string;
  encodedVariantExistence?: string;
  hasUniformPricing: boolean;
  images: Image[];
  options: ProductOption[];
  priceRange: {
    maxVariantPrice: Money;
    minVariantPrice: Money;
  };
  seo: SEO;
  tags: string[];
  updatedAt: string;
  /** Only populated by getProductWithVariants (agent + markdown); the PDP omits it. */
  variants?: ProductVariant[];
  variantsCount: number;
  videos: Video[];
}

export interface ProductVariant {
  availableForSale: boolean;
  bundleParents: ProductVariantReference[];
  compareAtPrice?: Money;
  components: ProductVariantComponent[];
  id: string;
  image: Image | null;
  price: Money;
  /** Differs from the page's handle for combined-listing option values. */
  productHandle: string;
  productTitle: string;
  requiresComponents: boolean;
  requiresSellingPlan: boolean;
  selectedOptions: SelectedOption[];
  // Only the first 100 allocations are loaded, even when Shopify reports another page.
  sellingPlanAllocations: SellingPlanAllocation[];
  title: string;
}

export interface SellingPlanAllocation {
  compareAtPrice: Money;
  price: Money;
  sellingPlan: {
    description?: string | null;
    id: string;
    name: string;
    recurringDeliveries: boolean;
  };
}

export interface ProductVariantComponent {
  quantity: number;
  variant: ProductVariantReference;
}

export interface ProductVariantReference {
  id: string;
  image: Image | null;
  product: {
    featuredImage: Image | null;
    handle: string;
    id: string;
    title: string;
  };
  title: string;
}

export interface ProductOption {
  id: string;
  name: string;
  values: OptionValue[];
}

export interface OptionValueSwatch {
  color?: string;
  image?: string;
}

export interface OptionValue {
  firstSelectableVariant?: ProductVariant;
  id: string;
  image?: string;
  name: string;
  swatch?: OptionValueSwatch;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface Category {
  ancestors: Category[];
  id: string;
  name: string;
}
