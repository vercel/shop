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
  computeSelection,
  getSharedImages,
  hasColorImagePartitioning,
  type ProductSelection,
} from "@/lib/product";
import type { ProductDetails, ProductVariant } from "@/lib/types";
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
          variantsCount: product.variantsCount,
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
  const { options, handle, title, featuredImage, descriptionHtml, availableForSale } = product;
  // Render regions eagerly when base data proves selection cannot change them.
  const singleVariant = product.variantsCount === 1;
  const eagerSelection = singleVariant ? computeSelection(product) : null;
  const allInStock = product.allVariantsInStock && availableForSale;
  const uniformStock = product.allVariantsInStock || !availableForSale;
  const t = uniformStock && !singleVariant ? await getTranslations("product") : null;

  return (
    <div className="grid gap-10 lg:sticky lg:top-20 lg:col-span-4">
      <div data-slot="product-info-header">
        <h1 className="font-semibold text-foreground tracking-tight text-3xl">{title}</h1>
        {product.hasUniformPricing ? (
          <ProductPrice
            amount={product.price.amount}
            currencyCode={product.price.currencyCode}
            compareAtAmount={product.compareAtPrice?.amount}
            locale={locale}
          />
        ) : (
          <Suspense fallback={<div className="h-6" aria-hidden />}>
            <ResolvedProductPrice selectionPromise={selectionPromise} locale={locale} />
          </Suspense>
        )}
      </div>

      {eagerSelection ? (
        <ProductInfoOptions options={eagerSelection.options} />
      ) : (
        <Suspense fallback={<ProductInfoOptions options={options} hideImages />}>
          <ResolvedProductInfoOptions selectionPromise={selectionPromise} />
        </Suspense>
      )}

      {eagerSelection ? (
        <BundleRelationships selectedVariant={eagerSelection.selectedVariant} />
      ) : (
        <Suspense fallback={null}>
          <ResolvedBundleRelationships selectionPromise={selectionPromise} />
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

function toBuyButtonVariant(variant: ProductVariant | undefined): BuyButtonVariant | undefined {
  if (!variant) return undefined;
  return {
    id: variant.id,
    title: variant.title,
    availableForSale: variant.availableForSale,
    image: variant.image,
    price: variant.price,
    requiresBundleConfiguration: variant.requiresComponents && variant.components.length === 0,
    selectedOptions: variant.selectedOptions,
  };
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
  selectionPromise,
  t,
}: {
  selectionPromise: Promise<ProductSelection>;
  t: Awaited<ReturnType<typeof getTranslations<"product">>>;
}) {
  const { options } = await selectionPromise;
  return <ProductInfoOptions options={options} />;
}

async function ResolvedBundleRelationships({
  selectionPromise,
}: {
  selectionPromise: Promise<ProductSelection>;
}) {
  const { selectedVariant } = await selectionPromise;
  return <BundleRelationships selectedVariant={selectedVariant} />;
}

async function BundleRelationships({
  selectedVariant,
}: {
  selectedVariant: ProductVariant | undefined;
}) {
  if (!selectedVariant) return null;
  if (selectedVariant.components.length === 0 && selectedVariant.bundleParents.length === 0) {
    return null;
  }
  const t = await getTranslations("product");
  return (
    <>
      <BundleComponents components={selectedVariant.components} title={t("bundleIncludes")} />
      <BundleParents variants={selectedVariant.bundleParents} title={t("availableInBundles")} />
    </>
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
