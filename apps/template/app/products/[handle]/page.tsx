import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { ProductDetailSkeleton } from "@/components/product/pdp/product-detail-skeleton";
import { getLocale } from "@/lib/params";

import { buildProductMetadata, getProductDetails } from "./shared";

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  return buildProductMetadata(handle, locale, `/products/${handle}`);
}

export default function ProductPage({ params }: PageProps<"/products/[handle]">) {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

async function ProductContent({ params }: { params: PageProps<"/products/[handle]">["params"] }) {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);
  const product = await getProductDetails(handle, locale);

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} locale={locale} />;
}
