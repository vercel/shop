import { MinusIcon, PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { BundleComponents, BundleParents } from "@/components/product-detail/bundle-components";
import { BuyButtons, type BuyButtonVariant } from "@/components/product-detail/buy-buttons";
import { BuyWithShopLogo } from "@/components/product-detail/buy-with-shop-logo";
import { ComplementaryProducts } from "@/components/product-detail/complementary-products";
import { GiftCardPurchaseForm } from "@/components/product-detail/gift-card-purchase-form";
import { ProductOpenGraph } from "@/components/product-detail/open-graph";
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
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { shopConfig } from "@/shop.config";

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
      <ProductOpenGraph
        availableForSale={product.availableForSale}
        price={product.priceRange.minVariantPrice}
      />
      <BreadcrumbSchema
        items={[
          { name: shopConfig.site.name, path: "/" },
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
        // Color image is the LCP slot; a pulsing skeleton background flashes harder than empty space.
        <Suspense fallback={<div className="aspect-square w-full" />}>
          <ResolvedColorImageGrid
            product={product}
            selectedOptionsPromise={selectedOptionsPromise}
          />
        </Suspense>
      }
      mobileSlot={
        <Suspense
          fallback={
            <div className="relative shrink-0 w-full snap-start snap-always overflow-hidden aspect-square" />
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
        <h1 className="text-foreground text-3xl">{title}</h1>
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

      {product.isGiftCard ? (
        <Suspense fallback={<GiftCardPurchaseFormFallback t={t} />}>
          <ResolvedGiftCardPurchaseForm
            eagerVariantId={eagerSelection?.selectedVariant?.id}
            variantPromise={variantPromise}
          />
        </Suspense>
      ) : eagerSelection ? (
        <BuyButtons
          selectedVariant={toBuyButtonVariant(eagerSelection.selectedVariant)}
          title={title}
          handle={handle}
          featuredImage={featuredImage}
          availableForSale={availableForSale}
          buyWithShop={shopConfig.pdp.buyWithShop.enabled}
          quantityPicker={shopConfig.pdp.quantityPicker.enabled}
        />
      ) : (
        <Suspense fallback={<BuyButtonsFallback t={buyFallbackT} allInStock={allInStock} />}>
          <ResolvedBuyButtons
            title={title}
            handle={handle}
            featuredImage={featuredImage}
            availableForSale={availableForSale}
            buyWithShop={shopConfig.pdp.buyWithShop.enabled}
            quantityPicker={shopConfig.pdp.quantityPicker.enabled}
            variantPromise={variantPromise}
          />
        </Suspense>
      )}

      {!product.isGiftCard && shopConfig.pdp.bundles.enabled ? (
        <BundleRelationships variant={product.defaultVariant} t={t} />
      ) : null}

      {!product.isGiftCard && shopConfig.pdp.complementaryProducts.enabled ? (
        <ComplementaryProducts handle={handle} limit={4} locale={locale} title={t("pairsWith")} />
      ) : null}

      <ProductInfoDescription descriptionHtml={descriptionHtml} />
    </div>
  );
}

// Bundle relationships are product-level, so keep them in the static shell.
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

// Customized bundle parents have no fixed components; only their gating boolean crosses the client boundary.
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
  availableForSale,
  buyWithShop,
  featuredImage,
  handle,
  quantityPicker,
  title,
  variantPromise,
}: {
  availableForSale: boolean;
  buyWithShop: boolean;
  featuredImage: ProductDetails["featuredImage"];
  handle: string;
  quantityPicker: boolean;
  title: string;
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
      buyWithShop={buyWithShop}
      quantityPicker={quantityPicker}
    />
  );
}

async function ResolvedGiftCardPurchaseForm({
  eagerVariantId,
  variantPromise,
}: {
  eagerVariantId: string | undefined;
  variantPromise: Promise<ProductVariant | undefined>;
}) {
  const variant = eagerVariantId ? { id: eagerVariantId } : await variantPromise;
  if (!variant?.id) return null;
  return <GiftCardPurchaseForm merchandiseId={variant.id} />;
}

function GiftCardPurchaseFormFallback({
  t,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"product">>>;
}) {
  // Labels and placeholders are static translations. Render the real inputs
  // disabled so the only change on resolve is the inputs becoming editable.
  return (
    <div className="grid gap-5">
      <div className="grid gap-5">
        <div className="grid gap-2.5">
          <Label>{t("giftCard.recipientEmail")}</Label>
          <Input type="email" disabled placeholder={t("giftCard.recipientEmailPlaceholder")} />
        </div>
        <div className="grid gap-2.5">
          <Label>{t("giftCard.recipientName")}</Label>
          <Input type="text" disabled placeholder={t("giftCard.recipientNamePlaceholder")} />
        </div>
        <div className="grid gap-2.5">
          <Label>{t("giftCard.message")}</Label>
          <Textarea rows={3} disabled placeholder={t("giftCard.messagePlaceholder")} />
        </div>
        <span className="text-sm font-medium text-foreground">{t("giftCard.sendOn")}</span>
      </div>
      <div className="flex h-12 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground opacity-50 cursor-not-allowed">
        {t("giftCard.addToCart")}
      </div>
    </div>
  );
}

function QuantityPickerFallback() {
  return (
    <div
      aria-hidden="true"
      className="grid h-12 w-32 shrink-0 grid-cols-[3rem_2rem_3rem] rounded-lg bg-background ring-1 ring-border ring-inset"
    >
      <span className="flex size-12 items-center justify-center opacity-50">
        <MinusIcon className="size-4 shrink-0" />
      </span>
      <span className="flex h-12 w-8 items-center justify-center text-sm font-medium tabular-nums">
        1
      </span>
      <span className="flex size-12 items-center justify-center">
        <PlusIcon className="size-4 shrink-0" />
      </span>
    </div>
  );
}

function BuyButtonsFallback({
  allInStock,
  t,
}: {
  allInStock: boolean;
  t: Awaited<ReturnType<typeof getTranslations<"product">>> | null;
}) {
  return (
    <div className="grid gap-2.5">
      <div className="flex gap-2.5">
        {shopConfig.pdp.quantityPicker.enabled ? <QuantityPickerFallback /> : null}
        <div className="flex h-12 min-w-0 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground">
          {t ? (allInStock ? t("addToCart") : t("outOfStock")) : null}
        </div>
      </div>
      {shopConfig.pdp.buyWithShop.enabled ? (
        <div
          className={cn(
            "flex h-12 items-center justify-center rounded-lg bg-shop px-4 text-white",
            !allInStock && "invisible",
          )}
        >
          <BuyWithShopLogo aria-hidden="true" className="h-auto w-24.5" />
        </div>
      ) : null}
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
