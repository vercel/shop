import { BuyButtons } from "@/components/product/pdp/buy-buttons";
import {
  ProductInfoDescription,
  ProductInfoHeader,
  ProductInfoOptions,
} from "@/components/product/pdp/product-info";
import { ProductMedia } from "@/components/product/pdp/product-media";
import {
  computeInitialSelectedOptions,
  getPartitionedImagesForSelectedColor,
  resolveSelectedVariant,
} from "@/components/product/pdp/variants";
import type { Locale } from "@/lib/i18n";
import type { ProductDetails } from "@/lib/types";

export function VariantSection({
  product,
  locale,
  variantId,
}: {
  product: ProductDetails;
  locale: Locale;
  variantId?: string;
}) {

  const { handle, title, featuredImage, images, videos, variants, options } = product;

  // TEMP: disable searchParams-driven variant/image selection to test Chrome fallback hypothesis
  const selectedOptions = computeInitialSelectedOptions(variants, undefined);
  const selectedVariant = resolveSelectedVariant(variants, selectedOptions);
  const { colorImages, otherImages } = { colorImages: [] as typeof images, otherImages: images };

  return (
    <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-4 space-y-8 lg:space-y-0">
      <ProductMedia colorImages={colorImages} otherImages={otherImages} videos={videos} title={title} className="lg:col-span-7" />

      <div className="space-y-8 lg:sticky lg:top-20 lg:col-span-5">
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
