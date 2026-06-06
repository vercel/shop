import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { ProductDetailSection } from "@/components/product-detail/product-detail-section";
import { RelatedProductsSection } from "@/components/product/related-products-section";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { getLocale } from "@/lib/params";
import { computeSelection, getSelectedOptionsFromSearchParams } from "@/lib/product";
import { getProductUrl } from "@/lib/product-url";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";
import {
  getCatalogProducts,
  getProduct,
  getProductSelection,
  getProductVariantRouteSelection,
} from "@/lib/shopify/operations/products";

const PLACEHOLDER_HANDLE = "__placeholder__";

async function buildProductMetadata(
  handle: string,
  locale: string,
  canonicalPath: string,
): Promise<Metadata> {
  const product = await getProduct({ handle, locale });
  if (!product) notFound();
  const images = product.featuredImage
    ? [
        {
          url: product.featuredImage.url,
          width: product.featuredImage.width,
          height: product.featuredImage.height,
          alt: product.featuredImage.altText,
        },
      ]
    : ["/og-default.png"];

  return {
    title: product.seo.title,
    description: product.seo.description,
    alternates: buildAlternates({
      pathname: canonicalPath,
    }),
    openGraph: buildOpenGraph({
      title: product.seo.title,
      description: product.seo.description,
      url: canonicalPath,
      type: "website",
      images,
    }),
    twitter: {
      card: "summary_large_image",
      title: product.seo.title,
      description: product.seo.description,
      images,
    },
  };
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
  const [{ handle }, sp, locale] = await Promise.all([params, searchParams, getLocale()]);
  if (handle === PLACEHOLDER_HANDLE) notFound();

  const rawVariantId = sp.variant;
  const variantId = Array.isArray(rawVariantId) ? rawVariantId[0] : rawVariantId;
  if (variantId) {
    const routeSelection = await getProductVariantRouteSelection({ variantId, locale });
    if (routeSelection) {
      permanentRedirect(getProductUrl(routeSelection.handle, routeSelection.selectedOptions, sp));
    }
  }

  const product = await getProduct({ handle, locale });
  if (!product) notFound();

  const selectedOptions = getSelectedOptionsFromSearchParams(sp);
  const selectionDataPromise =
    selectedOptions.length > 0
      ? getProductSelection({ handle, selectedOptions, locale })
      : Promise.resolve(undefined);
  const selectionPromise = selectionDataPromise.then((selectionData) =>
    computeSelection(product, selectionData),
  );

  return (
    <Page className="pt-0">
      <Container className="bg-background">
        <Sections>
          <ProductDetailSection
            product={product}
            selectionPromise={selectionPromise}
            locale={locale}
          />
          <RelatedProductsSection handle={handle} locale={locale} />
        </Sections>
      </Container>
    </Page>
  );
}
