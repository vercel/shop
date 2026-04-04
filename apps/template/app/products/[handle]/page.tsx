import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { ProductDetailSkeleton } from "@/components/product/pdp/product-detail-skeleton";
import type { Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/params";

import { buildProductMetadata, getProductDetails } from "./shared";

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  return buildProductMetadata(handle, locale, `/products/${handle}`);
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductContent handle={handle} locale={locale} />
    </Suspense>
  );
}

async function ProductContent({ handle, locale }: { handle: string; locale: Locale }) {
  const product = await getProductDetails(handle, locale);

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} locale={locale} />;
}
