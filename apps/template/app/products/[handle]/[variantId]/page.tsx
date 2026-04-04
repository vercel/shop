import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
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
  const locale = await getLocale();
  const resolvedParams = params.then(({ handle, variantId }) => ({ handle, variantId }));
  const productPromise = resolvedParams.then(({ handle }) => getProductDetails(handle, locale));

  return (
    <ProductVariantContent
      productPromise={productPromise}
      paramsPromise={resolvedParams}
      locale={locale}
    />
  );
}

async function ProductVariantContent({
  productPromise,
  paramsPromise,
  locale,
}: {
  productPromise: Promise<Awaited<ReturnType<typeof getProductDetails>>>;
  paramsPromise: Promise<{ handle: string; variantId: string }>;
  locale: Awaited<ReturnType<typeof getLocale>>;
}) {
  const [product, { variantId }] = await Promise.all([productPromise, paramsPromise]);

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} locale={locale} variantId={variantId} />;
}
