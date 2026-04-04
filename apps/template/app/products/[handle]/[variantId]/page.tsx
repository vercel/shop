import type { Metadata } from "next";

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
  const variantIdPromise = params.then(({ variantId }) => variantId);
  const productPromise = params.then(({ handle }) => getProductDetails(handle, locale));

  return (
    <ProductDetailPage
      productPromise={productPromise}
      locale={locale}
      variantIdPromise={variantIdPromise}
    />
  );
}
