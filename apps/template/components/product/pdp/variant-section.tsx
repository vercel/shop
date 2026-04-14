import { Suspense } from "react";

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
  hasColorImagePartitioning,
  resolveSelectedVariant,
} from "@/components/product/pdp/variants";
import type { Locale } from "@/lib/i18n";
import type { Image, ProductDetails, ProductOption, ProductVariant, Video } from "@/lib/types";

export function VariantSection({
  product,
  locale,
  variantIdPromise,
}: {
  product: ProductDetails;
  locale: Locale;
  variantIdPromise: Promise<string | undefined>;
}) {
  const { handle, title, featuredImage, images, videos, variants, options } = product;

  // Default selection (first variant) — no searchParams needed
  const defaultOptions = computeInitialSelectedOptions(variants, undefined);
  const selectedVariant = resolveSelectedVariant(variants, defaultOptions);

  const needsPartitioning = hasColorImagePartitioning(options, variants);

  return (
    <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-4 space-y-8 lg:space-y-0">
      {needsPartitioning ? (
        <Suspense
          fallback={
            <ProductMedia
              colorImages={images.slice(0, 1)}
              otherImages={[]}
              videos={videos}
              title={title}
              className="lg:col-span-7"
            />
          }
        >
          <ColorAwareMedia
            images={images}
            options={options}
            variants={variants}
            videos={videos}
            title={title}
            variantIdPromise={variantIdPromise}
          />
        </Suspense>
      ) : (
        <ProductMedia
          colorImages={[]}
          otherImages={images}
          videos={videos}
          title={title}
          className="lg:col-span-7"
        />
      )}

      <div className="space-y-8 lg:sticky lg:top-20 lg:col-span-5">
        <ProductInfoHeader selectedVariant={selectedVariant} title={title} locale={locale} />
        <ProductInfoOptions
          variants={variants}
          options={options}
          selectedOptions={defaultOptions}
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

async function ColorAwareMedia({
  images,
  options,
  variants,
  videos,
  title,
  variantIdPromise,
}: {
  images: Image[];
  options: ProductOption[];
  variants: ProductVariant[];
  videos: Video[];
  title: string;
  variantIdPromise: Promise<string | undefined>;
}) {
  const variantId = await variantIdPromise;
  const selectedOptions = computeInitialSelectedOptions(variants, variantId);
  const { colorImages, otherImages } = getPartitionedImagesForSelectedColor(
    images,
    options,
    variants,
    selectedOptions,
  );

  return (
    <ProductMedia
      colorImages={colorImages}
      otherImages={otherImages}
      videos={videos}
      title={title}
      className="lg:col-span-7"
    />
  );
}
