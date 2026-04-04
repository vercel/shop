import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { ProductDetailSkeleton } from "@/components/product/pdp/product-detail-skeleton";
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

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      {params.then(({ handle, variantId }) => (
        <ProductDetailPage
          productPromise={getProductDetails(handle, locale)}
          locale={locale}
          variantIdPromise={Promise.resolve(variantId)}
        />
      ))}
    </Suspense>
  );
}
