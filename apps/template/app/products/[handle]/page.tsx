import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
  const handlePromise = params.then(({ handle }) => handle);
  const productPromise = handlePromise.then((handle) => getProductDetails(handle, locale));

  return (
    <ProductContent
      productPromise={productPromise}
      locale={locale}
    />
  );
}

async function ProductContent({
  productPromise,
  locale,
}: {
  productPromise: Promise<Awaited<ReturnType<typeof getProductDetails>>>;
  locale: Awaited<ReturnType<typeof getLocale>>;
}) {
  const product = await productPromise;

  if (!product) {
    notFound();
  }

  return <ProductDetailPage product={product} locale={locale} />;
}
