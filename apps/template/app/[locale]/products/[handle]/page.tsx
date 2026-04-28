import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product-detail/product-detail-page";
import { getLocale } from "@/lib/params";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import { getProduct, getProducts } from "@/lib/shopify/operations/products";

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
    alternates: await buildAlternates({
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
  const { products } = await getProducts({ limit: 1 });
  const first = products[0];
  return first ? [{ handle: first.handle }] : [];
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  if (handle === PLACEHOLDER_HANDLE) return {};

  return buildProductMetadata(handle, locale, `/products/${handle}`);
}

export const unstable_instant = {
  samples: [
    {
      params: { locale: "en-US", handle: "__placeholder__" },
      searchParams: { variantId: "1" },
      cookies: [{ name: "shopify_cartId", value: null }],
      headers: [["x-vercel-ip-postal-code", null]],
    },
  ],
};

export const unstable_prefetch = "force-runtime";

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/[locale]/products/[handle]">) {
  const locale = await getLocale();
  const handlePromise = params.then(({ handle }) => {
    if (handle === PLACEHOLDER_HANDLE) notFound();
    return handle;
  });

  const productPromise = handlePromise.then((handle) =>
    getProduct(handle, locale).catch(() => notFound()),
  );

  const variantIdPromise = searchParams.then((sp) => sp?.variantId as string | undefined);

  return (
    <ProductDetailPage
      productPromise={productPromise}
      locale={locale}
      variantIdPromise={variantIdPromise}
    />
  );
}
