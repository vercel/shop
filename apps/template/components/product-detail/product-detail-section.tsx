import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { BuyButtons } from "@/components/product-detail/buy-buttons";
import {
  ProductInfoDescription,
  ProductInfoOptions,
} from "@/components/product-detail/product-info";
import {
  ColorImageCarouselItems,
  ColorImageGrid,
  ProductMedia,
  ProductMediaSkeleton,
} from "@/components/product-detail/product-media";
import { ProductPrice } from "@/components/product-detail/product-price";
import { ProductSchema } from "@/components/product-detail/schema";
import { ShopLogo } from "@/components/product-detail/shop-logo";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";
import {
  computeSelection,
  getSharedImages,
  hasColorImagePartitioning,
  hasUniformPricing,
  hasUniformStock,
  type ProductSelection,
} from "@/lib/product";
import type { ProductDetails } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductDetailSection({
  product,
  selectionPromise,
  locale,
}: {
  product: ProductDetails;
  selectionPromise: Promise<ProductSelection>;
  locale: Locale;
}) {
  return (
    <>
      <ProductSchema
        product={{
          id: product.id,
          handle: product.handle,
          title: product.title,
          description: product.description,
          images: product.images,
          manufacturerName: product.manufacturerName,
          currencyCode: product.currencyCode,
          priceRange: product.priceRange,
          variants: product.variants,
          availableForSale: product.availableForSale,
        }}
      />
      <BreadcrumbSchema
        items={[
          { name: siteConfig.name, path: "/" },
          { name: product.title, path: `/products/${product.handle}` },
        ]}
      />
      <div className="grid gap-10 lg:grid-cols-10 lg:items-start lg:gap-5">
        <ProductMediaArea product={product} selectionPromise={selectionPromise} />
        <ProductInfoArea product={product} selectionPromise={selectionPromise} locale={locale} />
      </div>
    </>
  );
}

function ProductMediaArea({
  product,
  selectionPromise,
}: {
  product: ProductDetails;
  selectionPromise: Promise<ProductSelection>;
}) {
  if (!hasColorImagePartitioning(product.options, product.variants)) {
    return (
      <ProductMedia
        otherImages={product.images}
        videos={product.videos}
        title={product.title}
        className="lg:col-span-6"
      />
    );
  }

  return (
    <ProductMedia
      otherImages={getSharedImages(product.images, product.options, product.variants)}
      videos={product.videos}
      title={product.title}
      className="lg:col-span-6"
      desktopSlot={
        <Suspense fallback={<Skeleton className="w-full rounded-none aspect-square" />}>
          <ResolvedColorImageGrid title={product.title} selectionPromise={selectionPromise} />
        </Suspense>
      }
      mobileSlot={
        <Suspense
          fallback={
            <div className="relative shrink-0 w-full snap-start snap-always overflow-hidden aspect-square">
              <Skeleton className="size-full rounded-none" />
            </div>
          }
        >
          <ResolvedColorImageCarousel title={product.title} selectionPromise={selectionPromise} />
        </Suspense>
      }
    />
  );
}

async function ResolvedColorImageGrid({
  title,
  selectionPromise,
}: {
  title: string;
  selectionPromise: Promise<ProductSelection>;
}) {
  const { colorImages } = await selectionPromise;
  if (colorImages.length === 0) return null;
  return <ColorImageGrid images={colorImages} title={title} />;
}

async function ResolvedColorImageCarousel({
  title,
  selectionPromise,
}: {
  title: string;
  selectionPromise: Promise<ProductSelection>;
}) {
  const { colorImages } = await selectionPromise;
  if (colorImages.length === 0) return null;
  return <ColorImageCarouselItems images={colorImages} title={title} />;
}

async function ProductInfoArea({
  product,
  selectionPromise,
  locale,
}: {
  product: ProductDetails;
  selectionPromise: Promise<ProductSelection>;
  locale: Locale;
}) {
  const { variants, options, handle, title, featuredImage, descriptionHtml, availableForSale } =
    product;
  const uniformPrice = hasUniformPricing(product.priceRange, product.compareAtPriceRange);
  const uniformStock = hasUniformStock(variants);
  const singleVariant = variants.length === 1;
  const eagerSelection = singleVariant ? computeSelection(product, undefined) : null;
  const t = uniformStock && !singleVariant ? await getTranslations("product") : null;
  const allInStock = variants[0]?.availableForSale ?? true;

  return (
    <div className="grid gap-10 lg:sticky lg:top-20 lg:col-span-4">
      <div data-slot="product-info-header">
        <h1 className="font-semibold text-foreground tracking-tight text-3xl">{title}</h1>
        {uniformPrice ? (
          <ProductPrice
            amount={product.priceRange.minVariantPrice.amount}
            currencyCode={product.priceRange.minVariantPrice.currencyCode}
            compareAtAmount={product.compareAtPriceRange?.minVariantPrice.amount}
            locale={locale}
          />
        ) : (
          <Suspense fallback={<div className="h-6" aria-hidden />}>
            <ResolvedProductPrice selectionPromise={selectionPromise} locale={locale} />
          </Suspense>
        )}
      </div>

      {eagerSelection ? (
        <ProductInfoOptions
          variants={variants}
          options={options}
          selectedOptions={eagerSelection.selectedOptions}
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
          <ResolvedProductInfoOptions
            variants={variants}
            options={options}
            handle={handle}
            selectionPromise={selectionPromise}
          />
        </Suspense>
      )}

      {eagerSelection ? (
        <BuyButtons
          selectedVariant={eagerSelection.selectedVariant}
          title={title}
          handle={handle}
          featuredImage={featuredImage}
          availableForSale={availableForSale}
        />
      ) : (
        <Suspense fallback={<BuyButtonsFallback t={t} allInStock={allInStock} />}>
          <ResolvedBuyButtons
            title={title}
            handle={handle}
            featuredImage={featuredImage}
            availableForSale={availableForSale}
            selectionPromise={selectionPromise}
          />
        </Suspense>
      )}

      <ProductInfoDescription descriptionHtml={descriptionHtml} />
    </div>
  );
}

async function ResolvedProductPrice({
  selectionPromise,
  locale,
}: {
  selectionPromise: Promise<ProductSelection>;
  locale: Locale;
}) {
  const { selectedVariant } = await selectionPromise;
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

async function ResolvedProductInfoOptions({
  variants,
  options,
  handle,
  selectionPromise,
}: {
  variants: ProductDetails["variants"];
  options: ProductDetails["options"];
  handle: string;
  selectionPromise: Promise<ProductSelection>;
}) {
  const { selectedOptions } = await selectionPromise;
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
  title,
  handle,
  featuredImage,
  availableForSale,
  selectionPromise,
}: {
  title: string;
  handle: string;
  featuredImage: ProductDetails["featuredImage"];
  availableForSale: boolean;
  selectionPromise: Promise<ProductSelection>;
}) {
  const { selectedVariant } = await selectionPromise;
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

function BuyButtonsFallback({
  t,
  allInStock,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"product">>> | null;
  allInStock: boolean;
}) {
  if (!t) {
    return (
      <div className="grid grid-cols-2 gap-2.5">
        <div className="h-12 rounded-lg bg-shop" />
        <div className="h-12 rounded-lg bg-primary" />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div
        className={cn(
          "flex items-center justify-center gap-1.5 rounded-lg h-12 bg-shop text-white",
          !allInStock && "invisible",
        )}
      >
        <span className="text-sm font-medium">{t("buyWithShop")}</span>
        <ShopLogo className="h-4 w-auto" />
      </div>
      <div className="flex items-center justify-center rounded-lg h-12 bg-primary text-primary-foreground text-sm font-medium">
        {allInStock ? t("addToCart") : t("outOfStock")}
      </div>
    </div>
  );
}

export function ProductDetailSectionSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-10 lg:items-start lg:gap-5">
      <ProductMediaSkeleton className="lg:col-span-6" />
      <div className="grid gap-10 lg:sticky lg:top-20 lg:col-span-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
