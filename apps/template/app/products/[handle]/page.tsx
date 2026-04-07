import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { getLocale } from "@/lib/params";

import { getProduct } from "@/lib/shopify/operations/products";

import { buildProductMetadata } from "./shared";

export async function generateStaticParams() {
  return [{ handle: "__placeholder__" }];
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  if (handle === "__placeholder__") {
    notFound();
  }

  return buildProductMetadata(handle, locale, `/products/${handle}`);
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  if (handle === "__placeholder__") {
    notFound();
  }

  const product = await getProduct(handle, locale);

  return <ProductDetailPage product={product} locale={locale} />;
}
