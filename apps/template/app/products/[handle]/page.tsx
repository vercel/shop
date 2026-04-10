import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { getLocale } from "@/lib/params";

import { getProduct } from "@/lib/shopify/operations/products";

import { buildProductMetadata } from "./shared";

export const unstable_instant = {
  prefetch: "static" as const,
  samples: [
    {
      cookies: [{ name: "shopify_cartId", value: null }],
      searchParams: { variantId: null },
    },
  ],
};

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  return buildProductMetadata(handle, locale, `/products/${handle}`);
}

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/products/[handle]">) {
  const locale = await getLocale();
  const handlePromise = params.then(({ handle }) => handle);

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
