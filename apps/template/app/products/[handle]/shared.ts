import type { Metadata } from "next";

import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getProduct } from "@/lib/shopify/operations/products";

export async function getProductDetails(handle: string, locale: string) {
  return getProduct(handle, locale);
}

export async function buildProductMetadata(
  handle: string,
  locale: string,
  canonicalPath: string,
): Promise<Metadata> {
  const product = await getProductDetails(handle, locale);
  if (!product) return {};
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
      type: "website",
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
