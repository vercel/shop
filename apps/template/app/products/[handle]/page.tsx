import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/pdp/product-detail-page";
import { getLocale } from "@/lib/params";

import { getProduct } from "@/lib/shopify/operations/products";

import { buildProductMetadata } from "./shared";

const PLACEHOLDER_HANDLE = "__placeholder__";

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
      params: { handle: "sample-product" },
      searchParams: { variantId: "1" },
      cookies: [{ name: "shopify_cartId", value: null }],
    },
  ],
};

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
