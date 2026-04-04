import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { ProductDetailSkeleton } from "@/components/product/pdp/product-detail-skeleton";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/params";

import { buildProductMetadata, getProductDetails } from "../shared";

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

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductVariantContent handle={handle} variantId={variantId} locale={locale} />
    </Suspense>
  );
}

async function ProductVariantContent({
  handle,
  variantId,
  locale,
}: {
  handle: string;
  variantId: string;
  locale: Locale;
}) {
  const product = await getProductDetails(handle, locale);

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} locale={locale} variantId={variantId} />;
}
