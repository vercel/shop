import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/product/breadcrumb";
import { Recommendations } from "@/components/product/recommendations";
import { ProductSchema } from "@/components/product/schema";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { siteConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";
import type { ProductDetails } from "@/lib/types";

import { VariantContent } from "./variant-content";

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

export function ProductDetailPage({
  product,
  locale,
}: {
  product: ProductDetails;
  locale: Locale;
}) {
  const { handle, title, images, variants } = product;

  return (
    <Container className="bg-background">
      <Suspense>
        <ProductSchema
          product={{
            id: product.id,
            handle,
            title,
            description: product.description,
            images,
            manufacturerName: product.manufacturerName,
            currencyCode: product.currencyCode,
            priceRange: product.priceRange,
            variants,
            availableForSale: product.availableForSale,
          }}
        />
      </Suspense>
      <ProductBreadcrumbSchema title={title} handle={handle} />

      <div className="space-y-8">
        <Breadcrumb title={title} handle={handle} />

        <Suspense>
          <VariantContent product={product} locale={locale} />
        </Suspense>
      </div>

      <div className="mt-16">
        <Recommendations handle={handle} locale={locale} />
      </div>
    </Container>
  );
}
