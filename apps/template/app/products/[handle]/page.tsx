import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { getLocale } from "@/lib/params";
import { computeSelection } from "@/lib/product";
import { getProductVariantUrl } from "@/lib/product-url";
import { getProductVariantRouteSelection } from "@/lib/shopify/operations/product-variant-route";
import {
  getCatalogProducts,
  getProduct,
  getProductSelection,
} from "@/lib/shopify/operations/products";
import { getNumericShopifyId } from "@/lib/shopify/utils";

import { buildProductMetadata, ProductPageContent } from "./product-page";

const PLACEHOLDER_HANDLE = "__placeholder__";

export const instant = false;

export async function generateStaticParams() {
  try {
    const { products } = await getCatalogProducts({ limit: 1 });
    const first = products[0];
    return [{ handle: first ? first.handle : PLACEHOLDER_HANDLE }];
  } catch {
    return [{ handle: PLACEHOLDER_HANDLE }];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);

  if (handle === PLACEHOLDER_HANDLE) return {};

  return buildProductMetadata(handle, locale, `/products/${handle}`);
}

export default async function ProductPage({
  params,
  searchParams,
}: PageProps<"/products/[handle]">) {
  const [{ handle }, locale, query] = await Promise.all([params, getLocale(), searchParams]);
  if (handle === PLACEHOLDER_HANDLE) notFound();

  const rawVariant = query.variant;
  const variant = typeof rawVariant === "string" && /^\d+$/.test(rawVariant) ? rawVariant : null;
  const [product, routeSelection] = await Promise.all([
    getProduct({ handle, locale }),
    variant ? getProductVariantRouteSelection({ variantId: variant, locale }) : undefined,
  ]);

  if (!product) notFound();
  if (!variant || !routeSelection) {
    return (
      <ProductPageContent locale={locale} product={product} selection={computeSelection(product)} />
    );
  }

  if (routeSelection.handle !== handle) {
    permanentRedirect(getProductVariantUrl(routeSelection.handle, variant, query));
  }

  const selectionData = await getProductSelection({
    handle,
    selectedOptions: routeSelection.selectedOptions,
    locale,
  });
  const isExactVariant =
    selectionData?.selectedVariant &&
    getNumericShopifyId(selectionData.selectedVariant.id) === variant;

  return (
    <ProductPageContent
      locale={locale}
      product={product}
      selection={computeSelection(product, isExactVariant ? selectionData : undefined)}
    />
  );
}
