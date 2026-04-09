import { BuyButtons } from "@/components/product/pdp/buy-buttons";
import {
  ProductInfoDescription,
  ProductInfoHeader,
  ProductInfoOptions,
} from "@/components/product/pdp/product-info";
import { ProductMedia } from "@/components/product/pdp/product-media";
import { getInitialSelectedOptions } from "@/components/product/pdp/variants";
import type { Locale } from "@/lib/i18n";
import type { ProductDetails } from "@/lib/types";

export function VariantSection({
  product,
  locale,
}: {
  product: ProductDetails;
  locale: Locale;
}) {
  const { handle, title, featuredImage, images, videos, variants, options } = product;

  const selectedOptions = getInitialSelectedOptions(variants);
  const selectedVariant = variants[0];

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 space-y-8 lg:space-y-0">
      <ProductMedia images={images} videos={videos} title={title} />

      <div className="space-y-8 lg:sticky lg:top-20">
        <ProductInfoHeader selectedVariant={selectedVariant} title={title} locale={locale} />
        <ProductInfoOptions
          variants={variants}
          options={options}
          selectedOptions={selectedOptions}
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
