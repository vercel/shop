import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ProductSchema } from "@/components/product-detail/schema";
import {
  ProductReviewsSection,
  ProductReviewsSectionSkeleton,
} from "@/components/product/product-reviews-section";
import {
  RelatedProductsSection,
  RelatedProductsSectionSkeleton,
} from "@/components/product/related-products-section";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";
import type { ProductDetails, ProductReviews } from "@/lib/types";

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

function ProductPageFallback({
  reviewsTitle,
  recommendationsTitle,
}: {
  reviewsTitle: string;
  recommendationsTitle: string;
}) {
  return (
    <Sections>
      <div className="grid gap-10 lg:grid-cols-10 lg:items-start lg:gap-5">
        <div className="lg:col-span-5 lg:sticky lg:top-20">
          {/* Mobile: single full-bleed square + pagination space */}
          <div className="grid gap-5 lg:hidden -mx-5">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="h-1.5" />
          </div>
          {/* Desktop: thumbnail column + featured image */}
          <div className="hidden lg:flex gap-2.5">
            <div className="flex flex-col gap-2.5 w-20 shrink-0">
              {["a", "b", "c", "d"].map((key) => (
                <Skeleton key={key} className="aspect-square w-full rounded-none" />
              ))}
            </div>
            <Skeleton className="flex-1 aspect-square rounded-none" />
          </div>
        </div>
        <div className="grid gap-10 lg:col-span-5">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      <ProductReviewsSectionSkeleton title={reviewsTitle} />
      <RelatedProductsSectionSkeleton title={recommendationsTitle} />
    </Sections>
  );
}

async function ProductContent({
  productPromise,
  reviewsPromise,
  locale,
  variantIdPromise,
}: {
  productPromise: Promise<ProductDetails>;
  reviewsPromise: Promise<ProductReviews>;
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

      <Sections>
        <ProductDetailSection
          product={product}
          reviewsPromise={reviewsPromise}
          locale={locale}
          variantIdPromise={variantIdPromise}
        />
        <ProductReviewsSection
          handle={handle}
          title={title}
          description={product.description}
          locale={locale}
        />
        <RelatedProductsSection handle={handle} locale={locale} />
      </Sections>
    </>
  );
}

export async function ProductDetailPage({
  productPromise,
  reviewsPromise,
  locale,
  variantIdPromise,
}: {
  productPromise: Promise<ProductDetails>;
  reviewsPromise: Promise<ProductReviews>;
  locale: Locale;
  variantIdPromise: Promise<string | undefined>;
}) {
  const t = await getTranslations("product");
  return (
    <Page className="pt-0">
      <Container className="bg-background">
        <Suspense
          fallback={
            <ProductPageFallback
              reviewsTitle={t("reviews.title")}
              recommendationsTitle={t("recommendations")}
            />
          }
        >
          <ProductContent
            productPromise={productPromise}
            reviewsPromise={reviewsPromise}
            locale={locale}
            variantIdPromise={variantIdPromise}
          />
        </Suspense>
      </Container>
    </Page>
  );
}
