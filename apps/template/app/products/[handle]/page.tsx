import type { Metadata } from "next";

import { ProductDetailPage } from "@/components/product/pdp/product-detail-page";
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
  const productPromise = params.then(({ handle }) => getProductDetails(handle, locale));

  return <ProductDetailPage productPromise={productPromise} locale={locale} />;
}
