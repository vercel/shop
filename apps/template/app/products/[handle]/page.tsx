import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/pdp/product-detail-page";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getProduct } from "@/lib/shopify/operations/products";

const PLACEHOLDER_HANDLE = "__placeholder__";

async function buildProductMetadata(
  handle: string,
  locale: string,
  canonicalPath: string,
): Promise<Metadata> {
  const product = await getProduct(handle, locale).catch(() => notFound());
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

export async function generateStaticParams() {
  return [{ handle: PLACEHOLDER_HANDLE }];
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  if (handle === PLACEHOLDER_HANDLE) return {};

  return buildProductMetadata(handle, locale, `/products/${handle}`);
}

export const unstable_instant = {
  prefetch: "runtime",
  samples: [
    {
      params: { handle: "__placeholder__" },
      searchParams: { variantId: "1" },
      cookies: [{ name: "shopify_cartId", value: null }],
    },
  ],
};

export const unstable_prefetch = 'runtime'

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/products/[handle]">) {
  const locale = await getLocale();
  const handlePromise = params.then(({ handle }) => {
    if (handle === PLACEHOLDER_HANDLE) notFound();
    return handle;
  });

  const productPromise = handlePromise.then((handle) =>
    getProduct(handle, locale).catch(() => notFound()),
  );

  const variantIdPromise = searchParams.then(
    (sp) => (sp?.variantId as string | undefined),
  );

  return (
    <ProductDetailPage
      productPromise={productPromise}
      locale={locale}
      variantIdPromise={variantIdPromise}
    />
  );
}
