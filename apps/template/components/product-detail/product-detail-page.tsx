import { Suspense } from "react";

import { ProductSchema } from "@/components/product-detail/schema";
import { RelatedProductsSection } from "@/components/product/related-products-section";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";
import type { ProductDetails } from "@/lib/types";

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

function ProductPageFallback() {
  return (
    <div className="grid gap-10">
      <div className="grid gap-10 lg:grid-cols-10 lg:items-start lg:gap-5">
        <div className="lg:col-span-6">
          {/* Mobile: single full-bleed square + pagination space */}
          <div className="grid gap-5 lg:hidden -mx-5">
            <Skeleton className="aspect-square w-full" />
            <div className="h-1.5" />
          </div>
          {/* Desktop: 2×2 grid */}
          <div className="hidden lg:grid grid-cols-2 gap-2.5">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="aspect-square w-full" />
          </div>
        </div>
        <div className="grid gap-10 lg:sticky lg:top-20 lg:col-span-4">
          <div className="grid gap-2.5">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="grid gap-2.5">
            <Skeleton className="h-4 w-20" />
            <div className="grid grid-cols-5 gap-2.5">
              {["a", "b", "c", "d"].map((k) => (
                <Skeleton key={k} className="aspect-square" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="h-12 rounded-lg bg-shop" />
            <div className="h-12 rounded-lg bg-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function ProductContent({
  productPromise,
  locale,
  variantIdPromise,
}: {
  productPromise: Promise<ProductDetails>;
  locale: Locale;
  variantIdPromise: Promise<string | undefined>;
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

      <div className="grid gap-10">
        <ProductDetailSection
          product={product}
          locale={locale}
          variantIdPromise={variantIdPromise}
        />
        <RelatedProductsSection handle={handle} locale={locale} />
      </div>
    </>
  );
}

export async function ProductDetailPage({
  productPromise,
  locale,
  variantIdPromise,
}: {
  productPromise: Promise<ProductDetails>;
  locale: Locale;
  variantIdPromise: Promise<string | undefined>;
}) {
  return (
    <Container className="bg-background pt-0">
      <Suspense fallback={<ProductPageFallback />}>
        <ProductContent
          productPromise={productPromise}
          locale={locale}
          variantIdPromise={variantIdPromise}
        />
      </Suspense>
    </Container>
  );
}
