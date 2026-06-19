import { getTranslations } from "next-intl/server";

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
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";
import { getSharedImages, hasColorImagePartitioning, type ProductSelection } from "@/lib/product";
import type { ProductDetails, ProductVariant } from "@/lib/types";

export function ProductDetailSection({
  product,
  selection,
  locale,
}: {
  product: ProductDetails;
  selection: ProductSelection;
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
        <ProductMediaArea product={product} selection={selection} />
        <ProductInfoArea product={product} selection={selection} locale={locale} />
      </div>
    </>
  );
}

function ProductMediaArea({
  product,
  selection,
}: {
  product: ProductDetails;
  selection: ProductSelection;
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

  const hasColorImages = selection.colorImages.length > 0;

  return (
    <ProductMedia
      otherImages={getSharedImages(product.images, product.options, product.variants)}
      videos={product.videos}
      title={product.title}
      className="lg:col-span-6"
      desktopSlot={
        hasColorImages ? (
          <ColorImageGrid images={selection.colorImages} title={product.title} />
        ) : undefined
      }
      mobileSlot={
        hasColorImages ? (
          <ColorImageCarouselItems images={selection.colorImages} title={product.title} />
        ) : undefined
      }
    />
  );
}

async function ProductInfoArea({
  product,
  selection,
  locale,
}: {
  product: ProductDetails;
  selection: ProductSelection;
  locale: Locale;
}) {
  const { handle, title, featuredImage, descriptionHtml, availableForSale } = product;

  return (
    <div className="grid gap-10 lg:sticky lg:top-20 lg:col-span-4">
      <div data-slot="product-info-header">
        <h1 className="font-semibold text-foreground tracking-tight text-3xl">{title}</h1>
        {selection.selectedVariant ? (
          <ProductPrice
            amount={selection.selectedVariant.price.amount}
            currencyCode={selection.selectedVariant.price.currencyCode}
            compareAtAmount={selection.selectedVariant.compareAtPrice?.amount}
            locale={locale}
          />
        ) : null}
      </div>

      <ProductInfoOptions options={selection.options} />
      <BundleRelationships selectedVariant={selection.selectedVariant} />
      <BuyButtons
        selectedVariant={toBuyButtonVariant(selection.selectedVariant)}
        title={title}
        handle={handle}
        featuredImage={featuredImage}
        availableForSale={availableForSale}
      />
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
