import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { ProductDetailSkeleton } from "@/components/product/pdp/product-detail-skeleton";
import { getLocale } from "@/lib/params";

import { buildProductMetadata, getProductDetails } from "../shared";

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]/[variantId]">): Promise<Metadata> {
  const [{ handle, variantId }, locale] = await Promise.all([params, getLocale()]);

  return buildProductMetadata(handle, locale, `/products/${handle}?variantId=${variantId}`);
}

export default function ProductVariantPage({
  params,
}: PageProps<"/products/[handle]/[variantId]">) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductVariantContent params={params} />
    </Suspense>
  );
}

async function ProductVariantContent({
  params,
}: {
  params: PageProps<"/products/[handle]/[variantId]">["params"];
}) {
  const [{ handle, variantId }, locale] = await Promise.all([params, getLocale()]);
  const product = await getProductDetails(handle, locale);

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} locale={locale} variantId={variantId} />;
}
