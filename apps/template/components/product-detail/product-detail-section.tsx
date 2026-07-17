import { MinusIcon, PlusIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { BundleComponents, BundleParents } from "@/components/product-detail/bundle-components";
import { BuyButtons, type BuyButtonVariant } from "@/components/product-detail/buy-buttons";
import { BuyWithShopLogo } from "@/components/product-detail/buy-with-shop-logo";
import { ComplementaryProducts } from "@/components/product-detail/complementary-products";
import { ProductOpenGraph } from "@/components/product-detail/open-graph";
import {
  ProductInfoDescription,
  ProductInfoOptions,
} from "@/components/product-detail/product-info";
import {
  ColorImageCarouselItems,
  ProductMedia,
  ProductMediaSkeleton,
} from "@/components/product-detail/product-media";
import { ProductPrice } from "@/components/product-detail/product-price";
import { ProductSchema } from "@/components/product-detail/schema";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="relative left-1/2 -ml-[50vw] w-screen overflow-hidden pb-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-0 flex h-[min(100vw,36rem)] items-center overflow-hidden md:h-[min(calc(100vw_-_2.5rem),33.5rem)]"
        >
          <ProductMarquee title={product.title} />
        </div>
        <div className="relative z-10 mx-auto grid w-full max-w-xl gap-5 px-5">
          <ProductMediaArea product={product} selectedOptionsPromise={selectedOptionsPromise} />
          <ProductInfoArea
            product={product}
            selectedOptionsPromise={selectedOptionsPromise}
            variantPromise={variantPromise}
            locale={locale}
          />
        </div>
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
      <ProductMedia otherImages={product.images} videos={product.videos} title={product.title} />
    );
  }

  return (
    <ProductMedia
      otherImages={getSharedImages(product.images, product.options)}
      videos={product.videos}
      title={product.title}
      mobileSlot={
        <Suspense
          fallback={
            <div className="relative aspect-square w-full shrink-0 snap-start snap-always overflow-hidden" />
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

function ProductMarquee({ title }: { title: string }) {
  return (
    <div className="animate-marquee flex shrink-0 whitespace-nowrap font-mono text-[16rem] leading-none font-bold tracking-tight text-background [-webkit-text-stroke:2px_var(--foreground)] [paint-order:stroke_fill] motion-reduce:animate-none">
      <span className="pr-[1ch]">{title}</span>
      <span className="pr-[1ch]">{title}</span>
      <span className="pr-[1ch]">{title}</span>
      <span className="pr-[1ch]">{title}</span>
    </div>
  );
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
    <div className="grid gap-10">
      <div data-slot="product-info-header" className="font-mono text-sm">
        <h1 className="font-bold text-foreground">{title}</h1>
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

      {shopConfig.pdp.bundles.enabled ? (
        <BundleRelationships variant={product.defaultVariant} t={t} />
      ) : null}

      {shopConfig.pdp.complementaryProducts.enabled ? (
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
    <div className="relative left-1/2 -ml-[50vw] w-screen overflow-hidden pb-10">
      <div className="relative z-10 mx-auto grid w-full max-w-xl gap-5 px-5">
        <ProductMediaSkeleton />
        <div className="grid gap-10">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
