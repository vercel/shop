import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { getLocale } from "@/lib/params";

import { buildProductMetadata, getProductDetails } from "./shared";

// export async function generateMetadata({
//   params,
// }: PageProps<"/products/[handle]">): Promise<Metadata> {
//   const [{ handle }, locale] = await Promise.all([params, getLocale()]);

//   if (handle === "__placeholder__") {
//     notFound();
//   }

//   return buildProductMetadata(handle, locale, `/products/${handle}`);
// }

async function Render({ params }: Partial<PageProps<"/products/[handle]">>) {
  const [{ handle }, locale] = await Promise.all([params!, getLocale()]);

  const product = await getProductDetails(handle, locale);

  return <ProductDetailPage product={product} locale={locale} />;
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  return <Suspense fallback={<div>Loading...</div>}><Render params={params} /></Suspense>
}

export const unstable_instant = { prefetch: 'static', samples: [
  { 
    cookies: [{ name: "shopify_cartId", value: "123456" }],
    params: { handle: "classic-tee" } },
] }
