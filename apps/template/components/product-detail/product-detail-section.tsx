import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { BuyButtons } from "@/components/product-detail/buy-buttons";
import {
  ProductInfoDescription,
  ProductInfoOptions,
} from "@/components/product-detail/product-info";
import { type MediaItem, ProductMedia } from "@/components/product-detail/product-media";
import { ProductPrice } from "@/components/product-detail/product-price";
import { ProductRating } from "@/components/product-detail/product-rating";
import { ShopLogo } from "@/components/product-detail/shop-logo";
import { ComplementaryProductsSection } from "@/components/product/complementary-products-section";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/lib/i18n";
import {
  computeInitialSelectedOptions,
  getPartitionedImagesForSelectedColor,
  getSharedImages,
  hasColorImagePartitioning,
  hasUniformPricing,
  hasUniformStock,
  resolveSelectedVariant,
} from "@/lib/product";
import type {
  Image as ImageType,
  ProductDetails,
  ProductOption,
  ProductReviews,
  ProductVariant,
  Video,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export async function ProductDetailSection({
  product,
  reviewsPromise,
  locale,
  variantIdPromise,
}: {
  product: ProductDetails;
  reviewsPromise: Promise<ProductReviews>;
  locale: Locale;
  variantIdPromise: Promise<string | undefined>;
}) {
  const { handle, title, featuredImage, images, videos, variants, options } = product;

  const needsPartitioning = hasColorImagePartitioning(options, variants);
  const uniformPrice = hasUniformPricing(variants);
  const singleVariant = variants.length === 1;
  const uniformStock = hasUniformStock(variants);

  const eagerSelectedOptions = singleVariant
    ? computeInitialSelectedOptions(variants, undefined)
    : null;
  const eagerSelectedVariant = eagerSelectedOptions
    ? resolveSelectedVariant(variants, eagerSelectedOptions)
    : null;

  const t = uniformStock && !singleVariant ? await getTranslations("product") : null;
  const allInStock = variants[0]?.availableForSale ?? true;

  const tProduct = await getTranslations("product");
  const reviews = await reviewsPromise;
  const ratingAriaLabel = tProduct("rating.ariaLabel", {
    rating: reviews.rating.toFixed(1),
    count: reviews.count,
  });

  return (
    <div className="grid gap-10 lg:grid-cols-10 lg:items-start lg:gap-5">
      {needsPartitioning ? (
        <Suspense fallback={<MediaSkeleton className="lg:col-span-5 lg:sticky lg:top-20" />}>
          <ResolvedMedia
            images={images}
            options={options}
            variants={variants}
            videos={videos}
            title={title}
            variantIdPromise={variantIdPromise}
            className="lg:col-span-5 lg:sticky lg:top-20"
          />
        </Suspense>
      ) : (
        <ProductMedia
          mediaItems={buildMediaItems([], videos, images)}
          title={title}
          className="lg:col-span-5 lg:sticky lg:top-20"
        />
      )}

      <div className="grid gap-10 lg:col-span-5">
        <div data-slot="product-info-header">
          <ProductRating
            rating={reviews.rating}
            count={reviews.count}
            ariaLabel={ratingAriaLabel}
            locale={locale}
          />
          <h1 className="font-display font-semibold text-foreground tracking-tight text-3xl">
            {title}
          </h1>
          {uniformPrice ? (
            variants[0] && (
              <ProductPrice
                amount={variants[0].price.amount}
                currencyCode={variants[0].price.currencyCode}
                compareAtAmount={variants[0].compareAtPrice?.amount}
                locale={locale}
              />
            )
          ) : (
            <Suspense fallback={<div className="h-6" aria-hidden />}>
              <ResolvedPrice
                variants={variants}
                locale={locale}
                variantIdPromise={variantIdPromise}
              />
            </Suspense>
          )}
        </div>
        {singleVariant && eagerSelectedOptions ? (
          <ProductInfoOptions
            variants={variants}
            options={options}
            selectedOptions={eagerSelectedOptions}
            handle={handle}
          />
        ) : (
          <Suspense
            fallback={
              <ProductInfoOptions
                variants={variants}
                options={options}
                selectedOptions={{}}
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
        )}
        {singleVariant && eagerSelectedVariant ? (
          <BuyButtons
            selectedVariant={eagerSelectedVariant}
            title={title}
            handle={handle}
            featuredImage={featuredImage}
            availableForSale={product.availableForSale}
          />
        ) : (
          <Suspense
            fallback={
              t ? (
                <div className="grid grid-cols-10 gap-2.5">
                  <div
                    className={cn(
                      "col-span-4 flex items-center justify-center gap-1.5 rounded-lg h-12 bg-shop text-white",
                      !allInStock && "invisible",
                    )}
                  >
                    <span className="text-sm font-medium">{t("buyWithShop")}</span>
                    <ShopLogo className="h-4 w-auto" />
                  </div>
                  <div className="col-span-6 flex items-center justify-center rounded-lg h-12 bg-link text-link-foreground text-sm font-medium">
                    {allInStock ? t("addToCart") : t("outOfStock")}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-10 gap-2.5">
                  <div className="col-span-4 h-12 rounded-lg bg-shop" />
                  <div className="col-span-6 h-12 rounded-lg bg-link" />
                </div>
              )
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
        )}
        <ComplementaryProductsSection handle={handle} locale={locale} />
        <ProductInfoDescription descriptionHtml={product.descriptionHtml} />
      </div>
    </div>
  );
}

function buildMediaItems(
  colorImages: ImageType[],
  videos: Video[],
  sharedImages: ImageType[],
): MediaItem[] {
  return [
    ...colorImages.map((image): MediaItem => ({ type: "image", image })),
    ...videos.map((video): MediaItem => ({ type: "video", video })),
    ...sharedImages.map((image): MediaItem => ({ type: "image", image })),
  ];
}

function MediaSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="lg:hidden">
        <Skeleton className="aspect-square w-full rounded-none" />
      </div>
      <div className="hidden lg:flex gap-2.5">
        <div className="flex flex-col gap-2.5 w-20 shrink-0">
          {["a", "b", "c", "d"].map((key) => (
            <Skeleton key={key} className="aspect-square w-full rounded-none" />
          ))}
        </div>
        <Skeleton className="flex-1 aspect-square rounded-none" />
      </div>
    </div>
  );
}

async function ResolvedMedia({
  images,
  options,
  variants,
  videos,
  title,
  variantIdPromise,
  className,
}: {
  images: ImageType[];
  options: ProductOption[];
  variants: ProductVariant[];
  videos: Video[];
  title: string;
  variantIdPromise: Promise<string | undefined>;
  className?: string;
}) {
  const variantId = await variantIdPromise;
  const selectedOptions = computeInitialSelectedOptions(variants, variantId);
  const { colorImages } = getPartitionedImagesForSelectedColor(
    images,
    options,
    variants,
    selectedOptions,
  );
  const sharedImages = getSharedImages(images, options, variants);
  const mediaItems = buildMediaItems(colorImages, videos, sharedImages);

  return <ProductMedia mediaItems={mediaItems} title={title} className={className} />;
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
    />
  );
}
