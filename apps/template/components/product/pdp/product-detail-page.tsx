import { Container } from "@/components/layout/container";
import { Breadcrumb } from "@/components/product/breadcrumb";
import { BuyButtons } from "@/components/product/pdp/buy-buttons";
import {
  ProductInfoDescription,
  ProductInfoHeader,
  ProductInfoOptions,
} from "@/components/product/pdp/product-info";
import { ProductMedia } from "@/components/product/pdp/product-media";
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
      <ProductBreadcrumbSchema title={title} handle={handle} />

      <div className="space-y-8">
        <Breadcrumb title={title} handle={handle} />

        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 space-y-8 lg:space-y-0">
          <ProductMedia images={filteredImages} videos={videos} title={title} />

          <div className="space-y-8 lg:sticky lg:top-20">
            <ProductInfoHeader selectedVariant={selectedVariant} title={title} locale={locale} />
            <ProductInfoOptions
              variants={variants}
              options={options}
              selectedOptions={selectedOptions}
              handle={handle}
            />
            <BuyButtons {...buyButtonProps} />
            <ProductInfoDescription descriptionHtml={descriptionHtml} />
          </div>
        </div>
      </div>

      <div className="mt-16">
        <Recommendations handle={handle} locale={locale} />
      </div>
    </Container>
  );
}
