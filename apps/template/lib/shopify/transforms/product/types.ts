import type { BUNDLE_COMPONENT_VARIANT_FRAGMENT } from "@/lib/shopify/fragments/bundle";
import type {
  FILTERABLE_PRODUCT_CARD_FRAGMENT,
  PRODUCT_CARD_FRAGMENT,
  PRODUCT_FRAGMENT,
  PRODUCT_WITH_VARIANTS_FRAGMENT,
} from "@/lib/shopify/fragments/product";
import type { TAXONOMY_CATEGORY_FRAGMENT } from "@/lib/shopify/fragments/taxonomy";
import type {
  PRODUCT_VARIANT_FRAGMENT,
  PURCHASABLE_PRODUCT_VARIANT_FRAGMENT,
} from "@/lib/shopify/fragments/variant";
import type { ResultOf } from "@/lib/shopify/types";

export type ShopifyBundleComponentVariant = ResultOf<typeof BUNDLE_COMPONENT_VARIANT_FRAGMENT>;
export type ShopifyImage = NonNullable<ShopifyBundleComponentVariant["image"]>;
export type ShopifyBaseVariant = ResultOf<typeof PRODUCT_VARIANT_FRAGMENT>;
export type ShopifyPurchasableVariant = ResultOf<typeof PURCHASABLE_PRODUCT_VARIANT_FRAGMENT>;
// Bundle fields are only selected when `shopConfig.pdp.bundles.isEnabled`.
export type ShopifyVariant = ShopifyBaseVariant & Partial<ShopifyPurchasableVariant>;
export type ShopifyCategory = ResultOf<typeof TAXONOMY_CATEGORY_FRAGMENT>;

export type ShopifyBaseProduct = ResultOf<typeof PRODUCT_FRAGMENT>;
export type ShopifyProductWithVariants = ResultOf<typeof PRODUCT_WITH_VARIANTS_FRAGMENT>;
// Variants and bundle relationships are optional selections layered on ProductFields.
export type ShopifyProduct = ShopifyBaseProduct &
  Partial<Pick<ShopifyProductWithVariants, "variants">> & {
    selectedOrFirstAvailableVariant?: ShopifyVariant | null;
  };
export type ShopifyOption = ShopifyProduct["options"][number];
export type ShopifyOptionValueSwatch = ShopifyOption["optionValues"][number]["swatch"];
export type ShopifyMediaNode = ShopifyProduct["media"]["edges"][number]["node"];

export type ShopifyBaseProductCard = ResultOf<typeof PRODUCT_CARD_FRAGMENT>;
export type ShopifyFilterableProductCard = ResultOf<typeof FILTERABLE_PRODUCT_CARD_FRAGMENT>;
export type ShopifyProductCard = ShopifyBaseProductCard &
  Partial<Pick<ShopifyFilterableProductCard, "options">>;
