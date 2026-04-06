import { Suspense } from "react";

import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/product/breadcrumb";
import { ImageGrid } from "@/components/product/pdp/image-grid";
import { MobileBuyButtons } from "@/components/product/pdp/mobile-buy-buttons";
import { MobileCarousel } from "@/components/product/pdp/mobile-carousel";
import {
  ProductInfo,
  ProductInfoDescription,
  ProductInfoHeader,
  ProductInfoOptions,
} from "@/components/product/pdp/product-info";
import {
  computeInitialSelectedOptions,
  getImagesForSelectedColor,
  resolveSelectedVariant,
} from "@/components/product/pdp/variants";
import { Recommendations } from "@/components/product/recommendations";
import { ProductSchema } from "@/components/product/schema";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { siteConfig } from "@/lib/config";
import type { Locale } from "@/lib/i18n";
import type { ProductDetails } from "@/lib/types";

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

export async function ProductDetailPage({
  product,
  locale,
  variantId,
}: {
  product: ProductDetails;
  locale: Locale;
  variantId?: string;
}) {
  const { handle, title, featuredImage, images, videos, variants, options, descriptionHtml } =
    product;

  const selectedOptions = computeInitialSelectedOptions(variants, variantId);
  const selectedVariant = resolveSelectedVariant(variants, selectedOptions);
  const filteredImages = getImagesForSelectedColor(images, options, variants, selectedOptions);

  const buyButtonProps = {
    selectedVariant,
    title,
    handle,
    featuredImage,
    availableForSale: product.availableForSale,
  };

  return (
    <Container className="bg-background">
      

      <div className="mt-16">
        <Recommendations handle={handle} locale={locale} />
      </div>
    </Container>
  );
}
