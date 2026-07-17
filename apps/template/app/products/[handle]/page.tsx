import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  ProductDetailSection,
  ProductDetailSectionSkeleton,
} from "@/components/product-detail/product-detail-section";
import {
  RelatedProductsSection,
  RelatedProductsSectionSkeleton,
} from "@/components/product/related-products-section";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { getLocale } from "@/lib/params";
import {
  defaultSelectedOptions,
  parseSelectedOptions,
  type SelectedOptions,
  toSelectedOptionList,
} from "@/lib/product";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import {
  getCatalogProducts,
  getProduct,
  getProductVariant,
} from "@/lib/shopify/operations/products";
import type { ProductVariant } from "@/lib/types";
import { shopConfig } from "@/shop.config";

const PLACEHOLDER_HANDLE = "__placeholder__";

async function buildProductMetadata(
  handle: string,
  locale: string,
  canonicalPath: string,
): Promise<Metadata> {
  const product = await getProduct({ handle, locale });
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

export async function generateStaticParams() {
  try {
    const { products } = await getCatalogProducts({ limit: 1 });
    const first = products[0];
    return [{ handle: first ? first.handle : PLACEHOLDER_HANDLE }];
  } catch {
    return [{ handle: PLACEHOLDER_HANDLE }];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  if (handle === PLACEHOLDER_HANDLE) return {};

  return buildProductMetadata(handle, locale, `/products/${handle}`);
}

export default function ProductPage(props: PageProps<"/products/[handle]">) {
  return (
    <Page className="pt-0">
      <Container className="bg-background">
        <Suspense fallback={<ProductPageFallback />}>
          <ProductPageContent {...props} />
        </Suspense>
      </Container>
    </Page>
  );
}

async function ProductPageContent({ params, searchParams }: PageProps<"/products/[handle]">) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);
  if (handle === PLACEHOLDER_HANDLE) notFound();

  const product = await getProduct({ handle, locale });
  if (!product) notFound();

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
      return getProductVariant({
        handle,
        locale,
        selectedOptions: toSelectedOptionList({
          ...defaultSelectedOptions(product),
          ...parseSelectedOptions(product.options, resolvedSearchParams ?? {}),
        }),
      });
    },
  );

  return (
    <Sections>
      <ProductDetailSection
        product={product}
        selectedOptionsPromise={selectedOptionsPromise}
        variantPromise={variantPromise}
        locale={locale}
      />
      {shopConfig.pdp.relatedProducts.enabled ? (
        <RelatedProductsSection handle={handle} limit={4} locale={locale} />
      ) : null}
    </Sections>
  );
}

function ProductPageFallback() {
  return (
    <Sections>
      <ProductDetailSectionSkeleton />
      {shopConfig.pdp.relatedProducts.enabled ? <RelatedProductsSectionSkeleton limit={4} /> : null}
    </Sections>
  );
}
