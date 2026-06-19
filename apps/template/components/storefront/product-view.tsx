import type { Locale } from "@/lib/i18n";
import type { SelectedOptions } from "@/lib/product";
import type { ProductDetails, ProductVariant } from "@/lib/types";

import { StorefrontCanvas } from "./canvas";

interface ProductViewProps {
  locale: Locale;
  product: ProductDetails;
  selectedOptionsPromise: Promise<SelectedOptions>;
  variantPromise: Promise<ProductVariant | undefined>;
}

export async function ProductView({
  locale,
  product,
  selectedOptionsPromise,
  variantPromise,
}: ProductViewProps) {
  const [selectedOptions, variant] = await Promise.all([selectedOptionsPromise, variantPromise]);

  return (
    <StorefrontCanvas
      route="product"
      data-handle={product.handle}
      data-locale={locale}
      data-option-count={product.options.length}
      data-selected-option-count={Object.keys(selectedOptions).length}
      data-variant-id={variant?.id}
    />
  );
}

export function ProductViewFallback({ handle, locale }: { handle: string; locale: Locale }) {
  return (
    <StorefrontCanvas route="product" data-handle={handle} data-locale={locale} data-loading />
  );
}
