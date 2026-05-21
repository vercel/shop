import { Suspense } from "react";

import { BuyButtons } from "@/components/product-detail/buy-buttons";
import {
  ProductInfoDescription,
  ProductInfoHeader,
  ProductInfoOptions,
  ProductInfoSkeleton,
} from "@/components/product-detail/product-info";
import {
  ColorImageCarouselItems,
  ColorImageGrid,
  ProductMedia,
  ProductMediaSkeleton,
} from "@/components/product-detail/product-media";
import { ProductSchema } from "@/components/product-detail/schema";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { siteConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";
import {
  computeSelection,
  getSharedImages,
  hasColorImagePartitioning,
  isSelectionEager,
  type ProductSelection,
} from "@/lib/product";
import type { ProductDetails } from "@/lib/types";

export function ProductDetailSection({
  productPromise,
  selectionPromise,
  locale,
}: {
  productPromise: Promise<ProductDetails>;
  selectionPromise: Promise<ProductSelection>;
  locale: Locale;
}) {
  return (
    <Suspense fallback={<ProductDetailSectionSkeleton />}>
      <ProductDetailSectionContent
        productPromise={productPromise}
        selectionPromise={selectionPromise}
        locale={locale}
      />
    </Suspense>
  );
}

async function ProductDetailSectionContent({
  productPromise,
  selectionPromise,
  locale,
}: {
  productPromise: Promise<ProductDetails>;
  selectionPromise: Promise<ProductSelection>;
  locale: Locale;
}) {
  const product = await productPromise;
  const eager = isSelectionEager(product);

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
        <ProductMediaRegion product={product} eager={eager} selectionPromise={selectionPromise} />
        <ProductInfoRegion
          product={product}
          eager={eager}
          selectionPromise={selectionPromise}
          locale={locale}
        />
      </div>
    </>
  );
}

function ProductMediaRegion({
  product,
  eager,
  selectionPromise,
}: {
  product: ProductDetails;
  eager: boolean;
  selectionPromise: Promise<ProductSelection>;
}) {
  if (eager || !hasColorImagePartitioning(product.options, product.variants)) {
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
    <Suspense fallback={<ProductMediaSkeleton className="lg:col-span-6" />}>
      <ResolvedProductMedia product={product} selectionPromise={selectionPromise} />
    </Suspense>
  );
}

async function ResolvedProductMedia({
  product,
  selectionPromise,
}: {
  product: ProductDetails;
  selectionPromise: Promise<ProductSelection>;
}) {
  const { colorImages } = await selectionPromise;
  return (
    <ProductMedia
      otherImages={getSharedImages(product.images, product.options, product.variants)}
      videos={product.videos}
      title={product.title}
      className="lg:col-span-6"
      desktopSlot={
        colorImages.length > 0 ? (
          <ColorImageGrid images={colorImages} title={product.title} />
        ) : null
      }
      mobileSlot={
        colorImages.length > 0 ? (
          <ColorImageCarouselItems images={colorImages} title={product.title} />
        ) : null
      }
    />
  );
}

function ProductInfoRegion({
  product,
  eager,
  selectionPromise,
  locale,
}: {
  product: ProductDetails;
  eager: boolean;
  selectionPromise: Promise<ProductSelection>;
  locale: Locale;
}) {
  if (eager) {
    return (
      <ProductInfoColumn
        product={product}
        selection={computeSelection(product, undefined)}
        locale={locale}
      />
    );
  }

  return (
    <Suspense fallback={<ProductInfoSkeleton className="lg:sticky lg:top-20 lg:col-span-4" />}>
      <ResolvedProductInfo product={product} selectionPromise={selectionPromise} locale={locale} />
    </Suspense>
  );
}

async function ResolvedProductInfo({
  product,
  selectionPromise,
  locale,
}: {
  product: ProductDetails;
  selectionPromise: Promise<ProductSelection>;
  locale: Locale;
}) {
  const selection = await selectionPromise;
  return <ProductInfoColumn product={product} selection={selection} locale={locale} />;
}

function ProductInfoColumn({
  product,
  selection,
  locale,
}: {
  product: ProductDetails;
  selection: ProductSelection;
  locale: Locale;
}) {
  return (
    <div className="grid gap-10 lg:sticky lg:top-20 lg:col-span-4">
      <ProductInfoHeader
        selectedVariant={selection.selectedVariant}
        title={product.title}
        locale={locale}
      />
      <ProductInfoOptions
        variants={product.variants}
        options={product.options}
        selectedOptions={selection.selectedOptions}
        handle={product.handle}
      />
      <BuyButtons
        selectedVariant={selection.selectedVariant}
        title={product.title}
        handle={product.handle}
        featuredImage={product.featuredImage}
        availableForSale={product.availableForSale}
      />
      <ProductInfoDescription descriptionHtml={product.descriptionHtml} />
    </div>
  );
}

export function ProductDetailSectionSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-10 lg:items-start lg:gap-5">
      <ProductMediaSkeleton className="lg:col-span-6" />
      <ProductInfoSkeleton className="lg:sticky lg:top-20 lg:col-span-4" />
    </div>
  );
}
