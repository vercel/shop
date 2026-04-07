import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { getLocale } from "@/lib/params";

import { buildProductMetadata, getProductDetails } from "./shared";

export async function generateStaticParams() {
  return [{ handle: "__placeholder__" }];
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const [{ handle }, query, locale] = await Promise.all([params, searchParams, getLocale()]);

  if (handle === "__placeholder__") {
    notFound();
  }

  const variantId = typeof query.variantId === "string" ? query.variantId : undefined;
  const canonicalPath = variantId
    ? `/products/${handle}?variantId=${variantId}`
    : `/products/${handle}`;

  return buildProductMetadata(handle, locale, canonicalPath);
}

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/products/[handle]">) {
  const [{ handle }, query, locale] = await Promise.all([params, searchParams, getLocale()]);

  if (handle === "__placeholder__") {
    notFound();
  }

  const variantId = typeof query.variantId === "string" ? query.variantId : undefined;
  const product = await getProductDetails(handle, locale);

  return <ProductDetailPage product={product} locale={locale} variantId={variantId} />;
}
