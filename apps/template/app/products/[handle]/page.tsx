import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/params";

import { getProduct } from "@/lib/shopify/operations/products";

import { buildProductMetadata } from "./shared";

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  return buildProductMetadata(handle, locale, `/products/${handle}`);
}

async function CachedProductPage({ handle, locale }: { handle: string; locale: Locale }) {
  "use cache";
  cacheLife("max");
  cacheTag("products", `product-${handle}`);

  let product;
  try {
    product = await getProduct(handle, locale);
  } catch {
    notFound();
  }

  return <ProductDetailPage product={product} locale={locale} />;
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  return <CachedProductPage handle={handle} locale={locale} />;
}
