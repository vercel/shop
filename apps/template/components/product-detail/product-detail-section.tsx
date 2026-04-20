import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { BuyButtons } from "@/components/product-detail/buy-buttons";
import { ProductInfoDescription, ProductInfoOptions } from "@/components/product-detail/product-info";
import {
  ColorImageCarouselItems,
  ColorImageGrid,
  ProductMedia,
} from "@/components/product-detail/product-media";
import { ProductPrice } from "@/components/product-detail/product-price";
import { ShopLogo } from "@/components/product-detail/shop-logo";
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
  ProductVariant,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export async function ProductDetailSection({
  product,
  locale,
  variantIdPromise,
}: {
  product: ProductDetails;
  locale: Locale;
  variantIdPromise: Promise<string | undefined>;
}) {
  const { handle, title, featuredImage, images, videos, variants, options } = product;

  const needsPartitioning = hasColorImagePartitioning(options, variants);
  const uniformPrice = hasUniformPricing(variants);
  const singleVariant = variants.length === 1;
  const uniformStock = hasUniformStock(variants);

  // Pre-resolve for single-variant products (no searchParam needed)
  const eagerSelectedOptions = singleVariant
    ? computeInitialSelectedOptions(variants, undefined)
    : null;
  const eagerSelectedVariant = eagerSelectedOptions
    ? resolveSelectedVariant(variants, eagerSelectedOptions)
    : null;

  // Translations for stock-aware buy button fallback
  const t = uniformStock && !singleVariant ? await getTranslations("product") : null;
  const allInStock = variants[0]?.availableForSale ?? true;

  return (
    <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-5 space-y-10 lg:space-y-0">
      {needsPartitioning ? (
        <ProductMedia
          otherImages={getSharedImages(images, options, variants)}
          videos={videos}
          title={title}
          className="lg:col-span-7"
          desktopSlot={
            <Suspense
              fallback={
                <>
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="aspect-square w-full" />
                </>
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

      <div className="space-y-10 lg:sticky lg:top-20 lg:col-span-5">
        <div data-slot="product-info-header">
          <h1 className="font-semibold text-foreground tracking-tight text-3xl">{title}</h1>
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
            <Suspense fallback={<Skeleton className="h-6 w-24" />}>
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
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg h-12 bg-shop text-white",
                      !allInStock && "invisible",
                    )}
                  >
                    <span className="text-sm font-medium">{t("buyWithShop")}</span>
                    <ShopLogo className="h-4 w-auto" />
                  </div>
                  <div className="flex items-center justify-center rounded-lg h-12 bg-foreground text-background text-sm font-medium">
                    {allInStock ? t("addToCart") : t("outOfStock")}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-12 rounded-lg bg-shop" />
                  <div className="h-12 rounded-lg bg-foreground" />
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
