import { Suspense } from "react";

import { BuyButtons } from "@/components/product/pdp/buy-buttons";
import {
  ProductInfoDescription,
  ProductInfoOptions,
} from "@/components/product/pdp/product-info";
import { ColorImageCarouselItems, ColorImageGrid, ProductMedia } from "@/components/product/pdp/product-media";
import { ProductPrice } from "@/components/product/pdp/product-price";
import { Skeleton } from "@/components/ui/skeleton";
import {
  computeInitialSelectedOptions,
  getPartitionedImagesForSelectedColor,
  getSharedImages,
  hasColorImagePartitioning,
  hasUniformPricing,
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
  const uniformPrice = hasUniformPricing(variants);

  return (
    <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-4 space-y-8 lg:space-y-0">
      {needsPartitioning ? (
        <ProductMedia
          otherImages={getSharedImages(images, options, variants)}
          videos={videos}
          title={title}
          className="lg:col-span-7"
          desktopSlot={
            <Suspense fallback={<Skeleton className="aspect-square w-full" />}>
              <ResolvedColorImages
                images={images}
                options={options}
                variants={variants}
                title={title}
                variantIdPromise={variantIdPromise}
              />
            </Suspense>
          }
          mobileSlot={
            <Suspense
              fallback={
                <div className="relative shrink-0 w-full aspect-square snap-start snap-always overflow-hidden">
                  <Skeleton className="size-full" />
                </div>
              }
            >
              <ResolvedColorCarouselImages
                images={images}
                options={options}
                variants={variants}
                title={title}
                variantIdPromise={variantIdPromise}
              />
            </Suspense>
          }
        />
      ) : (
        <ProductMedia
          otherImages={images}
          videos={videos}
          title={title}
          className="lg:col-span-7"
        />
      )}

      <div className="space-y-8 lg:sticky lg:top-20 lg:col-span-5">
        <div data-slot="product-info-header">
          <h1 className="font-semibold text-foreground tracking-tight text-3xl">{title}</h1>
          {uniformPrice ? (
            selectedVariant && (
              <ProductPrice
                amount={selectedVariant.price.amount}
                currencyCode={selectedVariant.price.currencyCode}
                compareAtAmount={selectedVariant.compareAtPrice?.amount}
                locale={locale}
                className="mt-3"
              />
            )
          ) : (
            <Suspense fallback={<Skeleton className="h-6 w-24 mt-3" />}>
              <ResolvedPrice variants={variants} locale={locale} variantIdPromise={variantIdPromise} />
            </Suspense>
          )}
        </div>
        <Suspense
          fallback={
            <ProductInfoOptions
              variants={variants}
              options={options}
              selectedOptions={defaultOptions}
              handle={handle}
              hideImages
            />
          }
        >
          <ResolvedOptions
            variants={variants}
            options={options}
            handle={handle}
            variantIdPromise={variantIdPromise}
          />
        </Suspense>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-2">
              <div className="h-11 rounded-lg bg-shop/50" />
              <div className="h-11 rounded-lg bg-foreground/50" />
            </div>
          }
        >
          <ResolvedBuyButtons
            variants={variants}
            title={title}
            handle={handle}
            featuredImage={featuredImage}
            availableForSale={product.availableForSale}
            variantIdPromise={variantIdPromise}
          />
        </Suspense>
        <ProductInfoDescription descriptionHtml={product.descriptionHtml} />
      </div>
    </div>
  );
}

async function ResolvedOptions({
  variants,
  options,
  handle,
  variantIdPromise,
}: {
  variants: ProductVariant[];
  options: ProductOption[];
  handle: string;
  variantIdPromise: Promise<string | undefined>;
}) {
  const variantId = await variantIdPromise;
  const selectedOptions = computeInitialSelectedOptions(variants, variantId);

  return (
    <ProductInfoOptions
      variants={variants}
      options={options}
      selectedOptions={selectedOptions}
      handle={handle}
    />
  );
}

async function ResolvedBuyButtons({
  variants,
  title,
  handle,
  featuredImage,
  availableForSale,
  variantIdPromise,
}: {
  variants: ProductVariant[];
  title: string;
  handle: string;
  featuredImage: ImageType | null;
  availableForSale: boolean;
  variantIdPromise: Promise<string | undefined>;
}) {
  const variantId = await variantIdPromise;
  const selectedOptions = computeInitialSelectedOptions(variants, variantId);
  const selectedVariant = resolveSelectedVariant(variants, selectedOptions);

  return (
    <BuyButtons
      selectedVariant={selectedVariant}
      title={title}
      handle={handle}
      featuredImage={featuredImage}
      availableForSale={availableForSale}
    />
  );
}

async function ResolvedPrice({
  variants,
  locale,
  variantIdPromise,
}: {
  variants: ProductVariant[];
  locale: string;
  variantIdPromise: Promise<string | undefined>;
}) {
  const variantId = await variantIdPromise;
  const selectedOptions = computeInitialSelectedOptions(variants, variantId);
  const selectedVariant = resolveSelectedVariant(variants, selectedOptions);

  if (!selectedVariant) return null;

  return (
    <ProductPrice
      amount={selectedVariant.price.amount}
      currencyCode={selectedVariant.price.currencyCode}
      compareAtAmount={selectedVariant.compareAtPrice?.amount}
      locale={locale}
      className="mt-3"
    />
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

async function ResolvedColorCarouselImages({
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

  return <ColorImageCarouselItems images={colorImages} title={title} />;
}
