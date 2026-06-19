import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { BundleComponents, BundleParents } from "@/components/product-detail/bundle-components";
import { BuyButtons, type BuyButtonVariant } from "@/components/product-detail/buy-buttons";
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
  defaultSelectedOptions,
  getSelectedColorImage,
  getSharedImages,
  hasColorImagePartitioning,
  type SelectedOptions,
} from "@/lib/product";
import { getAvailableOptionValues } from "@/lib/shopify/encoded-variants";
import type { ProductDetails, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductDetailSection({
  product,
  selectedOptionsPromise,
  variantPromise,
  locale,
}: {
  product: ProductDetails;
  selectedOptionsPromise: Promise<SelectedOptions>;
  variantPromise: Promise<ProductVariant | undefined>;
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
          offerCount: product.variantsCount,
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
        <ProductMediaArea product={product} selectedOptionsPromise={selectedOptionsPromise} />
        <ProductInfoArea
          product={product}
          selectedOptionsPromise={selectedOptionsPromise}
          variantPromise={variantPromise}
          locale={locale}
        />
      </div>
    </>
  );
}

function ProductMediaArea({
  product,
  selectedOptionsPromise,
}: {
  product: ProductDetails;
  selectedOptionsPromise: Promise<SelectedOptions>;
}) {
  if (!hasColorImagePartitioning(product.options)) {
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
      otherImages={getSharedImages(product.images, product.options)}
      videos={product.videos}
      title={product.title}
      className="lg:col-span-6"
      desktopSlot={
        <Suspense fallback={<Skeleton className="w-full rounded-none aspect-square" />}>
          <ResolvedColorImageGrid
            product={product}
            selectedOptionsPromise={selectedOptionsPromise}
          />
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
          <ResolvedColorImageCarousel
            product={product}
            selectedOptionsPromise={selectedOptionsPromise}
          />
        </Suspense>
      }
    />
  );
}

async function ResolvedColorImageGrid({
  product,
  selectedOptionsPromise,
}: {
  product: ProductDetails;
  selectedOptionsPromise: Promise<SelectedOptions>;
}) {
  const image = getSelectedColorImage(product, await selectedOptionsPromise);
  if (!image) return null;
  return <ColorImageGrid images={[image]} title={product.title} />;
}

async function ResolvedColorImageCarousel({
  product,
  selectedOptionsPromise,
}: {
  product: ProductDetails;
  selectedOptionsPromise: Promise<SelectedOptions>;
}) {
  const image = getSelectedColorImage(product, await selectedOptionsPromise);
  if (!image) return null;
  return <ColorImageCarouselItems images={[image]} title={product.title} />;
}

async function ProductInfoArea({
  product,
  selectedOptionsPromise,
  variantPromise,
  locale,
}: {
  product: ProductDetails;
  selectedOptionsPromise: Promise<SelectedOptions>;
  variantPromise: Promise<ProductVariant | undefined>;
  locale: Locale;
}) {
  const { options, handle, title, featuredImage, descriptionHtml, availableForSale } = product;
  const uniformPrice = product.hasUniformPricing;
  const uniformStock = product.allVariantsInStock;
  const singleVariant = product.variantsCount === 1;
  const availableValues = getAvailableOptionValues(options, product.encodedVariantAvailability);
  const eagerSelection = singleVariant
    ? { selectedOptions: defaultSelectedOptions(product), selectedVariant: product.defaultVariant }
    : null;
  const t = await getTranslations("product");
  const buyFallbackT = uniformStock && !singleVariant ? t : null;
  const allInStock = product.defaultVariant?.availableForSale ?? availableForSale;

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
          // h-7 matches the resolved price's text-xl line-height (1.75rem) — keep in sync to avoid CLS
          <Suspense fallback={<div className="h-7" aria-hidden />}>
            <ResolvedProductPrice variantPromise={variantPromise} locale={locale} />
          </Suspense>
        )}
      </div>

      {eagerSelection ? (
        <ProductInfoOptions
          availableValues={availableValues}
          options={options}
          selectedOptions={eagerSelection.selectedOptions}
          handle={handle}
          t={t}
        />
      ) : (
        <Suspense
          fallback={
            <ProductInfoOptions
              availableValues={availableValues}
              options={options}
              selectedOptions={{}}
              handle={handle}
              t={t}
              hideImages
            />
          }
        >
          <ResolvedProductInfoOptions
            availableValues={availableValues}
            options={options}
            handle={handle}
            selectedOptionsPromise={selectedOptionsPromise}
            t={t}
          />
        </Suspense>
      )}

      {eagerSelection ? (
        <BuyButtons
          selectedVariant={toBuyButtonVariant(eagerSelection.selectedVariant)}
          title={title}
          handle={handle}
          featuredImage={featuredImage}
          availableForSale={availableForSale}
        />
      ) : (
        <Suspense fallback={<BuyButtonsFallback t={buyFallbackT} allInStock={allInStock} />}>
          <ResolvedBuyButtons
            title={title}
            handle={handle}
            featuredImage={featuredImage}
            availableForSale={availableForSale}
            variantPromise={variantPromise}
          />
        </Suspense>
      )}

      <BundleRelationships variant={product.defaultVariant} t={t} />

      <ProductInfoDescription descriptionHtml={descriptionHtml} />
    </div>
  );
}

// Bundle relationships are product-level (which products a bundle contains / which
// bundles a product belongs to), so they render eagerly from the cached default
// variant in the static shell rather than streaming in behind the variant query.
function BundleRelationships({
  variant,
  t,
}: {
  variant: ProductVariant | undefined;
  t: Awaited<ReturnType<typeof getTranslations<"product">>>;
}) {
  if (!variant) return null;
  if (variant.components.length === 0 && variant.bundleParents.length === 0) return null;
  return (
    <div className="grid gap-5">
      <BundleComponents components={variant.components} title={t("bundleIncludes")} />
      <BundleParents variants={variant.bundleParents} title={t("availableInBundles")} />
    </div>
  );
}

async function ResolvedProductPrice({
  variantPromise,
  locale,
}: {
  variantPromise: Promise<ProductVariant | undefined>;
  locale: Locale;
}) {
  const selectedVariant = await variantPromise;
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
  availableValues,
  options,
  handle,
  selectedOptionsPromise,
  t,
}: {
  availableValues: Map<string, Set<string>>;
  options: ProductDetails["options"];
  handle: string;
  selectedOptionsPromise: Promise<SelectedOptions>;
  t: Awaited<ReturnType<typeof getTranslations<"product">>>;
}) {
  const selectedOptions = await selectedOptionsPromise;
  return (
    <ProductInfoOptions
      availableValues={availableValues}
      options={options}
      selectedOptions={selectedOptions}
      handle={handle}
      t={t}
    />
  );
}

// Bundle relationship arrays stay server-side; the client buy controls only need
// the gating boolean (a customized bundle parent has no fixed components to ship).
function toBuyButtonVariant(variant: ProductVariant | undefined): BuyButtonVariant | undefined {
  if (!variant) return undefined;
  return {
    availableForSale: variant.availableForSale,
    id: variant.id,
    image: variant.image,
    price: variant.price,
    requiresBundleConfiguration: variant.requiresComponents && variant.components.length === 0,
    selectedOptions: variant.selectedOptions,
    title: variant.title,
  };
}

async function ResolvedBuyButtons({
  title,
  handle,
  featuredImage,
  availableForSale,
  variantPromise,
}: {
  title: string;
  handle: string;
  featuredImage: ProductDetails["featuredImage"];
  availableForSale: boolean;
  variantPromise: Promise<ProductVariant | undefined>;
}) {
  const selectedVariant = await variantPromise;
  return (
    <BuyButtons
      selectedVariant={toBuyButtonVariant(selectedVariant)}
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
