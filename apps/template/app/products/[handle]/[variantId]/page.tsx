import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { getLocale } from "@/lib/params";

import { buildProductMetadata, getProductDetails } from "../shared";

// export async function generateMetadata({
//   params,
// }: PageProps<"/products/[handle]/[variantId]">): Promise<Metadata> {
//   const [{ handle, variantId }, locale] = await Promise.all([params, getLocale()]);

//   if (handle === "__placeholder__") {
//     notFound();
//   }

//   return buildProductMetadata(handle, locale, `/products/${handle}?variantId=${variantId}`);
// }

async function Render({ params }: Partial<PageProps<"/products/[handle]/[variantId]">>) {
  const [{ handle, variantId }, locale] = await Promise.all([params!, getLocale()]);

  const product = await getProductDetails(handle, locale);

  return <ProductDetailPage product={product} locale={locale} variantId={variantId} />;
}

export default async function ProductVariantPage({
  params,
}: PageProps<"/products/[handle]/[variantId]">) {
  return <Suspense fallback={<div>Loading...</div>}><Render params={params} /></Suspense>
}

export const unstable_instant = { prefetch: 'static' }
