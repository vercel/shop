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

      {/* Desktop Layout — breadcrumbs span full width, then 2-column (50/50 images + info) */}
      <div className="hidden lg:block space-y-8">
        <Breadcrumb title={title} handle={handle} />
        <div className="grid grid-cols-2 items-start gap-4">
          <div>
            <ImageGrid images={filteredImages} videos={videos} title={title} />
          </div>

          <div className="space-y-8">
            <ProductInfoHeader selectedVariant={selectedVariant} title={title} locale={locale} />
            <ProductInfoOptions variants={variants} options={options} selectedOptions={selectedOptions} handle={handle} />
            <MobileBuyButtons {...buyButtonProps} />
            <ProductInfoDescription descriptionHtml={descriptionHtml} />
          </div>
        </div>
      </div>

      {/* Mobile Layout — breadcrumbs first, then gallery, then product info */}
      <div className="lg:hidden space-y-8">
        <Breadcrumb title={title} handle={handle} />

        <MobileCarousel images={filteredImages} videos={videos} title={title} />

        <MobileBuyButtons {...buyButtonProps} />

        <ProductInfo
          variants={variants}
          options={options}
          selectedVariant={selectedVariant}
          selectedOptions={selectedOptions}
          handle={handle}
          title={title}
          descriptionHtml={descriptionHtml}
          locale={locale}
          size="sm"
        />
      </div>

      <div className="mt-16">
        <Recommendations handle={handle} locale={locale} />
      </div>
    </Container>
  );
}
