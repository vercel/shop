import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { getLocale } from "@/lib/params";

import { buildProductMetadata, getProductDetails } from "../shared";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]/[variantId]">): Promise<Metadata> {
  const [{ handle, variantId }, locale] = await Promise.all([params, getLocale()]);

  return buildProductMetadata(handle, locale, `/products/${handle}?variantId=${variantId}`);
}

export default async function ProductVariantPage({
  params,
}: PageProps<"/products/[handle]/[variantId]">) {
  const [{ handle, variantId }, locale] = await Promise.all([params, getLocale()]);

  const product = await getProductDetails(handle, locale);

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} locale={locale} variantId={variantId} />;
}
