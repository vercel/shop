import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
import { getLocale } from "@/lib/params";
import { getProduct } from "@/lib/shopify/operations/products";

import { buildProductMetadata } from "../../shared";

type Params = { handle: string; variantId: string };
type Props = { params: Promise<Params> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ handle, variantId }, locale] = await Promise.all([
    params,
    getLocale(),
  ]);

  return buildProductMetadata(
    handle,
    locale,
    `/products/${handle}?variantId=${variantId}`,
  );
}

export default async function ProductVariantPage({ params }: Props) {
  const locale = await getLocale();
  const handlePromise = params.then(({ handle }) => handle);

  const productPromise = handlePromise.then((handle) =>
    getProduct(handle, locale).catch(() => notFound()),
  );

  const variantIdPromise = params.then(({ variantId }) => variantId);

  return (
    <ProductDetailPage
      productPromise={productPromise}
      locale={locale}
      variantIdPromise={variantIdPromise}
    />
  );
}
