import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { getLocale } from "@/lib/params";

import { buildProductMetadata, getProductDetails } from "./shared";

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  return buildProductMetadata(handle, locale, `/products/${handle}`);
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  const product = await getProductDetails(handle, locale);

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} locale={locale} />;
}
