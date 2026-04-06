import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getProduct } from "@/lib/shopify/operations/products";

async function getProductDetails(handle: string, locale: string) {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product:${handle}`);
  const product = await getProduct(handle, locale);

  if (!product) {
    notFound();
  }

  return product;
}

export async function generateStaticParams() {
  return [{ handle: "__placeholder__" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  if (handle === "__placeholder__") {
    notFound();
  }

  const product = await getProductDetails(handle, locale);
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
      pathname: `/products/${handle}`,
    }),
    openGraph: buildOpenGraph({
      title: product.seo.title,
      description: product.seo.description,
      url: `/products/${handle}`,
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

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  if (handle === "__placeholder__") {
    notFound();
  }

  const product = await getProductDetails(handle, locale);

  return <ProductDetailPage product={product} locale={locale} />;
}
