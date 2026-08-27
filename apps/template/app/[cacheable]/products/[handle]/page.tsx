import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductViewedTracker } from "@/components/analytics/trackers";
import { ProductDetailSection } from "@/components/product-detail/product-detail-section";
import { RelatedProductsSection } from "@/components/product/related-products-section";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { CACHEABLE_PRODUCT_HANDLES } from "@/lib/cacheable-product-handles";
import { shopConfig } from "@/lib/config";
import { getLocale } from "@/lib/params";
import {
  defaultSelectedOptions,
  parseSelectedOptions,
  type SelectedOptions,
  toSelectedOptionList,
} from "@/lib/product";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import {
  getProduct,
  getProductUncached,
  getProductVariant,
  getProductVariantUncached,
} from "@/lib/shopify/operations/products";
import type { ProductVariant } from "@/lib/types";

const PLACEHOLDER_HANDLE = "__placeholder__";

async function buildProductMetadata(
  cacheable: boolean,
  handle: string,
  locale: string,
  canonicalPath: string,
): Promise<Metadata> {
  const product = cacheable
    ? await getProduct({ handle, locale })
    : await getProductUncached({ handle, locale });
  if (!product) notFound();
  const images = product.featuredImage
    ? [
        {
          url: product.featuredImage.url,
          width: product.featuredImage.width,
          height: product.featuredImage.height,
          alt: product.featuredImage.altText,
        },
      ]
    : ["/og-default.png"];

  return {
    title: product.seo.title,
    description: product.seo.description,
    alternates: buildAlternates({
      pathname: canonicalPath,
    }),
    openGraph: buildOpenGraph({
      title: product.seo.title,
      description: product.seo.description,
      url: canonicalPath,
      images,
    }),
    twitter: {
      card: "summary_large_image",
      title: product.seo.title,
      description: product.seo.description,
      images,
    },
  };
}

export function generateStaticParams() {
  return CACHEABLE_PRODUCT_HANDLES.map((handle) => ({ cacheable: "1", handle }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[cacheable]/products/[handle]">): Promise<Metadata> {
  const [{ cacheable, handle }, locale] = await Promise.all([params, getLocale()]);

  if (handle === PLACEHOLDER_HANDLE) return {};

  const isCacheable = cacheable === "1";
  return buildProductMetadata(isCacheable, handle, locale, `/products/${handle}`);
}

export const instant = false;

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/[cacheable]/products/[handle]">) {
  const [{ cacheable, handle }, locale] = await Promise.all([params, getLocale()]);
  if (handle === PLACEHOLDER_HANDLE) notFound();

  const isCacheable = cacheable === "1";
  const product = isCacheable
    ? await getProduct({ handle, locale })
    : await getProductUncached({ handle, locale });
  if (!product) notFound();

  // Keep selection separate from the variant query so the static shell stays coherent and the picker never waits on Shopify.
  const selectedOptionsPromise: Promise<SelectedOptions> = searchParams.then(
    (resolvedSearchParams) => ({
      ...defaultSelectedOptions(product),
      ...parseSelectedOptions(product.options, resolvedSearchParams ?? {}),
    }),
  );
  const variantPromise: Promise<ProductVariant | undefined> = searchParams.then(
    async (resolvedSearchParams) => {
      if (
        Object.keys(parseSelectedOptions(product.options, resolvedSearchParams ?? {})).length === 0
      ) {
        return product.defaultVariant;
      }
      const variantParams = {
        handle,
        locale,
        selectedOptions: toSelectedOptionList({
          ...defaultSelectedOptions(product),
          ...parseSelectedOptions(product.options, resolvedSearchParams ?? {}),
        }),
      };
      return isCacheable
        ? getProductVariant(variantParams)
        : getProductVariantUncached(variantParams);
    },
  );

  return (
    <>
      <Suspense fallback={null}>
        <ProductViewedTracker product={product} variantPromise={variantPromise} />
      </Suspense>
      <Page className="pt-0">
        <Container className="bg-background">
          <Sections>
            <ProductDetailSection
              product={product}
              selectedOptionsPromise={selectedOptionsPromise}
              variantPromise={variantPromise}
              locale={locale}
            />
            {shopConfig.pdp.relatedProducts.isEnabled ? (
              <RelatedProductsSection
                cacheable={isCacheable}
                handle={handle}
                limit={4}
                locale={locale}
              />
            ) : null}
          </Sections>
        </Container>
      </Page>
    </>
  );
}
