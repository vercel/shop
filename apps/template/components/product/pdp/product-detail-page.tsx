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
import { PdpVariantStateProvider } from "@/components/product/pdp/variant-state";
import { computeInitialSelectedOptions } from "@/components/product/pdp/variants";
import { Recommendations } from "@/components/product/recommendations";
import { ProductSchema } from "@/components/product/schema";
import { BreadcrumbSchema } from "@/components/schema/breadcrumb-schema";
import { siteConfig } from "@/lib/config";
import { defaultLocale, type Locale } from "@/lib/i18n";
import { getMegamenuData } from "@/lib/shopify/operations/megamenu";
import type { Category, ProductDetails } from "@/lib/types";
import { buildProductCategoryPath } from "@/lib/utils/breadcrumbs";

async function ProductBreadcrumbSchema({
  category,
  collectionHandles,
  title,
  handle,
  locale,
}: {
  category?: Category | null;
  collectionHandles: string[];
  title: string;
  handle: string;
  locale: Locale;
}) {
  const menu = await getMegamenuData(locale);
  let categorySegments = buildProductCategoryPath(
    category,
    menu,
    collectionHandles,
  );

  if (categorySegments.length === 0 && locale !== defaultLocale) {
    const fallbackMenu = await getMegamenuData(defaultLocale);
    categorySegments = buildProductCategoryPath(
      category,
      fallbackMenu,
      collectionHandles,
    );
  }

  return (
    <BreadcrumbSchema
      items={[
        { name: siteConfig.name, path: "/" },
        ...categorySegments.map((seg) => ({
          name: seg.label,
          path: seg.href || "/",
        })),
        {
          name: title,
          path: `/products/${handle}`,
        },
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
  const {
    handle,
    title,
    featuredImage,
    images,
    videos,
    variants,
    options,
    descriptionHtml,
    category,
    collectionHandles,
  } = product;

  const initialSelectedOptions = computeInitialSelectedOptions(
    variants,
    variantId,
  );
  const imageProps = { images, videos, title, options, variants };
  const buyButtonProps = { variants, title, handle, featuredImage };

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
      <Suspense>
        <ProductBreadcrumbSchema
          category={category}
          collectionHandles={collectionHandles}
          title={title}
          handle={handle}
          locale={locale}
        />
      </Suspense>

      <PdpVariantStateProvider initialSelectedOptions={initialSelectedOptions}>
        {/* Desktop Layout — breadcrumbs span full width, then 2-column (50/50 images + info) */}
        <div className="hidden lg:block space-y-8">
          <Breadcrumb collectionHandles={collectionHandles} />
          <div className="grid grid-cols-2 items-start gap-8">
            <div>
              <ImageGrid {...imageProps} />
            </div>

            <div className="space-y-8">
              <ProductInfoHeader
                variants={variants}
                title={title}
                locale={locale}
              />
              <ProductInfoOptions variants={variants} options={options} />
              <MobileBuyButtons {...buyButtonProps} />
              <ProductInfoDescription descriptionHtml={descriptionHtml} />
            </div>
          </div>
        </div>

        {/* Mobile Layout — breadcrumbs first, then gallery, then product info */}
        <div className="lg:hidden space-y-8">
          <Breadcrumb collectionHandles={collectionHandles} />

          <MobileCarousel {...imageProps} />

          <MobileBuyButtons {...buyButtonProps} />

          <ProductInfo
            variants={variants}
            options={options}
            title={title}
            descriptionHtml={descriptionHtml}
            locale={locale}
            size="sm"
          />
        </div>
      </PdpVariantStateProvider>

      <div className="mt-16">
        <Recommendations handle={handle} locale={locale} />
      </div>
    </Container>
  );
}
