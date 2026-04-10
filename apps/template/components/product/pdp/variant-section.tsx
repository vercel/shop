"use client";

// DEBUG: useSearchParams disabled to test static PDP rendering
// import { useSearchParams } from "next/navigation";

import { BuyButtons } from "@/components/product/pdp/buy-buttons";
import {
  ProductInfoDescription,
  ProductInfoHeader,
  ProductInfoOptions,
} from "@/components/product/pdp/product-info";
import { ProductMedia } from "@/components/product/pdp/product-media";
import {
  computeInitialSelectedOptions,
  getImagesForSelectedColor,
  resolveSelectedVariant,
} from "@/components/product/pdp/variants";
import type { Locale } from "@/lib/i18n";
import type { ProductDetails } from "@/lib/types";

export function VariantSection({
  product,
  locale,
}: {
  product: ProductDetails;
  locale: Locale;
}) {
  // DEBUG: hardcode variantId to undefined to skip useSearchParams
  // const searchParams = useSearchParams();
  // const variantId = searchParams.get("variantId") ?? undefined;
  const variantId = undefined;

  const { handle, title, featuredImage, images, videos, variants, options } = product;

  const selectedOptions = computeInitialSelectedOptions(variants, variantId);
  const selectedVariant = resolveSelectedVariant(variants, selectedOptions);
  const filteredImages = getImagesForSelectedColor(images, options, variants, selectedOptions);

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 space-y-8 lg:space-y-0">
      <ProductMedia images={filteredImages} videos={videos} title={title} />

      <div className="space-y-8 lg:sticky lg:top-20">
        <ProductInfoHeader selectedVariant={selectedVariant} title={title} locale={locale} />
        <ProductInfoOptions
          variants={variants}
          options={options}
          selectedOptions={selectedOptions}
          handle={handle}
        />
        <BuyButtons
          selectedVariant={selectedVariant}
          title={title}
          handle={handle}
          featuredImage={featuredImage}
          availableForSale={product.availableForSale}
        />
        <ProductInfoDescription descriptionHtml={product.descriptionHtml} />
      </div>
    </div>
  );
}
