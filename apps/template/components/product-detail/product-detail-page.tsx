import { Suspense } from "react";

import {
  aspectRatioClasses,
  type ProductCardAspectRatio,
} from "@/components/product-card/components";
import { ProductSchema } from "@/components/product-detail/schema";
import { RelatedProductsSection } from "@/components/product/related-products-section";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";
import type { ProductDetails } from "@/lib/types";
import { cn } from "@/lib/utils";

import { ProductDetailSection } from "./product-detail-section";

function ProductBreadcrumbSchema({ title, handle }: { title: string; handle: string }) {
  return (
    <BreadcrumbSchema
      items={[
        { name: siteConfig.name, path: "/" },
        { name: title, path: `/products/${handle}` },
      ]}
    />
  );
}

function ProductPageFallback({ aspectRatio }: { aspectRatio: ProductCardAspectRatio }) {
  const tile = cn("w-full rounded-none", aspectRatioClasses);
  return (
    <Sections>
      <div className="grid gap-10 lg:grid-cols-10 lg:items-start lg:gap-5">
        <div className="lg:col-span-6">
          <div className="grid gap-5 lg:hidden -mx-5">
            <Skeleton data-aspect-ratio={aspectRatio} className={tile} />
            <div className="h-1.5" />
          </div>
          <div className="hidden lg:grid grid-cols-2 gap-2.5">
            <Skeleton data-aspect-ratio={aspectRatio} className={tile} />
            <Skeleton data-aspect-ratio={aspectRatio} className={tile} />
            <Skeleton data-aspect-ratio={aspectRatio} className={tile} />
            <Skeleton data-aspect-ratio={aspectRatio} className={tile} />
          </div>
        </div>
        <div className="grid gap-10 lg:sticky lg:top-20 lg:col-span-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </Sections>
  );
}

async function ProductContent({
  productPromise,
  locale,
  variantIdPromise,
  aspectRatio,
}: {
  productPromise: Promise<ProductDetails>;
  locale: Locale;
  variantIdPromise: Promise<string | undefined>;
  aspectRatio: ProductCardAspectRatio;
}) {
  const product = await productPromise;
  const { handle, title } = product;

  return (
    <>
      <ProductSchema
        product={{
          id: product.id,
          handle,
          title,
          description: product.description,
          images: product.images,
          manufacturerName: product.manufacturerName,
          currencyCode: product.currencyCode,
          priceRange: product.priceRange,
          variants: product.variants,
          availableForSale: product.availableForSale,
        }}
      />
      <ProductBreadcrumbSchema title={title} handle={handle} />

      <Sections>
        <ProductDetailSection
          product={product}
          locale={locale}
          variantIdPromise={variantIdPromise}
          aspectRatio={aspectRatio}
        />
        <RelatedProductsSection handle={handle} locale={locale} />
      </Sections>
    </>
  );
}

export async function ProductDetailPage({
  productPromise,
  locale,
  variantIdPromise,
  aspectRatio = "square",
}: {
  productPromise: Promise<ProductDetails>;
  locale: Locale;
  variantIdPromise: Promise<string | undefined>;
  aspectRatio?: ProductCardAspectRatio;
}) {
  return (
    <Page className="pt-0">
      <Container className="bg-background">
        <Suspense fallback={<ProductPageFallback aspectRatio={aspectRatio} />}>
          <ProductContent
            productPromise={productPromise}
            locale={locale}
            variantIdPromise={variantIdPromise}
            aspectRatio={aspectRatio}
          />
        </Suspense>
      </Container>
    </Page>
  );
}
