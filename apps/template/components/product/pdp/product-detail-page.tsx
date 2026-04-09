import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { Recommendations } from "@/components/product/recommendations";
import { ProductSchema } from "@/components/product/schema";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { Skeleton } from "@/components/ui/skeleton";
import { siteConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";
import type { ProductDetails } from "@/lib/types";

import { VariantSection } from "./variant-section";

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

function VariantSectionFallback() {
  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 space-y-8 lg:space-y-0">
      <div className="space-y-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
      </div>
      <div className="space-y-8 lg:sticky lg:top-20">
        <div>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-24 mt-3" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <div className="grid grid-cols-5 gap-3">
            {["a", "b", "c", "d"].map((k) => (
              <Skeleton key={k} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-lg" />
          <Skeleton className="h-11 flex-1 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailPage({
  product,
  locale,
}: {
  product: ProductDetails;
  locale: Locale;
}) {
  const { handle, title } = product;

  return (
    <Container className="bg-background">
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

      <div className="space-y-8">
        <Suspense fallback={<VariantSectionFallback />}>
          <VariantSection product={product} locale={locale} />
        </Suspense>
      </div>

      <div className="mt-16">
        <Recommendations handle={handle} locale={locale} />
      </div>
    </Container>
  );
}
