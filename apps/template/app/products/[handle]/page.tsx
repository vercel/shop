import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { getLocale } from "@/lib/params";

import { getProduct } from "@/lib/shopify/operations/products";

import { buildProductMetadata } from "./shared";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const [{ handle }, sp, locale] = await Promise.all([params, searchParams, getLocale()]);

  const variantId = sp.variantId as string | undefined;
  const canonicalPath = variantId
    ? `/products/${handle}?variantId=${variantId}`
    : `/products/${handle}`;

  return buildProductMetadata(handle, locale, canonicalPath);
}

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/products/[handle]">) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  let product;
  try {
    product = await getProduct(handle, locale);
  } catch {
    notFound();
  }

  return (
    <ProductDetailPage
      product={product}
      locale={locale}
      searchParamsPromise={searchParams}
    />
  );
}
