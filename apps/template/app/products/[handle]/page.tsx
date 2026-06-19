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
import type { ProductDetails } from "@/lib/types";

import { buildProductMetadata, ProductPageContent } from "./product-page";

const PLACEHOLDER_HANDLE = "__placeholder__";

async function resolveVariantSelection({
  locale,
  product,
  searchParams,
}: {
  locale: string;
  product: ProductDetails;
  searchParams: PageProps<"/products/[handle]">["searchParams"];
}) {
  const query = await searchParams;
  const rawVariant = query.variant;
  const variant = typeof rawVariant === "string" && /^\d+$/.test(rawVariant) ? rawVariant : null;
  if (!variant) return undefined;

  const variantGid = `gid://shopify/ProductVariant/${variant}`;
  if (product.defaultVariantId === variantGid) return undefined;

  const knownVariant = product.variants.find(({ id }) => id === variantGid);
  const routeSelection = knownVariant
    ? { handle: knownVariant.productHandle, selectedOptions: knownVariant.selectedOptions }
    : await getProductVariantRouteSelection({ variantId: variant, locale });
  if (!routeSelection) return undefined;
  if (routeSelection.handle !== product.handle) {
    permanentRedirect(getProductVariantUrl(routeSelection.handle, variant, query));
  }

  const selectionData = await getProductSelection({
    handle: product.handle,
    selectedOptions: routeSelection.selectedOptions,
    locale,
  });

  return selectionData?.selectedVariant?.id === variantGid ? selectionData : undefined;
}

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
  const [{ handle }, locale] = await Promise.all([params, getLocale()]);
  if (handle === PLACEHOLDER_HANDLE) notFound();

  const product = await getProduct({ handle, locale });
  if (!product) notFound();

  const selectionPromise = resolveVariantSelection({ locale, product, searchParams }).then(
    (selectionData) => computeSelection(product, selectionData),
  );

  return (
    <ProductPageContent locale={locale} product={product} selectionPromise={selectionPromise} />
  );
}
