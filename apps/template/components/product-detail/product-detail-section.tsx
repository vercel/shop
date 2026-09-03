import { MinusIcon, PlusIcon } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { type ReactNode, Suspense } from "react";

import { BundleComponents, BundleParents } from "@/components/product-detail/bundle-components";
import { BuyButtons } from "@/components/product-detail/buy-buttons";
import { BuyWithShopLogo } from "@/components/product-detail/buy-with-shop-logo";
import { ComplementaryProducts } from "@/components/product-detail/complementary-products";
import { ProductOpenGraph } from "@/components/product-detail/open-graph";
import {
  ProductForm,
  ProductFormGiftCard,
  ProductFormOptions,
  ProductFormPrice,
  ProductInfoShell,
} from "@/components/product-detail/product-form";
import {
  ProductInfoDescription,
  ProductInfoOptions,
  ProductInfoTextAccordion,
} from "@/components/product-detail/product-info";
import {
  ColorImageCarouselItems,
  ColorImageGrid,
  ProductMedia,
} from "@/components/product-detail/product-media";
import { ProductPrice } from "@/components/product-detail/product-price";
import { ProductSchema } from "@/components/product-detail/schema";
import { VirtualTryOn } from "@/components/product-detail/virtual-try-on";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RatingStars } from "@/components/ui/rating-stars";
import { Textarea } from "@/components/ui/textarea";
import { shopConfig } from "@/lib/config";
import { ctaColor, precomputedFlags } from "@/lib/flags";
import type { Locale } from "@/lib/i18n";
import { getFlagsCode } from "@/lib/params";
import {
  getSelectedColorImage,
  getSharedImages,
  hasColorImagePartitioning,
  type SelectedOptions,
  toProductFormInput,
  toProductFormVariant,
  toStaticOptionGroups,
} from "@/lib/product";
import type { ProductDetails, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

export async function ProductDetailSection({
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
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={{ cart: messages.cart, product: messages.product }}>
      <ProductSchema
        product={{
          id: product.id,
          handle: product.handle,
          title: product.title,
          description: product.description,
          images: product.images,
          vendor: product.vendor,
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
        <ProductMediaArea
          product={product}
          selectedOptionsPromise={selectedOptionsPromise}
          variantPromise={variantPromise}
        />
        <ProductInfoArea product={product} variantPromise={variantPromise} locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}

function ProductMediaArea({
  product,
  selectedOptionsPromise,
  variantPromise,
}: {
  product: ProductDetails;
  selectedOptionsPromise: Promise<SelectedOptions>;
  variantPromise: Promise<ProductVariant | undefined>;
}) {
  const fallbackImageUrl = product.featuredImage?.url ?? product.images[0]?.url;
  const tryOnOverlay = (
    <Suspense fallback={null}>
      <ResolvedVirtualTryOn fallbackImageUrl={fallbackImageUrl} variantPromise={variantPromise} />
    </Suspense>
  );

  if (!hasColorImagePartitioning(product.options)) {
    return (
      <ProductMedia
        otherImages={product.images}
        videos={product.videos}
        title={product.title}
        className="lg:col-span-6"
        overlay={tryOnOverlay}
      />
    );
  }

  return (
    <ProductMedia
      otherImages={getSharedImages(product.images, product.options)}
      videos={product.videos}
      title={product.title}
      className="lg:col-span-6"
      overlay={tryOnOverlay}
      desktopSlot={
        // Color image is the LCP slot; a pulsing skeleton flashes harder than an empty image canvas.
        <Suspense fallback={<div className="aspect-square w-full" />}>
          <ResolvedColorImageGrid
            product={product}
            selectedOptionsPromise={selectedOptionsPromise}
            overlay={tryOnOverlay}
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
            overlay={tryOnOverlay}
          />
        </Suspense>
      }
    />
  );
}

async function ResolvedVirtualTryOn({
  fallbackImageUrl,
  variantPromise,
}: {
  fallbackImageUrl: string | undefined;
  variantPromise: Promise<ProductVariant | undefined>;
}) {
  const variant = await variantPromise;
  const productImageUrl = variant?.image?.url ?? fallbackImageUrl;
  return productImageUrl ? <VirtualTryOn productImageUrl={productImageUrl} /> : null;
}

async function ResolvedColorImageGrid({
  product,
  selectedOptionsPromise,
  overlay,
}: {
  product: ProductDetails;
  selectedOptionsPromise: Promise<SelectedOptions>;
  overlay?: ReactNode;
}) {
  const image = getSelectedColorImage(product, await selectedOptionsPromise);
  if (!image) return null;
  return <ColorImageGrid images={[image]} title={product.title} overlay={overlay} />;
}

async function ResolvedColorImageCarousel({
  product,
  selectedOptionsPromise,
  overlay,
}: {
  product: ProductDetails;
  selectedOptionsPromise: Promise<SelectedOptions>;
  overlay?: ReactNode;
}) {
  const image = getSelectedColorImage(product, await selectedOptionsPromise);
  if (!image) return null;
  return <ColorImageCarouselItems images={[image]} title={product.title} overlay={overlay} />;
}

async function ProductInfoArea({
  product,
  variantPromise,
  locale,
}: {
  product: ProductDetails;
  variantPromise: Promise<ProductVariant | undefined>;
  locale: Locale;
}) {
  const { options, handle, descriptionHtml } = product;
  const uniformStock = product.allVariantsInStock;
  const singleVariant = product.variantsCount === 1;
  const t = await getTranslations("product");
  // Read the precomputed value so the button color varies per [flags] cache entry
  // instead of re-deciding (and splitting the cache) at render time.
  const ctaColored = await ctaColor(await getFlagsCode(), precomputedFlags);
  const buyFallbackT = uniformStock && !singleVariant ? t : null;
  const allInStock = product.defaultVariant?.availableForSale ?? product.availableForSale;
  const hasOptions = options.some((option) => option.values.length > 1);
  const reviewSummary = product.rating;

  return (
    <div className="grid gap-10 lg:sticky lg:top-20 lg:col-span-4">
      <ProductInfoShell>
        <div data-slot="product-info-header" className="grid gap-2.5">
          {reviewSummary ? (
            <RatingStars
              value={reviewSummary.value}
              label={t("ratingLabel", { max: 5, rating: reviewSummary.value })}
              countLabel={
                reviewSummary.count > 0 ? t("reviews", { count: reviewSummary.count }) : undefined
              }
            />
          ) : null}
          <div>
            <h1 className="text-foreground text-3xl">{product.title}</h1>
            {product.hasUniformPricing ? (
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
        </div>

        {singleVariant ? (
          <ProductInfoContent
            ctaColored={ctaColored}
            product={product}
            selectedVariant={product.defaultVariant}
          />
        ) : (
          <Suspense
            fallback={
              <ProductInfoFallback
                allInStock={allInStock}
                ctaColored={ctaColored}
                hasOptions={hasOptions}
                product={product}
                t={buyFallbackT}
                optionsT={t}
              />
            }
          >
            <ResolvedProductInfo
              ctaColored={ctaColored}
              product={product}
              variantPromise={variantPromise}
            />
          </Suspense>
        )}
      </ProductInfoShell>

      {!product.isGiftCard && shopConfig.pdp.bundles.isEnabled ? (
        <BundleRelationships variant={product.defaultVariant} t={t} />
      ) : null}

      {!product.isGiftCard && shopConfig.pdp.complementaryProducts.isEnabled ? (
        <ComplementaryProducts handle={handle} limit={4} locale={locale} title={t("pairsWith")} />
      ) : null}

      <div className="divide-y divide-border">
        <ProductInfoDescription descriptionHtml={descriptionHtml} title={t("aboutThisItem")} />
        <ProductInfoTextAccordion body={t("fabricCareBody")} title={t("fabricCare")} />
        <ProductInfoTextAccordion body={t("shippingReturnsBody")} title={t("shippingReturns")} />
      </div>
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
  const variant = await variantPromise;
  return (
    <ProductFormPrice
      fallbackVariant={variant ? toProductFormVariant(variant) : undefined}
      locale={locale}
    />
  );
}

async function ResolvedProductInfo({
  ctaColored,
  product,
  variantPromise,
}: {
  ctaColored: boolean;
  product: ProductDetails;
  variantPromise: Promise<ProductVariant | undefined>;
}) {
  return (
    <ProductInfoContent
      ctaColored={ctaColored}
      product={product}
      selectedVariant={await variantPromise}
    />
  );
}

// The store is seeded from the URL-resolved variant so server HTML and client state agree on first paint.
function ProductInfoContent({
  ctaColored,
  product,
  selectedVariant,
}: {
  ctaColored: boolean;
  product: ProductDetails;
  selectedVariant: ProductVariant | undefined;
}) {
  const fallbackVariant = selectedVariant ? toProductFormVariant(selectedVariant) : undefined;
  const hasOptions = product.options.some((option) => option.values.length > 1);

  return (
    <ProductForm product={toProductFormInput(product, selectedVariant)}>
      {hasOptions ? <ProductFormOptions /> : null}
      {product.isGiftCard ? (
        <ProductFormGiftCard
          fallbackVariant={fallbackVariant}
          featuredImage={product.featuredImage}
          handle={product.handle}
          title={product.title}
        />
      ) : (
        <BuyButtons
          ctaColored={ctaColored}
          fallbackVariant={fallbackVariant}
          availableForSale={product.availableForSale}
          buyWithShop={shopConfig.pdp.buyWithShop.isEnabled}
          quantityPicker={shopConfig.pdp.quantityPicker.isEnabled}
        />
      )}
    </ProductForm>
  );
}

function ProductInfoFallback({
  allInStock,
  ctaColored,
  hasOptions,
  optionsT,
  product,
  t,
}: {
  allInStock: boolean;
  ctaColored: boolean;
  hasOptions: boolean;
  optionsT: Awaited<ReturnType<typeof getTranslations<"product">>>;
  product: ProductDetails;
  t: Awaited<ReturnType<typeof getTranslations<"product">>> | null;
}) {
  return (
    <>
      {hasOptions ? (
        <ProductInfoOptions options={toStaticOptionGroups(product)} t={optionsT} hideImages />
      ) : null}
      {product.isGiftCard ? (
        <GiftCardPurchaseFormFallback t={optionsT} />
      ) : (
        <BuyButtonsFallback t={t} allInStock={allInStock} ctaColored={ctaColored} />
      )}
    </>
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

function GiftCardPurchaseFormFallback({
  t,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"product">>>;
}) {
  // Labels and placeholders are static translations, so render the real disabled inputs — the only
  // change on resolve is the fields becoming editable, which keeps geometry stable and avoids CLS.
  return (
    <div className="grid gap-5">
      <div className="grid gap-2.5">
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
        <div className="grid gap-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2.5">
            <Label>{t("giftCard.sendLater")}</Label>
            <span className="inline-flex h-[1.15rem] w-8 items-center rounded-full bg-input opacity-50" />
          </div>
        </div>
      </div>
      <div className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground opacity-50">
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
  ctaColored,
  t,
}: {
  allInStock: boolean;
  ctaColored: boolean;
  t: Awaited<ReturnType<typeof getTranslations<"product">>> | null;
}) {
  return (
    <div className="grid gap-2.5">
      <div className="flex gap-2.5">
        {shopConfig.pdp.quantityPicker.isEnabled ? <QuantityPickerFallback /> : null}
        <div
          className={cn(
            "flex h-12 min-w-0 flex-1 items-center justify-center rounded-lg text-sm font-medium",
            ctaColored ? "bg-[#ff7900] text-white" : "bg-primary text-primary-foreground",
          )}
        >
          {t ? (allInStock ? t("addToCart") : t("outOfStock")) : null}
        </div>
      </div>
      {shopConfig.pdp.buyWithShop.isEnabled ? (
        <div
          className={cn(
            "flex h-12 items-center justify-center rounded-lg border border-foreground bg-transparent px-4 text-foreground",
            !allInStock && "invisible",
          )}
        >
          <BuyWithShopLogo aria-hidden="true" className="h-auto w-24.5" />
        </div>
      ) : null}
    </div>
  );
}
