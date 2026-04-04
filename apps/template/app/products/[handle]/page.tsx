import type { Metadata } from "next";
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

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const locale = await getLocale();

  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      {params.then(({ handle }) => (
        <ProductDetailPage
          productPromise={getProductDetails(handle, locale)}
          locale={locale}
        />
      ))}
    </Suspense>
  );
}
