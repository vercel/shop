"use cache";

import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { getLocale } from "@/lib/params";

import { buildProductMetadata, getProductDetails } from "../shared";

export async function generateStaticParams() {
  return [{ handle: "__placeholder__", variantId: "__placeholder__" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]/[variantId]">): Promise<Metadata> {
  const [{ handle, variantId }, locale] = await Promise.all([params, getLocale()]);

  if (handle === "__placeholder__") {
    notFound();
  }

  return buildProductMetadata(handle, locale, `/products/${handle}?variantId=${variantId}`);
}

export default async function ProductVariantPage({
  params,
}: PageProps<"/products/[handle]/[variantId]">) {
  cacheLife("max");
  const [{ handle, variantId }, locale] = await Promise.all([params, getLocale()]);
  cacheTag("products", `product:${handle}`, `product-variant:${handle}:${variantId}`);

  if (handle === "__placeholder__") {
    notFound();
  }

  const product = await getProductDetails(handle, locale);

  return <ProductDetailPage product={product} locale={locale} variantId={variantId} />;
}
