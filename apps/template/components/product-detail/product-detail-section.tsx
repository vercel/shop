import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import type { ProductCardAspectRatio } from "@/components/product-card/components";
import { BuyButtons } from "@/components/product-detail/buy-buttons";
import {
  ProductInfoDescription,
  ProductInfoOptions,
} from "@/components/product-detail/product-info";
import {
  ColorImageCarouselItem,
  ColorImageCarouselItems,
  ColorImageGrid,
  ColorImageGridItem,
  ProductMedia,
} from "@/components/product-detail/product-media";
import { ProductPrice } from "@/components/product-detail/product-price";
import { ShopLogo } from "@/components/product-detail/shop-logo";
import type { Locale } from "@/lib/i18n";
import {
  computeInitialSelectedOptions,
  getDefaultPartitionedImagesForColor,
  getPartitionedImagesForVariant,
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
  aspectRatio = "square",
}: {
  product: ProductDetails;
  locale: Locale;
  variantIdPromise: Promise<string | undefined>;
  aspectRatio?: ProductCardAspectRatio;
}) {
  const { handle, title, featuredImage, images, videos, variants, options } = product;

  const needsPartitioning = hasColorImagePartitioning(options, variants);
  const defaultPartitionedImages = needsPartitioning
    ? getDefaultPartitionedImagesForColor(images, options, variants)
    : null;
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

  const t = uniformStock && !singleVariant ? await getTranslations("product") : null;
  const allInStock = variants[0]?.availableForSale ?? true;

  return (
    <div className="grid gap-10 lg:grid-cols-10 lg:items-start lg:gap-5">
      {needsPartitioning && defaultPartitionedImages ? (
        <ProductMedia
          otherImages={defaultPartitionedImages.otherImages}
          videos={videos}
          title={title}
          aspectRatio={aspectRatio}
          className="lg:col-span-6"
          desktopSlot={
            <ColorImages
              defaultImages={defaultPartitionedImages.colorImages}
              images={images}
              options={options}
              variants={variants}
              title={title}
              aspectRatio={aspectRatio}
              variantIdPromise={variantIdPromise}
            />
          }
          mobileSlot={
            <ColorCarouselImages
              defaultImages={defaultPartitionedImages.colorImages}
              images={images}
              options={options}
              variants={variants}
              title={title}
              aspectRatio={aspectRatio}
              variantIdPromise={variantIdPromise}
            />
          }
        />
      ) : (
        <ProductMedia
          otherImages={images}
          videos={videos}
          title={title}
          aspectRatio={aspectRatio}
          className="lg:col-span-6"
        />
      )}

      <div className="grid gap-10 lg:sticky lg:top-20 lg:col-span-4">
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

function ColorImages({
  defaultImages,
  images,
  options,
  variants,
  title,
  aspectRatio,
  variantIdPromise,
}: {
  defaultImages: ImageType[];
  images: ImageType[];
  options: ProductOption[];
  variants: ProductVariant[];
  title: string;
  aspectRatio: ProductCardAspectRatio;
  variantIdPromise: Promise<string | undefined>;
}) {
  const [firstImage, ...remainingImages] = defaultImages;

  if (!firstImage) return null;

  return (
    <>
      <Suspense
        fallback={
          <ColorImageGridItem
            image={firstImage}
            title={title}
            idx={0}
            aspectRatio={aspectRatio}
            priority
            eager={false}
          />
        }
      >
        <ResolvedFirstColorImage
          defaultImage={firstImage}
          images={images}
          options={options}
          variants={variants}
          title={title}
          aspectRatio={aspectRatio}
          variantIdPromise={variantIdPromise}
        />
      </Suspense>
      <Suspense
        fallback={
          <ColorImageGridTail images={remainingImages} title={title} aspectRatio={aspectRatio} />
        }
      >
        <ResolvedColorImageTail
          images={images}
          options={options}
          variants={variants}
          title={title}
          aspectRatio={aspectRatio}
          variantIdPromise={variantIdPromise}
        />
      </Suspense>
    </>
  );
}

function ColorCarouselImages({
  defaultImages,
  images,
  options,
  variants,
  title,
  aspectRatio,
  variantIdPromise,
}: {
  defaultImages: ImageType[];
  images: ImageType[];
  options: ProductOption[];
  variants: ProductVariant[];
  title: string;
  aspectRatio: ProductCardAspectRatio;
  variantIdPromise: Promise<string | undefined>;
}) {
  const [firstImage, ...remainingImages] = defaultImages;

  if (!firstImage) return null;

  return (
    <>
      <Suspense
        fallback={
          <ColorImageCarouselItem
            image={firstImage}
            title={title}
            idx={0}
            aspectRatio={aspectRatio}
            priority
            eager={false}
          />
        }
      >
        <ResolvedFirstColorCarouselImage
          defaultImage={firstImage}
          images={images}
          options={options}
          variants={variants}
          title={title}
          aspectRatio={aspectRatio}
          variantIdPromise={variantIdPromise}
        />
      </Suspense>
      <Suspense
        fallback={
          <ColorImageCarouselTail
            images={remainingImages}
            title={title}
            aspectRatio={aspectRatio}
          />
        }
      >
        <ResolvedColorCarouselImageTail
          images={images}
          options={options}
          variants={variants}
          title={title}
          aspectRatio={aspectRatio}
          variantIdPromise={variantIdPromise}
        />
      </Suspense>
    </>
  );
}

function ColorImageGridTail({
  images,
  title,
  aspectRatio,
}: {
  images: ImageType[];
  title: string;
  aspectRatio: ProductCardAspectRatio;
}) {
  return images.map((image, idx) => (
    <ColorImageGridItem
      key={image.url}
      image={image}
      title={title}
      idx={idx + 1}
      aspectRatio={aspectRatio}
      priority={false}
      eager={idx === 0}
    />
  ));
}

function ColorImageCarouselTail({
  images,
  title,
  aspectRatio,
}: {
  images: ImageType[];
  title: string;
  aspectRatio: ProductCardAspectRatio;
}) {
  return images.map((image, idx) => (
    <ColorImageCarouselItem
      key={image.url}
      image={image}
      title={title}
      idx={idx + 1}
      aspectRatio={aspectRatio}
      priority={false}
      eager={idx === 0}
    />
  ));
}

async function ResolvedFirstColorImage({
  defaultImage,
  images,
  options,
  variants,
  title,
  aspectRatio,
  variantIdPromise,
}: {
  defaultImage: ImageType;
  images: ImageType[];
  options: ProductOption[];
  variants: ProductVariant[];
  title: string;
  aspectRatio: ProductCardAspectRatio;
  variantIdPromise: Promise<string | undefined>;
}) {
  const variantId = await variantIdPromise;
  const image =
    getPartitionedImagesForVariant(images, options, variants, variantId).colorImages[0] ??
    defaultImage;

  return (
    <ColorImageGridItem
      image={image}
      title={title}
      idx={0}
      aspectRatio={aspectRatio}
      priority
      eager={false}
    />
  );
}

async function ResolvedColorImageTail({
  images,
  options,
  variants,
  title,
  aspectRatio,
  variantIdPromise,
}: {
  images: ImageType[];
  options: ProductOption[];
  variants: ProductVariant[];
  title: string;
  aspectRatio: ProductCardAspectRatio;
  variantIdPromise: Promise<string | undefined>;
}) {
  const variantId = await variantIdPromise;
  const tailImages = getPartitionedImagesForVariant(
    images,
    options,
    variants,
    variantId,
  ).colorImages.slice(1);

  return <ColorImageGridTail images={tailImages} title={title} aspectRatio={aspectRatio} />;
}

async function ResolvedFirstColorCarouselImage({
  defaultImage,
  images,
  options,
  variants,
  title,
  aspectRatio,
  variantIdPromise,
}: {
  defaultImage: ImageType;
  images: ImageType[];
  options: ProductOption[];
  variants: ProductVariant[];
  title: string;
  aspectRatio: ProductCardAspectRatio;
  variantIdPromise: Promise<string | undefined>;
}) {
  const variantId = await variantIdPromise;
  const image =
    getPartitionedImagesForVariant(images, options, variants, variantId).colorImages[0] ??
    defaultImage;

  return (
    <ColorImageCarouselItem
      image={image}
      title={title}
      idx={0}
      aspectRatio={aspectRatio}
      priority
      eager={false}
    />
  );
}

async function ResolvedColorCarouselImageTail({
  images,
  options,
  variants,
  title,
  aspectRatio,
  variantIdPromise,
}: {
  images: ImageType[];
  options: ProductOption[];
  variants: ProductVariant[];
  title: string;
  aspectRatio: ProductCardAspectRatio;
  variantIdPromise: Promise<string | undefined>;
}) {
  const variantId = await variantIdPromise;
  const tailImages = getPartitionedImagesForVariant(
    images,
    options,
    variants,
    variantId,
  ).colorImages.slice(1);

  return <ColorImageCarouselTail images={tailImages} title={title} aspectRatio={aspectRatio} />;
}
