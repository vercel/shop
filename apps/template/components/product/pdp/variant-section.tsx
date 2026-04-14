import Image from "next/image";
import { Suspense } from "react";

import { BuyButtons } from "@/components/product/pdp/buy-buttons";
import {
  ProductInfoDescription,
  ProductInfoHeader,
  ProductInfoOptions,
} from "@/components/product/pdp/product-info";
import { ColorImageGrid, ProductMedia } from "@/components/product/pdp/product-media";
import {
  computeInitialSelectedOptions,
  getPartitionedImagesForSelectedColor,
  getSharedImages,
  hasColorImagePartitioning,
  resolveSelectedVariant,
} from "@/components/product/pdp/variants";
import type { Locale } from "@/lib/i18n";
import type { Image as ImageType, ProductDetails, ProductOption, ProductVariant } from "@/lib/types";

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

  // First image for the Suspense fallback
  const fallbackImage = images[0];

  return (
    <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-4 space-y-8 lg:space-y-0">
      {needsPartitioning ? (
        <ProductMedia
          otherImages={getSharedImages(images, options, variants)}
          videos={videos}
          title={title}
          className="lg:col-span-7"
        >
          <Suspense
            fallback={
              fallbackImage ? (
                <div className="relative aspect-square w-full overflow-hidden bg-accent">
                  <Image
                    src={fallbackImage.url}
                    alt={fallbackImage.altText || `${title} image`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 25vw, 100vw"
                    priority
                  />
                </div>
              ) : null
            }
          >
            <ResolvedColorImages
              images={images}
              options={options}
              variants={variants}
              title={title}
              variantIdPromise={variantIdPromise}
            />
          </Suspense>
        </ProductMedia>
      ) : (
        <ProductMedia
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

async function ResolvedColorImages({
  images,
  options,
  variants,
  title,
  variantIdPromise,
}: {
  images: ImageType[];
  options: ProductOption[];
  variants: ProductVariant[];
  title: string;
  variantIdPromise: Promise<string | undefined>;
}) {
  const variantId = await variantIdPromise;
  const selectedOptions = computeInitialSelectedOptions(variants, variantId);
  const { colorImages } = getPartitionedImagesForSelectedColor(
    images,
    options,
    variants,
    selectedOptions,
  );

  if (colorImages.length === 0) return null;

  return <ColorImageGrid images={colorImages} title={title} />;
}
