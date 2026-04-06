"use client";

import { useSearchParams } from "next/navigation";

import type { Locale } from "@/lib/i18n";
import type { ProductDetails } from "@/lib/types";

import { ImageGrid } from "./image-grid";
import { MobileBuyButtons } from "./mobile-buy-buttons";
import { MobileCarousel } from "./mobile-carousel";
import {
  ProductInfo,
  ProductInfoDescription,
  ProductInfoHeader,
  ProductInfoOptions,
} from "./product-info";
import {
  computeInitialSelectedOptions,
  getImagesForSelectedColor,
  resolveSelectedVariant,
} from "./variants";

export function VariantContent({ product, locale }: { product: ProductDetails; locale: Locale }) {
  const searchParams = useSearchParams();
  const variantId = searchParams.get("variantId") ?? undefined;

  const { handle, title, featuredImage, images, videos, variants, options, descriptionHtml } =
    product;

  const selectedOptions = computeInitialSelectedOptions(variants, variantId);
  const selectedVariant = resolveSelectedVariant(variants, selectedOptions);
  const filteredImages = getImagesForSelectedColor(images, options, variants, selectedOptions);

  const buyButtonProps = {
    selectedVariant,
    title,
    handle,
    featuredImage,
    availableForSale: product.availableForSale,
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block space-y-8">
        <div className="grid grid-cols-2 items-start gap-4">
          <div>
            <ImageGrid images={filteredImages} videos={videos} title={title} />
          </div>

          <div className="space-y-8">
            <ProductInfoHeader selectedVariant={selectedVariant} title={title} locale={locale} />
            <ProductInfoOptions
              variants={variants}
              options={options}
              selectedOptions={selectedOptions}
              handle={handle}
            />
            <MobileBuyButtons {...buyButtonProps} />
            <ProductInfoDescription descriptionHtml={descriptionHtml} />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden space-y-8">
        <MobileCarousel images={filteredImages} videos={videos} title={title} />

        <MobileBuyButtons {...buyButtonProps} />

        <ProductInfo
          variants={variants}
          options={options}
          selectedVariant={selectedVariant}
          selectedOptions={selectedOptions}
          handle={handle}
          title={title}
          descriptionHtml={descriptionHtml}
          locale={locale}
          size="sm"
        />
      </div>
    </>
  );
}
